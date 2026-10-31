<script setup lang="ts">
/**
 * L1 契約實驗室（V19 Hub MVP）
 *
 * 給串接／呼叫端（含無開發經驗）：頁內入門＋詞彙＋目錄＋定義表＋可點案例。
 * 不取代各版專頁；深鏈見 {@link CONTRACT_BLOCKS}.deeperDemo。
 */
import { computed, ref } from 'vue';
import { createPinia, getActivePinia, setActivePinia } from 'pinia';
import type { Connection, PlacedDevice, Pipeline } from '@/types/layout';
import { getMachineMode } from '@/types/machine';
import { getMachineById, getMachine, resolveMachineDef } from '@/data/machines';
import { getRecipesForMachine } from '@/data/products';
import {
    DRAFT_ID,
    canPlaceDevice,
    canMoveDevice,
    type DeviceDraft,
} from '@/utils/layout/placementCheck';
import { canConnect, describeConnectFailure } from '@/utils/layout/connectRules';
import { devicesOutsideBase } from '@/utils/layout/devicesOutsideBase';
import { hitTestPortAt } from '@/utils/layout/portHitTest';
import {
    buildConnectionWaypoints,
    buildGapConnectionWaypoints,
} from '@/utils/layout/connectionWaypoints';
import { collectPortAnchors, findPortAt } from '@/utils/layout/portAnchorIndex';
import { resolveConnections } from '@/utils/layout/resolveConnections';
import { toTopology } from '@/utils/layout/toTopology';
import { resolveDisplayGrid, rotatePort } from '@/utils/portUtils';
import { resolvePortAnchorCell } from '@/utils/layout/portAnchors';
import {
    buildGraph,
    validateChains,
    topologicalSort,
    propagateFlows,
} from '@/composables/useFlowEngine';
import { useLayoutStore } from '@/store/layoutStore';
import { useHistoryStore } from '@/store/historyStore';
import {
    historyContextFromPath,
    shouldClearHistoryOnNavigate,
} from '@/utils/history/historyContext';
import {
    CONTRACT_BLOCKS,
    CONTRACT_INVENTORY,
    HUB_GLOSSARY,
    HUB_GUIDE_STEPS,
    HUB_OPS_RULES,
    INVENTORY_AREA_LABELS,
    type ContractInventoryArea,
    type ContractVersion,
} from '@/app/dev/l1ContractLab/contractCatalog';

/** Hub 導覽分頁（入門／詞彙／目錄／總覽／版本） */
type HubTab = ContractVersion | 'overview' | 'guide' | 'glossary' | 'inventory';

/** 目前分頁：入門／詞彙／目錄／總覽或某契約版本 */
const active = ref<HubTab>('guide');

/** 契約塊列表（來自 catalog） */
const blocks = CONTRACT_BLOCKS;

/** 頁內教學步驟 */
const guideSteps = HUB_GUIDE_STEPS;

/** 頁內詞彙 */
const glossary = HUB_GLOSSARY;

/** 頁內維運規則摘要 */
const opsRules = HUB_OPS_RULES;

/** inventory 全表 */
const inventory = CONTRACT_INVENTORY;

/** inventory 區域鍵（顯示順序） */
const inventoryAreas = Object.keys(INVENTORY_AREA_LABELS) as ContractInventoryArea[];

/** 依區域分組的 inventory */
const inventoryByArea = computed(() =>
    inventoryAreas.map((area) => ({
        area,
        label: INVENTORY_AREA_LABELS[area],
        rows: inventory.filter((row) => row.area === area),
    })),
);

/** listed／todo 計數（目錄頁摘要） */
const inventoryCounts = computed(() => ({
    listed: inventory.filter((row) => row.status === 'listed').length,
    todo: inventory.filter((row) => row.status === 'todo').length,
}));

/** 目前選中的契約塊；非版本分頁時為 null */
const activeBlock = computed(() => {
    if (
        active.value === 'overview' ||
        active.value === 'guide' ||
        active.value === 'glossary' ||
        active.value === 'inventory'
    ) {
        return null;
    }
    return blocks.find((b) => b.version === active.value) ?? null;
});

/** 導覽按鈕共用 class */
function navClass(tab: HubTab): string {
    return active.value === tab
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200';
}

/** 結果面板標題 */
const outputTitle = ref('尚未執行');

/** 結果面板 JSON 字串 */
const outputJson = ref('點下方「執行」按鈕，結果會顯示在這裡。');

/**
 * 把案例結果寫進輸出面板
 *
 * @param title 標題
 * @param value 任意可 JSON 化物件
 */
function showResult(title: string, value: unknown) {
    outputTitle.value = title;
    outputJson.value = JSON.stringify(value, null, 2);
}

/**
 * 在獨立 Pinia 實例上執行寫入示範，避免污染 SPA 共用 layoutStore／history
 *
 * @param run 在臨時 Pinia 為 active 時執行的函式
 */
function withLabPinia<T>(run: () => T): T {
    const previous = getActivePinia();
    const labPinia = createPinia();
    setActivePinia(labPinia);
    try {
        return run();
    } finally {
        if (previous) {
            setActivePinia(previous);
        }
    }
}

/**
 * 測試用 splitter 設備（真實機型 id）
 *
 * @param id 設備 uid
 * @param x 佔格左上角 x
 * @param y 佔格左上角 y
 */
function splitterAt(id: string, x: number, y: number): PlacedDevice {
    return {
        id,
        machineType: 'splitter',
        position: { x, y, z: 0 },
        rotation: 0,
        label: id,
    };
}

/**
 * 取設備第一個入／出埠的外側錨點格（給 canConnect waypoints）
 *
 * @param device 已放置設備
 * @param portType 輸入或輸出
 */
function portAnchor(
    device: PlacedDevice,
    portType: 'input' | 'output',
): { x: number; y: number; z: number } {
    const def = getMachineById(device.machineType)!;
    const mode = getMachineMode(def, device.machineMode);
    const ports = portType === 'input' ? mode.input_ports : mode.output_ports;
    const port = ports[0]!;
    const rotated = rotatePort(port.side, port.offset, def.width, def.height, device.rotation);
    const display = resolveDisplayGrid(def.width, def.height, device.rotation);
    const cell = resolvePortAnchorCell(
        device.position.x,
        device.position.y,
        display.widthCells,
        display.heightCells,
        rotated.side,
        rotated.offset,
    );
    return { x: cell.x, y: cell.y, z: 0 };
}

/** V14：空地放置預檢 */
function runV14PlaceOk() {
    const result = canPlaceDevice(
        { machineType: 'splitter', position: { x: 5, y: 0, z: 0 }, rotation: 0 },
        { devices: [splitterAt('a', 0, 0)], pipelines: [] },
    );
    showResult('canPlaceDevice（空地 → ok）', { ...result, DRAFT_ID });
}

/** V14：重疊放置預檢（仍回 overlap；寫入層不擋） */
function runV14PlaceOverlap() {
    const draft: DeviceDraft = {
        machineType: 'splitter',
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
    };
    const result = canPlaceDevice(draft, {
        devices: [splitterAt('a', 0, 0)],
        pipelines: [],
    });
    showResult('canPlaceDevice（重疊 → overlap；conflicts 含 DRAFT_ID）', result);
}

/** V14：原位移動必 ok */
function runV14MoveSame() {
    const d = splitterAt('a', 2, 3);
    const result = canMoveDevice('a', { x: 2, y: 3, z: 0 }, { devices: [d], pipelines: [] });
    showResult('canMoveDevice（原位 → 必 ok）', result);
}

/** V14：合法 belt 連線 */
function runV14ConnectOk() {
    const src = splitterAt('src', 0, 0);
    const dst = splitterAt('dst', 4, 0);
    const start = portAnchor(src, 'output');
    const end = portAnchor(dst, 'input');
    const result = canConnect(
        { media: 'belt', waypoints: [start, { x: 2, y: start.y, z: 0 }, end] },
        { devices: [src, dst], pipelines: [] },
        getMachineById,
    );
    showResult('canConnect（合法 belt）', {
        result,
        describe: describeConnectFailure(result),
    });
}

/** V15 案例群 */

/** V15：有基地時的出界 id */
function runV15Outside() {
    const devices: PlacedDevice[] = [splitterAt('in', 0, 0), splitterAt('far', 300, 0)];
    const ids = devicesOutsideBase(devices, 'wuling');
    showResult('devicesOutsideBase（wuling 256×256）', {
        region: 'wuling',
        outsideIds: ids,
        note: '出界仍可 addDevice；此列表只供視覺 Error',
    });
}

/** V15：未選基地 → 出界一律空 */
function runV15OutsideNullRegion() {
    const ids = devicesOutsideBase([splitterAt('x', 999, 999)], null);
    showResult('devicesOutsideBase（region=null）', {
        outsideIds: ids,
        note: '未選基地 → 一律 []',
    });
}

/** V15：埠熱區命中（單機視覺邊心） */
function runV15HitTest() {
    const device: PlacedDevice = {
        id: 'c',
        machineType: 'crusher',
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
    };
    const def = getMachineById('crusher')!;
    const mode = getMachineMode(def);
    // 點在第一個 input 埠附近（熱區）
    const hit = hitTestPortAt({ x: 0.5, y: 0.1 }, [device], getMachineById, {
        prefer: 'input',
    });
    showResult('hitTestPortAt（crusher 附近）', {
        point: { x: 0.5, y: 0.1 },
        prefer: 'input',
        hit,
        inputPorts: mode.input_ports.length,
        note: '連續格座標；圓心＝埠邊心，不是外側錨點格',
    });
}

/**
 * V15：緊貼埠對埠時 prefer 消歧（審查案例）
 *
 * splitter A@(0,0) 右出與 B@(1,0) 左入視覺點皆 (1, 0.5)；
 * 無 prefer 會隨設備陣列序變；有 prefer 則穩定。
 */
function runV15HitTestPrefer() {
    const a = splitterAt('a', 0, 0);
    const b = splitterAt('b', 1, 0);
    const point = { x: 1, y: 0.5 };
    const orders = [
        { label: '[A, B]', devices: [a, b] as const },
        { label: '[B, A]', devices: [b, a] as const },
    ];
    const rows = orders.flatMap(({ label, devices }) => {
        const none = hitTestPortAt(point, devices);
        const asOutput = hitTestPortAt(point, devices, undefined, { prefer: 'output' });
        const asInput = hitTestPortAt(point, devices, undefined, { prefer: 'input' });
        return [
            {
                order: label,
                prefer: '(無)',
                hit: none ? `${none.deviceId} ${none.portType}[${none.portIndex}]` : null,
            },
            {
                order: label,
                prefer: 'output（拖線起點）',
                hit: asOutput
                    ? `${asOutput.deviceId} ${asOutput.portType}[${asOutput.portIndex}]`
                    : null,
            },
            {
                order: label,
                prefer: 'input（放開終點）',
                hit: asInput
                    ? `${asInput.deviceId} ${asInput.portType}[${asInput.portIndex}]`
                    : null,
            },
        ];
    });
    showResult('hitTestPortAt prefer（緊貼埠對埠）', {
        point,
        scenario: 'A@(0,0) 右出 與 B@(1,0) 左入 視覺點同為 (1,0.5)',
        expect: {
            preferOutput: '一律 a output[1]',
            preferInput: '一律 b input[0]',
        },
        rows,
        note: 'L2：開始拖線 prefer:output；放開 prefer:input',
    });
}

/**
 * V15／#78：連線 waypoints 純函式演示（不寫 store）
 */
function runV15ConnectionWaypoints() {
    const waypoints = buildConnectionWaypoints(
        { position: { x: 1, y: 0, z: 0 }, side: 'right' },
        { position: { x: 5, y: 3, z: 0 }, side: 'left' },
    );
    showResult('buildConnectionWaypoints（#78）', {
        source: { position: { x: 1, y: 0, z: 0 }, side: 'right' },
        target: { position: { x: 5, y: 3, z: 0 }, side: 'left' },
        waypoints,
        note: '同層整數錨點 → 直線或單轉角；不驗證媒質／碰撞（交 canConnect）',
    });
}

/**
 * V20-D1：間隙通道 waypoints vs 單轉角（真呼叫；不寫 store）
 *
 * 左右兩台 3×3 佔格、上下埠：gap 走中央通道；一般 build 只做單轉角。
 */
function runV15GapConnectionWaypoints() {
    const source = { position: { x: 1, y: 3, z: 0 }, side: 'bottom' as const };
    const target = { position: { x: 7, y: -1, z: 0 }, side: 'top' as const };
    const leftBounds = { left: 0, right: 2, top: 0, bottom: 2 };
    const rightBounds = { left: 6, right: 8, top: 0, bottom: 2 };
    const simple = buildConnectionWaypoints(source, target);
    const gap = buildGapConnectionWaypoints(source, target, leftBounds, rightBounds);
    const noGap = buildGapConnectionWaypoints(source, target, leftBounds, {
        left: 3,
        right: 5,
        top: 0,
        bottom: 2,
    });
    showResult('buildGapConnectionWaypoints（對照單轉角）', {
        source,
        target,
        leftBounds,
        rightBounds,
        buildConnectionWaypoints: simple,
        buildGapConnectionWaypoints: gap,
        whenNoLane: {
            overlappingishBounds: { left: 3, right: 5, top: 0, bottom: 2 },
            result: noGap,
            expect: '無至少一格通道 → null',
        },
        note: 'gap＝固定中央通道雙轉角；仍須 canConnect／碰撞預檢；不搜尋其他繞障',
    });
}

/**
 * V20-C1：外側錨點格 vs 熱區（真呼叫 findPortAt／hitTestPortAt）
 *
 * crusher@(0,0) 頂邊 input[0] 外側錨＝(0,-1)；熱區圓心在設備邊上（連續座標）。
 */
function runV15FindPortAtContrast() {
    const device: PlacedDevice = {
        id: 'c',
        machineType: 'crusher',
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
    };
    const anchors = collectPortAnchors([device]);
    const input0 = anchors.find(
        (a) => a.ref.deviceId === 'c' && a.ref.portType === 'input' && a.ref.portIndex === 0,
    )!;
    /** 與既有 hitTest 案例同一點（連續格；非整數錨點） */
    const hotPoint = { x: 0.5, y: 0.1 };
    const atAnchorCell = findPortAt(anchors, input0.x, input0.y, 'input');
    const atHotPointExact = findPortAt(anchors, hotPoint.x, hotPoint.y);
    const hitHot = hitTestPortAt(hotPoint, [device], getMachineById, { prefer: 'input' });
    const hitAtAnchorCell = hitTestPortAt(
        { x: input0.x + 0.5, y: input0.y + 0.5 },
        [device],
        getMachineById,
        { prefer: 'input' },
    );
    const manualCell = resolvePortAnchorCell(0, 0, 3, 3, 'top', 0);
    showResult('findPortAt vs hitTestPortAt（錨點≠熱區）', {
        device: { id: 'c', machineType: 'crusher', position: device.position },
        resolvePortAnchorCell_top0: manualCell,
        collectPortAnchors_input0: input0,
        findPortAt: {
            atIntegerAnchor: atAnchorCell,
            atHotPointExact: atHotPointExact,
            expect: '整數錨點格命中；熱區連續點用 === 對格 → 通常 null',
        },
        hitTestPortAt: {
            atHotPoint: hitHot,
            nearAnchorCellCenter: hitAtAnchorCell,
            expect: '滑鼠／拖線用熱區；圓心在設備邊，不是外側錨點',
        },
        note: '規則／resolveConnections 用 findPortAt；L2 滑鼠用 hitTestPortAt',
    });
}

/**
 * V20-C1：resolveConnections（管線端點＝外側錨點 → Connection；錯位則斷線）
 */
function runV15ResolveConnections() {
    const src = splitterAt('src', 0, 0);
    const dst = splitterAt('dst', 4, 0);
    const anchors = collectPortAnchors([src, dst]);
    /** splitter：output[1]＝右出；input[0]＝左入 */
    const fromA = anchors.find(
        (a) => a.ref.deviceId === 'src' && a.ref.portType === 'output' && a.ref.portIndex === 1,
    )!;
    const toA = anchors.find(
        (a) => a.ref.deviceId === 'dst' && a.ref.portType === 'input' && a.ref.portIndex === 0,
    )!;
    const okPipeline: Pipeline = {
        id: 'p-ok',
        media: 'belt',
        waypoints: [
            { x: fromA.x, y: fromA.y, z: 0 },
            { x: 2, y: fromA.y, z: 0 },
            { x: toA.x, y: toA.y, z: 0 },
        ],
    };
    const brokenPipeline: Pipeline = {
        id: 'p-brk',
        media: 'belt',
        waypoints: [
            { x: 2, y: 0, z: 0 },
            { x: 3, y: 0, z: 0 },
        ],
    };
    const connections = resolveConnections([src, dst], [okPipeline, brokenPipeline]);
    const connectCheck = canConnect(
        okPipeline,
        { devices: [src, dst], pipelines: [] },
        getMachineById,
    );
    showResult('resolveConnections（對齊／斷線）', {
        fromAnchor: fromA,
        toAnchor: toA,
        pipelines: [okPipeline, brokenPipeline],
        connections,
        canConnectOnOk: connectCheck,
        note: '端點格須＝外側錨點；from 偏好 output、to 偏好 input；媒質規則另走 canConnect',
    });
}

/** V16 案例群 */

/**
 * V16：純資料證明 toTopology 帶出 primaryOutput（不寫任何 store）
 */
function runV16TopologyMapping() {
    const devices: PlacedDevice[] = [
        {
            id: 'src',
            machineType: 'material_source',
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            machineMode: 'solid_belt',
            primaryOutput: '源礦',
            sourceRatePerMin: 30,
        },
    ];
    const { nodes } = toTopology(devices, [], []);
    showResult('toTopology 映射 primaryOutput（純資料，不寫 store）', {
        input: {
            primaryOutput: devices[0]!.primaryOutput,
            sourceRatePerMin: devices[0]!.sourceRatePerMin,
            machineType: devices[0]!.machineType,
        },
        nodeData: nodes[0]?.data,
        note: '正式寫入請呼叫 layoutStore.setDevicePrimaryOutput(uid, itemId, rate?)',
    });
}

/**
 * V16：在**獨立 Pinia** 上示範 setDevicePrimaryOutput（不污染正式頁 layoutStore）
 */
function runV16StoreAction() {
    const payload = withLabPinia(() => {
        const layout = useLayoutStore();
        const history = useHistoryStore();
        const id = `lab-src-${Date.now()}`;
        const placed = layout.addDevice({
            id,
            machineType: 'material_source',
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            machineMode: 'solid_belt',
        });
        if (!placed.ok) {
            return {
                error: 'addDevice failed（僅 invalid 會失敗；重疊應 ok）',
                placed,
            };
        }
        const depthBefore = history.undoDepth;
        layout.setDevicePrimaryOutput(id, '源礦');
        const device = layout.devices.find((d) => d.id === id);
        return {
            isolation: 'createPinia 臨時實例；結束後已還原 SPA active Pinia',
            device: {
                id,
                primaryOutput: device?.primaryOutput,
                sourceRatePerMin: device?.sourceRatePerMin,
            },
            undoDepthBefore: depthBefore,
            undoDepthAfter: history.undoDepth,
        };
    });
    showResult('setDevicePrimaryOutput（獨立 Pinia，不寫正式頁）', payload);
}

/**
 * V16／V18：獨立 Pinia 示範 rotateDevice（原點不動、進歷史）
 */
function runV16RotateDevice() {
    const payload = withLabPinia(() => {
        const layout = useLayoutStore();
        const history = useHistoryStore();
        layout.addDevice({
            id: 'rot',
            machineType: 'filling_machine',
            position: { x: 3, y: 3, z: 0 },
            rotation: 0,
        });
        history.clear();
        const beforePos = { ...layout.devices[0]!.position };
        const result = layout.rotateDevice('rot', 1);
        return {
            isolation: '獨立 Pinia',
            result,
            positionUnchanged: layout.devices[0]!.position,
            expectedPosition: beforePos,
            rotation: layout.devices[0]!.rotation,
            undoDepth: history.undoDepth,
            note: '重疊不擋寫入；E001 看 layoutIssues',
        };
    });
    showResult('rotateDevice（獨立 Pinia）', payload);
}

/**
 * V20-D1：獨立 Pinia 示範 addPipeline／removePipeline（內含 canConnect）
 */
function runV16AddRemovePipeline() {
    const payload = withLabPinia(() => {
        const layout = useLayoutStore();
        const history = useHistoryStore();
        const src = splitterAt('src', 0, 0);
        const dst = splitterAt('dst', 4, 0);
        layout.addDevice(src);
        layout.addDevice(dst);
        history.clear();
        const anchors = collectPortAnchors(layout.devices);
        const fromA = anchors.find(
            (a) => a.ref.deviceId === 'src' && a.ref.portType === 'output' && a.ref.portIndex === 1,
        )!;
        const toA = anchors.find(
            (a) => a.ref.deviceId === 'dst' && a.ref.portType === 'input' && a.ref.portIndex === 0,
        )!;
        const okPipeline: Pipeline = {
            id: 'lab-p1',
            media: 'belt',
            waypoints: [
                { x: fromA.x, y: fromA.y, z: 0 },
                { x: 2, y: fromA.y, z: 0 },
                { x: toA.x, y: toA.y, z: 0 },
            ],
        };
        const preCheck = canConnect(
            okPipeline,
            { devices: [src, dst], pipelines: [] },
            getMachineById,
        );
        const added = layout.addPipeline(okPipeline);
        const afterAdd = {
            ok: added,
            pipelineCount: layout.pipelines.length,
            connectionCount: layout.connections.length,
            undoDepth: history.undoDepth,
        };
        const bad = layout.addPipeline({
            id: 'lab-bad',
            media: 'belt',
            waypoints: [
                { x: 2, y: 0, z: 0 },
                { x: 3, y: 0, z: 0 },
            ],
        });
        const removed = layout.removePipeline('lab-p1');
        return {
            isolation: 'createPinia 臨時實例；不寫正式頁',
            anchors: { from: fromA, to: toA },
            canConnectBeforeAdd: preCheck,
            describeConnectFailure: describeConnectFailure(preCheck),
            addPipelineOk: afterAdd,
            addPipelineRejectedWhenEndpointsMiss: bad,
            removePipeline: {
                result: removed,
                pipelineCount: layout.pipelines.length,
                undoDepth: history.undoDepth,
            },
            note: 'addPipeline 內含 canConnect；失敗→invalid；成功／刪除皆進歷史',
        };
    });
    showResult('addPipeline／removePipeline（獨立 Pinia）', payload);
}

/** V17：resolveMachineDef 與配方鍵 */
function runV17Resolve() {
    const byId = resolveMachineDef('crusher');
    const byName = resolveMachineDef('粉碎機');
    const recipesByWrongKey = getRecipesForMachine('crusher', 'default');
    const recipesByName = byId ? getRecipesForMachine(byId.name, 'default') : [];
    showResult('resolveMachineDef＋配方鍵', {
        byId: byId && { id: byId.id, name: byId.name },
        byName: byName && { id: byName.id, name: byName.name },
        sameRef: byId === byName,
        recipesIfPassEnglishId: recipesByWrongKey.length,
        recipesViaDefName: recipesByName.length,
        note: '英文 id 當配方鍵通常＝0 條；必須用 def.name',
    });
}

/** V17：純函式引擎 30/min 產線（不寫 store） */
function runV17EngineSlice() {
    const devices: PlacedDevice[] = [
        {
            id: 'src',
            machineType: 'material_source',
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            machineMode: 'solid_belt',
            primaryOutput: '源礦',
            sourceRatePerMin: 30,
        },
        {
            id: 'crusher',
            machineType: 'crusher',
            position: { x: 4, y: 0, z: 0 },
            rotation: 0,
            machineMode: 'default',
        },
        {
            id: 'sink',
            machineType: 'item_sink',
            position: { x: 10, y: 0, z: 0 },
            rotation: 0,
        },
    ];
    const pipelines: Pipeline[] = [
        {
            id: 'p1',
            media: 'belt',
            waypoints: [
                { x: 1, y: 1, z: 0 },
                { x: 3, y: 1, z: 0 },
            ],
        },
        {
            id: 'p2',
            media: 'belt',
            waypoints: [
                { x: 7, y: 1, z: 0 },
                { x: 9, y: 1, z: 0 },
            ],
        },
    ];
    const connections: Connection[] = [
        {
            id: 'p1',
            pipelineId: 'p1',
            from: { deviceId: 'src', portType: 'output', portIndex: 0 },
            to: { deviceId: 'crusher', portType: 'input', portIndex: 0 },
        },
        {
            id: 'p2',
            pipelineId: 'p2',
            from: { deviceId: 'crusher', portType: 'output', portIndex: 0 },
            to: { deviceId: 'sink', portType: 'input', portIndex: 0 },
        },
    ];
    const { nodes, edges } = toTopology(devices, pipelines, connections);
    const graph = buildGraph(nodes, edges);
    validateChains(graph);
    const flows = propagateFlows(topologicalSort(graph), graph);
    showResult('toTopology → 引擎（源礦 30 產線）', {
        machineTypes: nodes.map((n) => n.data?.machineType),
        sourceOut: graph.nodes.get('src')?.outputRates.get('源礦'),
        crusherIn: graph.nodes.get('crusher')?.inputRates.get('源礦'),
        crusherOut: graph.nodes.get('crusher')?.outputRates.get('源石粉末'),
        sinkIn: graph.nodes.get('sink')?.inputRates.get('源石粉末'),
        edgeP1: flows.get('p1'),
        edgeP2: flows.get('p2'),
    });
}

/** V17：history 情境與跨頁是否 clear（純規則，不寫 store） */
function runV17HistoryContext() {
    showResult('history 情境邊界', {
        contexts: {
            '/': historyContextFromPath('/'),
            '/dev/flow-engine': historyContextFromPath('/dev/flow-engine'),
            '/dev/paper-fig-main-field': historyContextFromPath('/dev/paper-fig-main-field'),
        },
        shouldClear: {
            '／→／dev': shouldClearHistoryOnNavigate('/', '/dev/history-replay'),
            '／dev/a→／dev/b': shouldClearHistoryOnNavigate('/dev/a', '/dev/b'),
            '／dev→／': shouldClearHistoryOnNavigate('/dev/x', '/'),
        },
        note: 'router.afterEach 已掛；同區不清。獨立 HTML preview 另 Pinia。',
        getMachineStillExists: typeof getMachine === 'function',
    });
}

/**
 * 可點案例列
 */
interface PlayCase {
    /** 穩定 id（列表 key） */
    id: string;
    /** 按鈕文案 */
    label: string;
    /** 執行函式 */
    run: () => void;
}

/** 各版本可點案例 */
const playByVersion: Record<ContractVersion, PlayCase[]> = {
    V14: [
        { id: 'p-ok', label: 'canPlaceDevice 空地', run: runV14PlaceOk },
        { id: 'p-ov', label: 'canPlaceDevice 重疊', run: runV14PlaceOverlap },
        { id: 'p-mv', label: 'canMoveDevice 原位', run: runV14MoveSame },
        { id: 'p-cn', label: 'canConnect 試跑', run: runV14ConnectOk },
    ],
    V15: [
        { id: 'o1', label: 'devicesOutsideBase（有基地）', run: runV15Outside },
        { id: 'o2', label: 'devicesOutsideBase（null）', run: runV15OutsideNullRegion },
        { id: 'h1', label: 'hitTestPortAt（單機）', run: runV15HitTest },
        { id: 'h2', label: 'hitTestPortAt prefer（緊貼）', run: runV15HitTestPrefer },
        { id: 'w1', label: 'buildConnectionWaypoints', run: runV15ConnectionWaypoints },
        { id: 'w2', label: 'buildGapConnectionWaypoints', run: runV15GapConnectionWaypoints },
        { id: 'f1', label: 'findPortAt vs hitTestPortAt', run: runV15FindPortAtContrast },
        { id: 'rc1', label: 'resolveConnections（對齊／斷線）', run: runV15ResolveConnections },
    ],
    V16: [
        { id: 's1', label: 'toTopology 映射（不寫 store）', run: runV16TopologyMapping },
        { id: 's2', label: 'setDevicePrimaryOutput（獨立 Pinia）', run: runV16StoreAction },
        { id: 's3', label: 'rotateDevice（獨立 Pinia）', run: runV16RotateDevice },
        {
            id: 's4',
            label: 'addPipeline／removePipeline（獨立 Pinia）',
            run: runV16AddRemovePipeline,
        },
    ],
    V17: [
        { id: 'r1', label: 'resolveMachineDef＋配方鍵', run: runV17Resolve },
        { id: 'e1', label: '引擎 30/min 產線', run: runV17EngineSlice },
        { id: 'h1', label: 'history 情境規則', run: runV17HistoryContext },
    ],
};
</script>

<template>
    <div class="space-y-6 text-gray-900 dark:text-gray-100">
        <header class="space-y-2">
            <h1 class="text-2xl font-bold">L1 契約實驗室（Hub）</h1>
            <p class="max-w-3xl text-sm text-gray-600 dark:text-gray-400">
                本頁是
                L1（底層規則／store）的<strong>查詢＋教學＋可點測</strong>入口：給串接畫布、驗證、引擎——以及
                <strong>較少開發經驗</strong>的協作者——對照「該呼叫誰、鍵是 id
                還是中文名、回傳長怎樣」。 案例跑<strong>真實 API</strong>，結果在下方
                JSON。這<strong>不是</strong>遊戲正式畫面。
            </p>
            <p class="text-xs text-amber-800 dark:text-amber-200">
                DEV ONLY ·
                <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">/dev/l1-contract-lab</code>
                · 不懂名詞先開「詞彙」· 想知道還有哪些 API 開「目錄」
            </p>
        </header>

        <!-- Hub 導覽 -->
        <nav class="flex flex-wrap gap-2">
            <button
                type="button"
                class="rounded-lg px-3 py-1.5 text-sm font-medium"
                :class="navClass('guide')"
                @click="active = 'guide'"
            >
                入門
            </button>
            <button
                type="button"
                class="rounded-lg px-3 py-1.5 text-sm font-medium"
                :class="navClass('glossary')"
                @click="active = 'glossary'"
            >
                詞彙
            </button>
            <button
                type="button"
                class="rounded-lg px-3 py-1.5 text-sm font-medium"
                :class="navClass('inventory')"
                @click="active = 'inventory'"
            >
                目錄
            </button>
            <button
                type="button"
                class="rounded-lg px-3 py-1.5 text-sm font-medium"
                :class="navClass('overview')"
                @click="active = 'overview'"
            >
                總覽
            </button>
            <button
                v-for="b in blocks"
                :key="b.version"
                type="button"
                class="rounded-lg px-3 py-1.5 text-sm font-medium"
                :class="navClass(b.version)"
                @click="active = b.version"
            >
                {{ b.version }}
            </button>
        </nav>

        <!-- 入門：最短路徑 -->
        <section v-if="active === 'guide'" class="space-y-4">
            <div
                class="rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/40"
            >
                <h2 class="text-lg font-semibold">最短路徑（給第一次進來的人）</h2>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    跟完這五步，就知道本頁能幹嘛、正式頁能幹嘛、卡關去哪讀。
                </p>
            </div>
            <ol class="space-y-3">
                <li
                    v-for="s in guideSteps"
                    :key="s.step"
                    class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                    <h3 class="font-semibold">
                        <span
                            class="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white"
                            >{{ s.step }}</span
                        >
                        {{ s.title }}
                    </h3>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ s.detail }}</p>
                </li>
            </ol>
            <div class="flex flex-wrap gap-2 text-sm">
                <button
                    type="button"
                    class="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
                    @click="active = 'glossary'"
                >
                    下一步：看詞彙
                </button>
                <button
                    type="button"
                    class="rounded-lg bg-gray-100 px-3 py-1.5 font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
                    @click="active = 'inventory'"
                >
                    或先看目錄
                </button>
                <a
                    href="/"
                    class="rounded-lg px-3 py-1.5 font-medium text-blue-600 underline dark:text-blue-400"
                    >打開正式頁（另頁）</a
                >
            </div>
            <div class="rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
                <h3 class="mb-2 text-sm font-semibold">後續維運（新 L1 怎麼進本頁）</h3>
                <ul
                    class="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400"
                >
                    <li v-for="(rule, i) in opsRules" :key="i">{{ rule }}</li>
                </ul>
                <p class="mt-2 text-xs text-gray-500">
                    完整規則：<code>docs/aaaaa/dev/dev_v19/E1_ops_rules_and_handoff.md</code>
                </p>
            </div>
            <p class="text-xs text-gray-500">
                長文：USAGE（repo
                <code>docs/aaaaa/dev/USAGE_l1_contract_lab.md</code>）· LAB 指南（
                <code>docs/work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md</code>）
            </p>
        </section>

        <!-- 詞彙 -->
        <section v-else-if="active === 'glossary'" class="space-y-4">
            <div>
                <h2 class="text-lg font-semibold">專有名詞白話</h2>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    左側是文件／程式裡常見的詞；右側用口語解釋。函式名保持英文方便搜尋。完整表見 LAB
                    指南 §2。
                </p>
            </div>
            <ul
                class="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700"
            >
                <li
                    v-for="g in glossary"
                    :key="g.term"
                    class="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(7rem,11rem)_minmax(0,1fr)] sm:gap-x-4 sm:gap-y-0"
                >
                    <div
                        class="shrink-0 text-sm font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100"
                    >
                        {{ g.term }}
                    </div>
                    <p class="min-w-0 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {{ g.meaning }}
                    </p>
                </li>
            </ul>
        </section>

        <!-- 目錄 inventory -->
        <section v-else-if="active === 'inventory'" class="space-y-4">
            <div>
                <h2 class="text-lg font-semibold">L1 API 目錄（Hub inventory）</h2>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    長期邊界：layout utils ＋ layoutStore 公開 action ＋（可選）驗證／引擎。
                    <strong>已列</strong>＝本頁版本表已有說明／可點測；
                    <strong>待列</strong>＝後續週補定義表（本周只掛名）。 目前已列
                    {{ inventoryCounts.listed }}／待列 {{ inventoryCounts.todo }}。
                </p>
            </div>
            <div v-for="group in inventoryByArea" :key="group.area" class="space-y-2">
                <h3 class="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    {{ group.label }}
                </h3>
                <ul
                    class="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700"
                >
                    <li
                        v-for="row in group.rows"
                        :key="`${row.area}-${row.symbol}`"
                        class="flex flex-col gap-1.5 px-3 py-2.5"
                    >
                        <div class="flex min-w-0 flex-wrap items-center gap-2">
                            <span
                                class="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap"
                                :class="
                                    row.status === 'listed'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                        : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                                "
                            >
                                {{ row.status === 'listed' ? '已列' : '待列' }}
                            </span>
                            <code
                                class="min-w-0 font-mono text-xs font-semibold break-all text-blue-700 dark:text-blue-300"
                            >
                                {{ row.symbol }}
                            </code>
                        </div>
                        <code
                            class="block min-w-0 font-mono text-[11px] leading-snug break-all text-gray-500 dark:text-gray-400"
                        >
                            {{ row.module }}
                        </code>
                        <p class="min-w-0 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            {{ row.note }}
                        </p>
                    </li>
                </ul>
            </div>
        </section>

        <!-- 總覽 -->
        <section v-else-if="active === 'overview'" class="space-y-4">
            <ul
                class="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700"
            >
                <li
                    v-for="b in blocks"
                    :key="b.version"
                    class="cursor-pointer px-3 py-2.5 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                    @click="active = b.version"
                >
                    <div class="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span class="shrink-0 text-sm font-semibold whitespace-nowrap">{{
                            b.version
                        }}</span>
                        <span class="min-w-0 text-sm text-gray-900 dark:text-gray-100">{{
                            b.title
                        }}</span>
                        <code
                            class="shrink-0 font-mono text-[11px] whitespace-nowrap text-gray-500"
                            >{{ b.prs }}</code
                        >
                    </div>
                    <p
                        class="mt-1 min-w-0 text-sm leading-relaxed text-gray-600 dark:text-gray-400"
                    >
                        {{ b.oneLiner }}
                    </p>
                </li>
            </ul>

            <div
                class="rounded-lg border border-dashed border-gray-300 p-4 text-sm dark:border-gray-600"
            >
                <h2 class="mb-2 font-semibold">呼叫端速查（誤用對照）</h2>
                <ul class="list-inside list-disc space-y-1 text-gray-600 dark:text-gray-400">
                    <li>
                        新模型 <code>machineType</code>＝<strong>英文 id</strong>；查定義用
                        <code>resolveMachineDef</code>
                    </li>
                    <li>
                        配方鍵仍是 <strong>中文 name</strong>：
                        <code>getRecipesForMachine(def.name, mode)</code>
                    </li>
                    <li>落子預覽＝真落子答案：只信 <code>canPlaceDevice</code> 回傳</li>
                    <li>
                        埠滑鼠熱區＝<code>hitTestPortAt</code>（緊貼埠對埠要傳
                        <code>prefer</code>）；規則錨點＝<code>canConnect</code>／findPortAt
                    </li>
                    <li>
                        連線折線＝<code>buildConnectionWaypoints</code>；間隙通道＝
                        <code>buildGapConnectionWaypoints</code>；寫入＝
                        <code>addPipeline</code>（內含 <code>canConnect</code>）
                    </li>
                    <li>
                        源素材寫 <code>layoutStore.setDevicePrimaryOutput</code>；讀引擎經
                        <code>toTopology</code>
                    </li>
                </ul>
            </div>
        </section>

        <!-- 單版 -->
        <section v-else-if="activeBlock" class="space-y-4">
            <div>
                <h2 class="text-xl font-semibold">
                    {{ activeBlock.version }} · {{ activeBlock.title }}
                </h2>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {{ activeBlock.oneLiner }}
                    <span class="ml-2 font-mono text-xs text-gray-500">{{ activeBlock.prs }}</span>
                </p>
                <a
                    v-if="activeBlock.deeperDemo"
                    :href="activeBlock.deeperDemo.href"
                    class="mt-2 inline-block text-sm text-blue-600 underline dark:text-blue-400"
                    target="_blank"
                    rel="noopener"
                >
                    → {{ activeBlock.deeperDemo.label }}
                </a>
            </div>

            <ul
                class="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700"
            >
                <li
                    v-for="api in activeBlock.apis"
                    :key="api.symbol"
                    class="flex flex-col gap-2 px-3 py-3"
                >
                    <div class="min-w-0 space-y-0.5">
                        <code
                            class="block font-mono text-xs font-semibold break-all text-blue-700 dark:text-blue-300"
                        >
                            {{ api.symbol }}
                        </code>
                        <code
                            class="block font-mono text-[11px] leading-snug break-all text-gray-500 dark:text-gray-400"
                        >
                            {{ api.module }}
                        </code>
                    </div>
                    <dl class="grid gap-1.5 text-sm leading-relaxed">
                        <div class="min-w-0">
                            <dt class="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                用途
                            </dt>
                            <dd class="text-gray-800 dark:text-gray-200">{{ api.purpose }}</dd>
                        </div>
                        <div class="min-w-0">
                            <dt class="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                誰呼叫
                            </dt>
                            <dd class="text-gray-600 dark:text-gray-400">{{ api.callers }}</dd>
                        </div>
                        <div class="min-w-0">
                            <dt
                                class="text-xs font-medium tracking-wide text-red-700/80 uppercase dark:text-red-300/80"
                            >
                                不要
                            </dt>
                            <dd class="text-red-700/90 dark:text-red-300/90">{{ api.dont }}</dd>
                        </div>
                    </dl>
                </li>
            </ul>

            <div>
                <h3 class="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    現場驗證（真實 API）
                </h3>
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="c in playByVersion[activeBlock.version]"
                        :key="c.id"
                        type="button"
                        class="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                        @click="c.run()"
                    >
                        {{ c.label }}
                    </button>
                </div>
            </div>
        </section>

        <!-- 輸出 -->
        <section
            class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60"
        >
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                輸出 · {{ outputTitle }}
            </h3>
            <pre
                class="mt-2 max-h-96 overflow-auto rounded bg-gray-900 p-3 text-xs text-green-300"
                >{{ outputJson }}</pre
            >
        </section>
    </div>
</template>
