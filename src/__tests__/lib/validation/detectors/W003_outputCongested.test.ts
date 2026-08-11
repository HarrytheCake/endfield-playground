import { describe, it, expect } from 'vitest';
import { W003_outputCongested } from '@/lib/validation/detectors/W003_outputCongested';
import type { ValidationContext } from '@/types/validation';
import type { FactoryEdge } from '@/types/graph';

describe('W003_outputCongested', () => {
    function createContext(
        connections: FactoryEdge[],
        congestedEdges?: Set<string>,
    ): ValidationContext {
        return {
            devices: [],
            connections,
            getDef: () => undefined,
            baseRegion: null,
            congestedEdges,
        };
    }

    it('H1：阻塞資料未提供時，不應產生警示', () => {
        const ctx = createContext([], undefined);
        const alerts = W003_outputCongested.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('H2：沒有阻塞管線時，不產生警示', () => {
        const edge: FactoryEdge = {
            id: 'edge1',
            source: 'dev1',
            target: 'dev2',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'item' },
        };
        const ctx = createContext([edge], new Set());
        const alerts = W003_outputCongested.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('H3：存在阻塞管線時，應產生 W003 警示並對應正確設備與連線', () => {
        const edge1: FactoryEdge = {
            id: 'edge1',
            source: 'dev1',
            target: 'dev2',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'item' },
        };
        const edge2: FactoryEdge = {
            id: 'edge2',
            source: 'dev3',
            target: 'dev4',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'item' },
        };
        const ctx = createContext([edge1, edge2], new Set(['edge1']));
        const alerts = W003_outputCongested.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('W003');
        expect(alerts[0].level).toBe('warning');
        // 確保 relatedDeviceUids 正確抓到該連線的 source 設備
        expect(alerts[0].relatedDeviceUids).toContain('dev1');
        expect(alerts[0].relatedConnectionUids).toContain('edge1');
    });
});
