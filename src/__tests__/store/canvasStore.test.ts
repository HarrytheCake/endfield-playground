/**
 * CR-01 useCanvasStore 單元測試
 *
 * 測試對象：src/store/canvasStore.ts
 * 重點：純畫布視圖狀態（縮放、平移、基地、格線），不進歷史。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCanvasStore } from '@/store/canvasStore';

// ─── 初始狀態 ─────────────────────────────────────────────────────────────────

describe('useCanvasStore — 初始狀態', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('gridSize 預設為 40 像素', () => {
        const store = useCanvasStore();
        expect(store.gridSize).toBe(40);
    });

    it('offset 預設為 (0, 0)', () => {
        const store = useCanvasStore();
        expect(store.offset).toEqual({ x: 0, y: 0 });
    });

    it('zoom 預設為 1', () => {
        const store = useCanvasStore();
        expect(store.zoom).toBe(1);
    });

    it('baseRegion 預設為 null（自由畫布）', () => {
        const store = useCanvasStore();
        expect(store.baseRegion).toBeNull();
    });

    it('showGrid 預設為 true', () => {
        const store = useCanvasStore();
        expect(store.showGrid).toBe(true);
    });

    it('canvasSize 在 baseRegion 為 null 時為 null', () => {
        const store = useCanvasStore();
        expect(store.canvasSize).toBeNull();
    });
});

// ─── setZoom() ────────────────────────────────────────────────────────────────

describe('setZoom()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('正常範圍內的值直接套用', () => {
        const store = useCanvasStore();
        store.setZoom(1.5);
        expect(store.zoom).toBe(1.5);
    });

    it('下限 clamp：小於 0.1 的值被截斷至 0.1', () => {
        const store = useCanvasStore();
        store.setZoom(0.05);
        expect(store.zoom).toBe(0.1);
    });

    it('上限 clamp：大於 4 的值被截斷至 4', () => {
        const store = useCanvasStore();
        store.setZoom(10);
        expect(store.zoom).toBe(4);
    });
});

// ─── setOffset() ──────────────────────────────────────────────────────────────

describe('setOffset()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('更新平移偏移', () => {
        const store = useCanvasStore();
        store.setOffset({ x: 100, y: -50 });
        expect(store.offset).toEqual({ x: 100, y: -50 });
    });

    it('傳入的物件不會共享參照（避免外部後續變更影響 store）', () => {
        const store = useCanvasStore();
        const input = { x: 5, y: 5 };
        store.setOffset(input);
        input.x = 999;
        expect(store.offset.x).toBe(5);
    });
});

// ─── setBaseRegion() + canvasSize 衍生 ───────────────────────────────────────

describe('setBaseRegion() + canvasSize 衍生', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('選擇 wuling 時 canvasSize 對應正確尺寸', () => {
        const store = useCanvasStore();
        store.setBaseRegion('wuling');
        expect(store.baseRegion).toBe('wuling');
        expect(store.canvasSize).toEqual({ w: 256, h: 256 });
    });

    it('選擇 valley4 時 canvasSize 對應正確尺寸', () => {
        const store = useCanvasStore();
        store.setBaseRegion('valley4');
        expect(store.canvasSize).toEqual({ w: 192, h: 192 });
    });

    it('切回 null 時 canvasSize 變回 null', () => {
        const store = useCanvasStore();
        store.setBaseRegion('wuling');
        store.setBaseRegion(null);
        expect(store.canvasSize).toBeNull();
    });
});

// ─── toggleGrid() ─────────────────────────────────────────────────────────────

describe('toggleGrid()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('呼叫一次反轉一次 showGrid 狀態', () => {
        const store = useCanvasStore();
        expect(store.showGrid).toBe(true);
        store.toggleGrid();
        expect(store.showGrid).toBe(false);
        store.toggleGrid();
        expect(store.showGrid).toBe(true);
    });
});

// ─── setGridSize() ────────────────────────────────────────────────────────────

describe('setGridSize()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('正常值直接套用', () => {
        const store = useCanvasStore();
        store.setGridSize(64);
        expect(store.gridSize).toBe(64);
    });

    it('下限 clamp：小於 8 的值被截斷至 8', () => {
        const store = useCanvasStore();
        store.setGridSize(2);
        expect(store.gridSize).toBe(8);
    });
});
