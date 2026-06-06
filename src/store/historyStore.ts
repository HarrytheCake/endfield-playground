import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { Command } from '@/types/history';

/**
 * CR-08 useHistoryStore
 *
 * 採 Command Pattern 的歷史紀錄堆疊，  \
 * 提供無限制 undo / redo（Ctrl+Z / Ctrl+Y）。
 *
 * 設計原則：
 *   - L1 store action 內部組裝 Command 後呼叫 execute()
 *   - L2 只應呼叫 undo() / redo() 與讀取 canUndo / canRedo
 *   - L2 不應直接呼叫 execute()，也不應自行組裝 Command
 *   - Session 結束後堆疊清空，不持久化
 *
 * @example
 * // L1 store 內部
 * const historyStore = useHistoryStore()
 * historyStore.execute({
 *   id: crypto.randomUUID(),
 *   type: HistoryRecordType.MachinePlacement,
 *   label: '擺放精煉爐',
 *   execute() { ... },
 *   undo() { ... },
 * })
 *
 * @example
 * // L2 容器層
 * const historyStore = useHistoryStore()
 * const canUndo = computed(() => historyStore.canUndo)
 * function onCtrlZ() { historyStore.undo() }
 */
export const useHistoryStore = defineStore('history', () => {
    /** 已執行的 Command 堆疊，最新的在最後 */
    const undoStack = ref<Command[]>([]);

    /** 已 undo 的 Command 堆疊，最新的在最後；執行新 Command 會清空 */
    const redoStack = ref<Command[]>([]);

    /** 是否可以 undo */
    const canUndo = computed(() => undoStack.value.length > 0);

    /** 是否可以 redo */
    const canRedo = computed(() => redoStack.value.length > 0);

    /** undo 堆疊深度（給 debug / telemetry 用） */
    const undoDepth = computed(() => undoStack.value.length);

    /** redo 堆疊深度（給 debug / telemetry 用） */
    const redoDepth = computed(() => redoStack.value.length);

    /**
     * 執行 Command 並推入歷史。  \
     * 執行新 Command 會清空 redo 堆疊（標準行為）。
     *
     * @param cmd 要執行的 Command
     */
    function execute(cmd: Command): void {
        cmd.execute();
        undoStack.value = [...undoStack.value, cmd];
        if (redoStack.value.length > 0) {
            redoStack.value = [];
        }
    }

    /**
     * 復原上一個 Command。  \
     * 若 undo 堆疊為空則靜默返回。
     *
     * @returns 被復原的 Command，或 null
     */
    function undo(): Command | null {
        if (undoStack.value.length === 0) return null;
        const next = [...undoStack.value];
        const cmd = next.pop()!;
        cmd.undo();
        undoStack.value = next;
        redoStack.value = [...redoStack.value, cmd];
        return cmd;
    }

    /**
     * 取消復原上一個 undo 的 Command。  \
     * 若 redo 堆疊為空則靜默返回。
     *
     * @returns 被取消復原的 Command，或 null
     */
    function redo(): Command | null {
        if (redoStack.value.length === 0) return null;
        const next = [...redoStack.value];
        const cmd = next.pop()!;
        cmd.execute();
        redoStack.value = next;
        undoStack.value = [...undoStack.value, cmd];
        return cmd;
    }

    /**
     * 清空所有歷史紀錄（undo 與 redo 堆疊）。  \
     * 在 session 結束、藍圖整體重置時調用。
     */
    function clear(): void {
        undoStack.value = [];
        redoStack.value = [];
    }

    return {
        /** 已執行的 Command 堆疊，最新的在最後 */
        undoStack,
        /** 已 undo 的 Command 堆疊，最新的在最後；執行新 Command 會清空 */
        redoStack,
        /** 是否可以 undo */
        canUndo,
        /** 是否可以 redo */
        canRedo,
        /** undo 堆疊深度（給 debug / telemetry 用） */
        undoDepth,
        /** redo 堆疊深度（給 debug / telemetry 用） */
        redoDepth,
        /**
         * 執行 Command 並推入歷史。  \
         * 執行新 Command 會清空 redo 堆疊（標準行為）。
         *
         * @param cmd 要執行的 Command
         */
        execute,
        /**
         * 復原上一個 Command。  \
         * 若 undo 堆疊為空則靜默返回。
         *
         * @returns 被復原的 Command，或 null
         */
        undo,
        /**
         * 取消復原上一個 undo 的 Command。  \
         * 若 redo 堆疊為空則靜默返回。
         *
         * @returns 被取消復原的 Command，或 null
         */
        redo,
        /**
         * 清空所有歷史紀錄（undo 與 redo 堆疊）。  \
         * 在 session 結束、藍圖整體重置時調用。
         */
        clear,
    };
});
