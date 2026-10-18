/**
 * V17-F1：layout 快照（英文 id）→ toTopology → 引擎建圖／傳播
 *
 * #73 驗收釘死產線：
 *   material_source（源礦 30/min）→ crusher → item_sink
 * 產耗各 30/min。
 *
 * 接法與 V16-D1 一致：經 toTopology；不雙寫 editorStore。
 */

import { describe, it, expect } from 'vitest';
import type { Connection, PlacedDevice, Pipeline } from '@/types/layout';
import {
    buildGraph,
    validateChains,
    topologicalSort,
    propagateFlows,
    calcItemSummary,
} from '@/composables/useFlowEngine';
import { toTopology } from '@/utils/layout/toTopology';

/** 對 nodes／edges 跑一輪引擎（純函式；不碰 store） */
function runOnTopology(nodes: ReturnType<typeof toTopology>['nodes'], edges: ReturnType<typeof toTopology>['edges']) {
    const graph = buildGraph(nodes, edges);
    validateChains(graph);
    const sorted = topologicalSort(graph);
    const edgeFlows = propagateFlows(sorted, graph);
    const itemSummary = calcItemSummary(graph);
    return { graph, edgeFlows, itemSummary };
}

function beltPipeline(id: string, fromX: number, toX: number, y = 1): Pipeline {
    return {
        id,
        media: 'belt',
        waypoints: [
            { x: fromX, y, z: 0 },
            { x: toX, y, z: 0 },
        ],
    };
}

describe('V17-F1：toTopology → 引擎（英文 id 產線）', () => {
    it('源→粉碎機→輸入口：產耗各 30/min', () => {
        const devices: PlacedDevice[] = [
            {
                id: 'src',
                machineType: 'material_source',
                position: { x: 0, y: 0, z: 0 },
                rotation: 0,
                machineMode: 'solid_belt',
                primaryOutput: '源礦',
                sourceRatePerMin: 30,
            },
            {
                id: 'crusher',
                machineType: 'crusher',
                position: { x: 4, y: 0, z: 0 },
                rotation: 0,
                machineMode: 'default',
            },
            {
                id: 'sink',
                machineType: 'item_sink',
                position: { x: 10, y: 0, z: 0 },
                rotation: 0,
                machineMode: 'default',
            },
        ];

        const pipelines: Pipeline[] = [
            beltPipeline('p-src-crusher', 1, 3),
            beltPipeline('p-crusher-sink', 7, 9),
        ];

        const connections: Connection[] = [
            {
                id: 'p-src-crusher',
                pipelineId: 'p-src-crusher',
                from: { deviceId: 'src', portType: 'output', portIndex: 0 },
                to: { deviceId: 'crusher', portType: 'input', portIndex: 0 },
            },
            {
                id: 'p-crusher-sink',
                pipelineId: 'p-crusher-sink',
                from: { deviceId: 'crusher', portType: 'output', portIndex: 0 },
                to: { deviceId: 'sink', portType: 'input', portIndex: 0 },
            },
        ];

        const { nodes, edges } = toTopology(devices, pipelines, connections);
        expect(nodes.map((n) => n.data?.machineType)).toEqual([
            'material_source',
            'crusher',
            'item_sink',
        ]);
        expect(nodes[0]?.data?.primaryOutput).toBe('源礦');
        expect(nodes[0]?.data?.sourceRatePerMin).toBe(30);
        expect(edges).toHaveLength(2);

        const { graph, edgeFlows, itemSummary } = runOnTopology(nodes, edges);

        // 源／sink／合法鏈
        expect(graph.nodes.get('src')!.isSource).toBe(true);
        expect(graph.nodes.get('sink')!.isSink).toBe(true);
        expect(graph.nodes.get('crusher')!.isValid).toBe(true);
        expect(graph.nodes.get('crusher')!.efficiency).toBe(1);

        // 源產出 30；粉碎機吞吐 源礦→源石粉末 30
        expect(graph.nodes.get('src')!.outputRates.get('源礦')).toBe(30);
        expect(graph.nodes.get('crusher')!.inputRates.get('源礦')).toBe(30);
        expect(graph.nodes.get('crusher')!.outputRates.get('源石粉末')).toBe(30);
        expect(graph.nodes.get('sink')!.inputRates.get('源石粉末')).toBe(30);

        // 邊流量 30/min
        expect(edgeFlows.get('p-src-crusher')).toMatchObject({
            itemId: '源礦',
            rate: 30,
        });
        expect(edgeFlows.get('p-crusher-sink')).toMatchObject({
            itemId: '源石粉末',
            rate: 30,
        });

        // 品項統計：源礦淨產≈0（源出＝粉碎入）；源石粉末淨產≈0（粉碎出＝sink 入）
        const ore = itemSummary.find((s) => s.itemId === '源礦');
        const powder = itemSummary.find((s) => s.itemId === '源石粉末');
        expect(ore?.produced).toBeCloseTo(30, 5);
        expect(ore?.consumed).toBeCloseTo(30, 5);
        expect(powder?.produced).toBeCloseTo(30, 5);
        expect(powder?.consumed).toBeCloseTo(30, 5);
    });

    it('缺 primaryOutput 的源：不產數字（與現行引擎一致）', () => {
        const devices: PlacedDevice[] = [
            {
                id: 'src',
                machineType: 'material_source',
                position: { x: 0, y: 0, z: 0 },
                rotation: 0,
                machineMode: 'solid_belt',
                // 無 primaryOutput／sourceRatePerMin
            },
            {
                id: 'crusher',
                machineType: 'crusher',
                position: { x: 4, y: 0, z: 0 },
                rotation: 0,
                machineMode: 'default',
            },
            {
                id: 'sink',
                machineType: 'item_sink',
                position: { x: 10, y: 0, z: 0 },
                rotation: 0,
            },
        ];

        const pipelines: Pipeline[] = [
            beltPipeline('p1', 1, 3),
            beltPipeline('p2', 7, 9),
        ];
        const connections: Connection[] = [
            {
                id: 'p1',
                pipelineId: 'p1',
                from: { deviceId: 'src', portType: 'output', portIndex: 0 },
                to: { deviceId: 'crusher', portType: 'input', portIndex: 0 },
            },
            {
                id: 'p2',
                pipelineId: 'p2',
                from: { deviceId: 'crusher', portType: 'output', portIndex: 0 },
                to: { deviceId: 'sink', portType: 'input', portIndex: 0 },
            },
        ];

        const { nodes, edges } = toTopology(devices, pipelines, connections);
        const { graph, edgeFlows } = runOnTopology(nodes, edges);

        expect(graph.nodes.get('src')!.isSource).toBe(true);
        expect(graph.nodes.get('src')!.outputRates.size).toBe(0);
        expect(graph.nodes.get('crusher')!.outputRates.size).toBe(0);
        expect(edgeFlows.get('p1')).toBeUndefined();
        expect(edgeFlows.get('p2')).toBeUndefined();
    });
});
