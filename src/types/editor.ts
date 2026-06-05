/**
 * Editor 相關型別定義
 */

/** 編輯器當前工具模式 */
export type ToolMode = 'select' | 'pan' | 'connect' | 'box-select';

/** 工具列可選的設備類別 */
export type EquipmentType = 'smelter' | 'crusher' | 'assembler' | 'conveyor-node' | 'power-node';

/**
 * 設備旋轉次數（90° 為單位）
 *
 * - 0 = 0°
 * - 1 = 90°
 * - 2 = 180°
 * - 3 = 270°
 *
 * 與 Machine.input_ports / output_ports 的 PortSide / offset 一同決定實際 port 位置。
 */
export type Rotation = 0 | 1 | 2 | 3;

/** 畫布尺寸與貼齊設定 */
export interface MapSettings {
    /** 地圖寬度（格） */
    mapWidth: number;
    /** 地圖高度（格） */
    mapHeight: number;
    /** 是否啟用 snap-to-grid */
    snapToGrid: boolean;
}
