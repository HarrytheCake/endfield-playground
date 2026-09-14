<script setup lang="ts">
/**
 * `/dev/grid-viewport` —— useGridViewport 展示頁（W0907-H1）
 *
 * 純展示：自己畫一個虛擬格線，**不 import** `GridCanvas.vue`（toby 本週的檔，
 * 他還在寫，這週先不接）、**不 import** 任何 Pinia store。
 *
 * 平移：中鍵拖曳（避免佔用左鍵，留給未來的點擊/選取）。  \
 * 縮放：滾輪，以游標為錨點。
 */
import { computed, ref } from 'vue';
import { useGridViewport, type ScreenPoint } from '@/editor/layout/useGridViewport';
import type { Position } from '@/types/euclideanSpace';

/** 展示用虛擬格線範圍（格），數字大一點方便測試平移/縮放時格線跑出畫面外 */
const VIRTUAL_GRID_SIZE = 40;

/** 本頁的格點視窗狀態與操作函式，見 `useGridViewport` 的型別與註解 */
const viewport = useGridViewport();

/** SVG 畫布容器的 DOM 參照，事件座標需相對於它算，而非整個視窗 */
const svgRef = ref<SVGSVGElement | null>(null);

/** 目前滑鼠所在的格子座標；顯示用，滑鼠移出畫布時為 null（`z` 固定為 0，本頁不使用） */
const hoverCell = ref<Position | null>(null);

/** 中鍵拖曳中的起始螢幕座標；非拖曳中為 null */
const dragStart = ref<ScreenPoint | null>(null);

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
 * 中鍵按下時記錄拖曳起點；忽略其他按鍵（左鍵留給未來的選取/點擊）。
 * @param event 原生滑鼠按下事件
 */
function handlePointerDown(event: MouseEvent) {
    if (event.button !== 1) return;
    event.preventDefault();
    dragStart.value = toLocalPoint(event);
}

/**
 * 拖曳中依滑鼠位移量呼叫 `panBy()`；非拖曳中僅更新 `hoverCell` 顯示。
 * @param event 原生滑鼠移動事件
 */
function handlePointerMove(event: MouseEvent) {
    const point = toLocalPoint(event);
    hoverCell.value = viewport.screenToCell(point);

    if (!dragStart.value) return;
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

/** 套用在虛擬格線 `<g>` 上的 transform 字串，讀 viewport 的 offset／zoom 組出 */
const gridTransform = computed(
    () =>
        `translate(${viewport.offset.value.x}, ${viewport.offset.value.y}) scale(${viewport.zoom.value})`,
);

/** 虛擬格線的座標軸範圍（0 到 VIRTUAL_GRID_SIZE），供 v-for 畫線 */
const gridLines = Array.from({ length: VIRTUAL_GRID_SIZE + 1 }, (_, i) => i);
</script>

<template>
    <div class="space-y-4">
        <header>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                格點視窗展示（W0907-H1）
            </h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                <code>useGridViewport</code>
                的平移／縮放／座標換算演示。中鍵拖曳平移，滾輪縮放（以游標為錨點）。
            </p>
        </header>

        <div class="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
            <span
                >offset: ({{ viewport.offset.value.x.toFixed(1) }},
                {{ viewport.offset.value.y.toFixed(1) }})</span
            >
            <span>zoom: {{ viewport.zoom.value.toFixed(2) }}</span>
            <span v-if="hoverCell">游標格子: ({{ hoverCell.x }}, {{ hoverCell.y }})</span>
            <button
                type="button"
                class="rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                @click="viewport.reset()"
            >
                重置視窗
            </button>
        </div>

        <svg
            ref="svgRef"
            width="100%"
            height="480"
            class="block rounded-lg border border-gray-200 bg-white select-none dark:border-gray-700 dark:bg-gray-900"
            role="img"
            aria-label="格點視窗展示畫布"
            @mousedown="handlePointerDown"
            @mousemove="handlePointerMove"
            @mouseup="handlePointerUp"
            @mouseleave="handlePointerUp"
            @wheel="handleWheel"
            @contextmenu.prevent
        >
            <g :transform="gridTransform">
                <g stroke="#d1d5db" stroke-width="1">
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
                <!-- 原點標記，方便肉眼確認平移/縮放方向 -->
                <circle
                    :cx="viewport.cellSize / 2"
                    :cy="viewport.cellSize / 2"
                    r="5"
                    class="fill-sky-500"
                />
            </g>
        </svg>
    </div>
</template>
