<script setup lang="ts">
import { computed, type DeepReadonly } from 'vue';
import type { ScreenPoint } from './useGridViewport';
import { getMachineById } from '@/data/machines';
import type { Position } from '@/types/euclideanSpace';
import type { PlacedDevice, Pipeline, PortRef } from '@/types/layout';
import type { PortMedia } from '@/types/machine';
import { getDeviceOccupiedCells } from '@/utils/layout/deviceOccupancy';
import { deviceSizeFromMachine, toDeviceFootprint } from '@/utils/layout/toFootprint';
import WarningIcon from '@/components/WarningIcon/Index.vue';

/** GridCanvas 的唯讀輸入資料 */
interface Props {
    /** 要顯示的已放置設備 */
    devices: readonly DeepReadonly<PlacedDevice>[];
    /** 要顯示的管線 */
    pipelines: readonly DeepReadonly<Pipeline>[];
    /** L2 依既有衍生連線提供的斷線端點；展示層不自行判定連線是否合法。 */
    readonly disconnectedPipelineEnds?: readonly DisconnectedPipelineEnd[];
    /** L2 已映射的視覺埠點；展示層不讀取機型埠定義或呼叫埠幾何。 */
    readonly ports?: readonly RenderedPort[];
    /** 可見埠圓點的 viewBox 像素半徑；由 L2 同步命中範圍，高亮時不放大。 */
    readonly portRadius?: number;
    /** 容器命中的埠；只控制 highlight，不自行判定手勢或連線是否合法。 */
    readonly highlightedPort?: Readonly<PortRef> | null;
    /** 容器提供的錯誤訊息；本元件只顯示，不決定規則或觸發提交。 */
    readonly connectionFeedback?: string | null;
    /** 本地 draft 的連續格座標與合法狀態；只畫預覽，不將它當作正式管線。 */
    readonly connectionPreview?: {
        /** 尚未提交的線，座標直接表示視覺位置，不額外加半格。 */
        readonly points: readonly Readonly<{
            /** 世界連續格 X 座標，尚未乘上 cellSize。 */
            x: number;
            /** 世界連續格 Y 座標，尚未乘上 cellSize。 */
            y: number;
        }>[];
        /** 非法目標時改以紅色顯示，避免彈窗中斷手勢。 */
        readonly invalid: boolean;
    } | null;
    /** 容器持有的拿起位置；只影響顯示，不改寫已放設備 */
    deviceDragPreview?: {
        /** 被拿起設備的實例識別；查無 ID 時不影響其他設備 */
        readonly deviceId: string;
        /** 尚未提交的格位置 */
        readonly position: Readonly<Position>;
    } | null;
    /** 每一格的像素尺寸 */
    cellSize?: number;
    /** 容器可用寬度，單位為像素 */
    viewportWidth?: number;
    /** 容器可用高度，單位為像素 */
    viewportHeight?: number;
    /** 世界原點在視窗內的像素位置 */
    offset?: ScreenPoint;
    /** 視窗縮放倍率 */
    zoom?: number;
    /** 由容器提供的座標換算；未提供時以目前視窗 props 換算 */
    screenToCell?: (point: ScreenPoint) => Position;
    /** 基地格數；null 表示自由畫布，只接受容器映射的純尺寸 */
    baseSize?: { w: number; h: number } | null;
    /** 容器計算的出界設備識別清單 */
    outsideDeviceIds?: readonly string[];
}

/** 單一設備在 xy 平面上要渲染的佔格 */
interface RenderedDeviceCell {
    /** Vue 列表使用的穩定識別 */
    key: string;
    /** 所屬設備的實例識別 */
    deviceId: string;
    /** 格點的 x 座標 */
    x: number;
    /** 格點的 y 座標 */
    y: number;
}

/** 用於埠繪製的 plain 資料，沿用共用埠身分並明列世界連續格座標。 */
interface RenderedPort extends PortRef {
    /** Vue 列表的穩定識別，避免同設備不同方向或索引互相覆蓋。 */
    readonly key: string;
    /** 展示埠所屬媒質，不在展示層推斷連線規則。 */
    readonly media: PortMedia;
    /** 視覺埠邊心的世界連續格 X 座標，不是螢幕像素。 */
    readonly x: number;
    /** 視覺埠邊心的世界連續格 Y 座標，不是外側錨點格索引。 */
    readonly y: number;
}

/** 管線端點未接上設備時的唯讀展示資料，與驗證系統的設備錯誤分開。 */
interface DisconnectedPipelineEnd {
    /** 所屬管線識別，供穩定渲染與無障礙說明使用。 */
    readonly pipelineId: string;
    /** 未接上的是路徑起點或終點。 */
    readonly endpoint: 'from' | 'to';
    /** 使用既有圖示的媒質配色：belt 黃色、pipe 青色。 */
    readonly media: PortMedia;
    /** 管線外側錨點格；繪製時對齊該格中心，不跟隨設備移動。 */
    readonly position: Readonly<Position>;
}

/** 圖示維持固定 viewBox 像素大小，縮放只改世界位置，不讓警示縮到難以辨識。 */
const WARNING_ICON_SIZE_PX = 18;
/** 圖示放在未連接端點右側，保留間隔以免覆蓋端點與截斷滑鼠操作。 */
const WARNING_ICON_GAP_PX = 6;

/** 外部傳入的唯讀佈局資料與畫布尺寸 */
const props = withDefaults(defineProps<Props>(), {
    cellSize: 28,
    viewportWidth: 640,
    viewportHeight: 400,
    offset: () => ({ x: 0, y: 0 }),
    zoom: 1,
    baseSize: null,
    outsideDeviceIds: () => [],
    deviceDragPreview: null,
    highlightedPort: null,
    connectionPreview: null,
    connectionFeedback: null,
    ports: () => [],
    portRadius: 4,
    disconnectedPipelineEnds: () => [],
});

/** 畫布格點點擊事件；只傳座標，不決定是否放置設備 */
const emit = defineEmits<{
    /** 點擊格點，不在元件內寫入佈局 */
    'cell-click': [position: Position];
}>();

/** 格線與設備使用同一倍率，視窗外的世界座標不受限制 */
const scale = computed(() => props.cellSize * props.zoom);
/** 視窗覆蓋的世界格點範圍，邊緣多畫一圈以避免平移時缺線 */
const visibleRange = computed(() => ({
    left: Math.floor(-props.offset.x / scale.value) - 1,
    top: Math.floor(-props.offset.y / scale.value) - 1,
    right: Math.ceil((props.viewportWidth - props.offset.x) / scale.value) + 1,
    bottom: Math.ceil((props.viewportHeight - props.offset.y) / scale.value) + 1,
}));
/** 僅建立視窗內的垂直線，不按世界或基地大小展開 */
const columns = computed(() =>
    props.viewportWidth > 0 && props.viewportHeight > 0
        ? Array.from(
              { length: visibleRange.value.right - visibleRange.value.left + 1 },
              (_, i) => visibleRange.value.left + i,
          )
        : [],
);
/** 僅建立視窗內的水平線 */
const rows = computed(() =>
    props.viewportWidth > 0 && props.viewportHeight > 0
        ? Array.from(
              { length: visibleRange.value.bottom - visibleRange.value.top + 1 },
              (_, i) => visibleRange.value.top + i,
          )
        : [],
);
/** 格線、設備與管線共同套用的世界轉換 */
const worldTransform = computed(
    () => `translate(${props.offset.x} ${props.offset.y}) scale(${props.zoom})`,
);
/** 以設備識別查詢出界狀態，不改寫任何設備資料 */
const outsideDevices = computed(() => new Set(props.baseSize ? props.outsideDeviceIds : []));
/** 拿起時替換同一台的顯示位置，原位不保留另一份實體或標籤 */
const renderedDevices = computed(() =>
    props.devices.map((device) =>
        device.id === props.deviceDragPreview?.deviceId
            ? { ...device, position: props.deviceDragPreview.position }
            : device,
    ),
);

/**
 * 以 PortRef 三鍵比對，避免同設備的多個埠同時被 highlight。
 * @param port 正在繪製的埠
 * @returns 是否與容器傳入的 highlight 埠完全相符
 * @example
 * isHighlighted({ deviceId: 'src', portType: 'output', portIndex: 1 });
 */
function isHighlighted(port: PortRef): boolean {
    return (
        props.highlightedPort?.deviceId === port.deviceId &&
        props.highlightedPort.portType === port.portType &&
        props.highlightedPort.portIndex === port.portIndex
    );
}

/**
 * 以 SVG 本身的顯示矩形換算點擊格點，避免子元素成為 target 時座標漂移。
 *
 * @param event SVG 上的滑鼠點擊事件
 * @example
 * handleCanvasClick(event);
 */
function handleCanvasClick(event: MouseEvent): void {
    if (event.button !== 0 || props.viewportWidth <= 0 || props.viewportHeight <= 0) return;
    const svg = event.currentTarget as SVGSVGElement | null;
    if (!svg) return;

    const bounds = svg.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    if (
        event.clientX < bounds.left ||
        event.clientX >= bounds.right ||
        event.clientY < bounds.top ||
        event.clientY >= bounds.bottom
    ) {
        return;
    }

    const point = {
        x: ((event.clientX - bounds.left) / bounds.width) * props.viewportWidth,
        y: ((event.clientY - bounds.top) / bounds.height) * props.viewportHeight,
    };
    const position = props.screenToCell?.(point) ?? {
        x: Math.floor((point.x - props.offset.x) / scale.value + 1e-9),
        y: Math.floor((point.y - props.offset.y) / scale.value + 1e-9),
        z: 0,
    };
    emit('cell-click', position);
}

/**
 * 設備在 xy 平面上的佔格；同一設備不同 z 層的相同位置只保留一次。
 */
const deviceCells = computed(() => {
    const result = new Map<string, RenderedDeviceCell[]>();

    for (const device of renderedDevices.value) {
        const machine = getMachineById(device.machineType);
        if (!machine) continue;

        const size = deviceSizeFromMachine(machine);
        const occupiedCells = getDeviceOccupiedCells(toDeviceFootprint(device, size));
        const seenCoordinates = new Set<string>();
        const renderedCells: RenderedDeviceCell[] = [];

        for (const cell of occupiedCells) {
            const coordinate = `${cell.x},${cell.y}`;
            if (seenCoordinates.has(coordinate)) continue;

            seenCoordinates.add(coordinate);
            renderedCells.push({
                key: `${device.id}-${coordinate}`,
                deviceId: device.id,
                x: cell.x,
                y: cell.y,
            });
        }
        result.set(device.id, renderedCells);
    }

    return result;
});

/**
 * 將管線的格點座標轉為通過格子中心的 SVG 折線路徑。
 *
 * @param waypoints 管線依序經過的絕對格點
 * @returns SVG path 的 d attribute；沒有 waypoint 時回傳空字串
 * @example
 * pipelinePath([{ x: 4, y: 3, z: 0 }, { x: 8, y: 3, z: 0 }]);
 */
function pipelinePath(waypoints: DeepReadonly<Pipeline['waypoints']>): string {
    return waypoints
        .map((waypoint, index) => {
            const centerX = (waypoint.x + 0.5) * props.cellSize;
            const centerY = (waypoint.y + 0.5) * props.cellSize;
            return `${index === 0 ? 'M' : 'L'}${centerX} ${centerY}`;
        })
        .join(' ');
}
</script>

<template>
    <div class="relative h-full w-full overflow-hidden rounded-lg bg-white dark:bg-zinc-900">
        <svg
            width="100%"
            height="100%"
            :viewBox="`0 0 ${Math.max(1, props.viewportWidth)} ${Math.max(1, props.viewportHeight)}`"
            preserveAspectRatio="none"
            class="block select-none"
            role="img"
            aria-label="格點佈局，可拖曳埠連線、拖曳設備移位、拖曳空白平移，選取機器後可點擊格點放置"
            @click="handleCanvasClick"
        >
            <title>格點佈局；拖曳埠可連線，拖曳設備可移位，拖曳空白或按住滑鼠中鍵可平移</title>

            <g :transform="worldTransform">
                <!-- 格線 -->
                <g class="stroke-zinc-200 dark:stroke-zinc-700" stroke-width="1">
                    <line
                        v-for="column in columns"
                        :key="`vertical-grid-${column}`"
                        :x1="column * props.cellSize"
                        :y1="visibleRange.top * props.cellSize"
                        :x2="column * props.cellSize"
                        :y2="visibleRange.bottom * props.cellSize"
                    />
                    <line
                        v-for="row in rows"
                        :key="`horizontal-grid-${row}`"
                        :x1="visibleRange.left * props.cellSize"
                        :y1="row * props.cellSize"
                        :x2="visibleRange.right * props.cellSize"
                        :y2="row * props.cellSize"
                    />
                </g>

                <!-- 設備佔格與標籤 -->
                <g
                    v-for="device in renderedDevices"
                    :key="device.id"
                    :data-device-id="device.id"
                    :data-device-dragging="
                        device.id === props.deviceDragPreview?.deviceId || undefined
                    "
                    :class="{ 'out-of-base': outsideDevices.has(device.id) }"
                >
                    <title>
                        {{ device.label ?? device.machineType
                        }}{{ device.id === props.deviceDragPreview?.deviceId ? '：拖曳中' : ''
                        }}{{ outsideDevices.has(device.id) ? '：Error，設備超出基地範圍' : '' }}
                    </title>
                    <rect
                        v-for="cell in deviceCells.get(device.id) ?? []"
                        :key="cell.key"
                        :x="cell.x * props.cellSize + 1"
                        :y="cell.y * props.cellSize + 1"
                        :width="props.cellSize - 2"
                        :height="props.cellSize - 2"
                        rx="3"
                        :class="[
                            device.id === props.deviceDragPreview?.deviceId
                                ? 'fill-sky-300 dark:fill-sky-300'
                                : 'fill-sky-200 dark:fill-sky-900',
                            outsideDevices.has(device.id)
                                ? 'stroke-red-600 dark:stroke-red-400'
                                : 'stroke-sky-600 dark:stroke-sky-400',
                        ]"
                        stroke-width="1.5"
                    />
                    <text
                        :x="(device.position.x + 0.5) * props.cellSize"
                        :y="(device.position.y + 0.55) * props.cellSize"
                        text-anchor="middle"
                        class="text-[10px] font-semibold"
                        :class="
                            device.id === props.deviceDragPreview?.deviceId
                                ? 'fill-sky-950 dark:fill-sky-950'
                                : 'fill-sky-950 dark:fill-sky-100'
                        "
                    >
                        {{ device.label ?? device.machineType }}
                    </text>
                    <text
                        v-if="outsideDevices.has(device.id)"
                        :x="device.position.x * props.cellSize"
                        :y="device.position.y * props.cellSize - 4"
                        class="fill-red-600 text-[12px] dark:fill-red-400"
                    >
                        Error：超出基地
                    </text>
                </g>

                <!-- 管線 -->
                <g v-for="pipeline in props.pipelines" :key="pipeline.id">
                    <path
                        :d="pipelinePath(pipeline.waypoints)"
                        fill="none"
                        class="stroke-emerald-600 dark:stroke-emerald-400"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <circle
                        v-for="(waypoint, waypointIndex) in pipeline.waypoints"
                        :key="`${pipeline.id}-waypoint-${waypointIndex}`"
                        :cx="(waypoint.x + 0.5) * props.cellSize"
                        :cy="(waypoint.y + 0.5) * props.cellSize"
                        r="3.5"
                        class="fill-emerald-600 dark:fill-emerald-400"
                    />
                </g>
                <!-- draft 使用獨立圖層與連續座標，不混入正式 pipelines。 -->
                <polyline
                    v-if="props.connectionPreview"
                    data-connection-preview
                    :data-invalid="props.connectionPreview.invalid"
                    :points="
                        props.connectionPreview.points
                            .map(
                                (point) =>
                                    `${point.x * props.cellSize},${point.y * props.cellSize}`,
                            )
                            .join(' ')
                    "
                    fill="none"
                    :class="
                        props.connectionPreview.invalid ? 'stroke-red-500' : 'stroke-yellow-500'
                    "
                    stroke-width="3"
                    stroke-dasharray="6 4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                    class="pointer-events-none"
                />
                <!-- 埠畫在設備及管線之上；命中由容器統一處理，不讓圓點攔截事件。 -->
                <g class="pointer-events-none" data-ports>
                    <circle
                        v-for="port in props.ports"
                        :key="port.key"
                        :data-port-device="port.deviceId"
                        :data-port-type="port.portType"
                        :data-port-index="port.portIndex"
                        :data-port-media="port.media"
                        :data-port-highlighted="isHighlighted(port) || undefined"
                        :cx="port.x * props.cellSize"
                        :cy="port.y * props.cellSize"
                        :r="props.portRadius / props.zoom"
                        :class="
                            isHighlighted(port)
                                ? props.connectionPreview?.invalid
                                    ? 'fill-red-500'
                                    : 'fill-yellow-400'
                                : port.portType === 'input'
                                  ? 'fill-sky-400'
                                  : 'fill-emerald-400'
                        "
                        class="stroke-zinc-900"
                        stroke-width="1.5"
                        vector-effect="non-scaling-stroke"
                    >
                        <title>
                            {{ port.portType === 'input' ? '輸入' : '輸出' }}埠
                            {{ port.portIndex + 1 }}（{{
                                port.media === 'belt' ? '傳送帶' : '水管'
                            }}）
                        </title>
                    </circle>
                </g>
                <!-- 沿用其他作者交付的驚嘆號元件，只展示 L2 提供的斷線端點。 -->
                <g
                    v-for="end in props.disconnectedPipelineEnds"
                    :key="`${end.pipelineId}-${end.endpoint}`"
                    data-pipeline-warning
                    :data-pipeline-id="end.pipelineId"
                    :data-endpoint="end.endpoint"
                    :data-media="end.media"
                    role="img"
                    :aria-label="`管線 ${end.pipelineId} ${end.endpoint === 'from' ? '起點' : '終點'}未連接設備`"
                    class="pointer-events-none"
                >
                    <title>{{ end.endpoint === 'from' ? '管線起點' : '管線終點' }}未連接設備</title>
                    <WarningIcon
                        :size="WARNING_ICON_SIZE_PX / props.zoom"
                        :color="end.media === 'pipe' ? 'cyan' : 'yellow'"
                        :x="
                            (end.position.x + 0.5) * props.cellSize +
                            WARNING_ICON_GAP_PX / props.zoom
                        "
                        :y="
                            (end.position.y + 0.5) * props.cellSize -
                            WARNING_ICON_SIZE_PX / (2 * props.zoom)
                        "
                    />
                </g>
                <!-- 基地是世界座標框線；不攔截落子，也不限制視角 -->
                <rect
                    v-if="props.baseSize"
                    data-base-region
                    x="0"
                    y="0"
                    :width="props.baseSize.w * props.cellSize"
                    :height="props.baseSize.h * props.cellSize"
                    fill="none"
                    class="pointer-events-none stroke-amber-600 dark:stroke-amber-400"
                    stroke-width="2"
                    stroke-dasharray="8 4"
                    vector-effect="non-scaling-stroke"
                />
            </g>
        </svg>
        <!-- 非彈窗狀態訊息由展示層統一呈現，避免 L2 容器承擔視覺樣式。 -->
        <p
            v-if="props.connectionFeedback"
            role="status"
            class="pointer-events-none absolute top-3 left-3 rounded bg-red-950/90 px-3 py-2 text-sm text-red-100"
        >
            {{ props.connectionFeedback }}
        </p>
    </div>
</template>
