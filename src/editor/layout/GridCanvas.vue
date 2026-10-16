<script setup lang="ts">
import { computed, type DeepReadonly } from 'vue';
import type { ScreenPoint } from './useGridViewport';
import { getMachineById } from '@/data/machines';
import type { Position } from '@/types/euclideanSpace';
import type { PlacedDevice, Pipeline } from '@/types/layout';
import { getDeviceOccupiedCells } from '@/utils/layout/deviceOccupancy';
import { deviceSizeFromMachine, toDeviceFootprint } from '@/utils/layout/toFootprint';

/** GridCanvas 的唯讀輸入資料 */
interface Props {
    /** 要顯示的已放置設備 */
    devices: readonly DeepReadonly<PlacedDevice>[];
    /** 要顯示的管線 */
    pipelines: readonly DeepReadonly<Pipeline>[];
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

/** 外部傳入的唯讀佈局資料與畫布尺寸 */
const props = withDefaults(defineProps<Props>(), {
    cellSize: 28,
    viewportWidth: 640,
    viewportHeight: 400,
    offset: () => ({ x: 0, y: 0 }),
    zoom: 1,
    baseSize: null,
    outsideDeviceIds: () => [],
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

/**
 * 以 SVG 本身的顯示矩形換算點擊格點，避免子元素成為 target 時座標漂移。
 *
 * @param event SVG 上的滑鼠點擊事件
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

    for (const device of props.devices) {
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
    <div class="h-full w-full overflow-hidden rounded-lg bg-white dark:bg-zinc-900">
        <svg
            width="100%"
            height="100%"
            :viewBox="`0 0 ${Math.max(1, props.viewportWidth)} ${Math.max(1, props.viewportHeight)}`"
            preserveAspectRatio="none"
            class="block select-none"
            role="img"
            aria-label="格點佈局，選取機器後可點擊格點放置"
            @click="handleCanvasClick"
        >
            <title>格點佈局；按住滑鼠中鍵拖曳可平移</title>

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
                    v-for="device in props.devices"
                    :key="device.id"
                    :data-device-id="device.id"
                    :class="{ 'out-of-base': outsideDevices.has(device.id) }"
                >
                    <title>
                        {{ device.label ?? device.machineType
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
                        class="fill-sky-200 dark:fill-sky-900"
                        :class="
                            outsideDevices.has(device.id)
                                ? 'stroke-red-600 dark:stroke-red-400'
                                : 'stroke-sky-600 dark:stroke-sky-400'
                        "
                        stroke-width="1.5"
                    />
                    <text
                        :x="(device.position.x + 0.5) * props.cellSize"
                        :y="(device.position.y + 0.55) * props.cellSize"
                        text-anchor="middle"
                        class="fill-sky-950 text-[10px] font-semibold dark:fill-sky-100"
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
    </div>
</template>
