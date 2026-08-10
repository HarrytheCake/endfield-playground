/**
 * V7-F1 — FlowEngine 氣態／mode／媒質／loss 延後行為
 *
 * 對應手動情境：G1（氣態＋正確 mode）、G2（錯誤 mode）、G3（belt↔pipe）、L1（loss 不扣 summary）
 */

import { describe, it, expect } from 'vitest';
import type { FlowGraph, FlowNode, EdgeMeta } from '@/types/flow';
import {
    validateChains,
    topologicalSort,
    propagateFlows,
    calcItemSummary,
    buildGraph,
    validateRecipeMatch,
} from '@/composables/useFlowEngine';
import { getRecipesForMachine } from '@/data/products';
import { getMachine, getMachineMode } from '@/data/machines';
import type { FactoryNode, FactoryEdge } from '@/types/graph';

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
    if (idx < 0) {
        throw new Error(`找不到配方：${machineName} → ${primaryOutput} (mode=${modeId})`);
    }
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

function runPipeline(graph: FlowGraph) {
    validateChains(graph);
    const sorted = topologicalSort(graph);
    const flows = propagateFlows(sorted, graph);
    const summary = calcItemSummary(graph);
    return { flows, summary };
}

// ─── G1：氣態配方 + 正確 mode ─────────────────────────────────────────────────

describe('V7-F1 G1 — 氣態配方 + solid_mode', () => {
    /**
     * 息壤氣 Source → 固氣轉化機(solid_mode：息壤氣→息壤) → Sink
     * 抽象邊（無 handle）略過媒質，專注 mode 配方與氣態品項名。
     */
    it('正確 mode 下可算出息壤產出', () => {
        const mode = 'solid_mode';
        const recipeIndex = recipeIndexOf('固氣轉化機', '息壤', mode, { 息壤氣: 1 });
        const graph = makeGraph();

        addNode(graph, 'src', {
            machineType: '物品輸出口',
            machineMode: 'default',
            isSource: true,
            outputRates: new Map([['息壤氣', 30]]),
        });
        addNode(graph, 'converter', {
            machineType: '固氣轉化機',
            machineMode: mode,
            recipeIndex,
        });
        addNode(graph, 'sink', {
            machineType: '物品輸入口',
            isSink: true,
        });
        addEdge(graph, 'e1', 'src', 'converter');
        addEdge(graph, 'e2', 'converter', 'sink');

        const { flows, summary } = runPipeline(graph);

        expect(graph.nodes.get('converter')!.isValid).toBe(true);
        expect(graph.nodes.get('converter')!.efficiency).toBe(1);
        expect(flows.get('e1')?.itemId).toBe('息壤氣');
        expect(flows.get('e2')?.itemId).toBe('息壤');
        expect(summary.find((s) => s.itemId === '息壤')?.produced).toBeCloseTo(30, 5);
    });

    it('getRecipesForMachine(gas_mode) 回傳氣態配方且含 machineMode', () => {
        const recipes = getRecipesForMachine('固氣轉化機', 'gas_mode');
        expect(recipes.length).toBeGreaterThan(0);
        for (const r of recipes) {
            expect(r.machineMode == null || r.machineMode === 'gas_mode').toBe(true);
        }
        expect(recipes.some((r) => r.outputs.some((o) => o.itemId.includes('氣')))).toBe(true);
    });
});

// ─── G2：錯誤 machineMode／配方不符 ───────────────────────────────────────────

describe('V7-F1 G2 — 錯誤 machineMode', () => {
    it('用 base_mode index 在 liquid_mode 節點上找不到／品項不符 → 非法', () => {
        // 赤銅塊在 liquid_mode；若節點卻設 base_mode，同 index 會對到別的配方或找不到
        const liquidIdx = recipeIndexOf('精煉爐', '赤銅塊', 'liquid_mode', {
            赤銅礦: 1,
            清水: 1,
        });
        const graph = makeGraph();
        addNode(graph, 'srcOre', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['赤銅礦', 30]]),
        });
        addNode(graph, 'srcWater', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['清水', 30]]),
        });
        // 故意用錯誤 mode：base_mode + liquid 配方 index
        addNode(graph, 'refinery', {
            machineType: '精煉爐',
            machineMode: 'base_mode',
            recipeIndex: liquidIdx,
        });
        addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });
        addEdge(graph, 'e1', 'srcOre', 'refinery');
        addEdge(graph, 'e2', 'srcWater', 'refinery');
        addEdge(graph, 'e3', 'refinery', 'sink');

        validateChains(graph);
        expect(graph.nodes.get('refinery')!.isValid).toBe(false);
    });

    it('validateRecipeMatch：正確 liquid_mode 通過，錯 mode 失敗', () => {
        const idx = recipeIndexOf('精煉爐', '赤銅塊', 'liquid_mode', { 赤銅礦: 1, 清水: 1 });
        expect(validateRecipeMatch('精煉爐', idx, new Set(['赤銅礦', '清水']), 'liquid_mode')).toBe(
            true,
        );
        // 同一 index 在 base_mode 列表上通常不是赤銅塊配方
        expect(validateRecipeMatch('精煉爐', idx, new Set(['赤銅礦', '清水']), 'base_mode')).toBe(
            false,
        );
    });
});

// ─── G3：belt↔pipe 錯接 ───────────────────────────────────────────────────────

describe('V7-F1 G3 — belt↔pipe 錯接', () => {
    it('有 handle 時 belt→pipe 標記非法', () => {
        const nodes: FactoryNode[] = [
            {
                id: 'src',
                type: 'default',
                position: { x: 0, y: 0 },
                data: {
                    label: 'src',
                    machineType: '物品輸出口',
                    recipeIndex: 0,
                    machineMode: 'default',
                },
            },
            {
                id: 'purifier',
                type: 'default',
                position: { x: 0, y: 0 },
                data: {
                    label: 'purifier',
                    machineType: '提純機',
                    recipeIndex: 0,
                    machineMode: 'liquid_mode',
                },
            },
            {
                id: 'sink',
                type: 'default',
                position: { x: 0, y: 0 },
                data: { label: 'sink', machineType: '物品輸入口', recipeIndex: 0 },
            },
        ];
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
});

// ─── L1：loss 不納入 summary ───────────────────────────────────────────────────

describe('V7-F1 L1 — loss 不扣 summary', () => {
    it('固氣轉化機有 loss 資料，但 calcItemSummary 不額外扣 loss.rate_per_min', () => {
        const mode = getMachineMode(getMachine('固氣轉化機')!, 'solid_mode');
        expect(mode.loss?.item).toBe('息壤氣');
        expect(mode.loss?.rate_per_min).toBe(6);

        const recipeIndex = recipeIndexOf('固氣轉化機', '息壤', 'solid_mode', { 息壤氣: 1 });
        const graph = makeGraph();
        addNode(graph, 'src', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['息壤氣', 30]]),
        });
        addNode(graph, 'converter', {
            machineType: '固氣轉化機',
            machineMode: 'solid_mode',
            recipeIndex,
        });
        addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });
        addEdge(graph, 'e1', 'src', 'converter');
        addEdge(graph, 'e2', 'converter', 'sink');

        const { summary } = runPipeline(graph);
        const gas = summary.find((s) => s.itemId === '息壤氣');
        // 配方需求 30/min；若誤算 loss 會變成 36
        expect(gas?.consumed).toBeCloseTo(30, 5);
        expect(gas?.consumed).not.toBeCloseTo(36, 5);
    });
});
