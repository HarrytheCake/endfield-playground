/**
 * data/devices 查詢函式單元測試
 *
 * 測試對象：src/data/devices.ts
 * 重點：5 個查詢函式（getRecipesForMachine / getRecipesByProduct / getRecipe /
 *       getAllProducts / getAllRecipes）的查詢正確性與邊界。
 *
 * 備註：productList 內容可能會擴充，測試以代表性配方驗證契約，避免硬編值。
 */

import { describe, it, expect } from 'vitest';
import {
    getRecipesForMachine,
    getRecipesByProduct,
    getRecipe,
    getAllProducts,
    getAllRecipes,
} from '@/data/products';

// ─── getRecipesForMachine() ──────────────────────────────────────────────────

describe('getRecipesForMachine()', () => {
    it('粉碎機應該有至少一個配方', () => {
        const recipes = getRecipesForMachine('粉碎機');
        expect(recipes.length).toBeGreaterThan(0);
        for (const r of recipes) expect(r.machine).toBe('粉碎機');
    });

    it('不存在的機器名稱回傳空陣列', () => {
        expect(getRecipesForMachine('不存在的機器')).toEqual([]);
    });
});

// ─── getRecipesByProduct() ───────────────────────────────────────────────────

describe('getRecipesByProduct()', () => {
    it('已知產品（源礦）回傳至少一個配方', () => {
        const recipes = getRecipesByProduct('源礦');
        expect(recipes.length).toBeGreaterThan(0);
        // 源礦由物品輸出口提供
        expect(recipes[0].machine).toBe('物品輸出口');
    });

    it('不存在的產品回傳空陣列', () => {
        expect(getRecipesByProduct('不存在的產品')).toEqual([]);
    });
});

// ─── getRecipe() ─────────────────────────────────────────────────────────────

describe('getRecipe()', () => {
    it('回傳指定 index 的配方', () => {
        const recipe = getRecipe('源礦', 0);
        expect(recipe).toBeDefined();
        expect(recipe!.outputs[0].itemId).toBe('源礦');
    });

    it('index 預設為 0', () => {
        const recipe = getRecipe('源礦');
        expect(recipe).toBeDefined();
    });

    it('index 超出範圍回傳 undefined', () => {
        expect(getRecipe('源礦', 999)).toBeUndefined();
    });

    it('不存在的產品回傳 undefined', () => {
        expect(getRecipe('不存在的產品', 0)).toBeUndefined();
    });
});

// ─── getAllProducts() / getAllRecipes() ──────────────────────────────────────

describe('getAllProducts() / getAllRecipes()', () => {
    it('getAllProducts 回傳非空陣列且每項有 recipes', () => {
        const products = getAllProducts();
        expect(products.length).toBeGreaterThan(0);
        for (const p of products) {
            expect(Array.isArray(p.recipes)).toBe(true);
        }
    });

    it('getAllRecipes 為所有 product.recipes 的攤平結果', () => {
        const products = getAllProducts();
        const expectedCount = products.reduce((n, p) => n + p.recipes.length, 0);
        expect(getAllRecipes().length).toBe(expectedCount);
    });
});
