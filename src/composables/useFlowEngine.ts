/**
 * CR-04 useFlowEngine
 *
 * FlowEngine 核心演算法入口。
 *
 * P1-C（鏈路合法性驗證）:
 *   C1  validateChains(graph)              — 反向 BFS 合法鏈路過濾
 *   C2  validateRecipeMatch(...)           — 固定索引配方符合性（除錯）
 *   V9-E1 matchRecipeByInputs(...)         — 依實際輸入集合匹配配方
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
 *   useFlowEngine() composable             — watch + useDebounceFn(runFlowEngine, 150)
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
import { BELT_RATE_LIMIT, rateLimitForMedia, formToPortMedia } from '@/types/flow';
import { getRecipesForMachine, getItemForm } from '@/data/products';
import { getMachine, getMachineMode } from '@/data/machines';
import type { PortMedia } from '@/types/machine';
import { useEditorStore } from '@/store/editorStore';
import { useFlowStore } from '@/store/flowStore';
import { useValidationStore } from '@/store/validationStore';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import { watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';

// ─── 內部工具 ─────────────────────────────────────────────────────────────────

/**
 * 解析節點的機器型態 id；缺省為該機器 modes[0].id。
 *
 * @param machineType 設備中文名
 * @param machineMode 節點上的 machineMode（可缺）
 */
export function resolveMachineMode(
    machineType: string,
    machineMode?: string,
): string | undefined {
    const machine = getMachine(machineType);
    if (!machine?.modes.length) return machineMode;
    return getMachineMode(machine, machineMode).id;
}

/**
 * 依設備類型、型態與配方索引取得 RecipeDef。
 * recipeIndex 是對 `getRecipesForMachine(machineType, machineMode)` 過濾後列表的索引。
 *
 * @param machineType 設備類型名稱
 * @param recipeIndex 選用的配方索引（mode 過濾後）
 * @param machineMode 機器型態；缺省 modes[0]
 */
function getRecipeForNode(
    machineType: string,
    recipeIndex: number,
    machineMode?: string,
): RecipeDef | undefined {
    const modeId = resolveMachineMode(machineType, machineMode);
    return getRecipesForMachine(machineType, modeId)[recipeIndex];
}

/** 兩字串集合是否完全相同 */
function itemSetsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const id of a) {
        if (!b.has(id)) return false;
    }
    return true;
}

/**
 * V9-E1：依實際接入品項種類匹配配方。
 *
 * - 限定 machineType＋machineMode 配方子集
 * - 接入品項集合須與配方 inputs **完全吻合**
 * - environment 須一致（缺省皆為 `"none"`）
 * - 多候選取資料順序第一條
 *
 * @returns 匹配的配方與 mode 過濾後索引；無匹配回傳 null
 */
export function matchRecipeByInputs(
    machineType: string,
    incomingItemIds: Set<string>,
    machineMode?: string,
    environment: string = 'none',
): { recipe: RecipeDef; index: number } | null {
    const modeId = resolveMachineMode(machineType, machineMode);
    const recipes = getRecipesForMachine(machineType, modeId);
    const env = environment || 'none';

    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i]!;
        if ((recipe.environment ?? 'none') !== env) continue;
        const need = new Set(recipe.inputs.map((inp) => inp.itemId));
        if (itemSetsEqual(need, incomingItemIds)) {
            return { recipe, index: i };
        }
    }
    return null;
}

/**
 * 各入邊各選一品後，集合是否能剛好等於 need（一條邊一種物流）。
 * 邊數可多於 need（多餘邊須能選到已覆蓋品，使集合不膨脹）— 實際上要求選取集合 === need。
 */
function edgePicksCanEqualNeed(
    edgeCandidates: readonly (readonly string[])[],
    need: Set<string>,
): boolean {
    if (need.size === 0) return edgeCandidates.every((c) => c.length === 0);
    if (edgeCandidates.length === 0) return false;

    const edges = edgeCandidates.map((c) => c.filter((id) => need.has(id)));
    if (edges.some((c) => c.length === 0)) return false;

    const picked: string[] = [];
    const dfs = (i: number): boolean => {
        if (i >= edges.length) {
            return itemSetsEqual(new Set(picked), need);
        }
        const opts = edges[i]!;
        for (const item of opts) {
            picked.push(item);
            if (dfs(i + 1)) return true;
            picked.pop();
        }
        return false;
    };
    return dfs(0);
}

/**
 * V9-H1-2：依「每邊候選品項」匹配配方（多輸出上游不把副產算進輸入集合）。
 *
 * 每條入邊從候選中選一品；選取集合須與配方 inputs 完全吻合。
 *
 * @param edgeCandidateItems 各入邊可承載的品項列表（通常為上游 outputs）
 */
export function matchRecipeByEdgeCandidates(
    machineType: string,
    edgeCandidateItems: readonly (readonly string[])[],
    machineMode?: string,
    environment: string = 'none',
): { recipe: RecipeDef; index: number } | null {
    if (edgeCandidateItems.length === 0) {
        return matchRecipeByInputs(machineType, new Set(), machineMode, environment);
    }

    // 單邊單品：與舊 matchRecipeByInputs 等價（含多邊各一品的扁平集合）
    const solePerEdge = edgeCandidateItems.every((c) => c.length <= 1);
    if (solePerEdge) {
        const flat = new Set<string>();
        for (const c of edgeCandidateItems) {
            if (c[0]) flat.add(c[0]);
        }
        return matchRecipeByInputs(machineType, flat, machineMode, environment);
    }

    const modeId = resolveMachineMode(machineType, machineMode);
    const recipes = getRecipesForMachine(machineType, modeId);
    const env = environment || 'none';

    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i]!;
        if ((recipe.environment ?? 'none') !== env) continue;
        const need = new Set(recipe.inputs.map((inp) => inp.itemId));
        if (edgePicksCanEqualNeed(edgeCandidateItems, need)) {
            return { recipe, index: i };
        }
    }
    return null;
}

/**
 * 機器在該 mode 下是否有任何配方（分流器等無配方節點回傳 false）。
 */
function machineHasRecipes(machineType: string, machineMode?: string): boolean {
    const modeId = resolveMachineMode(machineType, machineMode);
    return getRecipesForMachine(machineType, modeId).length > 0;
}

/**
 * 自 Vue Flow handle id 解析埠索引（`out-0` / `in-1`）。
 * 無法解析時回傳 0。
 */
function parseHandlePortIndex(handle: string | null | undefined, kind: 'in' | 'out'): number {
    if (!handle) return 0;
    const m = handle.match(new RegExp(`^${kind}-(\\d+)$`));
    return m ? Number(m[1]) : 0;
}

/**
 * 取得節點指定 handle 對應埠的媒質。
 * handle 缺省或無埠／索引越界時回傳 null（略過埠媒質，改由 form 等回退）。
 */
function resolvePortMedia(
    machineType: string,
    machineMode: string | undefined,
    direction: 'in' | 'out',
    handle: string | null | undefined,
): PortMedia | null {
    if (handle == null) return null;
    const machine = getMachine(machineType);
    if (!machine) return null;
    const mode = getMachineMode(machine, machineMode);
    const ports = direction === 'in' ? mode.input_ports : mode.output_ports;
    if (!ports.length) return null;
    const idx = parseHandlePortIndex(handle, direction);
    return ports[idx]?.media ?? null;
}

/**
 * 解析邊上應套用的媒質（優先來源出埠，其次目標入埠）。
 */
function resolveEdgeMedia(
    source: FlowNode,
    target: FlowNode,
    meta: EdgeMeta,
): PortMedia | null {
    const srcMedia = resolvePortMedia(
        source.machineType,
        source.machineMode,
        'out',
        meta.sourceHandle,
    );
    if (srcMedia) return srcMedia;
    return resolvePortMedia(target.machineType, target.machineMode, 'in', meta.targetHandle);
}

/**
 * 邊上速率上限：
 * 1. 能從埠解析媒質 → belt 30／pipe 60
 * 2. 否則若已知品項 → 依 form（solid→30，liquid／gas→60）
 * 3. 皆未知 → 保守 BELT_RATE_LIMIT（30）
 *
 * @param itemId 邊上承載品項（可選）
 */
function edgeRateLimit(
    source: FlowNode,
    target: FlowNode,
    meta: EdgeMeta,
    itemId?: string,
): number {
    const portMedia = resolveEdgeMedia(source, target, meta);
    if (portMedia) return rateLimitForMedia(portMedia);
    if (itemId) return rateLimitForMedia(formToPortMedia(getItemForm(itemId)));
    return BELT_RATE_LIMIT;
}

/**
 * 兩邊皆能解析媒質且不一致時回傳 true（belt ↔ pipe）。
 * handle 缺省（抽象測試邊）時不檢查。
 */
function isPortMediaMismatch(
    source: FlowNode,
    target: FlowNode,
    meta: EdgeMeta,
): boolean {
    if (meta.sourceHandle == null || meta.targetHandle == null) return false;
    const srcMedia = resolvePortMedia(
        source.machineType,
        source.machineMode,
        'out',
        meta.sourceHandle,
    );
    const tgtMedia = resolvePortMedia(
        target.machineType,
        target.machineMode,
        'in',
        meta.targetHandle,
    );
    if (!srcMedia || !tgtMedia) return false;
    return srcMedia !== tgtMedia;
}

/**
 * 上游配方產出物態與線路媒質全數不符時回傳 true。
 * handle 缺省或無配方產出時略過。
 */
function isItemFormMediaMismatch(
    source: FlowNode,
    target: FlowNode,
    meta: EdgeMeta,
): boolean {
    if (meta.sourceHandle == null || meta.targetHandle == null) return false;
    const media = resolveEdgeMedia(source, target, meta);
    if (!media) return false;

    const recipe = getRecipeForNode(source.machineType, source.recipeIndex, source.machineMode);
    const itemIds: string[] = [];
    if (source.outputRates.size > 0) {
        itemIds.push(...source.outputRates.keys());
    } else if (recipe) {
        itemIds.push(...recipe.outputs.map((o) => o.itemId));
    }
    if (!itemIds.length) return false;

    // 所有可能產出皆與線路媒質不符 → 非法
    return itemIds.every((id) => formToPortMedia(getItemForm(id)) !== media);
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
 * 驗證上游品項集合是否**完全吻合**指定索引配方的 inputs（V9-E1 精確集合）。
 *
 * 引擎主路徑請用 {@link matchRecipeByInputs}；本函式供固定索引除錯／舊測試。
 *
 * @param machineType   設備類型名稱
 * @param recipeIndex   配方索引（mode 過濾後）
 * @param incomingItemIds  上游實際連入的品項名稱集合
 * @param machineMode   機器型態；缺省 modes[0]
 * @param environment   節點環境；缺省 `"none"`
 */
export function validateRecipeMatch(
    machineType: string,
    recipeIndex: number,
    incomingItemIds: Set<string>,
    machineMode?: string,
    environment: string = 'none',
): boolean {
    const recipe = getRecipeForNode(machineType, recipeIndex, machineMode);
    if (!recipe) return false;
    if ((recipe.environment ?? 'none') !== (environment || 'none')) return false;
    const need = new Set(recipe.inputs.map((input) => input.itemId));
    return itemSetsEqual(need, incomingItemIds);
}

// ─── C1：合法鏈路過濾 ─────────────────────────────────────────────────────────

/**
 * 產生埠佔用鍵；無法判定時回傳 null（略過基數檢查）。
 *
 * - 有 handle → `uid:in|out:handle`
 * - 無 handle 且該方向僅 1 個 port → `uid:in|out:__sole__`（抽象邊仍受單埠單線約束）
 * - 無 handle 且多埠 → null（舊測試抽象多線暫略過，待補 handle）
 */
function portOccupancyKey(
    node: FlowNode,
    direction: 'in' | 'out',
    handle: string | null | undefined,
): string | null {
    if (handle != null && handle !== '') {
        return `${node.deviceUid}:${direction}:${handle}`;
    }
    const machine = getMachine(node.machineType);
    if (!machine) return null;
    const mode = getMachineMode(machine, node.machineMode);
    const ports = direction === 'in' ? mode.input_ports : mode.output_ports;
    if (ports.length === 1) {
        return `${node.deviceUid}:${direction}:__sole__`;
    }
    return null;
}

/**
 * V8-C1：同一埠最多一條邊。違規時將相關節點標為非法。
 * 僅引擎側；不負責 CR-02 連線拒絕。
 */
function markPortCardinalityViolations(graph: FlowGraph): void {
    const { nodes, edgeMeta } = graph;
    /** occupancyKey → connectionUid[] */
    const occupancy = new Map<string, string[]>();

    for (const meta of edgeMeta.values()) {
        const source = nodes.get(meta.sourceDeviceUid);
        const target = nodes.get(meta.targetDeviceUid);
        if (!source || !target) continue;

        const outKey = portOccupancyKey(source, 'out', meta.sourceHandle);
        if (outKey) {
            const list = occupancy.get(outKey) ?? [];
            list.push(meta.connectionUid);
            occupancy.set(outKey, list);
        }
        const inKey = portOccupancyKey(target, 'in', meta.targetHandle);
        if (inKey) {
            const list = occupancy.get(inKey) ?? [];
            list.push(meta.connectionUid);
            occupancy.set(inKey, list);
        }
    }

    for (const connUids of occupancy.values()) {
        if (connUids.length <= 1) continue;
        for (const connUid of connUids) {
            const meta = edgeMeta.get(connUid);
            if (!meta) continue;
            const source = nodes.get(meta.sourceDeviceUid);
            const target = nodes.get(meta.targetDeviceUid);
            if (source) {
                source.isValid = false;
                graph.invalidSubgraphUids.add(source.deviceUid);
            }
            if (target) {
                target.isValid = false;
                graph.invalidSubgraphUids.add(target.deviceUid);
            }
        }
    }
}

/**
 * 從所有 sink 節點出發進行反向 BFS，標記可以到達 sink 的節點為「合法鏈路」。
 * 同時沿途進行配方品項符合性驗證（validateRecipeMatch）。
 *
 * 處理後：
 *   - 不可達 sink 的節點       node.isValid = false，加入 graph.invalidSubgraphUids
 *   - 埠基數違規（單埠多線）   node.isValid = false，加入 graph.invalidSubgraphUids
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
            if (import.meta.env.DEV) {
                console.log(`[validateChains] 找到 Sink: ${uid}, machineType=${node.machineType}`);
            }
        }
    }

    if (import.meta.env.DEV) {
        console.log(`[validateChains] 共 ${queue.length} 個 Sink，開始反向 BFS`, Array.from(queue));
    }

    //  Step 2：反向 BFS，找出所有可以到達 sink 的節點
    while (queue.length > 0) {
        const current = queue.shift()!;
        const incomingEdges = inEdges.get(current) ?? [];

        if (import.meta.env.DEV && incomingEdges.length > 0) {
            console.log(`[validateChains] 處理 ${current}, inEdges:`, incomingEdges);
        }

        for (const connUid of incomingEdges) {
            const meta = edgeMeta.get(connUid);
            if (!meta) {
                if (import.meta.env.DEV) {
                    console.log(`[validateChains] 邊 ${connUid} 無 meta，跳過`);
                }
                continue;
            }

            const upstreamUid = meta.sourceDeviceUid;
            if (reachableSinks.has(upstreamUid)) continue; // 已訪問

            const upstreamNode = nodes.get(upstreamUid);
            if (!upstreamNode || !upstreamNode.isValid) {
                if (import.meta.env.DEV) {
                    console.log(
                        `[validateChains] 上游 ${upstreamUid} isValid=${upstreamNode?.isValid}，跳過`,
                    );
                }
                continue; // 已被 CR-03 或其他原因標記為非法
            }

            if (import.meta.env.DEV) {
                console.log(`[validateChains] 加入可達節點: ${upstreamUid}`);
            }
            reachableSinks.add(upstreamUid);
            queue.push(upstreamUid);
        }
    }

    if (import.meta.env.DEV) {
        console.log('[validateChains] 可達 Sink 的節點:', Array.from(reachableSinks));
    }

    //  Step 3：未被標記的節點加入 invalidSubgraphUids
    for (const [uid, node] of nodes) {
        if (!reachableSinks.has(uid)) {
            node.isValid = false;
            graph.invalidSubgraphUids.add(uid);
        }
    }

    //  Step 3.4：單埠單線（V8-C1）
    markPortCardinalityViolations(graph);
    _propagateInvalidDownstream(graph);

    //  Step 3.5：V9-E1 依上游品項匹配配方，寫入理論 input／outputRates
    _resolveRecipesByInputs(graph);

    //  Step 3.6：埠媒質檢查（belt ↔ pipe）＋品項 form↔媒質；兩端 handle 皆有時才驗
    for (const meta of edgeMeta.values()) {
        const source = nodes.get(meta.sourceDeviceUid);
        const target = nodes.get(meta.targetDeviceUid);
        if (!source || !target) continue;
        if (!source.isValid && !target.isValid) continue;
        const mediaBad =
            isPortMediaMismatch(source, target, meta) ||
            isItemFormMediaMismatch(source, target, meta);
        if (!mediaBad) continue;

        source.isValid = false;
        target.isValid = false;
        graph.invalidSubgraphUids.add(source.deviceUid);
        graph.invalidSubgraphUids.add(target.deviceUid);
    }
    _propagateInvalidDownstream(graph);

    //  Step 4：有配方機器若無法匹配輸入 → 非法（不齊／種類不符）
    for (const [uid, node] of nodes) {
        if (!node.isValid) continue;
        if (node.isSource || node.isSink) continue;
        if (!machineHasRecipes(node.machineType, node.machineMode)) continue;

        const matched = matchRecipeByEdgeCandidates(
            node.machineType,
            _collectEdgeCandidateItemIds(graph, uid),
            node.machineMode,
            node.environment ?? 'none',
        );
        if (!matched) {
            node.isValid = false;
            graph.invalidSubgraphUids.add(uid);
            node.inputRates = new Map();
            node.outputRates = new Map();
            node.efficiency = 0;
        }
    }

    //  Step 5：配方不符節點的下游也應連帶標記為非法
    _propagateInvalidDownstream(graph);
}

/**
 * 自單一上游節點列出此邊可能承載的品項（多輸出時含副產候選）。
 * 若上游標了 primaryOutput 且在產出中，僅回傳主產（一條邊一種物流）。
 */
function _upstreamEdgeCandidates(upstream: FlowNode): string[] {
    const fromRates = [...upstream.outputRates.keys()];
    let candidates: string[];
    if (fromRates.length > 0) {
        candidates = fromRates;
    } else if (!upstream.isSource) {
        const upstreamRecipe = getRecipeForNode(
            upstream.machineType,
            upstream.recipeIndex,
            upstream.machineMode,
        );
        candidates = upstreamRecipe ? upstreamRecipe.outputs.map((o) => o.itemId) : [];
    } else {
        candidates = [];
    }

    const primary = upstream.primaryOutput;
    if (primary && candidates.includes(primary)) return [primary];
    return candidates;
}

/**
 * 各入邊的候選品項列表（供 {@link matchRecipeByEdgeCandidates}）。
 */
function _collectEdgeCandidateItemIds(graph: FlowGraph, uid: string): string[][] {
    const { nodes, inEdges, edgeMeta } = graph;
    const node = nodes.get(uid);
    if (!node) return [];

    const perEdge: string[][] = [];
    for (const connUid of inEdges.get(uid) ?? []) {
        const meta = edgeMeta.get(connUid);
        if (!meta) continue;
        const upstreamNode = nodes.get(meta.sourceDeviceUid);
        if (!upstreamNode || !upstreamNode.isValid) continue;
        if (isPortMediaMismatch(upstreamNode, node, meta)) continue;
        if (isItemFormMediaMismatch(upstreamNode, node, meta)) continue;

        const candidates = _upstreamEdgeCandidates(upstreamNode);
        if (candidates.length > 0) perEdge.push(candidates);
    }
    return perEdge;
}

/**
 * V9-E1：由 source 往下游多遍匹配配方，寫入 recipeIndex 與理論速率。
 */
function _resolveRecipesByInputs(graph: FlowGraph): void {
    const { nodes } = graph;
    const maxPasses = Math.max(nodes.size, 1) + 2;

    for (let pass = 0; pass < maxPasses; pass++) {
        let changed = false;
        for (const [uid, node] of nodes) {
            if (!node.isValid || node.isSource || node.isSink) continue;
            if (!machineHasRecipes(node.machineType, node.machineMode)) continue;

            const matched = matchRecipeByEdgeCandidates(
                node.machineType,
                _collectEdgeCandidateItemIds(graph, uid),
                node.machineMode,
                node.environment ?? 'none',
            );
            if (!matched) continue;

            if (
                node.recipeIndex !== matched.index ||
                node.outputRates.size === 0 ||
                node.inputRates.size === 0
            ) {
                node.recipeIndex = matched.index;
                const rates = calcDeviceRate(matched.recipe);
                node.inputRates = rates.inputRates;
                node.outputRates = rates.outputRates;
                changed = true;
            }
        }
        if (!changed) break;
    }
}

/**
 * 正向 BFS：將已標記為非法的節點，其所有下游節點也標記為非法。
 * 這確保配方不符節點不會「污染」下游計算。
 * @param graph FlowEngine 有向圖，會直接修改其 invalidSubgraphUids
 * @example
 * _propagateInvalidDownstream(graph)
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
        const machineMode = resolveMachineMode(machineType, node.data?.machineMode);
        const environment = node.data?.environment ?? 'none';
        const isSource = machineDef?.is_source ?? false;
        const isSink = machineDef?.is_sink ?? false;

        const inputRates = new Map<string, number>();
        let outputRates = new Map<string, number>();

        const primaryOutput = node.data?.primaryOutput;
        if (isSource && primaryOutput) {
            /** 基礎材料／物品輸出：不依賴 products 假配方 */
            const rate =
                node.data?.sourceRatePerMin ??
                (recipeIndex === 1 ? 15 : 30);
            outputRates = new Map([[primaryOutput, rate]]);
        }
        // V9-E1：一般機器速率改由 validateChains／propagateFlows 依輸入匹配後填入

        const flowNode: FlowNode = {
            deviceUid: node.id,
            machineType,
            machineMode,
            environment,
            recipeIndex,
            isSource,
            isSink,
            isValid: true,
            efficiency: 1,
            outputRates,
            inputRates,
            primaryOutput,
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
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
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
            // Source：直接以理論速率輸出（依邊媒質套用 30／60）
            for (const connUid of outEdgeUids) {
                const meta = edgeMeta.get(connUid);
                if (!meta) continue;
                const target = nodes.get(meta.targetDeviceUid);
                for (const [itemId, recipeRate] of node.outputRates) {
                    const limit = target
                        ? edgeRateLimit(node, target, meta, itemId)
                        : rateLimitForMedia(
                              itemId ? formToPortMedia(getItemForm(itemId)) : null,
                          );
                    const rate = Math.min(recipeRate, limit);
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
            // 檢查是否為分流／匯流（無配方物流節點）
            const machineDef = getMachine(node.machineType);
            const isSplitter =
                machineDef && (machineDef.name === '分流器' || machineDef.name === '管道分流器');
            const isMerger =
                machineDef && (machineDef.name === '匯流器' || machineDef.name === '管道匯流器');

            if (isSplitter) {
                // 分流器邏輯：輸入流量均分至所有輸出邊
                const received = nodeInputReceived.get(uid) ?? new Map();
                let totalInput = 0;
                let inputItemId: string | undefined;

                for (const [itemId, rate] of received) {
                    totalInput += rate;
                    inputItemId = itemId;
                }

                if (totalInput > 0 && inputItemId) {
                    node.inputRates.set(inputItemId, totalInput);
                    node.efficiency = 1;

                    const outputCount = outEdgeUids.length;
                    const ratePerOutput = outputCount > 0 ? totalInput / outputCount : 0;

                    for (const connUid of outEdgeUids) {
                        const meta = edgeMeta.get(connUid);
                        if (!meta) continue;
                        const target = nodes.get(meta.targetDeviceUid);
                        const limit = target
                            ? edgeRateLimit(node, target, meta, inputItemId)
                            : rateLimitForMedia(
                                  formToPortMedia(getItemForm(inputItemId)),
                              );

                        const rate = Math.min(ratePerOutput, limit);
                        edgeFlows.set(connUid, {
                            connectionUid: connUid,
                            itemId: inputItemId,
                            rate,
                            isCongested: false,
                        });

                        const downstream = nodeInputReceived.get(meta.targetDeviceUid);
                        if (downstream)
                            downstream.set(inputItemId, (downstream.get(inputItemId) ?? 0) + rate);
                    }
                } else {
                    node.efficiency = 0;
                }
                continue;
            }

            if (isMerger) {
                // 匯流器：Σ 輸入 → 單出邊（套用 belt／pipe 上限）
                // inputRates 記「可接受吞吐量」= 實際出口速率，供堵塞按比例回推上游
                const received = nodeInputReceived.get(uid) ?? new Map();
                let totalInput = 0;
                let inputItemId: string | undefined;

                for (const [itemId, rate] of received) {
                    totalInput += rate;
                    inputItemId = itemId;
                }

                if (totalInput > 0 && inputItemId && outEdgeUids.length > 0) {
                    const meta = edgeMeta.get(outEdgeUids[0]!);
                    const target = meta ? nodes.get(meta.targetDeviceUid) : undefined;
                    const limit = meta && target
                        ? edgeRateLimit(node, target, meta, inputItemId)
                        : rateLimitForMedia(formToPortMedia(getItemForm(inputItemId)));
                    const outRate = Math.min(totalInput, limit);

                    node.inputRates.set(inputItemId, outRate);
                    node.outputRates.set(inputItemId, outRate);
                    node.efficiency = 1;

                    if (meta) {
                        edgeFlows.set(outEdgeUids[0]!, {
                            connectionUid: outEdgeUids[0]!,
                            itemId: inputItemId,
                            rate: outRate,
                            isCongested: false,
                        });
                        const downstream = nodeInputReceived.get(meta.targetDeviceUid);
                        if (downstream)
                            downstream.set(inputItemId, (downstream.get(inputItemId) ?? 0) + outRate);
                    }
                } else {
                    node.efficiency = 0;
                }
                continue;
            }

            // 一般設備（D5 calcDeviceOutput）— V9-E1 依實際正流量品項匹配配方
            const received = nodeInputReceived.get(uid) ?? new Map();
            const incomingPositive = new Set<string>();
            for (const [itemId, rate] of received) {
                if (rate > 0) incomingPositive.add(itemId);
            }

            let recipe: RecipeDef | undefined;
            if (machineHasRecipes(node.machineType, node.machineMode)) {
                const matched = matchRecipeByInputs(
                    node.machineType,
                    incomingPositive,
                    node.machineMode,
                    node.environment ?? 'none',
                );
                if (!matched) {
                    // 輸入不齊／不符 → 無產出（節點可仍為合法鏈，效率 0）
                    node.efficiency = 0;
                    node.inputRates = new Map();
                    node.outputRates = new Map();
                    continue;
                }
                node.recipeIndex = matched.index;
                recipe = matched.recipe;
            } else {
                recipe = getRecipeForNode(node.machineType, node.recipeIndex, node.machineMode);
                if (!recipe) {
                    node.isValid = false;
                    graph.invalidSubgraphUids.add(uid);
                    continue;
                }
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

            node.inputRates = new Map();
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
                    : getRecipeForNode(
                          downstreamNode.machineType,
                          downstreamNode.recipeIndex,
                          downstreamNode.machineMode,
                      );

                let chosenItemId: string | undefined;
                let chosenRate = 0;

                // V9-H1-2：優先主產出（演示鏈／多輸出時避免副產佔邊）
                if (
                    node.primaryOutput &&
                    (outputAvailable.get(node.primaryOutput) ?? 0) > 0
                ) {
                    chosenItemId = node.primaryOutput;
                    chosenRate = Math.min(
                        outputAvailable.get(node.primaryOutput)!,
                        edgeRateLimit(node, downstreamNode, meta, node.primaryOutput),
                    );
                }

                if (!chosenItemId && downstreamRecipe) {
                    for (const input of downstreamRecipe.inputs) {
                        const available = outputAvailable.get(input.itemId) ?? 0;
                        if (available > 0) {
                            chosenItemId = input.itemId;
                            chosenRate = Math.min(
                                available,
                                edgeRateLimit(node, downstreamNode, meta, input.itemId),
                            );
                            break;
                        }
                    }
                }
                if (!chosenItemId) {
                    for (const [itemId, rate] of outputAvailable) {
                        if (rate > 0) {
                            chosenItemId = itemId;
                            chosenRate = Math.min(
                                rate,
                                edgeRateLimit(node, downstreamNode, meta, itemId),
                            );
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
 * 計算某條入邊對目標節點該品項的「需求份額」。
 *
 * 同品項多入邊按供給比例分攤 `inputRates`（可接受吞吐量）：
 * 例如粉碎機需求源礦 30、兩入邊各供 30 → 各邊份額 15（供過於求堵塞）。
 * 單入邊時份額＝整份 demand（行為不變）。
 *
 * @param rateSnapshot 本遍開始時的邊速率（避免同遍互相干擾）
 */
function edgeDemandForCongestion(
    graph: FlowGraph,
    edgeFlows: Map<string, EdgeFlow>,
    targetUid: string,
    flow: EdgeFlow,
    demand: number,
    rateSnapshot?: ReadonlyMap<string, number>,
): number {
    if (!graph.nodes.get(targetUid)) return demand;

    let totalSupply = 0;
    for (const connUid of graph.inEdges.get(targetUid) ?? []) {
        const snap = rateSnapshot?.get(connUid);
        if (snap != null) {
            const f = edgeFlows.get(connUid);
            if (f && f.itemId === flow.itemId) totalSupply += snap;
            continue;
        }
        const f = edgeFlows.get(connUid);
        if (f && f.itemId === flow.itemId) totalSupply += f.rate;
    }
    if (totalSupply <= 1e-9) return demand;
    const flowRate = rateSnapshot?.get(flow.connectionUid) ?? flow.rate;
    return demand * (flowRate / totalSupply);
}

/**
 * D7 — 偵測堵塞並向上游反向更新效率。
 *
 * 若某條邊的 supply > 該邊需求份額：  \
 *   - isCongested = true，rate 截斷至份額  \
 *   - 上游節點效率與 outputRates 按比例縮減  \
 *   - 上游的 inputRates 同步縮減，影響更上游的剩餘資源計算
 *
 * 同品多入邊（匯流器或一般加工機）按供給比例分攤需求
 * （例：需求 30、兩入各 30 → 各邊約 15）。
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
        /** 本遍開始時的速率快照，避免同遍內比例分攤互相干擾 */
        const rateSnapshot = new Map<string, number>();
        for (const [id, f] of edgeFlows) rateSnapshot.set(id, f.rate);

        for (const [connUid, flow] of edgeFlows) {
            const meta = edgeMeta.get(connUid);
            if (!meta) continue;

            const targetNode = nodes.get(meta.targetDeviceUid);
            if (!targetNode || !targetNode.isValid) continue;

            const demand = targetNode.inputRates.get(flow.itemId) ?? 0;
            const edgeDemand = edgeDemandForCongestion(
                graph,
                edgeFlows,
                meta.targetDeviceUid,
                flow,
                demand,
                rateSnapshot,
            );
            const supplyRate = rateSnapshot.get(connUid) ?? flow.rate;
            if (supplyRate <= edgeDemand + 1e-6) continue;

            // 標記堵塞，截斷至該邊份額
            edgeFlows.set(connUid, { ...flow, isCongested: true, rate: edgeDemand });
            changed = true;

            const sourceNode = nodes.get(meta.sourceDeviceUid);
            if (!sourceNode || !sourceNode.isValid) continue;

            const congestionRatio = supplyRate > 0 ? edgeDemand / supplyRate : 0;

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
                const upDemandTotal = sourceNode.inputRates.get(upFlow.itemId) ?? 0;
                const upEdgeDemand = edgeDemandForCongestion(
                    graph,
                    edgeFlows,
                    sourceNode.deviceUid,
                    upFlow,
                    upDemandTotal,
                    rateSnapshot,
                );
                const upSupply = rateSnapshot.get(upConnUid) ?? upFlow.rate;
                if (upSupply > upEdgeDemand + 1e-6) {
                    edgeFlows.set(upConnUid, {
                        ...upFlow,
                        isCongested: true,
                        rate: upEdgeDemand,
                    });
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
