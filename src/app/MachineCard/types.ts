import type { FormulaItem } from '@/components/FormulaItem/types';

export type { FormulaItem };

/**
 * 單一配方的生產規格，包含生產週期與進出原料。
 */
export interface Formula {
    /** 單次生產週期秒數 */
    duration: number;
    /** 生產所需的輸入原料清單 */
    input: FormulaItem[];
    /** 生產完成後的輸出產物清單 */
    output: FormulaItem[];
}

/**
 * 機器資訊卡片（MachineCard）元件所接受的屬性定義。
 */
export interface MachineCardProps {
    /** 機器唯一識別碼，對外觸發選取事件時回傳 */
    id: string;
    /** 機器顯示名稱 */
    name: string;
    /** 機器佔地尺寸文字描述（例如「3×3」） */
    sizeText: string;
    /** 機器外觀展示圖片網址，未提供時使用預設占位圖 */
    iconUrl?: string;
    /** 機器運行耗電量文字描述（例如「10kW」） */
    power?: string;
    /** 當前已選取的配方名稱與耗時文字描述 */
    selectedRecipe?: string;
    /** 該機器支援的所有可用配方清單 */
    formulas?: Formula[];
}
