/**
 * 幾何工具函式
 *
 * 為 CR-03 detector 開發提供設備位置與碰撞檢測工具。
 */

import type { FactoryNode } from '@/types/graph';
import type { Machine } from '@/types/machine';
import type { BaseRegion } from '@/store/canvasStore';

/**
 * 計算設備佔據的所有格子座標
 *
 * 考慮設備旋轉：
 * - rotation 0/2: 使用原始 width x height
 * - rotation 1/3: 寬高互換（90°/270° 旋轉）
 *
 * @param device - 已部署的設備節點
 * @param def - 設備靜態定義（含 width、height）
 * @returns 格子座標集合，格式為 Set<"x,y">（例如 "5,10"）
 *
 * @example
 * const cells = getOccupiedCells(device, machineDef);
 * // cells = Set { "5,10", "5,11", "6,10", "6,11" }
 */
export function getOccupiedCells(device: FactoryNode, def: Machine): Set<string> {
    const cells = new Set<string>();

    // 取得設備位置（格子座標，假設 position 已經是格子座標）
    const x = Math.floor(device.position.x);
    const y = Math.floor(device.position.y);

    // 取得旋轉次數（0/1/2/3）
    const rotation = device.data?.rotation ?? 0;

    // 根據旋轉決定實際佔據尺寸
    // rotation 1 (90°) 或 3 (270°) 時寬高互換
    const actualWidth = rotation === 1 || rotation === 3 ? def.height : def.width;
    const actualHeight = rotation === 1 || rotation === 3 ? def.width : def.height;

    // 計算所有佔據的格子
    for (let dx = 0; dx < actualWidth; dx++) {
        for (let dy = 0; dy < actualHeight; dy++) {
            cells.add(`${x + dx},${y + dy}`);
        }
    }

    return cells;
}

/**
 * 檢查兩個格子集合是否有重疊
 *
 * @param cells1 - 第一個格子集合
 * @param cells2 - 第二個格子集合
 * @returns true 表示有至少一個格子重疊
 *
 * @example
 * const overlap = cellsOverlap(cellsA, cellsB);
 * if (overlap) {
 *   console.log('設備重疊！');
 * }
 */
export function cellsOverlap(cells1: Set<string>, cells2: Set<string>): boolean {
    // 遍歷較小的集合以提高效率
    const [smaller, larger] = cells1.size < cells2.size ? [cells1, cells2] : [cells2, cells1];

    for (const cell of smaller) {
        if (larger.has(cell)) {
            return true;
        }
    }

    return false;
}

/**
 * 檢查座標是否在基地範圍內
 *
 * @param x - 格子 x 座標
 * @param y - 格子 y 座標
 * @param baseRegion - 基地類型（'wuling' / 'valley4' / null）
 * @returns true 表示在範圍內；null 基地（自由畫布）永遠返回 true
 *
 * @example
 * if (!isWithinBaseRegion(device.x, device.y, canvasStore.baseRegion)) {
 *   console.log('設備超出基地範圍！');
 * }
 */
export function isWithinBaseRegion(x: number, y: number, baseRegion: BaseRegion): boolean {
    // null 基地（自由畫布）無邊界限制
    if (baseRegion === null) {
        return true;
    }

    // 基地尺寸定義（與 canvasStore 保持一致）
    const BASE_REGION_SIZES: Record<Exclude<BaseRegion, null>, { w: number; h: number }> = {
        wuling: { w: 256, h: 256 },
        valley4: { w: 192, h: 192 },
    };

    const size = BASE_REGION_SIZES[baseRegion];

    // 檢查是否在範圍內（0-indexed）
    return x >= 0 && x < size.w && y >= 0 && y < size.h;
}

/**
 * 檢查設備的所有格子是否都在基地範圍內
 *
 * @param device - 已部署的設備節點
 * @param def - 設備靜態定義
 * @param baseRegion - 基地類型
 * @returns true 表示設備完全在基地範圍內
 *
 * @example
 * if (!isDeviceWithinBaseRegion(device, def, baseRegion)) {
 *   // 觸發 E002 錯誤
 * }
 */
export function isDeviceWithinBaseRegion(
    device: FactoryNode,
    def: Machine,
    baseRegion: BaseRegion,
): boolean {
    const cells = getOccupiedCells(device, def);

    for (const cell of cells) {
        const [x, y] = cell.split(',').map(Number);
        if (!isWithinBaseRegion(x, y, baseRegion)) {
            return false;
        }
    }

    return true;
}
