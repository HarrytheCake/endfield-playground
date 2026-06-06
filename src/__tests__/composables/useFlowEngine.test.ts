/**
 * useFlowEngine 個別 export 單元測試
 *
 * 測試對象：src/composables/useFlowEngine.ts
 *   - buildGraph(nodes, edges, hasBlockingError)
 *   - validateRecipeMatch(machineType, recipeIndex, incomingItemIds)
 *
 * 備註：拓樸排序、傳播、堵塞、品項統計等 FlowEngine 主流程整合測試見
 *       既有的 `src/__tests__/flowEngine.test.ts`（早期 flat 結構，不動其位置）。
 */

import { describe, it, expect } from 'vitest';
import { buildGraph, validateRecipeMatch } from '@/composables/useFlowEngine';
import type { FactoryNode, FactoryEdge } from '@/types/graph';

// ─── 測試輔助 ────────────────────────────────────────────────────────────────

function makeNode(id: string, machineType: string, recipeIndex = 0): FactoryNode {
    return {
        id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: `${machineType} #${id}`, machineType, recipeIndex },
    };
}

function makeEdge(id: string, source: string, target: string): FactoryEdge {
    return { id, source, target };
}

// ─── buildGraph() ─────────────────────────────────────────────────────────────

describe('buildGraph()', () => {
    it('將 FactoryNode 轉為 FlowNode，預設 isValid = true', () => {
        const nodes = [makeNode('a', '粉碎機')];
        const graph = buildGraph(nodes, []);

        expect(graph.nodes.size).toBe(1);
        const flowNode = graph.nodes.get('a')!;
        expect(flowNode.deviceUid).toBe('a');
        expect(flowNode.machineType).toBe('粉碎機');
        expect(flowNode.isValid).toBe(true);
    });

    it('正確標記 source / sink 節點', () => {
        const nodes = [
            makeNode('src', '物品輸出口'),
            makeNode('mid', '粉碎機'),
            makeNode('sink', '物品輸入口'),
        ];
        const graph = buildGraph(nodes, []);

        expect(graph.nodes.get('src')!.isSource).toBe(true);
        expect(graph.nodes.get('sink')!.isSink).toBe(true);
        expect(graph.nodes.get('mid')!.isSource).toBe(false);
        expect(graph.nodes.get('mid')!.isSink).toBe(false);
    });

    it('hasBlockingError 為 true 的節點被過濾掉', () => {
        const nodes = [makeNode('a', '粉碎機'), makeNode('b', '粉碎機')];
        const graph = buildGraph(nodes, [], (uid) => uid === 'a');

        expect(graph.nodes.has('a')).toBe(false);
        expect(graph.nodes.has('b')).toBe(true);
    });

    it('預設 hasBlockingError 為永遠不封鎖', () => {
        const nodes = [makeNode('a', '粉碎機')];
        const graph = buildGraph(nodes, []);
        expect(graph.nodes.has('a')).toBe(true);
    });

    it('兩端均存在的 edge 被加入 outEdges / inEdges / edgeMeta', () => {
        const nodes = [makeNode('a', '粉碎機'), makeNode('b', '粉碎機')];
        const edges = [makeEdge('e1', 'a', 'b')];

        const graph = buildGraph(nodes, edges);

        expect(graph.edgeMeta.get('e1')).toEqual({
            connectionUid: 'e1',
            sourceDeviceUid: 'a',
            targetDeviceUid: 'b',
        });
        expect(graph.outEdges.get('a')).toEqual(['e1']);
        expect(graph.inEdges.get('b')).toEqual(['e1']);
    });

    it('邊的一端不存在於 graph.nodes 時，該 edge 被丟棄', () => {
        const nodes = [makeNode('a', '粉碎機')];
        // b 並未列在 nodes 中
        const edges = [makeEdge('e1', 'a', 'b')];

        const graph = buildGraph(nodes, edges);

        expect(graph.edgeMeta.has('e1')).toBe(false);
        expect(graph.outEdges.get('a')).toEqual([]);
    });

    it('因 hasBlockingError 被過濾掉的節點，其相關 edge 也被丟棄', () => {
        const nodes = [makeNode('a', '粉碎機'), makeNode('b', '粉碎機')];
        const edges = [makeEdge('e1', 'a', 'b')];

        const graph = buildGraph(nodes, edges, (uid) => uid === 'a');

        expect(graph.nodes.has('a')).toBe(false);
        expect(graph.edgeMeta.has('e1')).toBe(false);
    });

    it('初始化 hasCycle = false 且 invalidSubgraphUids 為空', () => {
        const graph = buildGraph([makeNode('a', '粉碎機')], []);
        expect(graph.hasCycle).toBe(false);
        expect(graph.invalidSubgraphUids.size).toBe(0);
    });

    it('找得到配方的節點，inputRates / outputRates 會被初始化', () => {
        // 粉碎機 recipeIndex=0 → 源礦 → 源石粉末
        const nodes = [makeNode('a', '粉碎機', 0)];
        const graph = buildGraph(nodes, []);

        const node = graph.nodes.get('a')!;
        expect(node.inputRates.size).toBeGreaterThan(0);
        expect(node.outputRates.size).toBeGreaterThan(0);
    });

    it('空輸入回傳空 graph 結構', () => {
        const graph = buildGraph([], []);
        expect(graph.nodes.size).toBe(0);
        expect(graph.edgeMeta.size).toBe(0);
        expect(graph.hasCycle).toBe(false);
    });
});

// ─── validateRecipeMatch() ────────────────────────────────────────────────────

describe('validateRecipeMatch()', () => {
    it('配方需要的品項都有上游連入時回傳 true', () => {
        // 粉碎機 recipeIndex=0 需要「源礦」
        expect(validateRecipeMatch('粉碎機', 0, new Set(['源礦']))).toBe(true);
    });

    it('上游品項額外含其他品項仍然合法（超集即可）', () => {
        expect(validateRecipeMatch('粉碎機', 0, new Set(['源礦', '其他無關品項']))).toBe(true);
    });

    it('上游缺少配方需要的品項時回傳 false', () => {
        expect(validateRecipeMatch('粉碎機', 0, new Set(['赤銅礦']))).toBe(false);
    });

    it('上游為空時，若配方需要輸入則回傳 false', () => {
        expect(validateRecipeMatch('粉碎機', 0, new Set())).toBe(false);
    });

    it('source 配方（inputs 為空）永遠合法，即使上游為空', () => {
        // 物品輸出口 recipeIndex=0 → 源礦：inputs 為空
        expect(validateRecipeMatch('物品輸出口', 0, new Set())).toBe(true);
    });

    it('找不到配方時回傳 false', () => {
        expect(validateRecipeMatch('粉碎機', 999, new Set())).toBe(false);
        expect(validateRecipeMatch('不存在的機器', 0, new Set())).toBe(false);
    });
});
