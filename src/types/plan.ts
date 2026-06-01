/**
 * 計畫（Plan）型別定義
 *
 * 資料來源：src/data/plans.ts
 * 分離原因：interface 定義不應與資料共存於 data 層。
 */

export interface MaterialRate {
    name: string;
    rate: number | null; // null = 無限制
}

export interface MachineLimit {
    name: string;
    limit: number | null; // null = 無限制
}

export interface ProductValue {
    name: string;
    price: number;
}

export interface Plan {
    id: string;
    name: string;
    material_rates: MaterialRate[];
    machine_limits: MachineLimit[];
    product_values: ProductValue[];
    priority_products: { name: string; max_rate: number | null }[];
}
