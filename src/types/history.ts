/**
 * 歷史紀錄基礎物件  \
 * 使用該歷史紀錄的功能可以自行 extend 該物件型態，設置更多紀錄資訊
 */
export interface HistoryBasicRecord {
    /** 歷史紀錄系統生成 uuid */
    id: string;
    /** 事件類型 */
    type: HistoryRecordType;
}

/** 歷史紀錄變更事件 */
export interface HistoryChangeEvent {
    /** 觸發事件動作 */
    action: 'redo' | 'undo' | 'push' | 'clear';
    /** 當前歷史紀錄 */
    current: HistoryBasicRecord | null;
    /** 上一個歷史紀錄 */
    previous: HistoryBasicRecord | null;
}

export enum HistoryRecordType {
    /** 設備擺放 */
    MachinePlacement = 'machine_placement',
    /** 設備移動 */
    MachineMovement = 'machine_movement',
    /** 設備旋轉 */
    MachineRotation = 'machine_rotation',
    /** 設備刪除 */
    MachineDeletion = 'machine_deletion',
    /** 設備複製貼上 */
    MachineCopyPaste = 'machine_copy_paste',
    /** 設備配方變更 */
    MachineRecipeChange = 'machine_recipe_change',
    /** 設備連接 */
    MachineConnection = 'machine_connection',
    /** 設備斷連 */
    MachineDisconnection = 'machine_disconnection',
    /** 設備連接變更 */
    MachineConnectionChange = 'machine_connection_change',
    /** 設備連接刪除 */
    MachineConnectionDeletion = 'machine_connection_deletion',
}
