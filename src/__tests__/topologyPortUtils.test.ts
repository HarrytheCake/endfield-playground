/**
 * V8-D1 topologyPortUtils 單元測試
 */
import { describe, it, expect } from 'vitest';
import {
    resolveNodeMode,
    listModePortMarkers,
    parseTopologyHandleIndex,
    modePortSummaryLabel,
    edgeEndpoint,
} from '@/app/dev/topologyPortUtils';

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

    it('parseTopologyHandleIndex／edgeEndpoint 對齊 out-0', () => {
        expect(parseTopologyHandleIndex('out-0', 'out')).toBe(0);
        expect(parseTopologyHandleIndex(null, 'out')).toBeNull();
        const mode = resolveNodeMode('物品輸出口', 'default');
        const p = edgeEndpoint(0, 0, 100, 50, mode, 'out', 'out-0');
        expect(p.x).toBeGreaterThan(0);
    });
});
