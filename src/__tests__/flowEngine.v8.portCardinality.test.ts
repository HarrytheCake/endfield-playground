/**
 * V8-C1 — 單埠單線（埠基數）
 */
import { describe, it, expect } from 'vitest';
import type { FlowGraph, FlowNode, EdgeMeta } from '@/types/flow';
import { validateChains } from '@/composables/useFlowEngine';
import { getRecipesForMachine } from '@/data/products';

function recipeIndexOf(
    machineName: string,
    primaryOutput: string,
    modeId?: string,
    requiredInputs?: Record<string, number>,
): number {
    const idx = getRecipesForMachine(machineName, modeId).findIndex((r) => {
        if (!r.outputs.some((o) => o.itemId === primaryOutput)) return false;
        if (!requiredInputs) return true;
        return Object.entries(requiredInputs).every(([itemId, qty]) =>
            r.inputs.some((i) => i.itemId === itemId && i.quantity === qty),
        );
    });
    if (idx < 0) throw new Error(`找不到配方：${machineName} → ${primaryOutput}`);
    return idx;
}

function makeGraph(): FlowGraph {
    return {
        nodes: new Map(),
        outEdges: new Map(),
        inEdges: new Map(),
        edgeMeta: new Map(),
        hasCycle: false,
        invalidSubgraphUids: new Set(),
    };
}

function addNode(
    graph: FlowGraph,
    uid: string,
    opts: {
        machineType: string;
        machineMode?: string;
        recipeIndex?: number;
        isSource?: boolean;
        isSink?: boolean;
        outputRates?: Map<string, number>;
    },
): FlowNode {
    const node: FlowNode = {
        deviceUid: uid,
        machineType: opts.machineType,
        machineMode: opts.machineMode,
        recipeIndex: opts.recipeIndex ?? 0,
        isSource: opts.isSource ?? false,
        isSink: opts.isSink ?? false,
        isValid: true,
        efficiency: 1,
        inputRates: new Map(),
        outputRates: opts.outputRates ?? new Map(),
    };
    graph.nodes.set(uid, node);
    graph.outEdges.set(uid, []);
    graph.inEdges.set(uid, []);
    return node;
}

function addEdge(
    graph: FlowGraph,
    connUid: string,
    src: string,
    tgt: string,
    handles?: { sourceHandle?: string; targetHandle?: string },
): void {
    const meta: EdgeMeta = {
        connectionUid: connUid,
        sourceDeviceUid: src,
        targetDeviceUid: tgt,
        sourceHandle: handles?.sourceHandle,
        targetHandle: handles?.targetHandle,
    };
    graph.edgeMeta.set(connUid, meta);
    graph.outEdges.get(src)!.push(connUid);
    graph.inEdges.get(tgt)!.push(connUid);
}

describe('V8-C1 P1 — 單埠雙線標非法', () => {
    it('兩條邊接到同一 Sink in-0 → sink／上游非法', () => {
        const graph = makeGraph();
        addNode(graph, 'srcA', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['源礦', 30]]),
        });
        addNode(graph, 'srcB', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['源礦', 30]]),
        });
        addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });
        addEdge(graph, 'e1', 'srcA', 'sink', {
            sourceHandle: 'out-0',
            targetHandle: 'in-0',
        });
        addEdge(graph, 'e2', 'srcB', 'sink', {
            sourceHandle: 'out-0',
            targetHandle: 'in-0',
        });

        validateChains(graph);

        expect(graph.nodes.get('sink')!.isValid).toBe(false);
        expect(graph.invalidSubgraphUids.has('sink')).toBe(true);
        // 兩端皆標非法
        expect(graph.nodes.get('srcA')!.isValid).toBe(false);
        expect(graph.nodes.get('srcB')!.isValid).toBe(false);
    });

    it('單埠 Sink 上兩條無 handle 抽象邊 → 仍視為佔用唯一入埠而非法', () => {
        const graph = makeGraph();
        addNode(graph, 'srcA', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['源礦', 30]]),
        });
        addNode(graph, 'srcB', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['源礦', 30]]),
        });
        addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });
        addEdge(graph, 'e1', 'srcA', 'sink');
        addEdge(graph, 'e2', 'srcB', 'sink');

        validateChains(graph);

        expect(graph.nodes.get('sink')!.isValid).toBe(false);
    });
});

describe('V8-C1 P2 — 多埠各接一條仍合法', () => {
    it('精煉爐 liquid_mode：belt＋pipe 各入一埠 → 合法', () => {
        const mode = 'liquid_mode';
        const recipeIndex = recipeIndexOf('精煉爐', '赤銅塊', mode, {
            赤銅礦: 1,
            清水: 1,
        });
        const graph = makeGraph();
        addNode(graph, 'srcOre', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['赤銅礦', 30]]),
        });
        // 清水走 pipe：用管道准入口作出源
        addNode(graph, 'srcWater', {
            machineType: '管道准入口',
            isSource: true,
            outputRates: new Map([['清水', 30]]),
        });
        addNode(graph, 'refinery', {
            machineType: '精煉爐',
            machineMode: mode,
            recipeIndex,
        });
        addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });

        // liquid_mode：in-0..2 belt，in-3 pipe；out-0 pipe，out-1..3 belt
        addEdge(graph, 'eOre', 'srcOre', 'refinery', {
            sourceHandle: 'out-0',
            targetHandle: 'in-0',
        });
        addEdge(graph, 'eWater', 'srcWater', 'refinery', {
            sourceHandle: 'out-0',
            targetHandle: 'in-3',
        });
        addEdge(graph, 'eOut', 'refinery', 'sink', {
            sourceHandle: 'out-1',
            targetHandle: 'in-0',
        });

        validateChains(graph);

        expect(graph.nodes.get('refinery')!.isValid).toBe(true);
        expect(graph.nodes.get('sink')!.isValid).toBe(true);
        expect(graph.nodes.get('srcOre')!.isValid).toBe(true);
        expect(graph.nodes.get('srcWater')!.isValid).toBe(true);
    });

    it('匯流器三入埠各一線 → 合法（多線進單機但埠不同）', () => {
        const graph = makeGraph();
        for (const id of ['a', 'b', 'c']) {
            addNode(graph, id, {
                machineType: '物品輸出口',
                isSource: true,
                outputRates: new Map([['源礦', 30]]),
            });
        }
        addNode(graph, 'merger', { machineType: '匯流器' });
        addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });

        addEdge(graph, 'e0', 'a', 'merger', {
            sourceHandle: 'out-0',
            targetHandle: 'in-0',
        });
        addEdge(graph, 'e1', 'b', 'merger', {
            sourceHandle: 'out-0',
            targetHandle: 'in-1',
        });
        addEdge(graph, 'e2', 'c', 'merger', {
            sourceHandle: 'out-0',
            targetHandle: 'in-2',
        });
        addEdge(graph, 'eOut', 'merger', 'sink', {
            sourceHandle: 'out-0',
            targetHandle: 'in-0',
        });

        validateChains(graph);

        expect(graph.nodes.get('merger')!.isValid).toBe(true);
        expect(graph.nodes.get('sink')!.isValid).toBe(true);
    });
});
