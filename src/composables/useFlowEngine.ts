/**
 * CR-04 useFlowEngine
 *
 * FlowEngine 核心演算法入口。
 * 當前實作範圍：P1-C（鏈路合法性驗證）
 *   C1 validateChains(graph)         合法鏈路過濾（反向 BFS）
 *   C2 validateRecipeMatch(...)      配方品項符合性檢查
 *
 * P1-D（buildGraph / topologicalSort / propagateFlows / ...）待後續工項補充。
 */

import type { FlowGraph, RecipeDef } from '@/types/flow';
import { getRecipe } from '@/data/devices';

//  C2：配方品項符合性檢查

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
 */
export function validateRecipeMatch(
    machineType: string,
    recipeIndex: number,
    incomingItemIds: Set<string>,
): boolean {
    const recipe = getRecipe(machineType, recipeIndex) as RecipeDef | undefined;

    // 找不到配方  不合法
    if (!recipe) return false;

    // source 節點（inputs 為空） 永遠合法
    if (recipe.inputs.length === 0) return true;

    // 配方所需的每種輸入品項，上游都必須有對應連線
    return recipe.inputs.every((input) => incomingItemIds.has(input.itemId));
}

//  C1：合法鏈路過濾

/**
 * 從所有 sink 節點出發進行反向 BFS，標記可以到達 sink 的節點為「合法鏈路」。
 * 同時沿途進行配方品項符合性驗證（validateRecipeMatch）。
 *
 * 處理後：
 *   - 不可達 sink 的節點       node.isValid = false，加入 graph.invalidSubgraphUids
 *   - 配方品項不符的節點       node.isValid = false，加入 graph.invalidSubgraphUids
 *   - 所有合法節點             node.isValid 維持 true
 *
 * 注意：此函式直接 mutate graph，不回傳新物件。
 * 呼叫前應先完成 buildGraph()，呼叫後再進行 topologicalSort() 與 propagateFlows()。
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
                const upstreamRecipe = getRecipe(
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

//  主入口（stub，P1-D 補齊）

/**
 * FlowEngine 主入口。
 *
 * 目前為 stub，P1-D 工項完成後串接完整演算法：
 *   buildGraph  validateChains  topologicalSort  propagateFlows
 *    detectCongestion  calcItemSummary  applyResult
 */
export function useFlowEngine() {
    // TODO P1-D: 實作完整引擎並掛載 watch
    return {};
}
