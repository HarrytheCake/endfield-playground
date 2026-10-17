/**
 * 基地出界設備列表（V15／W1004-A0 ②）
 *
 * 回傳「任一佔格超出基地」的 {@link PlacedDevice.id}。  \
 * **僅供 Error 視覺**——不寫 store、不改 {@link canPlaceDevice}；出界仍可落子（spec／#57 S2-2）。
 *
 * 佔格與 {@link getDeviceOccupiedCells} 共用；範圍判定與 {@link isWithinBaseRegion} 共用。
 */

import type { PlacedDevice } from '@/types/layout';
import type { BaseRegion } from '@/store/canvasStore';
import { isWithinBaseRegion } from '@/utils/geometryUtils';
import { getDeviceOccupiedCells } from '@/utils/layout/deviceOccupancy';
import { defaultGetMachine, type GetMachineFn } from '@/utils/layout/portAnchorIndex';
import { deviceSizeFromMachine, toDeviceFootprint } from '@/utils/layout/toFootprint';

/**
 * 列出佔格未完全落在基地內的設備 id。
 *
 * - `region === null`（未選基地）→ 一律 `[]`（無框、無出界 Error）
 * - 查不到機器定義 → **略過**（不進列表、不丟例外）
 * - 設備任一佔格出界 → 該 id 進列表（對齊舊 `isDeviceWithinBaseRegion` 的否定）
 *
 * @param devices 已放置設備
 * @param region 基地類型；與 canvasStore.baseRegion 同源
 * @param getMachine 機器查表；預設與 resolveConnections 相同
 * @returns 出界設備 id（穩定為輸入順序中首次判定出界者的出現序）
 */
export function devicesOutsideBase(
    devices: readonly PlacedDevice[],
    region: BaseRegion,
    getMachine: GetMachineFn = defaultGetMachine,
): string[] {
    if (region === null) {
        return [];
    }

    const outsideIds: string[] = [];

    for (const device of devices) {
        const def = getMachine(device.machineType);
        if (!def) {
            continue;
        }

        const cells = getDeviceOccupiedCells(toDeviceFootprint(device, deviceSizeFromMachine(def)));
        const fullyInside = cells.every((cell) => isWithinBaseRegion(cell.x, cell.y, region));
        if (!fullyInside) {
            outsideIds.push(device.id);
        }
    }

    return outsideIds;
}
