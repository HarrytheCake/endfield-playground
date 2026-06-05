/**
 * CR-01 useSelectionStore 單元測試
 *
 * 測試對象：src/store/selectionStore.ts
 * 重點：選取陣列覆寫 / 清空 / 衍生 computed。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSelectionStore } from '@/store/selectionStore';

// ─── 初始狀態 ─────────────────────────────────────────────────────────────────

describe('useSelectionStore — 初始狀態', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('selectedNodeIds 預設為空陣列', () => {
        const store = useSelectionStore();
        expect(store.selectedNodeIds).toEqual([]);
    });

    it('hasSelection / isMultiSelect 預設均為 false', () => {
        const store = useSelectionStore();
        expect(store.hasSelection).toBe(false);
        expect(store.isMultiSelect).toBe(false);
    });
});

// ─── setSelection() ───────────────────────────────────────────────────────────

describe('setSelection()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('整批覆寫 selectedNodeIds', () => {
        const store = useSelectionStore();
        store.setSelection(['a', 'b', 'c']);
        expect(store.selectedNodeIds).toEqual(['a', 'b', 'c']);
    });

    it('再次呼叫會覆寫而非追加', () => {
        const store = useSelectionStore();
        store.setSelection(['a']);
        store.setSelection(['b', 'c']);
        expect(store.selectedNodeIds).toEqual(['b', 'c']);
    });
});

// ─── clearSelection() ─────────────────────────────────────────────────────────

describe('clearSelection()', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('清空 selectedNodeIds', () => {
        const store = useSelectionStore();
        store.setSelection(['a', 'b']);
        store.clearSelection();
        expect(store.selectedNodeIds).toEqual([]);
    });

    it('已清空狀態下再次呼叫 silently no-op', () => {
        const store = useSelectionStore();
        store.clearSelection();
        store.clearSelection();
        expect(store.selectedNodeIds).toEqual([]);
    });
});

// ─── hasSelection / isMultiSelect computed ────────────────────────────────────

describe('hasSelection / isMultiSelect', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('單選時 hasSelection = true，isMultiSelect = false', () => {
        const store = useSelectionStore();
        store.setSelection(['only']);
        expect(store.hasSelection).toBe(true);
        expect(store.isMultiSelect).toBe(false);
    });

    it('多選時兩者皆 true', () => {
        const store = useSelectionStore();
        store.setSelection(['a', 'b']);
        expect(store.hasSelection).toBe(true);
        expect(store.isMultiSelect).toBe(true);
    });

    it('清空後皆變回 false', () => {
        const store = useSelectionStore();
        store.setSelection(['a', 'b', 'c']);
        store.clearSelection();
        expect(store.hasSelection).toBe(false);
        expect(store.isMultiSelect).toBe(false);
    });
});
