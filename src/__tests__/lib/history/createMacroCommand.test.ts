/**
 * createMacroCommand 單元測試
 *
 * 測試對象：src/lib/history/createMacroCommand.ts
 * 重點：execute 順向、undo 反向、預設 type 為 Macro。
 */

import { describe, it, expect } from 'vitest';
import { createMacroCommand } from '@/lib/history/createMacroCommand';
import { HistoryRecordType, type Command } from '@/types/history';

/** 建立一個記錄呼叫順序的 Command */
function makeCmd(log: string[], label: string): Command {
    return {
        id: crypto.randomUUID(),
        type: HistoryRecordType.MachinePlacement,
        label,
        execute() {
            log.push(`exec:${label}`);
        },
        undo() {
            log.push(`undo:${label}`);
        },
    };
}

// ─── 基本組合 ─────────────────────────────────────────────────────────────────

describe('createMacroCommand()', () => {
    it('execute 依序呼叫所有子 Command.execute', () => {
        const log: string[] = [];
        const macro = createMacroCommand({
            label: '巨集 A',
            commands: [makeCmd(log, 'a'), makeCmd(log, 'b'), makeCmd(log, 'c')],
        });

        macro.execute();

        expect(log).toEqual(['exec:a', 'exec:b', 'exec:c']);
    });

    it('undo 反向呼叫所有子 Command.undo', () => {
        const log: string[] = [];
        const macro = createMacroCommand({
            label: '巨集 B',
            commands: [makeCmd(log, 'a'), makeCmd(log, 'b'), makeCmd(log, 'c')],
        });

        macro.undo();

        expect(log).toEqual(['undo:c', 'undo:b', 'undo:a']);
    });

    it('預設 type 為 HistoryRecordType.Macro', () => {
        const macro = createMacroCommand({ label: 'x', commands: [] });
        expect(macro.type).toBe(HistoryRecordType.Macro);
    });

    it('可指定 type 覆寫預設值', () => {
        const macro = createMacroCommand({
            type: HistoryRecordType.MachineCopyPaste,
            label: 'copy-paste',
            commands: [],
        });
        expect(macro.type).toBe(HistoryRecordType.MachineCopyPaste);
    });

    it('每次建立會產生不同的 id', () => {
        const a = createMacroCommand({ label: '1', commands: [] });
        const b = createMacroCommand({ label: '2', commands: [] });
        expect(a.id).not.toBe(b.id);
    });

    it('空 commands 陣列時 execute / undo 安全執行不報錯', () => {
        const macro = createMacroCommand({ label: 'empty', commands: [] });
        expect(() => macro.execute()).not.toThrow();
        expect(() => macro.undo()).not.toThrow();
    });
});
