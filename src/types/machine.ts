/**
 * Machine 型別定義（V7：對齊 docs/aaaaa/data schema v3）
 *
 * 機器物理特性（靜態）與行為函式佔位（Phase 1 全為 null）。
 * Port 採用「0° 旋轉時的絕對方位 + offset + media」格式。
 */

// ─── 基礎型別 ─────────────────────────────────────────────────────────────────

/** Port 所在方位（機器正面朝上、0° 旋轉時的絕對方位） */
export type PortSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Port 傳輸媒質（對齊 data_1 `media`）
 *
 * - `'belt'` — 輸送帶（固體）
 * - `'pipe'` — 管線（液體／氣體）
 *
 * FlowEngine 與連線驗證應拒絕跨媒質連接（belt ↔ pipe）。
 */
export type PortMedia = 'belt' | 'pipe';

/**
 * @deprecated V7 起改用 {@link PortMedia}（`belt`｜`pipe`）。保留別名僅供過渡閱讀。
 */
export type PortType = PortMedia;

/** 機器分類標籤（對齊 docs/aaaaa/data/machine_tags.json） */
export type MachineCategory = '物流設備' | '倉庫存取' | '基礎生產' | '合成製造' | '電力';

/**
 * 連接埠定義（正面朝上的靜態座標，不含旋轉資訊）
 *
 * offset 語意：沿該方位邊緣的格子偏移，0-indexed。
 *   - left / right 側：從頂端往下計算（0 = 最上方格）
 *   - top / bottom 側：從左端往右計算（0 = 最左方格）
 */
export interface PortDef {
    /** 0° 旋轉時的方位 */
    side: PortSide;
    /** 沿該方位邊緣的格子偏移 */
    offset: number;
    /** 傳輸媒質：belt（固體）／pipe（液體／氣體） */
    media: PortMedia;
}

/**
 * 機器運轉損耗（資料面；V7 FlowEngine 暫不納入計算）
 */
export interface MachineLoss {
    /** 損耗物品名（材料或產品名） */
    item: string;
    /** 每台機器每分鐘消耗量 */
    rate_per_min: number;
}

/**
 * 機器型態（modes[] 為埠／損耗的權威來源）
 */
export interface MachineMode {
    /** 型態 id，機器內唯一；配方 machineMode／layout 引用 */
    id: string;
    /** 顯示名稱 */
    label: string;
    /** 此型態的輸入埠 */
    input_ports: readonly PortDef[];
    /** 此型態的輸出埠 */
    output_ports: readonly PortDef[];
    /** 無損耗時為 null */
    loss: MachineLoss | null;
}

// ─── 行為函式型別（Phase 1 全為 null 佔位）────────────────────────────────────

/**
 * 機器執行期上下文（Phase 2 正式定義，Phase 1 暫設 unknown）
 * 預計包含：currentRecipe、inputBuffer、outputBuffer、efficiency 等
 */
export type MachineContext = unknown;

/** 每 tick 執行（用於有狀態機器，例如緩衝池、儲液罐） */
export type MachineTickFn = null | ((context: MachineContext) => void);

/** 輸入品項時呼叫（可覆寫預設輸入接收邏輯） */
export type MachineInputFn =
    | null
    | ((itemId: string, amount: number, portIndex: number) => boolean);

/** 輸出品項時呼叫（可覆寫預設輸出供給邏輯） */
export type MachineOutputFn =
    | null
    | ((portIndex: number) => { itemId: string; amount: number } | null);

/**
 * 效率計算覆寫（null = 使用 FlowEngine 預設計算）
 * 適用於非線性效率的特殊機器
 */
export type MachineEfficiencyFn = null | ((inputs: Map<string, number>) => number);

// ─── Machine 介面 ─────────────────────────────────────────────────────────────

/**
 * 機器定義物件
 *
 * 靜態屬性（readonly）描述機器的固有物理特性，不隨放置狀態改變。
 * 行為函式在 Phase 1 均為 null，Phase 2+ 依需逐台覆寫。
 *
 * V9-B1：埠／損耗**僅**存在於 `modes[]`；預設型態為 `modes[0]`（見 {@link getMachineMode}）。
 */
export interface Machine {
    // ── 靜態屬性 ──────────────────────────────────────────────────────────────
    /** 機器唯一識別碼，英文 snake_case，例如 `shaping_machine`、`crusher` */
    readonly id: string;
    /** 機器顯示名稱 */
    readonly name: string;
    /** 機器佔用格數（寬），0° 旋轉時的靜態尺寸 */
    readonly width: number;
    /** 機器佔用格數（高），0° 旋轉時的靜態尺寸 */
    readonly height: number;
    /**
     * 耗電量（kW）。
     * 正值 = 耗電，0 = 無電力需求，負值 = 產電，-1 = 資料尚未定義
     */
    readonly power: number;
    /** 機器分類標籤，供工具列 / 篩選使用 */
    readonly tags: readonly MachineCategory[];
    /** 是否為地區資源輸出口（產線起點，不需輸入即可產出） */
    readonly is_source: boolean;
    /** 是否為物品輸入口（產線終點，產值計算的 sink） */
    readonly is_sink: boolean;
    /** 設定是否已簽核（data v3） */
    readonly config_signed_off?: boolean;
    /** 多型態定義（非空）；埠與 loss 的唯一權威來源；預設＝modes[0] */
    readonly modes: readonly MachineMode[];
    // ── 行為函式佔位（Phase 1 全為 null）─────────────────────────────────────
    onTick: MachineTickFn;
    onInput: MachineInputFn;
    onOutput: MachineOutputFn;
    calcEfficiency: MachineEfficiencyFn;
}

/**
 * 取得機器指定型態；modeId 缺省或找不到時回退 modes[0]。
 *
 * @param machine 機器定義
 * @param modeId 型態 id
 * @returns 對應 MachineMode
 * @example
 * const mode = getMachineMode(crusher, 'gas_mode')
 */
export function getMachineMode(machine: Machine, modeId?: string): MachineMode {
    if (modeId) {
        const found = machine.modes.find((m) => m.id === modeId);
        if (found) return found;
    }
    return machine.modes[0];
}
