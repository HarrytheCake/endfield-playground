/**
 * V16-C1 — setDevicePrimaryOutput 契約測試
 *
 * 釘 W1011-A0／C5：
 *   1. 設定寫入 primaryOutput／sourceRatePerMin（預設 30）
 *   2. 可覆寫速率；進歷史
 *   3. itemId=null 清除兩欄；Undo 可還原
 *   4. 未知／重複 uid → 靜默 no-op，且不進歷史
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLayoutStore } from '@/store/layoutStore';
import { useHistoryStore } from '@/store/historyStore';
import type { PlacedDevice } from '@/types/layout';

function freshStore() {
    setActivePinia(createPinia());
    return useLayoutStore();
}

function makeSplitter(id: string, x: number, y: number): PlacedDevice {
    return {
        id,
        machineType: 'splitter',
        position: { x, y, z: 0 },
        rotation: 0,
        label: id,
    };
}

describe('useLayoutStore — setDevicePrimaryOutput', () => {
    beforeEach(() => freshStore());

    it('設定 itemId：寫入 primaryOutput；省略速率＝30；進歷史', () => {
        const store = useLayoutStore();
        const history = useHistoryStore();

        expect(store.addDevice(makeSplitter('src', 0, 0)).ok).toBe(true);
        const depthBefore = history.undoDepth;

        store.setDevicePrimaryOutput('src', '源礦');

        expect(store.devices[0].primaryOutput).toBe('源礦');
        expect(store.devices[0].sourceRatePerMin).toBe(30);
        expect(history.undoDepth).toBe(depthBefore + 1);
    });

    it('同 uid 再設 ratePerMin=15：速率覆寫；再進一筆歷史', () => {
        const store = useLayoutStore();
        const history = useHistoryStore();

        store.addDevice(makeSplitter('src', 0, 0));
        store.setDevicePrimaryOutput('src', '源礦');
        const depthAfterFirst = history.undoDepth;

        store.setDevicePrimaryOutput('src', '源礦', 15);

        expect(store.devices[0].primaryOutput).toBe('源礦');
        expect(store.devices[0].sourceRatePerMin).toBe(15);
        expect(history.undoDepth).toBe(depthAfterFirst + 1);
    });

    it('itemId=null：清除兩欄；Undo 還原前一狀態', () => {
        const store = useLayoutStore();
        const history = useHistoryStore();

        store.addDevice(makeSplitter('src', 0, 0));
        store.setDevicePrimaryOutput('src', '源礦', 15);

        store.setDevicePrimaryOutput('src', null);

        expect(store.devices[0].primaryOutput).toBeUndefined();
        expect(store.devices[0].sourceRatePerMin).toBeUndefined();

        history.undo();
        expect(store.devices[0].primaryOutput).toBe('源礦');
        expect(store.devices[0].sourceRatePerMin).toBe(15);

        history.redo();
        expect(store.devices[0].primaryOutput).toBeUndefined();
        expect(store.devices[0].sourceRatePerMin).toBeUndefined();
    });

    it('未知 uid：devices 不變；歷史不增', () => {
        const store = useLayoutStore();
        const history = useHistoryStore();

        store.addDevice(makeSplitter('src', 0, 0));
        const snap = store.toSnapshot();
        const depth = history.undoDepth;

        store.setDevicePrimaryOutput('nope', '源礦');

        expect(store.toSnapshot()).toEqual(snap);
        expect(history.undoDepth).toBe(depth);
    });

    it('同 id 多台：靜默 no-op；歷史不增', () => {
        const store = useLayoutStore();
        const history = useHistoryStore();

        store.loadSnapshot({
            devices: [makeSplitter('dup', 0, 0), makeSplitter('dup', 8, 0)],
            pipelines: [],
        });
        const snap = store.toSnapshot();
        const depth = history.undoDepth;

        store.setDevicePrimaryOutput('dup', '源礦');

        expect(store.toSnapshot()).toEqual(snap);
        expect(history.undoDepth).toBe(depth);
        expect(store.devices.every((d) => d.primaryOutput === undefined)).toBe(true);
    });

    it('Undo／Redo 還原設定前後狀態', () => {
        const store = useLayoutStore();
        const history = useHistoryStore();

        store.addDevice(makeSplitter('src', 0, 0));
        store.setDevicePrimaryOutput('src', '源礦');

        expect(store.devices[0].primaryOutput).toBe('源礦');

        history.undo();
        expect(store.devices[0].primaryOutput).toBeUndefined();

        history.redo();
        expect(store.devices[0].primaryOutput).toBe('源礦');
        expect(store.devices[0].sourceRatePerMin).toBe(30);
    });
});

/**
 * W1102-H1 — 多型態源設備依素材物態切換 machineMode
 *
 * 基礎材料輸出點：solid_belt（belt 埠，modes[0]）／fluid_pipe（pipe 埠）。
 */
describe('useLayoutStore — setDevicePrimaryOutput 同步 machineMode（W1102-H1）', () => {
    beforeEach(() => freshStore());

    /** 建一台指定機型的設備；machineMode 可預設以測「不動」 */
    function makeDevice(id: string, machineType: string, machineMode?: string): PlacedDevice {
        return {
            id,
            machineType,
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            ...(machineMode ? { machineMode } : {}),
        };
    }

    it('清水（液體）→ fluid_pipe；只進一筆歷史', () => {
        const store = useLayoutStore();
        const history = useHistoryStore();
        store.addDevice(makeDevice('src', 'material_source'));
        const depth = history.undoDepth;

        store.setDevicePrimaryOutput('src', '清水');

        expect(store.devices[0].primaryOutput).toBe('清水');
        expect(store.devices[0].machineMode).toBe('fluid_pipe');
        expect(history.undoDepth).toBe(depth + 1);
    });

    it('惰氣（氣體）→ fluid_pipe', () => {
        const store = useLayoutStore();
        store.addDevice(makeDevice('src', 'material_source'));

        store.setDevicePrimaryOutput('src', '惰氣');

        expect(store.devices[0].machineMode).toBe('fluid_pipe');
    });

    it('源礦（固體）→ solid_belt；由清水改回源礦也切回 solid_belt', () => {
        const store = useLayoutStore();
        store.addDevice(makeDevice('src', 'material_source'));

        store.setDevicePrimaryOutput('src', '源礦');
        expect(store.devices[0].machineMode).toBe('solid_belt');

        store.setDevicePrimaryOutput('src', '清水');
        store.setDevicePrimaryOutput('src', '源礦');
        expect(store.devices[0].machineMode).toBe('solid_belt');
    });

    it('清除產出：刪除 machineMode（回到 modes[0]）', () => {
        const store = useLayoutStore();
        store.addDevice(makeDevice('src', 'material_source'));
        store.setDevicePrimaryOutput('src', '清水');

        store.setDevicePrimaryOutput('src', null);

        expect(store.devices[0].primaryOutput).toBeUndefined();
        expect('machineMode' in store.devices[0]).toBe(false);
    });

    it('Undo／Redo 同時還原 primaryOutput 與 machineMode', () => {
        const store = useLayoutStore();
        const history = useHistoryStore();
        store.addDevice(makeDevice('src', 'material_source'));
        store.setDevicePrimaryOutput('src', '源礦');
        store.setDevicePrimaryOutput('src', '清水');

        history.undo();
        expect(store.devices[0].primaryOutput).toBe('源礦');
        expect(store.devices[0].machineMode).toBe('solid_belt');

        history.redo();
        expect(store.devices[0].primaryOutput).toBe('清水');
        expect(store.devices[0].machineMode).toBe('fluid_pipe');
    });

    it('未知材料：machineMode 不動', () => {
        const store = useLayoutStore();
        store.addDevice(makeDevice('src', 'material_source', 'fluid_pipe'));

        store.setDevicePrimaryOutput('src', '不存在的材料');

        expect(store.devices[0].primaryOutput).toBe('不存在的材料');
        expect(store.devices[0].machineMode).toBe('fluid_pipe');
    });

    it('單型態源設備（物品輸出口）：設定與清除都不寫 machineMode', () => {
        const store = useLayoutStore();
        store.addDevice(makeDevice('a', 'item_source'));
        store.setDevicePrimaryOutput('a', '源礦');
        expect('machineMode' in store.devices[0]).toBe(false);

        store.loadSnapshot({ devices: [makeDevice('b', 'item_source', 'default')], pipelines: [] });
        store.setDevicePrimaryOutput('b', null);
        expect(store.devices[0].machineMode).toBe('default');
    });

    it('非源設備：清除時不刪既有 machineMode', () => {
        const store = useLayoutStore();
        store.addDevice(makeDevice('s', 'splitter', 'default'));

        store.setDevicePrimaryOutput('s', null);

        expect(store.devices[0].machineMode).toBe('default');
    });
});
