<script setup lang="ts">
import { computed } from 'vue';
import { getMachineById } from '@/data/machines';
import type { PlacedDevice, Pipeline } from '@/types/layout';
import { getDeviceOccupiedCells } from '@/utils/layout/deviceOccupancy';
import { deviceSizeFromMachine, toDeviceFootprint } from '@/utils/layout/toFootprint';

/** GridCanvas 的唯讀輸入資料 */
interface Props {
    /** 要顯示的已放置設備 */
    devices: PlacedDevice[];
    /** 要顯示的管線 */
    pipelines: Pipeline[];
    /** 每一格的像素尺寸 */
    cellSize?: number;
    /** 畫布橫向格數 */
    gridWidth?: number;
    /** 畫布縱向格數 */
    gridHeight?: number;
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
    gridWidth: 12,
    gridHeight: 8,
});

/**
 * 設備在 xy 平面上的佔格；同一設備不同 z 層的相同位置只保留一次。
 */
const deviceCells = computed<RenderedDeviceCell[]>(() => {
    const result: RenderedDeviceCell[] = [];

    for (const device of props.devices) {
        const machine = getMachineById(device.machineType);
        if (!machine) continue;

        const size = deviceSizeFromMachine(machine);
        const occupiedCells = getDeviceOccupiedCells(toDeviceFootprint(device, size));
        const seenCoordinates = new Set<string>();

        for (const cell of occupiedCells) {
            const coordinate = `${cell.x},${cell.y}`;
            if (seenCoordinates.has(coordinate)) continue;

            seenCoordinates.add(coordinate);
            result.push({
                key: `${device.id}-${coordinate}`,
                deviceId: device.id,
                x: cell.x,
                y: cell.y,
            });
        }
    }

    return result;
});

/**
 * 將管線的格點座標轉為通過格子中心的 SVG 折線路徑。
 *
 * @param waypoints 管線依序經過的絕對格點
 * @returns SVG path 的 d attribute；沒有 waypoint 時回傳空字串
 */
function pipelinePath(waypoints: Pipeline['waypoints']): string {
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
    <div
        class="overflow-auto rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
    >
        <svg
            :width="props.gridWidth * props.cellSize"
            :height="props.gridHeight * props.cellSize"
            class="block max-w-none"
            role="img"
            aria-label="只讀格點佈局"
        >
            <title>只讀格點佈局</title>

            <!-- 格線 -->
            <g class="stroke-zinc-200 dark:stroke-zinc-700" stroke-width="1">
                <line
                    v-for="column in props.gridWidth + 1"
                    :key="`vertical-grid-${column}`"
                    :x1="(column - 1) * props.cellSize"
                    y1="0"
                    :x2="(column - 1) * props.cellSize"
                    :y2="props.gridHeight * props.cellSize"
                />
                <line
                    v-for="row in props.gridHeight + 1"
                    :key="`horizontal-grid-${row}`"
                    x1="0"
                    :y1="(row - 1) * props.cellSize"
                    :x2="props.gridWidth * props.cellSize"
                    :y2="(row - 1) * props.cellSize"
                />
            </g>

            <!-- 設備佔格與標籤 -->
            <g>
                <rect
                    v-for="cell in deviceCells"
                    :key="cell.key"
                    :x="cell.x * props.cellSize + 1"
                    :y="cell.y * props.cellSize + 1"
                    :width="props.cellSize - 2"
                    :height="props.cellSize - 2"
                    rx="3"
                    class="fill-sky-200 stroke-sky-600 dark:fill-sky-900 dark:stroke-sky-400"
                    stroke-width="1.5"
                />
                <text
                    v-for="device in props.devices"
                    :key="`device-label-${device.id}`"
                    :x="(device.position.x + 0.5) * props.cellSize"
                    :y="(device.position.y + 0.55) * props.cellSize"
                    text-anchor="middle"
                    class="fill-sky-950 text-[10px] font-semibold dark:fill-sky-100"
                >
                    {{ device.label ?? device.machineType }}
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
        </svg>
    </div>
</template>
