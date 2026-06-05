/**
 * CR-08 useHistoryStore 單元測試
 *
 * 測試對象：src/store/historyStore.ts
 * 重點：Command Pattern 的 execute / undo / redo / canUndo / canRedo 行為，
 *       以及多次 undo / redo 後狀態仍正確還原。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useHistoryStore } from '@/store/historyStore';
import type { Command } from '@/types/history';
import { HistoryRecordType } from '@/types/history';

// ─── 測試輔助 ────────────────────────────────────────────────────────────────

interface SpyCommand extends Command {
    executeCount: number;
    undoCount: number;
}

/** 建立一個會記錄呼叫次數的 Command，並把目標變數值切換到指定值 */
function makeCmd(target: { value: number }, applyValue: number): SpyCommand {
    const previous = target.value;
    const cmd: SpyCommand = {
        id: crypto.randomUUID(),
        type: HistoryRecordType.MachinePlacement,
        label: `set ${applyValue}`,
        executeCount: 0,
        undoCount: 0,
        execute() {
            target.value = applyValue;
            cmd.executeCount++;
        },
        undo() {
            target.value = previous;
            cmd.undoCount++;
        },
    };
    return cmd;
}

// ─── 初始狀態 ─────────────────────────────────────────────────────────────────

describe('useHistoryStore — 初始狀態', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('undoStack / redoStack 初始為空', () => {
        const store = useHistoryStore();
        expect(store.undoStack).toEqual([]);
        expect(store.redoStack).toEqual([]);
    });

    it('canUndo / canRedo 初始為 false', () => {
        const store = useHistoryStore();
        expect(store.canUndo).toBe(false);
        expect(store.canRedo).toBe(false);
    });

    it('undoDepth / redoDepth 初始為 0', () => {
        const store = useHistoryStore();
        expect(store.undoDepth).toBe(0);
        expect(store.redoDepth).toBe(0);
    });
});

// ─── execute() ────────────────────────────────────────────────────────────────

describe('execute()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('呼叫後 Command.execute 被執行一次', () => {
        const store = useHistoryStore();
        const target = { value: 0 };
        const cmd = makeCmd(target, 10);

        store.execute(cmd);

        expect(cmd.executeCount).toBe(1);
        expect(target.value).toBe(10);
    });

    it('呼叫後 Command 被推入 undoStack', () => {
        const store = useHistoryStore();
        const cmd = makeCmd({ value: 0 }, 1);

        store.execute(cmd);

        expect(store.undoStack).toHaveLength(1);
        expect(store.undoStack[0].id).toBe(cmd.id);
        expect(store.canUndo).toBe(true);
    });

    it('呼叫後 redoStack 清空（標準行為）', () => {
        const store = useHistoryStore();
        const target = { value: 0 };
        store.execute(makeCmd(target, 1));
        store.undo();
        expect(store.redoStack).toHaveLength(1);

        // 執行新 Command 應清空 redo
        store.execute(makeCmd(target, 2));

        expect(store.redoStack).toEqual([]);
        expect(store.canRedo).toBe(false);
    });
});

// ─── undo() ───────────────────────────────────────────────────────────────────

describe('undo()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('堆疊為空時呼叫回傳 null，不報錯', () => {
        const store = useHistoryStore();
        expect(store.undo()).toBeNull();
    });

    it('呼叫後執行 Command.undo 並推入 redoStack', () => {
        const store = useHistoryStore();
        const target = { value: 0 };
        const cmd = makeCmd(target, 5);
        store.execute(cmd);

        const popped = store.undo();

        expect(popped?.id).toBe(cmd.id);
        expect(cmd.undoCount).toBe(1);
        expect(target.value).toBe(0);
        expect(store.undoStack).toHaveLength(0);
        expect(store.redoStack).toHaveLength(1);
    });

    it('多次 undo 依後進先出順序執行', () => {
        const store = useHistoryStore();
        const target = { value: 0 };
        const cmd1 = makeCmd(target, 1);
        store.execute(cmd1);
        const cmd2 = makeCmd(target, 2);
        store.execute(cmd2);
        const cmd3 = makeCmd(target, 3);
        store.execute(cmd3);

        expect(target.value).toBe(3);
        store.undo();
        expect(target.value).toBe(2);
        store.undo();
        expect(target.value).toBe(1);
        store.undo();
        expect(target.value).toBe(0);
    });
});

// ─── redo() ───────────────────────────────────────────────────────────────────

describe('redo()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('堆疊為空時呼叫回傳 null，不報錯', () => {
        const store = useHistoryStore();
        expect(store.redo()).toBeNull();
    });

    it('呼叫後重新執行 Command 並推回 undoStack', () => {
        const store = useHistoryStore();
        const target = { value: 0 };
        const cmd = makeCmd(target, 7);
        store.execute(cmd);
        store.undo();

        const popped = store.redo();

        expect(popped?.id).toBe(cmd.id);
        expect(cmd.executeCount).toBe(2); // 一次 execute + 一次 redo
        expect(target.value).toBe(7);
        expect(store.undoStack).toHaveLength(1);
        expect(store.redoStack).toHaveLength(0);
    });

    it('undo 後 redo 多次循環，狀態仍正確還原', () => {
        const store = useHistoryStore();
        const target = { value: 0 };
        store.execute(makeCmd(target, 1));
        store.execute(makeCmd(target, 2));
        store.undo();
        store.undo();
        expect(target.value).toBe(0);

        store.redo();
        expect(target.value).toBe(1);
        store.redo();
        expect(target.value).toBe(2);
    });
});

// ─── canUndo / canRedo computed ──────────────────────────────────────────────

describe('canUndo / canRedo', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('execute 後 canUndo = true, canRedo = false', () => {
        const store = useHistoryStore();
        store.execute(makeCmd({ value: 0 }, 1));

        expect(store.canUndo).toBe(true);
        expect(store.canRedo).toBe(false);
    });

    it('undo 後 canRedo = true', () => {
        const store = useHistoryStore();
        store.execute(makeCmd({ value: 0 }, 1));
        store.undo();

        expect(store.canRedo).toBe(true);
    });

    it('undo 到底時 canUndo = false', () => {
        const store = useHistoryStore();
        store.execute(makeCmd({ value: 0 }, 1));
        store.undo();

        expect(store.canUndo).toBe(false);
    });
});

// ─── clear() ──────────────────────────────────────────────────────────────────

describe('clear()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('清空後兩個堆疊均為空、canUndo / canRedo 均為 false', () => {
        const store = useHistoryStore();
        store.execute(makeCmd({ value: 0 }, 1));
        store.execute(makeCmd({ value: 0 }, 2));
        store.undo();

        store.clear();

        expect(store.undoStack).toEqual([]);
        expect(store.redoStack).toEqual([]);
        expect(store.canUndo).toBe(false);
        expect(store.canRedo).toBe(false);
    });
});
