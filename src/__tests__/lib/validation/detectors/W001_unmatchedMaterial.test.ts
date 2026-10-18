import { describe, it, expect, vi } from 'vitest';
import { W001_unmatchedMaterial } from '@/lib/validation/detectors/W001_unmatchedMaterial';
import { getMachine } from '@/data/machines';
import type { ValidationContext } from '@/types/validation';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import type { Machine } from '@/types/machine';

vi.mock('@/data/products', () => ({
    getRecipesForMachine: vi.fn((machineType: string, modeId?: string) => {
        if (machineType === 'test_machine_mode_switch') {
            if (modeId === 'mode_b') {
                return [{ inputs: [{ itemId: 'itemB', quantity: 1 }], outputs: [] }];
            }
            return [{ inputs: [{ itemId: 'itemA', quantity: 1 }], outputs: [] }];
        }
        if (machineType === 'test_machine_A') {
            return [{ inputs: [{ itemId: 'itemA', quantity: 1 }], outputs: [] }];
        }
        if (machineType === 'test_machine_B') {
            return [{ inputs: [{ itemId: 'itemB', quantity: 1 }], outputs: [] }];
        }
        if (machineType === 'test_machine_AB') {
            return [
                {
                    inputs: [
                        { itemId: 'itemA', quantity: 1 },
                        { itemId: 'itemB', quantity: 1 },
                    ],
                    outputs: [],
                },
            ];
        }
        if (machineType === 'test_producer_A') {
            return [{ inputs: [], outputs: [{ itemId: 'itemA', quantity: 1 }] }];
        }
        if (machineType === 'test_producer_B') {
            return [{ inputs: [], outputs: [{ itemId: 'itemB', quantity: 1 }] }];
        }
        if (machineType === 'test_producer_AB') {
            return [
                {
                    inputs: [],
                    outputs: [
                        { itemId: 'itemA', quantity: 1 },
                        { itemId: 'itemB', quantity: 1 },
                    ],
                },
            ];
        }
        return [];
    }),
}));

const ROUTING_NAMES = new Set(['分流器', '管道分流器', '匯流器', '管道匯流器', '物流橋', '管道橋']);

const ROUTING_IDS: Record<string, string> = {
    分流器: 'splitter',
    管道分流器: 'pipe_splitter',
    匯流器: 'merger',
    管道匯流器: 'pipe_merger',
    物流橋: 'logistics_bridge',
    管道橋: 'pipe_bridge',
};

vi.mock('@/data/machines', () => ({
    getMachine: vi.fn((machineType: string): Machine | undefined => {
        if (ROUTING_NAMES.has(machineType)) {
            return {
                id: ROUTING_IDS[machineType] ?? machineType,
                name: machineType,
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
        if (machineType === 'test_machine_mode_switch') {
            return {
                id: 'test_machine_mode_switch',
                name: 'test_machine_mode_switch',
                width: 1,
                height: 1,
                power: 10,
                tags: [],
                is_source: false,
                is_sink: false,
                modes: [
                    {
                        id: 'mode_a',
                        label: 'Mode A',
                        input_ports: [{ side: 'top', offset: 0, media: 'belt' }],
                        output_ports: [{ side: 'bottom', offset: 0, media: 'belt' }],
                        loss: null,
                    },
                    {
                        id: 'mode_b',
                        label: 'Mode B',
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
        return {
            id: machineType,
            name: machineType,
            width: 1,
            height: 1,
            power: 10,
            tags: [],
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
    }),
}));

describe('W001_unmatchedMaterial', () => {
    function createDevice(
        id: string,
        machineType: string,
        recipeIndex = 0,
        machineMode?: string,
    ): FactoryNode {
        return {
            id,
            type: 'factory-node',
            position: { x: 0, y: 0 },
            data: {
                label: machineType,
                machineType,
                recipeIndex,
                ...(machineMode ? { machineMode } : {}),
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
        const alerts = W001_unmatchedMaterial.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T2：完全匹配（上游產 A，下游需 A），不觸發 W001', () => {
        const prodA = createDevice('prodA', 'test_producer_A');
        const machA = createDevice('machA', 'test_machine_A');
        const edge: FactoryEdge = {
            id: 'e1',
            source: 'prodA',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const ctx = createContext([prodA, machA], [edge]);
        const alerts = W001_unmatchedMaterial.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T3：完全不符（上游產 B，下游需 A），觸發 W001', () => {
        const prodB = createDevice('prodB', 'test_producer_B');
        const machA = createDevice('machA', 'test_machine_A');
        const edge: FactoryEdge = {
            id: 'e1',
            source: 'prodB',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const ctx = createContext([prodB, machA], [edge]);
        const alerts = W001_unmatchedMaterial.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('W001');
        expect(alerts[0].relatedDeviceUids).toContain('machA');
    });

    it('T4：穿透分流器匹配（上游產 A -> 分流器 -> 下游需 A），不觸發 W001', () => {
        const prodA = createDevice('prodA', 'test_producer_A');
        const splitter = createDevice('split1', '分流器');
        const machA = createDevice('machA', 'test_machine_A');
        const edge1: FactoryEdge = {
            id: 'e1',
            source: 'prodA',
            target: 'split1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const edge2: FactoryEdge = {
            id: 'e2',
            source: 'split1',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        const ctx = createContext([prodA, splitter, machA], [edge1, edge2]);
        const alerts = W001_unmatchedMaterial.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T5：穿透分流器不符（上游產 B -> 分流器 -> 下游需 A），觸發 W001', () => {
        const prodB = createDevice('prodB', 'test_producer_B');
        const splitter = createDevice('split1', '分流器');
        const machA = createDevice('machA', 'test_machine_A');
        const edge1: FactoryEdge = {
            id: 'e1',
            source: 'prodB',
            target: 'split1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const edge2: FactoryEdge = {
            id: 'e2',
            source: 'split1',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        const ctx = createContext([prodB, splitter, machA], [edge1, edge2]);
        const alerts = W001_unmatchedMaterial.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('W001');
        expect(alerts[0].relatedDeviceUids).toContain('machA');
    });

    it('T6：未連接入邊不應觸發 W001（交由 E004 處理）', () => {
        const machA = createDevice('machA', 'test_machine_A');
        const ctx = createContext([machA], []);
        const alerts = W001_unmatchedMaterial.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T7：多餘材料（上游產 A＋B，下游僅需 A）應觸發 W001（集合完全吻合 Exact Set Match）', () => {
        const prodA = createDevice('prodA', 'test_producer_A');
        const prodB = createDevice('prodB', 'test_producer_B');
        const machA = createDevice('machA', 'test_machine_A'); // 僅需 itemA
        const edge1: FactoryEdge = {
            id: 'e1',
            source: 'prodA',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const edge2: FactoryEdge = {
            id: 'e2',
            source: 'prodB',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        const ctx = createContext([prodA, prodB, machA], [edge1, edge2]);
        const alerts = W001_unmatchedMaterial.run(ctx);

        // 舊版 every 子集判斷會誤判為合格；新版 Exact Set Match 必須正確檢出多餘材料
        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('W001');
        expect(alerts[0].relatedDeviceUids).toContain('machA');
        expect(alerts[0].message).toContain('test_machine_A');
    });

    it('T8：多輸入配方完全吻合（上游產 A 與 B，下游需 A＋B），不觸發 W001', () => {
        const prodA = createDevice('prodA', 'test_producer_A');
        const prodB = createDevice('prodB', 'test_producer_B');
        const machAB = createDevice('machAB', 'test_machine_AB'); // 需要 itemA 與 itemB
        const edge1: FactoryEdge = {
            id: 'e1',
            source: 'prodA',
            target: 'machAB',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const edge2: FactoryEdge = {
            id: 'e2',
            source: 'prodB',
            target: 'machAB',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        const ctx = createContext([prodA, prodB, machAB], [edge1, edge2]);
        const alerts = W001_unmatchedMaterial.run(ctx);

        expect(alerts).toHaveLength(0);
    });

    it('T9：缺少部分材料（上游僅產 A，下游需 A＋B），觸發 W001', () => {
        const prodA = createDevice('prodA', 'test_producer_A');
        const machAB = createDevice('machAB', 'test_machine_AB'); // 需要 itemA 與 itemB
        const edge1: FactoryEdge = {
            id: 'e1',
            source: 'prodA',
            target: 'machAB',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        const ctx = createContext([prodA, machAB], [edge1]);
        const alerts = W001_unmatchedMaterial.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('W001');
        expect(alerts[0].relatedDeviceUids).toContain('machAB');
    });

    it('T10：多路同源輸入不應被 visited 略過（同一上游以多條連線輸入下游）', () => {
        const prodAB = createDevice('prodAB', 'test_producer_AB');
        const machAB = createDevice('machAB', 'test_machine_AB');
        const edge1: FactoryEdge = {
            id: 'e1',
            source: 'prodAB',
            target: 'machAB',
            sourceHandle: 'port_1',
            targetHandle: 'port_1',
            data: { portType: 'belt' },
        };
        const edge2: FactoryEdge = {
            id: 'e2',
            source: 'prodAB',
            target: 'machAB',
            sourceHandle: 'port_2',
            targetHandle: 'port_2',
            data: { portType: 'belt' },
        };

        const ctx = createContext([prodAB, machAB], [edge1, edge2]);
        const alerts = W001_unmatchedMaterial.run(ctx);

        // 兩條入邊來自同一 sourceNode，第二條不應被 visited 阻斷，正常接收 itemA 與 itemB
        expect(alerts).toHaveLength(0);
    });

    it('T11：同源分流經不同分流器支線匯入下游，不被 visited 略過', () => {
        const prodA = createDevice('prodA', 'test_producer_A');
        const splitter1 = createDevice('split1', '分流器');
        const splitter2 = createDevice('split2', '分流器');
        const machA = createDevice('machA', 'test_machine_A');

        // prodA -> split1 -> machA
        const e1: FactoryEdge = {
            id: 'e1',
            source: 'prodA',
            target: 'split1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const e2: FactoryEdge = {
            id: 'e2',
            source: 'split1',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        // prodA -> split2 -> machA
        const e3: FactoryEdge = {
            id: 'e3',
            source: 'prodA',
            target: 'split2',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const e4: FactoryEdge = {
            id: 'e4',
            source: 'split2',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        const ctx = createContext([prodA, splitter1, splitter2, machA], [e1, e2, e3, e4]);
        const alerts = W001_unmatchedMaterial.run(ctx);

        expect(alerts).toHaveLength(0);
    });

    it('T12：穿透管道分流器匹配（驗證管道分流器名稱比對）', () => {
        const prodA = createDevice('prodA', 'test_producer_A');
        const pipeSplitter = createDevice('pipeSplit1', '管道分流器');
        const machA = createDevice('machA', 'test_machine_A');
        const edge1: FactoryEdge = {
            id: 'e1',
            source: 'prodA',
            target: 'pipeSplit1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'pipe' },
        };
        const edge2: FactoryEdge = {
            id: 'e2',
            source: 'pipeSplit1',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'pipe' },
        };

        const ctx = createContext([prodA, pipeSplitter, machA], [edge1, edge2]);
        const alerts = W001_unmatchedMaterial.run(ctx);

        expect(alerts).toHaveLength(0);
    });

    it('T13：圖形回路保護（分流器迴圈不導致無窮遞迴）', () => {
        const splitterA = createDevice('splitA', '分流器');
        const splitterB = createDevice('splitB', '分流器');
        const machA = createDevice('machA', 'test_machine_A');

        // splitA <-> splitB 回路
        const loop1: FactoryEdge = {
            id: 'l1',
            source: 'splitA',
            target: 'splitB',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const loop2: FactoryEdge = {
            id: 'l2',
            source: 'splitB',
            target: 'splitA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const toMach: FactoryEdge = {
            id: 'e1',
            source: 'splitA',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        const ctx = createContext([splitterA, splitterB, machA], [loop1, loop2, toMach]);
        // 應安全執行完畢，不拋出 Call Stack Exceeded
        const alerts = W001_unmatchedMaterial.run(ctx);

        // 因為回路中無任何實體產出，machA 沒有得到 itemA，應觸發 W001
        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('W001');
    });

    it('T14：源節點（is_source: true）透過 primaryOutput 輸出材料，下游材料不符時觸發 W001', () => {
        const itemSource: FactoryNode = {
            id: 'src1',
            type: 'factory-node',
            position: { x: 0, y: 0 },
            data: {
                label: '物品輸出口',
                machineType: '物品輸出口',
                primaryOutput: 'itemB', // 輸出 itemB
            },
        };
        const machA = createDevice('machA', 'test_machine_A'); // 需要 itemA
        const edge: FactoryEdge = {
            id: 'e1',
            source: 'src1',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        const ctx = createContext([itemSource, machA], [edge]);
        const alerts = W001_unmatchedMaterial.run(ctx);

        // 下游收到 itemB，不符合需要的 itemA，觸發 W001
        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('W001');
        expect(alerts[0].relatedDeviceUids).toContain('machA');
    });

    it('T15：穿透匯流器匹配（上游產 A -> 匯流器 -> 下游需 A），不觸發 W001', () => {
        const prodA = createDevice('prodA', 'test_producer_A');
        const merger = createDevice('merger1', '匯流器');
        const machA = createDevice('machA', 'test_machine_A');
        const edge1: FactoryEdge = {
            id: 'e1',
            source: 'prodA',
            target: 'merger1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const edge2: FactoryEdge = {
            id: 'e2',
            source: 'merger1',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        const ctx = createContext([prodA, merger, machA], [edge1, edge2]);
        const alerts = W001_unmatchedMaterial.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T16：穿透物流橋匹配（上游產 A -> 物流橋 -> 下游需 A），不觸發 W001', () => {
        const prodA = createDevice('prodA', 'test_producer_A');
        const bridge = createDevice('bridge1', '物流橋');
        const machA = createDevice('machA', 'test_machine_A');
        const edge1: FactoryEdge = {
            id: 'e1',
            source: 'prodA',
            target: 'bridge1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const edge2: FactoryEdge = {
            id: 'e2',
            source: 'bridge1',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        const ctx = createContext([prodA, bridge, machA], [edge1, edge2]);
        const alerts = W001_unmatchedMaterial.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T17：兩個源經匯流器合流（產 A ＋ 產 B -> 匯流器 -> 下游需 A+B），不觸發 W001', () => {
        const prodA = createDevice('prodA', 'test_producer_A');
        const prodB = createDevice('prodB', 'test_producer_B');
        const merger = createDevice('merger1', '匯流器');
        const machAB = createDevice('machAB', 'test_machine_AB'); // 需 itemA + itemB

        const edgeA: FactoryEdge = {
            id: 'eA',
            source: 'prodA',
            target: 'merger1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const edgeB: FactoryEdge = {
            id: 'eB',
            source: 'prodB',
            target: 'merger1',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const edgeOut: FactoryEdge = {
            id: 'eOut',
            source: 'merger1',
            target: 'machAB',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        const ctx = createContext([prodA, prodB, merger, machAB], [edgeA, edgeB, edgeOut]);
        const alerts = W001_unmatchedMaterial.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('T18：模式切換測試（同一設備切換 mode 後，W001 判定結果隨之改變）', () => {
        const prodA = createDevice('prodA', 'test_producer_A');
        const edge: FactoryEdge = {
            id: 'e1',
            source: 'prodA',
            target: 'machSwitch',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };

        // 1. 預設模式（mode_a，需 itemA）：收到 itemA -> 吻合，不報 W001
        const machModeA = createDevice('machSwitch', 'test_machine_mode_switch', 0, 'mode_a');
        const ctxA = createContext([prodA, machModeA], [edge]);
        const alertsA = W001_unmatchedMaterial.run(ctxA);
        expect(alertsA).toHaveLength(0);

        // 2. 切換至 mode_b（需 itemB）：收到 itemA -> 不吻合，觸發 W001
        const machModeB = createDevice('machSwitch', 'test_machine_mode_switch', 0, 'mode_b');
        const ctxB = createContext([prodA, machModeB], [edge]);
        const alertsB = W001_unmatchedMaterial.run(ctxB);
        expect(alertsB).toHaveLength(1);
        expect(alertsB[0].code).toBe('W001');
        expect(alertsB[0].relatedDeviceUids).toContain('machSwitch');
    });

    it('T19（V17／#73）：英文 id machineType＋材料不符 → W001（只經 getDef）', () => {
        const prodB = createDevice('prodB', 'test_producer_B');
        const machA = createDevice('machA', 'test_machine_A');
        const edge: FactoryEdge = {
            id: 'e1',
            source: 'prodB',
            target: 'machA',
            sourceHandle: null,
            targetHandle: null,
            data: { portType: 'belt' },
        };
        const ctx = createContext([prodB, machA], [edge]);
        const alerts = W001_unmatchedMaterial.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('W001');
        expect(alerts[0].relatedDeviceUids).toContain('machA');
    });
});
