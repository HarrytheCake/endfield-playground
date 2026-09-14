/**
 * useGridViewport —— 格點視窗：平移、縮放、螢幕座標 ↔ 格子座標換算
 *
 * 純狀態＋純數學，**不依賴任何 Pinia 狀態管理**、**不碰** `GridCanvas.vue`。
 * 對應 W0907-H1（`docs/work_dispatch/harry/0907/W0907-H1_grid_viewport.md`）。
 *
 * 座標系統：
 *   - 格子座標（{@link Position}，沿用專案既有的歐幾里得格子座標型別）：
 *     以格為單位，`(0,0)` 為第一格左上角；本視窗是純 2D，`z`（佔用層）不參與
 *     任何換算——`cellToScreen` 忽略輸入的 `z`，`screenToCell` 固定回傳 `z: 0`
 *     （地面層），呼叫端若要處理其他層，需自行覆寫回傳值的 `z`
 *   - 螢幕座標（{@link ScreenPoint}）：像素，通常是滑鼠事件的 `offsetX`/`offsetY`
 *   - 視窗狀態只有 `offset`（px，視角平移量）與 `zoom`（縮放倍率）兩個自由度，
 *     `cellToScreen`/`screenToCell` 是彼此的反函式：
 *     `screen = cell * cellSize * zoom + offset`
 */

import { ref, type Ref } from 'vue';
import type { Position } from '@/types/euclideanSpace';

/** 螢幕像素座標 */
export interface ScreenPoint {
    /** 螢幕 X 座標（px） */
    x: number;
    /** 螢幕 Y 座標（px） */
    y: number;
}

/** {@link useGridViewport} 的初始化選項 */
export interface UseGridViewportOptions {
    /** 一格幾 px（zoom = 1 時）；預設 28，對齊 `GridCanvas.vue` 的預設值 */
    cellSize?: number;
    /** 縮放下限；預設 0.25 */
    minZoom?: number;
    /** 縮放上限；預設 4 */
    maxZoom?: number;
}

/** {@link useGridViewport} 回傳的視窗狀態與操作函式 */
export interface UseGridViewportReturn {
    /** 視角平移量（px）；`cellToScreen`/`screenToCell` 內部用它做座標平移 */
    offset: Ref<ScreenPoint>;
    /** 目前縮放倍率，恆落在 `[minZoom, maxZoom]` 區間內 */
    zoom: Ref<number>;
    /** 一格幾 px（zoom = 1 時） */
    cellSize: number;
    /** 縮放下限 */
    minZoom: number;
    /** 縮放上限 */
    maxZoom: number;
    /**
     * 格子座標 → 螢幕座標，回傳該格**左上角**的像素位置。`cell.z` 不參與換算。
     * @param cell 格子座標
     */
    cellToScreen: (cell: Position) => ScreenPoint;
    /**
     * 螢幕座標 → 格子座標，回傳該像素點所在的格子索引，`z` 固定為 `0`（地面層）。  \
     * 契約：`screenToCell(cellToScreen(c))` 在任意 `zoom`／`offset` 下，
     * `x`／`y` 都精確等於 `c.x`／`c.y`（見函式內註解說明浮點誤差防呆）。
     * @param point 螢幕像素座標
     */
    screenToCell: (point: ScreenPoint) => Position;
    /**
     * 依螢幕像素位移量平移視角。位移量為螢幕空間（不隨 zoom 縮放），
     * 拖曳手勢直接傳滑鼠移動量即可，符合「拖多少、畫面跟著移多少」的直覺。
     * `dx`／`dy` 若非有限數（`NaN`／`Infinity`）則整次呼叫視為無效並忽略。
     * @param dx 螢幕 X 位移（px）
     * @param dy 螢幕 Y 位移（px）
     */
    panBy: (dx: number, dy: number) => void;
    /**
     * 縮放到指定倍率，並以 `anchor`（螢幕座標，通常是游標位置）為錨點——
     * 縮放前後 `anchor` 對應的格子空間座標維持不變，避免畫面「飄走」。
     * `nextZoom` 會被 clamp 到 `[minZoom, maxZoom]`。
     * `anchor.x`／`anchor.y`／`nextZoom` 任一為非有限數則整次呼叫視為無效並忽略。
     * @param anchor 縮放錨點的螢幕座標
     * @param nextZoom 目標縮放倍率（會被 clamp）
     */
    zoomAt: (anchor: ScreenPoint, nextZoom: number) => void;
    /**
     * 以倍率因子相對縮放（例如滾輪一格 `factor = 1.1` 或 `0.9`），錨點語意同 `zoomAt`。
     * 非有限數的防呆規則同 `zoomAt`（`factor` 本身非有限數也視為無效並忽略）。
     * @param anchor 縮放錨點的螢幕座標
     * @param factor 相對於目前 zoom 的倍率因子
     */
    zoomBy: (anchor: ScreenPoint, factor: number) => void;
    /** 重置視窗：`offset` 回到 `(0, 0)`，`zoom` 回到 `1` */
    reset: () => void;
}

/** `screenToCell` 的浮點誤差防呆量：`cellToScreen` 算出的像素值理論上是整數格 × cellSize，
 *  但實際運算可能因浮點誤差略小於理論值（例如 55.999999999994），`Math.floor` 會因此誤判成下一格。
 *  加這個極小 epsilon 把這類誤差往上修正，同時遠小於任何有意義的像素單位，不影響真實的格子判定。 */
const FLOOR_EPSILON = 1e-9;

/**
 * 建立一組格點視窗狀態與操作函式。
 * @param options 初始化選項，見 {@link UseGridViewportOptions}
 * @example
 * const viewport = useGridViewport()
 * viewport.panBy(10, 0)
 * const cell = viewport.screenToCell({ x: event.offsetX, y: event.offsetY })
 */
export function useGridViewport(options: UseGridViewportOptions = {}): UseGridViewportReturn {
    const cellSize = options.cellSize ?? 28;
    const minZoom = options.minZoom ?? 0.25;
    const maxZoom = options.maxZoom ?? 4;

    const offset = ref<ScreenPoint>({ x: 0, y: 0 });
    const zoom = ref(1);

    function cellToScreen(cell: Position): ScreenPoint {
        return {
            x: cell.x * cellSize * zoom.value + offset.value.x,
            y: cell.y * cellSize * zoom.value + offset.value.y,
        };
    }

    function screenToCell(point: ScreenPoint): Position {
        const scale = cellSize * zoom.value;
        return {
            x: Math.floor((point.x - offset.value.x) / scale + FLOOR_EPSILON),
            y: Math.floor((point.y - offset.value.y) / scale + FLOOR_EPSILON),
            z: 0,
        };
    }

    function panBy(dx: number, dy: number): void {
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
        offset.value = { x: offset.value.x + dx, y: offset.value.y + dy };
    }

    function zoomAt(anchor: ScreenPoint, nextZoom: number): void {
        if (
            !Number.isFinite(anchor.x) ||
            !Number.isFinite(anchor.y) ||
            !Number.isFinite(nextZoom)
        ) {
            return;
        }

        const clamped = Math.min(maxZoom, Math.max(minZoom, nextZoom));
        if (clamped === zoom.value) return;

        /** 縮放前 anchor 對應的格子空間座標（非整數格，保留小數精確定位） */
        const spaceX = (anchor.x - offset.value.x) / zoom.value;
        const spaceY = (anchor.y - offset.value.y) / zoom.value;

        zoom.value = clamped;
        /** 重新算 offset，讓同一個格子空間座標縮放後仍落在 anchor 這個螢幕位置 */
        offset.value = {
            x: anchor.x - spaceX * clamped,
            y: anchor.y - spaceY * clamped,
        };
    }

    function zoomBy(anchor: ScreenPoint, factor: number): void {
        if (!Number.isFinite(factor)) return;
        zoomAt(anchor, zoom.value * factor);
    }

    function reset(): void {
        offset.value = { x: 0, y: 0 };
        zoom.value = 1;
    }

    return {
        offset,
        zoom,
        cellSize,
        minZoom,
        maxZoom,
        cellToScreen,
        screenToCell,
        panBy,
        zoomAt,
        zoomBy,
        reset,
    };
}
