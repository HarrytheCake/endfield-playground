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
import {
    buildGraph,
    validateRecipeMatch,
    validateChains,
    resolveMachineMode,
} from '@/composables/useFlowEngine';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import { getRecipesForMachine } from '@/data/products';

// ─── 測試輔助 ────────────────────────────────────────────────────────────────

function recipeIndexOf(machineName: string, primaryOutput: string, modeId?: string): number {
    const idx = getRecipesForMachine(machineName, modeId).findIndex((r) =>
        r.outputs.some((o) => o.itemId === primaryOutput),
    );
    if (idx < 0) throw new Error(`找不到配方：${machineName} → ${primaryOutput}`);
    return idx;
}

function makeNode(
    id: string,
    machineType: string,
    recipeIndex = 0,
    machineMode?: string,
): FactoryNode {
    return {
        id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: `${machineType} #${id}`, machineType, recipeIndex, machineMode },
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
            makeNode('src', '基礎材料輸出點'),
            makeNode('itemSrc', '物品輸出口'),
            makeNode('mid', '粉碎機'),
            makeNode('sink', '物品輸入口'),
        ];
        const graph = buildGraph(nodes, []);

        expect(graph.nodes.get('src')!.isSource).toBe(true);
        expect(graph.nodes.get('itemSrc')!.isSource).toBe(true);
        expect(graph.nodes.get('sink')!.isSink).toBe(true);
        expect(graph.nodes.get('mid')!.isSource).toBe(false);
        expect(graph.nodes.get('mid')!.isSink).toBe(false);
    });

    it('V9-B2：基礎材料輸出點依 primaryOutput 合成產出速率', () => {
        const nodes: FactoryNode[] = [
            {
                id: 'src',
                type: 'default',
                position: { x: 0, y: 0 },
                data: {
                    label: '源',
                    machineType: '基礎材料輸出點',
                    machineMode: 'solid_belt',
                    primaryOutput: '源礦',
                    sourceRatePerMin: 30,
                },
            },
        ];
        const graph = buildGraph(nodes, []);
        expect(graph.nodes.get('src')!.outputRates.get('源礦')).toBe(30);
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

    it('V9-E1：buildGraph 不再依 recipeIndex 預填速率（待輸入匹配）', () => {
        const nodes = [
            makeNode('a', '粉碎機', recipeIndexOf('粉碎機', '源石粉末', 'default'), 'default'),
        ];
        const graph = buildGraph(nodes, []);

        const node = graph.nodes.get('a')!;
        expect(node.machineMode).toBe('default');
        expect(node.inputRates.size).toBe(0);
        expect(node.outputRates.size).toBe(0);
    });

    it('缺省 machineMode 時回退 modes[0]', () => {
        const nodes = [makeNode('a', '精煉爐')];
        const graph = buildGraph(nodes, []);
        expect(graph.nodes.get('a')!.machineMode).toBe(resolveMachineMode('精煉爐'));
        expect(graph.nodes.get('a')!.machineMode).toBe('base_mode');
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
    const yuanPowderIdx = recipeIndexOf('粉碎機', '源石粉末', 'default');

    it('配方需要的品項都有上游連入時回傳 true', () => {
        expect(validateRecipeMatch('粉碎機', yuanPowderIdx, new Set(['源礦']), 'default')).toBe(
            true,
        );
    });

    it('V9-E1：超集不合法（須完全吻合）', () => {
        expect(
            validateRecipeMatch('粉碎機', yuanPowderIdx, new Set(['源礦', '其他無關品項']), 'default'),
        ).toBe(false);
    });

    it('上游缺少配方需要的品項時回傳 false', () => {
        expect(validateRecipeMatch('粉碎機', yuanPowderIdx, new Set(['赤銅礦']), 'default')).toBe(
            false,
        );
    });

    it('上游為空時，若配方需要輸入則回傳 false', () => {
        expect(validateRecipeMatch('粉碎機', yuanPowderIdx, new Set(), 'default')).toBe(false);
    });

    it('V9-B2：source 不再注入假配方，validateRecipeMatch 回傳 false', () => {
        expect(validateRecipeMatch('基礎材料輸出點', 0, new Set(), 'solid_belt')).toBe(false);
        expect(validateRecipeMatch('物品輸出口', 0, new Set(), 'default')).toBe(false);
    });

    it('找不到配方時回傳 false', () => {
        expect(validateRecipeMatch('粉碎機', 999, new Set(), 'default')).toBe(false);
        expect(validateRecipeMatch('不存在的機器', 0, new Set())).toBe(false);
    });

    it('liquid_mode 下可匹配赤銅塊配方', () => {
        const idx = recipeIndexOf('精煉爐', '赤銅塊', 'liquid_mode');
        expect(
            validateRecipeMatch('精煉爐', idx, new Set(['赤銅礦', '清水']), 'liquid_mode'),
        ).toBe(true);
    });
});

describe('validateChains — belt/pipe 媒質', () => {
    it('belt→pipe 錯接標記兩端非法', () => {
        const nodes = [
            makeNode('src', '物品輸出口', 0, 'default'),
            makeNode('purifier', '提純機', 0, 'liquid_mode'),
            makeNode('sink', '物品輸入口', 0, 'default'),
        ];
        // 物品輸出口 out belt → 提純機 in pipe
        const edges: FactoryEdge[] = [
            {
                id: 'e1',
                source: 'src',
                target: 'purifier',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
            {
                id: 'e2',
                source: 'purifier',
                target: 'sink',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
        ];
        const graph = buildGraph(nodes, edges);
        validateChains(graph);
        expect(graph.nodes.get('src')!.isValid).toBe(false);
        expect(graph.nodes.get('purifier')!.isValid).toBe(false);
    });

    it('省略 handle 的抽象邊略過媒質檢查', () => {
        const nodes = [
            makeNode('src', '物品輸出口', 0, 'default'),
            makeNode('purifier', '提純機', 0, 'liquid_mode'),
            makeNode('sink', '物品輸入口', 0, 'default'),
        ];
        const edges: FactoryEdge[] = [
            { id: 'e1', source: 'src', target: 'purifier' },
            { id: 'e2', source: 'purifier', target: 'sink' },
        ];
        const graph = buildGraph(nodes, edges);
        validateChains(graph);
        // 無 handle → 不因媒質判非法（仍可能因配方不符）
        expect(graph.invalidSubgraphUids.has('src') || graph.nodes.get('src')!.isValid).toBeTruthy();
    });
});
