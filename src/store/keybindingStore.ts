import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';

/**
 * 單一快捷鍵動作的靜態定義。
 *
 * `id`：跨 store／composable 引用的唯一鍵；`label`：設定介面顯示用中文名稱；
 * `category`：設定介面分組依據；`defaultCombo`：未被使用者覆寫時採用的鍵位字串
 * （格式對齊 `useKeybinding.ts` 的 `comboFromEvent()`，例如 `'Ctrl+Z'`、`'W'`、`'Escape'`）。
 */
export interface KeybindingAction {
    id: string;
    label: string;
    category: 'history' | 'selection' | 'canvas' | 'system';
    defaultCombo: string;
}

/**
 * 全專案可配置快捷鍵的靜態清單（單一權威來源）。  \
 * `useShortcuts.ts` / `FactoryCanvas.vue` 的實際觸發邏輯與設定介面 `ShortcutSettingsPanel.vue`
 * 皆依此清單運作，新增快捷鍵時只需在此補一筆定義。
 */
export const KEYBINDING_ACTIONS: readonly KeybindingAction[] = [
    { id: 'undo', label: '復原', category: 'history', defaultCombo: 'Ctrl+Z' },
    { id: 'redo', label: '取消復原', category: 'history', defaultCombo: 'Ctrl+Y' },
    { id: 'deleteSelection', label: '刪除選取', category: 'selection', defaultCombo: 'Delete' },
    { id: 'rotateDevice', label: '旋轉設備', category: 'selection', defaultCombo: 'R' },
    { id: 'holdPan', label: '暫時切換平移工具', category: 'canvas', defaultCombo: 'Space' },
    { id: 'toggleConnectTool', label: '切換管線工具', category: 'canvas', defaultCombo: 'P' },
    { id: 'panUp', label: '畫面上移', category: 'canvas', defaultCombo: 'W' },
    { id: 'panDown', label: '畫面下移', category: 'canvas', defaultCombo: 'S' },
    { id: 'panLeft', label: '畫面左移', category: 'canvas', defaultCombo: 'A' },
    { id: 'panRight', label: '畫面右移', category: 'canvas', defaultCombo: 'D' },
    {
        id: 'resetCanvasTemp',
        label: '重置畫布（暫時性）',
        category: 'system',
        defaultCombo: 'Ctrl+R',
    },
    { id: 'openSettings', label: '開啟快捷鍵設定', category: 'system', defaultCombo: 'Escape' },
] as const;

/**
 * CR-01 / CR-02 useKeybindingStore
 *
 * 快捷鍵配置狀態：使用者自訂鍵位覆寫（持久化）＋快捷鍵設定介面開關狀態（不持久化）。  \
 * 動作本身的觸發邏輯不在本 store——`resolvedCombo()` 只負責回答「這個動作現在綁在哪個鍵位」，
 * 實際監聽鍵盤事件由 `useKeybinding.ts` 的 composable 負責。
 *
 * @example
 * const keybindingStore = useKeybindingStore()
 * keybindingStore.setBinding('undo', 'Ctrl+Shift+Z')
 * keybindingStore.resolvedCombo('undo') // → 'Ctrl+Shift+Z'
 */
export const useKeybindingStore = defineStore('keybinding', () => {
    /** 使用者自訂鍵位覆寫；key 為 action id，value 為鍵位字串。持久化於 localStorage */
    const bindings = useLocalStorage<Record<string, string>>('endfield-keybindings', {});

    /** 快捷鍵設定介面（Esc 開啟）目前是否展開；純 UI 狀態，不持久化 */
    const isSettingsPanelOpen = ref(false);

    /**
     * 查詢指定動作目前實際生效的鍵位；未被使用者覆寫時回傳 `defaultCombo`。
     * @param actionId `KEYBINDING_ACTIONS` 內的動作 id；查無此 id 時回傳空字串
     */
    function resolvedCombo(actionId: string): string {
        const action = KEYBINDING_ACTIONS.find((a) => a.id === actionId);
        if (!action) return '';
        return bindings.value[actionId] ?? action.defaultCombo;
    }

    /**
     * 覆寫指定動作的鍵位。
     * @param actionId 動作 id
     * @param combo 新鍵位字串
     */
    function setBinding(actionId: string, combo: string): void {
        bindings.value = { ...bindings.value, [actionId]: combo };
    }

    /**
     * 清除指定動作的使用者覆寫，回到 `defaultCombo`。
     * @param actionId 動作 id
     */
    function resetBinding(actionId: string): void {
        const next = { ...bindings.value };
        delete next[actionId];
        bindings.value = next;
    }

    /**
     * 檢查指定鍵位是否已被其他動作占用。
     * @param combo 欲檢查的鍵位字串
     * @param excludingActionId 排除檢查的動作 id（通常是正在編輯的那個動作自己）
     * @returns 衝突的動作 id；無衝突時為 null
     */
    function findConflict(combo: string, excludingActionId?: string): string | null {
        if (!combo) return null;
        const hit = KEYBINDING_ACTIONS.find(
            (a) => a.id !== excludingActionId && resolvedCombo(a.id) === combo,
        );
        return hit?.id ?? null;
    }

    /** 開啟快捷鍵設定介面 */
    function openSettingsPanel(): void {
        isSettingsPanelOpen.value = true;
    }

    /** 關閉快捷鍵設定介面 */
    function closeSettingsPanel(): void {
        isSettingsPanelOpen.value = false;
    }

    /** 是否存在任一使用者自訂覆寫（設定介面可用來顯示「全部重置」按鈕的 disabled 狀態） */
    const hasCustomBindings = computed(() => Object.keys(bindings.value).length > 0);

    return {
        /** 全專案可配置快捷鍵的靜態清單 */
        ACTIONS: KEYBINDING_ACTIONS,
        /** 快捷鍵設定介面目前是否展開 */
        isSettingsPanelOpen,
        /** 是否存在任一使用者自訂覆寫 */
        hasCustomBindings,
        /** 查詢指定動作目前實際生效的鍵位 */
        resolvedCombo,
        /** 覆寫指定動作的鍵位 */
        setBinding,
        /** 清除指定動作的使用者覆寫，回到預設 */
        resetBinding,
        /** 檢查指定鍵位是否已被其他動作占用 */
        findConflict,
        /** 開啟快捷鍵設定介面 */
        openSettingsPanel,
        /** 關閉快捷鍵設定介面 */
        closeSettingsPanel,
    };
});
