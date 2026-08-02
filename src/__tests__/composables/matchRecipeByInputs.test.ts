/**
 * V9-E1：matchRecipeByInputs 單元測試
 */
import { describe, it, expect } from 'vitest';
import {
    matchRecipeByInputs,
    buildGraph,
    validateChains,
    topologicalSort,
    propagateFlows,
} from '@/composables/useFlowEngine';
import type { FactoryNode, FactoryEdge } from '@/types/graph';

function makeNode(
    id: string,
    machineType: string,
    data: Record<string, unknown> = {},
): FactoryNode {
    return {
        id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: {
            label: machineType,
            machineType,
            ...data,
        },
    };
}

describe('matchRecipeByInputs()', () => {
    it('粉碎機：源礦→源石粉末；砂葉→砂葉粉末', () => {
        const yuan = matchRecipeByInputs('粉碎機', new Set(['源礦']), 'default');
        expect(yuan?.recipe.outputs[0]?.itemId).toBe('源石粉末');

        const sand = matchRecipeByInputs('粉碎機', new Set(['砂葉']), 'default');
        expect(sand?.recipe.outputs[0]?.itemId).toBe('砂葉粉末');
        expect(sand?.recipe.outputs[0]?.quantity).toBe(3);
    });

    it('精煉爐 liquid_mode：僅赤銅礦不匹配；齊全後匹配', () => {
        expect(matchRecipeByInputs('精煉爐', new Set(['赤銅礦']), 'liquid_mode')).toBeNull();

        const ok = matchRecipeByInputs('精煉爐', new Set(['赤銅礦', '清水']), 'liquid_mode');
        expect(ok).not.toBeNull();
        expect(ok!.recipe.outputs.some((o) => o.itemId === '赤銅塊')).toBe(true);
    });

    it('多配方同輸入集合時取資料順序第一', () => {
        // 碳塊：蕎花／砂葉／芽針為不同輸入，各唯一
        const a = matchRecipeByInputs('精煉爐', new Set(['蕎花']), 'base_mode');
        expect(a?.recipe.outputs[0]?.itemId).toBe('碳塊');

        // 若未來有重複輸入集合，第一條勝出——以粉碎機單一輸入為契約
        const first = matchRecipeByInputs('粉碎機', new Set(['源礦']), 'default');
        const again = matchRecipeByInputs('粉碎機', new Set(['源礦']), 'default');
        expect(first?.index).toBe(again?.index);
        expect(first?.recipe.id).toBe(again?.recipe.id);
    });

    it('environment 不符則不匹配（息壤 stable）', () => {
        const none = matchRecipeByInputs('天有洪爐', new Set(['碳塊', '清水']), 'default', 'none');
        expect(none).toBeNull();

        const stable = matchRecipeByInputs(
            '天有洪爐',
            new Set(['碳塊', '清水']),
            'default',
            'stable',
        );
        expect(stable?.recipe.outputs[0]?.itemId).toBe('息壤');
    });

    it('超集／空集合不匹配', () => {
        expect(matchRecipeByInputs('粉碎機', new Set(['源礦', '砂葉']), 'default')).toBeNull();
        expect(matchRecipeByInputs('粉碎機', new Set(), 'default')).toBeNull();
    });
});

describe('V9-E1 引擎整合：換料換產／缺料無產', () => {
    it('粉碎機接源礦產源石粉末；接砂葉產砂葉粉末', () => {
        const run = (material: string, expectedOut: string) => {
            const nodes = [
                makeNode('src', '基礎材料輸出點', {
                    machineMode: 'solid_belt',
                    primaryOutput: material,
                    sourceRatePerMin: 30,
                }),
                makeNode('crusher', '粉碎機', { machineMode: 'default' }),
                makeNode('sink', '物品輸入口'),
            ];
            const edges: FactoryEdge[] = [
                {
                    id: 'e1',
                    source: 'src',
                    target: 'crusher',
                    sourceHandle: 'out-0',
                    targetHandle: 'in-0',
                },
                {
                    id: 'e2',
                    source: 'crusher',
                    target: 'sink',
                    sourceHandle: 'out-0',
                    targetHandle: 'in-0',
                },
            ];
            const graph = buildGraph(nodes, edges);
            validateChains(graph);
            const sorted = topologicalSort(graph);
            const flows = propagateFlows(sorted, graph);
            expect(graph.nodes.get('crusher')!.isValid).toBe(true);
            expect(flows.get('e2')?.itemId).toBe(expectedOut);
            expect(graph.nodes.get('crusher')!.efficiency).toBeGreaterThan(0);
        };

        run('源礦', '源石粉末');
        run('砂葉', '砂葉粉末');
    });

    it('精煉爐僅赤銅礦（無清水）→ 無產出／非法', () => {
        const nodes = [
            makeNode('src', '基礎材料輸出點', {
                machineMode: 'solid_belt',
                primaryOutput: '赤銅礦',
                sourceRatePerMin: 30,
            }),
            makeNode('ref', '精煉爐', { machineMode: 'liquid_mode' }),
            makeNode('sink', '物品輸入口'),
        ];
        const edges: FactoryEdge[] = [
            {
                id: 'e1',
                source: 'src',
                target: 'ref',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
            {
                id: 'e2',
                source: 'ref',
                target: 'sink',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
        ];
        const graph = buildGraph(nodes, edges);
        validateChains(graph);
        expect(graph.nodes.get('ref')!.isValid).toBe(false);
        expect(graph.nodes.get('ref')!.outputRates.size).toBe(0);

        const sorted = topologicalSort(graph);
        const flows = propagateFlows(sorted, graph);
        expect(flows.get('e2')).toBeUndefined();
    });

    it('精煉爐赤銅礦＋清水齊全後有赤銅塊產出', () => {
        const nodes = [
            makeNode('ore', '基礎材料輸出點', {
                machineMode: 'solid_belt',
                primaryOutput: '赤銅礦',
                sourceRatePerMin: 30,
            }),
            makeNode('water', '基礎材料輸出點', {
                machineMode: 'fluid_pipe',
                primaryOutput: '清水',
                sourceRatePerMin: 30,
            }),
            makeNode('ref', '精煉爐', { machineMode: 'liquid_mode' }),
            makeNode('sink', '物品輸入口'),
        ];
        const edges: FactoryEdge[] = [
            {
                id: 'e1',
                source: 'ore',
                target: 'ref',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
            {
                id: 'e2',
                source: 'water',
                target: 'ref',
                sourceHandle: 'out-0',
                targetHandle: 'in-3', // liquid_mode 左側 pipe
            },
            {
                id: 'e3',
                source: 'ref',
                target: 'sink',
                sourceHandle: 'out-1', // bottom belt（固體赤銅塊）
                targetHandle: 'in-0',
            },
        ];
        const graph = buildGraph(nodes, edges);
        validateChains(graph);
        expect(graph.nodes.get('ref')!.isValid).toBe(true);

        const sorted = topologicalSort(graph);
        const flows = propagateFlows(sorted, graph);
        expect(graph.nodes.get('ref')!.efficiency).toBeGreaterThan(0);
        expect(flows.get('e3')?.itemId).toBe('赤銅塊');
    });
});
