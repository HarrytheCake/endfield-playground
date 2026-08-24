/**
 * 管線折線幾何單元測試
 *
 * 測試對象：src/utils/pipelinePath.ts
 * 重點：R-C3 §4.2 凍結演算法的三種形狀（直線／L 形／Z 形）與各軸向組合，
 * 以及選填的 gridSize 中繼點吸附。
 */

import { describe, it, expect } from 'vitest';
import { buildPipelinePath } from '@/utils/pipelinePath';

describe('buildPipelinePath()', () => {
    it('同軸（水平）且共線 → 直線，零轉角', () => {
        const points = buildPipelinePath(
            { x: 0, y: 50, side: 'right' },
            { x: 200, y: 50, side: 'left' },
        );
        expect(points).toEqual([
            { x: 0, y: 50 },
            { x: 200, y: 50 },
        ]);
    });

    it('同軸（垂直）且共線 → 直線，零轉角', () => {
        const points = buildPipelinePath(
            { x: 30, y: 0, side: 'bottom' },
            { x: 30, y: 200, side: 'top' },
        );
        expect(points).toEqual([
            { x: 30, y: 0 },
            { x: 30, y: 200 },
        ]);
    });

    it('同軸（水平）不共線 → Z 形，兩個轉角', () => {
        const points = buildPipelinePath(
            { x: 0, y: 0, side: 'right' },
            { x: 100, y: 100, side: 'left' },
        );
        expect(points).toEqual([
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 100 },
            { x: 100, y: 100 },
        ]);
        // 每段都必須是純水平或純垂直（軸對齊）
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i - 1].x;
            const dy = points[i].y - points[i - 1].y;
            expect(dx === 0 || dy === 0).toBe(true);
        }
    });

    it('同軸（垂直）不共線 → Z 形，兩個轉角', () => {
        const points = buildPipelinePath(
            { x: 0, y: 0, side: 'bottom' },
            { x: 100, y: 100, side: 'top' },
        );
        expect(points).toEqual([
            { x: 0, y: 0 },
            { x: 0, y: 50 },
            { x: 100, y: 50 },
            { x: 100, y: 100 },
        ]);
    });

    it('異軸（水平出、垂直入）→ L 形，一個轉角', () => {
        const points = buildPipelinePath(
            { x: 0, y: 0, side: 'right' },
            { x: 100, y: 100, side: 'top' },
        );
        expect(points).toEqual([
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
        ]);
    });

    it('異軸（垂直出、水平入）→ L 形，一個轉角', () => {
        const points = buildPipelinePath(
            { x: 0, y: 0, side: 'bottom' },
            { x: 100, y: 100, side: 'left' },
        );
        expect(points).toEqual([
            { x: 0, y: 0 },
            { x: 0, y: 100 },
            { x: 100, y: 100 },
        ]);
    });

    it('起訖點完全重合 → 回傳單點不重複的兩點（零長度線段）', () => {
        const points = buildPipelinePath(
            { x: 50, y: 50, side: 'right' },
            { x: 50, y: 50, side: 'left' },
        );
        expect(points).toEqual([
            { x: 50, y: 50 },
            { x: 50, y: 50 },
        ]);
    });

    it('給 gridSize 時，Z 形（水平）中繼點吸附到最近的格線倍數', () => {
        const points = buildPipelinePath(
            { x: 0, y: 0, side: 'right' },
            { x: 100, y: 90, side: 'left' },
            20,
        );
        // 原始中點 x = 50，吸附到最近的 20 倍數 → 40 或 60；(50/20)=2.5 四捨五入取 3 → 60
        expect(points).toEqual([
            { x: 0, y: 0 },
            { x: 60, y: 0 },
            { x: 60, y: 90 },
            { x: 100, y: 90 },
        ]);
    });

    it('給 gridSize 時，Z 形（垂直）中繼點吸附到最近的格線倍數', () => {
        const points = buildPipelinePath(
            { x: 0, y: 0, side: 'bottom' },
            { x: 90, y: 100, side: 'top' },
            20,
        );
        expect(points).toEqual([
            { x: 0, y: 0 },
            { x: 0, y: 60 },
            { x: 90, y: 60 },
            { x: 90, y: 100 },
        ]);
    });

    it('給 gridSize 時，L 形的端點座標仍原封不動（不吸附直接沿用自埠的座標）', () => {
        const points = buildPipelinePath(
            { x: 3, y: 7, side: 'right' },
            { x: 103, y: 97, side: 'top' },
            20,
        );
        expect(points).toEqual([
            { x: 3, y: 7 },
            { x: 103, y: 7 },
            { x: 103, y: 97 },
        ]);
    });

    it('不給 gridSize 時行為不變（向下相容）', () => {
        const points = buildPipelinePath(
            { x: 0, y: 0, side: 'right' },
            { x: 100, y: 90, side: 'left' },
        );
        expect(points).toEqual([
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 90 },
            { x: 100, y: 90 },
        ]);
    });
});
