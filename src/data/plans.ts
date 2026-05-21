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

export const plans: Plan[] = [
    {
        id: '7dd94e87-a806-4035-9644-63eb99f76f75',
        name: '四號谷地',
        material_rates: [
            { name: '源礦', rate: 560 },
            { name: '紫晶礦', rate: 240 },
            { name: '藍鐵礦', rate: 1080 },
            { name: '蕆花', rate: null },
            { name: '柑實', rate: null },
            { name: '砂葉', rate: null },
            { name: '酰化灶木', rate: null },
            { name: '錦草', rate: null },
            { name: '芽針', rate: null },
        ],
        machine_limits: [
            { name: '塑型機', limit: null },
            { name: '灣裝機', limit: null },
            { name: '精煬爐', limit: null },
            { name: '粉碎機', limit: null },
            { name: '配件機', limit: null },
            { name: '裝備原件機', limit: null },
            { name: '封裝機', limit: null },
            { name: '研磨機', limit: null },
        ],
        product_values: [
            { name: '精選蕎癒膠囊', price: 70 },
            { name: '高容量谷地電池', price: 70 },
            { name: '精選柑實罐頭', price: 70 },
            { name: '中容量谷地電池', price: 30 },
            { name: '優質蕎癒膠囊', price: 27 },
            { name: '優質柑實罐頭', price: 27 },
            { name: '蕎癒膠囊', price: 10 },
            { name: '柑實罐頭', price: 10 },
            { name: '紫晶質瓶', price: 2 },
            { name: '晶體外殼', price: 1 },
            { name: '紫晶零件', price: 1 },
            { name: '低容量谷地電池', price: 16 },
            { name: '鐵製零件', price: 1 },
            { name: '鋼製零件', price: 1 },
        ],
        priority_products: [{ name: '高容量谷地電池', max_rate: null }],
    },
    {
        id: '9bdb2f99-531e-416a-8f4c-27c5e8d8957c',
        name: '武陵',
        material_rates: [
            { name: '源礦', rate: 540 },
            { name: '紫晶礦', rate: 0 },
            { name: '藍鐵礦', rate: 90 },
            { name: '赤銅礦', rate: 240 },
            { name: '蕆花', rate: null },
            { name: '柑實', rate: null },
            { name: '砂葉', rate: null },
            { name: '酰化灶木', rate: null },
            { name: '錦草', rate: null },
            { name: '芽針', rate: null },
            { name: '清水', rate: null },
            { name: '沉積酸', rate: null },
        ],
        machine_limits: [
            { name: '塑型機', limit: null },
            { name: '灣裝機', limit: null },
            { name: '精煬爐', limit: null },
            { name: '粉碎機', limit: null },
            { name: '配件機', limit: null },
            { name: '裝備原件機', limit: null },
            { name: '封裝機', limit: null },
            { name: '研磨機', limit: null },
            { name: '反應池', limit: null },
            { name: '天有洪爐', limit: 12 },
            { name: '提純機', limit: null },
            { name: '拆解機', limit: null },
        ],
        product_values: [
            { name: '中容量武陵電池', price: 54 },
            { name: '優質芽針針劑', price: 22 },
            { name: '赫銅零件', price: 48 },
            { name: '低容量谷地電池', price: 25 },
            { name: '芽針針劑', price: 16 },
            { name: '赤銅零件', price: 1 },
            { name: '息壤', price: 1 },
            { name: '重息壤', price: 27 },
            { name: '優質錦草飲料', price: 22 },
            { name: '錦草飲料', price: 16 },
        ],
        priority_products: [],
    },
];
