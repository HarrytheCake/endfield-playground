/**
 * 配方環境設定標籤（對齊 docs/aaaaa/data/environments.json）
 *
 * 供配方 `environment` 引用；不參與 FlowEngine 數量計算。
 */

/** 單一環境標籤 */
export interface Environment {
    /** 唯一 id；配方 environment 引用 */
    id: string;
    /** 顯示名稱 */
    label: string;
    /** true＝內建不可刪（如 none） */
    builtin?: boolean;
}
