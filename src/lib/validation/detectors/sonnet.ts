/**
 * CR-03 碰撞偵測器
 *
 * 演算法：全局 3D 陣列 Spatial Grid
 *   allgrid[x][y][z] = 物件 ID 列表
 *
 * 假設傳入的座標已是格子座標，不做任何轉換。
 *
 * 高度層以 size[2] 表達：
 *   - size[2] = 2 → 展出 z=0 與 z=1（一般設備，h=1）
 *   - size[2] = 1 → 只展出自己的 z 層（h=0）
 *   - 傳送帶 waypoint z=0；水管 waypoint z=1
 */

import type { ValidationContext } from '@/types/validation';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import type { Machine } from '@/types/machine';
import type { Position } from '@/types/euclideanSpace';
import { getOccupiedCells } from '@/utils/shirone/getMachineOccupiedGrids';
import { getPipelineOccupiedGrids } from '@/utils/shirone/getPipelineOccupiedGrids';

// ─── 型別 ────────────────────────────────────────────────────────────────────

/** 碰撞配對：兩個佔用相同 [x,y,z] 格子的物件 ID */
export interface CollisionPair {
    id1: string;
    id2: string;
}

// ─── 格子展開 ─────────────────────────────────────────────────────────────────

function getMachineGridCells(device: FactoryNode, def: Machine): Position[] {
    const rotation = device.data?.rotation ?? 0;
    const layerCount = (def.is_source || def.is_sink) ? 1 : 2;

    return getOccupiedCells(
        [device.position.x, device.position.y, 0],
        [def.width, def.height, layerCount],
        rotation,
    );
}

function getPipelineGridCells(edge: FactoryEdge): Position[] {
    const bendPoints = edge.data?.bendPoints;
    if (!bendPoints || bendPoints.length === 0) return [];

    const z = edge.data?.portType === 'liquid' ? 1 : 0;

    const waypoints: Position[] = bendPoints.map(bp => [bp.x, bp.y, z]);

    return getPipelineOccupiedGrids(waypoints);
}

// ─── 核心偵測 ─────────────────────────────────────────────────────────────────

/**
 * 偵測所有物件（設備 + 管線）的 3D 格子碰撞，回傳碰撞配對陣列。
 *
 * 不負責分類 E001 / E002，由呼叫端自行依 id 型別判斷。
 */
export function detectCollisions(ctx: ValidationContext): CollisionPair[] {
    const allgrid: string[][][][] = [];
    const seen = new Set<string>();
    const collisions: CollisionPair[] = [];

    function registerCells(id: string, cells: Position[]): void {
        for (const [cx, cy, cz] of cells) {
            allgrid[cx] ??= [];
            allgrid[cx][cy] ??= [];
            allgrid[cx][cy][cz] ??= [];

            for (const existingId of allgrid[cx][cy][cz]) {
                const [smallId, largeId] = id < existingId
                    ? [id, existingId]
                    : [existingId, id];
                const key = `${smallId}|${largeId}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    collisions.push({ id1: smallId, id2: largeId });
                }
            }

            allgrid[cx][cy][cz].push(id);
        }
    }

    for (const device of ctx.devices) {
        const def = ctx.getDef(device.data?.machineType ?? '');
        if (!def) continue;
        registerCells(device.id, getMachineGridCells(device, def));
    }

    for (const edge of ctx.connections) {
        const cells = getPipelineGridCells(edge);
        if (cells.length === 0) continue;
        registerCells(edge.id, cells);
    }

    return collisions;
}
