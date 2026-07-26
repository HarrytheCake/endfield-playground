/**
 * CR-03 useValidationStore 單元測試
 *
 * 測試對象：src/store/validationStore.ts
 * 重點：detector 註冊機制、run() 收集 alerts、查詢 helpers、單一 detector 失敗不影響其他。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useValidationStore } from '@/store/validationStore';
import type { Alert, Detector, ValidationContext } from '@/types/validation';

// ─── 測試輔助 ────────────────────────────────────────────────────────────────

/** 建立一個必定回傳指定 alerts 的 detector */
function makeDetector(
    code: string,
    alerts: Alert[],
    level: 'error' | 'warning' = 'error',
): Detector {
    return {
        code,
        level,
        run: () => alerts,
    };
}

/** 建立一個會 throw 的 detector */
function makeThrowingDetector(code: string, level: 'error' | 'warning' = 'error'): Detector {
    return {
        code,
        level,
        run: () => {
            throw new Error(`${code} 偵測失敗`);
        },
    };
}

/** 建立一個 alert 物件 */
function makeAlert(opts: Partial<Alert> & { code: string }): Alert {
    return {
        uid: crypto.randomUUID(),
        level: 'error',
        message: `${opts.code} message`,
        relatedDeviceUids: [],
        relatedConnectionUids: [],
        ...opts,
    };
}

/** 空的 ValidationContext */
const emptyCtx: ValidationContext = {
    devices: [],
    connections: [],
    getDef: () => undefined,
    baseRegion: null,
};

// ─── 初始狀態 ─────────────────────────────────────────────────────────────────

describe('useValidationStore — 初始狀態', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('alerts / detectors 初始為空', () => {
        const store = useValidationStore();
        expect(store.alerts).toEqual([]);
        expect(store.detectors).toEqual([]);
    });

    it('errorCount / warningCount / hasAnyError 初始為 0 / false', () => {
        const store = useValidationStore();
        expect(store.errorCount).toBe(0);
        expect(store.warningCount).toBe(0);
        expect(store.hasAnyError).toBe(false);
    });
});

// ─── registerDetector() ───────────────────────────────────────────────────────

describe('registerDetector()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('註冊後出現在 detectors 列表', () => {
        const store = useValidationStore();
        const d = makeDetector('E001', []);
        store.registerDetector(d);

        expect(store.detectors).toHaveLength(1);
        expect(store.detectors[0].code).toBe(d.code);
    });

    it('同 code 重複註冊會被忽略', () => {
        const store = useValidationStore();
        store.registerDetector(makeDetector('E001', []));
        store.registerDetector(makeDetector('E001', []));

        expect(store.detectors).toHaveLength(1);
    });

    it('不同 code 可同時並存', () => {
        const store = useValidationStore();
        store.registerDetector(makeDetector('E001', []));
        store.registerDetector(makeDetector('E002', []));

        expect(store.detectors).toHaveLength(2);
    });
});

// ─── unregisterDetector() ─────────────────────────────────────────────────────

describe('unregisterDetector()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('成功取消已註冊的 detector，回傳 true', () => {
        const store = useValidationStore();
        store.registerDetector(makeDetector('E001', []));

        const result = store.unregisterDetector('E001');

        expect(result).toBe(true);
        expect(store.detectors).toHaveLength(0);
    });

    it('取消不存在的 code，回傳 false', () => {
        const store = useValidationStore();
        expect(store.unregisterDetector('NOPE')).toBe(false);
    });
});

// ─── run() ────────────────────────────────────────────────────────────────────

describe('run()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('無 detector 時 alerts 為空', () => {
        const store = useValidationStore();
        store.run(emptyCtx);

        expect(store.alerts).toEqual([]);
    });

    it('收集所有 detector 的回傳 alerts', () => {
        const store = useValidationStore();
        const a1 = makeAlert({ code: 'E001' });
        const a2 = makeAlert({ code: 'E002' });
        store.registerDetector(makeDetector('E001', [a1]));
        store.registerDetector(makeDetector('E002', [a2]));

        store.run(emptyCtx);

        expect(store.alerts).toHaveLength(2);
        expect(store.alerts.map((x) => x.uid)).toContain(a1.uid);
        expect(store.alerts.map((x) => x.uid)).toContain(a2.uid);
    });

    it('每次 run() 重置 alerts（不累加）', () => {
        const store = useValidationStore();
        store.registerDetector(makeDetector('E001', [makeAlert({ code: 'E001' })]));

        store.run(emptyCtx);
        store.run(emptyCtx);

        expect(store.alerts).toHaveLength(1);
    });

    it('單一 detector throw 不影響其他 detector', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const store = useValidationStore();
        const validAlert = makeAlert({ code: 'E002' });
        store.registerDetector(makeThrowingDetector('E001'));
        store.registerDetector(makeDetector('E002', [validAlert]));

        store.run(emptyCtx);

        expect(store.alerts).toEqual([validAlert]);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});

// ─── errorCount / warningCount / hasAnyError ─────────────────────────────────

describe('errorCount / warningCount / hasAnyError', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('依 level 正確分類計數', () => {
        const store = useValidationStore();
        store.registerDetector(
            makeDetector(
                'E001',
                [
                    makeAlert({ code: 'E001', level: 'error' }),
                    makeAlert({ code: 'E001', level: 'error' }),
                ],
                'error',
            ),
        );
        store.registerDetector(
            makeDetector('W001', [makeAlert({ code: 'W001', level: 'warning' })], 'warning'),
        );

        store.run(emptyCtx);

        expect(store.errorCount).toBe(2);
        expect(store.warningCount).toBe(1);
        expect(store.hasAnyError).toBe(true);
    });

    it('只有 warning 時 hasAnyError 為 false', () => {
        const store = useValidationStore();
        store.registerDetector(
            makeDetector('W001', [makeAlert({ code: 'W001', level: 'warning' })], 'warning'),
        );

        store.run(emptyCtx);

        expect(store.hasAnyError).toBe(false);
    });
});

// ─── hasBlockingError() ───────────────────────────────────────────────────────

describe('hasBlockingError()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('有 error 牽涉到該設備時回傳 true', () => {
        const store = useValidationStore();
        store.registerDetector(
            makeDetector('E001', [
                makeAlert({ code: 'E001', level: 'error', relatedDeviceUids: ['dev-1'] }),
            ]),
        );
        store.run(emptyCtx);

        expect(store.hasBlockingError('dev-1')).toBe(true);
    });

    it('只有 warning 牽涉到該設備時回傳 false', () => {
        const store = useValidationStore();
        store.registerDetector(
            makeDetector(
                'W001',
                [makeAlert({ code: 'W001', level: 'warning', relatedDeviceUids: ['dev-1'] })],
                'warning',
            ),
        );
        store.run(emptyCtx);

        expect(store.hasBlockingError('dev-1')).toBe(false);
    });

    it('未提及的設備回傳 false', () => {
        const store = useValidationStore();
        store.registerDetector(
            makeDetector('E001', [
                makeAlert({ code: 'E001', level: 'error', relatedDeviceUids: ['dev-1'] }),
            ]),
        );
        store.run(emptyCtx);

        expect(store.hasBlockingError('dev-2')).toBe(false);
    });
});

// ─── alertsByDevice / alertsByConnection ──────────────────────────────────────

describe('alertsByDevice / alertsByConnection', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('alertsByDevice 過濾出有相關的 alerts', () => {
        const store = useValidationStore();
        const a1 = makeAlert({ code: 'E001', relatedDeviceUids: ['dev-1', 'dev-2'] });
        const a2 = makeAlert({ code: 'E002', relatedDeviceUids: ['dev-2'] });
        store.registerDetector(makeDetector('E001', [a1]));
        store.registerDetector(makeDetector('E002', [a2]));
        store.run(emptyCtx);

        expect(store.alertsByDevice('dev-1')).toEqual([a1]);
        expect(store.alertsByDevice('dev-2')).toEqual([a1, a2]);
        expect(store.alertsByDevice('dev-3')).toEqual([]);
    });

    it('alertsByConnection 過濾出有相關的 alerts', () => {
        const store = useValidationStore();
        const a = makeAlert({ code: 'E004', relatedConnectionUids: ['conn-1'] });
        store.registerDetector(makeDetector('E004', [a]));
        store.run(emptyCtx);

        expect(store.alertsByConnection('conn-1')).toEqual([a]);
        expect(store.alertsByConnection('conn-2')).toEqual([]);
    });
});

// ─── reset() ──────────────────────────────────────────────────────────────────

describe('reset()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('清空 alerts 與 detectors', () => {
        const store = useValidationStore();
        store.registerDetector(makeDetector('E001', [makeAlert({ code: 'E001' })]));
        store.run(emptyCtx);
        expect(store.alerts).toHaveLength(1);
        expect(store.detectors).toHaveLength(1);

        store.reset();

        expect(store.alerts).toEqual([]);
        expect(store.detectors).toEqual([]);
    });
});
