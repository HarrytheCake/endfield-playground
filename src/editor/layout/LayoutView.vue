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
import { getDeviceOccupiedCells } from '@/utils/layout/deviceOccupancy';
import { deviceSizeFromMachine, toDeviceFootprint } from '@/utils/layout/toFootprint';

/** 指標手勢僅保存本地快照，不持有可寫的 store 設備參考 */
interface CanvasGesture {
    /** 按下時固定的互動種類，避免快捷鍵先放開後變成落子 */
    kind: 'pan' | 'background' | 'device';
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

/** 提供主畫面唯讀佈局資料及高階快照載入操作 */
const layoutStore = useLayoutStore();
/** 基地選擇僅決定框線與視覺錯誤，不影響放置 action */
const canvasStore = useCanvasStore();
/** 消費頂欄與既有空白鍵快捷鍵共用的工具狀態 */
const editorStore = useEditorStore();
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
/** 抑制設備點擊及拖曳產生的落子 click，直到下次有效左鍵按下 */
let suppressPlacementClick = false;
/** 當前手勢的本地快照；結束時先清空再釋放捕捉，避免重入 */
let drag: CanvasGesture | null = null;

/**
 * 使用實際 SVG 矩形換算 viewBox 像素，與 GridCanvas 的 click 換算一致。
 * @param event 具有螢幕座標的指標事件
 * @returns 世界格座標；畫布尚未量測或已卸載時回 null
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
 * 明確平移優先，一般左鍵才分設備與空白；保留未來埠命中的插入位置。
 * @param event 容器收到的按下事件，其他按鍵及並行指標不啟動手勢
 */
function handlePointerDown(event: PointerEvent): void {
    if (drag || (event.button !== 0 && event.button !== 1)) return;
    const svg = event.target instanceof Element ? event.target.closest('svg') : null;
    if (!(svg instanceof SVGSVGElement) || !container.value?.contains(svg)) return;
    const position = pointerCell(event);
    if (!position) return;

    const explicitPan = event.button === 1 || editorStore.activeTool === 'pan';
    const device = explicitPan ? undefined : deviceAt(position);
    const kind = explicitPan ? 'pan' : device ? 'device' : 'background';
    const captureTarget = explicitPan ? container.value : svg;
    if (explicitPan) event.preventDefault();
    suppressPlacementClick = kind !== 'background';
    panning.value = explicitPan;
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
 * 跨門檻後只更新視角或本地設備預覽，不修改佈局及歷史。
 * @param event 起始指標的移動事件；放開時也用它消費最後一段位移
 */
function handlePointerMove(event: PointerEvent): void {
    if (!drag || event.pointerId !== drag.pointerId) return;
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

/** 結束本地手勢；先清空再釋放捕捉，lostpointercapture 重入時不會提交 */
function clearGesture(): void {
    const previous = drag;
    drag = null;
    panning.value = false;
    deviceDragPreview.value = null;
    if (previous?.captureTarget.hasPointerCapture(previous.pointerId)) {
        previous.captureTarget.releasePointerCapture(previous.pointerId);
    }
}

/**
 * 正常釋放與取消採不同路徑，取消不消費最後座標或產生點擊。
 * @param event 指標釋放、取消或失去捕捉事件
 */
function handlePointerEnd(event: PointerEvent): void {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (event.type === 'pointerup') {
        if (event.button !== drag.button) return;
        handlePointerMove(event);
        const preview = deviceDragPreview.value;
        const original = drag.devicePosition;
        if (drag.kind === 'device' && drag.moved && preview && original) {
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
        class="relative h-full w-full touch-none overflow-hidden"
        :class="
            panning || deviceDragPreview
                ? 'cursor-grabbing'
                : editorStore.activeTool === 'pan'
                  ? 'cursor-grab'
                  : ''
        "
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
            :device-drag-preview="deviceDragPreview"
            @cell-click="handleCellClick"
        />
    </div>
</template>
