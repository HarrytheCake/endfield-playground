/**
 * FlowEngine／驗證結果 → 右側產線總覽（StatsPanel）props 的轉接
 *
 * 純函式，不讀 store；由 `ProductionStats.vue` 從 store 取值後呼叫，方便單元測試。
 */

import type { SingleTip, StatsPanelProps } from '@/app/StatsPanel/types';
import type { ItemSummary, TicketCurrencyRate } from '@/types/flow';
import type { Alert } from '@/types/validation';

/** 轉接所需的來源資料（對應 layoutStore／flowStore／validationStore 的欄位） */
export interface StatsPanelSource {
    /** 正式畫布是否有設備，`layoutStore.devices.length > 0`；為 false 時面板顯示「尚未擺放設備」 */
    hasDevices: boolean;
    /** 總耗電量（kW），`flowStore.totalPowerDemand` */
    powerDemand: number;
    /** 總供電量（kW），`flowStore.totalPowerSupply` */
    powerSupply: number;
    /** 各品項產耗摘要，`flowStore.itemSummary` */
    itemSummary: readonly ItemSummary[];
    /** 自動交付調度券總效率（券/hr），`flowStore.deliveryTicketTotal` */
    ticketTotal: number;
    /** 各券種自動交付兌換效率（券/hr），`flowStore.deliveryTicketRates` */
    ticketRates: readonly TicketCurrencyRate[];
    /** 驗證警示，`validationStore.alerts` */
    alerts: readonly Alert[];
}

/**
 * 四捨五入到小數一位。  \
 * StatsPanel 直接以 `toLocaleString` 顯示數值，不先取整會出現 12.333 這類引擎算出的長小數。
 * @param value 原始數值
 */
function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

/**
 * 組出 StatsPanel 的 props。
 *
 * - 耗電與供電都為 0 時不給 `power`，讓面板顯示「-」而不是「0kW/0kW」（尚無設備或引擎未算）
 * - 調度券總效率為 0 時不給 `exchangeRate`，面板顯示「-」
 * - 沒有設備時各券種效率立即歸零（保留券種名稱），避免顯示引擎尚未清除的上一輪數值
 * - Tips 依警示原順序列出，文字用 `Alert.message`
 *
 * @param source 來源資料
 * @returns StatsPanel 的 props
 */
export function toStatsPanelProps(source: StatsPanelSource): StatsPanelProps {
    const hasPower = source.powerDemand > 0 || source.powerSupply > 0;
    const ticketTotal = source.hasDevices ? round1(source.ticketTotal) : 0;
    const tips: SingleTip[] = source.alerts.map((alert) => ({
        type: alert.level,
        text: alert.message,
    }));

    return {
        hasDevices: source.hasDevices,
        power: hasPower
            ? { used: round1(source.powerDemand), total: round1(source.powerSupply) }
            : undefined,
        products: source.itemSummary.map((item) => ({
            id: item.itemId,
            name: item.name,
            produce: round1(item.produced),
            consume: round1(item.consumed),
            profit: round1(item.net),
        })),
        exchangeRate: ticketTotal > 0 ? ticketTotal : undefined,
        exchangeRates: source.ticketRates.map((item) => ({
            ...item,
            rate: source.hasDevices ? round1(item.rate) : 0,
        })),
        tips,
    };
}
