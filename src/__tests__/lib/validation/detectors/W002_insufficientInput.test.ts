import { describe, it, expect, vi } from 'vitest';
import { W002_insufficientInput } from '@/lib/validation/detectors/W002_insufficientInput';
import type { ValidationContext } from '@/types/validation';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import type { Machine } from '@/types/machine';
import type { EdgeFlow } from '@/types/flow';

// Mock getRecipesForMachine
vi.mock('@/data/products', () => ({
    getRecipesForMachine: vi.fn((machineType: string) => {
        if (machineType === 'test_req_in') {
            // 需要 1 個 itemA，耗時 60 秒 -> 理論需求速率 = 1 / min
            return [{ inputs: [{ itemId: 'itemA', quantity: 1 }], outputs: [], timeSeconds: 60 }];
        }
        if (machineType === 'test_no_req') {
            return [{ inputs: [], outputs: [], timeSeconds: 60 }];
        }
        return [];
    }),
}));

describe('W002_insufficientInput', () => {
    const mockMachine: Machine = {
        id: 'mock_machine',
        name: '測試設備',
        width: 1,
        height: 1,
        input_ports: [],
        output_ports: [],
        power: 10,
        tags: [],
        is_source: false,
        is_sink: false,
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    };

    function createDevice(id: string, machineType: string, recipeIndex = 0): FactoryNode {
        return {
            id,
            type: 'factory-node',
            position: { x: 0, y: 0 },
            data: {
                label: '測試',
                machineType,
                recipeIndex,
            },
        };
    }

    function createContext(
        devices: FactoryNode[],
        connections: FactoryEdge[],
        edgeFlows?: Map<string, EdgeFlow>,
    ): ValidationContext {
        return {
            devices,
            connections,
            getDef: () => mockMachine,
            baseRegion: null,
            edgeFlows,
        };
    }

    it('H1：流量資料未提供時，不應產生警示', () => {
        const device = createDevice('dev1', 'test_req_in');
        const ctx = createContext([device], [], undefined); // 沒有 edgeFlows
        const alerts = W002_insufficientInput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('H2：無設備時，不產生警示', () => {
        const ctx = createContext([], [], new Map());
        const alerts = W002_insufficientInput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('H3：設備不需要輸入時，不產生警示', () => {
        const device = createDevice('dev1', 'test_no_req');
        const ctx = createContext([device], [], new Map());
        const alerts = W002_insufficientInput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('H4：實際供給流量充足時，不產生警示', () => {
        const device = createDevice('dev1', 'test_req_in');
        const edge: FactoryEdge = {
            id: 'edge1',
            source: 'other_dev',
            target: 'dev1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'item' },
        };
        const edgeFlows = new Map<string, EdgeFlow>([
            ['edge1', { connectionUid: 'edge1', itemId: 'itemA', rate: 1, isCongested: false }],
        ]);
        const ctx = createContext([device], [edge], edgeFlows);
        const alerts = W002_insufficientInput.run(ctx);

        // 需求 1/min，實際 1/min -> 充足
        expect(alerts).toHaveLength(0);
    });

    it('H5：實際供給流量不足時，產生 W002 警示', () => {
        const device = createDevice('dev1', 'test_req_in');
        const edge: FactoryEdge = {
            id: 'edge1',
            source: 'other_dev',
            target: 'dev1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'item' },
        };
        const edgeFlows = new Map<string, EdgeFlow>([
            ['edge1', { connectionUid: 'edge1', itemId: 'itemA', rate: 0.5, isCongested: false }],
        ]);
        const ctx = createContext([device], [edge], edgeFlows);
        const alerts = W002_insufficientInput.run(ctx);

        // 需求 1/min，實際 0.5/min -> 不足
        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('W002');
        expect(alerts[0].level).toBe('warning');
        expect(alerts[0].relatedDeviceUids).toContain('dev1');
    });

    it('H6：完全無供給流量（未接管線或管線內無物）時，產生 W002 警示', () => {
        const device = createDevice('dev1', 'test_req_in');
        // 沒有管線，也沒有流量
        const ctx = createContext([device], [], new Map());
        const alerts = W002_insufficientInput.run(ctx);

        // 需求 1/min，實際 0/min -> 不足
        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('W002');
    });
});
