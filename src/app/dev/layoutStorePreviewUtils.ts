/**
 * V12-D1 預覽輔助：埠錨點與可繞設備的 belt 路徑（僅 /dev 使用）
 *
 * 塑型機等埠在上下時，最短 L 形常會穿過機身觸發 layoutStore overlap；  \
 * 拉 belt 改為在空格上 BFS，再壓成軸對齊 waypoints。
 */

import type { Position } from '@/types/euclideanSpace';
import type { Pipeline, PlacedDevice, PortDirection } from '@/types/layout';
import { getMachineById } from '@/data/machines';
import { getMachineMode } from '@/types/machine';
import { resolveDisplayGrid, rotatePort } from '@/utils/portUtils';
import { resolvePortAnchorCell } from '@/utils/layout/portAnchors';
import { getDeviceOccupiedCells } from '@/utils/layout/deviceOccupancy';
import {
    deviceSizeFromMachine,
    toDeviceFootprint,
    toPipelineFootprint,
} from '@/utils/layout/toFootprint';
import { getPipelineOccupiedCells } from '@/utils/layout/pipelineGeometry';

interface AnchorCell {
    x: number;
    y: number;
}

/**
 * 展開設備某方向所有埠的外側錨點
 */
export function listPortAnchors(device: PlacedDevice, direction: PortDirection): AnchorCell[] {
    const machine = getMachineById(device.machineType);
    if (!machine) return [];
    const mode = getMachineMode(machine, device.machineMode);
    const ports = direction === 'output' ? mode.output_ports : mode.input_ports;
    const display = resolveDisplayGrid(machine.width, machine.height, device.rotation);
    const result: AnchorCell[] = [];

    for (const port of ports) {
        const rotated = rotatePort(
            port.side,
            port.offset,
            machine.width,
            machine.height,
            device.rotation,
        );
        result.push(
            resolvePortAnchorCell(
                device.position.x,
                device.position.y,
                display.widthCells,
                display.heightCells,
                rotated.side,
                rotated.offset,
            ),
        );
    }
    return result;
}

/**
 * 在兩機之間挑一對錨點（最短曼哈頓距離且非同格）
 */
export function bestBeltAnchors(
    from: PlacedDevice,
    to: PlacedDevice,
): { from: AnchorCell; to: AnchorCell } | null {
    const outs = listPortAnchors(from, 'output');
    const ins = listPortAnchors(to, 'input');
    let best: { from: AnchorCell; to: AnchorCell } | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const o of outs) {
        for (const i of ins) {
            const dist = Math.abs(o.x - i.x) + Math.abs(o.y - i.y);
            if (dist > 0 && dist < bestDist) {
                bestDist = dist;
                best = { from: o, to: i };
            }
        }
    }
    return best;
}

/**
 * 軸對齊 L 形路徑（先水平再垂直），含兩端錨點
 */
export function axisAlignedWaypoints(from: AnchorCell, to: AnchorCell): Position[] {
    const points: Position[] = [{ x: from.x, y: from.y, z: 0 }];
    let x = from.x;
    let y = from.y;

    while (x !== to.x) {
        x += Math.sign(to.x - x);
        points.push({ x, y, z: 0 });
    }
    while (y !== to.y) {
        y += Math.sign(to.y - y);
        points.push({ x, y, z: 0 });
    }

    return points;
}

/**
 * 路徑展開後的 xy 是否撞到封鎖格
 */
export function pathHitsBlocked(waypoints: Position[], blockedXy: ReadonlySet<string>): boolean {
    if (waypoints.length < 2) return true;
    const cells = getPipelineOccupiedCells(
        toPipelineFootprint({ id: 'tmp', media: 'belt', waypoints }),
    );
    for (const cell of cells) {
        if (blockedXy.has(`${cell.x},${cell.y}`)) return true;
    }
    return false;
}

/**
 * 由目前設備／管線組出 xy 封鎖表（供繞線）
 */
export function buildBlockedXy(
    devices: readonly PlacedDevice[],
    pipelines: readonly { media: Pipeline['media']; waypoints: readonly Position[] }[] = [],
): Set<string> {
    const blocked = new Set<string>();

    for (const device of devices) {
        const machine = getMachineById(device.machineType);
        if (!machine) continue;
        const cells = getDeviceOccupiedCells(
            toDeviceFootprint(device, deviceSizeFromMachine(machine)),
        );
        for (const cell of cells) {
            blocked.add(`${cell.x},${cell.y}`);
        }
    }

    for (const pipeline of pipelines) {
        const cells = getPipelineOccupiedCells(
            toPipelineFootprint({
                id: 'blocked-pipe',
                media: pipeline.media,
                waypoints: pipeline.waypoints.map((w) => ({ ...w })),
            }),
        );
        for (const cell of cells) {
            blocked.add(`${cell.x},${cell.y}`);
        }
    }

    return blocked;
}

function cellKey(x: number, y: number): string {
    return `${x},${y}`;
}

/**
 * 四向 BFS；起終點允許在封鎖外。回傳逐格路徑（含兩端）。
 */
export function bfsGridPath(
    start: AnchorCell,
    goal: AnchorCell,
    blockedXy: ReadonlySet<string>,
    margin = 8,
): AnchorCell[] | null {
    if (start.x === goal.x && start.y === goal.y) return null;

    const minX = Math.min(start.x, goal.x) - margin;
    const maxX = Math.max(start.x, goal.x) + margin;
    const minY = Math.min(start.y, goal.y) - margin;
    const maxY = Math.max(start.y, goal.y) + margin;

    const startKey = cellKey(start.x, start.y);
    const goalKey = cellKey(goal.x, goal.y);
    if (blockedXy.has(startKey) || blockedXy.has(goalKey)) return null;

    const cameFrom = new Map<string, string | null>();
    const queue: AnchorCell[] = [start];
    cameFrom.set(startKey, null);

    const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
    ] as const;

    while (queue.length > 0) {
        const cur = queue.shift()!;
        const curKey = cellKey(cur.x, cur.y);
        if (curKey === goalKey) break;

        for (const [dx, dy] of dirs) {
            const nx = cur.x + dx;
            const ny = cur.y + dy;
            if (nx < minX || nx > maxX || ny < minY || ny > maxY) continue;
            const nk = cellKey(nx, ny);
            if (cameFrom.has(nk)) continue;
            if (blockedXy.has(nk)) continue;
            cameFrom.set(nk, curKey);
            queue.push({ x: nx, y: ny });
        }
    }

    if (!cameFrom.has(goalKey)) return null;

    const rev: AnchorCell[] = [];
    let walk: string | null = goalKey;
    while (walk) {
        const [xs, ys] = walk.split(',');
        rev.push({ x: Number(xs), y: Number(ys) });
        walk = cameFrom.get(walk) ?? null;
    }
    rev.reverse();
    return rev;
}

/**
 * 逐格路徑 → 管線 waypoints（只留端點與轉角）
 */
export function compressGridPath(cells: AnchorCell[]): Position[] {
    if (cells.length === 0) return [];
    if (cells.length === 1) return [{ x: cells[0].x, y: cells[0].y, z: 0 }];

    const waypoints: Position[] = [{ x: cells[0].x, y: cells[0].y, z: 0 }];
    for (let i = 1; i < cells.length - 1; i++) {
        const prev = cells[i - 1];
        const cur = cells[i];
        const next = cells[i + 1];
        const dir1x = cur.x - prev.x;
        const dir1y = cur.y - prev.y;
        const dir2x = next.x - cur.x;
        const dir2y = next.y - cur.y;
        if (dir1x !== dir2x || dir1y !== dir2y) {
            waypoints.push({ x: cur.x, y: cur.y, z: 0 });
        }
    }
    const last = cells[cells.length - 1];
    const tail = waypoints[waypoints.length - 1];
    if (!tail || tail.x !== last.x || tail.y !== last.y) {
        waypoints.push({ x: last.x, y: last.y, z: 0 });
    }
    return waypoints;
}

/**
 * 找一條不撞設備／既有管線的 belt 路徑（固定兩錨點 × BFS）
 */
export function findRoutableBeltBetweenAnchors(
    from: AnchorCell,
    to: AnchorCell,
    blockedXy: ReadonlySet<string>,
): Position[] | null {
    if (from.x === to.x && from.y === to.y) return null;
    const cells = bfsGridPath(from, to, blockedXy);
    if (!cells || cells.length < 2) return null;
    const path = compressGridPath(cells);
    if (path.length < 2) return null;
    if (pathHitsBlocked(path, blockedXy)) return null;
    return path;
}

/**
 * 找一條不撞設備／既有管線的 belt 路徑（所有埠對 × BFS）
 */
export function findRoutableBeltWaypoints(
    fromDevice: PlacedDevice,
    toDevice: PlacedDevice,
    blockedXy: ReadonlySet<string>,
): Position[] | null {
    const outs = listPortAnchors(fromDevice, 'output');
    const ins = listPortAnchors(toDevice, 'input');
    let best: Position[] | null = null;
    let bestLen = Number.POSITIVE_INFINITY;

    for (const o of outs) {
        for (const i of ins) {
            if (o.x === i.x && o.y === i.y) continue;
            const cells = bfsGridPath(o, i, blockedXy);
            if (!cells || cells.length < 2) continue;
            const path = compressGridPath(cells);
            if (path.length < 2) continue;
            if (pathHitsBlocked(path, blockedXy)) continue;
            if (cells.length < bestLen) {
                bestLen = cells.length;
                best = path;
            }
        }
    }

    return best;
}
