/**
 * createMacroCommand —— 將多個 sub-Command 組合為單一 Command。
 *
 * 屬於 L1 內部 helper：當某個 high-level store action 需要原子化地動到多個 store
 * （例如 addConnection 內部要同時改 placedDevice 與 pipeline），  \
 * 用本函式把多個 sub-Command 包成單一 Command 推入歷史，  \
 * 確保使用者一次 Ctrl+Z 就能整組還原。
 *
 * **L2 不應直接呼叫本函式**；如果 L1 沒有對應的 high-level action，  \
 * 應回報給 L1 維護者補上，不在 L2 自行組合。
 */

import type { Command } from '@/types/history';
import { HistoryRecordType } from '@/types/history';

/**
 * 建立巨集 Command 的選項
 */
export interface MacroCommandOptions {
    /** 操作類型，預設為 HistoryRecordType.Macro */
    type?: HistoryRecordType;
    /** 人類可讀描述 */
    label: string;
    /** 子 Command 陣列；undo 時會以反向順序執行 */
    commands: Command[];
}

/**
 * 將多個 sub-Command 組合為單一 Command。  \
 * execute 依序執行子 Command；undo 反向執行子 Command 的 undo。
 *
 * @param options 巨集選項
 * @returns 組合後的 Command，可直接交給 historyStore.execute()
 *
 * @example
 * import { createMacroCommand } from '@/lib/history/createMacroCommand'
 * import { useHistoryStore } from '@/store/historyStore'
 *
 * const macro = createMacroCommand({
 *   label: '新增管線（含分流器）',
 *   commands: [
 *     { id: ..., type: ..., label: '插入分流器', execute, undo },
 *     { id: ..., type: ..., label: '修改原管線', execute, undo },
 *     { id: ..., type: ..., label: '新增新管線', execute, undo },
 *   ],
 * })
 * useHistoryStore().execute(macro)
 */
export function createMacroCommand(options: MacroCommandOptions): Command {
    const { type = HistoryRecordType.Macro, label, commands } = options;
    return {
        id: crypto.randomUUID(),
        type,
        label,
        execute() {
            for (const cmd of commands) cmd.execute();
        },
        undo() {
            for (let i = commands.length - 1; i >= 0; i--) commands[i].undo();
        },
    };
}
