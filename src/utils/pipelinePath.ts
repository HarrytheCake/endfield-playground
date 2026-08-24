/**
 * 管線折線幾何計算（R-C3）
 *
 * 純數學轉換，無響應式依賴，供 `PipelineEdge.vue` 呼叫，也可獨立單元測試。
 * 演算法依 `docs/roadmap/detail/C3_pipeline_polyline_render.md` §4.1／§4.2 凍結：
 * 最多一個中段轉折的 L／Z 形，轉角數由兩端埠的 `side` 決定，不由座標差決定，
 * 且線一律垂直於埠所在的邊出發與進入。不處理避讓其他設備。
 */

import type { PortSide } from '@/types/machine';

/** 折線上的一個頂點座標（畫布像素） */
export interface PipelinePoint {
    x: number;
    y: number;
}

/** 一個埠的錨點：座標加上其所在的邊，決定線段離開／進入該埠的方向 */
export interface PortAnchor {
    x: number;
    y: number;
    side: PortSide;
}

/** `top`／`bottom` 側的埠沿垂直軸出發或抵達；`left`／`right` 側沿水平軸 */
function isVerticalSide(side: PortSide): boolean {
    return side === 'top' || side === 'bottom';
}

/**
 * 依起訖埠的錨點，算出直角折線的頂點清單（含起訖點本身）。
 *
 * @param from 起點埠錨點（座標 + 所在邊）
 * @param to 終點埠錨點（座標 + 所在邊）
 * @returns 折線頂點清單，依序為起點 → （視情況的轉角點）→ 終點
 * @example
 * // 同軸共線 → 直線，零轉角
 * buildPipelinePath({ x: 0, y: 0, side: 'right' }, { x: 100, y: 0, side: 'left' })
 * // → [{x:0,y:0}, {x:100,y:0}]
 * @example
 * // 異軸 → L 形，一個轉角
 * buildPipelinePath({ x: 0, y: 0, side: 'right' }, { x: 100, y: 100, side: 'top' })
 * // → [{x:0,y:0}, {x:100,y:0}, {x:100,y:100}]
 * @example
 * // 同軸不共線 → Z 形，兩個轉角
 * buildPipelinePath({ x: 0, y: 0, side: 'right' }, { x: 100, y: 100, side: 'left' })
 * // → [{x:0,y:0}, {x:50,y:0}, {x:50,y:100}, {x:100,y:100}]
 */
export function buildPipelinePath(from: PortAnchor, to: PortAnchor): PipelinePoint[] {
    const start: PipelinePoint = { x: from.x, y: from.y };
    const end: PipelinePoint = { x: to.x, y: to.y };

    const fromVertical = isVerticalSide(from.side);
    const toVertical = isVerticalSide(to.side);

    if (fromVertical !== toVertical) {
        // 異軸：L 形，一個轉角。線先沿 from 自己的軸離開，轉角落在該軸與終點座標的交會處。
        const corner: PipelinePoint = fromVertical
            ? { x: start.x, y: end.y } // from 垂直出發：先動 y，轉角 x 沿用起點
            : { x: end.x, y: start.y }; // from 水平出發：先動 x，轉角 y 沿用起點
        return [start, corner, end];
    }

    if (fromVertical) {
        // 同為垂直軸（top/bottom）
        if (start.x === end.x) return [start, end];
        const midY = (start.y + end.y) / 2;
        return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
    }

    // 同為水平軸（left/right）
    if (start.y === end.y) return [start, end];
    const midX = (start.x + end.x) / 2;
    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
}
