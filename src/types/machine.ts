/**
 * Machine 型別定義
 *
 * 機器物理特性（靜態）與行為函式佔位（Phase 1 全為 null）。
 * Port 採用「0° 旋轉時的絕對方位 + offset」格式；旋轉工具函式見本檔末尾。
 */

// ─── 基礎型別 ─────────────────────────────────────────────────────────────────

/** Port 所在方位（機器正面朝上、0° 旋轉時的絕對方位） */
export type PortSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Port 傳輸介質類型
 *
 * - `'item'`   — 固體物品（由輸送帶連接）
 * - `'liquid'` — 液體 / 氣體（由管道連接）
 *
 * 同一台機器的輸入或輸出埠可同時存在兩種類型（例如：灌裝機的液體進料 + 固體工件進料）。
 * FlowEngine 與管線連接驗證應拒絕跨類型連接（item port ↔ liquid port）。
 */
export type PortType = 'item' | 'liquid';

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
    /** 傳輸介質類型：固體物品或液體 */
    type: PortType;
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
 * 旋轉支援：PlacedDevice 持有 rotation: 0|1|2|3，
 * 使用本檔末尾的 rotatePortSide / rotatePortOffset 計算世界方位。
 */
export interface Machine {
    // ── 靜態屬性 ──────────────────────────────────────────────────────────────
    /** 機器唯一識別碼，英文 snake_case，例如 `shaping_machine`、`crusher` */
    readonly id: string;
    readonly name: string;
    readonly width: number;
    readonly height: number;
    readonly input_ports: readonly PortDef[];
    readonly output_ports: readonly PortDef[];
    /**
     * 耗電量（kW）。
     * 正值 = 耗電，0 = 無電力需求，負值 = 產電，-1 = 資料尚未定義
     */
    readonly power: number;
    readonly tags: readonly MachineCategory[];
    readonly is_source: boolean;
    readonly is_sink: boolean;
    // ── 行為函式佔位（Phase 1 全為 null）─────────────────────────────────────
    onTick: MachineTickFn;
    onInput: MachineInputFn;
    onOutput: MachineOutputFn;
    calcEfficiency: MachineEfficiencyFn;
}
