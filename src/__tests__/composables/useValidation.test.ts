/**
 * CR-03 useValidation 單元測試
 *
 * 測試對象：src/composables/useValidation.ts
 * 重點：
 *   - immediate watch 在 composable setup 時即跑一次
 *   - editorStore.nodes / edges 變動會觸發 validation 重跑
 *   - ValidationContext 內容正確（devices / connections / getDef 對應）
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { effectScope, nextTick, type EffectScope } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useValidation } from '@/composables/useValidation';
import { useValidationStore } from '@/store/validationStore';
import { useEditorStore } from '@/store/editorStore';
import type { Alert, Detector, ValidationContext } from '@/types/validation';
import type { FactoryNode } from '@/types/graph';

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

function makeNode(id: string): FactoryNode {
    return {
        id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: `node ${id}`, machineType: '粉碎機', recipeIndex: 0 },
    };
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
            // getDef 用真實設備名稱應能查到（粉碎機）
            expect(contexts[0].getDef('粉碎機')).toBeDefined();
            expect(contexts[0].getDef('不存在的機器')).toBeUndefined();
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
