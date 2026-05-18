/**
 * CR-04 useFlowStore
 *
 * 儲存 FlowEngine 的所有計算結果。
 * 由 useFlowEngine composable 寫入，UI 元件唯讀。
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { EdgeFlow, ItemSummary } from '@/types/flow';

export const useFlowStore = defineStore('flow', () => {
    // ── 管線流量 ──────────────────────────────────────────────────────────────
    /** connectionUid → EdgeFlow（管線實際傳輸速率與堵塞狀態） */
    const edgeFlows = ref(new Map<string, EdgeFlow>());

    // ── 設備效率 ──────────────────────────────────────────────────────────────
    /** deviceUid → 效率 0~1 */
    const nodeEfficiencies = ref(new Map<string, number>());

    // ── 品項統計摘要 ──────────────────────────────────────────────────────────
    /** 所有參與計算品項的 produced / consumed / net / efficiency */
    const itemSummary = ref<ItemSummary[]>([]);

    // ── 異常節點集合 ──────────────────────────────────────────────────────────
    /** 堵塞的 connectionUid 集合（isCongested = true 的邊） */
    const congestedEdges = ref(new Set<string>());

    /**
     * 非合法鏈路 / 孤立節點的 deviceUid 集合。
     * 這些節點不參與流量計算，畫布顯示灰色虛線。
     */
    const invalidChainUids = ref(new Set<string>());

    // ── 電力統計 ──────────────────────────────────────────────────────────────
    /** 所有有效設備的總耗電量（kW）；power=-1 的設備暫計為 0 */
    const totalPowerDemand = ref(0);

    /** 所有供電設備（isSource 且有 power_output）的總供電量（kW） */
    const totalPowerSupply = ref(0);

    // ── 元資料 ────────────────────────────────────────────────────────────────
    /** FlowEngine 計算中 flag，防止 UI 讀到中間狀態 */
    const isCalculating = ref(false);

    /** 最後一次計算完成的 timestamp（ms），0 表示尚未計算過 */
    const lastCalculatedAt = ref(0);

    // ── 衍生計算值（computed） ────────────────────────────────────────────────

    /** 電力盈餘（kW），正 = 盈餘，負 = 不足 */
    const powerBalance = computed(() => totalPowerSupply.value - totalPowerDemand.value);

    /** 是否有電力不足 */
    const hasPowerShortage = computed(() => powerBalance.value < 0);

    /** 有效管線數量 */
    const edgeFlowCount = computed(() => edgeFlows.value.size);

    /** 堵塞管線數量 */
    const congestedEdgeCount = computed(() => congestedEdges.value.size);

    /** 非合法鏈路節點數量 */
    const invalidChainCount = computed(() => invalidChainUids.value.size);

    /** 是否有任何計算結果（判斷畫布是否有合法鏈路） */
    const hasResults = computed(() => lastCalculatedAt.value > 0 && itemSummary.value.length > 0);

    // ── Actions ───────────────────────────────────────────────────────────────

    /**
     * 清空所有計算結果，回到初始狀態。
     * 在 FlowEngine 重新計算前或畫布清空時調用。
     */
    function reset() {
        edgeFlows.value = new Map();
        nodeEfficiencies.value = new Map();
        itemSummary.value = [];
        congestedEdges.value = new Set();
        invalidChainUids.value = new Set();
        totalPowerDemand.value = 0;
        totalPowerSupply.value = 0;
        isCalculating.value = false;
        // 不重置 lastCalculatedAt，保留「曾計算過」的歷史紀錄
    }

    /**
     * 批次寫入 FlowEngine 計算結果。
     * 由 useFlowEngine.runFlowEngine() 在計算完成後一次性呼叫，
     * 避免多次個別賦值觸發多次 Vue 響應式更新。
     */
    function applyResult(payload: {
        edgeFlows: Map<string, EdgeFlow>;
        nodeEfficiencies: Map<string, number>;
        itemSummary: ItemSummary[];
        congestedEdges: Set<string>;
        invalidChainUids: Set<string>;
        totalPowerDemand: number;
        totalPowerSupply: number;
    }) {
        edgeFlows.value = payload.edgeFlows;
        nodeEfficiencies.value = payload.nodeEfficiencies;
        itemSummary.value = payload.itemSummary;
        congestedEdges.value = payload.congestedEdges;
        invalidChainUids.value = payload.invalidChainUids;
        totalPowerDemand.value = payload.totalPowerDemand;
        totalPowerSupply.value = payload.totalPowerSupply;
        lastCalculatedAt.value = Date.now();
        isCalculating.value = false;
    }

    return {
        // state
        edgeFlows,
        nodeEfficiencies,
        itemSummary,
        congestedEdges,
        invalidChainUids,
        totalPowerDemand,
        totalPowerSupply,
        isCalculating,
        lastCalculatedAt,
        // computed
        powerBalance,
        hasPowerShortage,
        edgeFlowCount,
        congestedEdgeCount,
        invalidChainCount,
        hasResults,
        // actions
        reset,
        applyResult,
    };
});
