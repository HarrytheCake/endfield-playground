/**
 * V9-C2 topologyPortUtils：WxH 格點＋ side／offset 埠定位
 */
import { describe, it, expect } from 'vitest';
import {
    resolveNodeMode,
    listModePortMarkers,
    parseTopologyHandleIndex,
    modePortSummaryLabel,
    edgeEndpoint,
    portPositionOnGrid,
    portPositionOnRect,
    clampPortOffset,
    listGridLines,
    resolveDisplayGrid,
} from '@/app/dev/topologyPortUtils';
import { getMachine } from '@/data/machines';

describe('topologyPortUtils', () => {
    it('精煉爐 liquid_mode 埠數與標籤', () => {
        const mode = resolveNodeMode('精煉爐', 'liquid_mode');
        expect(mode).not.toBeNull();
        const markers = listModePortMarkers(mode);
        expect(markers.filter((m) => m.kind === 'in').length).toBe(4);
        expect(markers.some((m) => m.media === 'pipe')).toBe(true);
        expect(modePortSummaryLabel(mode)).toContain('in4');
    });

    it('切 base_mode 後入埠為 3（皆 belt）', () => {
        const mode = resolveNodeMode('精煉爐', 'base_mode');
        expect(mode).not.toBeNull();
        const markers = listModePortMarkers(mode);
        expect(markers.filter((m) => m.kind === 'in').length).toBe(3);
        expect(markers.filter((m) => m.kind === 'in').every((m) => m.media === 'belt')).toBe(true);
    });

    it('parseTopologyHandleIndex／edgeEndpoint 對齊 out-0 格點中心', () => {
        expect(parseTopologyHandleIndex('out-0', 'out')).toBe(0);
        expect(parseTopologyHandleIndex(null, 'out')).toBeNull();
        const mode = resolveNodeMode('基礎材料輸出點', 'solid_belt');
        const machine = getMachine('基礎材料輸出點')!;
        const cell = 20;
        const rectW = machine.width * cell;
        const rectH = machine.height * cell;
        const p = edgeEndpoint(
            0,
            0,
            machine.width,
            machine.height,
            rectW,
            rectH,
            mode,
            'out',
            'out-0',
        );
        // right@offset1 on 1×3 → 中心 y = 1.5 * cell
        expect(p.x).toBe(rectW);
        expect(p.y).toBeCloseTo(1.5 * cell);
    });
});

describe('V9-C2 格點定位', () => {
    it('灌裝機 6×4：top offset=5 落在第 6 格中心', () => {
        const cell = 10;
        const pos = portPositionOnGrid('top', 5, 6, 4, 6 * cell, 4 * cell);
        expect(pos.x).toBeCloseTo(5.5 * cell);
        expect(pos.y).toBe(0);
        expect(pos.wasClamped).toBe(false);
    });

    it('灌裝機 base_mode：6 in／6 out；gas_liquid_mode 左側多 pipe 入', () => {
        const machine = getMachine('灌裝機')!;
        expect(machine.width).toBe(6);
        expect(machine.height).toBe(4);

        const base = resolveNodeMode('灌裝機', 'base_mode')!;
        const baseMarkers = listModePortMarkers(base);
        expect(baseMarkers.filter((m) => m.kind === 'in').length).toBe(6);
        expect(baseMarkers.filter((m) => m.kind === 'in' && m.side === 'left').length).toBe(0);

        const gas = resolveNodeMode('灌裝機', 'gas_liquid_mode')!;
        const gasMarkers = listModePortMarkers(gas);
        expect(gasMarkers.filter((m) => m.kind === 'in').length).toBe(7);
        const leftPipe = gasMarkers.find(
            (m) => m.kind === 'in' && m.side === 'left' && m.media === 'pipe',
        );
        expect(leftPipe).toBeDefined();
        expect(leftPipe!.offset).toBe(1);

        const cell = 20;
        const local = portPositionOnRect(
            leftPipe!,
            machine.width,
            machine.height,
            machine.width * cell,
            machine.height * cell,
        );
        expect(local.x).toBe(0);
        expect(local.y).toBeCloseTo(1.5 * cell);
    });

    it('offset 超出時 clamp', () => {
        const c = clampPortOffset('top', 9, 6, 4);
        expect(c.offset).toBe(5);
        expect(c.wasClamped).toBe(true);
        const pos = portPositionOnGrid('left', 99, 6, 4, 60, 40);
        expect(pos.offset).toBe(3);
        expect(pos.wasClamped).toBe(true);
    });

    it('listGridLines：6×4 產生 5 豎＋3 橫', () => {
        const lines = listGridLines(6, 4, 60, 40);
        expect(lines.filter((l) => l.key.startsWith('v')).length).toBe(5);
        expect(lines.filter((l) => l.key.startsWith('h')).length).toBe(3);
    });

    it('90° 旋轉後顯示格數寬高對調', () => {
        expect(resolveDisplayGrid(6, 4, 1)).toEqual({ widthCells: 4, heightCells: 6 });
        const pos = portPositionOnRect({ key: 'in-0', side: 'top', offset: 0 }, 6, 4, 40, 60, 1);
        // top@0 → right@0 on 4×6 display
        expect(pos.x).toBe(40);
        expect(pos.y).toBeCloseTo(0.5 * (60 / 6));
    });
});
