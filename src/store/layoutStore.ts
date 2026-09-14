/**
 * 佈局領域 store（V12／W0907-A0）
 *
 * 平行於 `editorStore` 落地：持有 `devices`／`pipelines`，`connections` 為 getter  \
 *（每次呼叫 {@link resolveConnections}）。放置合法性回傳 {@link PlacementResult}，不 throw。
 *
 * 變更類 action 經 {@link useHistoryStore} 推入 Command，供 L2 undo／redo。
 *
 * @example
 * const layout = useLayoutStore()
 * layout.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')))
 * console.log(layout.connections)
 */

import { computed, readonly, ref } from 'vue';
import { defineStore } from 'pinia';
import type { Position } from '@/types/euclideanSpace';
import type { LayoutSnapshot, PlacementResult, PlacedDevice, Pipeline } from '@/types/layout';
import type { DeviceFootprint, PipelineFootprint } from '@/types/footprint';
import { HistoryRecordType } from '@/types/history';
import { getMachineById } from '@/data/machines';
import { resolveConnections } from '@/utils/layout/resolveConnections';
import { detectOverlaps } from '@/utils/layout/overlapDetection';
import { isAxisAlignedPath } from '@/utils/layout/pipelineGeometry';
import {
    deviceSizeFromMachine,
    toDeviceFootprint,
    toPipelineFootprint,
} from '@/utils/layout/toFootprint';
import { useHistoryStore } from '@/store/historyStore';

/**
 * 深拷貝快照，避免外部持有同一參考後改寫 store 內部
 */
function cloneSnapshot(snapshot: LayoutSnapshot): LayoutSnapshot {
    return {
        devices: snapshot.devices.map((d) => ({
            ...d,
            position: { ...d.position },
        })),
        pipelines: snapshot.pipelines.map((p) => ({
            ...p,
            waypoints: p.waypoints.map((w) => ({ ...w })),
        })),
    };
}

/**
 * 深拷貝單一設備
 */
function cloneDevice(device: PlacedDevice): PlacedDevice {
    return { ...device, position: { ...device.position } };
}

/**
 * 深拷貝單一管線
 */
function clonePipeline(pipeline: Pipeline): Pipeline {
    return {
        ...pipeline,
        waypoints: pipeline.waypoints.map((w) => ({ ...w })),
    };
}

/**
 * 組 footprint；缺機器定義者列入 invalidIds（不中斷整批）
 */
function collectDeviceFootprints(deviceList: PlacedDevice[]): {
    footprints: DeviceFootprint[];
    invalidIds: string[];
} {
    const footprints: DeviceFootprint[] = [];
    const invalidIds: string[] = [];
    for (const device of deviceList) {
        const machine = getMachineById(device.machineType);
        if (!machine) {
            invalidIds.push(device.id);
            continue;
        }
        footprints.push(toDeviceFootprint(device, deviceSizeFromMachine(machine)));
    }
    return { footprints, invalidIds };
}

/**
 * 管線 waypoints 是否可展開佔格
 *
 * 至少兩點、座標皆有限，且每段沿單一軸——{@link getPipelineOccupiedCells} 的前置條件：  \
 * 斜向的一段會被拆成先 x 後 y，等於替呼叫端發明一個沒人指定過的轉角。
 */
function pipelineWaypointsValid(pipeline: Pipeline): boolean {
    if (pipeline.waypoints.length < 2) return false;
    const finite = pipeline.waypoints.every(
        (w) => Number.isFinite(w.x) && Number.isFinite(w.y) && Number.isFinite(w.z),
    );
    if (!finite) return false;
    return isAxisAlignedPath(pipeline.waypoints);
}

/**
 * 全量評估目前佈局（供 loadSnapshot 回報既有問題）
 */
function assessLayout(deviceList: PlacedDevice[], pipelineList: Pipeline[]): PlacementResult {
    const { footprints, invalidIds } = collectDeviceFootprints(deviceList);
    if (invalidIds.length > 0) {
        return { ok: false, reason: 'invalid', invalidIds };
    }
    const badPipes = pipelineList.filter((p) => !pipelineWaypointsValid(p)).map((p) => p.id);
    if (badPipes.length > 0) {
        return { ok: false, reason: 'invalid', invalidIds: badPipes };
    }
    const pipelineFootprints: PipelineFootprint[] = pipelineList.map((p) => toPipelineFootprint(p));
    const conflicts = detectOverlaps(footprints, pipelineFootprints);
    if (conflicts.length > 0) {
        return { ok: false, reason: 'overlap', conflicts };
    }
    return { ok: true };
}

/**
 * 只檢查「本次操作涉及的 id」是否引入 invalid／overlap，  \
 * 不把快照裡既有的無關錯誤算到新操作頭上。
 *
 * @param involvedIds 本次新增／移動的設備或管線 id
 */
function assessInvolving(
    deviceList: PlacedDevice[],
    pipelineList: Pipeline[],
    involvedIds: ReadonlySet<string>,
): PlacementResult {
    const { footprints, invalidIds } = collectDeviceFootprints(deviceList);
    const involvedInvalid = invalidIds.filter((id) => involvedIds.has(id));
    if (involvedInvalid.length > 0) {
        return { ok: false, reason: 'invalid', invalidIds: involvedInvalid };
    }

    for (const pipe of pipelineList) {
        if (!involvedIds.has(pipe.id)) continue;
        if (!pipelineWaypointsValid(pipe)) {
            return { ok: false, reason: 'invalid', invalidIds: [pipe.id] };
        }
    }

    const pipelineFootprints: PipelineFootprint[] = pipelineList
        .filter((p) => pipelineWaypointsValid(p))
        .map((p) => toPipelineFootprint(p));
    const conflicts = detectOverlaps(footprints, pipelineFootprints).filter(
        ([a, b]) => involvedIds.has(a) || involvedIds.has(b),
    );
    if (conflicts.length > 0) {
        return { ok: false, reason: 'overlap', conflicts };
    }
    return { ok: true };
}

export const useLayoutStore = defineStore('layout', () => {
    /** 已放置設備（藍圖目標儲存形之一） */
    const devices = ref<PlacedDevice[]>([]);

    /** 管線（不含 Connection） */
    const pipelines = ref<Pipeline[]>([]);

    /**
     * 衍生連線；每次由 devices／pipelines 重算，**不是**可寫 state
     */
    const connections = computed(() => resolveConnections(devices.value, pipelines.value));

    /**
     * 目前佈局的全量問題（供 L2 對真正重疊／無效 id 畫紅框）
     */
    const layoutIssues = computed(() => assessLayout(devices.value, pipelines.value));

    /**
     * 覆寫目前佈局（深拷貝）；回傳全量評估，既有 overlap／invalid 帶 conflicts／invalidIds。  \
     * 仍會載入快照（讓 L2 能對真正出錯的 id 畫紅框）；進歷史以便 undo。
     *
     * @param snapshot 純資料快照；connections 不在內
     */
    function loadSnapshot(snapshot: LayoutSnapshot): PlacementResult {
        const historyStore = useHistoryStore();
        const before = cloneSnapshot({
            devices: devices.value,
            pipelines: pipelines.value,
        });
        const after = cloneSnapshot(snapshot);
        const result = assessLayout(after.devices, after.pipelines);

        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.Macro,
            label: '載入佈局快照',
            execute() {
                devices.value = after.devices;
                pipelines.value = after.pipelines;
            },
            undo() {
                devices.value = before.devices;
                pipelines.value = before.pipelines;
            },
        });

        return result;
    }

    /**
     * 匯出目前 devices／pipelines（深拷貝；不含 connections）
     */
    function toSnapshot(): LayoutSnapshot {
        return cloneSnapshot({
            devices: devices.value,
            pipelines: pipelines.value,
        });
    }

    /**
     * 新增設備；僅當「本設備」引入 overlap／invalid 時失敗並帶 conflicts
     *
     * @param device 待放置設備
     */
    function addDevice(device: PlacedDevice): PlacementResult {
        if (!device.id || devices.value.some((d) => d.id === device.id)) {
            return { ok: false, reason: 'invalid', invalidIds: device.id ? [device.id] : [] };
        }
        if (!Number.isFinite(device.position.x) || !Number.isFinite(device.position.y)) {
            return { ok: false, reason: 'invalid', invalidIds: [device.id] };
        }
        if (!getMachineById(device.machineType)) {
            return { ok: false, reason: 'invalid', invalidIds: [device.id] };
        }

        const added = cloneDevice(device);
        const before = devices.value.map(cloneDevice);
        const after = [...before, added];
        const result = assessInvolving(after, pipelines.value, new Set([added.id]));
        if (!result.ok) {
            return result;
        }

        const historyStore = useHistoryStore();
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachinePlacement,
            label: `佈局放置 ${added.label ?? added.id}`,
            execute() {
                devices.value = after.map(cloneDevice);
            },
            undo() {
                devices.value = before.map(cloneDevice);
            },
        });
        return { ok: true };
    }

    /**
     * 刪除設備；管線保留（可變成斷線）。找不到 id 回 invalid。
     *
     * @param id 設備 uid
     */
    function removeDevice(id: string): PlacementResult {
        if (!devices.value.some((d) => d.id === id)) {
            return { ok: false, reason: 'invalid', invalidIds: [id] };
        }

        const before = devices.value.map(cloneDevice);
        const after = before.filter((d) => d.id !== id);
        const historyStore = useHistoryStore();
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachineDeletion,
            label: `佈局刪除設備 ${id}`,
            execute() {
                devices.value = after.map(cloneDevice);
            },
            undo() {
                devices.value = before.map(cloneDevice);
            },
        });
        return { ok: true };
    }

    /**
     * 移動設備；僅當「本設備」引入 overlap 時失敗
     *
     * @param id 設備 uid
     * @param position 新佔格左上角
     */
    function moveDevice(id: string, position: Position): PlacementResult {
        if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
            return { ok: false, reason: 'invalid', invalidIds: [id] };
        }

        const index = devices.value.findIndex((d) => d.id === id);
        if (index < 0) {
            return { ok: false, reason: 'invalid', invalidIds: [id] };
        }

        const before = devices.value.map(cloneDevice);
        const after = before.map((d, i) => (i === index ? { ...d, position: { ...position } } : d));
        const result = assessInvolving(after, pipelines.value, new Set([id]));
        if (!result.ok) {
            return result;
        }

        const historyStore = useHistoryStore();
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachineMovement,
            label: `佈局移動 ${id}`,
            execute() {
                devices.value = after.map(cloneDevice);
            },
            undo() {
                devices.value = before.map(cloneDevice);
            },
        });
        return { ok: true };
    }

    /**
     * 新增管線；waypoints 須 ≥2 點、座標有限且逐段軸對齊；  \
     * 僅當「本管線」引入 overlap 時失敗
     *
     * @param pipeline 待加入管線
     */
    function addPipeline(pipeline: Pipeline): PlacementResult {
        if (!pipeline.id || pipelines.value.some((p) => p.id === pipeline.id)) {
            return {
                ok: false,
                reason: 'invalid',
                invalidIds: pipeline.id ? [pipeline.id] : [],
            };
        }
        if (!pipelineWaypointsValid(pipeline)) {
            return { ok: false, reason: 'invalid', invalidIds: [pipeline.id] };
        }

        const added = clonePipeline(pipeline);
        const before = pipelines.value.map(clonePipeline);
        const after = [...before, added];
        const result = assessInvolving(devices.value, after, new Set([added.id]));
        if (!result.ok) {
            return result;
        }

        const historyStore = useHistoryStore();
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachineConnection,
            label: `佈局新增管線 ${added.id}`,
            execute() {
                pipelines.value = after.map(clonePipeline);
            },
            undo() {
                pipelines.value = before.map(clonePipeline);
            },
        });
        return { ok: true };
    }

    /**
     * 刪除管線。找不到 id 回 invalid。
     *
     * @param id 管線 uid
     */
    function removePipeline(id: string): PlacementResult {
        if (!pipelines.value.some((p) => p.id === id)) {
            return { ok: false, reason: 'invalid', invalidIds: [id] };
        }

        const before = pipelines.value.map(clonePipeline);
        const after = before.filter((p) => p.id !== id);
        const historyStore = useHistoryStore();
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachineDisconnection,
            label: `佈局刪除管線 ${id}`,
            execute() {
                pipelines.value = after.map(clonePipeline);
            },
            undo() {
                pipelines.value = before.map(clonePipeline);
            },
        });
        return { ok: true };
    }

    return {
        /** 已放置設備（唯讀面） */
        devices: readonly(devices),
        /** 管線（唯讀面） */
        pipelines: readonly(pipelines),
        /** 衍生連線（getter；唯讀面） */
        connections: readonly(connections),
        /** 目前佈局全量問題（L2 對真正出錯的 id 畫紅框） */
        layoutIssues,
        /**
         * 覆寫目前佈局（深拷貝）；回傳全量評估，既有 overlap／invalid 帶 conflicts／invalidIds。  \
         * 仍會載入快照（讓 L2 能對真正出錯的 id 畫紅框）；進歷史以便 undo。
         *
         * @param snapshot 純資料快照；connections 不在內
         */
        loadSnapshot,
        /**
         * 匯出目前 devices／pipelines（深拷貝；不含 connections）
         */
        toSnapshot,
        /**
         * 新增設備；僅當「本設備」引入 overlap／invalid 時失敗並帶 conflicts
         *
         * @param device 待放置設備
         */
        addDevice,
        /**
         * 刪除設備；管線保留（可變成斷線）。找不到 id 回 invalid。
         *
         * @param id 設備 uid
         */
        removeDevice,
        /**
         * 移動設備；僅當「本設備」引入 overlap 時失敗
         *
         * @param id 設備 uid
         * @param position 新佔格左上角
         */
        moveDevice,
        /**
         * 新增管線；waypoints 須 ≥2 點、座標有限且逐段軸對齊；  \
         * 僅當「本管線」引入 overlap 時失敗
         *
         * @param pipeline 待加入管線
         */
        addPipeline,
        /**
         * 刪除管線。找不到 id 回 invalid。
         *
         * @param id 管線 uid
         */
        removePipeline,
    };
});
