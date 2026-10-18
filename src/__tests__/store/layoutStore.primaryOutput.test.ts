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
