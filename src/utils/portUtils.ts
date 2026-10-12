/**
 * Port 旋轉工具函式
 *
 * 純數學轉換，無響應式依賴。
 *
 * 演算法（V10）：以 max(w,h) 將機器 AABB 對稱擴成正方形 tmp，
 * 繞正方形中心旋轉（螢幕座標 y 向下、順時針），再裁回旋轉後的寬高。
 * 正方形與長方形共用同一套流程；對稱 padding 下正方形中心＝機器中心。
 *
 *   import { rotatePortSide, rotatePortOffset, rotatePort } from '@/utils/portUtils'
 */

import type { PortSide } from '@/types/machine';

const SIDE_ORDER: PortSide[] = ['top', 'right', 'bottom', 'left'];

export type GridRotation = 0 | 1 | 2 | 3;

/**
 * 將方位按順時針步數旋轉
 *
 * @param side     原始方位（0° 時）
 * @param rotation 旋轉步數（0=0°, 1=90°CW, 2=180°, 3=270°CW）
 * @returns 旋轉後的方位
 *
 * @example
 * rotatePortSide('top', 1)    // → 'right'
 * rotatePortSide('right', 2)  // → 'left'
 */
export function rotatePortSide(side: PortSide, rotation: GridRotation): PortSide {
    const idx = SIDE_ORDER.indexOf(side);
    return SIDE_ORDER[(idx + rotation) % 4];
}

/**
 * 埠在機器局部座標的邊心（原點＝機器左上角；單位＝格）。
 *
 * 與畫布熱區命中（`hitTestPortAt`）共用：世界座標＝設備 origin＋本函式結果（旋轉後用 display 寬高與旋轉後 side／offset）。
 */
export function portPointOnMachine(
    side: PortSide,
    offset: number,
    width: number,
    height: number,
): { x: number; y: number } {
    switch (side) {
        case 'top':
            return { x: offset + 0.5, y: 0 };
        case 'bottom':
            return { x: offset + 0.5, y: height };
        case 'left':
            return { x: 0, y: offset + 0.5 };
        case 'right':
            return { x: width, y: offset + 0.5 };
    }
}

/**
 * 將點投影回 display 矩形邊上的 side／offset（0-based 格索引）。
 * 呼叫端應保證點已在邊上（旋轉後數值誤差以最近邊吸附）。
 */
function pointToPort(
    x: number,
    y: number,
    width: number,
    height: number,
): { side: PortSide; offset: number } {
    const dTop = Math.abs(y - 0);
    const dBottom = Math.abs(y - height);
    const dLeft = Math.abs(x - 0);
    const dRight = Math.abs(x - width);
    const nearest = Math.min(dTop, dBottom, dLeft, dRight);

    if (nearest === dTop) {
        return { side: 'top', offset: Math.round(x - 0.5) };
    }
    if (nearest === dBottom) {
        return { side: 'bottom', offset: Math.round(x - 0.5) };
    }
    if (nearest === dLeft) {
        return { side: 'left', offset: Math.round(y - 0.5) };
    }
    return { side: 'right', offset: Math.round(y - 0.5) };
}

/**
 * 同時換算旋轉後的 side 與 offset（權威實作）。
 *
 * 步驟：
 * 1. S = max(w, h)，對稱 pad 成 S×S（短邊擴增）
 * 2. 埠點移入 tmp 座標，繞中心 (S/2,S/2) 順時針轉 rotation 步（y 向下）
 * 3. 依旋轉後寬高裁回機器局部座標，投影為 side／offset
 *
 * @example
 * // 6×4，bottom@4，90°CW → left@4
 * rotatePort('bottom', 4, 6, 4, 1)  // → { side: 'left', offset: 4 }
 * // 6×4，bottom@4，180° → top@1（舊演算法會得到 -1）
 * rotatePort('bottom', 4, 6, 4, 2)  // → { side: 'top', offset: 1 }
 */
export function rotatePort(
    side: PortSide,
    offset: number,
    machineWidth: number,
    machineHeight: number,
    rotation: GridRotation,
): { side: PortSide; offset: number } {
    if (rotation === 0) {
        return { side, offset };
    }

    const S = Math.max(machineWidth, machineHeight);
    const padX = (S - machineWidth) / 2;
    const padY = (S - machineHeight) / 2;

    const local = portPointOnMachine(side, offset, machineWidth, machineHeight);
    let x = local.x + padX;
    let y = local.y + padY;
    const cx = S / 2;
    const cy = S / 2;

    for (let i = 0; i < rotation; i++) {
        const dx = x - cx;
        const dy = y - cy;
        // 螢幕座標（y 向下）順時針 90°：(dx, dy) → (−dy, dx)
        x = cx - dy;
        y = cy + dx;
    }

    const { widthCells: displayWidth, heightCells: displayHeight } = resolveDisplayGrid(
        machineWidth,
        machineHeight,
        rotation,
    );
    const unpadX = (S - displayWidth) / 2;
    const unpadY = (S - displayHeight) / 2;

    return pointToPort(x - unpadX, y - unpadY, displayWidth, displayHeight);
}

/**
 * 將 offset 按旋轉步數轉換（需搭配機器尺寸）。
 *
 * 實作委派 {@link rotatePort}（pad-to-square 中心旋轉）。
 * 若同時需要新 side，請直接呼叫 `rotatePort` 或搭配 `rotatePortSide`。
 *
 * @param side          原始方位
 * @param offset        原始 offset
 * @param machineWidth  機器原始寬度（格）
 * @param machineHeight 機器原始高度（格）
 * @param rotation      旋轉步數（0~3）
 * @returns 旋轉後該方位上的新 offset
 *
 * @example
 * // 3×3 機器，top 邊 offset=2 的 port，順時針旋轉 1 次後 → right 邊 offset=2
 * rotatePortOffset('top', 2, 3, 3, 1)  // → 2
 *
 * // 2×4 機器，left 邊 offset=0 的 port，順時針旋轉 1 次後 → top 邊 offset=3
 * rotatePortOffset('left', 0, 2, 4, 1) // → 3
 *
 * // 6×4，bottom@4，180° → top@1
 * rotatePortOffset('bottom', 4, 6, 4, 2) // → 1
 */
export function rotatePortOffset(
    side: PortSide,
    offset: number,
    machineWidth: number,
    machineHeight: number,
    rotation: GridRotation,
): number {
    return rotatePort(side, offset, machineWidth, machineHeight, rotation).offset;
}

/**
 * 旋轉後機器在畫布上佔的格數（90 度與 270 度時寬高對調）。
 *
 * @param widthCells 0 度時的寬（格）
 * @param heightCells 0 度時的高（格）
 * @param rotation 旋轉步數
 * @returns 旋轉後的寬高（格）
 *
 * @example
 * resolveDisplayGrid(3, 2, 1) // → { widthCells: 2, heightCells: 3 }
 */
export function resolveDisplayGrid(
    widthCells: number,
    heightCells: number,
    rotation: GridRotation = 0,
): { widthCells: number; heightCells: number } {
    if (rotation % 2 === 1) {
        return { widthCells: heightCells, heightCells: widthCells };
    }
    return { widthCells, heightCells };
}

/**
 * 自 Vue Flow 的 handle id 解析埠索引。
 *
 * handle id 由 `FlowNodeOverlay.vue` 依 `modes[].input_ports` / `output_ports`
 * 動態產生，格式為 `in-{索引}` / `out-{索引}`。解析不出來一律回傳 null，
 * 要不要退回埠 0 由呼叫端依自身情境決定 —— 連線建立時退回 0 是合理的容錯，
 * 驗證時退回 0 則會產生看似有依據的錯誤結果。
 *
 * @param handle Vue Flow 傳入的 handle id
 * @param kind 該端是連線的入口還是出口
 * @returns 埠索引；handle 缺省或格式不符時回傳 null
 *
 * @example
 * parsePortHandleIndex('out-1', 'out') // → 1
 * parsePortHandleIndex('out-1', 'in')  // → null
 */
export function parsePortHandleIndex(
    handle: string | null | undefined,
    kind: 'in' | 'out',
): number | null {
    const matched = handle?.match(/^(in|out)-(\d+)$/);
    if (!matched || matched[1] !== kind) return null;
    return Number(matched[2]);
}
