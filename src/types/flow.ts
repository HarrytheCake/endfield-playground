/**
 * CR-04 FlowEngine 型別定義
 *
 * 流量單位：個 / 分鐘（rate_per_min）
 * 傳送帶上限：BELT_RATE_LIMIT = 30 個/min；管道：PIPE_RATE_LIMIT = 60 個/min
 */

import type { PortMedia } from '@/types/machine';

// ─── 常數 ────────────────────────────────────────────────────────────────────

/** 每條傳送帶連接線的最大流量（個/min） */
export const BELT_RATE_LIMIT = 30;

/** 每條管道連接線的最大流量（個/min） */
export const PIPE_RATE_LIMIT = 60;

/**
 * 品項物態（對應 materials／products JSON 的 `form`）。
 * solid → belt；liquid／gas → pipe。
 */
export type ItemForm = 'solid' | 'liquid' | 'gas';

// ─── 基礎型別 ────────────────────────────────────────────────────────────────

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
    /** 配方唯一識別碼，格式：`<machineId>_<productId>_<recipeIndex>` */
    id: string;
    /** 此配方消耗的輸入品項清單 */
    inputs: RecipeItem[];
    /** 此配方產出的輸出品項清單 */
    outputs: RecipeItem[];
    /** 使用此配方的設備名稱（對應 Machine.name） */
    machine: string;
    /**
     * 機器型態 id（對應 Machine.modes[].id）。
     * 缺省時由呼叫端以 modes[0].id 解釋。
     */
    machineMode?: string;
    /**
     * 環境標籤 id（對應 Environment.id）。
     * 缺省視為 `"none"`。
     */
    environment?: string;
    /** 單次加工時間（秒） */
    timeSeconds: number;
}

/**
 * 產品定義（對應 products.json 的一筆記錄）。
 * 一個產品可有多個替代配方。
 */
export interface ProductDef {
    /** 產品唯一識別碼，英文 slug，例如 `jing_cao_solution` */
    id: string;
    /** 產品名稱 */
    name: string;
    /**
     * 物態（對應 JSON `form`）。
     * 缺省時執行期視為 `solid`。
     */
    form: ItemForm;
    recipes: RecipeDef[];
}

/**
 * 基礎材料定義（對應 materials.json）。
 */
export interface MaterialDef {
    /** 材料唯一識別碼（與產品 id 規則相同） */
    id: string;
    /** 材料名稱 */
    name: string;
    /** 物態（對應 JSON `form`） */
    form: ItemForm;
}

/**
 * 物態 → 應使用的線路媒質。
 * @param form 品項 form
 */
export function formToPortMedia(form: ItemForm): PortMedia {
    return form === 'solid' ? 'belt' : 'pipe';
}

/**
 * 依線路媒質取得速率上限；未知時保守套用 belt 上限。
 * @param media 邊或埠的媒質
 */
export function rateLimitForMedia(media: PortMedia | null | undefined): number {
    return media === 'pipe' ? PIPE_RATE_LIMIT : BELT_RATE_LIMIT;
}

// ─── FlowGraph 圖結構型別 ─────────────────────────────────────────────────────

/** 有向圖邊的元資料 */
export interface EdgeMeta {
    /** 對應 Vue Flow edge.id / Connection uid */
    connectionUid: string;
    /** 邊的來源設備 deviceUid */
    sourceDeviceUid: string;
    /** 邊的目標設備 deviceUid */
    targetDeviceUid: string;
    /** 來源埠 handle（如 `out-0`）；缺省時媒質檢查略過 */
    sourceHandle?: string | null;
    /** 目標埠 handle（如 `in-0`）；缺省時媒質檢查略過 */
    targetHandle?: string | null;
}

/** FlowGraph 中的單一節點，對應一台已部署設備 */
export interface FlowNode {
    /** 對應 editorStore.nodes 中的 id */
    deviceUid: string;
    /** 設備定義名稱，用於查找 Machine 定義與配方 */
    machineType: string;
    /**
     * 目前選用的機器型態 id（對應 Machine.modes[].id）。
     * 缺省時以該機器 modes[0].id 解釋。
     */
    machineMode?: string;
    /** 目前選用的配方索引（預設 0；在 mode 過濾後的配方列表上） */
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
     *   - 埠媒質不符（belt ↔ pipe）
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
     * 已依線路媒質套用上限：belt → BELT_RATE_LIMIT（30）、pipe → PIPE_RATE_LIMIT（60）。
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
