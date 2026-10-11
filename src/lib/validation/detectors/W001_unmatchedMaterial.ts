import type { Alert, Detector, ValidationContext } from '@/types/validation';
import { getMachine } from '@/data/machines';
import { getRecipesForMachine } from '@/data/products';
import { getMachineMode } from '@/types/machine';

/**
 * 兩字串集合是否完全相同（Exact Set Match）
 *
 * 用於配方輸入集合比對：多餘或缺少任何材料皆視為不吻合。
 */
function itemSetsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const id of a) {
        if (!b.has(id)) return false;
    }
    return true;
}

/**
 * 沿入邊向上追蹤輸送的品項集合
 *
 * @param sourceId 上游設備 ID
 * @param ctx 驗證上下文
 * @param visited 走訪路徑保護集合（防止圖形回路無限遞迴）
 */
function traceEdgeItems(
    sourceId: string,
    ctx: ValidationContext,
    visited: Set<string>,
): Set<string> {
    const items = new Set<string>();
    if (visited.has(sourceId)) {
        return items;
    }

    const sourceNode = ctx.devices.find((d) => d.id === sourceId);
    if (!sourceNode) return items;

    const nextVisited = new Set(visited);
    nextVisited.add(sourceId);

    const machineType = sourceNode.data?.machineType ?? sourceNode.data?.label ?? sourceNode.id;
    const machineDef = ctx.getDef
        ? (ctx.getDef(machineType) ?? getMachine(machineType))
        : getMachine(machineType);

    // 判斷是否為分流器類設備 (無配方，只是導流)
    // 依工單 W1004-Z1 §2.1 指示：目前 Machine 定義無專屬 flag，暫時沿用名稱比對（加註說明）
    const isSplitter =
        (machineDef && (machineDef.name === '分流器' || machineDef.name === '管道分流器')) ||
        (machineDef && (machineDef.id === 'splitter' || machineDef.id === 'pipe_splitter'));

    if (isSplitter) {
        const inEdges = ctx.connections.filter((c) => c.target === sourceId);
        for (const inEdge of inEdges) {
            const upstreamItems = traceEdgeItems(inEdge.source, ctx, nextVisited);
            upstreamItems.forEach((i) => items.add(i));
        }
    } else {
        // 若為源節點（如物品輸出口、基礎材料輸出點），品項由 primaryOutput 提供
        if (sourceNode.data?.primaryOutput) {
            items.add(sourceNode.data.primaryOutput);
        }

        const mode = machineDef
            ? getMachineMode(machineDef, sourceNode.data?.machineMode)
            : undefined;
        let recipes = getRecipesForMachine(machineType, mode?.id);
        if (recipes.length === 0) {
            recipes = getRecipesForMachine(machineType);
        }
        // 取得這台設備目前正在使用的配方編號，如果未指定，預設使用第一個配方
        const recipeIndex = sourceNode.data?.recipeIndex ?? 0;
        const recipe = recipes[recipeIndex];
        if (recipe) {
            recipe.outputs.forEach((o) => items.add(o.itemId));
        }
    }

    return items;
}

/**
 * 收集流入指定設備的所有品項集合
 *
 * 各入邊獨立追蹤，避免跨入邊共用 visited 導致多路同源輸入被略過；
 * 同時以當前設備為初始 visited，防止反向回路進入無窮遞迴。
 */
function getIncomingItems(targetId: string, ctx: ValidationContext): Set<string> {
    const items = new Set<string>();
    const inEdges = ctx.connections.filter((c) => c.target === targetId);

    for (const edge of inEdges) {
        const edgeItems = traceEdgeItems(edge.source, ctx, new Set([targetId]));
        edgeItems.forEach((i) => items.add(i));
    }

    return items;
}

export const W001_unmatchedMaterial: Detector = {
    code: 'W001',
    level: 'warning',
    run(ctx: ValidationContext): Alert[] {
        const alerts: Alert[] = [];

        for (const device of ctx.devices) {
            const machineType = device.data?.machineType ?? device.data?.label ?? device.id;
            const machineDef = ctx.getDef
                ? (ctx.getDef(machineType) ?? getMachine(machineType))
                : getMachine(machineType);

            // 如果沒有設備定義，或是資源產出端 (沒有輸入口)，跳過
            if (
                !machineDef ||
                machineDef.is_source ||
                getMachineMode(machineDef, device.data?.machineMode).input_ports.length === 0
            ) {
                continue;
            }

            const mode = getMachineMode(machineDef, device.data?.machineMode);
            let allRecipes = getRecipesForMachine(machineType, mode?.id);
            if (allRecipes.length === 0) {
                allRecipes = getRecipesForMachine(machineType);
            }

            // 如果這台機器本身沒有任何配方可選 (例如分流器)，跳過
            if (allRecipes.length === 0) {
                continue;
            }

            const inEdges = ctx.connections.filter((c) => c.target === device.id);
            // 若沒有任何入邊，應由 E004 負責，此處不報錯以避免重複提示
            if (inEdges.length === 0) {
                continue;
            }

            const incomingItemIds = getIncomingItems(device.id, ctx);

            // 檢查是否符合任一配方（依 D3 §4.3 與 V9 語意：輸入種類集合完全吻合 Exact Set Match）
            let matchedAny = false;
            for (const recipe of allRecipes) {
                const recipeInputs = new Set(recipe.inputs.map((input) => input.itemId));
                if (itemSetsEqual(recipeInputs, incomingItemIds)) {
                    matchedAny = true;
                    break;
                }
            }

            if (!matchedAny) {
                alerts.push({
                    uid: crypto.randomUUID(),
                    code: 'W001',
                    level: 'warning',
                    message: `材料組合無法處理：${machineDef.name} 輸入品項不符任一配方`,
                    relatedDeviceUids: [device.id],
                    relatedConnectionUids: [],
                });
            }
        }

        return alerts;
    },
};
