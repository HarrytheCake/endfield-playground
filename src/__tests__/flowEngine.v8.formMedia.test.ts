/**
 * V8-C3／F1 — form ↔ belt／pipe 一致性
 */
import { describe, it, expect } from 'vitest';
import type { FlowGraph, FlowNode, EdgeMeta } from '@/types/flow';
import { validateChains } from '@/composables/useFlowEngine';

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

describe('V8-C3 form↔媒質', () => {
    it('M1：固體源礦經 pipe 口輸出 → 非法', () => {
        // 管道准入口出埠為 pipe，但源礦 form=solid → 全產出與線路不符
        const graph = makeGraph();
        addNode(graph, 'src', {
            machineType: '管道准入口',
            isSource: true,
            outputRates: new Map([['源礦', 30]]),
        });
        addNode(graph, 'sink', {
            machineType: '管道准入口',
            isSink: true,
        });
        addEdge(graph, 'e1', 'src', 'sink', {
            sourceHandle: 'out-0',
            targetHandle: 'in-0',
        });
        validateChains(graph);
        expect(graph.nodes.get('src')!.isValid).toBe(false);
        expect(graph.nodes.get('sink')!.isValid).toBe(false);
    });

    it('M2：氣體經 belt 口（物品輸出口）→ 非法', () => {
        const graph = makeGraph();
        addNode(graph, 'src', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['息壤氣', 30]]),
        });
        addNode(graph, 'sink', {
            machineType: '物品輸入口',
            isSink: true,
        });
        addEdge(graph, 'e1', 'src', 'sink', {
            sourceHandle: 'out-0',
            targetHandle: 'in-0',
        });
        validateChains(graph);
        expect(graph.nodes.get('src')!.isValid).toBe(false);
    });

    it('M3：液體清水經 pipe → 合法', () => {
        const graph = makeGraph();
        addNode(graph, 'src', {
            machineType: '管道准入口',
            isSource: true,
            outputRates: new Map([['清水', 30]]),
        });
        addNode(graph, 'sink', {
            machineType: '管道准入口',
            isSink: true,
        });
        addEdge(graph, 'e1', 'src', 'sink', {
            sourceHandle: 'out-0',
            targetHandle: 'in-0',
        });
        validateChains(graph);
        expect(graph.nodes.get('src')!.isValid).toBe(true);
        expect(graph.nodes.get('sink')!.isValid).toBe(true);
    });
});
