/**
 * pipelineTiles 單元測試
 *
 * 測試對象：src/utils/layout/pipelineTiles.ts
 * 重點：直線／彎道的選擇、四個方向的旋轉、轉向相反時的翻轉、非法路徑不輸出。
 */

import { describe, it, expect } from 'vitest';
import { getPipelineTiles } from '@/utils/layout/pipelineTiles';
import type { Position } from '@/types/euclideanSpace';

const p = (x: number, y: number): Position => ({ x, y, z: 0 });

describe('getPipelineTiles — 直線', () => {
    it('傳送帶朝右：素材原方向，不旋轉', () => {
        const tiles = getPipelineTiles([p(0, 0), p(2, 0)], 'belt');
        expect(tiles).toEqual([
            { x: 0, y: 0, shape: 'straight', rotate: 0, mirrored: false },
            { x: 1, y: 0, shape: 'straight', rotate: 0, mirrored: false },
            { x: 2, y: 0, shape: 'straight', rotate: 0, mirrored: false },
        ]);
    });

    it('傳送帶朝下、朝左、朝上：依序轉 90、180、270', () => {
        expect(getPipelineTiles([p(0, 0), p(0, 1)], 'belt').map((t) => t.rotate)).toEqual([90, 90]);
        expect(getPipelineTiles([p(1, 0), p(0, 0)], 'belt').map((t) => t.rotate)).toEqual([
            180, 180,
        ]);
        expect(getPipelineTiles([p(0, 1), p(0, 0)], 'belt').map((t) => t.rotate)).toEqual([
            270, 270,
        ]);
    });

    it('水管原方向朝上：朝上不轉，朝右轉 90', () => {
        expect(getPipelineTiles([p(0, 1), p(0, 0)], 'pipe').map((t) => t.rotate)).toEqual([0, 0]);
        expect(getPipelineTiles([p(0, 0), p(1, 0)], 'pipe').map((t) => t.rotate)).toEqual([90, 90]);
    });

    it('單格路徑：預設朝右', () => {
        expect(getPipelineTiles([p(3, 3)], 'belt')).toEqual([
            { x: 3, y: 3, shape: 'straight', rotate: 0, mirrored: false },
        ]);
    });
});

describe('getPipelineTiles — 彎道', () => {
    it('轉角那格是彎道，兩端與中間是直線', () => {
        const tiles = getPipelineTiles([p(0, 0), p(2, 0), p(2, 2)], 'belt');
        expect(tiles.map((t) => t.shape)).toEqual([
            'straight',
            'straight',
            'curve',
            'straight',
            'straight',
        ]);
    });

    it('傳送帶素材原轉向（向上進、向右出，順時針）：不旋轉不翻轉', () => {
        const tiles = getPipelineTiles([p(0, 1), p(0, 0), p(1, 0)], 'belt');
        expect(tiles[1]).toEqual({ x: 0, y: 0, shape: 'curve', rotate: 0, mirrored: false });
    });

    it('轉向與素材相反時：翻轉', () => {
        /** 向右進、向上出是逆時針，與傳送帶素材相反 */
        const tiles = getPipelineTiles([p(0, 1), p(1, 1), p(1, 0)], 'belt');
        expect(tiles[1].shape).toBe('curve');
        expect(tiles[1].mirrored).toBe(true);
    });

    it('水管素材原轉向（向右進、向上出，逆時針）：不旋轉不翻轉', () => {
        const tiles = getPipelineTiles([p(0, 1), p(1, 1), p(1, 0)], 'pipe');
        expect(tiles[1]).toEqual({ x: 1, y: 1, shape: 'curve', rotate: 0, mirrored: false });
    });

    it('繞一圈：三個順時針彎道依序轉 90、180、270', () => {
        const tiles = getPipelineTiles([p(0, 0), p(2, 0), p(2, 2), p(0, 2), p(0, 1)], 'belt');
        const curves = tiles.filter((t) => t.shape === 'curve');
        expect(curves.map((t) => t.rotate)).toEqual([90, 180, 270]);
        expect(curves.every((t) => !t.mirrored)).toBe(true);
    });
});

describe('getPipelineTiles — 非法輸入', () => {
    it('空路徑：回傳空陣列', () => {
        expect(getPipelineTiles([], 'belt')).toEqual([]);
    });

    it('斜線：回傳空陣列', () => {
        expect(getPipelineTiles([p(0, 0), p(3, 2)], 'belt')).toEqual([]);
    });
});
