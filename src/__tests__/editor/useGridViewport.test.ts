/**
 * W0907-H1 useGridViewport 單元測試
 *
 * 測試對象：src/editor/layout/useGridViewport.ts
 * 重點：座標換算來回一致（§3-1 契約）、縮放上下限、縮放錨點不變性、平移累加、
 * 非有限數（NaN／Infinity）輸入防呆。
 */

import { describe, it, expect } from 'vitest';
import { useGridViewport } from '@/editor/layout/useGridViewport';

// ─── cellToScreen / screenToCell 來回一致 ──────────────────────────────────────

describe('cellToScreen / screenToCell — 來回一致', () => {
    it('預設 zoom=1、offset=(0,0) 時，任意格子來回換算不變', () => {
        const viewport = useGridViewport();
        for (const cell of [
            { x: 0, y: 0, z: 0 },
            { x: 3, y: 5, z: 0 },
            { x: 11, y: 7, z: 0 },
            { x: 100, y: 42, z: 0 },
        ]) {
            expect(viewport.screenToCell(viewport.cellToScreen(cell))).toEqual(cell);
        }
    });

    it('平移後任意格子來回換算仍不變', () => {
        const viewport = useGridViewport();
        viewport.panBy(37, -19);
        for (const cell of [
            { x: 0, y: 0, z: 0 },
            { x: 4, y: 2, z: 0 },
            { x: -3, y: 8, z: 0 },
        ]) {
            expect(viewport.screenToCell(viewport.cellToScreen(cell))).toEqual(cell);
        }
    });

    it('縮放後任意格子來回換算仍不變', () => {
        const viewport = useGridViewport();
        viewport.zoomAt({ x: 0, y: 0 }, 2);
        for (const cell of [
            { x: 0, y: 0, z: 0 },
            { x: 6, y: 9, z: 0 },
            { x: 20, y: 1, z: 0 },
        ]) {
            expect(viewport.screenToCell(viewport.cellToScreen(cell))).toEqual(cell);
        }
    });

    it('平移＋縮放＋自訂 cellSize 組合下仍來回一致', () => {
        const viewport = useGridViewport({ cellSize: 40 });
        viewport.panBy(-51, 88);
        viewport.zoomAt({ x: 200, y: 150 }, 1.75);
        for (const cell of [
            { x: 0, y: 0, z: 0 },
            { x: 15, y: 3, z: 0 },
            { x: 9, y: 30, z: 0 },
        ]) {
            expect(viewport.screenToCell(viewport.cellToScreen(cell))).toEqual(cell);
        }
    });

    it('cellToScreen 回傳該格左上角像素座標', () => {
        const viewport = useGridViewport({ cellSize: 28 });
        expect(viewport.cellToScreen({ x: 2, y: 3, z: 0 })).toEqual({ x: 56, y: 84 });
    });

    it('cellToScreen 忽略 z；screenToCell 固定回傳 z: 0', () => {
        const viewport = useGridViewport({ cellSize: 28 });
        expect(viewport.cellToScreen({ x: 2, y: 3, z: 0 })).toEqual(
            viewport.cellToScreen({ x: 2, y: 3, z: 1 }),
        );
        expect(viewport.screenToCell({ x: 56, y: 84 }).z).toBe(0);
    });
});

// ─── 縮放上下限 ─────────────────────────────────────────────────────────────────

describe('zoomAt() — 縮放上下限', () => {
    it('預設 minZoom=0.25，超過下限會被 clamp', () => {
        const viewport = useGridViewport();
        viewport.zoomAt({ x: 0, y: 0 }, 0.01);
        expect(viewport.zoom.value).toBe(0.25);
    });

    it('預設 maxZoom=4，超過上限會被 clamp', () => {
        const viewport = useGridViewport();
        viewport.zoomAt({ x: 0, y: 0 }, 100);
        expect(viewport.zoom.value).toBe(4);
    });

    it('可自訂 minZoom／maxZoom', () => {
        const viewport = useGridViewport({ minZoom: 0.5, maxZoom: 2 });
        viewport.zoomAt({ x: 0, y: 0 }, 10);
        expect(viewport.zoom.value).toBe(2);
        viewport.zoomAt({ x: 0, y: 0 }, 0.1);
        expect(viewport.zoom.value).toBe(0.5);
    });

    it('區間內的值不會被 clamp', () => {
        const viewport = useGridViewport();
        viewport.zoomAt({ x: 0, y: 0 }, 1.5);
        expect(viewport.zoom.value).toBe(1.5);
    });
});

// ─── 縮放以游標為錨點 ───────────────────────────────────────────────────────────

describe('zoomAt() — 錨點不變性', () => {
    it('縮放前後，錨點螢幕座標對應的格子空間座標維持不變', () => {
        const viewport = useGridViewport({ cellSize: 28 });
        const anchor = { x: 140, y: 84 };

        // 縮放前 anchor 對應的格子空間座標
        const before = {
            x: (anchor.x - viewport.offset.value.x) / viewport.zoom.value,
            y: (anchor.y - viewport.offset.value.y) / viewport.zoom.value,
        };

        viewport.zoomAt(anchor, 2);

        const after = {
            x: (anchor.x - viewport.offset.value.x) / viewport.zoom.value,
            y: (anchor.y - viewport.offset.value.y) / viewport.zoom.value,
        };

        expect(after.x).toBeCloseTo(before.x);
        expect(after.y).toBeCloseTo(before.y);
    });

    it('zoomBy 以相對倍率縮放，錨點語意相同', () => {
        const viewport = useGridViewport();
        viewport.zoomBy({ x: 50, y: 50 }, 2);
        expect(viewport.zoom.value).toBe(2);
        viewport.zoomBy({ x: 50, y: 50 }, 0.5);
        expect(viewport.zoom.value).toBe(1);
    });

    it('目標 zoom 與目前 zoom 相同時，offset 不變（no-op）', () => {
        const viewport = useGridViewport();
        viewport.panBy(10, 20);
        const before = { ...viewport.offset.value };
        viewport.zoomAt({ x: 999, y: 999 }, 1);
        expect(viewport.offset.value).toEqual(before);
    });
});

// ─── panBy() ───────────────────────────────────────────────────────────────────

describe('panBy()', () => {
    it('位移量會累加到 offset', () => {
        const viewport = useGridViewport();
        viewport.panBy(10, 5);
        viewport.panBy(-3, 20);
        expect(viewport.offset.value).toEqual({ x: 7, y: 25 });
    });
});

// ─── reset() ───────────────────────────────────────────────────────────────────

describe('reset()', () => {
    it('把 offset 歸零、zoom 歸一', () => {
        const viewport = useGridViewport();
        viewport.panBy(100, -50);
        viewport.zoomAt({ x: 0, y: 0 }, 3);
        viewport.reset();
        expect(viewport.offset.value).toEqual({ x: 0, y: 0 });
        expect(viewport.zoom.value).toBe(1);
    });
});

// ─── 非有限數輸入防呆 ───────────────────────────────────────────────────────────

describe('非有限數（NaN／Infinity）輸入防呆', () => {
    it('panBy(NaN, 0) 整次呼叫視為無效，offset 不變', () => {
        const viewport = useGridViewport();
        viewport.panBy(10, 20);
        const before = { ...viewport.offset.value };
        viewport.panBy(NaN, 0);
        expect(viewport.offset.value).toEqual(before);
        expect(Number.isFinite(viewport.offset.value.x)).toBe(true);
    });

    it('panBy(Infinity, 0) 整次呼叫視為無效，offset 不變', () => {
        const viewport = useGridViewport();
        const before = { ...viewport.offset.value };
        viewport.panBy(Infinity, 0);
        expect(viewport.offset.value).toEqual(before);
    });

    it('zoomAt(anchor, NaN) 整次呼叫視為無效，zoom／offset 都不變', () => {
        const viewport = useGridViewport();
        viewport.panBy(5, 5);
        const beforeZoom = viewport.zoom.value;
        const beforeOffset = { ...viewport.offset.value };
        viewport.zoomAt({ x: 10, y: 10 }, NaN);
        expect(viewport.zoom.value).toBe(beforeZoom);
        expect(viewport.offset.value).toEqual(beforeOffset);
        expect(Number.isFinite(viewport.zoom.value)).toBe(true);
    });

    it('zoomAt 的 anchor 含 NaN 時整次呼叫視為無效', () => {
        const viewport = useGridViewport();
        const beforeZoom = viewport.zoom.value;
        viewport.zoomAt({ x: NaN, y: 10 }, 2);
        expect(viewport.zoom.value).toBe(beforeZoom);
    });

    it('zoomBy(anchor, NaN) 整次呼叫視為無效', () => {
        const viewport = useGridViewport();
        const beforeZoom = viewport.zoom.value;
        viewport.zoomBy({ x: 10, y: 10 }, NaN);
        expect(viewport.zoom.value).toBe(beforeZoom);
        expect(Number.isFinite(viewport.zoom.value)).toBe(true);
    });

    it('非有限數呼叫之後，視窗仍可正常運作（不需 reset() 救回）', () => {
        const viewport = useGridViewport();
        viewport.panBy(NaN, NaN);
        viewport.zoomAt({ x: 0, y: 0 }, NaN);
        viewport.panBy(10, 20);
        expect(viewport.offset.value).toEqual({ x: 10, y: 20 });
    });
});
