/**
 * 落子／移動前預檢（V14／W0921-A0）
 *
 * 把原先住在 `layoutStore` 模組私有的 {@link collectLayoutIssues}／{@link assessInvolving}
 * 提出共用，供 L2 在不寫入、不生 uid、不進 history 的前提下呼叫。
 *
 * **不是另寫一份判定**——store 的 `addDevice`／`moveDevice` 也走同一路徑。
 *
 * `LayoutView` 接受 Pinia 唯讀面（`DeepReadonly`），以便 `LayoutView.vue` 直接傳入
 * `layoutStore.devices`／`pipelines`。
 */

import type { DeepReadonly } from 'vue';
import type { Position } from '@/types/euclideanSpace';
import type { Rotation } from '@/types/editor';
import type { LayoutIssues, PlacementResult, PlacedDevice, Pipeline } from '@/types/layout';
import type { DeviceFootprint, PipelineFootprint } from '@/types/footprint';
import { getMachineById } from '@/data/machines';
import { detectOverlaps } from '@/utils/layout/overlapDetection';
import { isAxisAlignedPath } from '@/utils/layout/pipelineGeometry';
import {
    deviceSizeFromMachine,
    toDeviceFootprint,
    toPipelineFootprint,
} from '@/utils/layout/toFootprint';

/** draft 在 {@link PlacementResult}.conflicts 中的代稱；測試釘死此字面值 */
export const DRAFT_ID = '__draft__';

/**
 * 尚未落子的設備；沒有 id（型別本身擋「拿預檢當落子用」）
 */
export interface DeviceDraft {
    machineType: string;
    /** 佔格左上角；z 為佔用層起點 */
    position: Position;
    rotation: Rotation;
    /** 缺省時以該機 modes[0].id 解釋 */
    machineMode?: string;
}

/**
 * 目前佈局；唯讀（相容 Pinia `readonly` 面）
 */
export interface LayoutView {
    devices: readonly DeepReadonly<PlacedDevice>[];
    pipelines: readonly DeepReadonly<Pipeline>[];
}

/**
 * 三軸皆為有限數
 *
 * z 一起檢查：`getDeviceOccupiedCells` 會沿 z 展開，非有限的 z 會讓佔格 key
 * 全部塌成同一格，於是同一台設備被回報成「自己跟自己重疊」。
 */
export function positionFinite(position: DeepReadonly<Position>): boolean {
    return (
        Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.z)
    );
}

/**
 * 管線 waypoints 是否可展開佔格
 *
 * 至少兩點、座標皆有限，且每段沿單一軸——{@link getPipelineOccupiedCells} 的前置條件：
 * 斜向的一段會被拆成先 x 後 y，等於替呼叫端發明一個沒人指定過的轉角。
 */
export function pipelineWaypointsValid(pipeline: DeepReadonly<Pipeline>): boolean {
    if (pipeline.waypoints.length < 2) return false;
    if (!pipeline.waypoints.every(positionFinite)) return false;
    return isAxisAlignedPath(pipeline.waypoints.map((waypoint) => ({ ...waypoint })));
}

/**
 * 全量檢查佈局，一次回報**所有**問題（invalid 與 overlap 並存時兩者都回）
 *
 * 設備與管線共用一個 id 命名空間：`detectOverlaps` 的配對混用兩者，
 * 同名就無法判斷紅框該畫在誰身上，故重複 id 一律列 invalid 並排除於佔格之外。
 *
 * 設備數超過約 200 時，呼叫端應自行 debounce 或改增量判定；在此之前不做最佳化。
 */
export function collectLayoutIssues(
    deviceList: readonly DeepReadonly<PlacedDevice>[],
    pipelineList: readonly DeepReadonly<Pipeline>[],
): LayoutIssues {
    const idCounts = new Map<string, number>();
    for (const item of [...deviceList, ...pipelineList]) {
        idCounts.set(item.id, (idCounts.get(item.id) ?? 0) + 1);
    }

    /** id 空或撞名則無法歸屬紅框，直接視為不可用 */
    const idUsable = (id: string): boolean => Boolean(id) && (idCounts.get(id) ?? 0) === 1;

    const invalidIds = new Set<string>();
    const deviceFootprints: DeviceFootprint[] = [];
    for (const device of deviceList) {
        const machine = getMachineById(device.machineType);
        if (!idUsable(device.id) || !positionFinite(device.position) || !machine) {
            invalidIds.add(device.id);
            continue;
        }
        deviceFootprints.push(
            toDeviceFootprint(
                { ...device, position: { ...device.position } },
                deviceSizeFromMachine(machine),
            ),
        );
    }

    const pipelineFootprints: PipelineFootprint[] = [];
    for (const pipeline of pipelineList) {
        if (!idUsable(pipeline.id) || !pipelineWaypointsValid(pipeline)) {
            invalidIds.add(pipeline.id);
            continue;
        }
        pipelineFootprints.push(
            toPipelineFootprint({
                ...pipeline,
                waypoints: pipeline.waypoints.map((waypoint) => ({ ...waypoint })),
            }),
        );
    }

    const conflicts = detectOverlaps(deviceFootprints, pipelineFootprints);

    return {
        ok: invalidIds.size === 0 && conflicts.length === 0,
        invalidIds: [...invalidIds],
        conflicts,
    };
}

/**
 * 只把「本次操作引入」的 id 是因為 invalid／overlap
 * 才回失敗結果，避免把佈局裡既有問題誤報給呼叫端。
 *
 * @param involvedIds 本次操作涉及的設備／管線 id
 */
export function assessInvolving(
    deviceList: readonly DeepReadonly<PlacedDevice>[],
    pipelineList: readonly DeepReadonly<Pipeline>[],
    involvedIds: ReadonlySet<string>,
): PlacementResult {
    const issues = collectLayoutIssues(deviceList, pipelineList);

    const involvedInvalid = issues.invalidIds.filter((id) => involvedIds.has(id));
    if (involvedInvalid.length > 0) {
        return { ok: false, reason: 'invalid', invalidIds: involvedInvalid };
    }

    const conflicts = issues.conflicts.filter(([a, b]) => involvedIds.has(a) || involvedIds.has(b));
    if (conflicts.length > 0) {
        return { ok: false, reason: 'overlap', conflicts };
    }
    return { ok: true };
}

/**
 * 落子前預檢——**不寫入 store、不生 uid、不進 history**
 *
 * 失敗時 `conflicts` 裡以 {@link DRAFT_ID} 代稱「尚未落子的那一台」。
 *
 * 設備數超過約 200 時，呼叫端應自行 debounce 或改增量判定；在此之前不做最佳化。
 */
export function canPlaceDevice(draft: DeviceDraft, layout: LayoutView): PlacementResult {
    if (!positionFinite(draft.position)) {
        return { ok: false, reason: 'invalid', invalidIds: [DRAFT_ID] };
    }
    if (!getMachineById(draft.machineType)) {
        return { ok: false, reason: 'invalid', invalidIds: [DRAFT_ID] };
    }
    if (
        layout.devices.some((d) => d.id === DRAFT_ID) ||
        layout.pipelines.some((p) => p.id === DRAFT_ID)
    ) {
        return { ok: false, reason: 'invalid', invalidIds: [DRAFT_ID] };
    }

    const draftDevice: PlacedDevice = {
        id: DRAFT_ID,
        machineType: draft.machineType,
        position: { ...draft.position },
        rotation: draft.rotation,
        ...(draft.machineMode !== undefined ? { machineMode: draft.machineMode } : {}),
    };

    return assessInvolving(
        [...layout.devices, draftDevice],
        [...layout.pipelines],
        new Set([DRAFT_ID]),
    );
}

/**
 * 移動前預檢；與落子同一套佔格判定
 *
 * @param id 目標設備 uid；若不在場上則回 invalid
 *
 * 設備數超過約 200 時，呼叫端應自行 debounce 或改增量判定；在此之前不做最佳化。
 */
export function canMoveDevice(id: string, position: Position, layout: LayoutView): PlacementResult {
    if (!positionFinite(position)) {
        return { ok: false, reason: 'invalid', invalidIds: [id] };
    }
    if (layout.devices.filter((d) => d.id === id).length !== 1) {
        return { ok: false, reason: 'invalid', invalidIds: [id] };
    }

    const devices = layout.devices.map((d) =>
        d.id === id ? { ...d, position: { ...position } } : d,
    );
    return assessInvolving([...devices], [...layout.pipelines], new Set([id]));
}
