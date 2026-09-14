/**
 * V12-C1 — useLayoutStore 契約測試
 *
 * 釘 W0907-A0 §3 四點：
 *   1. connections 為 getter（隨 devices／pipelines 變）
 *   2. 放置重疊回傳 ok:false，不 throw
 *   3. 讀取面 readonly（外部 mutate 不影響內部）
 *   4. loadSnapshot(toLayoutSnapshot(scenario)) → toSnapshot 等值
 *
 * Review 補釘：loadSnapshot 全量評估、操作只歸咎 involved id、
 * addPipeline 座標、remove* 回傳、history 進棧。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLayoutStore } from '@/store/layoutStore';
import { useHistoryStore } from '@/store/historyStore';
import { getMockLayoutScenario, toLayoutSnapshot } from '@/data/mockLayout';
import type { PlacedDevice, Pipeline } from '@/types/layout';

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

/** 缺機器定義的設備（machineType 不存在） */
function makeGhost(id: string): PlacedDevice {
    return {
        id,
        machineType: 'not_a_real_machine_zzz',
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
    };
}

describe('useLayoutStore — snapshot 對稱', () => {
    beforeEach(() => freshStore());

    it('loadSnapshot(toLayoutSnapshot(connected)) 後 toSnapshot 等值', () => {
        const store = useLayoutStore();
        const scenario = getMockLayoutScenario('connected');
        const input = toLayoutSnapshot(scenario);

        store.loadSnapshot(input);

        expect(store.toSnapshot()).toEqual(input);
    });

    it('loadSnapshot(toLayoutSnapshot(broken)) 後 toSnapshot 等值', () => {
        const store = useLayoutStore();
        const input = toLayoutSnapshot(getMockLayoutScenario('broken'));

        store.loadSnapshot(input);

        expect(store.toSnapshot()).toEqual(input);
    });

    it('toSnapshot 不含 connections 欄位', () => {
        const store = useLayoutStore();
        store.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));

        expect(store.toSnapshot()).not.toHaveProperty('connections');
    });
});

describe('useLayoutStore — connections getter', () => {
    beforeEach(() => freshStore());

    it('connected fixture：connections 端點非全 null', () => {
        const store = useLayoutStore();
        store.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));

        expect(store.connections).toHaveLength(1);
        expect(store.connections[0].from).not.toBeNull();
        expect(store.connections[0].to).not.toBeNull();
    });

    it('broken fixture：connections 端點為 null，管線仍在', () => {
        const store = useLayoutStore();
        store.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('broken')));

        expect(store.pipelines).toHaveLength(1);
        expect(store.connections).toHaveLength(1);
        expect(store.connections[0].from).toBeNull();
        expect(store.connections[0].to).toBeNull();
    });

    it('removeDevice 後 connections 重算（可斷線），管線保留', () => {
        const store = useLayoutStore();
        store.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));

        expect(store.removeDevice('src')).toEqual({ ok: true });

        expect(store.devices.map((d) => d.id)).toEqual(['dst']);
        expect(store.pipelines).toHaveLength(1);
        expect(store.connections[0].from).toBeNull();
    });

    it('removePipeline 後 connections 變短', () => {
        const store = useLayoutStore();
        store.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));

        expect(store.removePipeline('pipe-ok')).toEqual({ ok: true });

        expect(store.pipelines).toHaveLength(0);
        expect(store.connections).toHaveLength(0);
    });
});

describe('useLayoutStore — PlacementResult（不 throw）', () => {
    beforeEach(() => freshStore());

    it('addDevice 成功回傳 ok:true 並寫入', () => {
        const store = useLayoutStore();
        const result = store.addDevice(makeSplitter('a', 0, 0));

        expect(result).toEqual({ ok: true });
        expect(store.devices).toHaveLength(1);
        expect(store.devices[0].id).toBe('a');
    });

    it('addDevice 重疊回傳 ok:false reason:overlap＋conflicts，不寫入', () => {
        const store = useLayoutStore();
        expect(store.addDevice(makeSplitter('a', 0, 0)).ok).toBe(true);

        const result = store.addDevice(makeSplitter('b', 0, 0));

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.reason).toBe('overlap');
        if (result.reason === 'overlap') {
            expect(result.conflicts.some(([x, y]) => x === 'a' || y === 'a')).toBe(true);
            expect(result.conflicts.some(([x, y]) => x === 'b' || y === 'b')).toBe(true);
        }
        expect(store.devices).toHaveLength(1);
        expect(store.devices[0].id).toBe('a');
    });

    it('moveDevice 重疊回傳 overlap，位置不變', () => {
        const store = useLayoutStore();
        store.addDevice(makeSplitter('a', 0, 0));
        store.addDevice(makeSplitter('b', 3, 0));

        const result = store.moveDevice('b', { x: 0, y: 0, z: 0 });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('overlap');
        expect(store.devices.find((d) => d.id === 'b')?.position).toEqual({ x: 3, y: 0, z: 0 });
    });

    it('moveDevice 成功更新座標', () => {
        const store = useLayoutStore();
        store.addDevice(makeSplitter('a', 0, 0));

        const result = store.moveDevice('a', { x: 5, y: 2, z: 0 });

        expect(result).toEqual({ ok: true });
        expect(store.devices[0].position).toEqual({ x: 5, y: 2, z: 0 });
    });

    it('找不到 uid／未知機器 → invalid，不 throw', () => {
        const store = useLayoutStore();

        expect(store.moveDevice('missing', { x: 0, y: 0, z: 0 })).toEqual({
            ok: false,
            reason: 'invalid',
            invalidIds: ['missing'],
        });
        expect(
            store.addDevice({
                id: 'bad',
                machineType: 'not_a_real_machine_zzz',
                position: { x: 0, y: 0, z: 0 },
                rotation: 0,
            }),
        ).toEqual({ ok: false, reason: 'invalid', invalidIds: ['bad'] });
        expect(store.addDevice(makeSplitter('dup', 0, 0)).ok).toBe(true);
        expect(store.addDevice(makeSplitter('dup', 10, 0))).toEqual({
            ok: false,
            reason: 'invalid',
            invalidIds: ['dup'],
        });
    });

    it('addPipeline 重複 id → invalid；成功路徑 ok', () => {
        const store = useLayoutStore();
        const pipe: Pipeline = {
            id: 'p1',
            media: 'belt',
            waypoints: [
                { x: 10, y: 10, z: 0 },
                { x: 11, y: 10, z: 0 },
            ],
        };

        expect(store.addPipeline(pipe)).toEqual({ ok: true });
        expect(store.addPipeline(pipe)).toEqual({
            ok: false,
            reason: 'invalid',
            invalidIds: ['p1'],
        });
        expect(store.pipelines).toHaveLength(1);
    });

    it('addPipeline waypoints 含 NaN → invalid，不寫入', () => {
        const store = useLayoutStore();
        const result = store.addPipeline({
            id: 'bad-pipe',
            media: 'belt',
            waypoints: [
                { x: NaN, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
            ],
        });

        expect(result).toEqual({
            ok: false,
            reason: 'invalid',
            invalidIds: ['bad-pipe'],
        });
        expect(store.pipelines).toHaveLength(0);
    });

    it('addPipeline 斜向一段 → invalid（佔格展開會憑空多一個轉角）', () => {
        const store = useLayoutStore();
        const result = store.addPipeline({
            id: 'diag',
            media: 'belt',
            waypoints: [
                { x: 0, y: 0, z: 0 },
                { x: 4, y: 3, z: 0 },
            ],
        });

        expect(result).toEqual({
            ok: false,
            reason: 'invalid',
            invalidIds: ['diag'],
        });
        expect(store.pipelines).toHaveLength(0);
    });

    it('addPipeline 只有一點 → invalid（不成路徑）', () => {
        const store = useLayoutStore();

        expect(
            store.addPipeline({
                id: 'dot',
                media: 'belt',
                waypoints: [{ x: 0, y: 0, z: 0 }],
            }),
        ).toEqual({ ok: false, reason: 'invalid', invalidIds: ['dot'] });
        expect(store.pipelines).toHaveLength(0);
    });

    it('removeDevice／removePipeline 找不到 id → invalid', () => {
        const store = useLayoutStore();

        expect(store.removeDevice('nope')).toEqual({
            ok: false,
            reason: 'invalid',
            invalidIds: ['nope'],
        });
        expect(store.removePipeline('nope')).toEqual({
            ok: false,
            reason: 'invalid',
            invalidIds: ['nope'],
        });
    });
});

describe('useLayoutStore — loadSnapshot 評估與操作歸咎', () => {
    beforeEach(() => freshStore());

    it('快照兩台已重疊：loadSnapshot 回 conflicts；遠處新增仍 ok', () => {
        const store = useLayoutStore();
        const issues = store.loadSnapshot({
            devices: [makeSplitter('a', 0, 0), makeSplitter('b', 0, 0)],
            pipelines: [],
        });

        expect(issues).toEqual({ ok: false, invalidIds: [], conflicts: [['a', 'b']] });
        expect(store.devices).toHaveLength(2);

        const add = store.addDevice(makeSplitter('c', 40, 40));
        expect(add).toEqual({ ok: true });
        expect(store.devices.map((d) => d.id)).toContain('c');
    });

    it('快照含未知機型：loadSnapshot 回 invalidIds；遠處新增／管線仍 ok', () => {
        const store = useLayoutStore();
        const issues = store.loadSnapshot({
            devices: [makeGhost('ghost')],
            pipelines: [],
        });

        expect(issues).toEqual({ ok: false, invalidIds: ['ghost'], conflicts: [] });

        expect(store.addDevice(makeSplitter('far', 40, 40))).toEqual({ ok: true });
        expect(
            store.addPipeline({
                id: 'p-far',
                media: 'belt',
                waypoints: [
                    { x: 50, y: 50, z: 0 },
                    { x: 51, y: 50, z: 0 },
                ],
            }),
        ).toEqual({ ok: true });
    });
});

describe('useLayoutStore — layoutIssues 一次回報所有問題（review 2 之 §1）', () => {
    beforeEach(() => freshStore());

    it('未知機型＋兩台重疊：invalidIds 與 conflicts 同時回報', () => {
        const store = useLayoutStore();
        const issues = store.loadSnapshot({
            devices: [makeGhost('ghost'), makeSplitter('a', 0, 0), makeSplitter('b', 0, 0)],
            pipelines: [],
        });

        expect(issues).toEqual({
            ok: false,
            invalidIds: ['ghost'],
            conflicts: [['a', 'b']],
        });
        expect(store.layoutIssues).toEqual(issues);
    });

    it('非軸對齊管線＋兩台重疊：兩類問題同時回報', () => {
        const store = useLayoutStore();
        const issues = store.loadSnapshot({
            devices: [makeSplitter('a', 0, 0), makeSplitter('b', 0, 0)],
            pipelines: [
                {
                    id: 'diag',
                    media: 'belt',
                    waypoints: [
                        { x: 20, y: 20, z: 0 },
                        { x: 24, y: 23, z: 0 },
                    ],
                },
            ],
        });

        expect(issues).toEqual({
            ok: false,
            invalidIds: ['diag'],
            conflicts: [['a', 'b']],
        });
    });

    it('設備座標 x: NaN → 載入時列 invalid（不再靜默寫入）', () => {
        const store = useLayoutStore();
        const issues = store.loadSnapshot({
            devices: [
                {
                    id: 'nan',
                    machineType: 'splitter',
                    position: { x: NaN, y: 0, z: 0 },
                    rotation: 0,
                },
            ],
            pipelines: [],
        });

        expect(issues).toEqual({ ok: false, invalidIds: ['nan'], conflicts: [] });
    });

    it('兩台同 id → 列 invalid，且 move／remove 該 id 被擋下', () => {
        const store = useLayoutStore();
        const issues = store.loadSnapshot({
            devices: [makeSplitter('dup', 0, 0), makeSplitter('dup', 8, 0)],
            pipelines: [],
        });

        expect(issues).toEqual({ ok: false, invalidIds: ['dup'], conflicts: [] });
        expect(store.moveDevice('dup', { x: 2, y: 2, z: 0 })).toEqual({
            ok: false,
            reason: 'invalid',
            invalidIds: ['dup'],
        });
        expect(store.removeDevice('dup')).toEqual({
            ok: false,
            reason: 'invalid',
            invalidIds: ['dup'],
        });
        expect(store.devices).toHaveLength(2);
    });

    it('設備與管線同 id → 兩者皆列 invalid（配對無法歸屬）', () => {
        const store = useLayoutStore();
        const issues = store.loadSnapshot({
            devices: [makeSplitter('same', 0, 0)],
            pipelines: [
                {
                    id: 'same',
                    media: 'belt',
                    waypoints: [
                        { x: 30, y: 30, z: 0 },
                        { x: 31, y: 30, z: 0 },
                    ],
                },
            ],
        });

        expect(issues).toEqual({ ok: false, invalidIds: ['same'], conflicts: [] });
    });

    it('乾淨快照 → ok:true 且兩個清單皆空', () => {
        const store = useLayoutStore();
        const issues = store.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));

        expect(issues).toEqual({ ok: true, invalidIds: [], conflicts: [] });
    });
});

describe('useLayoutStore — z 納入有限數檢查（review 2 之 §2）', () => {
    beforeEach(() => freshStore());

    it.each([NaN, Infinity, -Infinity])('addDevice z=%p → invalid（不是 overlap）', (z) => {
        const store = useLayoutStore();
        const result = store.addDevice({
            id: 'a',
            machineType: 'splitter',
            position: { x: 0, y: 0, z },
            rotation: 0,
        });

        expect(result).toEqual({ ok: false, reason: 'invalid', invalidIds: ['a'] });
        expect(store.devices).toHaveLength(0);
    });

    it.each([NaN, Infinity, -Infinity])('moveDevice z=%p → invalid（不是 overlap）', (z) => {
        const store = useLayoutStore();
        store.addDevice(makeSplitter('a', 0, 0));

        expect(store.moveDevice('a', { x: 1, y: 1, z })).toEqual({
            ok: false,
            reason: 'invalid',
            invalidIds: ['a'],
        });
        expect(store.devices[0].position).toEqual({ x: 0, y: 0, z: 0 });
    });
});

describe('useLayoutStore — historyStore', () => {
    beforeEach(() => freshStore());

    it('addDevice 後 undo 還原；redo 再套用', () => {
        const store = useLayoutStore();
        const history = useHistoryStore();

        expect(store.addDevice(makeSplitter('a', 0, 0)).ok).toBe(true);
        expect(store.devices).toHaveLength(1);
        expect(history.canUndo).toBe(true);

        history.undo();
        expect(store.devices).toHaveLength(0);

        history.redo();
        expect(store.devices).toHaveLength(1);
        expect(store.devices[0].id).toBe('a');
    });

    it('removeDevice 後 undo 還原設備', () => {
        const store = useLayoutStore();
        const history = useHistoryStore();

        store.addDevice(makeSplitter('a', 0, 0));
        store.removeDevice('a');
        expect(store.devices).toHaveLength(0);

        history.undo();
        expect(store.devices.map((d) => d.id)).toEqual(['a']);
    });
});

describe('useLayoutStore — 讀取面 readonly', () => {
    beforeEach(() => freshStore());

    it('直接 mutate devices 陣列不影響 store 內部長度', () => {
        const store = useLayoutStore();
        store.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));
        const before = store.devices.length;

        try {
            // readonly proxy：dev 可能 warn；不得改變內部
            (store.devices as PlacedDevice[]).push(makeSplitter('hack', 99, 99));
        } catch {
            // 部分環境對 readonly 賦值會 throw，亦可接受
        }

        expect(store.devices).toHaveLength(before);
        expect(store.devices.map((d) => d.id)).not.toContain('hack');
    });

    it('直接 mutate layoutIssues 清單不影響 store 回報的問題', () => {
        const store = useLayoutStore();
        store.loadSnapshot({
            devices: [makeSplitter('a', 0, 0), makeSplitter('b', 0, 0)],
            pipelines: [],
        });

        try {
            (store.layoutIssues.conflicts as [string, string][]).length = 0;
        } catch {
            // 部分環境對 readonly 賦值會 throw，亦可接受
        }

        expect(store.layoutIssues.conflicts).toEqual([['a', 'b']]);
    });

    it('改 toSnapshot 回傳值不回寫 store', () => {
        const store = useLayoutStore();
        store.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));

        const snap = store.toSnapshot();
        snap.devices.push(makeSplitter('hack', 99, 99));

        expect(store.devices.map((d) => d.id)).not.toContain('hack');
    });
});
