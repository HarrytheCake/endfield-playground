/**
 * CR-04 useFlowEngine
 *
 * FlowEngine 核心演算法入口。
 *
 * P1-C（鏈路合法性驗證）:
 *   C1  validateChains(graph)              — 反向 BFS 合法鏈路過濾
 *   C2  validateRecipeMatch(...)           — 配方品項符合性檢查
 *
 * P1-D（核心演算法）:
 *   D2  buildGraph(nodes, edges)           — 建立有向圖
 *   D3  topologicalSort(graph)             — Kahn's Algorithm
 *   D4  calcDeviceRate(recipe)             — 計算單機速率
 *   D5  calcDeviceOutput(node, received)   — 效率 + 多輸出
 *   D6  propagateFlows(sorted, graph)      — 正向傳播主迴圈
 *   D7  detectCongestion(graph, flows)     — 堵塞反向傳播
 *   D8  calcItemSummary(graph)             — 品項統計
 *   D9  runFlowEngine()                    — 主入口
 *
 * P1-E（Watch 觸發）:
 *   E1  useFlowEngine() composable         — watch + useDebounceFn(runFlowEngine, 150)
 */

import type {
    FlowGraph,
    FlowNode,
    EdgeMeta,
    EdgeFlow,
    ItemSummary,
    RecipeDef,
    FlowEngineResult,
} from '@/types/flow';
import { BELT_RATE_LIMIT } from '@/types/flow';
import { getRecipesForMachine } from '@/data/devices';
import { getMachine } from '@/data/machines';
import { useEditorStore } from '@/store/editorStore';
import { useFlowStore } from '@/store/flowStore';
import { useValidationStore } from '@/store/validationStore';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import { watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';

// ─── 內部工具 ─────────────────────────────────────────────────────────────────

/**
 * 依設備類型與配方索引取得 RecipeDef。
 * 使用 getRecipesForMachine（依設備名）而非 getRecipe（依產品名）。
 */
function getRecipeForNode(machineType: string, recipeIndex: number): RecipeDef | undefined {
    return getRecipesForMachine(machineType)[recipeIndex];
}

/**
 * D4 — 計算單台設備的理論輸入 / 輸出速率（個/min）。
 * ratePerMin = quantity × (60 / timeSeconds)
 */
function calcDeviceRate(recipe: RecipeDef): {
    inputRates: Map<string, number>;
    outputRates: Map<string, number>;
} {
    const cyclePerMin = 60 / recipe.timeSeconds;
    const inputRates = new Map<string, number>();
    const outputRates = new Map<string, number>();
    for (const item of recipe.inputs) {
        inputRates.set(item.itemId, item.quantity * cyclePerMin);
    }
    for (const item of recipe.outputs) {
        outputRates.set(item.itemId, item.quantity * cyclePerMin);
    }
    return { inputRates, outputRates };
}

// ─── C2：配方品項符合性檢查 ────────────────────────────────────────────────────

/**
 * 驗證上游實際傳入的品項集合是否符合設備所選配方的輸入需求。
 *
 * 規則：
 *   - 配方 inputs 為空（source 節點） 永遠合法
 *   - incomingItemIds 必須是 recipe.inputs 的 itemId 超集（或相等）
 *     也就是說，配方需要的每種輸入品項都必須有對應的上游連線
 *
 * @param machineType   設備類型名稱（對應 MachineDef.name）
 * @param recipeIndex   選用的配方索引
 * @param incomingItemIds  上游實際連入的品項名稱集合
 * @returns matched = true 代表配方合法
 *
 * @example
 * // 粉碎機配方 0（源石粉末）需要「源礦」作為輸入
 * validateRecipeMatch('粉碎機', 0, new Set(['源礦']))    // → true
 * validateRecipeMatch('粉碎機', 0, new Set(['赤銅礦']))  // → false（品項不符）
 */
export function validateRecipeMatch(
    machineType: string,
    recipeIndex: number,
    incomingItemIds: Set<string>,
): boolean {
    // 依設備名稱查詢配方（與 getRecipeForNode / propagateFlows 一致）
    const recipe = getRecipesForMachine(machineType)[recipeIndex];

    // 找不到配方  不合法
    if (!recipe) return false;

    // source 節點（inputs 為空） 永遠合法
    if (recipe.inputs.length === 0) return true;

    // 配方所需的每種輸入品項，上游都必須有對應連線
    return recipe.inputs.every((input) => incomingItemIds.has(input.itemId));
}

// ─── C1：合法鏈路過濾 ─────────────────────────────────────────────────────────

/**
 * 從所有 sink 節點出發進行反向 BFS，標記可以到達 sink 的節點為「合法鏈路」。
 * 同時沿途進行配方品項符合性驗證（validateRecipeMatch）。
 *
 * 處理後：
 *   - 不可達 sink 的節點       node.isValid = false，加入 graph.invalidSubgraphUids
 *   - 配方品項不符的節點       node.isValid = false，加入 graph.invalidSubgraphUids
 *   - 所有合法節點             node.isValid 維持 true
 *
 * 注意：此函式直接 mutate graph，不回傳新物件。  \
 * 呼叫前應先完成 buildGraph()，呼叫後再進行 topologicalSort() 與 propagateFlows()。
 *
 * @example
 * const graph = buildGraph(nodes, edges, hasBlockingError)
 * validateChains(graph)
 * // graph.invalidSubgraphUids 已含所有不可達 sink 或配方不符的節點
 */
export function validateChains(graph: FlowGraph): void {
    const { nodes, inEdges, edgeMeta } = graph;

    //  Step 1：收集所有 sink 節點作為 BFS 起點
    const reachableSinks = new Set<string>(); // 可到達 sink 的 deviceUid
    const queue: string[] = [];

    for (const [uid, node] of nodes) {
        if (node.isSink && node.isValid) {
            queue.push(uid);
            reachableSinks.add(uid);
        }
    }

    //  Step 2：反向 BFS，找出所有可以到達 sink 的節點
    while (queue.length > 0) {
        const current = queue.shift()!;
        const incomingEdges = inEdges.get(current) ?? [];

        for (const connUid of incomingEdges) {
            const meta = edgeMeta.get(connUid);
            if (!meta) continue;

            const upstreamUid = meta.sourceDeviceUid;
            if (reachableSinks.has(upstreamUid)) continue; // 已訪問

            const upstreamNode = nodes.get(upstreamUid);
            if (!upstreamNode || !upstreamNode.isValid) continue; // 已被 CR-03 或其他原因標記為非法

            reachableSinks.add(upstreamUid);
            queue.push(upstreamUid);
        }
    }

    //  Step 3：未被標記的節點加入 invalidSubgraphUids
    for (const [uid, node] of nodes) {
        if (!reachableSinks.has(uid)) {
            node.isValid = false;
            graph.invalidSubgraphUids.add(uid);
        }
    }

    //  Step 4：針對合法鏈路中的每個節點驗證配方品項符合性
    for (const [uid, node] of nodes) {
        if (!node.isValid) continue; // 已非法，跳過
        if (node.isSource) continue; // source 節點不需要驗配方輸入
        if (node.isSink) continue; // sink 節點接受任意品項，不驗配方

        // 蒐集上游所有邊傳入的品項（此時尚未計算速率，只看品項種類）
        const incomingEdgeUids = inEdges.get(uid) ?? [];
        const incomingItemIds = new Set<string>();

        for (const connUid of incomingEdgeUids) {
            const meta = edgeMeta.get(connUid);
            if (!meta) continue;

            // 從上游節點的 outputRates 推斷品項（buildGraph 後應已初始化）
            const upstreamNode = nodes.get(meta.sourceDeviceUid);
            if (!upstreamNode) continue;

            // 若上游 outputRates 尚未填充（buildGraph 階段），
            // 則根據上游節點的配方 outputs 推斷
            if (upstreamNode.outputRates.size > 0) {
                for (const itemId of upstreamNode.outputRates.keys()) {
                    incomingItemIds.add(itemId);
                }
            } else {
                // fallback：從配方定義推斷
                const upstreamRecipe = getRecipeForNode(
                    upstreamNode.machineType,
                    upstreamNode.recipeIndex,
                );
                if (upstreamRecipe) {
                    upstreamRecipe.outputs.forEach((o) => incomingItemIds.add(o.itemId));
                }
            }
        }

        const matched = validateRecipeMatch(node.machineType, node.recipeIndex, incomingItemIds);
        if (!matched) {
            node.isValid = false;
            graph.invalidSubgraphUids.add(uid);
        }
    }

    //  Step 5：配方不符節點的下游也應連帶標記為非法
    // （因為它們的上游輸入已不可信，需要再做一次正向 BFS 清除）
    _propagateInvalidDownstream(graph);
}

/**
 * 正向 BFS：將已標記為非法的節點，其所有下游節點也標記為非法。
 * 這確保配方不符節點不會「污染」下游計算。
 */
function _propagateInvalidDownstream(graph: FlowGraph): void {
    const { nodes, outEdges, edgeMeta } = graph;

    const invalidQueue: string[] = [...graph.invalidSubgraphUids];
    const visited = new Set<string>(graph.invalidSubgraphUids);

    while (invalidQueue.length > 0) {
        const current = invalidQueue.shift()!;
        const outgoingEdges = outEdges.get(current) ?? [];

        for (const connUid of outgoingEdges) {
            const meta = edgeMeta.get(connUid);
            if (!meta) continue;

            const downstreamUid = meta.targetDeviceUid;
            if (visited.has(downstreamUid)) continue;

            const downstreamNode = nodes.get(downstreamUid);
            if (!downstreamNode) continue;

            // sink 節點不向下游傳播（它就是終點）
            if (downstreamNode.isSink) continue;

            downstreamNode.isValid = false;
            graph.invalidSubgraphUids.add(downstreamUid);
            visited.add(downstreamUid);
            invalidQueue.push(downstreamUid);
        }
    }
}

// ─── D2：建立有向圖 ───────────────────────────────────────────────────────────

/**
 * D2 — 依 editorStore 的 nodes / edges 建立 FlowGraph。
 *
 * - 過濾 hasBlockingError(uid) 為 true 的節點
 * - 過濾兩端節點不存在於圖中的 edge（孤立邊）
 * - 為每個節點初始化理論 inputRates / outputRates（由 D4 calcDeviceRate 計算）
 *
 * @param nodes editorStore 中的所有節點
 * @param edges editorStore 中的所有邊
 * @param hasBlockingError 判斷指定設備是否被 CR-03 標記為 blocking error；  \
 *                         未傳入時所有節點都被視為合法（適合純單元測試）
 * @returns 初始化完成的 FlowGraph（節點 isValid 預設為 true）
 *
 * @example
 * const validationStore = useValidationStore()
 * const graph = buildGraph(editorStore.nodes, editorStore.edges, (uid) =>
 *   validationStore.hasBlockingError(uid),
 * )
 */
export function buildGraph(
    nodes: FactoryNode[],
    edges: FactoryEdge[],
    hasBlockingError: (uid: string) => boolean = () => false,
): FlowGraph {
    const graph: FlowGraph = {
        nodes: new Map(),
        outEdges: new Map(),
        inEdges: new Map(),
        edgeMeta: new Map(),
        hasCycle: false,
        invalidSubgraphUids: new Set(),
    };

    for (const node of nodes) {
        if (hasBlockingError(node.id)) continue;

        const machineType = node.data?.machineType ?? node.data?.label ?? node.id;
        const machineDef = getMachine(machineType);
        const recipeIndex = node.data?.recipeIndex ?? 0;

        const recipe = getRecipeForNode(machineType, recipeIndex);
        const { inputRates, outputRates } = recipe
            ? calcDeviceRate(recipe)
            : { inputRates: new Map<string, number>(), outputRates: new Map<string, number>() };

        const flowNode: FlowNode = {
            deviceUid: node.id,
            machineType,
            recipeIndex,
            isSource: machineDef?.is_source ?? false,
            isSink: machineDef?.is_sink ?? false,
            isValid: true,
            efficiency: 1,
            outputRates,
            inputRates,
        };

        graph.nodes.set(node.id, flowNode);
        graph.outEdges.set(node.id, []);
        graph.inEdges.set(node.id, []);
    }

    for (const edge of edges) {
        if (!graph.nodes.has(edge.source) || !graph.nodes.has(edge.target)) continue;
        const meta: EdgeMeta = {
            connectionUid: edge.id,
            sourceDeviceUid: edge.source,
            targetDeviceUid: edge.target,
        };
        graph.edgeMeta.set(edge.id, meta);
        graph.outEdges.get(edge.source)!.push(edge.id);
        graph.inEdges.get(edge.target)!.push(edge.id);
    }

    return graph;
}

// ─── D3：拓撲排序（Kahn's Algorithm） ────────────────────────────────────────

/**
 * D3 — Kahn's Algorithm 拓撲排序。
 *
 * 若排序後節點數 < 圖中節點總數，表示存在環路：  \
 *   graph.hasCycle = true，環路節點加入 invalidSubgraphUids 並標記 isValid = false。
 *
 * @param graph 已建立的 FlowGraph（會被 mutate）
 * @returns 依拓撲順序排列的節點 uid 陣列；存在環路時環路節點不會出現在結果中
 *
 * @example
 * const sorted = topologicalSort(graph)
 * if (graph.hasCycle) console.warn('偵測到環路')
 */
export function topologicalSort(graph: FlowGraph): string[] {
    const { nodes, outEdges, inEdges, edgeMeta } = graph;

    // 計算入度（僅計算兩端均 isValid 的邊）
    const inDegree = new Map<string, number>();
    for (const uid of nodes.keys()) {
        const validInCount = (inEdges.get(uid) ?? []).filter((connUid) => {
            const meta = edgeMeta.get(connUid);
            if (!meta) return false;
            return nodes.get(meta.sourceDeviceUid)?.isValid ?? false;
        }).length;
        inDegree.set(uid, validInCount);
    }

    const queue: string[] = [];
    for (const [uid, degree] of inDegree) {
        if (degree === 0) queue.push(uid);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
        const current = queue.shift()!;
        sorted.push(current);
        for (const connUid of outEdges.get(current) ?? []) {
            const meta = edgeMeta.get(connUid);
            if (!meta) continue;
            const targetUid = meta.targetDeviceUid;
            const newDegree = (inDegree.get(targetUid) ?? 0) - 1;
            inDegree.set(targetUid, newDegree);
            if (newDegree === 0) queue.push(targetUid);
        }
    }

    if (sorted.length < nodes.size) {
        graph.hasCycle = true;
        const sortedSet = new Set(sorted);
        for (const uid of nodes.keys()) {
            if (!sortedSet.has(uid)) {
                const node = nodes.get(uid)!;
                node.isValid = false;
                graph.invalidSubgraphUids.add(uid);
            }
        }
    }

    return sorted;
}

// ─── D6：正向傳播 ─────────────────────────────────────────────────────────────

/**
 * D6 — 依拓撲順序正向傳播，計算每條邊的流量與每台設備的效率。
 *
 * 出邊品項配對策略：優先比對下游配方所需 inputs，無法配對時取第一個有餘量的輸出品項。  \
 * 同時 mutate `graph.nodes[*].efficiency` 與 `outputRates` 反映實際運轉狀態。
 *
 * @param sortedNodes 由 topologicalSort 產生的拓撲順序 uid 陣列
 * @param graph       目前 FlowGraph
 * @returns connectionUid → EdgeFlow 對映表
 *
 * @example
 * const sorted = topologicalSort(graph)
 * const edgeFlows = propagateFlows(sorted, graph)
 */
export function propagateFlows(sortedNodes: string[], graph: FlowGraph): Map<string, EdgeFlow> {
    const { nodes, outEdges, edgeMeta } = graph;
    const edgeFlows = new Map<string, EdgeFlow>();

    // 記錄每個節點實際收到的各品項輸入（由上游正向填充）
    const nodeInputReceived = new Map<string, Map<string, number>>();
    for (const uid of nodes.keys()) {
        nodeInputReceived.set(uid, new Map());
    }

    for (const uid of sortedNodes) {
        const node = nodes.get(uid)!;
        if (!node.isValid) continue;

        const outEdgeUids = outEdges.get(uid) ?? [];

        if (node.isSource) {
            // Source：直接以理論速率輸出（套 BELT_RATE_LIMIT）
            for (const connUid of outEdgeUids) {
                const meta = edgeMeta.get(connUid);
                if (!meta) continue;
                for (const [itemId, recipeRate] of node.outputRates) {
                    const rate = Math.min(recipeRate, BELT_RATE_LIMIT);
                    edgeFlows.set(connUid, {
                        connectionUid: connUid,
                        itemId,
                        rate,
                        isCongested: false,
                    });
                    const downstream = nodeInputReceived.get(meta.targetDeviceUid);
                    if (downstream) downstream.set(itemId, (downstream.get(itemId) ?? 0) + rate);
                }
            }
        } else if (node.isSink) {
            // Sink：接受所有上游輸入，更新 inputRates
            const received = nodeInputReceived.get(uid) ?? new Map();
            for (const [itemId, rate] of received) node.inputRates.set(itemId, rate);
            node.efficiency = 1;
        } else {
            // 一般設備（D5 calcDeviceOutput）
            const received = nodeInputReceived.get(uid) ?? new Map();
            const recipe = getRecipeForNode(node.machineType, node.recipeIndex);
            if (!recipe) {
                node.isValid = false;
                graph.invalidSubgraphUids.add(uid);
                continue;
            }

            const { inputRates: requiredRates, outputRates: recipeOutputRates } =
                calcDeviceRate(recipe);

            // efficiency = min(supplied / required)
            let efficiency = 1;
            for (const [itemId, required] of requiredRates) {
                const supplied = received.get(itemId) ?? 0;
                if (required > 0) efficiency = Math.min(efficiency, supplied / required);
            }
            efficiency = Math.min(1, Math.max(0, efficiency));
            node.efficiency = efficiency;

            for (const [itemId, required] of requiredRates) {
                node.inputRates.set(itemId, required * efficiency);
            }

            const actualOutputRates = new Map<string, number>();
            for (const [itemId, recipeRate] of recipeOutputRates) {
                actualOutputRates.set(itemId, recipeRate * efficiency);
            }
            node.outputRates = actualOutputRates;

            // 傳遞至下游各邊（品項配對）
            const outputAvailable = new Map(actualOutputRates);
            for (const connUid of outEdgeUids) {
                const meta = edgeMeta.get(connUid);
                if (!meta) continue;
                const downstreamNode = nodes.get(meta.targetDeviceUid);
                if (!downstreamNode) continue;

                const downstreamRecipe = downstreamNode.isSink
                    ? null
                    : getRecipeForNode(downstreamNode.machineType, downstreamNode.recipeIndex);

                let chosenItemId: string | undefined;
                let chosenRate = 0;

                if (downstreamRecipe) {
                    for (const input of downstreamRecipe.inputs) {
                        const available = outputAvailable.get(input.itemId) ?? 0;
                        if (available > 0) {
                            chosenItemId = input.itemId;
                            chosenRate = Math.min(available, BELT_RATE_LIMIT);
                            break;
                        }
                    }
                }
                if (!chosenItemId) {
                    for (const [itemId, rate] of outputAvailable) {
                        if (rate > 0) {
                            chosenItemId = itemId;
                            chosenRate = Math.min(rate, BELT_RATE_LIMIT);
                            break;
                        }
                    }
                }
                if (!chosenItemId) continue;

                edgeFlows.set(connUid, {
                    connectionUid: connUid,
                    itemId: chosenItemId,
                    rate: chosenRate,
                    isCongested: false,
                });
                outputAvailable.set(
                    chosenItemId,
                    (outputAvailable.get(chosenItemId) ?? 0) - chosenRate,
                );
                const downstream = nodeInputReceived.get(meta.targetDeviceUid);
                if (downstream)
                    downstream.set(chosenItemId, (downstream.get(chosenItemId) ?? 0) + chosenRate);
            }
        }
    }

    return edgeFlows;
}

// ─── D7：堵塞反向傳播 ─────────────────────────────────────────────────────────

/**
 * D7 — 偵測堵塞並向上游反向更新效率。
 *
 * 若某條邊的 supply > downstream.inputRates（需求）：  \
 *   - isCongested = true，rate 截斷至 demand  \
 *   - 上游節點效率與 outputRates 按比例縮減  \
 *   - 上游的 inputRates 同步縮減，影響更上游的剩餘資源計算
 *
 * @param graph     目前 FlowGraph（會被 mutate）
 * @param edgeFlows propagateFlows 產生的邊流量表（會被 mutate）
 *
 * @example
 * const edgeFlows = propagateFlows(sorted, graph)
 * detectCongestion(graph, edgeFlows)
 * // 受限邊在 edgeFlows 中已標記 isCongested = true
 */
export function detectCongestion(graph: FlowGraph, edgeFlows: Map<string, EdgeFlow>): void {
    const { nodes, outEdges, inEdges, edgeMeta } = graph;

    // 多遍迭代直到穩定，確保堵塞能反向傳播至 source 節點
    const MAX_PASSES = nodes.size + 2;
    for (let pass = 0; pass < MAX_PASSES; pass++) {
        let changed = false;

        for (const [connUid, flow] of edgeFlows) {
            const meta = edgeMeta.get(connUid);
            if (!meta) continue;

            const targetNode = nodes.get(meta.targetDeviceUid);
            if (!targetNode || !targetNode.isValid) continue;

            const demand = targetNode.inputRates.get(flow.itemId) ?? 0;
            if (flow.rate <= demand + 1e-6) continue;

            // 標記堵塞，截斷至 demand
            edgeFlows.set(connUid, { ...flow, isCongested: true, rate: demand });
            changed = true;

            const sourceNode = nodes.get(meta.sourceDeviceUid);
            if (!sourceNode || !sourceNode.isValid) continue;

            const congestionRatio = flow.rate > 0 ? demand / flow.rate : 0;

            // source 節點：只縮減 outputRates（無 inputRates）
            if (sourceNode.isSource) {
                for (const [itemId, rate] of sourceNode.outputRates) {
                    sourceNode.outputRates.set(itemId, rate * congestionRatio);
                }
                continue;
            }

            sourceNode.efficiency = Math.max(0, sourceNode.efficiency * congestionRatio);

            for (const [itemId, rate] of sourceNode.outputRates) {
                sourceNode.outputRates.set(itemId, rate * congestionRatio);
            }
            for (const [itemId, rate] of sourceNode.inputRates) {
                sourceNode.inputRates.set(itemId, rate * congestionRatio);
            }

            // 同步縮減上游其他出邊的 rate
            for (const upConnUid of outEdges.get(meta.sourceDeviceUid) ?? []) {
                if (upConnUid === connUid) continue;
                const upFlow = edgeFlows.get(upConnUid);
                if (upFlow)
                    edgeFlows.set(upConnUid, { ...upFlow, rate: upFlow.rate * congestionRatio });
            }

            // 檢查更上游的入邊是否也需標記堵塞
            for (const upConnUid of inEdges.get(meta.sourceDeviceUid) ?? []) {
                const upMeta = edgeMeta.get(upConnUid);
                if (!upMeta) continue;
                const upFlow = edgeFlows.get(upConnUid);
                if (!upFlow) continue;
                const upDemand = sourceNode.inputRates.get(upFlow.itemId) ?? 0;
                if (upFlow.rate > upDemand + 1e-6) {
                    edgeFlows.set(upConnUid, { ...upFlow, isCongested: true, rate: upDemand });
                }
            }
        }

        if (!changed) break;
    }
}

// ─── D8：品項統計 ─────────────────────────────────────────────────────────────

/**
 * D8 — 統計所有合法節點的品項生產 / 消耗 / 淨產量 / 效率。  \
 * 略過 `isValid = false` 的節點；多台生產同品項的設備效率取最小值。
 *
 * @param graph 已跑完 propagateFlows / detectCongestion 的 FlowGraph
 * @returns 各品項統計陣列；依 net 由大到小排序
 *
 * @example
 * const summary = calcItemSummary(graph)
 * const surplus = summary.filter((s) => s.net > 0)
 */
export function calcItemSummary(graph: FlowGraph): ItemSummary[] {
    const { nodes } = graph;
    const produced = new Map<string, number>();
    const consumed = new Map<string, number>();
    const efficiencyByItem = new Map<string, number[]>();

    for (const [, node] of nodes) {
        if (!node.isValid) continue;
        for (const [itemId, rate] of node.outputRates) {
            if (rate <= 0) continue;
            produced.set(itemId, (produced.get(itemId) ?? 0) + rate);
            if (!efficiencyByItem.has(itemId)) efficiencyByItem.set(itemId, []);
            efficiencyByItem.get(itemId)!.push(node.efficiency);
        }
        for (const [itemId, rate] of node.inputRates) {
            if (rate <= 0) continue;
            consumed.set(itemId, (consumed.get(itemId) ?? 0) + rate);
        }
    }

    const allItems = new Set([...produced.keys(), ...consumed.keys()]);
    const summary: ItemSummary[] = [];

    for (const itemId of allItems) {
        const p = produced.get(itemId) ?? 0;
        const c = consumed.get(itemId) ?? 0;
        const effs = efficiencyByItem.get(itemId) ?? [1];
        summary.push({
            itemId,
            name: itemId,
            produced: p,
            consumed: c,
            net: p - c,
            efficiency: Math.min(...effs),
        });
    }

    summary.sort((a, b) => b.net - a.net);
    return summary;
}

// ─── D9：runFlowEngine 主入口 ─────────────────────────────────────────────────

/**
 * D9 — FlowEngine 主入口，串接 D2 → C1 → D3 → D6 → D7 → D8，寫入 useFlowStore。
 *
 * 電力統計：  \
 *   totalPowerDemand = Σ machineDef.power（power > 0 的有效設備）  \
 *   totalPowerSupply = 0（供電設備尚待 CR-01 定義）
 *
 * 副作用：寫入 `useFlowStore`（applyResult / isCalculating flag）。  \
 * 失敗時不 throw，僅 console.error 並重置 isCalculating。
 *
 * @example
 * // 通常透過 useFlowEngine composable 自動觸發；
 * // 在 dev 測試頁可手動呼叫：
 * await runFlowEngine()
 */
export async function runFlowEngine(): Promise<void> {
    const editorStore = useEditorStore();
    const flowStore = useFlowStore();
    const validationStore = useValidationStore();

    flowStore.$patch({ isCalculating: true });

    try {
        const graph = buildGraph(editorStore.nodes, editorStore.edges, (uid) =>
            validationStore.hasBlockingError(uid),
        );
        validateChains(graph);
        const sortedNodes = topologicalSort(graph);
        const edgeFlowsMap = propagateFlows(sortedNodes, graph);
        detectCongestion(graph, edgeFlowsMap);
        const itemSummaryList = calcItemSummary(graph);

        // 計算物品輸入口（sink）實際接收量，供「總產出」面板使用
        const sinkDeliveriesMap = new Map<string, number>();
        for (const [, node] of graph.nodes) {
            if (!node.isValid || !node.isSink) continue;
            for (const [itemId, rate] of node.inputRates) {
                if (rate > 0)
                    sinkDeliveriesMap.set(itemId, (sinkDeliveriesMap.get(itemId) ?? 0) + rate);
            }
        }

        let totalPowerDemand = 0;
        for (const [, node] of graph.nodes) {
            if (!node.isValid) continue;
            const def = getMachine(node.machineType);
            if (def && def.power > 0) totalPowerDemand += def.power;
        }

        const congestedEdges = new Set<string>();
        for (const [connUid, flow] of edgeFlowsMap) {
            if (flow.isCongested) congestedEdges.add(connUid);
        }

        const nodeEfficiencies = new Map<string, number>();
        for (const [uid, node] of graph.nodes) {
            nodeEfficiencies.set(uid, node.isValid ? node.efficiency : 0);
        }

        const result: FlowEngineResult = {
            edgeFlows: edgeFlowsMap,
            nodeEfficiencies,
            itemSummary: itemSummaryList,
            sinkDeliveries: sinkDeliveriesMap,
            congestedEdges,
            invalidChainUids: graph.invalidSubgraphUids,
            totalPowerDemand,
            totalPowerSupply: 0,
        };
        flowStore.applyResult(result);
    } catch (err) {
        console.error('[FlowEngine] runFlowEngine error:', err);
        flowStore.$patch({ isCalculating: false });
    }
}

// ─── E1：Composable 入口 ──────────────────────────────────────────────────

/**
 * useFlowEngine — Vue composable 入口。
 *
 * 在元件內呼叫一次即可啟動監聽（建議在 MainLayout.vue 的 setup 處呼叫）。  \
 * 為了讓 FlowEngine 能用到最新的 validation 結果，**請先呼叫 `useValidation()` 再呼叫本函式**。
 *
 * 監聽策略：
 *   - 監聽目標：`editorStore.nodes` / `editorStore.edges` / `validationStore.alerts`
 *   - `immediate: true`：setup 時立即執行一次全量計算
 *   - `deep: true`：捕捉節點內部變動（配方更改、旋轉等）
 *   - `useDebounceFn(runFlowEngine, 150)`：150ms 防抄動，避免畫布快速操作時重複計算
 *
 * @example
 * // MainLayout.vue
 * useValidation()
 * useFlowEngine()
 */
export function useFlowEngine() {
    const editorStore = useEditorStore();
    const validationStore = useValidationStore();
    const debouncedRun = useDebounceFn(runFlowEngine, 150);

    watch(
        // 同時監聽 nodes / edges 與 validation 結果
        [() => editorStore.nodes, () => editorStore.edges, () => validationStore.alerts],
        debouncedRun,
        { deep: true, immediate: true },
    );

    return { runFlowEngine };
}
