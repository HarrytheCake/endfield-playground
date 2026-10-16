/**
 * V14-C1／W0921-T1 — placementCheck 單元測試
 *
 * 釘：空地可放／重疊含 DRAFT_ID／未知機型／非有限座標／移動原位可放；
 * 不寫 store／history；與 addDevice 同判；`layoutStore.test.ts` 不為本檔改寫。
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useHistoryStore } from '@/store/historyStore';
import { useLayoutStore } from '@/store/layoutStore';
import { getMockLayoutScenario, toLayoutSnapshot } from '@/data/mockLayout';
import type { PlacedDevice } from '@/types/layout';
import { DRAFT_ID, canMoveDevice, canPlaceDevice } from '@/utils/layout/placementCheck';

function makeSplitter(id: string, x: number, y = 0): PlacedDevice {
    return {
        id,
        machineType: 'splitter',
        position: { x, y, z: 0 },
        rotation: 0,
        label: id,
    };
}

describe('placementCheck — canPlaceDevice（純函式）', () => {
    it('空地可放 → ok:true', () => {
        const result = canPlaceDevice(
            { machineType: 'splitter', position: { x: 0, y: 0, z: 0 }, rotation: 0 },
            { devices: [], pipelines: [] },
        );
        expect(result).toEqual({ ok: true });
    });

    it('重疊拒絕且 conflicts 含 DRAFT_ID', () => {
        const result = canPlaceDevice(
            { machineType: 'splitter', position: { x: 0, y: 0, z: 0 }, rotation: 0 },
            { devices: [makeSplitter('a', 0)], pipelines: [] },
        );

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.reason).toBe('overlap');
        if (result.reason === 'overlap') {
            expect(result.conflicts.some(([x, y]) => x === DRAFT_ID || y === DRAFT_ID)).toBe(true);
            expect(result.conflicts.some(([x, y]) => x === 'a' || y === 'a')).toBe(true);
        }
        expect(DRAFT_ID).toBe('__draft__');
    });

    it('未知機型 → invalid', () => {
        expect(
            canPlaceDevice(
                {
                    machineType: 'not_a_real_machine_zzz',
                    position: { x: 0, y: 0, z: 0 },
                    rotation: 0,
                },
                { devices: [], pipelines: [] },
            ),
        ).toEqual({ ok: false, reason: 'invalid', invalidIds: [DRAFT_ID] });
    });

    it('非有限座標 → invalid', () => {
        expect(
            canPlaceDevice(
                {
                    machineType: 'splitter',
                    position: { x: Number.NaN, y: 0, z: 0 },
                    rotation: 0,
                },
                { devices: [], pipelines: [] },
            ),
        ).toEqual({ ok: false, reason: 'invalid', invalidIds: [DRAFT_ID] });
    });

    it('佈局已有 DRAFT_ID 撞名 → invalid', () => {
        expect(
            canPlaceDevice(
                { machineType: 'splitter', position: { x: 10, y: 10, z: 0 }, rotation: 0 },
                { devices: [makeSplitter(DRAFT_ID, 0)], pipelines: [] },
            ),
        ).toEqual({ ok: false, reason: 'invalid', invalidIds: [DRAFT_ID] });
    });
});

describe('placementCheck — canMoveDevice', () => {
    it('移動到自己原位可放', () => {
        const device = makeSplitter('a', 2, 3);
        const result = canMoveDevice(
            'a',
            { x: 2, y: 3, z: 0 },
            {
                devices: [device],
                pipelines: [],
            },
        );
        expect(result).toEqual({ ok: true });
    });

    it('找不到 uid → invalid', () => {
        expect(
            canMoveDevice('missing', { x: 0, y: 0, z: 0 }, { devices: [], pipelines: [] }),
        ).toEqual({ ok: false, reason: 'invalid', invalidIds: ['missing'] });
    });
});

describe('canPlaceDevice — 對 Pinia 唯讀面／與 addDevice 同判（T1）', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('預檢不寫入 store／history；空地可放', () => {
        const layout = useLayoutStore();
        const history = useHistoryStore();
        const result = canPlaceDevice(
            { machineType: 'splitter', position: { x: 0, y: 0, z: 0 }, rotation: 0 },
            { devices: layout.devices, pipelines: layout.pipelines },
        );

        expect(result).toEqual({ ok: true });
        expect(layout.devices).toHaveLength(0);
        expect(history.undoDepth).toBe(0);
    });

    it('重疊時以代稱 id 回報設備，且與 addDevice 同判', () => {
        const layout = useLayoutStore();
        const history = useHistoryStore();
        expect(layout.addDevice(makeSplitter('existing', 0))).toEqual({ ok: true });
        const beforeDepth = history.undoDepth;

        const result = canPlaceDevice(
            { machineType: 'splitter', position: { x: 0, y: 0, z: 0 }, rotation: 0 },
            { devices: layout.devices, pipelines: layout.pipelines },
        );
        expect(result.ok).toBe(false);
        if (result.ok || result.reason !== 'overlap') return;
        expect(result.conflicts).toContainEqual(['existing', DRAFT_ID]);
        expect(history.undoDepth).toBe(beforeDepth);

        const added = layout.addDevice(makeSplitter('actual', 0));
        expect(added.ok).toBe(false);
        if (added.ok || added.reason !== 'overlap') return;
        expect(added.conflicts).toContainEqual(['existing', 'actual']);
        expect(layout.devices).toHaveLength(1);
        expect(history.undoDepth).toBe(beforeDepth);
    });

    it('未知機型與非有限座標回 invalid；不把既有問題誤歸於 draft', () => {
        const existing = makeSplitter('existing', 0);
        const layout = { devices: [existing], pipelines: [] };
        expect(
            canPlaceDevice(
                { machineType: 'missing_machine', position: { x: 5, y: 0, z: 0 }, rotation: 0 },
                layout,
            ),
        ).toEqual({ ok: false, reason: 'invalid', invalidIds: [DRAFT_ID] });
        expect(
            canPlaceDevice(
                { machineType: 'splitter', position: { x: NaN, y: 0, z: 0 }, rotation: 0 },
                layout,
            ),
        ).toEqual({ ok: false, reason: 'invalid', invalidIds: [DRAFT_ID] });

        expect(
            canPlaceDevice(
                { machineType: 'splitter', position: { x: 5, y: 0, z: 0 }, rotation: 0 },
                { devices: [{ ...existing, machineType: 'missing_machine' }], pipelines: [] },
            ),
        ).toEqual({ ok: true });
    });

    it('設備與既有管線重疊時拒絕，且預檢與真落子同判', () => {
        const layout = useLayoutStore();
        layout.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));

        const draft = {
            machineType: 'splitter',
            position: { x: 2, y: 0, z: 0 },
            rotation: 0,
        } as const;
        const result = canPlaceDevice(draft, {
            devices: layout.devices,
            pipelines: layout.pipelines,
        });
        expect(result.ok).toBe(false);
        if (result.ok || result.reason !== 'overlap') return;
        expect(result.conflicts.some(([a, b]) => a === 'pipe-ok' || b === 'pipe-ok')).toBe(true);
        expect(result.conflicts.some(([a, b]) => a === DRAFT_ID || b === DRAFT_ID)).toBe(true);

        const added = layout.addDevice(makeSplitter('actual', 2));
        expect(added.ok).toBe(false);
        if (added.ok) return;
        expect(added.reason).toBe('overlap');
    });
});
