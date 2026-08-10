/**
 * V9-D1 reverseChain 單元測試
 */
import { describe, it, expect } from 'vitest';
import {
    recipeOutputRatePerMin,
    findShortestReverseChain,
    countRecipeSteps,
    collectLeafMaterials,
    isReverseChainLeaf,
} from '@/utils/reverseChain';
import { getRecipe, getProduct } from '@/data/products';

describe('recipeOutputRatePerMin', () => {
    it('timeSeconds=2 quantity=1 → 30／分', () => {
        const r = getRecipe('源石粉末', 0)!;
        expect(recipeOutputRatePerMin(r, '源石粉末')).toBe(30);
    });

    it('timeSeconds=10 quantity=2 → 12／分', () => {
        expect(
            recipeOutputRatePerMin(
                {
                    id: 't',
                    inputs: [],
                    outputs: [{ itemId: 'x', quantity: 2 }],
                    machine: '測試',
                    timeSeconds: 10,
                },
                'x',
            ),
        ).toBe(12);
    });
});

describe('isReverseChainLeaf', () => {
    it('芽針／清水為葉；息壤氣同時在 products 故非葉', () => {
        expect(isReverseChainLeaf('芽針')).toBe(true);
        expect(isReverseChainLeaf('清水')).toBe(true);
        expect(isReverseChainLeaf('息壤氣')).toBe(false);
        expect(isReverseChainLeaf('息壤')).toBe(false);
    });
});

describe('findShortestReverseChain', () => {
    it('非產品回傳 null', () => {
        expect(findShortestReverseChain('芽針')).toBeNull();
        expect(findShortestReverseChain('不存在')).toBeNull();
    });

    it('息壤選短鏈：碳塊＋清水，且碳塊來自芽針（較高產出效率）', () => {
        const chain = findShortestReverseChain('息壤');
        expect(chain).not.toBeNull();
        expect(chain!.itemId).toBe('息壤');
        expect(chain!.recipe?.machine).toBe('天有洪爐');
        expect(chain!.recipe?.environment).toBe('stable');
        expect(chain!.inputs?.map((i) => i.itemId).sort()).toEqual(['清水', '碳塊'].sort());
        expect(countRecipeSteps(chain!)).toBe(2);

        const carbon = chain!.inputs!.find((i) => i.itemId === '碳塊')!;
        expect(carbon.kind).toBe('product');
        expect(carbon.inputs?.[0]?.itemId).toBe('芽針');
        expect(carbon.inputs?.[0]?.kind).toBe('material');
        expect(carbon.ratePerMin).toBe(60); // 2×60/2

        const leaves = collectLeafMaterials(chain!);
        expect(leaves.sort()).toEqual(['芽針', '清水'].sort());
        expect(leaves.every((n) => isReverseChainLeaf(n))).toBe(true);
    });

    it('息壤不走緻密碳／穩定碳塊長鏈', () => {
        const chain = findShortestReverseChain('息壤')!;
        const flat = JSON.stringify(chain);
        expect(flat).not.toContain('穩定碳塊');
        expect(flat).not.toContain('緻密碳粉末');
    });

    it('息壤不因息壤氣捷徑形成循環／誤選', () => {
        const chain = findShortestReverseChain('息壤')!;
        expect(chain.recipe?.machine).not.toBe('固氣轉化機');
        const flat = JSON.stringify(chain);
        expect(flat).not.toContain('息壤氣');
    });

    it('瓶裝↔拆解不循環：錦草溶液走粉末＋清水', () => {
        const chain = findShortestReverseChain('錦草溶液');
        expect(chain).not.toBeNull();
        const flat = JSON.stringify(chain);
        expect(flat).not.toContain('藍鐵瓶-錦草溶液');
        expect(flat).not.toContain('赤銅瓶-錦草溶液');
        expect(chain!.recipe?.machine).toBe('反應池');
        expect(collectLeafMaterials(chain!).includes('清水')).toBe(true);
    });

    it('藍鐵瓶-錦草溶液可回推且葉為材料', () => {
        const chain = findShortestReverseChain('藍鐵瓶-錦草溶液');
        expect(chain).not.toBeNull();
        expect(countRecipeSteps(chain!)).toBeGreaterThan(0);
        const leaves = collectLeafMaterials(chain!);
        expect(leaves.length).toBeGreaterThan(0);
        expect(leaves.every((n) => isReverseChainLeaf(n))).toBe(true);
        // 不應在樹上同時用拆解互推造成無限；步數應有限
        expect(countRecipeSteps(chain!)).toBeLessThan(20);
    });

    it('源石粉末：粉碎機＋源礦葉', () => {
        const chain = findShortestReverseChain('源石粉末');
        expect(chain).not.toBeNull();
        expect(chain!.recipe?.machine).toBe('粉碎機');
        expect(collectLeafMaterials(chain!)).toEqual(['源礦']);
        expect(chain!.ratePerMin).toBe(30);
    });

    it('所有產品 recipes 存在時鏈路葉皆為材料（抽樣）', () => {
        for (const name of ['碳塊', '息壤', '錦草溶液', '芽針粉末']) {
            const p = getProduct(name);
            expect(p).toBeDefined();
            const chain = findShortestReverseChain(name);
            expect(chain, name).not.toBeNull();
            for (const leaf of collectLeafMaterials(chain!)) {
                expect(isReverseChainLeaf(leaf), `${name} leaf ${leaf}`).toBe(true);
            }
        }
    });
});
