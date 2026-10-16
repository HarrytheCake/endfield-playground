<script setup lang="ts">
/**
 * `/dev/pipeline-polyline` —— buildPipelinePolyline 展示頁（W0921-H1）
 *
 * 純展示：waypoints 全部自己 mock（預設範例或滑鼠點格新增），**不 import**
 * `GridCanvas.vue`（toby 本週的門檻檔）、**不 import** 任何 Pinia store。
 *
 * 平移：中鍵拖曳；縮放：滾輪（皆沿用 `useGridViewport`，跟 `GridViewportDemo.vue` 同寫法）。  \
 * 左鍵點格：在目前路徑後面新增一個 waypoint（吸附到格線交點）。
 */
import { computed, ref } from 'vue';
import { useGridViewport, type ScreenPoint } from '@/editor/layout/useGridViewport';
import { buildPipelinePolyline } from '@/utils/layout/pipelinePolyline';
import type { Position } from '@/types/euclideanSpace';

/** 展示用虛擬格線範圍（格） */
const VIRTUAL_GRID_SIZE = 24;

/** 本頁的格點視窗狀態與操作函式，見 `useGridViewport` 的型別與註解 */
const viewport = useGridViewport();

/** SVG 畫布容器的 DOM 參照，事件座標需相對於它算，而非整個視窗 */
const svgRef = ref<SVGSVGElement | null>(null);

/** 中鍵拖曳中的起始螢幕座標；非拖曳中為 null */
const dragStart = ref<ScreenPoint | null>(null);

/** 預先準備好的範例路徑；點按下方按鈕即可切換，方便快速看到各種案例 */
const PRESETS: Record<string, Position[]> = {
    直線: [
        { x: 2, y: 4, z: 0 },
        { x: 14, y: 4, z: 0 },
    ],
    單一直角: [
        { x: 2, y: 2, z: 0 },
        { x: 10, y: 2, z: 0 },
        { x: 10, y: 8, z: 0 },
    ],
    多次轉折: [
        { x: 1, y: 1, z: 0 },
        { x: 8, y: 1, z: 0 },
        { x: 8, y: 6, z: 0 },
        { x: 14, y: 6, z: 0 },
        { x: 14, y: 12, z: 0 },
    ],
    含違規斜線: [
        { x: 1, y: 1, z: 0 },
        { x: 6, y: 1, z: 0 },
        { x: 10, y: 5, z: 0 },
        { x: 10, y: 10, z: 0 },
    ],
};

/** 目前展示中的 waypoints；預設載入第一組範例 */
const waypoints = ref<Position[]>(PRESETS['直線'].map((p) => ({ ...p })));

/** 套用 `buildPipelinePolyline` 的結果：逐段方向、轉角、整體是否合法 */
const polyline = computed(() => buildPipelinePolyline(waypoints.value));

/**
 * 由原生滑鼠事件換算出相對於 SVG 容器左上角的螢幕座標。
 * @param event 原生滑鼠事件
 */
function toLocalPoint(event: MouseEvent): ScreenPoint {
    const rect = svgRef.value?.getBoundingClientRect();
    return {
        x: event.clientX - (rect?.left ?? 0),
        y: event.clientY - (rect?.top ?? 0),
    };
}

/**
 * 中鍵按下時記錄拖曳起點；左鍵留給「點格新增 waypoint」。
 * @param event 原生滑鼠按下事件
 */
function handlePointerDown(event: MouseEvent) {
    if (event.button !== 1) return;
    event.preventDefault();
    dragStart.value = toLocalPoint(event);
}

/**
 * 拖曳中依滑鼠位移量呼叫 `panBy()`。
 * @param event 原生滑鼠移動事件
 */
function handlePointerMove(event: MouseEvent) {
    if (!dragStart.value) return;
    const point = toLocalPoint(event);
    viewport.panBy(point.x - dragStart.value.x, point.y - dragStart.value.y);
    dragStart.value = point;
}

/** 放開中鍵或滑鼠移出畫布時結束拖曳 */
function handlePointerUp() {
    dragStart.value = null;
}

/**
 * 滾輪縮放，以游標位置為錨點；往上滾放大、往下滾縮小。
 * @param event 原生滾輪事件
 */
function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const anchor = toLocalPoint(event);
    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    viewport.zoomBy(anchor, factor);
}

/**
 * 左鍵點擊畫布：把點擊處吸附到最近的格線交點，加進 waypoints 尾端。
 * @param event 原生滑鼠點擊事件
 */
function handleClick(event: MouseEvent) {
    const cell = viewport.screenToCell(toLocalPoint(event));
    waypoints.value = [...waypoints.value, cell];
}

/** 套用一組預設範例，取代目前的 waypoints */
function loadPreset(name: string) {
    waypoints.value = PRESETS[name].map((p) => ({ ...p }));
}

/** 移除最後一個 waypoint */
function undoLastPoint() {
    waypoints.value = waypoints.value.slice(0, -1);
}

/** 清空所有 waypoints */
function clearAll() {
    waypoints.value = [];
}

/** 套用在虛擬格線 `<g>` 上的 transform 字串，讀 viewport 的 offset／zoom 組出 */
const gridTransform = computed(
    () =>
        `translate(${viewport.offset.value.x}, ${viewport.offset.value.y}) scale(${viewport.zoom.value})`,
);

/** 虛擬格線的座標軸範圍（0 到 VIRTUAL_GRID_SIZE），供 v-for 畫線 */
const gridLines = Array.from({ length: VIRTUAL_GRID_SIZE + 1 }, (_, i) => i);

/**
 * 把格子座標轉成格線交點的螢幕座標，供畫線／畫點使用（用 `cellSize` 直接乘，
 * 對齊 `viewport.cellToScreen` 對「該格左上角」的定義，交點與格角座標數值相同）。
 * @param cell 格子座標
 */
function toPoint(cell: Position): { x: number; y: number } {
    return { x: cell.x * viewport.cellSize, y: cell.y * viewport.cellSize };
}
</script>

<template>
    <div class="space-y-4">
        <header>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                管線折線展示（W0921-H1）
            </h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                <code>buildPipelinePolyline</code>
                的逐段方向／轉角／違規標記演示。中鍵拖曳平移，滾輪縮放；左鍵點格新增 waypoint。
            </p>
        </header>

        <div class="flex flex-wrap gap-2 text-sm">
            <button
                v-for="name in Object.keys(PRESETS)"
                :key="name"
                type="button"
                class="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                @click="loadPreset(name)"
            >
                {{ name }}
            </button>
            <button
                type="button"
                class="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                @click="undoLastPoint"
            >
                回退一點
            </button>
            <button
                type="button"
                class="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                @click="clearAll"
            >
                清空
            </button>
            <button
                type="button"
                class="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                @click="viewport.reset()"
            >
                重置視窗
            </button>
        </div>

        <div class="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
            <span>waypoints: {{ waypoints.length }}</span>
            <span>segments: {{ polyline.segments.length }}</span>
            <span>corners: {{ polyline.corners.length }}</span>
            <span :class="polyline.valid ? 'text-emerald-600' : 'text-red-600'">
                valid: {{ polyline.valid }}
            </span>
        </div>

        <svg
            ref="svgRef"
            width="100%"
            height="480"
            class="block rounded-lg border border-gray-200 bg-white select-none dark:border-gray-700 dark:bg-gray-900"
            role="img"
            aria-label="管線折線展示畫布"
            @mousedown="handlePointerDown"
            @mousemove="handlePointerMove"
            @mouseup="handlePointerUp"
            @mouseleave="handlePointerUp"
            @wheel="handleWheel"
            @click="handleClick"
            @contextmenu.prevent
        >
            <g :transform="gridTransform">
                <g stroke="#e5e7eb" stroke-width="1">
                    <line
                        v-for="x in gridLines"
                        :key="`vx-${x}`"
                        :x1="x * viewport.cellSize"
                        y1="0"
                        :x2="x * viewport.cellSize"
                        :y2="VIRTUAL_GRID_SIZE * viewport.cellSize"
                    />
                    <line
                        v-for="y in gridLines"
                        :key="`hy-${y}`"
                        x1="0"
                        :y1="y * viewport.cellSize"
                        :x2="VIRTUAL_GRID_SIZE * viewport.cellSize"
                        :y2="y * viewport.cellSize"
                    />
                </g>

                <!-- 折線段：非軸對齊（違規）標紅，其餘標藍 -->
                <line
                    v-for="(segment, i) in polyline.segments"
                    :key="`seg-${i}`"
                    :x1="toPoint(segment.from).x"
                    :y1="toPoint(segment.from).y"
                    :x2="toPoint(segment.to).x"
                    :y2="toPoint(segment.to).y"
                    :stroke="segment.axisAligned ? '#0284c7' : '#dc2626'"
                    stroke-width="3"
                    stroke-linecap="round"
                />

                <!-- 轉角：直角為實心藍點，非直角（斜線參與）為空心紅點 -->
                <circle
                    v-for="(corner, i) in polyline.corners"
                    :key="`corner-${i}`"
                    :cx="toPoint(corner.at).x"
                    :cy="toPoint(corner.at).y"
                    r="5"
                    :fill="corner.rightAngle ? '#0284c7' : 'none'"
                    :stroke="corner.rightAngle ? 'none' : '#dc2626'"
                    stroke-width="2"
                />

                <!-- waypoint 本身：小圓點方便肉眼確認點按位置 -->
                <circle
                    v-for="(wp, i) in waypoints"
                    :key="`wp-${i}`"
                    :cx="toPoint(wp).x"
                    :cy="toPoint(wp).y"
                    r="3"
                    class="fill-gray-400"
                />
            </g>
        </svg>
    </div>
</template>
