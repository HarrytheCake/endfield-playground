/**
 * 管線折線的逐段幾何（C3 提前量）
 *
 * `pipelineGeometry.ts` 的 `isAxisAlignedPath` 只回答「整條路徑合不合法」一個布林，
 * 說不出是哪一段壞的。本檔把同一個判斷拆成逐段，供之後 C3 渲染（正交折線＋違規段
 * 標紅）直接消費：一段一段告訴你起訖點、方向、是否軸對齊；再抓出方向改變的轉角點。
 *
 * 純函式，不 import Pinia store，也不碰 `GridCanvas.vue`。
 * 對應 W0921-H1（`docs/work_dispatch/harry/0921/W0921-H1_pipeline_polyline.md`）。
 */

import type { Position } from '@/types/euclideanSpace';

/** 單一線段的方向分類 */
export type SegmentOrientation = 'horizontal' | 'vertical' | 'diagonal';

/** 折線的單一線段 */
export interface PolylineSegment {
    /** 起點 */
    from: Position;
    /** 終點 */
    to: Position;
    /** 這一段是否軸對齊（水平或垂直）；false = 該段畫紅色 */
    axisAligned: boolean;
    /** 這一段的方向分類 */
    orientation: SegmentOrientation;
}

/** 轉角：前後兩段方向不同的那個點 */
export interface PolylineCorner {
    /** 轉角所在座標 */
    at: Position;
    /** 轉角是否為 90 度（前後兩段一橫一豎）；斜線參與的方向改變一律為 false */
    rightAngle: boolean;
}

/** {@link buildPipelinePolyline} 的回傳結果 */
export interface PipelinePolyline {
    /** 依序排列的每一段線段 */
    segments: PolylineSegment[];
    /** 依序排列的每個轉角（方向改變處） */
    corners: PolylineCorner[];
    /** 任一段非軸對齊即為 false；語意與 `isAxisAlignedPath` 完全一致 */
    valid: boolean;
}

/**
 * 判斷單一線段的方向分類。
 *
 * 兩軸皆無位移（重複點／零長度段）視為 `horizontal`——沿用 `isAxisAlignedPath`
 * 「至少一軸相同即合法」的既有語意，這種退化段本來就不構成違規。
 * @param from 起點
 * @param to 終點
 */
function classifySegment(from: Position, to: Position): SegmentOrientation {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx !== 0 && dy !== 0) return 'diagonal';
    return dy === 0 ? 'horizontal' : 'vertical';
}

/**
 * 把一串 waypoints 拆成逐段線段與轉角，並判斷整條路徑是否合法。
 *
 * `valid` 對同一組輸入必定與 `isAxisAlignedPath(waypoints)` 給出相同答案，
 * 兩者不應分岔（測試直接比對）。
 * @param waypoints 依序連接的絕對座標路徑
 * @example
 * buildPipelinePolyline([
 *     { x: 0, y: 0, z: 0 },
 *     { x: 3, y: 0, z: 0 },
 *     { x: 3, y: 2, z: 0 },
 * ]);
 * // { segments: [...], corners: [{ at: { x: 3, y: 0, z: 0 }, rightAngle: true }], valid: true }
 */
export function buildPipelinePolyline(waypoints: readonly Position[]): PipelinePolyline {
    const segments: PolylineSegment[] = [];
    for (let i = 1; i < waypoints.length; i++) {
        const from = waypoints[i - 1];
        const to = waypoints[i];
        const orientation = classifySegment(from, to);
        segments.push({ from, to, orientation, axisAligned: orientation !== 'diagonal' });
    }

    const corners: PolylineCorner[] = [];
    for (let i = 1; i < segments.length; i++) {
        const prev = segments[i - 1];
        const curr = segments[i];
        if (prev.orientation === curr.orientation) continue;
        const rightAngle =
            (prev.orientation === 'horizontal' && curr.orientation === 'vertical') ||
            (prev.orientation === 'vertical' && curr.orientation === 'horizontal');
        corners.push({ at: curr.from, rightAngle });
    }

    return {
        segments,
        corners,
        valid: segments.every((segment) => segment.axisAligned),
    };
}
