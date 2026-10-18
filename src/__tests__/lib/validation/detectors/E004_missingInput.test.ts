import { describe, it, expect, vi } from 'vitest';
import { E004_missingInput } from '@/lib/validation/detectors/E004_missingInput';
import type { ValidationContext } from '@/types/validation';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import type { Machine } from '@/types/machine';

vi.mock('@/data/products', () => ({
    getRecipesForMachine: vi.fn((machineName: string, modeId?: string) => {
        if (machineName === '加工機A') {
            return [{ id: 'r1', inputs: [{ itemId: 'itemA', quantity: 1 }], outputs: [] }];
        }
        if (machineName === '免材料加工機') {
            return [{ id: 'r2', inputs: [], outputs: [{ itemId: 'itemB', quantity: 1 }] }];
        }
        if (machineName === '多模式機') {
            if (modeId === 'craft_mode') {
                return [{ id: 'r3', inputs: [{ itemId: 'itemA', quantity: 1 }], outputs: [] }];
            }
            if (modeId === 'idle_mode') {
                return [{ id: 'r4', inputs: [], outputs: [] }];
            }
        }
        return [];
    }),
}));

vi.mock('@/data/machines', () => ({
    getMachine: vi.fn((machineType: string): Machine | undefined => {
        if (machineType === '採礦機' || machineType === 'source_machine') {
            return {
                id: 'miner',
                name: '採礦機',
                width: 2,
                height: 2,
                power: 10,
                tags: ['基礎生產'],
                is_source: true,
                is_sink: false,
                modes: [
                    {
                        id: 'default',
                        label: 'Default',
                        input_ports: [],
                        output_ports: [{ side: 'bottom', offset: 0, media: 'belt' }],
                        loss: null,
                    },
                ],
                onTick: null,
                onInput: null,
                onOutput: null,
                calcEfficiency: null,
            };
        }
        if (machineType === '加工機A') {
            return {
                id: 'processor_a',
                name: '加工機A',
                width: 2,
                height: 2,
                power: 15,
                tags: ['合成製造'],
                is_source: false,
                is_sink: false,
                modes: [
                    {
                        id: 'default',
                        label: 'Default',
                        input_ports: [{ side: 'top', offset: 0, media: 'belt' }],
                        output_ports: [{ side: 'bottom', offset: 0, media: 'belt' }],
                        loss: null,
                    },
                ],
                onTick: null,
                onInput: null,
                onOutput: null,
                calcEfficiency: null,
            };
        }
        if (machineType === '免材料加工機') {
            return {
                id: 'free_processor',
                name: '免材料加工機',
                width: 1,
                height: 1,
                power: 5,
                tags: ['基礎生產'],
                is_source: false,
                is_sink: false,
                modes: [
                    {
                        id: 'default',
                        label: 'Default',
                        input_ports: [{ side: 'top', offset: 0, media: 'belt' }],
                        output_ports: [{ side: 'bottom', offset: 0, media: 'belt' }],
                        loss: null,
                    },
                ],
                onTick: null,
                onInput: null,
                onOutput: null,
                calcEfficiency: null,
            };
        }
        if (machineType === '分流器') {
            return {
                id: 'splitter',
                name: '分流器',
                width: 1,
                height: 1,
                power: 0,
                tags: ['物流設備'],
                is_source: false,
                is_sink: false,
                modes: [
                    {
                        id: 'default',
                        label: 'Default',
                        input_ports: [{ side: 'top', offset: 0, media: 'belt' }],
                        output_ports: [{ side: 'bottom', offset: 0, media: 'belt' }],
                        loss: null,
                    },
                ],
                onTick: null,
                onInput: null,
                onOutput: null,
                calcEfficiency: null,
            };
        }
        if (machineType === '無輸入口設備') {
            return {
                id: 'no_input_port',
                name: '無輸入口設備',
                width: 1,
                height: 1,
                power: 10,
                tags: ['基礎生產'],
                is_source: false,
                is_sink: false,
                modes: [
                    {
                        id: 'default',
                        label: 'Default',
                        input_ports: [],
                        output_ports: [{ side: 'bottom', offset: 0, media: 'belt' }],
                        loss: null,
                    },
                ],
                onTick: null,
                onInput: null,
                onOutput: null,
                calcEfficiency: null,
            };
        }
        if (machineType === '多模式機') {
            return {
                id: 'multi_mode',
                name: '多模式機',
                width: 2,
                height: 2,
                power: 20,
                tags: ['合成製造'],
                is_source: false,
                is_sink: false,
                modes: [
                    {
                        id: 'craft_mode',
                        label: 'Craft',
                        input_ports: [{ side: 'top', offset: 0, media: 'belt' }],
                        output_ports: [{ side: 'bottom', offset: 0, media: 'belt' }],
                        loss: null,
                    },
                    {
                        id: 'idle_mode',
                        label: 'Idle',
                        input_ports: [{ side: 'top', offset: 0, media: 'belt' }],
                        output_ports: [{ side: 'bottom', offset: 0, media: 'belt' }],
                        loss: null,
                    },
                ],
                onTick: null,
                onInput: null,
                onOutput: null,
                calcEfficiency: null,
            };
        }
        return undefined;
    }),
}));

describe('E004_missingInput', () => {
    function createDevice(
        id: string,
        machineType: string,
        options: { machineMode?: string; recipeIndex?: number } = {},
    ): FactoryNode {
        return {
            id,
            type: 'factory-node',
            position: { x: 0, y: 0 },
            data: {
                label: machineType,
                machineType,
                machineMode: options.machineMode,
                recipeIndex: options.recipeIndex ?? 0,
            },
        };
    }

    function createContext(devices: FactoryNode[], connections: FactoryEdge[]): ValidationContext {
        return {
            devices,
            connections,
            getDef: () => undefined,
            baseRegion: null as any,
        };
    }

    it('T1：無設備時不應產生錯誤', () => {
        const ctx = createContext([], []);
        const alerts = E004_missingInput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T2：源機（is_source: true）即使無入邊也不觸發 E004', () => {
        const miner = createDevice('miner1', '採礦機');
        const ctx = createContext([miner], []);
        const alerts = E004_missingInput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T3：加工機已有入邊連接，不觸發 E004', () => {
        const miner = createDevice('miner1', '採礦機');
        const proc = createDevice('proc1', '加工機A');
        const edge: FactoryEdge = {
            id: 'e1',
            source: 'miner1',
            target: 'proc1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const ctx = createContext([miner, proc], [edge]);
        const alerts = E004_missingInput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T4：需輸入材料的加工機無任何入邊，觸發 E004', () => {
        const proc = createDevice('proc1', '加工機A');
        const ctx = createContext([proc], []);
        const alerts = E004_missingInput.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('E004');
        expect(alerts[0].level).toBe('error');
        expect(alerts[0].message).toContain('加工機A');
        expect(alerts[0].message).toContain('缺少輸入');
        expect(alerts[0].relatedDeviceUids).toEqual(['proc1']);
        expect(alerts[0].relatedConnectionUids).toEqual([]);
        expect(typeof alerts[0].uid).toBe('string');
    });

    it('T5：設備無輸入埠時不觸發 E004', () => {
        const noInputPortMachine = createDevice('m1', '無輸入口設備');
        const ctx = createContext([noInputPortMachine], []);
        const alerts = E004_missingInput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T6：設備無需要輸入的配方（例如分流器或免材料加工機）時不觸發 E004', () => {
        const splitter = createDevice('s1', '分流器');
        const freeProc = createDevice('f1', '免材料加工機');
        const ctx = createContext([splitter, freeProc], []);
        const alerts = E004_missingInput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T7：多設備場景下僅未連接入邊的加工機報 E004', () => {
        const miner = createDevice('miner1', '採礦機');
        const connectedProc = createDevice('proc1', '加工機A');
        const unconnectedProc = createDevice('proc2', '加工機A');
        const edge: FactoryEdge = {
            id: 'e1',
            source: 'miner1',
            target: 'proc1',
            sourceHandle: null,
            targetHandle: null,
        };
        const ctx = createContext([miner, connectedProc, unconnectedProc], [edge]);
        const alerts = E004_missingInput.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('E004');
        expect(alerts[0].relatedDeviceUids).toEqual(['proc2']);
    });

    it('T8：查無定義之未知設備不報錯', () => {
        const unknownDevice = createDevice('unknown1', '神秘未知設備');
        const ctx = createContext([unknownDevice], []);
        const alerts = E004_missingInput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T9：依據 machineMode 判定配方需求', () => {
        // craft_mode 需要輸入，沒接線應報錯
        const craftMachine = createDevice('m1', '多模式機', { machineMode: 'craft_mode' });
        const alertsCraft = E004_missingInput.run(createContext([craftMachine], []));
        expect(alertsCraft).toHaveLength(1);
        expect(alertsCraft[0].code).toBe('E004');

        // idle_mode 不需要輸入，沒接線不應報錯
        const idleMachine = createDevice('m2', '多模式機', { machineMode: 'idle_mode' });
        const alertsIdle = E004_missingInput.run(createContext([idleMachine], []));
        expect(alertsIdle).toHaveLength(0);
    });
});
