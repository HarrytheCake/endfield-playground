/**
 * CR-01 / CR-02 useEditorStore 高階 actions 單元測試
 *
 * 測試對象：src/store/editorStore.ts
 * 重點：
 *   - 高階 actions（placeDevice / moveDevices / commitDeviceMove / rotateDevice / removeDevices /
 *     setRecipe / pasteSelection / addConnection / removeConnection）
 *   - 每個 action 呼叫一次 = 一筆歷史項目（可 undo / redo 還原；零位移 commit 除外）
 *   - 邊界情況（找不到 uid、空輸入、重複值不入歷史）
 *
 * 備註：editorStore 預設帶有 mockNodes / mockEdges，  \
 *       每個 it 在 beforeEach 內把 nodes / edges 清空以便精準斷言。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useEditorStore } from '@/store/editorStore';
import { useHistoryStore } from '@/store/historyStore';
import type { FactoryEdge, FactoryNode } from '@/types/graph';

// ─── 測試輔助 ────────────────────────────────────────────────────────────────

function makeNode(id: string, x = 0, y = 0, extra?: Partial<FactoryNode['data']>): FactoryNode {
    return {
        id,
        type: 'default',
        position: { x, y },
        data: { label: `node ${id}`, machineType: '粉碎機', recipeIndex: 0, ...extra },
    };
}

function makeEdge(id: string, source: string, target: string): FactoryEdge {
    return { id, source, target };
}

/** 清空 mockNodes / mockEdges，提供乾淨起點 */
function freshStore() {
    setActivePinia(createPinia());
    const store = useEditorStore();
    store.nodes = [];
    store.edges = [];
    // history 在 freshStore 之後另外取，保持隔離
    return store;
}

// ─── placeDevice() ────────────────────────────────────────────────────────────

describe('placeDevice()', () => {
    beforeEach(() => freshStore());

    it('將節點推入 nodes', () => {
        const store = useEditorStore();
        store.placeDevice(makeNode('n1'));

        expect(store.nodes).toHaveLength(1);
        expect(store.nodes[0].id).toBe('n1');
    });

    it('呼叫一次推入一筆歷史，undo 後節點消失', () => {
        const store = useEditorStore();
        const history = useHistoryStore();

        store.placeDevice(makeNode('n1'));
        expect(history.canUndo).toBe(true);

        history.undo();
        expect(store.nodes).toHaveLength(0);
    });

    it('undo 後 redo 回復節點', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1'));
        history.undo();

        history.redo();

        expect(store.nodes).toHaveLength(1);
        expect(store.nodes[0].id).toBe('n1');
    });
});

// ─── moveDevices() ────────────────────────────────────────────────────────────

describe('moveDevices()', () => {
    beforeEach(() => freshStore());

    it('依 delta 位移指定的多個節點', () => {
        const store = useEditorStore();
        store.placeDevice(makeNode('n1', 100, 100));
        store.placeDevice(makeNode('n2', 200, 200));

        store.moveDevices(['n1', 'n2'], { x: 50, y: -30 });

        expect(store.nodes.find((n) => n.id === 'n1')!.position).toEqual({ x: 150, y: 70 });
        expect(store.nodes.find((n) => n.id === 'n2')!.position).toEqual({ x: 250, y: 170 });
    });

    it('未在 uids 內的節點位置不變', () => {
        const store = useEditorStore();
        store.placeDevice(makeNode('n1', 0, 0));
        store.placeDevice(makeNode('n2', 50, 50));

        store.moveDevices(['n1'], { x: 10, y: 10 });

        expect(store.nodes.find((n) => n.id === 'n2')!.position).toEqual({ x: 50, y: 50 });
    });

    it('undo 還原所有位移', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1', 100, 100));
        store.placeDevice(makeNode('n2', 200, 200));

        store.moveDevices(['n1', 'n2'], { x: 50, y: 50 });
        history.undo();

        expect(store.nodes.find((n) => n.id === 'n1')!.position).toEqual({ x: 100, y: 100 });
        expect(store.nodes.find((n) => n.id === 'n2')!.position).toEqual({ x: 200, y: 200 });
    });

    it('空 uids 陣列不進歷史', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1'));
        const depthBefore = history.undoDepth;

        store.moveDevices([], { x: 10, y: 10 });

        expect(history.undoDepth).toBe(depthBefore);
    });
});

// ─── commitDeviceMove() ───────────────────────────────────────────────────────

describe('commitDeviceMove()', () => {
    beforeEach(() => freshStore());

    it('畫面已到位時不重複位移，且可 undo / redo', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1', 0, 0));
        // 模擬 Vue Flow 拖曳已把 position 改成最終值
        store.nodes = store.nodes.map((n) =>
            n.id === 'n1' ? { ...n, position: { x: 80, y: 40 } } : n,
        );
        const depthBefore = history.undoDepth;

        store.commitDeviceMove(['n1'], { n1: { x: 0, y: 0 } });

        expect(store.nodes.find((n) => n.id === 'n1')!.position).toEqual({ x: 80, y: 40 });
        expect(history.undoDepth).toBe(depthBefore + 1);

        history.undo();
        expect(store.nodes.find((n) => n.id === 'n1')!.position).toEqual({ x: 0, y: 0 });

        history.redo();
        expect(store.nodes.find((n) => n.id === 'n1')!.position).toEqual({ x: 80, y: 40 });
    });

    it('零位移不進歷史', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1', 10, 20));
        const depthBefore = history.undoDepth;

        store.commitDeviceMove(['n1'], { n1: { x: 10, y: 20 } });

        expect(history.undoDepth).toBe(depthBefore);
    });

    it('多 uid 一次 undo 全部還原', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1', 0, 0));
        store.placeDevice(makeNode('n2', 100, 100));
        store.nodes = store.nodes.map((n) => {
            if (n.id === 'n1') return { ...n, position: { x: 30, y: 0 } };
            if (n.id === 'n2') return { ...n, position: { x: 100, y: 160 } };
            return n;
        });

        store.commitDeviceMove(['n1', 'n2'], {
            n1: { x: 0, y: 0 },
            n2: { x: 100, y: 100 },
        });
        history.undo();

        expect(store.nodes.find((n) => n.id === 'n1')!.position).toEqual({ x: 0, y: 0 });
        expect(store.nodes.find((n) => n.id === 'n2')!.position).toEqual({ x: 100, y: 100 });
    });

    it('空 uids 不進歷史', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1'));
        const depthBefore = history.undoDepth;

        store.commitDeviceMove([], { n1: { x: 0, y: 0 } });

        expect(history.undoDepth).toBe(depthBefore);
    });
});

// ─── rotateDevice() ───────────────────────────────────────────────────────────

describe('rotateDevice()', () => {
    beforeEach(() => freshStore());

    it('更新指定節點的 rotation', () => {
        const store = useEditorStore();
        store.placeDevice(makeNode('n1', 0, 0, { rotation: 0 }));

        store.rotateDevice('n1', 2);

        expect(store.nodes[0].data?.rotation).toBe(2);
    });

    it('undo 還原至先前 rotation', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1', 0, 0, { rotation: 1 }));

        store.rotateDevice('n1', 3);
        history.undo();

        expect(store.nodes[0].data?.rotation).toBe(1);
    });

    it('相同 rotation 不入歷史', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1', 0, 0, { rotation: 2 }));
        const depthBefore = history.undoDepth;

        store.rotateDevice('n1', 2);

        expect(history.undoDepth).toBe(depthBefore);
    });

    it('找不到 uid 時 silently no-op', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        const depthBefore = history.undoDepth;

        store.rotateDevice('nope', 1);

        expect(history.undoDepth).toBe(depthBefore);
    });
});

// ─── removeDevices() ──────────────────────────────────────────────────────────

describe('removeDevices()', () => {
    beforeEach(() => freshStore());

    it('刪除指定節點與其相關 edges', () => {
        const store = useEditorStore();
        store.placeDevice(makeNode('n1'));
        store.placeDevice(makeNode('n2'));
        store.placeDevice(makeNode('n3'));
        store.addConnection(makeEdge('e1', 'n1', 'n2'));
        store.addConnection(makeEdge('e2', 'n2', 'n3'));
        store.addConnection(makeEdge('e3', 'n1', 'n3'));

        store.removeDevices(['n2']);

        expect(store.nodes.map((n) => n.id)).toEqual(['n1', 'n3']);
        // e1 (n1→n2) 與 e2 (n2→n3) 應一併刪除，e3 (n1→n3) 保留
        expect(store.edges.map((e) => e.id)).toEqual(['e3']);
    });

    it('undo 還原節點與相關 edges', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1'));
        store.placeDevice(makeNode('n2'));
        store.addConnection(makeEdge('e1', 'n1', 'n2'));

        store.removeDevices(['n1']);
        history.undo();

        expect(store.nodes).toHaveLength(2);
        expect(store.edges).toHaveLength(1);
        expect(store.edges[0].id).toBe('e1');
    });

    it('空陣列 silently no-op', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        const depthBefore = history.undoDepth;

        store.removeDevices([]);

        expect(history.undoDepth).toBe(depthBefore);
    });
});

// ─── setRecipe() ──────────────────────────────────────────────────────────────

describe('setRecipe()', () => {
    beforeEach(() => freshStore());

    it('更新指定節點的 recipeIndex', () => {
        const store = useEditorStore();
        store.placeDevice(makeNode('n1', 0, 0, { recipeIndex: 0 }));

        store.setRecipe('n1', 3);

        expect(store.nodes[0].data?.recipeIndex).toBe(3);
    });

    it('undo 還原至先前 recipeIndex', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1', 0, 0, { recipeIndex: 1 }));

        store.setRecipe('n1', 2);
        history.undo();

        expect(store.nodes[0].data?.recipeIndex).toBe(1);
    });

    it('相同 recipeIndex 不入歷史', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.placeDevice(makeNode('n1', 0, 0, { recipeIndex: 2 }));
        const depthBefore = history.undoDepth;

        store.setRecipe('n1', 2);

        expect(history.undoDepth).toBe(depthBefore);
    });
});

// ─── pasteSelection() ─────────────────────────────────────────────────────────

describe('pasteSelection()', () => {
    beforeEach(() => freshStore());

    it('依 offset 位移並產生新 uid', () => {
        const store = useEditorStore();
        const original = [makeNode('orig-1', 100, 100), makeNode('orig-2', 200, 200)];

        store.pasteSelection(original, [], { x: 50, y: 0 });

        expect(store.nodes).toHaveLength(2);
        expect(store.nodes[0].id).not.toBe('orig-1');
        expect(store.nodes[1].id).not.toBe('orig-2');
        expect(store.nodes[0].position).toEqual({ x: 150, y: 100 });
        expect(store.nodes[1].position).toEqual({ x: 250, y: 200 });
    });

    it('只複製兩端設備都在 copiedNodes 內的 edges', () => {
        const store = useEditorStore();
        const nodes = [makeNode('a'), makeNode('b')];
        const edges = [
            makeEdge('e-internal', 'a', 'b'),
            makeEdge('e-external', 'a', 'outside'), // outside 不在 copiedNodes 內
        ];

        store.pasteSelection(nodes, edges, { x: 0, y: 0 });

        expect(store.edges).toHaveLength(1);
        // 新 edge 的 source / target 應對應到新的節點 id
        const newSourceId = store.nodes[0].id;
        const newTargetId = store.nodes[1].id;
        expect(store.edges[0].source).toBe(newSourceId);
        expect(store.edges[0].target).toBe(newTargetId);
    });

    it('undo 整組移除（節點 + edges）', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        const nodes = [makeNode('a'), makeNode('b')];
        const edges = [makeEdge('e1', 'a', 'b')];

        store.pasteSelection(nodes, edges, { x: 10, y: 10 });
        history.undo();

        expect(store.nodes).toHaveLength(0);
        expect(store.edges).toHaveLength(0);
    });

    it('空輸入 silently no-op', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        const depthBefore = history.undoDepth;

        store.pasteSelection([], [], { x: 0, y: 0 });

        expect(history.undoDepth).toBe(depthBefore);
    });
});

// ─── addConnection() ──────────────────────────────────────────────────────────

describe('addConnection()', () => {
    beforeEach(() => freshStore());

    it('將 edge 推入 edges', () => {
        const store = useEditorStore();
        store.addConnection(makeEdge('e1', 'a', 'b'));

        expect(store.edges).toHaveLength(1);
        expect(store.edges[0].id).toBe('e1');
    });

    it('undo 移除剛新增的 edge', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.addConnection(makeEdge('e1', 'a', 'b'));

        history.undo();

        expect(store.edges).toHaveLength(0);
    });
});

// ─── removeConnection() ───────────────────────────────────────────────────────

describe('removeConnection()', () => {
    beforeEach(() => freshStore());

    it('移除指定 edge', () => {
        const store = useEditorStore();
        store.addConnection(makeEdge('e1', 'a', 'b'));
        store.addConnection(makeEdge('e2', 'b', 'c'));

        store.removeConnection('e1');

        expect(store.edges.map((e) => e.id)).toEqual(['e2']);
    });

    it('undo 還原已刪除的 edge', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        store.addConnection(makeEdge('e1', 'a', 'b'));

        store.removeConnection('e1');
        history.undo();

        expect(store.edges).toHaveLength(1);
        expect(store.edges[0].id).toBe('e1');
    });

    it('找不到 uid 時 silently no-op', () => {
        const store = useEditorStore();
        const history = useHistoryStore();
        const depthBefore = history.undoDepth;

        store.removeConnection('nope');

        expect(history.undoDepth).toBe(depthBefore);
    });
});

// ─── 跨 action 整合：多筆操作 + 連續 undo ─────────────────────────────────────

describe('跨 action 整合', () => {
    beforeEach(() => freshStore());

    it('連續多筆操作後逐一 undo，狀態正確還原', () => {
        const store = useEditorStore();
        const history = useHistoryStore();

        store.placeDevice(makeNode('a'));
        store.placeDevice(makeNode('b'));
        store.addConnection(makeEdge('e1', 'a', 'b'));
        store.rotateDevice('a', 1);

        expect(store.nodes).toHaveLength(2);
        expect(store.edges).toHaveLength(1);
        expect(store.nodes.find((n) => n.id === 'a')!.data?.rotation).toBe(1);

        history.undo(); // 還原 rotate
        expect(store.nodes.find((n) => n.id === 'a')!.data?.rotation).toBe(0);

        history.undo(); // 還原 addConnection
        expect(store.edges).toHaveLength(0);

        history.undo(); // 還原 placeDevice b
        expect(store.nodes.map((n) => n.id)).toEqual(['a']);

        history.undo(); // 還原 placeDevice a
        expect(store.nodes).toHaveLength(0);

        expect(history.canUndo).toBe(false);
    });
});
