/**
 * CR-04 設備與配方資料（Stub）
 *
 * ⚠️  本檔案由 CR-04 暫行建立，對齊 docs/aaaaa/data/machines.json 與 products.json。
 *     CR-01 正式定義 devices.ts 後，本檔案應由 CR-01 接管並擴充
 *     （加入格子制佔位、port 座標、完整電力數值等）。
 *
 * 存取方式：
 *   import { getRecipesForMachine, getAllRecipes } from '@/data/devices'
 *   import { getMachine } from '@/data/machines'
 */

import type { RecipeDef, ProductDef } from '@/types/flow';

// ─── 配方定義（對齊 products.json，部分品項）──────────────────────────────────
//
// 完整配方極多（products.json 共 2400+ 行），此處以 FlowEngine 開發與
// H1–H6 測試情境所需的配方為主，其餘留白供後續補充。
//
// 命名慣例：RECIPES_<品項名> ，以 ProductDef 格式組織。

const productList: ProductDef[] = [
    // ── 原礦 Source 類（物品輸出口，供 FlowEngine 計算用）────────────────────
    {
        id: 'yuan_ore',
        name: '源礦',
        recipes: [
            {
                id: 'item_source_yuan_ore_0',
                inputs: [],
                outputs: [{ itemId: '源礦', quantity: 1 }],
                machine: '物品輸出口',
                timeSeconds: 2, // 30/min per belt
            },
        ],
    },
    {
        id: 'blue_iron_ore',
        name: '藍鐵礦',
        recipes: [
            {
                id: 'item_source_blue_iron_ore_0',
                inputs: [],
                outputs: [{ itemId: '藍鐵礦', quantity: 1 }],
                machine: '物品輸出口',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'red_copper_ore',
        name: '赤銅礦',
        recipes: [
            {
                id: 'item_source_red_copper_ore_0',
                inputs: [],
                outputs: [{ itemId: '赤銅礦', quantity: 1 }],
                machine: '物品輸出口',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'clean_water',
        name: '清水',
        recipes: [
            {
                id: 'item_source_clean_water_0',
                inputs: [],
                outputs: [{ itemId: '清水', quantity: 1 }],
                machine: '物品輸出口',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'deposit_acid',
        name: '沉積酸',
        recipes: [
            {
                id: 'item_source_deposit_acid_0',
                inputs: [],
                outputs: [{ itemId: '沉積酸', quantity: 1 }],
                machine: '物品輸出口',
                timeSeconds: 2,
            },
        ],
    },
    // ── 粉末類 ──────────────────────────────────────────────────────────────
    {
        id: 'yuan_ore_powder',
        name: '源石粉末',
        recipes: [
            {
                id: 'crusher_yuan_ore_powder_0',
                inputs: [{ itemId: '源礦', quantity: 1 }],
                outputs: [{ itemId: '源石粉末', quantity: 1 }],
                machine: '粉碎機',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'blue_iron_powder',
        name: '藍鐵粉末',
        recipes: [
            {
                id: 'crusher_blue_iron_powder_0',
                inputs: [{ itemId: '藍鐵礦', quantity: 1 }],
                outputs: [{ itemId: '藍鐵粉末', quantity: 2 }],
                machine: '粉碎機',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'purple_crystal_powder',
        name: '紫晶粉末',
        recipes: [
            {
                id: 'crusher_purple_crystal_powder_0',
                inputs: [{ itemId: '紫晶礦', quantity: 1 }],
                outputs: [{ itemId: '紫晶粉末', quantity: 1 }],
                machine: '粉碎機',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'red_copper_powder',
        name: '赤銅粉末',
        recipes: [
            {
                id: 'crusher_red_copper_powder_0',
                inputs: [{ itemId: '赤銅礦', quantity: 1 }],
                outputs: [{ itemId: '赤銅粉末', quantity: 1 }],
                machine: '粉碎機',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'carbon_powder',
        name: '碳粉末',
        recipes: [
            {
                id: 'crusher_carbon_powder_0',
                inputs: [{ itemId: '碳塊', quantity: 1 }],
                outputs: [{ itemId: '碳粉末', quantity: 1 }],
                machine: '粉碎機',
                timeSeconds: 2,
            },
        ],
    },
    // ── 研磨合成（測試情境 H2/H3 用）────────────────────────────────────────
    // ⚠️ 「研製合成粉末方塊」為測試用假想品項，正式資料待補
    {
        id: 'research_compound_block',
        name: '研製合成粉末方塊',
        recipes: [
            {
                id: 'grinder_research_compound_block_0',
                inputs: [
                    { itemId: '源石粉末', quantity: 1 },
                    { itemId: '藍鐵粉末', quantity: 1 },
                ],
                outputs: [{ itemId: '研製合成粉末方塊', quantity: 1 }],
                machine: '研磨機',
                timeSeconds: 1,
            },
        ],
    },
    // ── 精煉類 ──────────────────────────────────────────────────────────────
    {
        id: 'blue_iron_ingot',
        name: '藍鐵塊',
        recipes: [
            {
                id: 'refinery_blue_iron_ingot_0',
                inputs: [{ itemId: '藍鐵粉末', quantity: 2 }],
                outputs: [{ itemId: '藍鐵塊', quantity: 1 }],
                machine: '精煉爐',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'purple_crystal_fiber',
        name: '紫晶纖維',
        recipes: [
            {
                id: 'refinery_purple_crystal_fiber_0',
                inputs: [{ itemId: '紫晶粉末', quantity: 2 }],
                outputs: [{ itemId: '紫晶纖維', quantity: 1 }],
                machine: '精煉爐',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'red_copper_ingot',
        name: '赤銅塊',
        recipes: [
            {
                id: 'refinery_red_copper_ingot_0',
                // 多輸出：同時產出赤銅塊與汙水（H5 測試情境）
                inputs: [
                    { itemId: '赤銅礦', quantity: 1 },
                    { itemId: '清水', quantity: 1 },
                ],
                outputs: [
                    { itemId: '赤銅塊', quantity: 1 },
                    { itemId: '汙水', quantity: 1 },
                ],
                machine: '精煉爐',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'stable_carbon_block',
        name: '穩定碳塊',
        recipes: [
            {
                id: 'refinery_stable_carbon_block_0',
                inputs: [
                    { itemId: '碳塊', quantity: 1 },
                    { itemId: '源石粉末', quantity: 1 },
                ],
                outputs: [{ itemId: '穩定碳塊', quantity: 1 }],
                machine: '精煉爐',
                timeSeconds: 2,
            },
        ],
    },
    // ── 反應池類 ─────────────────────────────────────────────────────────────
    {
        id: 'red_copper_solution',
        name: '赤銅溶液',
        recipes: [
            {
                id: 'reactor_red_copper_solution_0',
                inputs: [
                    { itemId: '赤銅粉末', quantity: 1 },
                    { itemId: '沉積酸', quantity: 1 },
                ],
                outputs: [{ itemId: '赤銅溶液', quantity: 1 }],
                machine: '反應池',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'hue_copper_ingot',
        name: '赫銅塊',
        recipes: [
            {
                id: 'reactor_hue_copper_ingot_0',
                inputs: [
                    { itemId: '赫銅溶液', quantity: 2 },
                    { itemId: '藍鐵粉末', quantity: 1 },
                ],
                outputs: [
                    { itemId: '赫銅塊', quantity: 1 },
                    { itemId: '汙水', quantity: 1 },
                ],
                machine: '反應池',
                timeSeconds: 2,
            },
        ],
    },
    // ── 提純機類 ─────────────────────────────────────────────────────────────
    {
        id: 'hue_copper_solution',
        name: '赫銅溶液',
        recipes: [
            {
                id: 'purifier_hue_copper_solution_0',
                inputs: [{ itemId: '赤銅溶液', quantity: 4 }],
                outputs: [
                    { itemId: '赫銅溶液', quantity: 1 },
                    { itemId: '沉積酸', quantity: 1 },
                ],
                machine: '提純機',
                timeSeconds: 2,
            },
        ],
    },
    // ── 配件機 / 裝備原件機（H6 武陵鏈路）──────────────────────────────────
    {
        id: 'red_copper_part',
        name: '赤銅零件',
        recipes: [
            {
                id: 'parts_machine_red_copper_part_0',
                inputs: [{ itemId: '赤銅塊', quantity: 1 }],
                outputs: [{ itemId: '赤銅零件', quantity: 1 }],
                machine: '配件機',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'hue_copper_part',
        name: '赫銅零件',
        recipes: [
            {
                id: 'parts_machine_hue_copper_part_0',
                inputs: [{ itemId: '赫銅塊', quantity: 5 }],
                outputs: [{ itemId: '赫銅零件', quantity: 1 }],
                machine: '配件機',
                timeSeconds: 10,
            },
        ],
    },
    // ── 電池類（四號谷地主力產品 H1 測試情境）──────────────────────────────
    {
        id: 'purple_crystal_bottle',
        name: '紫晶質瓶',
        recipes: [
            {
                id: 'shaping_machine_purple_crystal_bottle_0',
                inputs: [{ itemId: '紫晶纖維', quantity: 1 }],
                outputs: [{ itemId: '紫晶質瓶', quantity: 1 }],
                machine: '塑型機',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'blue_iron_bottle',
        name: '藍鐵瓶',
        recipes: [
            {
                id: 'shaping_machine_blue_iron_bottle_0',
                inputs: [{ itemId: '藍鐵塊', quantity: 1 }],
                outputs: [{ itemId: '藍鐵瓶', quantity: 1 }],
                machine: '塑型機',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'low_cap_valley_battery',
        name: '低容量谷地電池',
        recipes: [
            {
                id: 'packaging_machine_low_cap_valley_battery_0',
                inputs: [
                    { itemId: '紫晶質瓶', quantity: 1 },
                    { itemId: '穩定碳塊', quantity: 1 },
                ],
                outputs: [{ itemId: '低容量谷地電池', quantity: 1 }],
                machine: '封裝機',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'mid_cap_valley_battery',
        name: '中容量谷地電池',
        recipes: [
            {
                id: 'packaging_machine_mid_cap_valley_battery_0',
                inputs: [
                    { itemId: '藍鐵瓶', quantity: 1 },
                    { itemId: '穩定碳塊', quantity: 2 },
                ],
                outputs: [{ itemId: '中容量谷地電池', quantity: 1 }],
                machine: '封裝機',
                timeSeconds: 2,
            },
        ],
    },
    {
        id: 'high_cap_valley_battery',
        name: '高容量谷地電池',
        recipes: [
            {
                id: 'packaging_machine_high_cap_valley_battery_0',
                inputs: [
                    { itemId: '藍鐵瓶', quantity: 2 },
                    { itemId: '穩定碳塊', quantity: 3 },
                ],
                outputs: [{ itemId: '高容量谷地電池', quantity: 1 }],
                machine: '封裝機',
                timeSeconds: 4,
            },
        ],
    },
];

// ─── 查詢 API ─────────────────────────────────────────────────────────────────

/** 產品名稱快查 Map */
const _productMap = new Map<string, ProductDef>(productList.map((p) => [p.name, p]));

/**
 * 取得所有使用指定設備的配方。
 *
 * @param machineName 設備中文名稱（對應 Machine.name / RecipeDef.machine）
 * @returns 該設備可用的配方陣列；找不到時為空陣列
 *
 * @example
 * const recipes = getRecipesForMachine('粉碎機')
 * // recipes[0].outputs[0].itemId === '源石粉末'
 */
export function getRecipesForMachine(machineName: string): RecipeDef[] {
    return productList.flatMap((p) => p.recipes.filter((r) => r.machine === machineName));
}

/**
 * 依產品名稱取得所有配方（多配方時依資料定義順序）。
 *
 * @param productName 產品中文名稱（對應 ProductDef.name）
 * @returns 配方陣列；找不到時為空陣列
 *
 * @example
 * const recipes = getRecipesByProduct('赫銅塊')
 */
export function getRecipesByProduct(productName: string): RecipeDef[] {
    return _productMap.get(productName)?.recipes ?? [];
}

/**
 * 取得指定產品的單一配方（依 index，預設第 0 個）。
 *
 * @param productName 產品中文名稱
 * @param index       配方索引；對應 FactoryNodeData.recipeIndex
 * @returns 對應的 RecipeDef，找不到時為 `undefined`
 *
 * @example
 * const recipe = getRecipe('源石粉末', 0)
 */
export function getRecipe(productName: string, index = 0): RecipeDef | undefined {
    return _productMap.get(productName)?.recipes[index];
}

/**
 * 取得所有 ProductDef（含所有產品與其下的全部配方）。
 *
 * @returns 全部產品定義陣列
 *
 * @example
 * const products = getAllProducts()
 * const totalRecipes = products.reduce((n, p) => n + p.recipes.length, 0)
 */
export function getAllProducts(): ProductDef[] {
    return productList;
}

/**
 * 取得所有 RecipeDef（攤平所有產品下的配方）。  \
 * 適合做全域配方搜尋 / 統計用途。
 *
 * @returns 全部配方攤平陣列
 *
 * @example
 * const all = getAllRecipes()
 * const crusherRecipes = all.filter((r) => r.machine === '粉碎機')
 */
export function getAllRecipes(): RecipeDef[] {
    return productList.flatMap((p) => p.recipes);
}
