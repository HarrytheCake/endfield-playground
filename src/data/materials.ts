/**
 * 基礎材料資料（由 docs/aaaaa/scripts/generate-src-data.mjs 產生）
 *
 * 來源：docs/aaaaa/data/materials.json（含 form：solid｜liquid｜gas）
 *
 * 請勿手改本檔資料區；改 JSON 後重新執行：
 *   pnpm generate:src-data
 */

import type { MaterialDef, ItemForm } from '@/types/flow';
import { formToPortMedia } from '@/types/flow';
import type { PortMedia } from '@/types/machine';

// ─── 材料定義 ─────────────────────────────────────────────────────────────────

const materialList: MaterialDef[] = [
    {
        id: 'yuan_ore',
        name: '源礦',
        form: 'solid',
    },

    {
        id: 'p_292f416660',
        name: '紫晶礦',
        form: 'solid',
    },

    {
        id: 'blue_iron_ore',
        name: '藍鐵礦',
        form: 'solid',
    },

    {
        id: 'red_copper_ore',
        name: '赤銅礦',
        form: 'solid',
    },

    {
        id: 'p_aeb7fa2d20',
        name: '蕎花',
        form: 'solid',
    },

    {
        id: 'p_d74a8aaae0',
        name: '柑實',
        form: 'solid',
    },

    {
        id: 'p_7bb34ef875',
        name: '砂葉',
        form: 'solid',
    },

    {
        id: 'p_2c867eee25',
        name: '酮化灌木',
        form: 'solid',
    },

    {
        id: 'p_864f2688dd',
        name: '錦草',
        form: 'solid',
    },

    {
        id: 'p_d4b2255964',
        name: '芽針',
        form: 'solid',
    },

    {
        id: 'clean_water',
        name: '清水',
        form: 'liquid',
    },

    {
        id: 'deposit_acid',
        name: '沉積酸',
        form: 'liquid',
    },

    {
        id: 'p_468e8d31ba',
        name: '惰氣',
        form: 'gas',
    },

    {
        id: 'p_b471ae5777',
        name: '息壤氣',
        form: 'gas',
    },
];

const _materialMap = new Map<string, MaterialDef>(materialList.map((m) => [m.name, m]));

/** 取得所有基礎材料 */
export function getAllMaterials(): MaterialDef[] {
    return materialList;
}

/** 依名稱查材料 */
export function getMaterial(name: string): MaterialDef | undefined {
    return _materialMap.get(name);
}

/**
 * 依名稱查材料物態；未知時回傳 undefined。
 */
export function getMaterialForm(name: string): ItemForm | undefined {
    return _materialMap.get(name)?.form;
}

/**
 * 材料物態對應的線路媒質；未知材料回傳 null。
 */
export function getMaterialPortMedia(name: string): PortMedia | null {
    const form = getMaterialForm(name);
    return form ? formToPortMedia(form) : null;
}
