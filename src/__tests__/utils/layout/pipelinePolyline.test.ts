/**
 * W0921-H1 pipelinePolyline 單元測試
 *
 * 測試對象：src/utils/layout/pipelinePolyline.ts
 * 重點：逐段方向分類、轉角偵測、valid 與既有 isAxisAlignedPath 語意一致。
 */

import { describe, it, expect } from 'vitest';
import { buildPipelinePolyline } from '@/utils/layout/pipelinePolyline';
import { isAxisAlignedPath } from '@/utils/layout/pipelineGeometry';
import type { Position } from '@/types/euclideanSpace';

const p = (x: number, y: number): Position => ({ x, y, z: 0 });

// ─── 直線 ───────────────────────────────────────────────────────────────────────

describe('buildPipelinePolyline — 直線', () => {
    it('水平直線：1 段、0 轉角、valid', () => {
        const result = buildPipelinePolyline([p(0, 0), p(5, 0)]);
        expect(result.segments).toEqual([
            { from: p(0, 0), to: p(5, 0), orientation: 'horizontal', axisAligned: true },
        ]);
        expect(result.corners).toEqual([]);
        expect(result.valid).toBe(true);
    });

    it('垂直直線：1 段、0 轉角、valid', () => {
        const result = buildPipelinePolyline([p(2, 2), p(2, 8)]);
        expect(result.segments[0].orientation).toBe('vertical');
        expect(result.corners).toEqual([]);
        expect(result.valid).toBe(true);
    });
});

// ─── 單一直角 ────────────────────────────────────────────────────────────────────

describe('buildPipelinePolyline — 單一直角', () => {
    it('先水平後垂直：2 段、1 個 90 度轉角', () => {
        const waypoints = [p(0, 0), p(3, 0), p(3, 2)];
        const result = buildPipelinePolyline(waypoints);
        expect(result.segments).toHaveLength(2);
        expect(result.segments[0].orientation).toBe('horizontal');
        expect(result.segments[1].orientation).toBe('vertical');
        expect(result.corners).toEqual([{ at: p(3, 0), rightAngle: true }]);
        expect(result.valid).toBe(true);
    });
});

// ─── 多次轉折 ────────────────────────────────────────────────────────────────────

describe('buildPipelinePolyline — 多次轉折', () => {
    it('走 3 段方向交替，2 個轉角', () => {
        // (0,0) -> (4,0) -> (4,4) -> (0,4)：橫、豎、橫
        const waypoints = [p(0, 0), p(4, 0), p(4, 4), p(0, 4)];
        const result = buildPipelinePolyline(waypoints);
        expect(result.segments).toHaveLength(3);
        expect(result.segments.map((s) => s.orientation)).toEqual([
            'horizontal',
            'vertical',
            'horizontal',
        ]);
        expect(result.corners).toEqual([
            { at: p(4, 0), rightAngle: true },
            { at: p(4, 4), rightAngle: true },
        ]);
        expect(result.valid).toBe(true);
    });

    it('連續同方向的兩段不算轉角（直行延伸）', () => {
        // (0,0) -> (2,0) -> (5,0)：兩段都是 horizontal
        const waypoints = [p(0, 0), p(2, 0), p(5, 0)];
        const result = buildPipelinePolyline(waypoints);
        expect(result.corners).toEqual([]);
        expect(result.valid).toBe(true);
    });
});

// ─── 含斜線段 ────────────────────────────────────────────────────────────────────

describe('buildPipelinePolyline — 含斜線段', () => {
    it('單一斜線段：valid: false，且指得出是哪一段', () => {
        const waypoints = [p(0, 0), p(3, 2)];
        const result = buildPipelinePolyline(waypoints);
        expect(result.segments[0].orientation).toBe('diagonal');
        expect(result.segments[0].axisAligned).toBe(false);
        expect(result.valid).toBe(false);
    });

    it('多段中第 2 段是斜線：能精確指出違規段的索引', () => {
        // 段 0：水平合法；段 1：斜線違規；段 2：垂直合法
        const waypoints = [p(0, 0), p(3, 0), p(5, 2), p(5, 6)];
        const result = buildPipelinePolyline(waypoints);
        expect(result.segments[0].axisAligned).toBe(true);
        expect(result.segments[1].axisAligned).toBe(false);
        expect(result.segments[1].orientation).toBe('diagonal');
        expect(result.segments[2].axisAligned).toBe(true);
        expect(result.valid).toBe(false);
    });

    it('斜線段參與的方向改變仍記一個轉角，但 rightAngle 為 false', () => {
        const waypoints = [p(0, 0), p(3, 0), p(5, 2)];
        const result = buildPipelinePolyline(waypoints);
        expect(result.corners).toEqual([{ at: p(3, 0), rightAngle: false }]);
    });
});

// ─── 邊界：少於 2 點 / 重複點 ─────────────────────────────────────────────────────

describe('buildPipelinePolyline — 邊界情況', () => {
    it('空陣列：無段落無轉角，valid: true', () => {
        const result = buildPipelinePolyline([]);
        expect(result.segments).toEqual([]);
        expect(result.corners).toEqual([]);
        expect(result.valid).toBe(true);
    });

    it('只有 1 個點：無段落無轉角，valid: true', () => {
        const result = buildPipelinePolyline([p(1, 1)]);
        expect(result.segments).toEqual([]);
        expect(result.corners).toEqual([]);
        expect(result.valid).toBe(true);
    });

    it('相鄰重複點（零長度段）：視為合法、方向為 horizontal', () => {
        const waypoints = [p(2, 2), p(2, 2), p(5, 2)];
        const result = buildPipelinePolyline(waypoints);
        expect(result.segments[0]).toEqual({
            from: p(2, 2),
            to: p(2, 2),
            orientation: 'horizontal',
            axisAligned: true,
        });
        expect(result.valid).toBe(true);
    });

    it('垂直直線中段夾一個重複點：不應記成轉角（review 修正：PR #56）', () => {
        // (0,0) -> (0,2) -> (0,2) -> (0,4)：全程垂直，中間的重複點不是轉角
        const waypoints = [p(0, 0), p(0, 2), p(0, 2), p(0, 4)];
        const result = buildPipelinePolyline(waypoints);
        expect(result.corners).toEqual([]);
        expect(result.valid).toBe(true);
    });

    it('水平直線中段夾一個重複點：同樣不應記成轉角', () => {
        // (0,0) -> (3,0) -> (3,0) -> (6,0)：全程水平，中間的重複點不是轉角
        const waypoints = [p(0, 0), p(3, 0), p(3, 0), p(6, 0)];
        const result = buildPipelinePolyline(waypoints);
        expect(result.corners).toEqual([]);
        expect(result.valid).toBe(true);
    });

    it('真正轉角旁邊夾一個重複點：重複點不應讓真轉角消失或重複', () => {
        // (0,0) -> (3,0) -> (3,0) -> (3,5)：水平轉垂直，中間多一個重複點，仍只算 1 個轉角
        const waypoints = [p(0, 0), p(3, 0), p(3, 0), p(3, 5)];
        const result = buildPipelinePolyline(waypoints);
        expect(result.corners).toEqual([{ at: p(3, 0), rightAngle: true }]);
        expect(result.valid).toBe(true);
    });
});

// ─── 與既有 isAxisAlignedPath 交叉驗證 ─────────────────────────────────────────────

describe('buildPipelinePolyline — valid 與 isAxisAlignedPath 語意一致', () => {
    const cases: Position[][] = [
        [],
        [p(0, 0)],
        [p(0, 0), p(5, 0)],
        [p(0, 0), p(0, 5)],
        [p(0, 0), p(3, 2)],
        [p(0, 0), p(3, 0), p(3, 2)],
        [p(0, 0), p(3, 0), p(5, 2), p(5, 6)],
        [p(2, 2), p(2, 2), p(5, 2)],
        [p(0, 0), p(4, 0), p(4, 4), p(0, 4), p(0, 0)],
        [p(0, 0), p(0, 2), p(0, 2), p(0, 4)],
        [p(0, 0), p(3, 0), p(3, 0), p(6, 0)],
        [p(0, 0), p(3, 0), p(3, 0), p(3, 5)],
    ];

    for (const waypoints of cases) {
        it(`waypoints=${JSON.stringify(waypoints)}`, () => {
            expect(buildPipelinePolyline(waypoints).valid).toBe(isAxisAlignedPath(waypoints));
        });
    }
});
