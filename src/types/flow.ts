/**
 * CR-04 FlowEngine 型別定義
 *
 * 流量單位：個 / 分鐘（rate_per_min）
 * 傳送帶上限：BELT_RATE_LIMIT = 30 個/min（每條連接線）
 */

// ─── 常數 ────────────────────────────────────────────────────────────────────

/** 每條傳送帶連接線的最大流量（個/min） */
export const BELT_RATE_LIMIT = 30;

// ─── 基礎型別 ────────────────────────────────────────────────────────────────

// ─── Machine 型別橋接（自 src/types/machine re-export） ──────────────────────

/**
 * MachineDef = Machine（來自 src/types/machine）
 * PortDef / PortSide / PortType 同步 re-export，外部程式碼可從此處或 machine.ts 匯入。
 */
export type { Machine as MachineDef, PortDef, PortSide, PortType } from '@/types/machine';

/** 單一配方的一個輸入或輸出項目 */
export interface RecipeItem {
    /** 品項名稱（對應 products.json name 或 materials.json name） */
    itemId: string;
    /** 單次加工的數量 */
    quantity: number;
}

/**
 * 配方定義（Recipe Definition）
 *
 * 對應 docs/aaaaa/data/products.json 中每個 recipe 物件。
 * 速率為衍生欄位，由 FlowEngine 的 calcDeviceRate() 計算：
 *   ratePerMin = quantity × (60 / timeSeconds)
 */
export interface RecipeDef {
    inputs: RecipeItem[];
    outputs: RecipeItem[];
    /** 使用此配方的設備名稱（對應 MachineDef.name） */
    machine: string;
    /** 單次加工時間（秒） */
    timeSeconds: number;
}

/**
 * 產品定義（對應 products.json 的一筆記錄）。
 * 一個產品可有多個替代配方。
 */
export interface ProductDef {
    /** 產品名稱（唯一鍵） */
    name: string;
    recipes: RecipeDef[];
}

// ─── FlowGraph 圖結構型別 ─────────────────────────────────────────────────────

/** 有向圖邊的元資料 */
export interface EdgeMeta {
    connectionUid: string;
    sourceDeviceUid: string;
    targetDeviceUid: string;
}

/** FlowGraph 中的單一節點，對應一台已部署設備 */
export interface FlowNode {
    /** 對應 editorStore.nodes 中的 id */
    deviceUid: string;
    /** 設備定義名稱，用於查找 MachineDef 與配方 */
    machineType: string;
    /** 目前選用的配方索引（預設 0） */
    recipeIndex: number;
    /** 是否為物品輸出口（地區資源 source） */
    isSource: boolean;
    /** 是否為物品輸入口（產值 sink） */
    isSink: boolean;
    /**
     * false = 略過計算。原因包含：
     *   - CR-03 標記 hasBlockingError
     *   - 非合法鏈路（validateChains 判定）
     *   - 配方不符（validateRecipeMatch 判定）
     */
    isValid: boolean;
    /** 計算後的設備運行效率（0~1） */
    efficiency: number;
    /** 計算後各輸出品項的實際速率（個/min） */
    outputRates: Map<string, number>;
    /** 計算後各輸入品項的實際需求速率（個/min） */
    inputRates: Map<string, number>;
}

/** FlowEngine 有向圖 */
export interface FlowGraph {
    /** deviceUid → FlowNode */
    nodes: Map<string, FlowNode>;
    /** deviceUid → 出邊 connectionUid[] */
    outEdges: Map<string, string[]>;
    /** deviceUid → 入邊 connectionUid[] */
    inEdges: Map<string, string[]>;
    /** connectionUid → EdgeMeta */
    edgeMeta: Map<string, EdgeMeta>;
    /** 是否存在環路（Kahn's Algorithm 後判定） */
    hasCycle: boolean;
    /**
     * 非合法鏈路 / 孤立 / 環路中的 deviceUid 集合。
     * 這些節點不參與流量計算，畫布顯示灰色虛線。
     */
    invalidSubgraphUids: Set<string>;
}

// ─── 流量計算結果型別 ─────────────────────────────────────────────────────────

/** 連接線上的實際流量 */
export interface EdgeFlow {
    /** 對應 Vue Flow edge.id / Connection uid */
    connectionUid: string;
    /** 品項名稱 */
    itemId: string;
    /**
     * 實際傳輸速率（個/min）。
     * 已套用傳送帶上限：Math.min(theoretical, BELT_RATE_LIMIT)
     */
    rate: number;
    /** 上游供給速率 > 下游需求速率時為 true（堵塞狀態） */
    isCongested: boolean;
}

/** 單一品項的全局生產 / 消耗統計 */
export interface ItemSummary {
    /** 品項名稱（唯一鍵） */
    itemId: string;
    /** 顯示名稱 */
    name: string;
    /** 所有設備輸出此品項的速率加總（個/min） */
    produced: number;
    /** 所有設備消耗此品項的速率加總（個/min） */
    consumed: number;
    /** produced - consumed（正 = 盈餘，負 = 不足） */
    net: number;
    /**
     * 該品項的整體生產效率（0~1）。
     * 取所有產出此品項的設備效率最小值。
     */
    efficiency: number;
}

// ─── FlowStore 狀態型別（供 flowStore.ts 參照） ───────────────────────────────

/**
 * useFlowStore 的完整狀態結構。
 */
export interface FlowStoreState {
    /** connectionUid → EdgeFlow */
    edgeFlows: Map<string, EdgeFlow>;
    /** deviceUid → 效率 0~1 */
    nodeEfficiencies: Map<string, number>;
    /** 所有參與計算品項的統計摘要 */
    itemSummary: ItemSummary[];
    /** 堵塞的 connectionUid 集合 */
    congestedEdges: Set<string>;
    /** 非合法鏈路 / 孤立節點的 deviceUid 集合 */
    invalidChainUids: Set<string>;
    /** 所有有效設備的總耗電量（kW） */
    totalPowerDemand: number;
    /** 所有供電設備的總供電量（kW） */
    totalPowerSupply: number;
    /** 計算中 flag */
    isCalculating: boolean;
    /** 最後一次計算完成的 timestamp（ms） */
    lastCalculatedAt: number;
}

// ─── FlowEngine 計算結果 payload 型別 ────────────────────────────────────────

/**
 * FlowEngine 一次計算的完整輸出，作為 `flowStore.applyResult()` 的參數型別。
 * 同時供 `useFlowEngine.ts` 組裝結果物件時使用。
 */
export interface FlowEngineResult {
    /** connectionUid → EdgeFlow */
    edgeFlows: Map<string, EdgeFlow>;
    /** deviceUid → 效率 0~1 */
    nodeEfficiencies: Map<string, number>;
    /** 所有參與計算品項的統計摘要 */
    itemSummary: ItemSummary[];
    /** itemId → 流入物品輸入口的速率（個/min） */
    sinkDeliveries: Map<string, number>;
    /** 堵塞的 connectionUid 集合 */
    congestedEdges: Set<string>;
    /** 非合法鏈路 / 孤立節點的 deviceUid 集合 */
    invalidChainUids: Set<string>;
    /** 所有有效設備的總耗電量（kW） */
    totalPowerDemand: number;
    /** 所有供電設備的總供電量（kW） */
    totalPowerSupply: number;
}
