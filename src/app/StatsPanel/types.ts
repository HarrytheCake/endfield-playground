/** 單一產品的產能估算明細資料 */
export interface SingleProductDetail {
    /** 產品唯一識別碼 */
    id: string;
    /** 產品名稱 */
    name: string;
    /** 每分鐘生產量 */
    produce: number;
    /** 每分鐘消耗量 */
    consume: number;
    /** 每分鐘淨收益（生產量減消耗量） */
    profit: number;
    /** 是否展開顯示生產與消耗明細 */
    isExpanded?: boolean;
}

/** 電力消耗與供電統計資料 */
export interface PowerData {
    /** 目前總耗電量（kW） */
    used: number;
    /** 目前總供電量（kW） */
    total: number;
    /** 電力負載百分比（0 ~ 100），若未提供則由元件依 used / total 計算 */
    percent?: number;
}

/** 單一提示或警報訊息項目 */
export interface SingleTip {
    /** 訊息類型：錯誤（error）或警告（warning） */
    type: 'error' | 'warning';
    /** 提示或警報的顯示文字內容 */
    text: string;
}

/** 產線總覽統計面板（StatsPanel）的 Props 定義 */
export interface TestStatsPanelProps {
    /** 電力消耗與供電統計數據 */
    power?: PowerData;
    /** 產能估算產品明細列表 */
    products?: SingleProductDetail[];
    /** 調度券每小時兌換效率（券/hr） */
    exchangeRate?: number;
    /** 下半部提示與警報訊息列表 */
    tips?: SingleTip[];
}
