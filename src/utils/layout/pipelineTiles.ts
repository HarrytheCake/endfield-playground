/**
 * 管線逐格素材計算
 *
 * 把管線路徑展開成每一格要畫哪張素材（直線或彎道）、轉幾度、要不要先水平翻轉。
 * 純函式，不碰素材網址與 DOM；畫面層（`PipelineShape.vue`）只負責把結果貼上去。
 */

import type { Position } from '@/types/euclideanSpace';
import { getPipelineOccupiedCells, isAxisAlignedPath } from '@/utils/layout/pipelineGeometry';

/** 管線種類：傳送帶或水管，兩者素材的原始朝向不同 */
export type PipelineKind = 'belt' | 'pipe';

/** 單位方向向量；y 向下為正，與畫布座標一致 */
interface Direction {
    x: number;
    y: number;
}

/** 單格素材的形狀 */
export type TileShape = 'straight' | 'curve';

/** 一格要畫的素材 */
export interface PipelineTile {
    /** 格座標 */
    x: number;
    y: number;
    /** 使用直線或彎道素材 */
    shape: TileShape;
    /** 順時針旋轉角，只會是 0、90、180、270 */
    rotate: number;
    /** 是否先水平翻轉再旋轉；只有彎道會用到 */
    mirrored: boolean;
}

/**
 * 各種素材的原始朝向（皆為「行進方向」，不是連接的邊）。
 * 直線：沿 `flow` 前進；彎道：沿 `enter` 進入、轉向 `exit` 離開。
 */
const BASE_ORIENTATION = {
    belt: {
        flow: { x: 1, y: 0 },
        enter: { x: 0, y: -1 },
        exit: { x: 1, y: 0 },
    },
    pipe: {
        flow: { x: 0, y: -1 },
        enter: { x: 1, y: 0 },
        exit: { x: 0, y: -1 },
    },
} as const satisfies Record<PipelineKind, { flow: Direction; enter: Direction; exit: Direction }>;

/** 預設朝右：單格路徑沒有鄰居可以參照時使用 */
const FACING_RIGHT: Direction = { x: 1, y: 0 };

/**
 * 方向 → 順時針旋轉角（以朝右為 0°，SVG 的 y 軸向下）。
 * @param d 單位方向
 * @returns 0、90、180 或 270
 */
function angleOf(d: Direction): number {
    const degrees = (Math.atan2(d.y, d.x) * 180) / Math.PI;
    return (degrees + 360) % 360;
}

/**
 * 轉向的符號。
 * @returns +1 順時針、-1 逆時針、0 直行
 */
function turnOf(from: Direction, to: Direction): number {
    return Math.sign(from.x * to.y - from.y * to.x);
}

/**
 * 兩格相減並正規化成單位方向。
 * @returns 方向；兩格重合時為 null
 */
function stepBetween(a: Position, b: Position): Direction | null {
    const dx = Math.sign(b.x - a.x);
    const dy = Math.sign(b.y - a.y);
    return dx === 0 && dy === 0 ? null : { x: dx, y: dy };
}

/**
 * 把管線路徑展開成逐格素材。
 *
 * 先用 `getPipelineOccupiedCells` 把轉角點展開成每一格，再看每格「從哪來、往哪去」：
 * 方向不變用直線、方向改變用彎道；轉向與素材相反時先水平翻轉再旋轉。
 * 路徑不是軸對齊時回傳空陣列（缺轉角的斜線不對應任何實際路徑）。
 *
 * @param waypoints 依序連接的格座標路徑
 * @param kind 管線種類，決定素材的原始朝向
 * @returns 依路徑順序排列的逐格素材
 * @example
 * getPipelineTiles([{ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }], 'belt');
 * // [{ x: 0, y: 0, shape: 'straight', rotate: 0, mirrored: false }, ...]
 */
export function getPipelineTiles(waypoints: Position[], kind: PipelineKind): PipelineTile[] {
    if (waypoints.length === 0 || !isAxisAlignedPath(waypoints)) {
        return [];
    }

    const cells = getPipelineOccupiedCells({ id: 'tiles', waypoints, depth: 1 });
    const base = BASE_ORIENTATION[kind];

    return cells.map((cell, i): PipelineTile => {
        const incoming = i > 0 ? stepBetween(cells[i - 1], cell) : null;
        const outgoing = i < cells.length - 1 ? stepBetween(cell, cells[i + 1]) : null;
        /** 頭尾格只有一側鄰居：沿唯一的方向畫直線 */
        const enter = incoming ?? outgoing ?? FACING_RIGHT;
        const exit = outgoing ?? incoming ?? FACING_RIGHT;
        const turn = turnOf(enter, exit);

        if (turn === 0) {
            return {
                x: cell.x,
                y: cell.y,
                shape: 'straight',
                rotate: (angleOf(enter) - angleOf(base.flow) + 360) % 360,
                mirrored: false,
            };
        }

        const mirrored = turnOf(base.enter, base.exit) !== turn;
        /** 翻轉只作用於素材本身（水平鏡射），旋轉再套在翻轉之後 */
        const baseEnter = mirrored ? { x: -base.enter.x, y: base.enter.y } : base.enter;
        return {
            x: cell.x,
            y: cell.y,
            shape: 'curve',
            rotate: (angleOf(enter) - angleOf(baseEnter) + 360) % 360,
            mirrored,
        };
    });
}
