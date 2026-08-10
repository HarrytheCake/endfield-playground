/**
 * 計畫（Plan）型別定義
 *
 * 資料來源：src/data/plans.ts
 * 分離原因：interface 定義不應與資料共存於 data 層。
 */

/**
 * 該計畫某項原料的供給速率上限
 */
export interface MaterialRate {
    /** 原料中文名稱 */
    name: string;
    /** 供給速率（個/min）；`null` 代表無上限 */
    rate: number | null;
}

/**
 * 該計畫某類機器的部署數量上限
 */
export interface MachineLimit {
    /** 機器中文名稱 */
    name: string;
    /** 數量上限；`null` 代表無上限 */
    limit: number | null;
}

/**
 * 該計畫對某產品的兌換價值
 */
export interface ProductValue {
    /** 產品中文名稱 */
    name: string;
    /** 該品項在本計畫下的兌換單價（券 / 個或內部評估值） */
    price: number;
}

/**
 * 建造計畫（基地配置 + 資源 / 機器限制 + 產品價值）
 * 對應遊戲內可選的基地（武陵 / 四號谷地 等）。
 */
export interface Plan {
    /** 計畫唯一識別碼（UUID） */
    id: string;
    /** 計畫中文名稱（顯示用） */
    name: string;
    /** 該計畫各原料的供給速率 */
    material_rates: MaterialRate[];
    /** 該計畫各類機器的部署數量限制 */
    machine_limits: MachineLimit[];
    /** 該計畫產品的兌換價值表 */
    product_values: ProductValue[];
    /**
     * 優先生產的產品清單；通常為玩家在該計畫主推的最終產出。
     * `max_rate` 為 `null` 代表不設上限。
     */
    priority_products: { name: string; max_rate: number | null }[];
    /**
     * 計畫外額外流入（個／小時；配頻時 ÷60）。
     * data v3 欄位；缺省視為空陣列。
     */
    transport_items?: TransportItem[];
}

/**
 * 計畫外超傳輸流入品項（data v3）
 */
export interface TransportItem {
    /** 物品名 */
    name: string;
    /** 流入速率（個／小時） */
    rate_per_hour: number;
}
