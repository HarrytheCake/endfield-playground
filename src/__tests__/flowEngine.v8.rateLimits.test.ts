/**
 * V8-C2 — belt 30／pipe 60 速率上限
 */
import { describe, it, expect } from 'vitest';
import type { FlowGraph, FlowNode, EdgeMeta } from '@/types/flow';
import { BELT_RATE_LIMIT, PIPE_RATE_LIMIT } from '@/types/flow';
import { topologicalSort, propagateFlows } from '@/composables/useFlowEngine';

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
        isSource?: boolean;
        isSink?: boolean;
        outputRates?: Map<string, number>;
    },
): FlowNode {
    const node: FlowNode = {
        deviceUid: uid,
        machineType: opts.machineType,
        machineMode: opts.machineMode ?? 'default',
        recipeIndex: 0,
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

function runPropagate(graph: FlowGraph) {
    const sorted = topologicalSort(graph);
    return propagateFlows(sorted, graph);
}

describe('V8-C2 R1 — belt 上限 30', () => {
    it('固體邊（物品輸出口→入口，handle）理論 90 → 截斷 30', () => {
        const graph = makeGraph();
        addNode(graph, 'src', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['源礦', 90]]),
        });
        addNode(graph, 'sink', {
            machineType: '物品輸入口',
            isSink: true,
        });
        addEdge(graph, 'e1', 'src', 'sink', {
            sourceHandle: 'out-0',
            targetHandle: 'in-0',
        });

        const flows = runPropagate(graph);
        expect(flows.get('e1')?.rate).toBe(BELT_RATE_LIMIT);
        expect(flows.get('e1')?.rate).toBe(30);
    });
});

describe('V8-C2 R2 — pipe 上限 60', () => {
    it('管道邊（管道准入口→准入口）理論 90 → 截斷 60', () => {
        const graph = makeGraph();
        addNode(graph, 'src', {
            machineType: '管道准入口',
            isSource: true,
            outputRates: new Map([['清水', 90]]),
        });
        addNode(graph, 'sink', {
            machineType: '管道准入口',
            isSink: true,
        });
        addEdge(graph, 'e1', 'src', 'sink', {
            sourceHandle: 'out-0',
            targetHandle: 'in-0',
        });

        const flows = runPropagate(graph);
        expect(flows.get('e1')?.rate).toBe(PIPE_RATE_LIMIT);
        expect(flows.get('e1')?.rate).toBe(60);
    });

    it('管道邊理論 50 → 不截斷（低於 60）', () => {
        const graph = makeGraph();
        addNode(graph, 'src', {
            machineType: '管道准入口',
            isSource: true,
            outputRates: new Map([['清水', 50]]),
        });
        addNode(graph, 'sink', {
            machineType: '管道准入口',
            isSink: true,
        });
        addEdge(graph, 'e1', 'src', 'sink', {
            sourceHandle: 'out-0',
            targetHandle: 'in-0',
        });

        const flows = runPropagate(graph);
        expect(flows.get('e1')?.rate).toBe(50);
    });

    it('無 handle 時依品項 form：液體可達 60（非 belt 30）', () => {
        const graph = makeGraph();
        addNode(graph, 'src', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['清水', 90]]),
        });
        addNode(graph, 'sink', {
            machineType: '物品輸入口',
            isSink: true,
        });
        // 抽象邊：無 handle → 回退 form（清水=liquid→pipe→60）
        addEdge(graph, 'e1', 'src', 'sink');

        const flows = runPropagate(graph);
        expect(flows.get('e1')?.rate).toBe(60);
    });
});
