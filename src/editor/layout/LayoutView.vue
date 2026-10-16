<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useElementSize } from '@vueuse/core';
import { useGridViewport } from './useGridViewport';
import { getMachineById } from '@/data/machines';
import { getMockLayoutScenario, toLayoutSnapshot } from '@/data/mockLayout';
import GridCanvas from '@/editor/layout/GridCanvas.vue';
import { usePlacementIntent } from '@/editor/toolbar/usePlacementIntent';
import { useLayoutStore } from '@/store/layoutStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useEditorStore } from '@/store/editorStore';
import { devicesOutsideBase } from '@/utils/layout/devicesOutsideBase';
import type { Position } from '@/types/euclideanSpace';
import { canPlaceDevice } from '@/utils/layout/placementCheck';

/** 提供主畫面唯讀佈局資料及高階快照載入操作 */
const layoutStore = useLayoutStore();
/** 基地選擇僅決定框線與視覺錯誤，不影響放置 action */
const canvasStore = useCanvasStore();
/** 消費頂欄與既有空白鍵快捷鍵共用的工具狀態 */
const editorStore = useEditorStore();
/**
 * 出界設備清單，交由 L1 的 devicesOutsideBase 判定，L2 不另算出界幾何。
 * 僅供視覺 Error；不混入 canPlaceDevice 的重疊／無效資料拒絕規則。
 */
const outsideDeviceIds = computed(() =>
    devicesOutsideBase(layoutStore.devices, canvasStore.baseRegion),
);

/** 畫布容器與其實際像素尺寸，隨主畫面布局重新量測 */
const container = ref<HTMLElement | null>(null);
/** 容器內容尺寸，不將設備或基地大小當成視窗大小 */
const { width, height } = useElementSize(container);
/** 單一視窗狀態；只影響顯示，不進入 history */
const { offset, zoom, cellSize, panBy, screenToCell } = useGridViewport();
/** 是否正在平移，供容器顯示拖曳游標 */
const panning = ref(false);
/** 抑制平移手勢產生的 click，直到下一次正常左鍵按下 */
let suppressPlacementClick = false;
/** 當前平移手勢的指標與上一個螢幕座標 */
let drag: { pointerId: number; x: number; y: number } | null = null;

/**
 * 中鍵或平移工具的左鍵開始平移，沿用頂欄與空白鍵的工具狀態。
 * @param event 容器接收的指標事件
 */
function handlePointerDown(event: PointerEvent): void {
    if (drag) return;
    if (event.button === 0) suppressPlacementClick = false;
    if (event.button !== 1 && !(event.button === 0 && editorStore.activeTool === 'pan')) return;
    event.preventDefault();
    suppressPlacementClick = true;
    panning.value = true;
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    container.value?.setPointerCapture(event.pointerId);
}

/**
 * 以螢幕像素位移更新視角；捕捉期間只有起始指標可推動視窗。
 * @param event 指標位移事件
 */
function handlePointerMove(event: PointerEvent): void {
    if (!drag || event.pointerId !== drag.pointerId) return;
    panBy(event.clientX - drag.x, event.clientY - drag.y);
    drag.x = event.clientX;
    drag.y = event.clientY;
}

/**
 * 結束或取消平移並釋放捕捉；保留 click 抑制，避免空白鍵先放開後誤落子。
 * @param event 指標釋放、取消或失去捕捉事件
 */
function handlePointerEnd(event: PointerEvent): void {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag = null;
    panning.value = false;
    if (container.value?.hasPointerCapture(event.pointerId)) {
        container.value.releasePointerCapture(event.pointerId);
    }
}

/** 卸載時結束本地手勢；DOM 移除前主動釋放指標捕捉 */
onBeforeUnmount(() => {
    const pointerId = drag?.pointerId;
    drag = null;
    panning.value = false;
    if (pointerId !== undefined && container.value?.hasPointerCapture(pointerId)) {
        container.value.releasePointerCapture(pointerId);
    }
});

/** 工具列與畫布共享的真機器落子意圖 */
const { armedMachineId } = usePlacementIntent();

/**
 * 格點點擊時先預檢，再以高階 action 新增真機器；成功後保留意圖供連續落子。
 *
 * @param position 由 GridCanvas 換算的格點座標
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
 * 首次進入主畫面且尚無設備時載入示範快照，避免空白畫布無法驗收。
 * 既有資料會完整保留，不會因元件重新掛載而被 fixture 覆寫。
 */
onMounted(() => {
    if (layoutStore.devices.length === 0) {
        layoutStore.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));
    }
});
</script>

<template>
    <div
        ref="container"
        class="relative h-full w-full overflow-hidden"
        :class="panning ? 'cursor-grabbing' : editorStore.activeTool === 'pan' ? 'cursor-grab' : ''"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerEnd"
        @pointercancel="handlePointerEnd"
        @lostpointercapture="handlePointerEnd"
    >
        <GridCanvas
            :devices="layoutStore.devices"
            :pipelines="layoutStore.pipelines"
            :viewport-width="width"
            :viewport-height="height"
            :cell-size="cellSize"
            :offset="offset"
            :zoom="zoom"
            :screen-to-cell="screenToCell"
            :base-size="canvasStore.canvasSize"
            :outside-device-ids="outsideDeviceIds"
            @cell-click="handleCellClick"
        />
    </div>
</template>
