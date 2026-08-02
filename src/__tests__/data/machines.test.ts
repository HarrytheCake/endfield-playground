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
    getMachinesByTag,
    MACHINE_TAGS,
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

    it('包含 FlowEngine 專用節點：基礎材料輸出點 / 物品輸出口 / 物品輸入口', () => {
        const materialSrc = machineList.find((m) => m.name === '基礎材料輸出點');
        const source = machineList.find((m) => m.name === '物品輸出口');
        const sink = machineList.find((m) => m.name === '物品輸入口');
        expect(materialSrc?.is_source).toBe(true);
        expect(materialSrc?.modes.some((md) => md.id === 'solid_belt')).toBe(true);
        expect(materialSrc?.modes.some((md) => md.id === 'fluid_pipe')).toBe(true);
        expect(source?.is_source).toBe(true);
        expect(sink?.is_sink).toBe(true);
    });

    it('每台機器都有非空 modes，且埠 media 為 belt|pipe', () => {
        for (const m of machineList) {
            expect(m.modes.length).toBeGreaterThan(0);
            for (const mode of m.modes) {
                for (const port of [...mode.input_ports, ...mode.output_ports]) {
                    expect(['belt', 'pipe']).toContain(port.media);
                }
            }
        }
    });

    it('塑型機含 gas_mode（多型態）', () => {
        const m = machineList.find((x) => x.name === '塑型機');
        expect(m?.modes.some((mode) => mode.id === 'gas_mode')).toBe(true);
    });

    it('V9-B1：機器物件無頂層 input_ports／output_ports', () => {
        for (const m of machineList) {
            expect(m).not.toHaveProperty('input_ports');
            expect(m).not.toHaveProperty('output_ports');
        }
    });

    it('灌裝機多 mode 埠數不同；配件機僅 default', () => {
        const filler = machineList.find((x) => x.name === '灌裝機')!;
        const base = filler.modes.find((x) => x.id === 'base_mode')!;
        const gasLiquid = filler.modes.find((x) => x.id === 'gas_liquid_mode')!;
        expect(base.input_ports.length).toBe(6);
        expect(gasLiquid.input_ports.length).toBe(7);
        expect(gasLiquid.input_ports.some((p) => p.media === 'pipe')).toBe(true);

        const fitting = machineList.find((x) => x.name === '配件機')!;
        expect(fitting.modes.length).toBe(1);
        expect(fitting.modes[0].id).toBe('default');
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

// ─── MACHINE_TAGS / getMachinesByTag()（V9-C1）────────────────────────────────

describe('MACHINE_TAGS / getMachinesByTag()', () => {
    it('MACHINE_TAGS 對齊 machine_tags.json 五類', () => {
        expect([...MACHINE_TAGS]).toEqual([
            '物流設備',
            '倉庫存取',
            '基礎生產',
            '合成製造',
            '電力',
        ]);
    });

    it('all 回傳全部機器', () => {
        expect(getMachinesByTag('all').length).toBe(machineList.length);
    });

    it('基礎生產／合成製造分頁非空且標籤相符', () => {
        const base = getMachinesByTag('基礎生產');
        const synth = getMachinesByTag('合成製造');
        expect(base.length).toBeGreaterThan(0);
        expect(synth.length).toBeGreaterThan(0);
        expect(base.every((m) => m.tags.includes('基礎生產'))).toBe(true);
        expect(synth.every((m) => m.tags.includes('合成製造'))).toBe(true);
        expect(base.some((m) => m.name === '粉碎機')).toBe(true);
    });

    it('倉庫存取含基礎材料輸出點', () => {
        const wh = getMachinesByTag('倉庫存取');
        expect(wh.some((m) => m.name === '基礎材料輸出點')).toBe(true);
    });
});
