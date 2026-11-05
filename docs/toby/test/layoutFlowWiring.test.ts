/** 正式 layout → 驗證 → 引擎 → flowStore 的接線整合測試；保留舊 editorStore 入口。 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, nextTick, type EffectScope } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { runFlowEngine, useFlowEngine } from '@/composables/useFlowEngine';
import { useValidation } from '@/composables/useValidation';
import { useLayoutStore } from '@/store/layoutStore';
import { useEditorStore } from '@/store/editorStore';
import { useFlowStore } from '@/store/flowStore';
import { useValidationStore } from '@/store/validationStore';
import { toTopology } from '@/utils/layout/toTopology';
import { resolveConnections } from '@/utils/layout/resolveConnections';
import type { LayoutSnapshot } from '@/types/layout';
import type { ValidationContext } from '@/types/validation';
import * as machineData from '@/data/machines';

/**
 * 建立可由正式 resolveConnections 自動解出兩段 belt 的產線。
 * @param rate 源素材每分鐘供給量
 * @returns 源 → 粉碎機 → 輸入口的 layout 快照
 */
function productionSnapshot(rate = 30): LayoutSnapshot {
    return {
        devices: [
            {
                id: 'src',
                machineType: 'material_source',
                position: { x: 0, y: 0, z: 0 },
                rotation: 0,
                machineMode: 'solid_belt',
                primaryOutput: '源礦',
                sourceRatePerMin: rate,
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
        ],
        pipelines: [
            {
                id: 'p1',
                media: 'belt',
                waypoints: [
                    { x: 1, y: 1, z: 0 },
                    { x: 2, y: 1, z: 0 },
                    { x: 2, y: -1, z: 0 },
                    { x: 4, y: -1, z: 0 },
                ],
            },
            {
                id: 'p2',
                media: 'belt',
                waypoints: [
                    { x: 4, y: 3, z: 0 },
                    { x: 11, y: 3, z: 0 },
                    { x: 11, y: 1, z: 0 },
                ],
            },
        ],
    };
}

/**
 * 按 MainLayout 的順序在測試 scope 內掛載共用拓撲與兩個 composable。
 * @returns 使用正式來源的手動重算入口
 */
function startLayoutWiring() {
    /** 不手動提供 connections，以覆蓋正式 layout 的衍生連線路徑。 */
    const layout = useLayoutStore();
    /** 與正式頁一致，使用快照 API 取得資料，不同步寫入 editorStore。 */
    const topology = computed(() => {
        const { devices, pipelines } = layout.toSnapshot();
        return toTopology(devices, pipelines, [...layout.connections]);
    });
    useValidation(() => topology.value);
    return useFlowEngine(() => topology.value);
}

describe('正式 layout 產耗接線', () => {
    /** 每案獨立 scope，驗證 watcher 與計時器可一起釋放。 */
    let scope: EffectScope;

    beforeEach(() => {
        setActivePinia(createPinia());
        vi.useFakeTimers();
        scope = effectScope();
    });

    afterEach(() => {
        scope.stop();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('空 layout 清除上次產線的結果，且不雙寫 editorStore', async () => {
        const editor = useEditorStore();
        const oldNodes = editor.nodes;
        const oldEdges = editor.edges;
        const flow = useFlowStore();
        const previous = productionSnapshot();
        await runFlowEngine(
            toTopology(
                previous.devices,
                previous.pipelines,
                resolveConnections(previous.devices, previous.pipelines),
            ),
        );
        expect(flow.itemSummary.length).toBeGreaterThan(0);
        expect(flow.totalPowerDemand).toBe(5);

        scope.run(startLayoutWiring);
        await vi.advanceTimersByTimeAsync(150);

        expect(flow.itemSummary).toEqual([]);
        expect(flow.edgeFlows.size).toBe(0);
        expect(flow.totalPowerDemand).toBe(0);
        expect(editor.nodes).toBe(oldNodes);
        expect(editor.edges).toBe(oldEdges);
    });

    it('真實衍生連線產線得到 30/min，包含零淨值的中間物', async () => {
        const layout = useLayoutStore();
        layout.loadSnapshot(productionSnapshot());
        scope.run(startLayoutWiring);
        await vi.advanceTimersByTimeAsync(150);

        const flow = useFlowStore();
        expect(flow.edgeFlows.size).toBe(2);
        expect(flow.itemSummary).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ itemId: '源礦', produced: 30, consumed: 30, net: 0 }),
                expect.objectContaining({
                    itemId: '源石粉末',
                    produced: 30,
                    consumed: 30,
                    net: 0,
                }),
            ]),
        );
    });

    it('連續變更合併為一次計算，且取最後的正式 layout 快照', async () => {
        const layout = useLayoutStore();
        const flow = useFlowStore();
        scope.run(startLayoutWiring);
        await vi.advanceTimersByTimeAsync(150);
        const apply = vi.spyOn(flow, 'applyResult');

        layout.loadSnapshot(productionSnapshot(10));
        await nextTick();
        await vi.advanceTimersByTimeAsync(100);
        layout.loadSnapshot(productionSnapshot(15));
        await nextTick();
        await vi.advanceTimersByTimeAsync(149);
        expect(apply).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);

        expect(apply).toHaveBeenCalledTimes(1);
        expect(flow.itemSummary.find((item) => item.itemId === '源石粉末')?.produced).toBe(15);
    });

    it('斷開正式連線會更新產耗，清空 layout 會移除舊結果', async () => {
        const layout = useLayoutStore();
        layout.loadSnapshot(productionSnapshot());
        scope.run(startLayoutWiring);
        await vi.advanceTimersByTimeAsync(150);
        const flow = useFlowStore();
        expect(flow.itemSummary.some((item) => item.itemId === '源石粉末')).toBe(true);
        expect(flow.totalPowerDemand).toBe(5);

        const disconnected = productionSnapshot();
        disconnected.pipelines = [];
        layout.loadSnapshot(disconnected);
        await nextTick();
        await vi.advanceTimersByTimeAsync(150);
        expect(flow.edgeFlows.size).toBe(0);
        expect(flow.itemSummary.some((item) => item.itemId === '源石粉末')).toBe(false);
        expect(flow.totalPowerDemand).toBe(5);

        layout.loadSnapshot({ devices: [], pipelines: [] });
        await nextTick();
        await vi.advanceTimersByTimeAsync(150);
        expect(flow.itemSummary).toEqual([]);
        expect(flow.nodeEfficiencies.size).toBe(0);
        expect(flow.totalPowerDemand).toBe(0);
    });

    it('驗證使用格子座標且同步更新，錯誤封鎖與解除後引擎跟著更新', async () => {
        const layout = useLayoutStore();
        const validation = useValidationStore();
        const inspect = vi.fn((ctx: ValidationContext) =>
            ctx.devices[0]?.data?.sourceRatePerMin === 15
                ? [
                      {
                          uid: 'blocked-source',
                          level: 'error' as const,
                          code: 'TEST',
                          message: '測試源錯誤',
                          relatedDeviceUids: ['src'],
                          relatedConnectionUids: [],
                      },
                  ]
                : [],
        );
        validation.registerDetector({ code: 'TEST', level: 'error', run: inspect });
        layout.loadSnapshot(productionSnapshot(15));
        scope.run(startLayoutWiring);

        const context = inspect.mock.calls.at(-1)![0];
        expect(context.devices.find((device) => device.id === 'crusher')?.position).toEqual({
            x: 4,
            y: 0,
        });
        expect(context.connections[0].data?.bendPoints).toEqual([
            { x: 2, y: 1 },
            { x: 2, y: -1 },
        ]);
        expect(validation.hasBlockingError('src')).toBe(true);
        await vi.advanceTimersByTimeAsync(150);
        expect(useFlowStore().itemSummary).toEqual([]);

        layout.loadSnapshot(productionSnapshot(30));
        expect(validation.hasBlockingError('src')).toBe(false);
        await nextTick();
        await vi.advanceTimersByTimeAsync(150);
        expect(
            useFlowStore().itemSummary.find((item) => item.itemId === '源石粉末')?.produced,
        ).toBe(30);
    });

    it('正式來源不監聽舊 editorStore，手動重算也使用正式來源', async () => {
        const layout = useLayoutStore();
        layout.loadSnapshot(productionSnapshot());
        const controls = scope.run(startLayoutWiring)!;
        await vi.advanceTimersByTimeAsync(150);
        const flow = useFlowStore();
        const apply = vi.spyOn(flow, 'applyResult');
        const editor = useEditorStore();
        editor.nodes = [];
        editor.edges = [];
        await nextTick();
        await vi.advanceTimersByTimeAsync(150);
        expect(apply).not.toHaveBeenCalled();

        await controls.runFlowEngine();
        expect(flow.itemSummary.find((item) => item.itemId === '源石粉末')?.produced).toBe(30);
    });

    it('scope 結束時取消未執行排程，避免離頁後覆寫其他結果', async () => {
        const flow = useFlowStore();
        const apply = vi.spyOn(flow, 'applyResult');
        scope.run(startLayoutWiring);
        scope.stop();
        await vi.advanceTimersByTimeAsync(300);
        expect(apply).not.toHaveBeenCalled();
    });

    it('未連線的多台設備逐台加總額定耗電', async () => {
        const layout = useLayoutStore();
        const snapshot = productionSnapshot();
        snapshot.pipelines = [];
        snapshot.devices.push(
            {
                id: 'shaper',
                machineType: 'shaping_machine',
                position: { x: 20, y: 0, z: 0 },
                rotation: 0,
            },
            {
                id: 'crusher-2',
                machineType: 'crusher',
                position: { x: 30, y: 0, z: 0 },
                rotation: 0,
            },
        );
        layout.loadSnapshot(snapshot);
        scope.run(startLayoutWiring);
        await vi.advanceTimersByTimeAsync(150);

        const flow = useFlowStore();
        expect(flow.itemSummary).toEqual([]);
        expect(flow.totalPowerDemand).toBe(20);
        expect(flow.totalPowerSupply).toBe(0);
    });

    it('被阻擋的設備仍計入耗電，零值、未定義值與未知設備不增加需求', async () => {
        const snapshot = productionSnapshot();
        snapshot.pipelines = [];
        snapshot.devices.push(
            {
                id: 'undefined-power',
                machineType: 'gas_disperser',
                position: { x: 20, y: 0, z: 0 },
                rotation: 0,
            },
            {
                id: 'unknown',
                machineType: 'unknown_machine',
                position: { x: 30, y: 0, z: 0 },
                rotation: 0,
            },
        );
        const blocked = vi.spyOn(useValidationStore(), 'hasBlockingError').mockReturnValue(true);
        await runFlowEngine(toTopology(snapshot.devices, [], []));

        const flow = useFlowStore();
        expect(flow.nodeEfficiencies.size).toBe(0);
        expect(flow.totalPowerDemand).toBe(5);
        expect(flow.totalPowerSupply).toBe(0);
        blocked.mockRestore();
    });

    it('依負值 power 逐台加總產電，驗證排除與刪除設備後結果仍正確', async () => {
        /** 僅於測試模擬未來的發電資料，不修改正式熱能池額定值。 */
        const resolve = machineData.resolveMachineDef;
        vi.spyOn(machineData, 'resolveMachineDef').mockImplementation((type) => {
            const def = resolve(type);
            return def?.id === 'thermal_pool' ? { ...def, power: -125.5 } : def;
        });
        vi.spyOn(useValidationStore(), 'hasBlockingError').mockReturnValue(true);
        const snapshot = productionSnapshot();
        snapshot.pipelines = [];
        snapshot.devices.push(
            {
                id: 'generator-1',
                machineType: 'thermal_pool',
                position: { x: 20, y: 0, z: 0 },
                rotation: 0,
            },
            {
                id: 'generator-2',
                machineType: 'thermal_pool',
                position: { x: 30, y: 0, z: 0 },
                rotation: 0,
            },
            {
                id: 'undefined-power',
                machineType: 'gas_disperser',
                position: { x: 40, y: 0, z: 0 },
                rotation: 0,
            },
        );
        await runFlowEngine(toTopology(snapshot.devices, [], []));
        const flow = useFlowStore();
        expect(flow.totalPowerDemand).toBe(5);
        expect(flow.totalPowerSupply).toBe(251);
        expect(flow.nodeEfficiencies.size).toBe(0);

        snapshot.devices = snapshot.devices.filter((device) => device.id !== 'generator-2');
        await runFlowEngine(toTopology(snapshot.devices, [], []));
        expect(flow.totalPowerDemand).toBe(5);
        expect(flow.totalPowerSupply).toBe(125.5);

        await runFlowEngine({ nodes: [], edges: [] });
        expect(flow.totalPowerDemand).toBe(0);
        expect(flow.totalPowerSupply).toBe(0);
    });

    it('供料速率與素材清除不影響同設備集合的額定耗電', async () => {
        const layout = useLayoutStore();
        layout.loadSnapshot(productionSnapshot(15));
        scope.run(startLayoutWiring);
        await vi.advanceTimersByTimeAsync(150);
        const flow = useFlowStore();
        expect(flow.itemSummary.find((item) => item.itemId === '源石粉末')?.produced).toBe(15);
        expect(flow.totalPowerDemand).toBe(5);

        layout.setDevicePrimaryOutput('src', null);
        await nextTick();
        await vi.advanceTimersByTimeAsync(150);
        expect(flow.itemSummary).toEqual([]);
        expect(flow.totalPowerDemand).toBe(5);
    });

    it('無參數入口包含未連線設備，並保留中文 label 與節點 id 的查詢相容性', async () => {
        const editor = useEditorStore();
        editor.nodes = [
            { id: 'legacy-crusher', position: { x: 0, y: 0 }, data: { label: '粉碎機' } },
            { id: 'shaping_machine', position: { x: 10, y: 0 } },
        ];
        editor.edges = [];
        await runFlowEngine();
        expect(useFlowStore().totalPowerDemand).toBe(15);
        expect(useFlowStore().itemSummary).toEqual([]);
    });

    it('無參數 composable 與 runFlowEngine 仍使用舊 editorStore', async () => {
        const layout = useLayoutStore();
        layout.loadSnapshot(productionSnapshot());
        const editor = useEditorStore();
        editor.nodes = [];
        editor.edges = [];
        scope.run(() => {
            useValidation();
            useFlowEngine();
        });
        await vi.advanceTimersByTimeAsync(150);
        expect(useFlowStore().itemSummary).toEqual([]);

        const snapshot = productionSnapshot();
        const topology = toTopology(snapshot.devices, snapshot.pipelines, [...layout.connections]);
        editor.nodes = topology.nodes;
        editor.edges = topology.edges;
        await nextTick();
        await vi.advanceTimersByTimeAsync(150);
        expect(
            useFlowStore().itemSummary.find((item) => item.itemId === '源石粉末')?.produced,
        ).toBe(30);

        editor.nodes = [];
        editor.edges = [];
        await runFlowEngine();
        expect(useFlowStore().itemSummary).toEqual([]);
    });
});
