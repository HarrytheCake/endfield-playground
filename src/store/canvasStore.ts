import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

/** 基地選擇：null = 自由畫布（無邊界 / 無方位標示） */
export type BaseRegion = 'wuling' | 'valley4' | null;

/** 基地對應的畫布格子尺寸 */
const BASE_REGION_SIZES: Record<Exclude<BaseRegion, null>, { w: number; h: number }> = {
    wuling: { w: 256, h: 256 },
    valley4: { w: 192, h: 192 },
};

/**
 * CR-01 useCanvasStore
 *
 * 純畫布視圖狀態 —— 縮放、平移、格線、基地選擇。  \
 * **本 store 的變更不進歷史**：屬於視角狀態，跟設備擺放這類藍圖資料無關。
 *
 * @example
 * const canvasStore = useCanvasStore()
 * canvasStore.setZoom(1.5)
 * canvasStore.toggleGrid()
 */
export const useCanvasStore = defineStore('canvas', () => {
    /** 單格像素大小（隨縮放變化） */
    const gridSize = ref(40);

    /** 畫布平移偏移（像素） */
    const offset = ref({ x: 0, y: 0 });

    /** 縮放倍率（1 = 100%） */
    const zoom = ref(1);

    /** 目前選定的基地（null = 自由畫布） */
    const baseRegion = ref<BaseRegion>(null);

    /** 是否顯示格線 */
    const showGrid = ref(true);

    /** 目前選定的基地對應的畫布格子尺寸；自由畫布為 null */
    const canvasSize = computed(() =>
        baseRegion.value === null ? null : BASE_REGION_SIZES[baseRegion.value],
    );

    /** 設定縮放倍率（會 clamp 至 [0.1, 4]） */
    function setZoom(value: number): void {
        zoom.value = Math.max(0.1, Math.min(4, value));
    }

    /** 設定畫布平移偏移 */
    function setOffset(o: { x: number; y: number }): void {
        offset.value = { ...o };
    }

    /** 切換基地；切換時不調整 zoom / offset，由 L2 自行決定是否 reset 視角 */
    function setBaseRegion(region: BaseRegion): void {
        baseRegion.value = region;
    }

    /** 切換格線顯示 */
    function toggleGrid(): void {
        showGrid.value = !showGrid.value;
    }

    /** 設定格線大小（像素） */
    function setGridSize(size: number): void {
        gridSize.value = Math.max(8, size);
    }

    return {
        /** 單格像素大小（隨縮放變化） */
        gridSize,
        /** 畫布平移偏移（像素） */
        offset,
        /** 縮放倍率（1 = 100%） */
        zoom,
        /** 目前選定的基地（null = 自由畫布） */
        baseRegion,
        /** 是否顯示格線 */
        showGrid,
        /** 目前選定的基地對應的畫布格子尺寸；自由畫布為 null */
        canvasSize,
        /** 設定縮放倍率（會 clamp 至 [0.1, 4]） */
        setZoom,
        /** 設定畫布平移偏移 */
        setOffset,
        /** 切換基地；切換時不調整 zoom / offset，由 L2 自行決定是否 reset 視角 */
        setBaseRegion,
        /** 切換格線顯示 */
        toggleGrid,
        /** 設定格線大小（像素） */
        setGridSize,
    };
});
