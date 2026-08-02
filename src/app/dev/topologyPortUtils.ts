/**
 * Dev 拓樸／機器預覽共用：依 width×height 格點 + side／offset 定位埠（V9-C2）。
 *
 * 定位與 MachineShape／portUtils 一致：
 * - top／bottom：沿寬度第 offset 格（0-based）中心
 * - left／right：沿高度第 offset 格中心
 * - offset 超出時 clamp；可選 console.warn
 */
import { getMachine, getMachineMode } from '@/data/machines';
import type { MachineMode, PortMedia, PortSide } from '@/types/machine';
import { rotatePortOffset, rotatePortSide } from '@/utils/portUtils';

export type TopologyPortKind = 'in' | 'out';

export interface TopologyPortMarker {
    key: string;
    kind: TopologyPortKind;
    index: number;
    side: PortSide;
    offset: number;
    media: PortMedia;
    label: string;
}

export type GridRotation = 0 | 1 | 2 | 3;

/**
 * 解析節點當前 mode；無機器定義時回傳 null。
 */
export function resolveNodeMode(
    machineType: string | undefined,
    machineMode?: string,
): MachineMode | null {
    if (!machineType) return null;
    const machine = getMachine(machineType);
    if (!machine) return null;
    return getMachineMode(machine, machineMode);
}

/**
 * 列出 mode 下所有埠標記（含 in-N／out-N 標籤）。
 */
export function listModePortMarkers(mode: MachineMode | null): TopologyPortMarker[] {
    if (!mode) return [];
    const markers: TopologyPortMarker[] = [];
    mode.input_ports.forEach((p, i) => {
        markers.push({
            key: `in-${i}`,
            kind: 'in',
            index: i,
            side: p.side,
            offset: p.offset,
            media: p.media,
            label: `in-${i}`,
        });
    });
    mode.output_ports.forEach((p, i) => {
        markers.push({
            key: `out-${i}`,
            kind: 'out',
            index: i,
            side: p.side,
            offset: p.offset,
            media: p.media,
            label: `out-${i}`,
        });
    });
    return markers;
}

/**
 * 旋轉後畫布上的格數（90°／270° 時寬高對調）。
 */
export function resolveDisplayGrid(
    widthCells: number,
    heightCells: number,
    rotation: GridRotation = 0,
): { widthCells: number; heightCells: number } {
    if (rotation % 2 === 1) {
        return { widthCells: heightCells, heightCells: widthCells };
    }
    return { widthCells, heightCells };
}

/**
 * Clamp offset 到該邊合法格範圍。
 */
export function clampPortOffset(
    side: PortSide,
    offset: number,
    widthCells: number,
    heightCells: number,
): { offset: number; wasClamped: boolean } {
    const max =
        side === 'top' || side === 'bottom'
            ? Math.max(widthCells - 1, 0)
            : Math.max(heightCells - 1, 0);
    const clamped = Math.max(0, Math.min(offset, max));
    return { offset: clamped, wasClamped: clamped !== offset };
}

export interface PortGridPosition {
    x: number;
    y: number;
    /** 實際使用的 offset（可能已 clamp） */
    offset: number;
    wasClamped: boolean;
}

/**
 * 埠在矩形上的格點中心座標（矩形左上為 origin）。
 *
 * @param side／offset 已是畫布方位（若有旋轉請先 rotate）
 * @param widthCells／heightCells 畫布格數（旋轉後）
 * @param rectW／rectH 像素尺寸
 */
export function portPositionOnGrid(
    side: PortSide,
    offset: number,
    widthCells: number,
    heightCells: number,
    rectW: number,
    rectH: number,
    options?: { warnOnClamp?: boolean; warnLabel?: string },
): PortGridPosition {
    const w = Math.max(widthCells, 1);
    const h = Math.max(heightCells, 1);
    const { offset: o, wasClamped } = clampPortOffset(side, offset, w, h);
    if (wasClamped && options?.warnOnClamp) {
        console.warn(
            `[topologyPortUtils] offset clamp ${options.warnLabel ?? ''}: ${side}@${offset} → ${o} (${w}×${h})`,
        );
    }
    const cellW = rectW / w;
    const cellH = rectH / h;
    switch (side) {
        case 'top':
            return { x: (o + 0.5) * cellW, y: 0, offset: o, wasClamped };
        case 'bottom':
            return { x: (o + 0.5) * cellW, y: rectH, offset: o, wasClamped };
        case 'left':
            return { x: 0, y: (o + 0.5) * cellH, offset: o, wasClamped };
        case 'right':
            return { x: rectW, y: (o + 0.5) * cellH, offset: o, wasClamped };
    }
}

/**
 * 套用節點旋轉後，計算埠在矩形上的像素位置。
 */
export function portPositionOnRect(
    marker: Pick<TopologyPortMarker, 'side' | 'offset' | 'key'>,
    machineWidth: number,
    machineHeight: number,
    rectW: number,
    rectH: number,
    rotation: GridRotation = 0,
    options?: { warnOnClamp?: boolean },
): PortGridPosition {
    const side = rotatePortSide(marker.side, rotation);
    const offset = rotatePortOffset(
        marker.side,
        marker.offset,
        machineWidth,
        machineHeight,
        rotation,
    );
    const grid = resolveDisplayGrid(machineWidth, machineHeight, rotation);
    return portPositionOnGrid(
        side,
        offset,
        grid.widthCells,
        grid.heightCells,
        rectW,
        rectH,
        { warnOnClamp: options?.warnOnClamp, warnLabel: marker.key },
    );
}

/**
 * 產生格線座標（相對矩形 origin）。
 */
export function listGridLines(
    widthCells: number,
    heightCells: number,
    rectW: number,
    rectH: number,
): { x1: number; y1: number; x2: number; y2: number; key: string }[] {
    const w = Math.max(widthCells, 1);
    const h = Math.max(heightCells, 1);
    const cellW = rectW / w;
    const cellH = rectH / h;
    const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
    for (let i = 1; i < w; i++) {
        lines.push({ key: `v${i}`, x1: i * cellW, y1: 0, x2: i * cellW, y2: rectH });
    }
    for (let j = 1; j < h; j++) {
        lines.push({ key: `h${j}`, x1: 0, y1: j * cellH, x2: rectW, y2: j * cellH });
    }
    return lines;
}

/**
 * 自 handle id 解析埠索引；無法解析回傳 null。
 */
export function parseTopologyHandleIndex(
    handle: string | null | undefined,
    kind: TopologyPortKind,
): number | null {
    if (!handle) return null;
    const m = handle.match(new RegExp(`^${kind}-(\\d+)$`));
    return m ? Number(m[1]) : null;
}

function normalizeRotation(raw: unknown): GridRotation {
    const n = Number(raw);
    if (n === 1 || n === 2 || n === 3) return n;
    return 0;
}

/**
 * 邊端點：有 handle 時對齊對應埠格點中心，否則用節點左右中點。
 */
export function edgeEndpoint(
    nodeX: number,
    nodeY: number,
    machineWidth: number,
    machineHeight: number,
    rectW: number,
    rectH: number,
    mode: MachineMode | null,
    kind: TopologyPortKind,
    handle: string | null | undefined,
    rotation: GridRotation = 0,
): { x: number; y: number } {
    if (mode) {
        const idx = parseTopologyHandleIndex(handle, kind);
        if (idx != null) {
            const markers = listModePortMarkers(mode);
            const marker = markers.find((p) => p.kind === kind && p.index === idx);
            if (marker) {
                const local = portPositionOnRect(
                    marker,
                    machineWidth,
                    machineHeight,
                    rectW,
                    rectH,
                    rotation,
                );
                return { x: nodeX + local.x, y: nodeY + local.y };
            }
        }
    }
    if (kind === 'out') return { x: nodeX + rectW, y: nodeY + rectH / 2 };
    return { x: nodeX, y: nodeY + rectH / 2 };
}

/** 自節點資料讀取旋轉步數 */
export function nodeRotation(data: { rotation?: unknown } | undefined): GridRotation {
    return normalizeRotation(data?.rotation);
}

/** belt／pipe 色 */
export function portMediaColor(media: PortMedia): string {
    return media === 'pipe' ? '#0ea5e9' : '#f59e0b';
}

/**
 * 節點副標：mode 名＋入出埠數。
 */
export function modePortSummaryLabel(mode: MachineMode | null): string {
    if (!mode) return '無埠資料';
    return `${mode.label} · in${mode.input_ports.length}/out${mode.output_ports.length}`;
}

/**
 * 解析機器格數；未知機器預設 2×2。
 */
export function resolveMachineCells(
    machineType: string | undefined,
): { width: number; height: number } {
    if (!machineType) return { width: 2, height: 2 };
    const m = getMachine(machineType);
    if (!m) return { width: 2, height: 2 };
    return { width: m.width, height: m.height };
}
