/**
 * 歷史紀錄系統型別定義
 *
 * 採 Command Pattern：每個 Command 自帶 execute / undo 函式，  \
 * 由 useHistoryStore 統一管理 undo / redo 堆疊。
 *
 * L1 store action 內部應組裝 Command 並呼叫 historyStore.execute()，  \
 * L2 不需要也不應該自己組 Command。
 */

/**
 * 操作類型列舉，用於 telemetry / debug / undo 提示 UI。
 */
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
    /** 由多個子 Command 組成的複合操作 */
    Macro = 'macro',
}

/**
 * Command 介面：藍圖狀態變更的基本單位。
 *
 * 每個 L1 store action 內部組裝出對應的 Command 並交給 historyStore.execute()。  \
 * execute 與 undo 必須能在任意次數的 undo / redo 之間正確還原狀態。
 *
 * @example
 * const cmd: Command = {
 *   id: crypto.randomUUID(),
 *   type: HistoryRecordType.MachinePlacement,
 *   label: '擺放精煉爐',
 *   execute() { nodes.value = [...nodes.value, newNode] },
 *   undo()    { nodes.value = nodes.value.filter(n => n.id !== newNode.id) },
 * }
 */
export interface Command {
    /** 唯一識別碼（建議使用 crypto.randomUUID()） */
    id: string;
    /** 操作類型 */
    type: HistoryRecordType;
    /** 人類可讀描述，供 debug 與未來 undo / redo 提示 UI 使用 */
    label: string;
    /** 套用變更 */
    execute(): void;
    /** 還原變更 */
    undo(): void;
}
