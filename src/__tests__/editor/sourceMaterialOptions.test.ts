/**
 * W1026-H1／C5 — 源設備可選材料依輸出埠媒質過濾
 * W1102-H1 — 改看該機所有型態，基礎材料輸出點同時列固體與液氣
 */
import { describe, it, expect } from 'vitest';
import { getMachineById } from '@/data/machines';
import { getMaterialForm } from '@/data/materials';
import { sourceMaterialOptions } from '@/editor/sourceOutput/sourceMaterialOptions';
import type { Machine } from '@/types/machine';

/** 取機器定義；測試資料缺漏時直接失敗，而不是讓後續斷言誤報 */
function machineOf(id: string): Machine {
    const machine = getMachineById(id);
    if (!machine) throw new Error(`找不到機器：${id}`);
    return machine;
}

describe('sourceMaterialOptions', () => {
    it('非源設備回傳空陣列', () => {
        const nonSource = machineOf('item_sink');
        expect(nonSource.is_source).toBe(false);
        expect(sourceMaterialOptions(nonSource)).toEqual([]);
    });

    it('基礎材料輸出點（solid_belt／fluid_pipe 兩型態）列出固體與液氣共 14 種', () => {
        const names = sourceMaterialOptions(machineOf('material_source')).map((m) => m.name);
        expect(names).toHaveLength(14);
        expect(names).toContain('源礦');
        expect(names).toContain('清水');
        expect(names.filter((n) => getMaterialForm(n) === 'solid')).toHaveLength(10);
        expect(names.filter((n) => getMaterialForm(n) !== 'solid').sort()).toEqual(
            ['惰氣', '息壤氣', '沉積酸', '清水'].sort(),
        );
    });

    it('單型態源設備（belt 埠）只列固體', () => {
        for (const id of ['item_source', 'warehouse_output']) {
            const options = sourceMaterialOptions(machineOf(id));
            expect(options).toHaveLength(10);
            expect(options.every((m) => m.form === 'solid')).toBe(true);
        }
    });
});
