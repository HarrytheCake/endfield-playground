/**
 * useKeybinding —— 可配置快捷鍵的鍵盤事件層
 *
 * 職責屬於 L2 容器層。負責把原生鍵盤事件正規化成與 `keybindingStore` 一致的鍵位字串，
 * 並提供「持續按住」（hold）與「單次觸發」（trigger）兩種快捷鍵消費模式，
 * 讓 `useShortcuts.ts` 與 `FactoryCanvas.vue` 都能依 `keybindingStore.resolvedCombo()`
 * 的動態鍵位運作，而不必各自重寫鍵盤監聽邏輯。
 *
 * 全域按下狀態（`heldKeys` / `modifierState`）為 module 層級單例，僅註冊一次事件監聽器，
 * 供所有呼叫端共用；這是瀏覽器鍵盤狀態本身的追蹤，與 `keybindingStore`（使用者的鍵位配置）
 * 是不同關注點，故不做成 Pinia store。
 */

import { computed, reactive, ref, type ComputedRef } from 'vue';
import { useEventListener } from '@vueuse/core';
import { useKeybindingStore } from '@/store/keybindingStore';

/** 目前按住中的非修飾鍵名稱（已正規化，如 'W'、'Escape'） */
const heldKeys = reactive(new Set<string>());

/** 目前修飾鍵按住狀態；Ctrl 與 Meta（Mac Cmd）合併為同一旗標，讓預設鍵位跨平台皆可觸發 */
const modifierState = reactive({ ctrl: false, shift: false, alt: false });

/** 事件監聽器是否已註冊；避免多次呼叫 `ensureKeyTracking()` 重複掛監聽 */
let listenersRegistered = false;

/**
 * 將單一按鍵名稱正規化為 `keybindingStore` 儲存格式（例如 `' '` → `'Space'`、`'z'` → `'Z'`）。
 * @param key `KeyboardEvent.key` 原始值
 */
function normalizeKeyName(key: string): string {
    if (key === ' ') return 'Space';
    return key.length === 1 ? key.toUpperCase() : key;
}

/** 判斷是否為修飾鍵本身（按下 Ctrl 鍵時 `event.key === 'Control'`，不應被記為主鍵） */
function isModifierKey(key: string): boolean {
    return key === 'Control' || key === 'Meta' || key === 'Shift' || key === 'Alt';
}

/**
 * 由 `KeyboardEvent` 組出與 `keybindingStore` 儲存格式一致的鍵位字串（如 `'Ctrl+Z'`、`'W'`、`'Escape'`）。
 * @param event 原生鍵盤事件
 * @example
 * comboFromEvent(event) // → 'Ctrl+Z'
 */
export function comboFromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    if (!isModifierKey(event.key)) parts.push(normalizeKeyName(event.key));
    return parts.join('+');
}

/**
 * 註冊一次全域 `keydown` / `keyup` / `blur` 監聽，維護 `heldKeys` 與 `modifierState`。  \
 * 視窗失焦時瀏覽器不會補發 `keyup`，故監聽 `blur` 清空狀態，避免「卡鍵」。
 */
function ensureKeyTracking(): void {
    if (listenersRegistered) return;
    listenersRegistered = true;

    useEventListener(window, 'keydown', (event: KeyboardEvent) => {
        modifierState.ctrl = event.ctrlKey || event.metaKey;
        modifierState.shift = event.shiftKey;
        modifierState.alt = event.altKey;
        if (!isModifierKey(event.key)) {
            heldKeys.add(normalizeKeyName(event.key));
        }
    });
    useEventListener(window, 'keyup', (event: KeyboardEvent) => {
        modifierState.ctrl = event.ctrlKey || event.metaKey;
        modifierState.shift = event.shiftKey;
        modifierState.alt = event.altKey;
        if (!isModifierKey(event.key)) {
            heldKeys.delete(normalizeKeyName(event.key));
        }
    });
    useEventListener(window, 'blur', () => {
        heldKeys.clear();
        modifierState.ctrl = false;
        modifierState.shift = false;
        modifierState.alt = false;
    });
}

/** 依目前 `heldKeys` / `modifierState` 判斷指定鍵位字串是否正被按住 */
function isComboActive(combo: string): boolean {
    if (!combo) return false;
    const parts = combo.split('+');
    const mainKey = parts[parts.length - 1];
    return (
        modifierState.ctrl === parts.includes('Ctrl') &&
        modifierState.shift === parts.includes('Shift') &&
        modifierState.alt === parts.includes('Alt') &&
        heldKeys.has(mainKey)
    );
}

/** 目前是否有文字輸入元素 focus 中；用於擋下快捷鍵誤觸（例如在設定介面打字時按到 WASD） */
function isTypingTarget(): boolean {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return false;
    return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

/**
 * 依 `keybindingStore` 目前設定的鍵位，回傳「該動作是否正被按住」的 reactive boolean。  \
 * 供 hold 型互動（WASD 移動、Space 暫時切換平移工具）持續讀取。
 *
 * @param actionId `KEYBINDING_ACTIONS` 內的動作 id
 * @example
 * const panUp = useComboHeld('panUp')
 * watchEffect(() => { if (panUp.value) moveViewportUp() })
 */
export function useComboHeld(actionId: string): ComputedRef<boolean> {
    ensureKeyTracking();
    const keybindingStore = useKeybindingStore();
    return computed(() => {
        if (isTypingTarget()) return false;
        return isComboActive(keybindingStore.resolvedCombo(actionId));
    });
}

/**
 * 依 `keybindingStore` 目前設定的鍵位，在該鍵位「按下瞬間」執行一次 `callback`。  \
 * 用 `event.repeat` 過濾瀏覽器長按自動重複的 keydown，避免長按時反覆觸發。  \
 * 供 trigger 型互動（Undo、Delete、旋轉、重置畫布等單次觸發的快捷鍵）使用。
 *
 * @param actionId `KEYBINDING_ACTIONS` 內的動作 id
 * @param callback 觸發時執行的函式
 * @param options.preventDefault 是否呼叫 `event.preventDefault()`（例如攔截瀏覽器原生 Ctrl+R 重新整理）
 * @example
 * onComboTriggered('undo', () => historyStore.undo())
 */
export function onComboTriggered(
    actionId: string,
    callback: () => void,
    options: { preventDefault?: boolean } = {},
): void {
    const keybindingStore = useKeybindingStore();
    useEventListener(window, 'keydown', (event: KeyboardEvent) => {
        if (event.repeat || isTypingTarget()) return;
        if (comboFromEvent(event) !== keybindingStore.resolvedCombo(actionId)) return;
        if (options.preventDefault) event.preventDefault();
        callback();
    });
}

/**
 * 提供「錄製下一個按鍵組合」的能力，供快捷鍵設定介面的 rebind 互動使用。  \
 * 呼叫 `start()` 後開始監聽下一個 `keydown`；純修飾鍵（單獨按下 Ctrl/Shift/Alt/Meta）會被忽略，
 * 需等到一個非修飾鍵按下才會組出完整鍵位字串並呼叫 `onCaptured`，隨即自動停止監聽。
 *
 * @param onCaptured 錄製到鍵位時呼叫，帶入組好的鍵位字串
 * @example
 * const { isCapturing, start } = useKeyCapture((combo) => keybindingStore.setBinding('undo', combo))
 * start()
 */
export function useKeyCapture(onCaptured: (combo: string) => void) {
    /** 目前是否正在錄製下一個按鍵 */
    const isCapturing = ref(false);

    useEventListener(window, 'keydown', (event: KeyboardEvent) => {
        if (!isCapturing.value || isModifierKey(event.key)) return;
        event.preventDefault();
        isCapturing.value = false;
        onCaptured(comboFromEvent(event));
    });

    /** 開始錄製下一個按鍵 */
    function start(): void {
        isCapturing.value = true;
    }

    /** 取消錄製 */
    function cancel(): void {
        isCapturing.value = false;
    }

    return { isCapturing, start, cancel };
}
