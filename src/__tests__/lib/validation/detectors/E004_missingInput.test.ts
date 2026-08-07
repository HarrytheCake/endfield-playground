import { describe, it, expect, vi } from 'vitest';
import { E004_missingInput } from '@/lib/validation/detectors/E004_missingInput';
import type { ValidationContext } from '@/types/validation';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import type { Machine } from '@/types/machine';

// Mock getRecipesForMachine
vi.mock('@/data/products', () => ({
    getRecipesForMachine: vi.fn((machineType: string) => {
        if (machineType === 'test_req_in') {
            return [{ inputs: [{ itemId: 'itemA', quantity: 1 }], outputs: [] }];
        }
        if (machineType === 'test_no_req') {
            return [{ inputs: [], outputs: [] }];
        }
        return [];
    }),
}));

describe('E004_missingInput', () => {
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

    function createContext(devices: FactoryNode[], connections: FactoryEdge[]): ValidationContext {
        return {
            devices,
            connections,
            getDef: () => mockMachine,
            baseRegion: null,
        };
    }

    it('H1：無設備時不應產生錯誤', () => {
        const ctx = createContext([], []);
        const alerts = E004_missingInput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('H2：設備不需要輸入時，未接管線不應產生錯誤', () => {
        const device = createDevice('dev1', 'test_no_req');
        const ctx = createContext([device], []);
        const alerts = E004_missingInput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('H3：設備需要輸入且未接管線時，應產生一筆錯誤', () => {
        const device = createDevice('dev1', 'test_req_in');
        const ctx = createContext([device], []);
        const alerts = E004_missingInput.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('E004');
        expect(alerts[0].level).toBe('error');
        expect(alerts[0].relatedDeviceUids).toContain('dev1');
    });

    it('H4：設備需要輸入且已接管線時，不應產生錯誤', () => {
        const device = createDevice('dev1', 'test_req_in');
        const edge: FactoryEdge = {
            id: 'edge1',
            source: 'other_dev',
            target: 'dev1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'item' },
        };
        const ctx = createContext([device], [edge]);
        const alerts = E004_missingInput.run(ctx);

        expect(alerts).toHaveLength(0);
    });
});
