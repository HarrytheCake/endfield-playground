/**
 * toStatsPanelProps — FlowEngine／驗證結果轉成 StatsPanel props
 */
import { describe, it, expect } from 'vitest';
import { toStatsPanelProps, type StatsPanelSource } from '@/editor/stats/toStatsPanelProps';
import type { ItemSummary, TicketCurrencyRate } from '@/types/flow';
import type { Alert } from '@/types/validation';

/** 空來源：尚無設備、引擎沒有結果 */
const EMPTY: StatsPanelSource = {
    hasDevices: false,
    powerDemand: 0,
    powerSupply: 0,
    itemSummary: [],
    ticketTotal: 0,
    ticketRates: [],
    alerts: [],
};

/** 自由畫布的兩種券，數值帶長小數 */
const RATES: TicketCurrencyRate[] = [
    { currency: 'wuling', label: '武陵調度券', rate: 12.345 },
    { currency: 'valley4', label: '谷地調度券', rate: 0 },
];

/**
 * 建立最小的品項摘要；未用到的欄位以型別斷言略過。
 * @param patch 要覆寫的欄位
 */
function summary(patch: Partial<ItemSummary>): ItemSummary {
    return { itemId: 'x', name: 'x', produced: 0, consumed: 0, net: 0, ...patch } as ItemSummary;
}

/**
 * 建立最小的警示。
 * @param level 警示等級
 * @param message 顯示文字
 */
function alert(level: Alert['level'], message: string): Alert {
    return {
        uid: message,
        level,
        code: level === 'error' ? 'E000' : 'W000',
        message,
        relatedDeviceUids: [],
        relatedConnectionUids: [],
    };
}

describe('toStatsPanelProps', () => {
    it('空來源：power／exchangeRate 不給，讓面板顯示「-」', () => {
        const props = toStatsPanelProps(EMPTY);
        expect(props.hasDevices).toBe(false);
        expect(props.power).toBeUndefined();
        expect(props.exchangeRate).toBeUndefined();
        expect(props.products).toEqual([]);
        expect(props.tips).toEqual([]);
    });

    it('電力取小數一位；只要有耗電或供電就給 power', () => {
        expect(toStatsPanelProps({ ...EMPTY, powerDemand: 12.345, powerSupply: 0 }).power).toEqual({
            used: 12.3,
            total: 0,
        });
    });

    it('品項摘要轉成產品明細並取小數一位', () => {
        const props = toStatsPanelProps({
            ...EMPTY,
            itemSummary: [
                summary({
                    itemId: '源礦',
                    name: '源礦',
                    produced: 30,
                    consumed: 12.3333,
                    net: 17.6667,
                }),
            ],
        });
        expect(props.products).toEqual([
            { id: '源礦', name: '源礦', produce: 30, consume: 12.3, profit: 17.7 },
        ]);
    });

    it('有設備且調度券總效率大於 0 才給 exchangeRate', () => {
        expect(
            toStatsPanelProps({ ...EMPTY, hasDevices: true, ticketTotal: 120.04 }).exchangeRate,
        ).toBe(120);
        expect(toStatsPanelProps({ ...EMPTY, ticketTotal: 120.04 }).exchangeRate).toBeUndefined();
    });

    it('有設備時各券種效率取小數一位', () => {
        const props = toStatsPanelProps({ ...EMPTY, hasDevices: true, ticketRates: RATES });
        expect(props.hasDevices).toBe(true);
        expect(props.exchangeRates).toEqual([
            { currency: 'wuling', label: '武陵調度券', rate: 12.3 },
            { currency: 'valley4', label: '谷地調度券', rate: 0 },
        ]);
    });

    it('沒有設備時各券種效率歸零但保留券種名稱', () => {
        const props = toStatsPanelProps({ ...EMPTY, ticketRates: RATES });
        expect(props.exchangeRates).toEqual([
            { currency: 'wuling', label: '武陵調度券', rate: 0 },
            { currency: 'valley4', label: '谷地調度券', rate: 0 },
        ]);
    });

    it('警示依原順序轉成 Tips', () => {
        const props = toStatsPanelProps({
            ...EMPTY,
            alerts: [alert('error', '位置重疊'), alert('warning', '耗電超載')],
        });
        expect(props.tips).toEqual([
            { type: 'error', text: '位置重疊' },
            { type: 'warning', text: '耗電超載' },
        ]);
    });
});
