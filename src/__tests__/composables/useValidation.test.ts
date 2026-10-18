/**
 * CR-03 useValidation 單元測試
 *
 * 測試對象：src/composables/useValidation.ts
 * 重點：
 *   - immediate watch 在 composable setup 時即跑一次
 *   - editorStore.nodes / edges 變動會觸發 validation 重跑
 *   - ValidationContext 內容正確（devices / connections / getDef 對應）
 *   - ValidationContext 的座標已由像素換算為格子座標
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { effectScope, nextTick, type EffectScope } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useValidation } from '@/composables/useValidation';
import { useValidationStore } from '@/store/validationStore';
import { useEditorStore } from '@/store/editorStore';
import type { Alert, Detector, ValidationContext } from '@/types/validation';
import type { FactoryNode, FactoryEdge } from '@/types/graph';

// ─── 測試輔助 ────────────────────────────────────────────────────────────────

/** 建立一個會記錄每次 run() 的 ctx 副本，並回傳指定 alerts 的 detector */
function makeSpyDetector(code: string): {
    detector: Detector;
    contexts: ValidationContext[];
} {
    const contexts: ValidationContext[] = [];
    const detector: Detector = {
        code,
        level: 'error',
        run(ctx) {
            contexts.push({ ...ctx });
            return ctx.devices.map<Alert>((d) => ({
                uid: crypto.randomUUID(),
                level: 'error',
                code,
                message: `device ${d.id}`,
                relatedDeviceUids: [d.id],
                relatedConnectionUids: [],
            }));
        },
    };
    return { detector, contexts };
}

function makeNode(id: string, x = 0, y = 0): FactoryNode {
    return {
        id,
        type: 'default',
        position: { x, y },
        data: { label: `node ${id}`, machineType: '粉碎機', recipeIndex: 0 },
    };
}

/** 建立一條帶彎折點的連線；座標為畫布像素 */
function makeEdge(id: string, bendPoints: { x: number; y: number }[]): FactoryEdge {
    return {
        id,
        source: 'n1',
        target: 'n2',
        data: { portType: 'belt', bendPoints },
    } as FactoryEdge;
}

// ─── immediate watch ─────────────────────────────────────────────────────────

describe('useValidation — immediate watch', () => {
    let scope: EffectScope;

    beforeEach(() => {
        setActivePinia(createPinia());
        scope = effectScope();
    });
    afterEach(() => scope.stop());

    it('composable 呼叫時立即跑一次 validation', () => {
        scope.run(() => {
            const editor = useEditorStore();
            editor.nodes = [makeNode('n1')];
            editor.edges = [];

            const vs = useValidationStore();
            const { detector } = makeSpyDetector('E001');
            vs.registerDetector(detector);

            useValidation();

            // immediate 應已執行
            expect(vs.alerts).toHaveLength(1);
            expect(vs.alerts[0].relatedDeviceUids).toEqual(['n1']);
        });
    });

    it('沒註冊 detector 時 alerts 仍為空（不報錯）', () => {
        scope.run(() => {
            const editor = useEditorStore();
            editor.nodes = [makeNode('n1')];
            editor.edges = [];

            const vs = useValidationStore();
            useValidation();

            expect(vs.alerts).toEqual([]);
        });
    });
});

// ─── 編輯器變動觸發重跑 ───────────────────────────────────────────────────────

describe('useValidation — editor 變動觸發', () => {
    let scope: EffectScope;

    beforeEach(() => {
        setActivePinia(createPinia());
        scope = effectScope();
    });
    afterEach(() => scope.stop());

    it('placeDevice 後 validation 重跑，alerts 更新', async () => {
        await scope.run(async () => {
            const editor = useEditorStore();
            editor.nodes = [];
            editor.edges = [];

            const vs = useValidationStore();
            vs.registerDetector(makeSpyDetector('E001').detector);

            useValidation();
            expect(vs.alerts).toEqual([]);

            editor.placeDevice(makeNode('new-node'));
            await nextTick();

            expect(vs.alerts).toHaveLength(1);
            expect(vs.alerts[0].relatedDeviceUids).toEqual(['new-node']);
        });
    });

    it('removeDevices 後 validation 重跑，alerts 清空', async () => {
        await scope.run(async () => {
            const editor = useEditorStore();
            editor.nodes = [makeNode('n1')];
            editor.edges = [];

            const vs = useValidationStore();
            vs.registerDetector(makeSpyDetector('E001').detector);

            useValidation();
            expect(vs.alerts).toHaveLength(1);

            // 先放入 nodes 之後再用高階 action 移除，否則新 uid 對不上
            editor.placeDevice(makeNode('n2'));
            await nextTick();
            expect(vs.alerts).toHaveLength(2);

            editor.removeDevices(['n1', 'n2']);
            await nextTick();
            expect(vs.alerts).toEqual([]);
        });
    });
});

// ─── ValidationContext 內容 ──────────────────────────────────────────────────

describe('useValidation — ctx 內容', () => {
    let scope: EffectScope;

    beforeEach(() => {
        setActivePinia(createPinia());
        scope = effectScope();
    });
    afterEach(() => scope.stop());

    it('傳入 detector 的 ctx 含 devices / connections / getDef', () => {
        scope.run(() => {
            const editor = useEditorStore();
            editor.nodes = [makeNode('n1')];
            editor.edges = [];

            const vs = useValidationStore();
            const { detector, contexts } = makeSpyDetector('E001');
            vs.registerDetector(detector);

            useValidation();

            expect(contexts).toHaveLength(1);
            expect(contexts[0].devices.map((d) => d.id)).toEqual(['n1']);
            expect(contexts[0].connections).toEqual([]);
            // getDef＝resolveMachineDef：中文名與英文 id 皆可查到
            expect(contexts[0].getDef('粉碎機')).toBeDefined();
            expect(contexts[0].getDef('crusher')).toBeDefined();
            expect(contexts[0].getDef('不存在的機器')).toBeUndefined();
        });
    });

    it('節點的像素座標除以 gridSize 後才進 ctx', () => {
        scope.run(() => {
            const editor = useEditorStore();
            editor.nodes = [makeNode('n1', 200, 300)];
            editor.edges = [];

            const vs = useValidationStore();
            const { detector, contexts } = makeSpyDetector('E001');
            vs.registerDetector(detector);

            useValidation();

            // gridSize 預設 20，200 / 20 = 10、300 / 20 = 15
            expect(contexts[0].devices[0].position).toEqual({ x: 10, y: 15 });
        });
    });

    it('連線的 bendPoints 同樣換算為格子座標', () => {
        scope.run(() => {
            const editor = useEditorStore();
            editor.nodes = [];
            editor.edges = [makeEdge('e1', [{ x: 40, y: 60 }])];

            const vs = useValidationStore();
            const { detector, contexts } = makeSpyDetector('E001');
            vs.registerDetector(detector);

            useValidation();

            expect(contexts[0].connections[0].data?.bendPoints).toEqual([{ x: 2, y: 3 }]);
        });
    });
});

// ─── 手動 runValidation() ─────────────────────────────────────────────────────

describe('useValidation — runValidation()', () => {
    let scope: EffectScope;

    beforeEach(() => {
        setActivePinia(createPinia());
        scope = effectScope();
    });
    afterEach(() => scope.stop());

    it('回傳的 runValidation 可手動重跑', () => {
        scope.run(() => {
            const editor = useEditorStore();
            editor.nodes = [];
            editor.edges = [];

            const vs = useValidationStore();
            const { runValidation } = useValidation();

            // 新增 detector 之後手動觸發（detector 註冊本身不會觸發 watch）
            vs.registerDetector(makeSpyDetector('spy_E001').detector);

            editor.nodes = [makeNode('n1')];
            runValidation();

            expect(vs.alerts).toHaveLength(1);
        });
    });
});
