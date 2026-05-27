/**
 * Port 旋轉工具函式
 *
 * 由 src/types/machine.ts 遷移而來（V4-B1）。
 * 純數學轉換，無響應式依賴，不需要 composable 包裝。
 *
 * 使用方式：
 *   import { rotatePortSide, rotatePortOffset } from '@/utils/portUtils'
 */

import type { PortSide } from '@/types/machine';

const SIDE_ORDER: PortSide[] = ['top', 'right', 'bottom', 'left'];

/**
 * 將方位按順時針步數旋轉
 *
 * @param side     原始方位（0° 時）
 * @param rotation 旋轉步數（0=0°, 1=90°CW, 2=180°, 3=270°CW）
 */
export function rotatePortSide(side: PortSide, rotation: 0 | 1 | 2 | 3): PortSide {
    const idx = SIDE_ORDER.indexOf(side);
    return SIDE_ORDER[(idx + rotation) % 4];
}

/**
 * 將 offset 按旋轉步數轉換（需搭配機器尺寸，確保非方形機器旋轉後格子正確）
 *
 * 轉換規則（每步 90°CW）：
 *   left  → top    : offset → (machineHeight - 1 - offset)  // 垂直翻轉
 *   top   → right  : offset → offset                         // 不變
 *   right → bottom : offset → (machineWidth  - 1 - offset)  // 水平翻轉
 *   bottom→ left   : offset → offset                         // 不變
 *
 * @param side          原始方位
 * @param offset        原始 offset
 * @param machineWidth  機器原始寬度（格）
 * @param machineHeight 機器原始高度（格）
 * @param rotation      旋轉步數（0~3）
 */
export function rotatePortOffset(
    side: PortSide,
    offset: number,
    machineWidth: number,
    machineHeight: number,
    rotation: 0 | 1 | 2 | 3,
): number {
    if (rotation === 0) return offset;

    const transforms: Record<PortSide, (o: number) => number> = {
        left: (o) => machineHeight - 1 - o, // left→top：垂直翻轉
        top: (o) => o, //  top→right：不變
        right: (o) => machineWidth - 1 - o, // right→bottom：水平翻轉
        bottom: (o) => o, // bottom→left：不變
    };

    let currentSide: PortSide = side;
    let currentOffset = offset;
    for (let i = 0; i < rotation; i++) {
        currentOffset = transforms[currentSide](currentOffset);
        currentSide = rotatePortSide(currentSide, 1);
    }
    return currentOffset;
}
