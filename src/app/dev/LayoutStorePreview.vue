<script setup lang="ts">
/**
 * V12-D1 — 佈局 store 互動演示（開發進度存證頁）
 *
 * 入口是 Vite 獨立 HTML，不掛 `src/router`／`DevLayout.vue`：
 * `pnpm dev` → `http://localhost:5173/dev/layout-store-preview.html`  \
 *（見 `src/app/dev/standalone/layoutStorePreviewMain.ts`）
 *
 * 資料：toolbarMachines 真實機器列＋layoutStore 讀寫。  \
 * 操作：預設點放置／點格放置／移動／刪除／兩機自動拉 belt／兩埠自動拉／手動拉線。  \
 * **不** import editorStore；不改 ToolbarPanel／GridCanvas。
 */
import { computed, ref } from 'vue';
import type { MachineCategory } from '@/types/machine';
import type { LayoutIssues, PlacementResult, PlacedDevice, PortDirection } from '@/types/layout';
import { getMachineById } from '@/data/machines';
import {
    getMockLayoutScenario,
    MOCK_LAYOUT_SCENARIOS,
    toLayoutSnapshot,
    type MockLayoutScenarioId,
} from '@/data/mockLayout';
import {
    DEFAULT_TOOLBAR_MACHINE_TAG,
    listToolbarMachines,
    TOOLBAR_MACHINE_TAGS,
    type ToolbarMachineRow,
} from '@/editor/toolbar/toolbarMachines';
import { useLayoutStore } from '@/store/layoutStore';
import { useHistoryStore } from '@/store/historyStore';
import { getDeviceOccupiedCells } from '@/utils/layout/deviceOccupancy';
import { deviceSizeFromMachine, toDeviceFootprint } from '@/utils/layout/toFootprint';
import {
    buildBlockedXy,
    findRoutableBeltBetweenAnchors,
    findRoutableBeltWaypoints,
    listPortAnchors,
} from '@/app/dev/layoutStorePreviewUtils';

const CELL = 28;
const GRID_W = 14;
const GRID_H = 10;

/** 預設落點（按鈕「放到預設點」） */
const DEFAULT_PLACE: { x: number; y: number; z: number } = { x: 2, y: 2, z: 0 };

/** belt 互動模式 */
type BeltMode = 'device' | 'port' | 'manual';

interface PortPick {
    deviceId: string;
    kind: PortDirection;
    x: number;
    y: number;
}

const layoutStore = useLayoutStore();
const historyStore = useHistoryStore();

const machineTag = ref<MachineCategory>(DEFAULT_TOOLBAR_MACHINE_TAG);
const selectedMachineId = ref<string>(
    listToolbarMachines(DEFAULT_TOOLBAR_MACHINE_TAG)[0]?.id ?? 'crusher',
);
const placeCursor = ref<{ x: number; y: number; z: number }>({ ...DEFAULT_PLACE });
const selectedDeviceId = ref<string | null>(null);
const beltTargetId = ref<string | null>(null);
const beltMode = ref<BeltMode>('device');
const portFrom = ref<PortPick | null>(null);
const portTo = ref<PortPick | null>(null);
const manualWaypoints = ref<Array<{ x: number; y: number; z: number }>>([]);
const lastResult = ref<PlacementResult | null>(null);
/** 頁面自身的失敗訊息（例如繞不出路徑）；與 store 判定分開 */
const uiError = ref<string | null>(null);
const statusMsg = ref('選機器 → 放到預設點或點空格；點兩台設備後可拉 belt');

let uidSeq = 0;
function nextUid(prefix: string): string {
    uidSeq += 1;
    return `${prefix}-${Date.now().toString(36)}-${uidSeq}`;
}

const machineRows = computed(() => listToolbarMachines(machineTag.value));

const selectedRow = computed(
    () => machineRows.value.find((r) => r.id === selectedMachineId.value) ?? null,
);

/** 真正出錯的 id（來自 layoutIssues；invalid 與 overlap 並存時兩者都畫） */
const issueIds = computed(() => {
    const ids = new Set<string>();
    const issues = layoutStore.layoutIssues;
    for (const id of issues.invalidIds) ids.add(id);
    for (const [a, b] of issues.conflicts) {
        ids.add(a);
        ids.add(b);
    }
    return ids;
});

/** 設備佔格（xy） */
const deviceCells = computed(() => {
    const result: Array<{
        key: string;
        deviceId: string;
        label: string;
        x: number;
        y: number;
    }> = [];

    for (const device of layoutStore.devices) {
        const machine = getMachineById(device.machineType);
        if (!machine) continue;
        const size = deviceSizeFromMachine(machine);
        const cells = getDeviceOccupiedCells(toDeviceFootprint(device, size));
        const seen = new Set<string>();
        for (const cell of cells) {
            const xy = `${cell.x},${cell.y}`;
            if (seen.has(xy)) continue;
            seen.add(xy);
            result.push({
                key: `${device.id}-${xy}`,
                deviceId: device.id,
                label: device.label ?? machine.name,
                x: cell.x,
                y: cell.y,
            });
        }
    }
    return result;
});

const cellOwner = computed(() => {
    const map = new Map<string, string>();
    for (const cell of deviceCells.value) {
        map.set(`${cell.x},${cell.y}`, cell.deviceId);
    }
    return map;
});

/** 已接上 belt 的錨點格（路徑端點） */
const linkedAnchorKeys = computed(() => {
    const keys = new Set<string>();
    for (const pipe of layoutStore.pipelines) {
        if (pipe.waypoints.length === 0) continue;
        const a = pipe.waypoints[0];
        const b = pipe.waypoints[pipe.waypoints.length - 1];
        keys.add(`${a.x},${a.y}`);
        keys.add(`${b.x},${b.y}`);
    }
    return keys;
});

/**
 * belt 埠外側錨點標記
 *
 * - 綠圓＝輸出；橙方＝輸入
 * - 已連線端點加大＋白描邊高亮
 * - 選為 belt 起點／終點的設備埠再加粗外圈；埠模式另標 portFrom／portTo
 */
const portMarkers = computed(() => {
    const markers: Array<{
        key: string;
        x: number;
        y: number;
        kind: 'input' | 'output';
        deviceId: string;
        linked: boolean;
        emphasis: boolean;
        picked: boolean;
    }> = [];

    for (const device of layoutStore.devices) {
        const emphasizeOut = device.id === selectedDeviceId.value;
        const emphasizeIn = device.id === beltTargetId.value;

        for (const a of listPortAnchors(device, 'output')) {
            const xy = `${a.x},${a.y}`;
            const picked =
                (portFrom.value?.x === a.x &&
                    portFrom.value?.y === a.y &&
                    portFrom.value.deviceId === device.id) ||
                (portTo.value?.x === a.x &&
                    portTo.value?.y === a.y &&
                    portTo.value.deviceId === device.id);
            markers.push({
                key: `out-${device.id}-${xy}`,
                x: a.x,
                y: a.y,
                kind: 'output',
                deviceId: device.id,
                linked: linkedAnchorKeys.value.has(xy),
                emphasis: emphasizeOut,
                picked,
            });
        }
        for (const a of listPortAnchors(device, 'input')) {
            const xy = `${a.x},${a.y}`;
            const picked =
                (portFrom.value?.x === a.x &&
                    portFrom.value?.y === a.y &&
                    portFrom.value.deviceId === device.id) ||
                (portTo.value?.x === a.x &&
                    portTo.value?.y === a.y &&
                    portTo.value.deviceId === device.id);
            markers.push({
                key: `in-${device.id}-${xy}`,
                x: a.x,
                y: a.y,
                kind: 'input',
                deviceId: device.id,
                linked: linkedAnchorKeys.value.has(xy),
                emphasis: emphasizeIn,
                picked,
            });
        }
    }
    return markers;
});

function connectionStatus(conn: {
    from: { portType: string } | null;
    to: { portType: string } | null;
}): 'ok' | 'broken' | 'direction' {
    if (!conn.from || !conn.to) return 'broken';
    if (conn.from.portType === 'output' && conn.to.portType === 'input') return 'ok';
    return 'direction';
}

function connectionStatusLabel(status: 'ok' | 'broken' | 'direction'): string {
    if (status === 'ok') return '已連接';
    if (status === 'direction') return '方向不符';
    return '斷線';
}

function pipelinePath(waypoints: readonly { readonly x: number; readonly y: number }[]): string {
    return waypoints
        .map((p, i) => {
            const cx = (p.x + 0.5) * CELL;
            const cy = (p.y + 0.5) * CELL;
            return `${i === 0 ? 'M' : 'L'}${cx} ${cy}`;
        })
        .join(' ');
}

function portRefLabel(
    ref: { deviceId: string; portType: string; portIndex: number } | null,
): string {
    if (!ref) return 'null';
    return `${ref.deviceId}.${ref.portType}[${ref.portIndex}]`;
}

/** 頁面自身的失敗（找不到路徑等）；不是 store 的判定，不混進 lastResult */
function failLocally(msg: string): void {
    uiError.value = msg;
    statusMsg.value = `失敗（頁面）：${msg}`;
}

/** 快照載入結果：`invalidIds` 與 `conflicts` 可同時非空，兩者都要講 */
function applyIssues(issues: LayoutIssues, okMsg: string): void {
    lastResult.value = null;
    if (issues.ok) {
        uiError.value = null;
        statusMsg.value = okMsg;
        return;
    }
    const parts: string[] = [];
    if (issues.invalidIds.length > 0) {
        parts.push(`invalid：${issues.invalidIds.join(', ')}`);
    }
    if (issues.conflicts.length > 0) {
        parts.push(`overlap：${issues.conflicts.map(([a, b]) => `${a}↔${b}`).join(', ')}`);
    }
    uiError.value = parts.join('｜');
    statusMsg.value = `${okMsg}；快照本身有問題 → ${parts.join('｜')}`;
}

function applyResult(result: PlacementResult, okMsg: string): void {
    lastResult.value = result;
    uiError.value = null;
    if (result.ok) {
        statusMsg.value = okMsg;
        return;
    }
    if (result.reason === 'overlap') {
        statusMsg.value = `失敗：overlap（${result.conflicts.map(([a, b]) => `${a}↔${b}`).join(', ')}）`;
        return;
    }
    const ids = result.invalidIds?.join(', ') ?? '';
    statusMsg.value = ids ? `失敗：invalid（${ids}）` : '失敗：invalid';
}

function buildDevice(row: ToolbarMachineRow, x: number, y: number): PlacedDevice {
    return {
        id: nextUid(row.id),
        machineType: row.id,
        position: { x, y, z: 0 },
        rotation: 0,
        label: row.name,
    };
}

function selectMachine(row: ToolbarMachineRow): void {
    selectedMachineId.value = row.id;
    statusMsg.value = `已選機器：${row.name}（${row.sizeText}）`;
}

/** 清掉選取與草稿（切模式、載入快照時用） */
function resetInteractionState(): void {
    selectedDeviceId.value = null;
    beltTargetId.value = null;
    portFrom.value = null;
    portTo.value = null;
    manualWaypoints.value = [];
}

function setBeltMode(mode: BeltMode): void {
    beltMode.value = mode;
    portFrom.value = null;
    portTo.value = null;
    manualWaypoints.value = [];
    uiError.value = null;
    if (mode === 'device') {
        statusMsg.value = '設備模式：點兩台設備後按「自動拉 belt」';
    } else if (mode === 'port') {
        statusMsg.value = '埠模式：先點輸出埠（綠），再點輸入埠（橙）自動拉線';
    } else {
        statusMsg.value = '手動模式：依序點格子加 waypoints，再按「完成手動拉線」';
    }
}

function placeAt(x: number, y: number): void {
    const row = selectedRow.value;
    if (!row) {
        statusMsg.value = '請先選一台真實機器';
        return;
    }
    const device = buildDevice(row, x, y);
    const result = layoutStore.addDevice(device);
    applyResult(result, `已放置 ${row.name} @ (${x},${y})`);
    if (result.ok) {
        selectedDeviceId.value = device.id;
        placeCursor.value = { x, y, z: 0 };
    }
}

/** 預設操作：放到預設／目前游標點 */
function placeAtCursor(): void {
    placeAt(placeCursor.value.x, placeCursor.value.y);
}

function resetCursor(): void {
    placeCursor.value = { ...DEFAULT_PLACE };
    statusMsg.value = `預設點重設為 (${DEFAULT_PLACE.x},${DEFAULT_PLACE.y})`;
}

function nudgeCursor(dx: number, dy: number): void {
    placeCursor.value = {
        x: Math.max(0, Math.min(GRID_W - 1, placeCursor.value.x + dx)),
        y: Math.max(0, Math.min(GRID_H - 1, placeCursor.value.y + dy)),
        z: 0,
    };
}

function moveSelected(dx: number, dy: number): void {
    const id = selectedDeviceId.value;
    if (!id) {
        statusMsg.value = '請先點選一台已放置設備';
        return;
    }
    const device = layoutStore.devices.find((d) => d.id === id);
    if (!device) {
        syncSelectionWithStore();
        failLocally('選取的設備已不存在（可能被刪除或 undo），請重新點選');
        return;
    }
    const next = {
        x: device.position.x + dx,
        y: device.position.y + dy,
        z: device.position.z,
    };
    const result = layoutStore.moveDevice(id, next);
    applyResult(result, `已移動 ${id} → (${next.x},${next.y})`);
}

function removeSelected(): void {
    const id = selectedDeviceId.value;
    if (!id) {
        statusMsg.value = '請先點選一台已放置設備';
        return;
    }
    const result = layoutStore.removeDevice(id);
    applyResult(result, `已刪除 ${id}（管線保留，可能斷線）`);
    syncSelectionWithStore();
}

function clearAll(): void {
    const issues = layoutStore.loadSnapshot({ devices: [], pipelines: [] });
    resetInteractionState();
    applyIssues(issues, '已清空；可從工具列選機放置');
}

function loadFixture(id: MockLayoutScenarioId): void {
    const issues = layoutStore.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario(id)));
    resetInteractionState();
    applyIssues(issues, `已載入 fixture：${id}`);
}

function onDeviceClick(deviceId: string): void {
    if (beltMode.value !== 'device') return;

    if (!selectedDeviceId.value) {
        selectedDeviceId.value = deviceId;
        beltTargetId.value = null;
        statusMsg.value = `選取起點：${deviceId}（再點另一台設為 belt 終點）`;
        return;
    }
    if (selectedDeviceId.value === deviceId) {
        selectedDeviceId.value = null;
        beltTargetId.value = null;
        statusMsg.value = '已取消選取';
        return;
    }
    beltTargetId.value = deviceId;
    statusMsg.value = `起點 ${selectedDeviceId.value} → 終點 ${deviceId}；可按「自動拉 belt」`;
}

function tryAutoBeltBetweenPorts(from: PortPick, to: PortPick): void {
    const blocked = buildBlockedXy(layoutStore.devices, layoutStore.pipelines);
    const waypoints = findRoutableBeltBetweenAnchors(
        { x: from.x, y: from.y },
        { x: to.x, y: to.y },
        blocked,
    );
    if (!waypoints) {
        failLocally('兩埠之間找不到不穿過設備／既有管線的路徑');
        return;
    }
    const result = layoutStore.addPipeline({
        id: nextUid('belt'),
        media: 'belt',
        waypoints,
    });
    applyResult(
        result,
        `已拉 belt（埠）：${from.deviceId}@(${from.x},${from.y}) → ${to.deviceId}@(${to.x},${to.y})`,
    );
    if (result.ok) {
        portFrom.value = null;
        portTo.value = null;
    }
}

function samePort(a: PortPick, b: PortPick): boolean {
    return a.deviceId === b.deviceId && a.kind === b.kind && a.x === b.x && a.y === b.y;
}

/**
 * 埠模式：湊成一對就拉線。
 *
 * `connectionStatus` 只認 output→input 為「已連接」；  \
 * 這裡固定把 output 當起點，先點 input 只是順序不同而非反向。
 */
function onPortClick(port: PortPick, evt: MouseEvent): void {
    evt.stopPropagation();
    if (beltMode.value !== 'port') {
        statusMsg.value = '請先切到「點兩埠拉線」模式';
        return;
    }

    const first = portFrom.value;
    if (!first) {
        portFrom.value = port;
        portTo.value = null;
        statusMsg.value = `埠起點：${port.kind === 'output' ? '輸出' : '輸入'} ${port.deviceId}@(${port.x},${port.y})；再點另一端`;
        return;
    }

    if (samePort(first, port)) {
        portFrom.value = null;
        portTo.value = null;
        statusMsg.value = '已取消埠起點';
        return;
    }

    if (first.kind === port.kind) {
        portFrom.value = port;
        portTo.value = null;
        failLocally(
            `belt 必須由輸出接到輸入；兩端都是${port.kind === 'output' ? '輸出' : '輸入'}埠，已改以此埠為起點`,
        );
        return;
    }

    if (first.deviceId === port.deviceId) {
        failLocally('同一台設備的輸出接自己的輸入沒有意義，請換一台');
        return;
    }

    const out = first.kind === 'output' ? first : port;
    const inp = first.kind === 'output' ? port : first;
    portFrom.value = out;
    portTo.value = inp;
    tryAutoBeltBetweenPorts(out, inp);
}

/**
 * 手動模式加一點。
 *
 * 佔格展開要求逐段軸對齊（見 `getPipelineOccupiedCells` 前置條件），  \
 * 斜著點會被 store 判 invalid，所以這裡先補一個明示的轉角點（先水平再垂直）。
 */
function appendManualWaypoint(x: number, y: number): void {
    const last = manualWaypoints.value[manualWaypoints.value.length - 1];
    if (last && last.x === x && last.y === y) return;

    const added: Array<{ x: number; y: number; z: number }> = [];
    if (last && last.x !== x && last.y !== y) {
        added.push({ x, y: last.y, z: 0 });
    }
    added.push({ x, y, z: 0 });

    manualWaypoints.value = [...manualWaypoints.value, ...added];
    uiError.value = null;
    statusMsg.value =
        added.length > 1
            ? `已補轉角 (${x},${last!.y})；手動 waypoints=${manualWaypoints.value.length}`
            : `手動 waypoints=${manualWaypoints.value.length}；點「完成手動拉線」或繼續點格`;
}

function commitManualBelt(): void {
    if (manualWaypoints.value.length < 2) {
        statusMsg.value = '手動拉線至少需要 2 個 waypoints';
        return;
    }
    const result = layoutStore.addPipeline({
        id: nextUid('belt'),
        media: 'belt',
        waypoints: manualWaypoints.value.map((w) => ({ ...w })),
    });
    applyResult(result, `已手動拉 belt（waypoints=${manualWaypoints.value.length}）`);
    if (result.ok) {
        manualWaypoints.value = [];
    }
}

function clearManualDraft(): void {
    manualWaypoints.value = [];
    statusMsg.value = '已清除手動草稿';
}

function onGridClick(evt: MouseEvent): void {
    const svg = evt.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const gx = Math.floor((evt.clientX - rect.left) / CELL);
    const gy = Math.floor((evt.clientY - rect.top) / CELL);
    if (gx < 0 || gy < 0 || gx >= GRID_W || gy >= GRID_H) return;

    if (beltMode.value === 'manual') {
        appendManualWaypoint(gx, gy);
        placeCursor.value = { x: gx, y: gy, z: 0 };
        return;
    }

    if (beltMode.value === 'port') {
        placeCursor.value = { x: gx, y: gy, z: 0 };
        statusMsg.value = '埠模式請點綠／橙埠標記（不要點設備本體）';
        return;
    }

    const owner = cellOwner.value.get(`${gx},${gy}`);
    if (owner) {
        onDeviceClick(owner);
        return;
    }

    placeCursor.value = { x: gx, y: gy, z: 0 };
    placeAt(gx, gy);
}

function autoBelt(): void {
    const fromId = selectedDeviceId.value;
    const toId = beltTargetId.value;
    if (!fromId || !toId) {
        statusMsg.value = '請先點兩台不同設備（起點＋終點）';
        return;
    }
    const fromDev = layoutStore.devices.find((d) => d.id === fromId);
    const toDev = layoutStore.devices.find((d) => d.id === toId);
    if (!fromDev || !toDev) {
        syncSelectionWithStore();
        failLocally('選取的設備已不存在（可能被刪除或 undo），請重新點選');
        return;
    }

    /** 封鎖＝所有設備佔格＋既有管線（路徑須繞開，否則 addPipeline 會 overlap） */
    const blocked = buildBlockedXy(layoutStore.devices, layoutStore.pipelines);
    const waypoints = findRoutableBeltWaypoints(fromDev, toDev, blocked);
    if (!waypoints) {
        failLocally('找不到不穿過設備的 belt 路徑；試加大兩機間距或換方向');
        return;
    }

    const result = layoutStore.addPipeline({
        id: nextUid('belt'),
        media: 'belt',
        waypoints,
    });
    applyResult(result, `已拉 belt：${fromId} → ${toId}（waypoints=${waypoints.length}）`);
}

/** undo／redo 或刪除後，丟掉指向已不存在設備／埠的選取 */
function syncSelectionWithStore(): void {
    const alive = new Set(layoutStore.devices.map((d) => d.id));
    if (selectedDeviceId.value && !alive.has(selectedDeviceId.value)) {
        selectedDeviceId.value = null;
    }
    if (beltTargetId.value && !alive.has(beltTargetId.value)) {
        beltTargetId.value = null;
    }
    if (portFrom.value && !alive.has(portFrom.value.deviceId)) {
        portFrom.value = null;
    }
    if (portTo.value && !alive.has(portTo.value.deviceId)) {
        portTo.value = null;
    }
}

function undoLast(): void {
    if (!historyStore.canUndo) {
        statusMsg.value = '沒有可 undo 的操作';
        return;
    }
    const cmd = historyStore.undo();
    syncSelectionWithStore();
    lastResult.value = null;
    uiError.value = null;
    statusMsg.value = `已 undo：${cmd?.label ?? ''}`;
}

function redoLast(): void {
    if (!historyStore.canRedo) {
        statusMsg.value = '沒有可 redo 的操作';
        return;
    }
    const cmd = historyStore.redo();
    syncSelectionWithStore();
    lastResult.value = null;
    uiError.value = null;
    statusMsg.value = `已 redo：${cmd?.label ?? ''}`;
}

function deviceStroke(deviceId: string): string {
    if (issueIds.value.has(deviceId)) return '#dc2626';
    if (deviceId === selectedDeviceId.value) return '#2563eb';
    if (deviceId === beltTargetId.value) return '#7c3aed';
    return '#0284c7';
}

function deviceFill(deviceId: string): string {
    if (issueIds.value.has(deviceId)) return '#fecaca';
    if (deviceId === selectedDeviceId.value) return '#bfdbfe';
    if (deviceId === beltTargetId.value) return '#ddd6fe';
    return '#bae6fd';
}

const snapshotSummary = computed(() => {
    const snap = layoutStore.toSnapshot();
    return {
        devices: snap.devices.map((d) => ({
            id: d.id,
            machineType: d.machineType,
            position: d.position,
        })),
        pipelines: snap.pipelines.map((p) => ({
            id: p.id,
            media: p.media,
            waypoints: p.waypoints.length,
        })),
    };
});
</script>

<template>
    <div class="space-y-6">
        <header>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                佈局 store 預覽（V12）
            </h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                真實機器（<code>toolbarMachines</code>）→
                <code>layoutStore</code>
                讀寫演示。含放置／移動／刪除、兩機自動拉、兩埠自動拉、手動拉線、undo／redo。
                獨立入口（不掛 <code>src/router</code>）；不接 editorStore／不改 ToolbarPanel。
            </p>
        </header>

        <div
            class="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-100"
        >
            資料路徑：<strong>layoutStore</strong> · devices={{ layoutStore.devices.length }} ·
            pipelines={{ layoutStore.pipelines.length }} · connections={{
                layoutStore.connections.length
            }}
            · 游標 ({{ placeCursor.x }},{{ placeCursor.y }}) · mode={{ beltMode }}
        </div>

        <p
            class="rounded border px-3 py-2 text-sm"
            :class="
                uiError || (lastResult && !lastResult.ok)
                    ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-100'
                    : 'border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
            "
        >
            {{ statusMsg }}
            <span v-if="lastResult && !uiError" class="ml-2 font-mono text-xs"
                >store={{ lastResult.ok ? 'ok' : lastResult.reason }}</span
            >
            <span v-if="uiError" class="ml-2 font-mono text-xs">store=（未呼叫）</span>
        </p>

        <!-- 真實機器（toolbar 資料） -->
        <section
            class="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                真實機器（toolbarMachines）
            </h3>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="tag in TOOLBAR_MACHINE_TAGS"
                    :key="tag"
                    type="button"
                    class="rounded-lg border px-3 py-1.5 text-sm"
                    :class="
                        machineTag === tag
                            ? 'border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-100'
                            : 'border-gray-200 dark:border-gray-600'
                    "
                    @click="machineTag = tag"
                >
                    {{ tag }}
                </button>
            </div>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="row in machineRows"
                    :key="row.id"
                    type="button"
                    class="rounded-lg border px-3 py-2 text-left text-sm"
                    :class="
                        selectedMachineId === row.id
                            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                            : 'border-gray-200 dark:border-gray-600'
                    "
                    @click="selectMachine(row)"
                >
                    <div class="font-medium">{{ row.name }}</div>
                    <div class="text-xs text-gray-500">{{ row.id }} · {{ row.sizeText }}</div>
                </button>
            </div>
        </section>

        <!-- 預設操作 -->
        <section
            class="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">預設操作</h3>
            <div class="flex flex-wrap gap-2">
                <button
                    type="button"
                    class="rounded-lg border px-3 py-1.5 text-sm"
                    :class="
                        beltMode === 'device'
                            ? 'border-violet-500 bg-violet-50 text-violet-900 dark:bg-violet-950'
                            : 'border-gray-200 dark:border-gray-600'
                    "
                    @click="setBeltMode('device')"
                >
                    點兩機拉線
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-1.5 text-sm"
                    :class="
                        beltMode === 'port'
                            ? 'border-violet-500 bg-violet-50 text-violet-900 dark:bg-violet-950'
                            : 'border-gray-200 dark:border-gray-600'
                    "
                    @click="setBeltMode('port')"
                >
                    點兩埠拉線
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-1.5 text-sm"
                    :class="
                        beltMode === 'manual'
                            ? 'border-violet-500 bg-violet-50 text-violet-900 dark:bg-violet-950'
                            : 'border-gray-200 dark:border-gray-600'
                    "
                    @click="setBeltMode('manual')"
                >
                    手動拉線
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-1.5 text-sm dark:border-gray-600"
                    :disabled="!historyStore.canUndo"
                    @click="undoLast"
                >
                    Undo
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-1.5 text-sm dark:border-gray-600"
                    :disabled="!historyStore.canRedo"
                    @click="redoLast"
                >
                    Redo
                </button>
            </div>
            <div class="flex flex-wrap gap-2">
                <button
                    type="button"
                    class="rounded-lg border border-blue-500 bg-blue-600 px-3 py-2 text-sm text-white"
                    @click="placeAtCursor"
                >
                    放到預設點 ({{ placeCursor.x }},{{ placeCursor.y }})
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm dark:border-gray-600"
                    @click="resetCursor"
                >
                    重設預設點 ({{ DEFAULT_PLACE.x }},{{ DEFAULT_PLACE.y }})
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm dark:border-gray-600"
                    @click="nudgeCursor(0, -1)"
                >
                    游標↑
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm dark:border-gray-600"
                    @click="nudgeCursor(0, 1)"
                >
                    游標↓
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm dark:border-gray-600"
                    @click="nudgeCursor(-1, 0)"
                >
                    游標←
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm dark:border-gray-600"
                    @click="nudgeCursor(1, 0)"
                >
                    游標→
                </button>
            </div>
            <div class="flex flex-wrap gap-2">
                <button
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm dark:border-gray-600"
                    @click="moveSelected(0, -1)"
                >
                    選取↑
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm dark:border-gray-600"
                    @click="moveSelected(0, 1)"
                >
                    選取↓
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm dark:border-gray-600"
                    @click="moveSelected(-1, 0)"
                >
                    選取←
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm dark:border-gray-600"
                    @click="moveSelected(1, 0)"
                >
                    選取→
                </button>
                <button
                    type="button"
                    class="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 dark:border-red-700"
                    @click="removeSelected"
                >
                    刪除選取
                </button>
                <button
                    type="button"
                    class="rounded-lg border border-violet-500 bg-violet-600 px-3 py-2 text-sm text-white"
                    :disabled="beltMode !== 'device'"
                    @click="autoBelt"
                >
                    自動拉 belt（兩機）
                </button>
                <button
                    type="button"
                    class="rounded-lg border border-emerald-500 bg-emerald-600 px-3 py-2 text-sm text-white"
                    :disabled="beltMode !== 'manual' || manualWaypoints.length < 2"
                    @click="commitManualBelt"
                >
                    完成手動拉線（{{ manualWaypoints.length }}）
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm dark:border-gray-600"
                    :disabled="manualWaypoints.length === 0"
                    @click="clearManualDraft"
                >
                    清手動草稿
                </button>
                <button
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm dark:border-gray-600"
                    @click="clearAll"
                >
                    清空
                </button>
            </div>
            <p class="text-xs text-gray-500">
                設備模式：藍／紫框＝起終點。埠模式：點綠圓（輸出）與橙方（輸入）各一，順序不限，
                store 內固定以輸出為起點。手動：依序點格，斜著點會自動補轉角。紅框＝`layoutIssues`
                指出的真正出錯 id。
            </p>
        </section>

        <!-- fixture 備援 -->
        <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-gray-500">一鍵 fixture：</span>
            <button
                v-for="s in MOCK_LAYOUT_SCENARIOS"
                :key="s.id"
                type="button"
                class="rounded-lg border px-3 py-1.5 text-sm dark:border-gray-600"
                @click="loadFixture(s.id)"
            >
                {{ s.label }}
            </button>
        </div>

        <!-- 格點（可點） -->
        <div
            class="overflow-auto rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
        >
            <svg
                :width="GRID_W * CELL"
                :height="GRID_H * CELL"
                class="block max-w-full cursor-crosshair"
                role="img"
                aria-label="佈局 store 互動格點"
                @click="onGridClick"
            >
                <g stroke="#e5e7eb" stroke-width="1">
                    <line
                        v-for="x in GRID_W + 1"
                        :key="`vx-${x}`"
                        :x1="(x - 1) * CELL"
                        y1="0"
                        :x2="(x - 1) * CELL"
                        :y2="GRID_H * CELL"
                    />
                    <line
                        v-for="y in GRID_H + 1"
                        :key="`hy-${y}`"
                        x1="0"
                        :y1="(y - 1) * CELL"
                        :x2="GRID_W * CELL"
                        :y2="(y - 1) * CELL"
                    />
                </g>

                <!-- 游標預覽 -->
                <rect
                    :x="placeCursor.x * CELL + 2"
                    :y="placeCursor.y * CELL + 2"
                    :width="CELL - 4"
                    :height="CELL - 4"
                    fill="none"
                    stroke="#a78bfa"
                    stroke-width="2"
                    stroke-dasharray="4 3"
                />

                <g>
                    <rect
                        v-for="cell in deviceCells"
                        :key="cell.key"
                        :x="cell.x * CELL + 1"
                        :y="cell.y * CELL + 1"
                        :width="CELL - 2"
                        :height="CELL - 2"
                        rx="3"
                        :fill="deviceFill(cell.deviceId)"
                        :stroke="deviceStroke(cell.deviceId)"
                        stroke-width="2"
                    />
                    <text
                        v-for="device in layoutStore.devices"
                        :key="`lbl-${device.id}`"
                        :x="(device.position.x + 0.5) * CELL"
                        :y="(device.position.y + 0.55) * CELL"
                        text-anchor="middle"
                        class="pointer-events-none fill-sky-950 text-[9px] font-semibold dark:fill-sky-100"
                    >
                        {{ device.label ?? device.machineType }}
                    </text>
                </g>

                <g
                    v-for="(pipe, idx) in layoutStore.pipelines"
                    :key="pipe.id"
                    class="pointer-events-none"
                >
                    <path
                        :d="pipelinePath(pipe.waypoints)"
                        fill="none"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        :stroke="
                            connectionStatus(layoutStore.connections[idx]!) === 'ok'
                                ? '#16a34a'
                                : connectionStatus(layoutStore.connections[idx]!) === 'direction'
                                  ? '#e11d48'
                                  : '#ea580c'
                        "
                    />
                    <circle
                        v-for="(wp, wi) in pipe.waypoints"
                        :key="`${pipe.id}-wp-${wi}`"
                        :cx="(wp.x + 0.5) * CELL"
                        :cy="(wp.y + 0.5) * CELL"
                        r="2.5"
                        :fill="
                            connectionStatus(layoutStore.connections[idx]!) === 'ok'
                                ? '#86efac'
                                : connectionStatus(layoutStore.connections[idx]!) === 'direction'
                                  ? '#fda4af'
                                  : '#fdba74'
                        "
                    />
                </g>

                <!-- 手動草稿路徑 -->
                <g v-if="manualWaypoints.length > 0" class="pointer-events-none">
                    <path
                        v-if="manualWaypoints.length > 1"
                        :d="pipelinePath(manualWaypoints)"
                        fill="none"
                        stroke="#9333ea"
                        stroke-width="2"
                        stroke-dasharray="5 4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <circle
                        v-for="(wp, wi) in manualWaypoints"
                        :key="`manual-${wi}`"
                        :cx="(wp.x + 0.5) * CELL"
                        :cy="(wp.y + 0.5) * CELL"
                        r="3"
                        fill="#a855f7"
                    />
                </g>

                <!-- belt 埠錨點：綠＝輸出、橙＝輸入；埠模式可點 -->
                <g>
                    <template v-for="port in portMarkers" :key="port.key">
                        <circle
                            v-if="port.emphasis || port.picked"
                            :cx="(port.x + 0.5) * CELL"
                            :cy="(port.y + 0.5) * CELL"
                            r="9"
                            fill="none"
                            :stroke="
                                port.picked
                                    ? '#db2777'
                                    : port.kind === 'output'
                                      ? '#2563eb'
                                      : '#7c3aed'
                            "
                            stroke-width="2"
                            stroke-dasharray="3 2"
                            class="pointer-events-none"
                        />
                        <circle
                            v-if="port.kind === 'output'"
                            :cx="(port.x + 0.5) * CELL"
                            :cy="(port.y + 0.5) * CELL"
                            :r="port.linked || port.emphasis || port.picked ? 6 : 4.5"
                            :fill="port.linked ? '#15803d' : '#22c55e'"
                            :stroke="port.linked || port.picked ? '#fff' : '#14532d'"
                            :stroke-width="port.linked || port.picked ? 2 : 1"
                            class="cursor-pointer"
                            @click="
                                onPortClick(
                                    {
                                        deviceId: port.deviceId,
                                        kind: port.kind,
                                        x: port.x,
                                        y: port.y,
                                    },
                                    $event,
                                )
                            "
                        />
                        <rect
                            v-else
                            :x="
                                (port.x + 0.5) * CELL -
                                (port.linked || port.emphasis || port.picked ? 5.5 : 4)
                            "
                            :y="
                                (port.y + 0.5) * CELL -
                                (port.linked || port.emphasis || port.picked ? 5.5 : 4)
                            "
                            :width="port.linked || port.emphasis || port.picked ? 11 : 8"
                            :height="port.linked || port.emphasis || port.picked ? 11 : 8"
                            rx="1.5"
                            :fill="port.linked ? '#c2410c' : '#f97316'"
                            :stroke="port.linked || port.picked ? '#fff' : '#7c2d12'"
                            :stroke-width="port.linked || port.picked ? 2 : 1"
                            class="cursor-pointer"
                            @click="
                                onPortClick(
                                    {
                                        deviceId: port.deviceId,
                                        kind: port.kind,
                                        x: port.x,
                                        y: port.y,
                                    },
                                    $event,
                                )
                            "
                        />
                    </template>
                </g>
            </svg>
            <p class="mt-2 text-xs text-gray-500">
                設備模式點空格放置／點設備選取；埠模式點綠／橙埠；手動模式點格加 waypoints。
                <span class="text-green-700 dark:text-green-400">綠圓＝輸出</span>；
                <span class="text-orange-700 dark:text-orange-400">橙方＝輸入</span>。
            </p>
        </div>

        <section
            class="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                layoutStore.connections（getter）
            </h3>
            <ul class="space-y-2 text-sm">
                <li
                    v-for="conn in layoutStore.connections"
                    :key="conn.id"
                    class="rounded border px-3 py-2 font-mono text-xs"
                    :class="
                        connectionStatus(conn) === 'ok'
                            ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950'
                            : connectionStatus(conn) === 'direction'
                              ? 'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950'
                              : 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950'
                    "
                >
                    <div class="font-sans text-sm font-semibold">
                        {{ conn.pipelineId }} —
                        {{ connectionStatusLabel(connectionStatus(conn)) }}
                    </div>
                    <div>from: {{ portRefLabel(conn.from) }}</div>
                    <div>to: {{ portRefLabel(conn.to) }}</div>
                </li>
                <li v-if="layoutStore.connections.length === 0" class="text-sm text-gray-500">
                    （無管線 → connections 為空）
                </li>
            </ul>
        </section>

        <section
            class="space-y-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">toSnapshot() 摘要</h3>
            <pre
                class="overflow-x-auto rounded bg-gray-100 p-2 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                >{{ JSON.stringify(snapshotSummary, null, 2) }}</pre
            >
        </section>
    </div>
</template>
