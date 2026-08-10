/**
 * V9-H1-1 — H7：雙源同品灌粉碎機，需求 30 按供給平分為入邊各 15 並標堵塞
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

/** UI H7：雙基礎材料源 → 粉碎機 in-0／in-1 → Sink */
function buildH7Graph(): FlowGraph {
    const graph = makeGraph();
    const ri = recipeIndexOf('粉碎機', '源石粉末');

    addNode(graph, 'src1', {
        machineType: '基礎材料輸出點',
        isSource: true,
        outputRates: new Map([['源礦', 30]]),
    });
    addNode(graph, 'src2', {
        machineType: '基礎材料輸出點',
        isSource: true,
        outputRates: new Map([['源礦', 30]]),
    });
    addNode(graph, 'crusher', { machineType: '粉碎機', recipeIndex: ri });
    addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });

    addEdge(graph, 'e_a', 'src1', 'crusher', { sourceHandle: 'out-0', targetHandle: 'in-0' });
    addEdge(graph, 'e_b', 'src2', 'crusher', { sourceHandle: 'out-0', targetHandle: 'in-1' });
    addEdge(graph, 'e_out', 'crusher', 'sink', { sourceHandle: 'out-0', targetHandle: 'in-0' });

    return graph;
}

function runFull(graph: FlowGraph) {
    validateChains(graph);
    const sorted = topologicalSort(graph);
    const flows = propagateFlows(sorted, graph);
    detectCongestion(graph, flows);
    return flows;
}

describe('V9-H1-1 H7 — 一般機同品多入邊堵塞平分', () => {
    it('鏈路合法（雙埠分接，非單埠雙線）', () => {
        const graph = buildH7Graph();
        validateChains(graph);
        expect(graph.nodes.get('crusher')!.isValid).toBe(true);
        expect(graph.nodes.get('sink')!.isValid).toBe(true);
    });

    it('源礦入邊各堵約 15；出邊源石粉末 ≈30 且通常不堵；粉碎機效率 ≈100%', () => {
        const graph = buildH7Graph();
        const flows = runFull(graph);

        expect(flows.get('e_a')?.itemId).toBe('源礦');
        expect(flows.get('e_b')?.itemId).toBe('源礦');
        expect(flows.get('e_a')?.rate).toBeCloseTo(15, 5);
        expect(flows.get('e_b')?.rate).toBeCloseTo(15, 5);
        expect(flows.get('e_a')?.isCongested).toBe(true);
        expect(flows.get('e_b')?.isCongested).toBe(true);

        expect(flows.get('e_out')?.itemId).toBe('源石粉末');
        expect(flows.get('e_out')?.rate).toBeCloseTo(BELT_RATE_LIMIT, 5);
        expect(flows.get('e_out')?.isCongested).toBe(false);

        expect(graph.nodes.get('crusher')!.efficiency).toBeCloseTo(1, 5);
    });
});
