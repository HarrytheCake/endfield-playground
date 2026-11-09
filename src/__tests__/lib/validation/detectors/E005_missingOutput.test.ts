import { describe, it, expect, vi } from 'vitest';
import { E005_missingOutput } from '@/lib/validation/detectors/E005_missingOutput';
import { getMachine } from '@/data/machines';
import type { ValidationContext } from '@/types/validation';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import type { Machine } from '@/types/machine';

vi.mock('@/data/products', () => ({
    getRecipesForMachine: vi.fn((machineName: string, modeId?: string) => {
        if (machineName === '加工機A') {
            return [
                {
                    id: 'r1',
                    inputs: [{ itemId: 'itemA', quantity: 1 }],
                    outputs: [{ itemId: 'itemB', quantity: 1 }],
                },
            ];
        }
        if (machineName === '無產出加工機') {
            return [{ id: 'r2', inputs: [{ itemId: 'itemA', quantity: 1 }], outputs: [] }];
        }
        if (machineName === '多模式機') {
            if (modeId === 'craft_mode') {
                return [
                    {
                        id: 'r3',
                        inputs: [{ itemId: 'itemA', quantity: 1 }],
                        outputs: [{ itemId: 'itemB', quantity: 1 }],
                    },
                ];
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
        if (
            machineType === '採礦機' ||
            machineType === 'source_machine' ||
            machineType === 'miner'
        ) {
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
        if (machineType === '物品輸入口' || machineType === 'sink_node' || machineType === 'sink') {
            return {
                id: 'sink',
                name: '物品輸入口',
                width: 1,
                height: 1,
                power: 0,
                tags: ['物流設備'],
                is_source: false,
                is_sink: true,
                modes: [
                    {
                        id: 'default',
                        label: 'Default',
                        input_ports: [{ side: 'top', offset: 0, media: 'belt' }],
                        output_ports: [],
                        loss: null,
                    },
                ],
                onTick: null,
                onInput: null,
                onOutput: null,
                calcEfficiency: null,
            };
        }
        if (machineType === '加工機A' || machineType === 'processor_a') {
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
        if (machineType === '無產出加工機') {
            return {
                id: 'no_output_processor',
                name: '無產出加工機',
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
        if (machineType === '無輸出埠設備') {
            return {
                id: 'no_output_port',
                name: '無輸出埠設備',
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
                        input_ports: [{ side: 'top', offset: 0, media: 'belt' }],
                        output_ports: [],
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

describe('E005_missingOutput', () => {
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
            /** V17：偵測器只走 getDef；測試以 mock getMachine 充當查表 */
            getDef: getMachine,
            baseRegion: null as any,
        };
    }

    it('T1：無設備時不應產生錯誤', () => {
        const ctx = createContext([], []);
        const alerts = E005_missingOutput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T2：匯出點（is_sink: true）即使無出邊也不觸發 E005', () => {
        const sink = createDevice('sink1', '物品輸入口');
        const ctx = createContext([sink], []);
        const alerts = E005_missingOutput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T3：加工機已有出邊連接，不觸發 E005', () => {
        const proc = createDevice('proc1', '加工機A');
        const sink = createDevice('sink1', '物品輸入口');
        const edge: FactoryEdge = {
            id: 'e1',
            source: 'proc1',
            target: 'sink1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const ctx = createContext([proc, sink], [edge]);
        const alerts = E005_missingOutput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T4：需產出材料的加工機無任何出邊，觸發 E005', () => {
        const proc = createDevice('proc1', '加工機A');
        const ctx = createContext([proc], []);
        const alerts = E005_missingOutput.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('E005');
        expect(alerts[0].level).toBe('error');
        expect(alerts[0].message).toContain('加工機A');
        expect(alerts[0].message).toContain('缺少輸出');
        expect(alerts[0].relatedDeviceUids).toEqual(['proc1']);
        expect(alerts[0].relatedConnectionUids).toEqual([]);
        expect(typeof alerts[0].uid).toBe('string');
    });

    it('T5：設備無輸出埠時不觸發 E005', () => {
        const noOutputPortMachine = createDevice('m1', '無輸出埠設備');
        const ctx = createContext([noOutputPortMachine], []);
        const alerts = E005_missingOutput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T6：設備無產出配方（例如分流器或無產出加工機）時不觸發 E005', () => {
        const splitter = createDevice('s1', '分流器');
        const noOutputProc = createDevice('f1', '無產出加工機');
        const ctx = createContext([splitter, noOutputProc], []);
        const alerts = E005_missingOutput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T7：源機（is_source: true）無任何出邊，觸發 E005', () => {
        const miner = createDevice('miner1', '採礦機');
        const ctx = createContext([miner], []);
        const alerts = E005_missingOutput.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('E005');
        expect(alerts[0].level).toBe('error');
        expect(alerts[0].message).toContain('採礦機');
        expect(alerts[0].message).toContain('缺少輸出');
        expect(alerts[0].relatedDeviceUids).toEqual(['miner1']);
    });

    it('T8：源機（is_source: true）已有出邊連接，不觸發 E005', () => {
        const miner = createDevice('miner1', '採礦機');
        const proc = createDevice('proc1', '加工機A');
        const edge: FactoryEdge = {
            id: 'e1',
            source: 'miner1',
            target: 'proc1',
            sourceHandle: null,
            targetHandle: null,
        };
        const ctx = createContext([miner, proc], [edge]);
        const alerts = E005_missingOutput.run(ctx);
        // miner1 有出邊，proc1 沒出邊（但此處只看 miner1，proc1 會報 E005）
        const minerAlerts = alerts.filter((a) => a.relatedDeviceUids.includes('miner1'));
        expect(minerAlerts).toHaveLength(0);
    });

    it('T9：多設備場景下僅未連接出邊的產出設備報 E005', () => {
        const miner = createDevice('miner1', '採礦機');
        const connectedProc = createDevice('proc1', '加工機A');
        const unconnectedProc = createDevice('proc2', '加工機A');
        const sink = createDevice('sink1', '物品輸入口');
        const edge1: FactoryEdge = {
            id: 'e1',
            source: 'miner1',
            target: 'proc1',
            sourceHandle: null,
            targetHandle: null,
        };
        const edge2: FactoryEdge = {
            id: 'e2',
            source: 'proc1',
            target: 'sink1',
            sourceHandle: null,
            targetHandle: null,
        };
        // miner1 有出邊 (e1)，proc1 有出邊 (e2)，sink1 是匯出點不報，只有 proc2 沒出邊且有產出
        const ctx = createContext([miner, connectedProc, unconnectedProc, sink], [edge1, edge2]);
        const alerts = E005_missingOutput.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('E005');
        expect(alerts[0].relatedDeviceUids).toEqual(['proc2']);
    });

    it('T10：查無定義之未知設備不報錯', () => {
        const unknownDevice = createDevice('unknown1', '神秘未知設備');
        const ctx = createContext([unknownDevice], []);
        const alerts = E005_missingOutput.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T11：依據 machineMode 判定配方產出需求', () => {
        // craft_mode 有產出，沒接出邊應報錯
        const craftMachine = createDevice('m1', '多模式機', { machineMode: 'craft_mode' });
        const alertsCraft = E005_missingOutput.run(createContext([craftMachine], []));
        expect(alertsCraft).toHaveLength(1);
        expect(alertsCraft[0].code).toBe('E005');

        // idle_mode 無產出，沒接出邊不應報錯
        const idleMachine = createDevice('m2', '多模式機', { machineMode: 'idle_mode' });
        const alertsIdle = E005_missingOutput.run(createContext([idleMachine], []));
        expect(alertsIdle).toHaveLength(0);
    });

    it('T12（V17／#73）：英文 id 加工機無出邊 → E005', () => {
        const proc = createDevice('proc1', 'processor_a');
        const alerts = E005_missingOutput.run(createContext([proc], []));

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('E005');
        expect(alerts[0].message).toContain('加工機A');
        expect(alerts[0].relatedDeviceUids).toEqual(['proc1']);
    });
});
