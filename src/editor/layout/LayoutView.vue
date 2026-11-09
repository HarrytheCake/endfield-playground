<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useElementSize, useRafFn } from '@vueuse/core';
import { useGridViewport } from './useGridViewport';
import { onComboTriggered, useComboHeld } from '@/composables/useKeybinding';
import { getMachineById } from '@/data/machines';
import GridCanvas from '@/editor/layout/GridCanvas.vue';
import { usePlacementIntent } from '@/editor/toolbar/usePlacementIntent';
import { useLayoutStore } from '@/store/layoutStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useEditorStore } from '@/store/editorStore';
import { useKeybindingStore } from '@/store/keybindingStore';
import type { Rotation } from '@/types/editor';
import { devicesOutsideBase } from '@/utils/layout/devicesOutsideBase';
import type { Position } from '@/types/euclideanSpace';
import { assessInvolving, canPlaceDevice } from '@/utils/layout/placementCheck';
import { getDeviceOccupiedCells } from '@/utils/layout/deviceOccupancy';
import { deviceSizeFromMachine, toDeviceFootprint } from '@/utils/layout/toFootprint';
import { hitTestPortAt, type PortHitResult } from '@/utils/layout/portHitTest';
import { collectPortAnchors } from '@/utils/layout/portAnchorIndex';
import type { Pipeline, PortDirection, PortRef } from '@/types/layout';
import { getMachineMode, type PortDef } from '@/types/machine';
import { portPointOnMachine, resolveDisplayGrid, rotatePort } from '@/utils/portUtils';
import { canConnect, describeConnectFailure } from '@/utils/layout/connectRules';
import {
    buildConnectionWaypoints,
    buildGapConnectionWaypoints,
    type ConnectionDeviceBounds,
} from '@/utils/layout/connectionWaypoints';

/** 指標手勢僅保存本地快照，不持有可寫的 store 設備參考 */
interface CanvasGesture {
    /** 按下時固定的互動種類，避免快捷鍵先放開後變成落子 */
    kind: 'pan' | 'background' | 'device' | 'connection';
    /** 唯一可更新此手勢的指標 */
    pointerId: number;
    /** 起始按鍵，避免同一滑鼠的其他按鍵釋放時提早提交 */
    button: number;
    /** 接收捕捉的元素；一般左鍵保留 SVG 的 click 路徑 */
    captureTarget: Element;
    /** 按下時的螢幕 X 座標，供像素門檻判斷 */
    startX: number;
    /** 按下時的螢幕 Y 座標，供像素門檻判斷 */
    startY: number;
    /** 上次平移已消費的螢幕 X 座標 */
    lastX: number;
    /** 上次平移已消費的螢幕 Y 座標 */
    lastY: number;
    /** 抓取當下的游標格，與設備原點不同 */
    startCell: Position;
    /** 是否已跨過門檻；回起點後仍維持拖曳身分 */
    moved: boolean;
    /** 設備實例識別；非設備手勢為 null */
    deviceId: string | null;
    /** 設備起始位置的複本，保留原 z 層 */
    devicePosition: Position | null;
}

/** 由 MainLayout 保存單選身分，容器只消費同一份選取資料，不另建旋轉目標。 */
const props = withDefaults(
    defineProps<{
        /** 目前選取的已放置設備；空值時旋轉快捷鍵不執行任何操作。 */
        readonly selectedDeviceId?: string | null;
    }>(),
    { selectedDeviceId: null },
);

/** 提供主畫面唯讀佈局資料及高階快照載入操作 */
const layoutStore = useLayoutStore();
/** 基地選擇僅決定框線與視覺錯誤，不影響放置 action */
const canvasStore = useCanvasStore();
/** 消費頂欄與既有空白鍵快捷鍵共用的工具狀態 */
const editorStore = useEditorStore();
/** 快捷鍵設定面板開啟時暫停旋轉，避免錄製鍵位期間改動佈局。 */
const keybindingStore = useKeybindingStore();
/** 將單選事件交給上層；選取資料的保存由 MainLayout 負責 */
const emit = defineEmits<{
    /** 一般左鍵未拖動時選取設備，空白點擊清除選取 */
    'select-device': [id: string | null];
}>();
/**
 * 出界設備清單，交由 L1 的 devicesOutsideBase 判定，L2 不另算出界幾何。
 * 僅供視覺 Error；不混入 canPlaceDevice 的重疊／無效資料拒絕規則。
 */
const outsideDeviceIds = computed(() =>
    devicesOutsideBase(
        layoutStore.devices.map((device) =>
            device.id === deviceDragPreview.value?.deviceId
                ? { ...device, position: deviceDragPreview.value.position }
                : device,
        ),
        canvasStore.baseRegion,
    ),
);

/**
 * 將 L1 衍生連線中的空端點映射為展示 props；斷線本身合法，不新增驗證錯誤。
 * 每次設備或管線改變時自動重算，重新接上即移除圖示，不寫 store 或歷史。
 */
const disconnectedPipelineEnds = computed(() => {
    /** 以管線識別取得未連接端的既有位置，避免在展示層重新解析連線。 */
    const pipelineById = new Map(layoutStore.pipelines.map((pipeline) => [pipeline.id, pipeline]));
    return layoutStore.connections.flatMap((connection) => {
        /** 過期連線或空路徑不產生沒有座標的圖示。 */
        const pipeline = pipelineById.get(connection.pipelineId);
        if (!pipeline) return [];
        /** 來源與目標各自檢查；一端斷線一個圖示，兩端斷線則各顯示一個。 */
        const ends = [
            { endpoint: 'from' as const, port: connection.from, position: pipeline.waypoints[0] },
            {
                endpoint: 'to' as const,
                port: connection.to,
                position: pipeline.waypoints[pipeline.waypoints.length - 1],
            },
        ];
        return ends.flatMap((end) => {
            if (
                end.port !== null ||
                !end.position ||
                !Number.isFinite(end.position.x) ||
                !Number.isFinite(end.position.y)
            )
                return [];
            return [
                {
                    pipelineId: pipeline.id,
                    endpoint: end.endpoint,
                    media: pipeline.media,
                    position: { ...end.position },
                },
            ];
        });
    });
});

/** 畫布容器與其實際像素尺寸，隨主畫面布局重新量測 */
const container = ref<HTMLElement | null>(null);
/** 容器內容尺寸，不將設備或基地大小當成視窗大小 */
const { width, height } = useElementSize(container);
/** 單一視窗狀態；只影響顯示，不進入 history */
const { offset, zoom, cellSize, panBy, screenToCell } = useGridViewport();
/** 是否正在平移，供容器顯示拖曳游標 */
const panning = ref(false);
/** 手勢門檻以 CSS px 計，不受縮放或格子大小影響 */
const DRAG_THRESHOLD_SQUARED = 16;
/** 拖曳設備的本地預覽；只有正常放開才交由高階 action 提交 */
const deviceDragPreview = ref<{
    /** 被拿起設備的實例識別 */
    readonly deviceId: string;
    /** 尚未提交的顯示格位置 */
    readonly position: Readonly<Position>;
} | null>(null);
/**
 * L2 消費機型與 L1 埠幾何，映射成展示層所需的 plain props。
 * 拖設備時使用本地預覽位置；埠邊心與 hitTestPortAt 使用相同既有工具。
 */
const renderedPorts = computed(() =>
    layoutStore.devices.flatMap((device) => {
        /** 未知機型不產生假埠，保持與 L1 命中函式相同的略過行為。 */
        const machine = getMachineById(device.machineType);
        if (!machine) return [];
        /** 只有被拿起的設備使用本地預覽，其餘設備仍使用原位置。 */
        const position =
            device.id === deviceDragPreview.value?.deviceId
                ? deviceDragPreview.value.position
                : device.position;
        /** 埠列表必須取自設備目前 mode，不能固定使用第一種型態。 */
        const mode = getMachineMode(machine, device.machineMode);
        /** 繪製尺寸與旋轉後邊心共用 L1 的座標契約。 */
        const display = resolveDisplayGrid(machine.width, machine.height, device.rotation);
        /**
         * 將同方向的 PortDef 映射為 plain props，索引仍對應原 mode 陣列。
         * @param ports 目前 mode 的輸入或輸出列表
         * @param portType 所屬方向，作為 PortRef 的一部分
         * @returns 含穩定鍵、媒質及世界連續格座標的埠點
         * @example
         * const inputs = portsFor(mode.input_ports, 'input');
         */
        const portsFor = (ports: readonly PortDef[], portType: PortDirection) =>
            ports.map((port, portIndex) => {
                /** L2 只呼叫共用旋轉函式，不另寫第三套埠定位算法。 */
                const rotated = rotatePort(
                    port.side,
                    port.offset,
                    machine.width,
                    machine.height,
                    device.rotation,
                );
                /** 視覺邊心與熱區圓心同源，與儲存用的外側錨點不同。 */
                const point = portPointOnMachine(
                    rotated.side,
                    rotated.offset,
                    display.widthCells,
                    display.heightCells,
                );
                return {
                    key: `${device.id}-${portType}-${portIndex}`,
                    deviceId: device.id,
                    portType,
                    portIndex,
                    media: port.media,
                    x: position.x + point.x,
                    y: position.y + point.y,
                };
            });
        return [...portsFor(mode.input_ports, 'input'), ...portsFor(mode.output_ports, 'output')];
    }),
);
/** 抑制設備點擊及拖曳產生的落子 click，直到下次有效左鍵按下 */
let suppressPlacementClick = false;
/** 當前手勢的本地快照；結束時先清空再釋放捕捉，避免重入 */
let drag: CanvasGesture | null = null;

/** 游標命中的埠只供畫面回饋；不保存到佈局或操作歷史。 */
const hoveredPort = ref<PortHitResult | null>(null);
/**
 * 尚未完成的連線只保存來源埠與最後 CSS 指標位置。
 * 保存螢幕座標讓鍵盤平移或縮放後可重新換算，避免目標與預覽使用舊格座標。
 */
const connectionDraft = ref<{
    /** 按下時命中的來源；提交時仍須檢查此埠是否存在。 */
    source: PortHitResult;
    /** 最近指標的 CSS X 座標。 */
    clientX: number;
    /** 最近指標的 CSS Y 座標。 */
    clientY: number;
    /** 本地識別供碰撞預檢，直到合法放開才成為正式管線。 */
    pipelineId: string;
} | null>(null);
/** 非彈窗回饋，顯示 L1 拒絕原因；下一次手勢開始時清除。 */
const connectionFeedback = ref<string | null>(null);
/** 旋轉被 L1 拒絕時的非彈窗回饋，下一次指標操作或旋轉時清除。 */
const rotationFeedback = ref<string | null>(null);
/** 狀態文字統一交由展示層顯示，L2 不新增樣式或重複提示元件。 */
const canvasFeedback = computed(() => rotationFeedback.value ?? connectionFeedback.value);

/**
 * 使用既有可設定快捷鍵，旋轉目前已選設備；預設為 R，每次順時針 90 度。
 * 拖曳、拉線、平移與設定面板期間不執行，輸入框過濾由共用鍵盤層負責。
 * 實際變更只呼叫 L1 高階 action，由 L1 自行建立 Command 與歷史。
 */
onComboTriggered(
    'rotateDevice',
    () => {
        if (drag || editorStore.activeTool === 'pan' || keybindingStore.isSettingsPanelOpen) return;
        /** 以目前選取 id 查詢真實設備，設備已移除時不操作其他實例。 */
        const device = layoutStore.devices.find((entry) => entry.id === props.selectedDeviceId);
        if (!device) return;
        rotationFeedback.value = null;
        connectionFeedback.value = null;
        /** Rotation 只允許四種離散值，尺寸與埠換算仍由既有工具處理。 */
        const rotation = ((device.rotation + 1) % 4) as Rotation;
        /** 使用 #79 的 L1 action；重疊仍寫入並由 layoutIssues 標示，不在 L2 阻擋。 */
        const result = layoutStore.rotateDevice(device.id, rotation);
        if (!result.ok) rotationFeedback.value = '設備目前無法旋轉';
    },
    { preventDefault: true },
);

/**
 * 比對 PortRef 的完整身分，避免同設備不同埠被視為同一個端點。
 * @param a 從命中或連線解析取得的埠，可為空
 * @param b 使用者選取的埠
 * @returns 三個識別欄位皆相符時為 true；空值為 false
 * @example
 * samePort(targetPort.value, { deviceId: 'dst', portType: 'input', portIndex: 0 });
 */
function samePort(a: Readonly<PortRef> | null | undefined, b: Readonly<PortRef>): boolean {
    return a?.deviceId === b.deviceId && a.portType === b.portType && a.portIndex === b.portIndex;
}

/** 外側錨點由既有 L1 展開，不在互動層重寫旋轉或格點算法。 */
const portAnchors = computed(() => collectPortAnchors(layoutStore.devices));

/**
 * 從 L2 已映射的埠 props 取得視覺邊心，讓預覽與正式埠點完全同源。
 * 儲存端點仍由 portAnchors 提供，不能以此連續座標提交。
 * @param port 已命中的埠身分
 * @returns 世界連續格座標；設備或埠已不存在時回 null
 * @example
 * const start = visualPortPoint({ deviceId: 'src', portType: 'output', portIndex: 1 });
 */
function visualPortPoint(port: Readonly<PortRef>) {
    /** 埠消失或 mode 移除該索引時回 null，預覽不建立假端點。 */
    const point = renderedPorts.value.find((entry) => samePort(entry, port));
    return point ? { x: point.x, y: point.y } : null;
}

/** 目標每次隨游標與 viewport 重算，空白或畫布外不會吸附最近埠。 */
const targetPort = computed(() =>
    connectionDraft.value ? portAt(connectionDraft.value, 'input') : null,
);

/**
 * 取得端點設備在畫面上的整數格範圍，供固定折線選擇兩設備間的空隙。
 * 旋轉後尺寸只消費 L1 工具；不自行判定碰撞或規劃繞障路徑。
 * @param deviceId 來源或目標設備識別
 * @returns 含邊界格的 xy 範圍；設備或機型不存在時回 null
 * @example
 * const sourceBounds = connectionDeviceBounds('src');
 */
function connectionDeviceBounds(deviceId: string): ConnectionDeviceBounds | null {
    /** 提交候選依目前 store 查詢，不沿用起拖前的過期位置。 */
    const device = layoutStore.devices.find((entry) => entry.id === deviceId);
    if (!device) return null;
    /** 未知機型不能推導出可安全使用的空隙。 */
    const machine = getMachineById(device.machineType);
    if (!machine) return null;
    /** 與埠渲染共用旋轉後尺寸，避免非正方設備在 90 度時算錯範圍。 */
    const display = resolveDisplayGrid(machine.width, machine.height, device.rotation);
    return {
        left: device.position.x,
        right: device.position.x + display.widthCells - 1,
        top: device.position.y,
        bottom: device.position.y + display.heightCells - 1,
    };
}

/**
 * 目標命中後才建立候選管線，先後呼叫 L1 語意與碰撞預檢。
 * 優先沿用單轉角；若穿過端點設備，僅在兩設備間空隙採固定雙轉角。
 * 不搜尋繞開第三台設備或既有管線的路徑；所有結果仍只在本地。
 */
const connectionCandidate = computed(() => {
    /** 本次手勢的來源快照；空值表示沒有待提交互動。 */
    const draft = connectionDraft.value;
    /** 目標依目前視角與游標重算，避免保存過期的目標埠。 */
    const target = targetPort.value;
    if (!draft || !target) return null;
    /** 起點必須由同一個 PortRef 查到既有 L1 外側錨點。 */
    const start = portAnchors.value.find((entry) => samePort(entry.ref, draft.source));
    /** 終點同樣以 PortRef 查找，不能將視覺邊心直接儲存為管線端點。 */
    const end = portAnchors.value.find((entry) => samePort(entry.ref, target));
    if (!start || !end) return null;
    /** 現有領域慣例：belt 在地面層，pipe 在上層；整條管線不沿 z 位移。 */
    const z = draft.source.media === 'pipe' ? 1 : 0;
    /** 將外側整數錨點與來源方位映射為純資料，不在容器中計算折點。 */
    const sourceAnchor = { position: { x: start.x, y: start.y, z }, side: draft.source.side };
    /** 與來源共用媒質層，純函式自行建立輸出副本。 */
    const targetAnchor = { position: { x: end.x, y: end.y, z }, side: target.side };
    /** 幾何由純函式生成，語意與碰撞仍依原順序預檢。 */
    const waypoints = buildConnectionWaypoints(sourceAnchor, targetAnchor);
    /** 候選管線只供預檢；唯一寫入入口仍是 pointerup 的高階 action。 */
    const pipeline: Pipeline = { id: draft.pipelineId, media: draft.source.media, waypoints };
    /** 將深唯讀 waypoints 轉為本地副本，不修改 store 或以型別強制轉換繞過契約。 */
    const layout = {
        devices: layoutStore.devices,
        pipelines: layoutStore.pipelines.map((item) => ({
            ...item,
            waypoints: item.waypoints.map((point) => ({ ...point })),
        })),
    };
    /** 方向、媒質、埠佔用與自連規則全部交由 L1 判定。 */
    const semantic = canConnect(pipeline, layout);
    if (!semantic.ok) return { pipeline, ok: false, message: describeConnectFailure(semantic) };
    /** L1 允許斷線及同格埠決勝；UI 必須保證解析結果正是使用者選取的兩埠。 */
    if (!samePort(semantic.from, draft.source) || !samePort(semantic.to, target)) {
        return { pipeline, ok: false, message: '管線端點未對上選取的輸出埠與輸入埠' };
    }
    /** 路徑碰撞預檢不寫 store 或歷史，並且只關心本次新增的管線。 */
    const placement = assessInvolving(
        layout.devices,
        [...layout.pipelines, pipeline],
        new Set([pipeline.id]),
    );
    if (
        !placement.ok &&
        placement.reason === 'overlap' &&
        placement.conflicts.every((conflict) =>
            conflict.every(
                (id) =>
                    id === pipeline.id || id === draft.source.deviceId || id === target.deviceId,
            ),
        )
    ) {
        /** 僅修正原折線穿越端點設備的情況；其他障礙不得觸發改道。 */
        const sourceBounds = connectionDeviceBounds(draft.source.deviceId);
        /** 兩端都必須仍存在，才能判定設備間確實有空隙。 */
        const targetBounds = connectionDeviceBounds(target.deviceId);
        if (sourceBounds && targetBounds) {
            /** 只呼叫純幾何函式，是否採用替代路徑仍由既有碰撞預檢決定。 */
            const gapWaypoints = buildGapConnectionWaypoints(
                sourceAnchor,
                targetAnchor,
                sourceBounds,
                targetBounds,
            );
            if (gapWaypoints) {
                /** 保留同一對埠、媒質與 id，只替換本地預覽路徑。 */
                const gapPipeline: Pipeline = { ...pipeline, waypoints: gapWaypoints };
                /** 仍由 L1 檢查整條折線；空隙中的第三台設備或既有線會正常拒絕。 */
                const gapPlacement = assessInvolving(
                    layout.devices,
                    [...layout.pipelines, gapPipeline],
                    new Set([pipeline.id]),
                );
                if (gapPlacement.ok) return { pipeline: gapPipeline, ok: true, message: null };
            }
        }
    }
    return {
        pipeline,
        ok: placement.ok,
        message: placement.ok
            ? null
            : placement.reason === 'overlap'
              ? '管線路徑與現有設備或管線重疊'
              : '管線路徑無效',
    };
});

/**
 * 預覽將外側錨點格心接回可見埠點；儲存時只使用 candidate 的整數格路徑。
 * 未命中目標用直線跟隨指標，命中後預覽真正將提交的正交路徑。
 */
const connectionPreview = computed(() => {
    /** 只讀取目前 local ref；結束手勢後此預覽自然回 null。 */
    const draft = connectionDraft.value;
    if (!draft) return null;
    /** 使用視覺邊心起線，避免預覽與埠點間產生半格間隙。 */
    const start = visualPortPoint(draft.source);
    /** 命中時貼齊目標埠，否則跟隨連續格游標位置。 */
    const end =
        (targetPort.value && visualPortPoint(targetPort.value)) ?? pointerPortPosition(draft);
    /** 候選帶有真正的儲存路徑與拒絕狀態，僅用於顯示。 */
    const candidate = connectionCandidate.value;
    return start && end
        ? {
              points: candidate
                  ? [
                        start,
                        ...candidate.pipeline.waypoints.map((point) => ({
                            x: point.x + 0.5,
                            y: point.y + 0.5,
                        })),
                        end,
                    ]
                  : [start, end],
              invalid: !!targetPort.value && !candidate?.ok,
          }
        : null;
});
/** 拉線時只 highlight 目標；閒置時使用一般 hover 埠。 */
const highlightedPort = computed(() =>
    connectionDraft.value ? targetPort.value : hoveredPort.value,
);
/** 可見埠圓點的 viewBox 像素半徑；同時傳給展示層，命中不再擴大到附近。 */
const PORT_DOT_RADIUS_PX = 4;

/**
 * 將指標轉為連續世界格座標，專供埠邊心命中及 draft 跟隨。
 * SVG 使用 preserveAspectRatio=none，兩軸須各自由實際矩形換算。
 * @param event 螢幕座標；移動畫面後可用相同座標重新命中
 * @returns 連續格座標；未量測或在畫布外時回 null
 * @example
 * const point = pointerPortPosition({ clientX: 200, clientY: 180 });
 */
function pointerPortPosition(event: Pick<PointerEvent, 'clientX' | 'clientY'>) {
    /** 使用 SVG 的實際顯示矩形，避免子元素或 CSS 尺寸造成偏移。 */
    const bounds = container.value?.querySelector('svg')?.getBoundingClientRect();
    if (
        !bounds ||
        bounds.width <= 0 ||
        bounds.height <= 0 ||
        width.value <= 0 ||
        height.value <= 0
    ) {
        return null;
    }
    if (
        event.clientX < bounds.left ||
        event.clientX >= bounds.right ||
        event.clientY < bounds.top ||
        event.clientY >= bounds.bottom
    )
        return null;
    /** 每格的 viewBox 像素尺寸，連續格換算不作整數取整。 */
    const scale = cellSize * zoom.value;
    return {
        x: (((event.clientX - bounds.left) / bounds.width) * width.value - offset.value.x) / scale,
        y: (((event.clientY - bounds.top) / bounds.height) * height.value - offset.value.y) / scale,
    };
}

/**
 * 呼叫 L1 命中判定，依使用者要求將範圍限制在可見圓點內。
 * 半徑與展示層共用；方向偏好只用於等距決勝，不會略過不合法方向。
 * @param event 指標的 CSS 螢幕座標
 * @param prefer 起拖偏好 output，落點偏好 input
 * @returns L1 命中結果；畫布外或熱區未命中時回 null
 * @example
 * const hit = portAt({ clientX: 200, clientY: 180 }, 'output');
 */
function portAt(event: Pick<PointerEvent, 'clientX' | 'clientY'>, prefer: 'input' | 'output') {
    /** SVG 已換算成連續格，使用相同倍率將可見圓點半徑轉成格單位。 */
    const point = pointerPortPosition(event);
    return point
        ? hitTestPortAt(point, layoutStore.devices, undefined, {
              prefer,
              hitRadiusCells: PORT_DOT_RADIUS_PX / (cellSize * zoom.value),
          })
        : null;
}

/**
 * 離開畫布時清掉本地 hover；捕捉中的手勢由自身 move/end 流程處理。
 * @example
 * handlePointerLeave();
 */
function handlePointerLeave(): void {
    if (!drag) hoveredPort.value = null;
}

/**
 * 使用實際 SVG 矩形換算 viewBox 像素，與 GridCanvas 的 click 換算一致。
 * @param event 具有螢幕座標的指標事件
 * @returns 世界格座標；畫布尚未量測或已卸載時回 null
 * @example
 * const cell = pointerCell(event);
 */
function pointerCell(event: PointerEvent): Position | null {
    const bounds = container.value?.querySelector('svg')?.getBoundingClientRect();
    if (
        !bounds ||
        bounds.width <= 0 ||
        bounds.height <= 0 ||
        width.value <= 0 ||
        height.value <= 0
    ) {
        return null;
    }
    return screenToCell({
        x: ((event.clientX - bounds.left) / bounds.width) * width.value,
        y: ((event.clientY - bounds.top) / bounds.height) * height.value,
    });
}

/**
 * 按繪製順序反向命中可見佔格；多 z 層設備仍以 xy 投影選取。
 * @param position 游標所在格；z 不作為畫面命中限制
 * @returns 最上層命中的設備，未知機型略過
 * @example
 * const device = deviceAt({ x: 4, y: 3, z: 0 });
 */
function deviceAt(position: Position) {
    return [...layoutStore.devices].reverse().find((device) => {
        const machine = getMachineById(device.machineType);
        if (!machine) return false;
        return getDeviceOccupiedCells(
            toDeviceFootprint(device, deviceSizeFromMachine(machine)),
        ).some((cell) => cell.x === position.x && cell.y === position.y);
    });
}

/**
 * 明確平移優先；一般左鍵依序判斷埠、設備體、空白，手勢開始後不換種類。
 * @param event 容器收到的按下事件，其他按鍵及並行指標不啟動手勢
 * @example
 * handlePointerDown(event);
 */
function handlePointerDown(event: PointerEvent): void {
    if (drag || (event.button !== 0 && event.button !== 1)) return;
    const svg = event.target instanceof Element ? event.target.closest('svg') : null;
    if (!(svg instanceof SVGSVGElement) || !container.value?.contains(svg)) return;
    const position = pointerCell(event);
    if (!position) return;

    const explicitPan = event.button === 1 || editorStore.activeTool === 'pan';
    const port = explicitPan ? null : portAt(event, 'output');
    const device = explicitPan || port ? undefined : deviceAt(position);
    const kind = explicitPan ? 'pan' : port ? 'connection' : device ? 'device' : 'background';
    const captureTarget = explicitPan ? container.value : svg;
    if (explicitPan) event.preventDefault();
    suppressPlacementClick = kind !== 'background';
    panning.value = explicitPan;
    hoveredPort.value = null;
    connectionFeedback.value = null;
    rotationFeedback.value = null;
    if (port)
        connectionDraft.value = {
            source: port,
            clientX: event.clientX,
            clientY: event.clientY,
            pipelineId: crypto.randomUUID(),
        };
    drag = {
        kind,
        pointerId: event.pointerId,
        button: event.button,
        captureTarget,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        startCell: position,
        moved: false,
        deviceId: device?.id ?? null,
        devicePosition: device ? { ...device.position } : null,
    };
    captureTarget.setPointerCapture(event.pointerId);
}

/**
 * 更新視角、本地設備預覽或連線 draft，不修改佈局及歷史。
 * 設備與空白拖曳跨過門檻才啟動，埠預覽則自按下起立即跟隨。
 * @param event 起始指標的移動事件；放開時也用它消費最後一段位移
 * @example
 * handlePointerMove(event);
 */
function handlePointerMove(event: PointerEvent): void {
    if (!drag) {
        hoveredPort.value = editorStore.activeTool === 'pan' ? null : portAt(event, 'output');
        return;
    }
    if (event.pointerId !== drag.pointerId) return;
    /** 埠手勢不套設備的 4 px 門檻；從按下起就顯示本地 draft。 */
    if (drag.kind === 'connection' && connectionDraft.value) {
        connectionDraft.value = {
            ...connectionDraft.value,
            clientX: event.clientX,
            clientY: event.clientY,
        };
        return;
    }
    if (!drag.moved) {
        drag.moved =
            (event.clientX - drag.startX) ** 2 + (event.clientY - drag.startY) ** 2 >=
            DRAG_THRESHOLD_SQUARED;
    }
    if (drag.kind === 'pan' || (drag.kind === 'background' && drag.moved)) {
        suppressPlacementClick = true;
        panning.value = true;
        panBy(event.clientX - drag.lastX, event.clientY - drag.lastY);
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
    } else if (drag.kind === 'device' && drag.moved && drag.deviceId && drag.devicePosition) {
        const position = pointerCell(event);
        if (!position) return;
        deviceDragPreview.value = {
            deviceId: drag.deviceId,
            position: {
                x: drag.devicePosition.x + position.x - drag.startCell.x,
                y: drag.devicePosition.y + position.y - drag.startCell.y,
                z: drag.devicePosition.z,
            },
        };
    }
}

/**
 * 結束本地手勢並釋放指標捕捉，不修改佈局或歷史。
 * 先清空狀態再釋放捕捉，避免 lostpointercapture 重入造成第二次提交。
 * @example
 * clearGesture();
 */
function clearGesture(): void {
    const previous = drag;
    drag = null;
    panning.value = false;
    deviceDragPreview.value = null;
    connectionDraft.value = null;
    hoveredPort.value = null;
    if (previous?.captureTarget.hasPointerCapture(previous.pointerId)) {
        previous.captureTarget.releasePointerCapture(previous.pointerId);
    }
}

/**
 * 正常釋放與取消採不同路徑，取消不消費最後座標或產生點擊。
 * 合法 pointerup 呼叫一次高階 action，由 action 自行建立歷史；取消不寫 store。
 * @param event 指標釋放、取消或失去捕捉事件
 * @example
 * handlePointerEnd(event);
 */
function handlePointerEnd(event: PointerEvent): void {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (event.type === 'pointerup') {
        if (event.button !== drag.button) return;
        handlePointerMove(event);
        const preview = deviceDragPreview.value;
        const original = drag.devicePosition;
        if (drag.kind === 'connection') {
            /** 正常放開是唯一提交入口；取消與失去捕捉不會走此分支。 */
            const candidate = connectionCandidate.value;
            if (candidate?.ok) {
                const result = layoutStore.addPipeline(candidate.pipeline);
                /** Action 仍有最後檢查，預檢成功不可當作 action 必然成功。 */
                if (!result.ok)
                    connectionFeedback.value =
                        result.reason === 'overlap'
                            ? '管線路徑與現有設備或管線重疊'
                            : '管線建立失敗，請重新連接';
            } else if (candidate) {
                connectionFeedback.value = candidate.message;
            }
        } else if (drag.kind === 'device' && drag.moved && preview && original) {
            if (preview.position.x !== original.x || preview.position.y !== original.y) {
                layoutStore.moveDevice(preview.deviceId, { ...preview.position });
            }
        } else if (drag.kind !== 'pan' && !drag.moved) {
            const bounds = container.value?.querySelector('svg')?.getBoundingClientRect();
            const inside =
                bounds &&
                event.clientX >= bounds.left &&
                event.clientX < bounds.right &&
                event.clientY >= bounds.top &&
                event.clientY < bounds.bottom;
            if (inside) {
                emit('select-device', drag.deviceId);
            } else {
                suppressPlacementClick = true;
            }
        }
    } else {
        suppressPlacementClick = true;
    }
    clearGesture();
}

/** 卸載時結束本地手勢；DOM 移除前主動釋放指標捕捉 */
onBeforeUnmount(() => {
    clearGesture();
});

/** 鍵盤平移速度（CSS px／秒），四個方向共用；沿用舊畫布的手感 */
const KEY_PAN_SPEED_PER_SECOND = 600;

/** 畫面平移鍵（預設 WASD，可於快捷鍵設定改鍵）的按住狀態：上／下／左／右 */
const panUpHeld = useComboHeld('panUp');
const panDownHeld = useComboHeld('panDown');
const panLeftHeld = useComboHeld('panLeft');
const panRightHeld = useComboHeld('panRight');

/** 是否有任一平移方向鍵按住中，控制下方 raf loop 的啟停 */
const keyPanning = computed(
    () => panUpHeld.value || panDownHeld.value || panLeftHeld.value || panRightHeld.value,
);

/**
 * 按住平移鍵時每幀依 delta time 位移視窗，讓移動速度與幀率無關。  \
 * 方向語意：上／左＝視角往該方向移動（看到更上／左方的內容），故內容往下／右，offset 增加。
 */
const { pause: pauseKeyPan, resume: resumeKeyPan } = useRafFn(
    ({ delta }) => {
        const distance = (KEY_PAN_SPEED_PER_SECOND * delta) / 1000;
        let dx = 0;
        let dy = 0;
        if (panUpHeld.value) dy += distance;
        if (panDownHeld.value) dy -= distance;
        if (panLeftHeld.value) dx += distance;
        if (panRightHeld.value) dx -= distance;
        if (dx === 0 && dy === 0) return;
        panBy(dx, dy);
    },
    { immediate: false },
);

/** 僅在至少一個方向鍵按住時啟動 raf loop，放開後暫停，避免長期空轉 */
watch(keyPanning, (held) => {
    if (held) resumeKeyPan();
    else pauseKeyPan();
});

/** 工具列與畫布共享的真機器落子意圖 */
const { armedMachineId } = usePlacementIntent();

/**
 * 格點點擊時先預檢，再以高階 action 新增真機器；成功後保留意圖供連續落子。
 *
 * @param position 由 GridCanvas 換算的格點座標
 * @example
 * handleCellClick({ x: 3, y: 3, z: 0 });
 */
function handleCellClick(position: Position): void {
    if (drag || suppressPlacementClick || editorStore.activeTool === 'pan') return;
    const machineType = armedMachineId.value;
    if (!machineType) return;

    const machine = getMachineById(machineType);
    if (!machine) return;

    const precheck = canPlaceDevice(
        { machineType, position, rotation: 0 },
        { devices: layoutStore.devices, pipelines: layoutStore.pipelines },
    );
    if (!precheck.ok) return;

    const placement = layoutStore.addDevice({
        id: crypto.randomUUID(),
        machineType,
        position,
        rotation: 0,
        label: machine.name,
    });
    if (!placement.ok) return;
}

/**
 * V17-H1／#58：正式頁**不**在掛載時自動 `loadSnapshot(connected)`。
 * 示範快照屬 dev 用途（如 layout-store-preview）；空畫布驗收改靠手動放置。
 * 歷史情境隔離見 V17-H2。
 */
</script>

<template>
    <div
        ref="container"
        class="relative h-full w-full touch-none overflow-hidden"
        :class="
            panning || deviceDragPreview
                ? 'cursor-grabbing'
                : editorStore.activeTool === 'pan'
                  ? 'cursor-grab'
                  : connectionDraft || highlightedPort
                    ? 'cursor-crosshair'
                    : ''
        "
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerEnd"
        @pointercancel="handlePointerEnd"
        @lostpointercapture="handlePointerEnd"
        @pointerleave="handlePointerLeave"
    >
        <GridCanvas
            :devices="layoutStore.devices"
            :pipelines="layoutStore.pipelines"
            :disconnected-pipeline-ends="disconnectedPipelineEnds"
            :viewport-width="width"
            :viewport-height="height"
            :cell-size="cellSize"
            :offset="offset"
            :zoom="zoom"
            :screen-to-cell="screenToCell"
            :base-size="canvasStore.canvasSize"
            :outside-device-ids="outsideDeviceIds"
            :device-drag-preview="deviceDragPreview"
            :highlighted-port="highlightedPort"
            :connection-preview="connectionPreview"
            :connection-feedback="canvasFeedback"
            :ports="renderedPorts"
            :port-radius="PORT_DOT_RADIUS_PX"
            @cell-click="handleCellClick"
        />
    </div>
</template>
