/**
 * V9-H1-2 — 多輸出副產不應污染 E1 匹配；D1 赫銅零件鏈可合法
 */
import { describe, it, expect } from 'vitest';
import {
    matchRecipeByEdgeCandidates,
    buildGraph,
    validateChains,
    topologicalSort,
    propagateFlows,
} from '@/composables/useFlowEngine';
import { findShortestReverseChain } from '@/utils/reverseChain';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import type { ChainNode } from '@/utils/reverseChain';

describe('matchRecipeByEdgeCandidates()', () => {
    it('提純多輸出＋藍鐵粉末 → 仍匹配反應池赫銅塊（忽略沉積酸）', () => {
        const matched = matchRecipeByEdgeCandidates(
            '反應池',
            [['赫銅溶液', '沉積酸'], ['藍鐵粉末']],
            'default',
            'none',
        );
        expect(matched).not.toBeNull();
        expect(matched!.recipe.outputs.some((o) => o.itemId === '赫銅塊')).toBe(true);
    });

    it('反應池多輸出 → 配件機只收赫銅塊（忽略汙水）', () => {
        const matched = matchRecipeByEdgeCandidates(
            '配件機',
            [['赫銅塊', '汙水']],
            'default',
            'none',
        );
        expect(matched).not.toBeNull();
        expect(matched!.recipe.outputs.some((o) => o.itemId === '赫銅零件')).toBe(true);
    });

    it('扁平單品集合行為與 matchRecipeByInputs 一致', () => {
        const a = matchRecipeByEdgeCandidates('粉碎機', [['源礦']], 'default');
        expect(a?.recipe.outputs[0]?.itemId).toBe('源石粉末');
        expect(matchRecipeByEdgeCandidates('粉碎機', [['源礦'], ['砂葉']], 'default')).toBeNull();
    });
});

describe('D1 套用圖 — 赫銅零件', () => {
    const MATERIAL_SOURCE = '基礎材料輸出點';

    function makeNode(
        id: string,
        x: number,
        y: number,
        label: string,
        machineType: string,
        data: Record<string, unknown> = {},
    ): FactoryNode {
        return {
            id,
            type: 'default',
            position: { x, y },
            data: { label, machineType, ...data },
        };
    }

    function buildFromChain(root: ChainNode): { nodes: FactoryNode[]; edges: FactoryEdge[] } {
        const materialIds = new Map<string, string>();
        const productIds = new Map<string, string>();
        const nodes: FactoryNode[] = [];
        const edges: FactoryEdge[] = [];
        let seq = 0;
        let matLane = 0;

        function visit(n: ChainNode): string {
            if (n.kind === 'material') {
                let id = materialIds.get(n.itemId);
                if (!id) {
                    id = `src_${seq++}`;
                    materialIds.set(n.itemId, id);
                    nodes.push(
                        makeNode(id, 0, matLane * 90, n.itemId, MATERIAL_SOURCE, {
                            primaryOutput: n.itemId,
                        }),
                    );
                    matLane += 1;
                }
                return id;
            }

            const existing = productIds.get(n.itemId);
            if (existing) return existing;

            const childIds = (n.inputs ?? []).map((c) => visit(c));
            const id = `dev_${seq++}`;
            productIds.set(n.itemId, id);
            const machine = n.recipe?.machine ?? '粉碎機';
            const env = n.recipe?.environment;
            nodes.push(
                makeNode(id, productIds.size * 200, 80, `${machine}→${n.itemId}`, machine, {
                    machineMode: n.recipe?.machineMode,
                    environment: env && env !== 'none' ? env : undefined,
                    primaryOutput: n.itemId,
                }),
            );
            for (const src of childIds) {
                edges.push({ id: `e_${src}_${id}_${edges.length}`, source: src, target: id });
            }
            return id;
        }

        const rootId = visit(root);
        const sinkId = `sink_${seq++}`;
        nodes.push(makeNode(sinkId, (productIds.size + 1) * 200, 80, 'Sink', '物品輸入口'));
        edges.push({ id: `e_${rootId}_${sinkId}`, source: rootId, target: sinkId });
        return { nodes, edges };
    }

    it('最短鏈套用後主要加工節點合法且有赫銅零件流量', () => {
        const chain = findShortestReverseChain('赫銅零件');
        expect(chain).not.toBeNull();

        const { nodes, edges } = buildFromChain(chain!);
        const graph = buildGraph(nodes, edges);
        validateChains(graph);

        const invalidProcessors = [...graph.nodes.values()].filter(
            (n) => !n.isSource && !n.isSink && !n.isValid,
        );
        expect(invalidProcessors.map((n) => n.deviceUid)).toEqual([]);

        const sorted = topologicalSort(graph);
        const flows = propagateFlows(sorted, graph);
        const partEdge = [...flows.values()].find((f) => f.itemId === '赫銅零件');
        expect(partEdge).toBeDefined();
        expect(partEdge!.rate).toBeGreaterThan(0);
    });
});
