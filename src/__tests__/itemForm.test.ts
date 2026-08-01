/**
 * V8：品項 form（solid｜liquid｜gas）與媒質／上限
 */
import { describe, expect, it } from 'vitest';
import {
    BELT_RATE_LIMIT,
    PIPE_RATE_LIMIT,
    formToPortMedia,
    rateLimitForMedia,
} from '@/types/flow';
import { getItemForm, getItemPortMedia, getProduct } from '@/data/products';
import { getMaterial, getAllMaterials } from '@/data/materials';

describe('ItemForm / materials＋products', () => {
    it('materials 皆有 form，且 solid→belt／liquid|gas→pipe', () => {
        const mats = getAllMaterials();
        expect(mats.length).toBe(14);
        expect(getMaterial('源礦')?.form).toBe('solid');
        expect(getMaterial('清水')?.form).toBe('liquid');
        expect(getMaterial('息壤氣')?.form).toBe('gas');
        expect(formToPortMedia('solid')).toBe('belt');
        expect(formToPortMedia('liquid')).toBe('pipe');
        expect(formToPortMedia('gas')).toBe('pipe');
    });

    it('products 帶 form；getItemForm 可查材料與產品', () => {
        expect(getProduct('錦草溶液')?.form).toBe('liquid');
        expect(getProduct('源石粉末')?.form).toBe('solid');
        expect(getItemForm('息壤氣')).toBe('gas');
        expect(getItemForm('清水')).toBe('liquid');
        expect(getItemPortMedia('息壤氣')).toBe('pipe');
        expect(getItemPortMedia('源礦')).toBe('belt');
    });

    it('速率上限：belt 30／pipe 60', () => {
        expect(BELT_RATE_LIMIT).toBe(30);
        expect(PIPE_RATE_LIMIT).toBe(60);
        expect(rateLimitForMedia('belt')).toBe(30);
        expect(rateLimitForMedia('pipe')).toBe(60);
        expect(rateLimitForMedia(null)).toBe(30);
    });
});
