/**
 * Dev 拓樸／機器預覽共用：依 machineMode 的 ports 計算示意座標。
 */
import { getMachine, getMachineMode } from '@/data/machines';
import type { MachineMode, PortDef, PortMedia, PortSide } from '@/types/machine';

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

function maxOffsetOnSide(ports: readonly PortDef[], side: PortSide): number {
    const list = ports.filter((p) => p.side === side);
    if (!list.length) return 0;
    return Math.max(...list.map((p) => p.offset), 0);
}

/**
 * 埠在節點矩形上的絕對座標（節點左上為 origin 時用 x/y 偏移）。
 */
export function portPositionOnRect(
    marker: TopologyPortMarker,
    mode: MachineMode,
    rectW: number,
    rectH: number,
): { x: number; y: number } {
    const ports = marker.kind === 'in' ? mode.input_ports : mode.output_ports;
    const maxOff = Math.max(maxOffsetOnSide(ports, marker.side), 1);
    const t = (marker.offset + 0.5) / (maxOff + 1);

    switch (marker.side) {
        case 'top':
            return { x: t * rectW, y: 0 };
        case 'bottom':
            return { x: t * rectW, y: rectH };
        case 'left':
            return { x: 0, y: t * rectH };
        case 'right':
            return { x: rectW, y: t * rectH };
    }
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

/**
 * 邊端點：有 handle 時對齊對應埠，否則用節點左右中點。
 */
export function edgeEndpoint(
    nodeX: number,
    nodeY: number,
    rectW: number,
    rectH: number,
    mode: MachineMode | null,
    kind: TopologyPortKind,
    handle: string | null | undefined,
): { x: number; y: number } {
    if (mode) {
        const idx = parseTopologyHandleIndex(handle, kind);
        if (idx != null) {
            const markers = listModePortMarkers(mode);
            const marker = markers.find((p) => p.kind === kind && p.index === idx);
            if (marker) {
                const local = portPositionOnRect(marker, mode, rectW, rectH);
                return { x: nodeX + local.x, y: nodeY + local.y };
            }
        }
    }
    // 後備：出右邊中、入左邊中
    if (kind === 'out') return { x: nodeX + rectW, y: nodeY + rectH / 2 };
    return { x: nodeX, y: nodeY + rectH / 2 };
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
