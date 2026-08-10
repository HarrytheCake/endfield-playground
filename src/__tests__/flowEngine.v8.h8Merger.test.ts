/**
 * V8-C4 — H8：雙鏈 → 匯流器 → Sink，belt 出口限 30，回推約 15／15
 */
import { describe, it, expect } from 'vitest';
import type { FlowGraph, FlowNode, EdgeMeta } from '@/types/flow';
import {
    validateChains,
    topologicalSort,
    propagateFlows,
    detectCongestion,
} from '@/composables/useFlowEngine';
import { getRecipesForMachine } from '@/data/products';
import { BELT_RATE_LIMIT } from '@/types/flow';

function recipeIndexOf(machineName: string, primaryOutput: string, modeId = 'default'): number {
    const idx = getRecipesForMachine(machineName, modeId).findIndex((r) =>
        r.outputs.some((o) => o.itemId === primaryOutput),
    );
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
    handles: { sourceHandle: string; targetHandle: string },
): void {
    const meta: EdgeMeta = {
        connectionUid: connUid,
        sourceDeviceUid: src,
        targetDeviceUid: tgt,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
    };
    graph.edgeMeta.set(connUid, meta);
    graph.outEdges.get(src)!.push(connUid);
    graph.inEdges.get(tgt)!.push(connUid);
}

function buildH8Graph(): FlowGraph {
    const graph = makeGraph();
    const ri = recipeIndexOf('粉碎機', '源石粉末');

    addNode(graph, 'src1', {
        machineType: '物品輸出口',
        isSource: true,
        outputRates: new Map([['源礦', 30]]),
    });
    addNode(graph, 'src2', {
        machineType: '物品輸出口',
        isSource: true,
        outputRates: new Map([['源礦', 30]]),
    });
    addNode(graph, 'c1', { machineType: '粉碎機', recipeIndex: ri });
    addNode(graph, 'c2', { machineType: '粉碎機', recipeIndex: ri });
    addNode(graph, 'merger', { machineType: '匯流器' });
    addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });

    addEdge(graph, 'e1', 'src1', 'c1', { sourceHandle: 'out-0', targetHandle: 'in-0' });
    addEdge(graph, 'e2', 'src2', 'c2', { sourceHandle: 'out-0', targetHandle: 'in-0' });
    addEdge(graph, 'e3', 'c1', 'merger', { sourceHandle: 'out-0', targetHandle: 'in-0' });
    addEdge(graph, 'e4', 'c2', 'merger', { sourceHandle: 'out-0', targetHandle: 'in-1' });
    addEdge(graph, 'e5', 'merger', 'sink', { sourceHandle: 'out-0', targetHandle: 'in-0' });

    return graph;
}

function runFull(graph: FlowGraph) {
    validateChains(graph);
    const sorted = topologicalSort(graph);
    const flows = propagateFlows(sorted, graph);
    detectCongestion(graph, flows);
    return flows;
}

describe('V8-C4 H8 — 匯流器＋堵塞回推', () => {
    it('鏈路合法（含匯流器，非雙線直連 Sink）', () => {
        const graph = buildH8Graph();
        validateChains(graph);
        expect(graph.nodes.get('merger')!.isValid).toBe(true);
        expect(graph.nodes.get('sink')!.isValid).toBe(true);
        expect(graph.nodes.get('c1')!.isValid).toBe(true);
        expect(graph.nodes.get('c2')!.isValid).toBe(true);
    });

    it('滿速雙入後出口 ≤30，入邊回推約各 15', () => {
        const graph = buildH8Graph();
        const flows = runFull(graph);

        expect(flows.get('e5')?.rate).toBeCloseTo(BELT_RATE_LIMIT, 5);
        expect(flows.get('e5')?.rate).toBeCloseTo(30, 5);

        expect(flows.get('e3')?.rate).toBeCloseTo(15, 5);
        expect(flows.get('e4')?.rate).toBeCloseTo(15, 5);
        expect(flows.get('e3')?.isCongested).toBe(true);
        expect(flows.get('e4')?.isCongested).toBe(true);

        // 粉碎機效率因堵塞回推約 50%
        expect(graph.nodes.get('c1')!.efficiency).toBeCloseTo(0.5, 5);
        expect(graph.nodes.get('c2')!.efficiency).toBeCloseTo(0.5, 5);
    });
});
