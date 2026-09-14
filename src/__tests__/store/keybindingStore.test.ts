/**
 * CR-01 / CR-02 useKeybindingStore 單元測試
 *
 * 測試對象：src/store/keybindingStore.ts
 * 重點：預設鍵位解析、覆寫／重置、衝突偵測、設定介面開關狀態。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useKeybindingStore, KEYBINDING_ACTIONS } from '@/store/keybindingStore';

// `useLocalStorage` 持久化在 localStorage；測試環境（vitest node environment）沒有全域
// localStorage，`useLocalStorage` 會優雅地退化成純記憶體 ref，因此每個 test 拿到的都是
// 全新狀態，不需要（也不能）呼叫 localStorage.clear()
beforeEach(() => {
    setActivePinia(createPinia());
});

// ─── 初始狀態 ─────────────────────────────────────────────────────────────────

describe('useKeybindingStore — 初始狀態', () => {
    it('ACTIONS 內容與 KEYBINDING_ACTIONS 一致', () => {
        const store = useKeybindingStore();
        // Pinia setup store 的回傳值會被包成 reactive proxy，
        // 序列化後才相等，不能用 toBe 比參照
        expect(store.ACTIONS).toEqual(KEYBINDING_ACTIONS);
    });

    it('isSettingsPanelOpen 預設為 false', () => {
        const store = useKeybindingStore();
        expect(store.isSettingsPanelOpen).toBe(false);
    });

    it('hasCustomBindings 預設為 false', () => {
        const store = useKeybindingStore();
        expect(store.hasCustomBindings).toBe(false);
    });

    it('每個動作的 resolvedCombo 預設等於自己的 defaultCombo', () => {
        const store = useKeybindingStore();
        for (const action of KEYBINDING_ACTIONS) {
            expect(store.resolvedCombo(action.id)).toBe(action.defaultCombo);
        }
    });
});

// ─── resolvedCombo() ────────────────────────────────────────────────────────────

describe('resolvedCombo()', () => {
    it('查無此 id 時回傳空字串', () => {
        const store = useKeybindingStore();
        expect(store.resolvedCombo('not-a-real-action')).toBe('');
    });
});

// ─── setBinding() ───────────────────────────────────────────────────────────────

describe('setBinding()', () => {
    it('覆寫指定動作的鍵位', () => {
        const store = useKeybindingStore();
        store.setBinding('undo', 'Ctrl+Shift+Z');
        expect(store.resolvedCombo('undo')).toBe('Ctrl+Shift+Z');
    });

    it('只影響指定動作，不影響其他動作', () => {
        const store = useKeybindingStore();
        store.setBinding('undo', 'Ctrl+Shift+Z');
        expect(store.resolvedCombo('redo')).toBe('Ctrl+Y');
    });

    it('覆寫後 hasCustomBindings 變為 true', () => {
        const store = useKeybindingStore();
        store.setBinding('rotateDevice', 'T');
        expect(store.hasCustomBindings).toBe(true);
    });

    it('對同一動作再次呼叫會採用最新值', () => {
        const store = useKeybindingStore();
        store.setBinding('undo', 'Ctrl+Shift+Z');
        store.setBinding('undo', 'Ctrl+Alt+Z');
        expect(store.resolvedCombo('undo')).toBe('Ctrl+Alt+Z');
    });
});

// ─── resetBinding() ─────────────────────────────────────────────────────────────

describe('resetBinding()', () => {
    it('清除覆寫後回到 defaultCombo', () => {
        const store = useKeybindingStore();
        store.setBinding('undo', 'Ctrl+Shift+Z');
        store.resetBinding('undo');
        expect(store.resolvedCombo('undo')).toBe('Ctrl+Z');
    });

    it('對從未被覆寫的動作呼叫是安全的 no-op', () => {
        const store = useKeybindingStore();
        expect(() => store.resetBinding('redo')).not.toThrow();
        expect(store.resolvedCombo('redo')).toBe('Ctrl+Y');
    });

    it('重置後若無其他覆寫，hasCustomBindings 回到 false', () => {
        const store = useKeybindingStore();
        store.setBinding('undo', 'Ctrl+Shift+Z');
        store.resetBinding('undo');
        expect(store.hasCustomBindings).toBe(false);
    });
});

// ─── findConflict() ─────────────────────────────────────────────────────────────

describe('findConflict()', () => {
    it('空字串一律回傳 null', () => {
        const store = useKeybindingStore();
        expect(store.findConflict('')).toBeNull();
    });

    it('未被任何動作使用的鍵位回傳 null', () => {
        const store = useKeybindingStore();
        expect(store.findConflict('Ctrl+Shift+Alt+X')).toBeNull();
    });

    it('已被其他動作占用的鍵位回傳該動作 id', () => {
        const store = useKeybindingStore();
        expect(store.findConflict('Ctrl+Z')).toBe('undo');
    });

    it('excludingActionId 會排除自己，不視為衝突', () => {
        const store = useKeybindingStore();
        expect(store.findConflict('Ctrl+Z', 'undo')).toBeNull();
    });

    it('setBinding 造成鍵位衝突後可被偵測到', () => {
        const store = useKeybindingStore();
        store.setBinding('redo', 'Ctrl+Z');
        expect(store.findConflict('Ctrl+Z', 'redo')).toBe('undo');
    });
});

// ─── openSettingsPanel() / closeSettingsPanel() ─────────────────────────────────

describe('openSettingsPanel() / closeSettingsPanel()', () => {
    it('openSettingsPanel 將 isSettingsPanelOpen 設為 true', () => {
        const store = useKeybindingStore();
        store.openSettingsPanel();
        expect(store.isSettingsPanelOpen).toBe(true);
    });

    it('closeSettingsPanel 將 isSettingsPanelOpen 設為 false', () => {
        const store = useKeybindingStore();
        store.openSettingsPanel();
        store.closeSettingsPanel();
        expect(store.isSettingsPanelOpen).toBe(false);
    });

    it('重複呼叫 openSettingsPanel 是安全的 no-op（仍為 true）', () => {
        const store = useKeybindingStore();
        store.openSettingsPanel();
        store.openSettingsPanel();
        expect(store.isSettingsPanelOpen).toBe(true);
    });

    it('重複呼叫 closeSettingsPanel 是安全的 no-op（仍為 false）', () => {
        const store = useKeybindingStore();
        store.closeSettingsPanel();
        store.closeSettingsPanel();
        expect(store.isSettingsPanelOpen).toBe(false);
    });
});
