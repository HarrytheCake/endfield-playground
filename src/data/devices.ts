/**
 * CR-04 設備與配方資料（Stub）
 *
 * ⚠️  本檔案由 CR-04 暫行建立，對齊 docs/aaaaa/data/machines.json 與 products.json。
 *     CR-01 正式定義 devices.ts 後，本檔案應由 CR-01 接管並擴充
 *     （加入格子制佔位、port 座標、完整電力數值等）。
 *
 * 存取方式：
 *   import { getMachineDef, getRecipesForMachine, getAllRecipes } from '@/data/devices'
 */

import type { MachineDef, RecipeDef, ProductDef } from '@/types/flow';

// ─── 設備定義（對齊 machines.json） ────────────────────────────────────────────

const MACHINE_DEFS: MachineDef[] = [
    {
        name: '塑型機',
        width: 4,
        height: 3,
        inputPorts: [
            { side: 'left', offset: 0 },
            { side: 'left', offset: 2 },
        ],
        outputPorts: [{ side: 'right', offset: 1 }],
        power: -1,
        tags: ['合成'],
    },
    {
        name: '灌裝機',
        width: 1,
        height: 1,
        inputPorts: [],
        outputPorts: [],
        power: -1,
        tags: ['合成'],
        isSource: false,
        isSink: false,
    },
    {
        name: '精煉爐',
        width: 3,
        height: 3,
        inputPorts: [{ side: 'left', offset: 1 }],
        outputPorts: [{ side: 'right', offset: 1 }],
        power: -1,
        tags: ['合成'],
        isSource: false,
        isSink: false,
    },
    {
        name: '粉碎機',
        width: 3,
        height: 3,
        inputPorts: [{ side: 'left', offset: 1 }],
        outputPorts: [{ side: 'right', offset: 1 }],
        power: -1,
        tags: ['分解'],
        isSource: false,
        isSink: false,
    },
    {
        name: '配件機',
        width: 3,
        height: 3,
        inputPorts: [{ side: 'left', offset: 1 }],
        outputPorts: [{ side: 'right', offset: 1 }],
        power: -1,
        tags: ['合成'],
        isSource: false,
        isSink: false,
    },
    {
        name: '裝備原件機',
        width: 3,
        height: 3,
        inputPorts: [],
        outputPorts: [],
        power: -1,
        tags: [],
        isSource: false,
        isSink: false,
    },
    {
        name: '封裝機',
        width: 1,
        height: 1,
        inputPorts: [],
        outputPorts: [],
        power: -1,
        tags: [],
    },
    {
        name: '研磨機',
        width: 1,
        height: 1,
        inputPorts: [],
        outputPorts: [],
        power: -1,
        tags: [],
    },
    {
        name: '反應池',
        width: 1,
        height: 1,
        inputPorts: [],
        outputPorts: [],
        power: -1,
        tags: [],
    },
    {
        name: '天有洪爐',
        width: 1,
        height: 1,
        inputPorts: [],
        outputPorts: [],
        power: -1,
        tags: [],
    },
    {
        name: '提純機',
        width: 1,
        height: 1,
        inputPorts: [],
        outputPorts: [],
        power: -1,
        tags: [],
    },
    {
        name: '拆解機',
        width: 1,
        height: 1,
        inputPorts: [],
        outputPorts: [],
        power: -1,
        tags: [],
    },
    {
        name: '物品輸出口',
        width: 1,
        height: 3,
        inputPorts: [],
        outputPorts: [{ side: 'right', offset: 1 }],
        power: -1,
        tags: [],
        isSource: true,
        isSink: false,
    },
    {
        name: '物品輸入口',
        width: 1,
        height: 3,
        inputPorts: [{ side: 'right', offset: 1 }],
        outputPorts: [],
        power: -1,
        tags: [],
        isSource: false,
        isSink: true,
    },
];

// ─── 配方定義（對齊 products.json，部分品項）──────────────────────────────────
//
// 完整配方極多（products.json 共 2400+ 行），此處以 FlowEngine 開發與
// H1–H6 測試情境所需的配方為主，其餘留白供後續補充。
//
// 命名慣例：RECIPES_<品項名> ，以 ProductDef 格式組織。

const PRODUCT_DEFS: ProductDef[] = [
    // ── 粉末類 ──────────────────────────────────────────────────────────────
    {
        name: '源石粉末',
        recipes: [
            {
                inputs: [{ itemId: '源礦', quantity: 1 }],
                outputs: [{ itemId: '源石粉末', quantity: 1 }],
                machine: '粉碎機',
                timeSeconds: 2,
            },
        ],
    },
    {
        name: '藍鐵粉末',
        recipes: [
            {
                inputs: [{ itemId: '藍鐵礦', quantity: 1 }],
                outputs: [{ itemId: '藍鐵粉末', quantity: 2 }],
                machine: '粉碎機',
                timeSeconds: 2,
            },
        ],
    },
    {
        name: '紫晶粉末',
        recipes: [
            {
                inputs: [{ itemId: '紫晶礦', quantity: 1 }],
                outputs: [{ itemId: '紫晶粉末', quantity: 1 }],
                machine: '粉碎機',
                timeSeconds: 2,
            },
        ],
    },
    {
        name: '赤銅粉末',
        recipes: [
            {
                inputs: [{ itemId: '赤銅礦', quantity: 1 }],
                outputs: [{ itemId: '赤銅粉末', quantity: 1 }],
                machine: '粉碎機',
                timeSeconds: 2,
            },
        ],
    },
    {
        name: '碳粉末',
        recipes: [
            {
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
        name: '研製合成粉末方塊',
        recipes: [
            {
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
        name: '藍鐵塊',
        recipes: [
            {
                inputs: [{ itemId: '藍鐵粉末', quantity: 2 }],
                outputs: [{ itemId: '藍鐵塊', quantity: 1 }],
                machine: '精煉爐',
                timeSeconds: 2,
            },
        ],
    },
    {
        name: '紫晶纖維',
        recipes: [
            {
                inputs: [{ itemId: '紫晶粉末', quantity: 2 }],
                outputs: [{ itemId: '紫晶纖維', quantity: 1 }],
                machine: '精煉爐',
                timeSeconds: 2,
            },
        ],
    },
    {
        name: '赤銅塊',
        recipes: [
            {
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
        name: '穩定碳塊',
        recipes: [
            {
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
        name: '赤銅溶液',
        recipes: [
            {
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
        name: '赫銅塊',
        recipes: [
            {
                inputs: [
                    { itemId: '赫銅溶液', quantity: 1 },
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
        name: '赫銅溶液',
        recipes: [
            {
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
        name: '赤銅零件',
        recipes: [
            {
                inputs: [{ itemId: '赤銅塊', quantity: 1 }],
                outputs: [{ itemId: '赤銅零件', quantity: 1 }],
                machine: '配件機',
                timeSeconds: 2,
            },
        ],
    },
    {
        name: '赫銅零件',
        recipes: [
            {
                inputs: [{ itemId: '赫銅塊', quantity: 1 }],
                outputs: [{ itemId: '赫銅零件', quantity: 1 }],
                machine: '配件機',
                timeSeconds: 2,
            },
        ],
    },
    // ── 電池類（四號谷地主力產品 H1 測試情境）──────────────────────────────
    {
        name: '紫晶質瓶',
        recipes: [
            {
                inputs: [{ itemId: '紫晶纖維', quantity: 1 }],
                outputs: [{ itemId: '紫晶質瓶', quantity: 1 }],
                machine: '塑型機',
                timeSeconds: 2,
            },
        ],
    },
    {
        name: '藍鐵瓶',
        recipes: [
            {
                inputs: [{ itemId: '藍鐵塊', quantity: 1 }],
                outputs: [{ itemId: '藍鐵瓶', quantity: 1 }],
                machine: '塑型機',
                timeSeconds: 2,
            },
        ],
    },
    {
        name: '低容量谷地電池',
        recipes: [
            {
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
        name: '中容量谷地電池',
        recipes: [
            {
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
        name: '高容量谷地電池',
        recipes: [
            {
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

/** MachineDef 快查 Map（name → MachineDef） */
const _machineMap = new Map<string, MachineDef>(MACHINE_DEFS.map((m) => [m.name, m]));

/** ProductDef 快查 Map（productName → ProductDef） */
const _productMap = new Map<string, ProductDef>(PRODUCT_DEFS.map((p) => [p.name, p]));

/**
 * 依設備名稱取得 MachineDef。
 * @returns MachineDef 或 undefined（未知設備）
 */
export function getMachineDef(machineName: string): MachineDef | undefined {
    return _machineMap.get(machineName);
}

/**
 * 取得所有使用指定設備的配方。
 * @param machineName 設備名稱
 * @returns RecipeDef[]（可能為空陣列）
 */
export function getRecipesForMachine(machineName: string): RecipeDef[] {
    return PRODUCT_DEFS.flatMap((p) => p.recipes.filter((r) => r.machine === machineName));
}

/**
 * 依產品名稱取得所有配方。
 * @returns RecipeDef[]（可能為空陣列）
 */
export function getRecipesByProduct(productName: string): RecipeDef[] {
    return _productMap.get(productName)?.recipes ?? [];
}

/**
 * 取得指定產品的單一配方（依 index）。
 * @returns RecipeDef 或 undefined
 */
export function getRecipe(productName: string, index = 0): RecipeDef | undefined {
    return _productMap.get(productName)?.recipes[index];
}

/** 取得所有 MachineDef */
export function getAllMachines(): MachineDef[] {
    return MACHINE_DEFS;
}

/** 取得所有 ProductDef */
export function getAllProducts(): ProductDef[] {
    return PRODUCT_DEFS;
}

/** 取得所有 RecipeDef（攤平） */
export function getAllRecipes(): RecipeDef[] {
    return PRODUCT_DEFS.flatMap((p) => p.recipes);
}
