/**
 * data/machines 查詢函式單元測試
 *
 * 測試對象：src/data/machines.ts
 * 重點：getMachine / getMachineById / getAllMachines / machineMap 的查詢正確性。
 *
 * 備註：machineList 內容極大（39 台機器），測試只挑代表性樣本驗證。
 */

import { describe, it, expect } from 'vitest';
import {
    machineList,
    machineMap,
    getMachine,
    getMachineById,
    getAllMachines,
} from '@/data/machines';

// ─── machineList ─────────────────────────────────────────────────────────────

describe('machineList', () => {
    it('包含至少一台「粉碎機」', () => {
        const crusher = machineList.find((m) => m.name === '粉碎機');
        expect(crusher).toBeDefined();
        expect(crusher!.id).toBe('crusher');
    });

    it('每台機器都有 id / name / width / height', () => {
        for (const m of machineList) {
            expect(m.id).toBeTruthy();
            expect(m.name).toBeTruthy();
            expect(m.width).toBeGreaterThan(0);
            expect(m.height).toBeGreaterThan(0);
        }
    });

    it('包含 FlowEngine 專用節點：物品輸出口 / 物品輸入口', () => {
        const source = machineList.find((m) => m.name === '物品輸出口');
        const sink = machineList.find((m) => m.name === '物品輸入口');
        expect(source?.is_source).toBe(true);
        expect(sink?.is_sink).toBe(true);
    });
});

// ─── machineMap ──────────────────────────────────────────────────────────────

describe('machineMap', () => {
    it('鍵以中文名為基準，size 與 machineList 一致', () => {
        expect(machineMap.size).toBe(machineList.length);
    });

    it('可用中文名查到對應機器', () => {
        const m = machineMap.get('粉碎機');
        expect(m?.id).toBe('crusher');
    });
});

// ─── getMachine() ────────────────────────────────────────────────────────────

describe('getMachine()', () => {
    it('已存在的中文名回傳對應 Machine', () => {
        const m = getMachine('粉碎機');
        expect(m).toBeDefined();
        expect(m?.id).toBe('crusher');
    });

    it('不存在的名稱回傳 undefined', () => {
        expect(getMachine('不存在的機器')).toBeUndefined();
    });
});

// ─── getMachineById() ────────────────────────────────────────────────────────

describe('getMachineById()', () => {
    it('已存在的英文 id 回傳對應 Machine', () => {
        const m = getMachineById('crusher');
        expect(m).toBeDefined();
        expect(m?.name).toBe('粉碎機');
    });

    it('不存在的 id 回傳 undefined', () => {
        expect(getMachineById('nope_unknown_machine')).toBeUndefined();
    });
});

// ─── getAllMachines() ────────────────────────────────────────────────────────

describe('getAllMachines()', () => {
    it('回傳的陣列長度與 machineList 一致', () => {
        expect(getAllMachines().length).toBe(machineList.length);
    });

    it('回傳的陣列為副本（修改不影響 source）', () => {
        const copy = getAllMachines();
        copy.pop();
        expect(getAllMachines().length).toBe(machineList.length);
    });
});
