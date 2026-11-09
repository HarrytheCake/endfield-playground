import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
    EdgeFlow,
    ItemSummary,
    FlowEngineResult,
    TicketCurrency,
    TicketCurrencyRate,
    TicketUnitPrice,
} from '@/types/flow';
import { plans } from '@/data/plans';
import { useCanvasStore } from '@/store/canvasStore';

/**
 * CR-04 儲存 FlowEngine 的所有計算結果（管線流量、設備效率、電力統計等）。
 * 由 useFlowEngine composable 寫入，UI 元件唯讀。
 * @example
 * const flowStore = useFlowStore()
 * flowStore.applyResult(result)
 * console.log(flowStore.hasResults)
 */
export const useFlowStore = defineStore('flow', () => {
    /** 基地選擇提供自動計價範圍；價格切換不需重新執行流量引擎。 */
    const canvasStore = useCanvasStore();

    /** 品項單價與券種來源一併選取，讓自由畫布的同名覆蓋同時決定券種。 */
    const deliveryTicketQuotes = computed(() => {
        /** 使用計畫識別值，避免介面基地標籤與資料名稱不同。 */
        const wuling = plans.find((plan) => plan.id === '9bdb2f99-531e-416a-8f4c-27c5e8d8957c');
        /** 四號谷地也是自由畫布缺少武陵品項時的價格來源。 */
        const valley = plans.find((plan) => plan.id === '7dd94e87-a806-4035-9644-63eb99f76f75');
        /** 武陵品項單價及對應券種。 */
        const wulingValues = (wuling?.product_values ?? []).map(
            (value) => [value.name, { price: value.price, currency: 'wuling' }] as const,
        );
        /** 谷地品項單價及對應券種。 */
        const valleyValues = (valley?.product_values ?? []).map(
            (value) => [value.name, { price: value.price, currency: 'valley4' }] as const,
        );
        /** 後列項目覆蓋同名價格及券種；單一基地不使用另一基地的價格。 */
        const values =
            canvasStore.baseRegion === 'wuling'
                ? wulingValues
                : canvasStore.baseRegion === 'valley4'
                  ? valleyValues
                  : [...valleyValues, ...wulingValues];
        return new Map<string, TicketUnitPrice>(values);
    });

    /** 基地品項單價（券／個）；自由畫布逐項以武陵覆蓋谷地的後備價格。 */
    const deliveryTicketPrices = computed(
        () => new Map([...deliveryTicketQuotes.value].map(([id, quote]) => [id, quote.price])),
    );

    // ── 管線流量 ──────────────────────────────────────────────────────────────
    /** connectionUid → EdgeFlow（管線實際傳輸速率與堵塞狀態） */
    const edgeFlows = ref(new Map<string, EdgeFlow>());

    // ── 設備效率 ──────────────────────────────────────────────────────────────
    /** deviceUid → 效率 0~1 */
    const nodeEfficiencies = ref(new Map<string, number>());

    // ── 品項統計摘要 ──────────────────────────────────────────────────────────
    /** 所有參與計算品項的 produced / consumed / net / efficiency */
    const itemSummary = ref<ItemSummary[]>([]);

    // ── 物品輸入口交付量 ──────────────────────────────────────────────────────
    /** itemId → 流入物品輸入口（sink）的速率（個/min），代表產線實際交付量 */
    const sinkDeliveries = ref(new Map<string, number>());

    /** 自動調度券明細（券／小時），僅換算實際交付且有有效單價的品項。 */
    const deliveryTicketOutput = computed(() => {
        /** 每個品項的每小時券數，不使用品項淨產量或手動兌換設定。 */
        const output = new Map<string, number>();
        for (const [itemId, delivery] of sinkDeliveries.value) {
            /** 缺少價格的品項貢獻為零。 */
            const price = deliveryTicketPrices.value.get(itemId) ?? 0;
            if (
                !Number.isFinite(delivery) ||
                delivery <= 0 ||
                !Number.isFinite(price) ||
                price <= 0
            )
                continue;
            /** 交付量是個／分，乘以六十換成券／小時。 */
            const tickets = delivery * price * 60;
            if (Number.isFinite(tickets)) output.set(itemId, tickets);
        }
        return output;
    });

    /** 自動調度券總額（券／小時）；無有效交付時為 0，避免累加溢位。 */
    const deliveryTicketTotal = computed(() =>
        [...deliveryTicketOutput.value.values()].reduce(
            (sum, value) => Math.min(Number.MAX_VALUE, sum + value),
            0,
        ),
    );

    /** 各券種兌換效率（券／小時）；自由畫布分開顯示兩種券，無交付時仍保留零值。 */
    const deliveryTicketRates = computed<TicketCurrencyRate[]>(() => {
        /** 按目前基地決定可見券種，自由畫布固定先武陵後谷地。 */
        const currencies: TicketCurrency[] = canvasStore.baseRegion
            ? [canvasStore.baseRegion]
            : ['wuling', 'valley4'];
        /** 分別累計兩種券，避免混合價格來源成為同一券種。 */
        const totals: Record<TicketCurrency, number> = { wuling: 0, valley4: 0 };
        for (const [itemId, tickets] of deliveryTicketOutput.value) {
            /** 沿用實際採用單價的來源，不重新選價或再次換算時間。 */
            const currency = deliveryTicketQuotes.value.get(itemId)?.currency;
            if (currency) totals[currency] = Math.min(Number.MAX_VALUE, totals[currency] + tickets);
        }
        return currencies.map((currency) => ({
            currency,
            label: currency === 'wuling' ? '武陵調度券' : '谷地調度券',
            rate: totals[currency],
        }));
    });

    // ── 異常節點集合 ──────────────────────────────────────────────────────────
    /** 堵塞的 connectionUid 集合（isCongested = true 的邊） */
    const congestedEdges = ref(new Set<string>());

    /**
     * 非合法鏈路 / 孤立節點的 deviceUid 集合。
     * 這些節點不參與流量計算，畫布顯示灰色虛線。
     */
    const invalidChainUids = ref(new Set<string>());

    // ── 電力統計 ──────────────────────────────────────────────────────────────
    /** 全部已擺放設備的額定總耗電量（kW），不依鏈路或效率折算；僅加總正值 power */
    const totalPowerDemand = ref(0);

    /** 全部已擺放設備的額定產電加總（kW），排除 power=-1；缺資料為 0。 */
    const totalPowerSupply = ref(0);

    // ── 元資料 ────────────────────────────────────────────────────────────────
    /** FlowEngine 計算中 flag，防止 UI 讀到中間狀態 */
    const isCalculating = ref(false);

    /** 最後一次計算完成的 timestamp（ms），0 表示尚未計算過 */
    const lastCalculatedAt = ref(0);

    // ── 使用者設定（V2：調度券 + 倉庫） ──────────────────────────────────────

    /**
     * 調度券兌換率，itemId → 券/hr per 個/min。
     * 由使用者在統計面板手動設定；未設定的品項不顯示於調度券區塊。
     * reset() 不清除此設定，保留跨計算的使用者偏好。
     */
    const ticketRates = ref(new Map<string, number>());

    /**
     * 倉庫容量（格數）。0 = 未設定，不顯示填滿預估。
     * 由使用者在統計面板手動輸入；reset() 不清除。
     */
    const warehouseCapacity = ref(0);

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

    /**
     * 調度券元明細，itemId → 券/hr。
     * 僅包含 net > 0 且已設定兌換率的品項。
     */
    const ticketOutput = computed(() => {
        const map = new Map<string, number>();
        for (const item of itemSummary.value) {
            const rate = ticketRates.value.get(item.itemId);
            if (rate && rate > 0 && item.net > 0) {
                map.set(item.itemId, item.net * rate);
            }
        }
        return map;
    });

    /** 調度券總產出（券/hr），所有 ticketOutput 元素加總 */
    const ticketTotal = computed(() =>
        [...ticketOutput.value.values()].reduce((sum, v) => sum + v, 0),
    );

    /**
     * 倉庫填滿預估，itemId → 小時。
     * 僅包含 net > 0 的品項；warehouseCapacity <= 0 時回傳空 Map。
     * fillTime(hr) = warehouseCapacity(格) / net(個/min) / 60
     */
    const warehouseEstimates = computed(() => {
        const map = new Map<string, number>();
        if (warehouseCapacity.value <= 0) return map;
        for (const item of itemSummary.value) {
            if (item.net > 0.001) {
                map.set(item.itemId, warehouseCapacity.value / item.net / 60);
            }
        }
        return map;
    });

    // ── Actions ───────────────────────────────────────────────────────────────

    /**
     * 清空所有計算結果，回到初始狀態。
     * 在 FlowEngine 重新計算前或畫布清空時調用。
     * @example
     * flowStore.reset()
     */
    function reset() {
        edgeFlows.value = new Map();
        nodeEfficiencies.value = new Map();
        itemSummary.value = [];
        sinkDeliveries.value = new Map();
        congestedEdges.value = new Set();
        invalidChainUids.value = new Set();
        totalPowerDemand.value = 0;
        totalPowerSupply.value = 0;
        isCalculating.value = false;
        // 不重置 lastCalculatedAt，保留「曾計算過」的歷史紀錄
        // ticketRates / warehouseCapacity 屬於使用者設定，不在此重置
    }

    /**
     * 設定單一品項的調度券兌換率。
     * rate <= 0 時移除該品項設定（等同未設定）。
     * @param itemId 品項 id
     * @param rate 兌換率（券/hr per 個/min）
     * @example
     * flowStore.setTicketRate('iron_ingot', 2)
     */
    function setTicketRate(itemId: string, rate: number): void {
        if (rate > 0) {
            ticketRates.value.set(itemId, rate);
        } else {
            ticketRates.value.delete(itemId);
        }
    }

    /**
     * 設定倉庫容量（格數）。負數視同 0（未設定）。
     * @param capacity 倉庫容量（格數）
     * @example
     * flowStore.setWarehouseCapacity(100)
     */
    function setWarehouseCapacity(capacity: number): void {
        warehouseCapacity.value = Math.max(0, capacity);
    }

    /**
     * 批次寫入 FlowEngine 計算結果。
     * 由 useFlowEngine.runFlowEngine() 在計算完成後一次性呼叫，
     * 避免多次個別賦值觸發多次 Vue 響應式更新。
     * @param payload FlowEngine 的計算結果
     * @example
     * flowStore.applyResult(result)
     */
    function applyResult(payload: FlowEngineResult) {
        edgeFlows.value = payload.edgeFlows;
        nodeEfficiencies.value = payload.nodeEfficiencies;
        itemSummary.value = payload.itemSummary;
        sinkDeliveries.value = payload.sinkDeliveries;
        congestedEdges.value = payload.congestedEdges;
        invalidChainUids.value = payload.invalidChainUids;
        totalPowerDemand.value = payload.totalPowerDemand;
        totalPowerSupply.value = payload.totalPowerSupply;
        lastCalculatedAt.value = Date.now();
        isCalculating.value = false;
    }

    return {
        /** 基地品項單價（券／個）；自由畫布逐項以武陵覆蓋谷地的後備價格。 */
        deliveryTicketPrices,
        /** 自動調度券明細（券／小時），僅換算實際交付且有有效單價的品項。 */
        deliveryTicketOutput,
        /** 自動調度券總額（券／小時）；無有效交付時為 0，避免累加溢位。 */
        deliveryTicketTotal,
        /** 各券種兌換效率（券／小時）；自由畫布分開顯示兩種券，無交付時仍保留零值。 */
        deliveryTicketRates,
        /** connectionUid → EdgeFlow（管線實際傳輸速率與堵塞狀態） */
        edgeFlows,
        /** deviceUid → 效率 0~1 */
        nodeEfficiencies,
        /** 所有參與計算品項的 produced / consumed / net / efficiency */
        itemSummary,
        /** itemId → 流入物品輸入口（sink）的速率（個/min），代表產線實際交付量 */
        sinkDeliveries,
        /** 堵塞的 connectionUid 集合（isCongested = true 的邊） */
        congestedEdges,
        /**
         * 非合法鏈路 / 孤立節點的 deviceUid 集合。
         * 這些節點不參與流量計算，畫布顯示灰色虛線。
         */
        invalidChainUids,
        /** 全部已擺放設備的額定總耗電量（kW），不依鏈路或效率折算；僅加總正值 power */
        totalPowerDemand,
        /** 全部已擺放設備的額定產電加總（kW），排除 power=-1；缺資料為 0。 */
        totalPowerSupply,
        /** FlowEngine 計算中 flag，防止 UI 讀到中間狀態 */
        isCalculating,
        /** 最後一次計算完成的 timestamp（ms），0 表示尚未計算過 */
        lastCalculatedAt,
        /**
         * 調度券兌換率，itemId → 券/hr per 個/min。
         * 由使用者在統計面板手動設定；未設定的品項不顯示於調度券區塊。
         * reset() 不清除此設定，保留跨計算的使用者偏好。
         */
        ticketRates,
        /**
         * 倉庫容量（格數）。0 = 未設定，不顯示填滿預估。
         * 由使用者在統計面板手動輸入；reset() 不清除。
         */
        warehouseCapacity,
        /** 電力盈餘（kW），正 = 盈餘，負 = 不足 */
        powerBalance,
        /** 是否有電力不足 */
        hasPowerShortage,
        /** 有效管線數量 */
        edgeFlowCount,
        /** 堵塞管線數量 */
        congestedEdgeCount,
        /** 非合法鏈路節點數量 */
        invalidChainCount,
        /** 是否有任何計算結果（判斷畫布是否有合法鏈路） */
        hasResults,
        /**
         * 調度券元明細，itemId → 券/hr。
         * 僅包含 net > 0 且已設定兌換率的品項。
         */
        ticketOutput,
        /** 調度券總產出（券/hr），所有 ticketOutput 元素加總 */
        ticketTotal,
        /**
         * 倉庫填滿預估，itemId → 小時。
         * 僅包含 net > 0 的品項；warehouseCapacity <= 0 時回傳空 Map。
         * fillTime(hr) = warehouseCapacity(格) / net(個/min) / 60
         */
        warehouseEstimates,
        /**
         * 清空所有計算結果，回到初始狀態。
         * 在 FlowEngine 重新計算前或畫布清空時調用。
         * @example
         * flowStore.reset()
         */
        reset,
        /**
         * 批次寫入 FlowEngine 計算結果。
         * 由 useFlowEngine.runFlowEngine() 在計算完成後一次性呼叫，
         * 避免多次個別賦值觸發多次 Vue 響應式更新。
         * @param payload FlowEngine 的計算結果
         * @example
         * flowStore.applyResult(result)
         */
        applyResult,
        /**
         * 設定單一品項的調度券兌換率。
         * rate <= 0 時移除該品項設定（等同未設定）。
         * @param itemId 品項 id
         * @param rate 兌換率（券/hr per 個/min）
         * @example
         * flowStore.setTicketRate('iron_ingot', 2)
         */
        setTicketRate,
        /**
         * 設定倉庫容量（格數）。負數視同 0（未設定）。
         * @param capacity 倉庫容量（格數）
         * @example
         * flowStore.setWarehouseCapacity(100)
         */
        setWarehouseCapacity,
    };
});
