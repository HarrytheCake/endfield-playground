/**
 * CR-04 FlowEngine 整合測試 (P1-H)
 *
 * 測試情境對應 TODOLIST.md H1–H6
 *
 * 注意：直接構造 FlowGraph 物件以隔離 Pinia store 依賴，
 * 精準驗證各核心演算法（validateChains / topologicalSort /
 * propagateFlows / detectCongestion / calcItemSummary）。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { FlowGraph, FlowNode, EdgeMeta } from '@/types/flow';
import { BELT_RATE_LIMIT } from '@/types/flow';
import {
    validateChains,
    topologicalSort,
    propagateFlows,
    detectCongestion,
    calcItemSummary,
} from '@/composables/useFlowEngine';
import { getRecipesForMachine } from '@/data/products';

// ─── 測試輔助工具 ──────────────────────────────────────────────────────────────

/**
 * 依產出品項（與可選輸入約束）解析 recipeIndex。
 * 索引相對於 getRecipesForMachine(machine, modeId) 過濾後列表。
 */
function recipeIndexOf(
    machineName: string,
    primaryOutput: string,
    requiredInputs?: Record<string, number>,
    modeId?: string,
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

const RI = {
    /** 碳塊→碳粉末×2（belt 截斷測試用） */
    crusherCarbonPowder: () => recipeIndexOf('粉碎機', '碳粉末', undefined, 'default'),
    crusherYuanPowder: () => recipeIndexOf('粉碎機', '源石粉末', undefined, 'default'),
    crusherBlueIronPowder: () => recipeIndexOf('粉碎機', '藍鐵粉末', undefined, 'default'),
    crusherSandLeafPowder: () => recipeIndexOf('粉碎機', '砂葉粉末', undefined, 'default'),
    crusherRedCopperPowder: () => recipeIndexOf('粉碎機', '赤銅粉末', undefined, 'default'),
    /** 藍鐵粉末×2＋砂葉粉末×1 → 緻密藍鐵粉末（time=2s → 理論 30/min） */
    grinderDenseBlueIron: () =>
        recipeIndexOf('研磨機', '緻密藍鐵粉末', undefined, 'default'),
    refineryRedCopper: () =>
        recipeIndexOf('精煉爐', '赤銅塊', { 赤銅礦: 1, 清水: 1 }, 'liquid_mode'),
    reactorRedCopperSolution: () =>
        recipeIndexOf('反應池', '赤銅溶液', { 赤銅粉末: 1 }, 'default'),
    reactorHueCopper: () => recipeIndexOf('反應池', '赫銅塊', { 赫銅溶液: 2 }, 'default'),
    purifierHueSolution: () =>
        recipeIndexOf('提純機', '赫銅溶液', { 赤銅溶液: 4 }, 'liquid_mode'),
    partsHueCopper: () => recipeIndexOf('配件機', '赫銅零件', undefined, 'default'),
};


/** 建立空白 FlowGraph */
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

interface AddNodeOpts {
    machineType?: string;
    machineMode?: string;
    recipeIndex?: number;
    isSource?: boolean;
    isSink?: boolean;
    inputRates?: Map<string, number>;
    outputRates?: Map<string, number>;
    efficiency?: number;
}

/** 新增節點至 FlowGraph */
function addNode(graph: FlowGraph, uid: string, opts: AddNodeOpts = {}): FlowNode {
    const node: FlowNode = {
        deviceUid: uid,
        machineType: opts.machineType ?? uid,
        machineMode: opts.machineMode,
        recipeIndex: opts.recipeIndex ?? 0,
        isSource: opts.isSource ?? false,
        isSink: opts.isSink ?? false,
        isValid: true,
        efficiency: opts.efficiency ?? 1,
        inputRates: opts.inputRates ?? new Map(),
        outputRates: opts.outputRates ?? new Map(),
    };
    graph.nodes.set(uid, node);
    graph.outEdges.set(uid, []);
    graph.inEdges.set(uid, []);
    return node;
}

/** 新增有向邊至 FlowGraph */
function addEdge(graph: FlowGraph, connUid: string, src: string, tgt: string): void {
    const meta: EdgeMeta = {
        connectionUid: connUid,
        sourceDeviceUid: src,
        targetDeviceUid: tgt,
    };
    graph.edgeMeta.set(connUid, meta);
    graph.outEdges.get(src)!.push(connUid);
    graph.inEdges.get(tgt)!.push(connUid);
}

/** 執行完整計算流程：topo → propagate → congestion → summary */
function runPipeline(graph: FlowGraph) {
    const sorted = topologicalSort(graph);
    const flows = propagateFlows(sorted, graph);
    detectCongestion(graph, flows);
    const summary = calcItemSummary(graph);
    return { sorted, flows, summary };
}

// ─── H1：基礎單鏈路（傳送帶截斷驗證） ────────────────────────────────────────

describe('H1 — 基礎單鏈路：碳塊→粉碎機→sink', () => {
    /**
     * 情境：
     *   物品輸出口(碳塊 30/min) → 粉碎機(1→2, time=2s, 需求=30, 產出=60) → 物品輸入口
     *
     * 預期：
     *   - source→crusher 邊：30/min（傳送帶上限）
     *   - crusher→sink 邊：30/min（傳送帶截斷，理論 60/min）
     *   - crusher 效率：100%（上游供料恰好符合需求）
     */
    let graph: FlowGraph;

    beforeEach(() => {
        graph = makeGraph();
        addNode(graph, 'source', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['碳塊', BELT_RATE_LIMIT]]), // 30/min
        });
        addNode(graph, 'crusher', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherCarbonPowder(),
            inputRates: new Map([['碳塊', 30]]),
            outputRates: new Map([['碳粉末', 60]]),
        });
        addNode(graph, 'sink', {
            machineType: '物品輸入口',
            isSink: true,
        });
        addEdge(graph, 'e1', 'source', 'crusher');
        addEdge(graph, 'e2', 'crusher', 'sink');
    });

    it('傳送帶上限截斷後 source→crusher 邊流量 = 30/min', () => {
        const { flows } = runPipeline(graph);
        expect(flows.get('e1')?.rate).toBe(BELT_RATE_LIMIT);
        expect(flows.get('e1')?.itemId).toBe('碳塊');
    });

    it('粉碎機理論輸出 60/min 經傳送帶截斷至 30/min', () => {
        const { flows } = runPipeline(graph);
        const e2 = flows.get('e2');
        expect(e2?.rate).toBe(BELT_RATE_LIMIT); // 30/min（截斷）
        expect(e2?.itemId).toBe('碳粉末');
    });

    it('粉碎機效率 = 100%（供料充足）', () => {
        runPipeline(graph);
        expect(graph.nodes.get('crusher')!.efficiency).toBe(1);
    });

    it('calcItemSummary 碳塊 consumed=30, 碳粉末 produced=60 (belt-capped edge)', () => {
        const { summary } = runPipeline(graph);
        const ore = summary.find((s) => s.itemId === '碳塊');
        const powder = summary.find((s) => s.itemId === '碳粉末');
        expect(ore?.consumed).toBeCloseTo(30, 5);
        expect(powder?.produced).toBeCloseTo(60, 5);
    });
});

// ─── H2：未配頻堵塞情境 ───────────────────────────────────────────────────────

describe('H2 — 未配頻：研磨機效率 50%', () => {
    /**
     * 情境（正式產品：緻密藍鐵粉末）：
     *   srcSand(砂葉) → crusherSand → 研磨機 ← crusherB ← srcB(藍鐵塊)
     *   研磨機配方：藍鐵粉末 60/min + 砂葉粉末 30/min → 緻密藍鐵粉末 30/min（time=2s）
     *
     *   實際抵達：藍鐵粉末 30 + 砂葉粉末 30
     *   效率 = min(30/60, 30/30) = 0.5 → 輸出 15/min
     */
    let graph: FlowGraph;

    beforeEach(() => {
        graph = makeGraph();

        addNode(graph, 'srcSand', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['砂葉', 30]]),
        });
        addNode(graph, 'srcB', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['藍鐵塊', 30]]),
        });
        addNode(graph, 'crusherSand', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherSandLeafPowder(),
            inputRates: new Map([['砂葉', 30]]),
            outputRates: new Map([['砂葉粉末', 30]]),
        });
        addNode(graph, 'crusherB', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherBlueIronPowder(),
            inputRates: new Map([['藍鐵塊', 30]]),
            outputRates: new Map([['藍鐵粉末', 30]]),
        });
        addNode(graph, 'grinder', {
            machineType: '研磨機',
            recipeIndex: RI.grinderDenseBlueIron(),
            inputRates: new Map([
                ['藍鐵粉末', 60],
                ['砂葉粉末', 30],
            ]),
            outputRates: new Map([['緻密藍鐵粉末', 30]]),
        });
        addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });

        addEdge(graph, 'e_srcSand_cS', 'srcSand', 'crusherSand');
        addEdge(graph, 'e_srcB_cB', 'srcB', 'crusherB');
        addEdge(graph, 'e_cS_g', 'crusherSand', 'grinder');
        addEdge(graph, 'e_cB_g', 'crusherB', 'grinder');
        addEdge(graph, 'e_g_sink', 'grinder', 'sink');
    });

    it('研磨機效率 = 50%（供料不足）', () => {
        runPipeline(graph);
        const eff = graph.nodes.get('grinder')!.efficiency;
        expect(eff).toBeCloseTo(0.5, 5);
    });

    it('研磨機輸出速率 = 15/min（30 × 0.5）', () => {
        runPipeline(graph);
        const output = graph.nodes.get('grinder')!.outputRates.get('緻密藍鐵粉末') ?? 0;
        expect(output).toBeCloseTo(15, 5);
    });

    it('研磨機→sink 管線流量 = 15/min', () => {
        const { flows } = runPipeline(graph);
        expect(flows.get('e_g_sink')?.rate).toBeCloseTo(15, 5);
    });

    it('crusherB 效率 = 100%（供料充足）', () => {
        runPipeline(graph);
        expect(graph.nodes.get('crusherB')!.efficiency).toBe(1);
    });
});

// ─── H3：配頻情境（研磨機效率 100%） ─────────────────────────────────────────

describe('H3 — 配頻：研磨機效率 100%', () => {
    /**
     * 與 H2 同配方（緻密藍鐵粉末），補足藍鐵粉末至 60/min：
     *   srcB1+srcB2 → cB1+cB2（各 30 藍鐵粉末）＋ srcSand → crusherSand（30 砂葉粉末）
     *   效率 = min(60/60, 30/30) = 1.0 → 輸出 30/min（等於 belt 上限）
     */
    let graph: FlowGraph;

    beforeEach(() => {
        graph = makeGraph();

        addNode(graph, 'srcSand', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['砂葉', 30]]),
        });
        for (const id of ['srcB1', 'srcB2']) {
            addNode(graph, id, {
                machineType: '物品輸出口',
                isSource: true,
                outputRates: new Map([['藍鐵塊', 30]]),
            });
        }
        addNode(graph, 'crusherSand', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherSandLeafPowder(),
            inputRates: new Map([['砂葉', 30]]),
            outputRates: new Map([['砂葉粉末', 30]]),
        });
        for (const id of ['cB1', 'cB2']) {
            addNode(graph, id, {
                machineType: '粉碎機',
                recipeIndex: RI.crusherBlueIronPowder(),
                inputRates: new Map([['藍鐵塊', 30]]),
                outputRates: new Map([['藍鐵粉末', 30]]),
            });
        }
        addNode(graph, 'grinder', {
            machineType: '研磨機',
            recipeIndex: RI.grinderDenseBlueIron(),
            inputRates: new Map([
                ['藍鐵粉末', 60],
                ['砂葉粉末', 30],
            ]),
            outputRates: new Map([['緻密藍鐵粉末', 30]]),
        });
        addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });

        addEdge(graph, 'e_sSand_cS', 'srcSand', 'crusherSand');
        addEdge(graph, 'e_sB1_cB1', 'srcB1', 'cB1');
        addEdge(graph, 'e_sB2_cB2', 'srcB2', 'cB2');
        addEdge(graph, 'e_cS_g', 'crusherSand', 'grinder');
        addEdge(graph, 'e_cB1_g', 'cB1', 'grinder');
        addEdge(graph, 'e_cB2_g', 'cB2', 'grinder');
        addEdge(graph, 'e_g_sink', 'grinder', 'sink');
    });

    it('配頻後研磨機效率 = 100%', () => {
        runPipeline(graph);
        const eff = graph.nodes.get('grinder')!.efficiency;
        expect(eff).toBeCloseTo(1, 5);
    });

    it('研磨機輸出 = 30/min（緻密藍鐵粉末）', () => {
        runPipeline(graph);
        const output = graph.nodes.get('grinder')!.outputRates.get('緻密藍鐵粉末') ?? 0;
        expect(output).toBeCloseTo(30, 5);
    });

    it('研磨機→sink 管線 = 30/min（滿速等於 belt 上限）', () => {
        const { flows } = runPipeline(graph);
        expect(flows.get('e_g_sink')?.rate).toBeCloseTo(30, 5);
    });
});

// ─── H4：非法鏈路不計入 ──────────────────────────────────────────────────────

describe('H4 — 非法鏈路：懸空節點與配方不符', () => {
    it('懸空粉碎機（無連接 sink）應被標記為非法', () => {
        const graph = makeGraph();
        addNode(graph, 'source', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['源礦', 30]]),
        });
        addNode(graph, 'orphan_crusher', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherYuanPowder(),
            inputRates: new Map([['源礦', 30]]),
            outputRates: new Map([['源石粉末', 30]]),
        });
        // 注意：沒有 sink，也沒有連接至 sink 的路徑
        addEdge(graph, 'e1', 'source', 'orphan_crusher');

        validateChains(graph);
        expect(graph.nodes.get('orphan_crusher')!.isValid).toBe(false);
        expect(graph.invalidSubgraphUids.has('orphan_crusher')).toBe(true);
    });

    it('懸空粉碎機不計入 calcItemSummary', () => {
        const graph = makeGraph();
        addNode(graph, 'source', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['源礦', 30]]),
        });
        addNode(graph, 'orphan', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherYuanPowder(),
            inputRates: new Map([['源礦', 30]]),
            outputRates: new Map([['源石粉末', 30]]),
        });
        addEdge(graph, 'e1', 'source', 'orphan');

        validateChains(graph);
        const sorted = topologicalSort(graph);
        const flows = propagateFlows(sorted, graph);
        detectCongestion(graph, flows);
        const summary = calcItemSummary(graph);

        // 懸空設備的品項不應出現在 summary（或速率為 0）
        const powder = summary.find((s) => s.itemId === '源石粉末');
        expect(powder?.produced ?? 0).toBeCloseTo(0, 5);
    });

    it('孤立節點（完全無連線）應被標記為非法', () => {
        const graph = makeGraph();
        addNode(graph, 'isolated', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherYuanPowder(),
            inputRates: new Map([['源礦', 30]]),
            outputRates: new Map([['源石粉末', 30]]),
        });

        validateChains(graph);
        expect(graph.nodes.get('isolated')!.isValid).toBe(false);
    });

    it('合法鏈路旁邊的懸空節點不影響合法鏈路計算', () => {
        const graph = makeGraph();
        // 合法鏈路
        addNode(graph, 'src', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['源礦', 30]]),
        });
        addNode(graph, 'crusher', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherYuanPowder(),
            inputRates: new Map([['源礦', 30]]),
            outputRates: new Map([['源石粉末', 30]]),
        });
        addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });
        addEdge(graph, 'e1', 'src', 'crusher');
        addEdge(graph, 'e2', 'crusher', 'sink');

        // 懸空節點
        addNode(graph, 'orphan', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherBlueIronPowder(),
            inputRates: new Map([['藍鐵塊', 30]]),
            outputRates: new Map([['藍鐵粉末', 30]]),
        });

        validateChains(graph);
        const { flows, summary } = runPipeline(graph);

        expect(graph.nodes.get('crusher')!.isValid).toBe(true);
        expect(graph.nodes.get('orphan')!.isValid).toBe(false);
        expect(flows.get('e1')?.rate).toBe(30);
        const powder = summary.find((s) => s.itemId === '藍鐵粉末');
        expect(powder?.produced ?? 0).toBeCloseTo(0, 5);
    });
});

// ─── H5：多輸出配方（赤銅塊 + 汙水） ─────────────────────────────────────────

describe('H5 — 多輸出配方：精煉爐（赤銅塊 + 汙水）', () => {
    /**
     * 情境：
     *   srcOre(赤銅礦 30/min) + srcWater(清水 30/min) → 精煉爐(1+1→1+1, time=2s)
     *   精煉爐輸出：赤銅塊 30/min + 汙水 30/min（兩條 belt 各至不同 sink）
     */
    let graph: FlowGraph;

    beforeEach(() => {
        graph = makeGraph();
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
        // 精煉爐：赤銅礦+清水 → 赤銅塊+汙水（各 30/min，time=2s）
        addNode(graph, 'refinery', {
            machineType: '精煉爐',
            machineMode: 'liquid_mode',
            recipeIndex: RI.refineryRedCopper(), // 赤銅塊配方
            inputRates: new Map([
                ['赤銅礦', 30],
                ['清水', 30],
            ]),
            outputRates: new Map([
                ['赤銅塊', 30],
                ['汙水', 30],
            ]),
        });
        addNode(graph, 'sinkCopper', { machineType: '物品輸入口', isSink: true });
        addNode(graph, 'sinkWaste', { machineType: '物品輸入口', isSink: true });

        addEdge(graph, 'e_ore', 'srcOre', 'refinery');
        addEdge(graph, 'e_water', 'srcWater', 'refinery');
        addEdge(graph, 'e_copper', 'refinery', 'sinkCopper');
        addEdge(graph, 'e_waste', 'refinery', 'sinkWaste');
    });

    it('精煉爐效率 = 100%（供料充足）', () => {
        runPipeline(graph);
        expect(graph.nodes.get('refinery')!.efficiency).toBe(1);
    });

    it('赤銅塊管線流量 = 30/min', () => {
        const { flows } = runPipeline(graph);
        const copper = flows.get('e_copper');
        expect(copper?.rate).toBeCloseTo(30, 5);
        expect(copper?.itemId).toBe('赤銅塊');
    });

    it('汙水管線流量 = 30/min', () => {
        const { flows } = runPipeline(graph);
        const waste = flows.get('e_waste');
        expect(waste?.rate).toBeCloseTo(30, 5);
        expect(waste?.itemId).toBe('汙水');
    });

    it('若汙水 sink 堵塞，精煉爐效率同步縮減（多輸出等比縮放）', () => {
        /**
         * 模擬：sinkWaste 只能接受 15/min 汙水（下游限速）
         * 注意：propagateFlows 會依實際接收量設 sink.inputRates，
         * 因此需在 propagateFlows 之後、detectCongestion 之前覆寫需求值。
         */
        const sorted = topologicalSort(graph);
        const flows = propagateFlows(sorted, graph);

        // 強制 sinkWaste 需求降為 15/min（模擬下游限速）
        graph.nodes.get('sinkWaste')!.inputRates.set('汙水', 15);

        detectCongestion(graph, flows);

        const refinery = graph.nodes.get('refinery')!;
        // 精煉爐效率應降至 0.5
        expect(refinery.efficiency).toBeCloseTo(0.5, 3);
        // 赤銅塊輸出也縮減（等比縮放）
        expect(refinery.outputRates.get('赤銅塊') ?? 0).toBeCloseTo(15, 3);
    });
});

// ─── H6：環路偵測（Cycle Detection） ─────────────────────────────────────────

describe('H6-cycle — 環路偵測', () => {
    it('環路節點應被標記為非法，hasCycle = true', () => {
        const graph = makeGraph();
        addNode(graph, 'A', { machineType: '粉碎機', recipeIndex: RI.crusherYuanPowder() });
        addNode(graph, 'B', { machineType: '研磨機', recipeIndex: RI.grinderDenseBlueIron() });
        // A → B → A 構成環
        addEdge(graph, 'e_AB', 'A', 'B');
        addEdge(graph, 'e_BA', 'B', 'A');

        topologicalSort(graph);
        expect(graph.hasCycle).toBe(true);
        expect(graph.invalidSubgraphUids.has('A')).toBe(true);
        expect(graph.invalidSubgraphUids.has('B')).toBe(true);
    });

    it('環路子圖不計入 calcItemSummary', () => {
        const graph = makeGraph();
        // 合法鏈路
        addNode(graph, 'src', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['源礦', 30]]),
        });
        addNode(graph, 'crusher', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherYuanPowder(),
            inputRates: new Map([['源礦', 30]]),
            outputRates: new Map([['源石粉末', 30]]),
        });
        addNode(graph, 'sink', { machineType: '物品輸入口', isSink: true });
        addEdge(graph, 'e1', 'src', 'crusher');
        addEdge(graph, 'e2', 'crusher', 'sink');
        // 環路子圖
        addNode(graph, 'cycA', { machineType: '研磨機', recipeIndex: RI.grinderDenseBlueIron() });
        addNode(graph, 'cycB', { machineType: '精煉爐', recipeIndex: RI.refineryRedCopper() });
        addEdge(graph, 'eAB', 'cycA', 'cycB');
        addEdge(graph, 'eBA', 'cycB', 'cycA');

        validateChains(graph);
        const { flows, summary } = runPipeline(graph);

        // 合法鏈路正常計算
        expect(flows.get('e1')?.rate).toBe(30);
        // 環路節點不貢獻品項
        expect(summary.every((s) => !['cycA', 'cycB'].includes(s.itemId))).toBe(true);
    });
});

// ─── H6-武陵鏈路：赫銅零件端對端 ────────────────────────────────────────────

describe('H6 — 武陵建造計畫端對端（赫銅零件鏈路）', () => {
    /**
     * 最小鏈路（不含沉積酸回流，僅順向驗證）：
     *
     *   srcOre(赤銅礦 30) ──→ crusherOre(赤銅粉末 30) ──→
     *                                                     reactionPool(赤銅溶液 30) ──→
     *   srcAcid(沉積酸 30) ──────────────────────────────→
     *
     *   赤銅溶液 → purifier(赫銅溶液 7.5, 沉積酸 7.5 per 30s→15/min cycle)
     *     注意：提純機配方 time=2s, 4×赤銅溶液 → 赫銅溶液×1 + 沉積酸×1
     *           30/min ÷ 4 = 7.5 cycles/min → 7.5/min 赫銅溶液 + 7.5/min 沉積酸
     *
     *   赫銅溶液 + 藍鐵粉末 → reactionB(赫銅塊 + 汙水)
     *   赫銅塊 → partMachine(赫銅零件) → sinkFinal
     */
    let graph: FlowGraph;

    beforeEach(() => {
        graph = makeGraph();

        // Sources
        addNode(graph, 'srcOre', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['赤銅塊', 30]]),
        });
        addNode(graph, 'srcAcid', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['沉積酸', 30]]),
        });
        addNode(graph, 'srcBlue', {
            machineType: '物品輸出口',
            isSource: true,
            outputRates: new Map([['藍鐵塊', 30]]),
        });

        // 粉碎機：赤銅塊 → 赤銅粉末（1:1, time=2s → 30/min）
        addNode(graph, 'crusherOre', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherRedCopperPowder(),
            inputRates: new Map([['赤銅塊', 30]]),
            outputRates: new Map([['赤銅粉末', 30]]),
        });

        // 粉碎機：藍鐵塊 → 藍鐵粉末（1:1, time=2s → 30/min）
        addNode(graph, 'crusherBlue', {
            machineType: '粉碎機',
            recipeIndex: RI.crusherBlueIronPowder(),
            inputRates: new Map([['藍鐵塊', 30]]),
            outputRates: new Map([['藍鐵粉末', 30]]),
        });

        // 反應池A：赤銅粉末 + 沉積酸 → 赤銅溶液（1+1→1, time=2s → 30/min）
        addNode(graph, 'reactionA', {
            machineType: '反應池',
            recipeIndex: RI.reactorRedCopperSolution(),
            inputRates: new Map([
                ['赤銅粉末', 30],
                ['沉積酸', 30],
            ]),
            outputRates: new Map([['赤銅溶液', 30]]),
        });

        // 提純機：4×赤銅溶液 → 1赫銅溶液 + 1沉積酸（time=2s → 7.5/min cycle）
        // 30/min 赤銅溶液 ÷ 4 = 7.5 cycles/min → 各 7.5/min 輸出
        addNode(graph, 'purifier', {
            machineType: '提純機',
            machineMode: 'liquid_mode',
            recipeIndex: RI.purifierHueSolution(),
            inputRates: new Map([['赤銅溶液', 30]]),
            outputRates: new Map([
                ['赫銅溶液', 7.5],
                ['沉積酸', 7.5],
            ]),
        });

        // 反應池B：赫銅溶液 + 藍鐵粉末 → 赫銅塊 + 汙水
        // V9-E1：同輸入集合取資料順序第一 → 1+1（非 2+1）配方；需求各 30/min
        // 實際：赫銅溶液 7.5/min → efficiency = 7.5/30 = 0.25 → 赫銅塊 7.5/min
        addNode(graph, 'reactionB', {
            machineType: '反應池',
            recipeIndex: RI.reactorHueCopper(),
            inputRates: new Map([
                ['赫銅溶液', 30],
                ['藍鐵粉末', 30],
            ]),
            outputRates: new Map([
                ['赫銅塊', 30],
                ['汙水', 30],
            ]),
        });

        // 配件機：5赫銅塊 → 赫銅零件（10s）→ 需求 30/min、產出 6/min
        // 實際：赫銅塊 7.5/min → efficiency = 0.25 → 赫銅零件 1.5/min
        addNode(graph, 'partMachine', {
            machineType: '配件機',
            recipeIndex: RI.partsHueCopper(),
            inputRates: new Map([['赫銅塊', 30]]),
            outputRates: new Map([['赫銅零件', 6]]),
        });

        // Sinks
        addNode(graph, 'sinkFinal', { machineType: '物品輸入口', isSink: true });
        addNode(graph, 'sinkWaste', { machineType: '物品輸入口', isSink: true });
        addNode(graph, 'sinkAcid', { machineType: '物品輸入口', isSink: true });

        // Edges
        addEdge(graph, 'e_ore_cOre', 'srcOre', 'crusherOre');
        addEdge(graph, 'e_blue_cBlue', 'srcBlue', 'crusherBlue');
        addEdge(graph, 'e_acid_rA', 'srcAcid', 'reactionA');
        addEdge(graph, 'e_cOre_rA', 'crusherOre', 'reactionA');
        addEdge(graph, 'e_rA_pur', 'reactionA', 'purifier');
        addEdge(graph, 'e_pur_sol', 'purifier', 'reactionB');
        addEdge(graph, 'e_cBlue_rB', 'crusherBlue', 'reactionB');
        addEdge(graph, 'e_pur_acid', 'purifier', 'sinkAcid');
        addEdge(graph, 'e_rB_part', 'reactionB', 'partMachine');
        addEdge(graph, 'e_rB_waste', 'reactionB', 'sinkWaste');
        addEdge(graph, 'e_part_sink', 'partMachine', 'sinkFinal');
    });

    it('提純機輸入 30/min 赤銅溶液，應產出 7.5/min 赫銅溶液', () => {
        runPipeline(graph);
        const output = graph.nodes.get('purifier')!.outputRates.get('赫銅溶液') ?? 0;
        expect(output).toBeCloseTo(7.5, 3);
    });

    it('赫銅零件最終產出 = 1.5/min（V9-E1 匹配 1+1 配方後效率 25%）', () => {
        const { flows } = runPipeline(graph);
        expect(flows.get('e_part_sink')?.rate).toBeCloseTo(1.5, 3);
        expect(flows.get('e_part_sink')?.itemId).toBe('赫銅零件');
    });

    it('反應池B 效率 = 0.25（V9-E1：同集合取第一條 1+1 配方，需求 30/min）', () => {
        runPipeline(graph);
        // purifier → 7.5/min 赫銅溶液；匹配配方需求 30/min → efficiency = 0.25
        expect(graph.nodes.get('reactionB')!.efficiency).toBeCloseTo(0.25, 3);
    });

    it('calcItemSummary 赫銅零件 produced > 0（由 partMachine 產出，最終送入 sink）', () => {
        const { summary } = runPipeline(graph);
        const item = summary.find((s) => s.itemId === '赫銅零件');
        expect(item).toBeDefined();
        // net=0 是正常的：partMachine 產出的赫銅零件全部流入 sinkFinal
        // produced > 0 確認生產鏈有效運作
        expect(item!.produced).toBeGreaterThan(0);
    });
});

// ─── topologicalSort：獨立驗證 ────────────────────────────────────────────────

describe('topologicalSort — 基礎排序正確性', () => {
    it('線性鏈路排序順序正確（A → B → C）', () => {
        const graph = makeGraph();
        addNode(graph, 'A', { machineType: '物品輸出口', isSource: true });
        addNode(graph, 'B', { machineType: '粉碎機' });
        addNode(graph, 'C', { machineType: '物品輸入口', isSink: true });
        addEdge(graph, 'e1', 'A', 'B');
        addEdge(graph, 'e2', 'B', 'C');

        const sorted = topologicalSort(graph);
        expect(sorted.indexOf('A')).toBeLessThan(sorted.indexOf('B'));
        expect(sorted.indexOf('B')).toBeLessThan(sorted.indexOf('C'));
    });

    it('無環路時 hasCycle = false', () => {
        const graph = makeGraph();
        addNode(graph, 'A', { machineType: '物品輸出口', isSource: true });
        addNode(graph, 'B', { machineType: '物品輸入口', isSink: true });
        addEdge(graph, 'e1', 'A', 'B');
        topologicalSort(graph);
        expect(graph.hasCycle).toBe(false);
    });
});
