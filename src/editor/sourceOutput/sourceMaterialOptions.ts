/**
 * 源設備可選基礎材料（W1026-H1／C5；W1102-H1 改為看所有型態）
 *
 * 依輸出埠媒質過濾，避免使用者選到該機任何型態都送不出去的材料。  \
 * 多型態源設備（基礎材料輸出點）選了液氣後，`setDevicePrimaryOutput` 會一併切到對應型態，
 * 因此這裡不能只看目前型態，否則固體型態下永遠選不到清水。
 */

import type { MaterialDef } from '@/types/flow';
import type { Machine, PortMedia } from '@/types/machine';
import { getAllMaterials, getMaterialPortMedia } from '@/data/materials';

/**
 * 取得源設備可選的基礎材料。
 *
 * @param machine 機器定義
 * @returns 非源設備回傳空陣列；任一型態的主輸出埠媒質相符即列入；
 *   所有型態都查不到輸出埠媒質時不過濾，回傳全部基礎材料
 */
export function sourceMaterialOptions(machine: Machine): MaterialDef[] {
    if (!machine.is_source) return [];

    /** 該機所有型態的主輸出埠（索引 0）媒質，與引擎、`setDevicePrimaryOutput` 的判斷一致 */
    const medias = new Set<PortMedia>();
    for (const mode of machine.modes) {
        const media = mode.output_ports[0]?.media;
        if (media) medias.add(media);
    }

    const materials = getAllMaterials();
    if (medias.size === 0) return materials;

    return materials.filter((m) => {
        const media = getMaterialPortMedia(m.name);
        return media !== null && medias.has(media);
    });
}
