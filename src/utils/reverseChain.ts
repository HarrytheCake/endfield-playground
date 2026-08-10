/**
 * V9-D1：從產品反向推演至基礎材料的最短無循環生產樹。
 *
 * - 葉節點：僅出現在 materials、未出現在 products 的品項
 * - 產品（含同時列於 materials 者，如息壤氣）繼續回推
 * - 成本＝樹上配方節點數；同成本取較高 ratePerMin，再取資料順序先者
 */

import { getMaterial } from '@/data/materials';
import { getProduct } from '@/data/products';
import type { RecipeDef } from '@/types/flow';

/** 產出此物所選配方的精簡引用 */
export interface RecipeRef {
    id: string;
    machine: string;
    machineMode?: string;
    environment?: string;
    timeSeconds: number;
    inputs: { itemId: string; quantity: number }[];
    outputs: { itemId: string; quantity: number }[];
}

export interface ChainNode {
    itemId: string;
    kind: 'material' | 'product';
    /** 產出此物所選配方（僅 product） */
    recipe?: RecipeRef;
    /** 該產出列效率（個／分） */
    ratePerMin?: number;
    inputs?: ChainNode[];
}

interface SearchResult {
    node: ChainNode;
    /** 配方步數 */
    cost: number;
    /** 根產出效率（用於同成本決勝） */
    ratePerMin: number;
    /** 樹上出現過的產品（不含材料葉） */
    productsUsed: Set<string>;
}

/**
 * 配方某產出列效率：quantity × 60 / timeSeconds
 */
export function recipeOutputRatePerMin(recipe: RecipeDef, outputItemId: string): number {
    const out = recipe.outputs.find((o) => o.itemId === outputItemId);
    if (!out || recipe.timeSeconds <= 0) return 0;
    return (out.quantity * 60) / recipe.timeSeconds;
}

/**
 * 反向鏈葉節點：基礎材料且非產品（products 優先於 materials）。
 */
export function isReverseChainLeaf(itemId: string): boolean {
    return getMaterial(itemId) != null && getProduct(itemId) == null;
}

function toRecipeRef(recipe: RecipeDef): RecipeRef {
    return {
        id: recipe.id,
        machine: recipe.machine,
        machineMode: recipe.machineMode,
        environment: recipe.environment,
        timeSeconds: recipe.timeSeconds,
        inputs: recipe.inputs.map((i) => ({ itemId: i.itemId, quantity: i.quantity })),
        outputs: recipe.outputs.map((o) => ({ itemId: o.itemId, quantity: o.quantity })),
    };
}

function isBetter(a: SearchResult, b: SearchResult): boolean {
    if (a.cost !== b.cost) return a.cost < b.cost;
    if (a.ratePerMin !== b.ratePerMin) return a.ratePerMin > b.ratePerMin;
    return false; // 同成本同效率：保留先出現者（b）
}

/**
 * 統計樹上配方步數（product 節點數）。
 */
export function countRecipeSteps(node: ChainNode): number {
    if (node.kind === 'material') return 0;
    let n = 1;
    for (const child of node.inputs ?? []) {
        n += countRecipeSteps(child);
    }
    return n;
}

/**
 * 收集葉材料名稱（去重、深度優先）。
 */
export function collectLeafMaterials(node: ChainNode): string[] {
    if (node.kind === 'material') return [node.itemId];
    const out: string[] = [];
    for (const child of node.inputs ?? []) {
        out.push(...collectLeafMaterials(child));
    }
    return out;
}

/**
 * 尋找目標產品的最短反向生產樹；非產品或不存在時回傳 null。
 */
export function findShortestReverseChain(productName: string): ChainNode | null {
    if (!getProduct(productName)) return null;

    /** 成功結果快取；命中時需與 stack 無交集方可重用 */
    const memo = new Map<string, SearchResult>();

    function search(itemId: string, stack: Set<string>): SearchResult | null {
        if (isReverseChainLeaf(itemId)) {
            return {
                node: { itemId, kind: 'material' },
                cost: 0,
                ratePerMin: 0,
                productsUsed: new Set(),
            };
        }

        const product = getProduct(itemId);
        if (!product) return null;
        if (stack.has(itemId)) return null;

        const cached = memo.get(itemId);
        if (cached) {
            let conflict = false;
            for (const p of cached.productsUsed) {
                if (stack.has(p)) {
                    conflict = true;
                    break;
                }
            }
            if (!conflict) return cached;
        }

        stack.add(itemId);
        let best: SearchResult | null = null;

        for (const recipe of product.recipes) {
            const childNodes: ChainNode[] = [];
            const productsUsed = new Set<string>([itemId]);
            let cost = 1;
            let ok = true;

            for (const input of recipe.inputs) {
                const child = search(input.itemId, stack);
                if (!child) {
                    ok = false;
                    break;
                }
                childNodes.push(child.node);
                cost += child.cost;
                for (const p of child.productsUsed) productsUsed.add(p);
            }
            if (!ok) continue;

            const ratePerMin = recipeOutputRatePerMin(recipe, itemId);
            const candidate: SearchResult = {
                node: {
                    itemId,
                    kind: 'product',
                    recipe: toRecipeRef(recipe),
                    ratePerMin,
                    inputs: childNodes,
                },
                cost,
                ratePerMin,
                productsUsed,
            };

            if (!best || isBetter(candidate, best)) {
                best = candidate;
            }
        }

        stack.delete(itemId);

        if (best) {
            const existing = memo.get(itemId);
            if (!existing || isBetter(best, existing)) {
                memo.set(itemId, best);
            }
        }

        return best;
    }

    return search(productName, new Set())?.node ?? null;
}
