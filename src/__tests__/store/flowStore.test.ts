/**
 * CR-04 useFlowStore 單元測試
 *
 * 測試對象：src/store/flowStore.ts
 * 重點：
 *   - state 初始值
 *   - applyResult / reset / setTicketRate / setWarehouseCapacity 行為
 *   - 衍生 computed（powerBalance / ticketOutput / ticketTotal / warehouseEstimates 等）
 *   - reset 不清除 ticketRates / warehouseCapacity / lastCalculatedAt
 *
 * 備註：flowStore 為衍生狀態 store，不進歷史；本測試不涉及 historyStore。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFlowStore } from '@/store/flowStore';
import type { FlowEngineResult, EdgeFlow, ItemSummary } from '@/types/flow';

// ─── 測試輔助 ────────────────────────────────────────────────────────────────

function makeEdgeFlow(
    connUid: string,
    itemId: string,
    rate: number,
    isCongested = false,
): EdgeFlow {
    return { connectionUid: connUid, itemId, rate, isCongested };
}

function makeItemSummary(opts: {
    itemId: string;
    produced?: number;
    consumed?: number;
    efficiency?: number;
}): ItemSummary {
    const produced = opts.produced ?? 0;
    const consumed = opts.consumed ?? 0;
    return {
        itemId: opts.itemId,
        name: opts.itemId,
        produced,
        consumed,
        net: produced - consumed,
        efficiency: opts.efficiency ?? 1,
    };
}

function makeResult(partial: Partial<FlowEngineResult> = {}): FlowEngineResult {
    return {
        edgeFlows: new Map(),
        nodeEfficiencies: new Map(),
        itemSummary: [],
        sinkDeliveries: new Map(),
        congestedEdges: new Set(),
        invalidChainUids: new Set(),
        totalPowerDemand: 0,
        totalPowerSupply: 0,
        ...partial,
    };
}

// ─── 初始狀態 ─────────────────────────────────────────────────────────────────

describe('useFlowStore — 初始狀態', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('所有 state 為空 Map / 空陣列 / 0', () => {
        const store = useFlowStore();
        expect(store.edgeFlows.size).toBe(0);
        expect(store.nodeEfficiencies.size).toBe(0);
        expect(store.itemSummary).toEqual([]);
        expect(store.sinkDeliveries.size).toBe(0);
        expect(store.congestedEdges.size).toBe(0);
        expect(store.invalidChainUids.size).toBe(0);
        expect(store.totalPowerDemand).toBe(0);
        expect(store.totalPowerSupply).toBe(0);
        expect(store.isCalculating).toBe(false);
        expect(store.lastCalculatedAt).toBe(0);
        expect(store.ticketRates.size).toBe(0);
        expect(store.warehouseCapacity).toBe(0);
    });

    it('衍生 computed 初始皆為合理預設值', () => {
        const store = useFlowStore();
        expect(store.powerBalance).toBe(0);
        expect(store.hasPowerShortage).toBe(false);
        expect(store.edgeFlowCount).toBe(0);
        expect(store.congestedEdgeCount).toBe(0);
        expect(store.invalidChainCount).toBe(0);
        expect(store.hasResults).toBe(false);
        expect(store.ticketOutput.size).toBe(0);
        expect(store.ticketTotal).toBe(0);
        expect(store.warehouseEstimates.size).toBe(0);
    });
});

// ─── applyResult() ────────────────────────────────────────────────────────────

describe('applyResult()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('整批寫入所有計算結果欄位', () => {
        const store = useFlowStore();
        const result = makeResult({
            edgeFlows: new Map([['e1', makeEdgeFlow('e1', '源礦', 30)]]),
            nodeEfficiencies: new Map([['n1', 0.5]]),
            itemSummary: [makeItemSummary({ itemId: '源石粉末', produced: 30, consumed: 0 })],
            totalPowerDemand: 100,
            totalPowerSupply: 200,
        });

        store.applyResult(result);

        expect(store.edgeFlows.size).toBe(1);
        expect(store.nodeEfficiencies.get('n1')).toBe(0.5);
        expect(store.itemSummary[0].itemId).toBe('源石粉末');
        expect(store.totalPowerDemand).toBe(100);
        expect(store.totalPowerSupply).toBe(200);
    });

    it('呼叫後 isCalculating 變回 false', () => {
        const store = useFlowStore();
        store.$patch({ isCalculating: true });
        store.applyResult(makeResult());
        expect(store.isCalculating).toBe(false);
    });

    it('呼叫後 lastCalculatedAt 更新為近期 timestamp', () => {
        const store = useFlowStore();
        const before = Date.now();
        store.applyResult(makeResult());
        expect(store.lastCalculatedAt).toBeGreaterThanOrEqual(before);
    });
});

// ─── reset() ──────────────────────────────────────────────────────────────────

describe('reset()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('清空所有計算結果', () => {
        const store = useFlowStore();
        store.applyResult(
            makeResult({
                edgeFlows: new Map([['e1', makeEdgeFlow('e1', 'x', 1)]]),
                itemSummary: [makeItemSummary({ itemId: 'x', produced: 1 })],
                totalPowerDemand: 50,
            }),
        );

        store.reset();

        expect(store.edgeFlows.size).toBe(0);
        expect(store.itemSummary).toEqual([]);
        expect(store.totalPowerDemand).toBe(0);
        expect(store.isCalculating).toBe(false);
    });

    it('reset 不清除 lastCalculatedAt（保留「曾計算過」標記）', () => {
        const store = useFlowStore();
        store.applyResult(makeResult());
        const ts = store.lastCalculatedAt;
        expect(ts).toBeGreaterThan(0);

        store.reset();
        expect(store.lastCalculatedAt).toBe(ts);
    });

    it('reset 不清除使用者設定的 ticketRates / warehouseCapacity', () => {
        const store = useFlowStore();
        store.setTicketRate('赫銅零件', 5);
        store.setWarehouseCapacity(1000);

        store.reset();

        expect(store.ticketRates.get('赫銅零件')).toBe(5);
        expect(store.warehouseCapacity).toBe(1000);
    });
});

// ─── setTicketRate() ──────────────────────────────────────────────────────────

describe('setTicketRate()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('rate > 0 時寫入 ticketRates', () => {
        const store = useFlowStore();
        store.setTicketRate('赫銅零件', 10);
        expect(store.ticketRates.get('赫銅零件')).toBe(10);
    });

    it('rate <= 0 時移除該品項設定', () => {
        const store = useFlowStore();
        store.setTicketRate('x', 5);
        store.setTicketRate('x', 0);
        expect(store.ticketRates.has('x')).toBe(false);
    });
});

// ─── setWarehouseCapacity() ───────────────────────────────────────────────────

describe('setWarehouseCapacity()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('正常值直接套用', () => {
        const store = useFlowStore();
        store.setWarehouseCapacity(1500);
        expect(store.warehouseCapacity).toBe(1500);
    });

    it('負數視同 0', () => {
        const store = useFlowStore();
        store.setWarehouseCapacity(-100);
        expect(store.warehouseCapacity).toBe(0);
    });
});

// ─── powerBalance / hasPowerShortage ─────────────────────────────────────────

describe('powerBalance / hasPowerShortage', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('供電 > 耗電：powerBalance > 0，hasPowerShortage = false', () => {
        const store = useFlowStore();
        store.applyResult(makeResult({ totalPowerDemand: 100, totalPowerSupply: 150 }));
        expect(store.powerBalance).toBe(50);
        expect(store.hasPowerShortage).toBe(false);
    });

    it('供電 < 耗電：powerBalance < 0，hasPowerShortage = true', () => {
        const store = useFlowStore();
        store.applyResult(makeResult({ totalPowerDemand: 200, totalPowerSupply: 50 }));
        expect(store.powerBalance).toBe(-150);
        expect(store.hasPowerShortage).toBe(true);
    });
});

// ─── ticketOutput / ticketTotal ──────────────────────────────────────────────

describe('ticketOutput / ticketTotal', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('只計算 net > 0 且設了 ticketRate 的品項', () => {
        const store = useFlowStore();
        store.setTicketRate('A', 10);
        store.setTicketRate('B', 5);
        store.applyResult(
            makeResult({
                itemSummary: [
                    makeItemSummary({ itemId: 'A', produced: 2, consumed: 0 }), // net 2，有 rate
                    makeItemSummary({ itemId: 'B', produced: 1, consumed: 5 }), // net 負，不計
                    makeItemSummary({ itemId: 'C', produced: 3, consumed: 0 }), // net 正但無 rate
                ],
            }),
        );

        expect(store.ticketOutput.get('A')).toBe(20); // 2 × 10
        expect(store.ticketOutput.has('B')).toBe(false);
        expect(store.ticketOutput.has('C')).toBe(false);
        expect(store.ticketTotal).toBe(20);
    });

    it('多品項加總到 ticketTotal', () => {
        const store = useFlowStore();
        store.setTicketRate('A', 10);
        store.setTicketRate('B', 4);
        store.applyResult(
            makeResult({
                itemSummary: [
                    makeItemSummary({ itemId: 'A', produced: 2 }),
                    makeItemSummary({ itemId: 'B', produced: 5 }),
                ],
            }),
        );

        expect(store.ticketTotal).toBe(20 + 20);
    });
});

// ─── warehouseEstimates ──────────────────────────────────────────────────────

describe('warehouseEstimates', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('warehouseCapacity = 0 時回傳空 Map', () => {
        const store = useFlowStore();
        store.applyResult(
            makeResult({ itemSummary: [makeItemSummary({ itemId: 'A', produced: 1 })] }),
        );
        expect(store.warehouseEstimates.size).toBe(0);
    });

    it('計算公式 capacity / net / 60，僅含 net > 0 的品項', () => {
        const store = useFlowStore();
        store.setWarehouseCapacity(1200);
        store.applyResult(
            makeResult({
                itemSummary: [
                    makeItemSummary({ itemId: 'A', produced: 10, consumed: 0 }), // net 10
                    makeItemSummary({ itemId: 'B', produced: 0, consumed: 3 }), // net 負
                ],
            }),
        );

        // 1200 / 10 / 60 = 2 hr
        expect(store.warehouseEstimates.get('A')).toBeCloseTo(2, 5);
        expect(store.warehouseEstimates.has('B')).toBe(false);
    });
});

// ─── hasResults ──────────────────────────────────────────────────────────────

describe('hasResults', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('未計算過時為 false', () => {
        const store = useFlowStore();
        expect(store.hasResults).toBe(false);
    });

    it('applyResult 後且有 summary 時為 true', () => {
        const store = useFlowStore();
        store.applyResult(
            makeResult({ itemSummary: [makeItemSummary({ itemId: 'A', produced: 1 })] }),
        );
        expect(store.hasResults).toBe(true);
    });

    it('applyResult 後但 summary 為空時為 false', () => {
        const store = useFlowStore();
        store.applyResult(makeResult({ itemSummary: [] }));
        expect(store.hasResults).toBe(false);
    });
});
