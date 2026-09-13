/**
 * 配方中的單一物品項目規格。
 */
export interface FormulaItem {
    /** 物品名稱 */
    name?: string;
    /** 物品圖標的圖片網址或本地資源路徑，未提供時使用預設圖標 */
    image?: string;
    /** 物品數量 */
    amount?: number;
}

/**
 * FormulaItem 配方物品圖示元件之屬性定義。
 */
export interface FormulaItemProps {
    /** 所要呈現的物品資料（包含名稱、圖標與數量） */
    item: FormulaItem;
}
