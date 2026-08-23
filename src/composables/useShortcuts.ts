/**
 * useShortcuts —— 全域鍵盤快捷鍵綁定
 *
 * 職責屬於 L2 容器層（依 CLAUDE.md §1，「快捷鍵」明列為 L2 範疇）。  \
 * 之所以放在 `src/composables/`，是因為跨 layout 共用，且需要與 L1 stores 直接互動。
 *
 * 所有鍵位皆可經 `keybindingStore` 配置（見 `docs/harry/PLAN_configurableShortcuts.md`），
 * 本檔案只負責「動作觸發時做什麼」，鍵位本身一律透過 `useComboHeld` / `onComboTriggered`
 * 動態讀取 `keybindingStore.resolvedCombo()`，不再硬編字串。
 *
 * 目前支援的快捷鍵（預設鍵位，實際鍵位以 `keybindingStore` 為準）：
 *   - **Ctrl+Z / Cmd+Z**：呼叫 `historyStore.undo()` 還原藍圖變更
 *   - **Ctrl+Y / Cmd+Y**：呼叫 `historyStore.redo()` 取消還原
 *   - **Delete**：刪除目前選取的設備與管線，然後清空選取
 *   - **Space（按住）**：暫時切換至 `pan` 工具；放開還原為按住前的工具
 *   - **P**：切換管線工具（`connect`），再按一次回到 `select`
 *   - **X**：切換框選工具（`box-select`），再按一次回到 `pan`
 *   - **Ctrl+R / Cmd+R（暫時性）**：呼叫 `triggerResetCanvas()` 重置畫布。正式入口應為 L3
 *     交付的按鈕 + `UModal` 確認框（見 `MILESTONE_0726.md`），本鍵位待該按鈕上線後應移除
 *   - **Escape**：非拿起預覽狀態時開啟快捷鍵設定介面（拿起預覽中的取消行為固定綁在 Escape，
 *     不受本鍵位配置影響，邏輯在 `FactoryCanvas.vue`）
 *
 * WASD 畫面平移因需要 Vue Flow viewport context，實作於 `FactoryCanvas.vue`，非本檔案範圍。
 *
 * Copy / Paste 暫未實作 —— 需要先有「clipboard store」概念，待 harry / toby 進入  \
 * CR-01 框選互動細節時再補。
 *
 * @example
 * // App.vue
 * import { useShortcuts } from '@/composables/useShortcuts'
 * useShortcuts()
 */

import { watch } from 'vue';
import { useEditorStore } from '@/store/editorStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useHistoryStore } from '@/store/historyStore';
import { useKeybindingStore } from '@/store/keybindingStore';
import { onComboTriggered, useComboHeld } from '@/composables/useKeybinding';
import type { ToolMode } from '@/types/editor';

/**
 * 重置畫布觸發器（**暫時性**）。  \
 * `editorStore.resetCanvas()` 目前未走 Command Pattern，操作無法 Ctrl+Z 復原，
 * 故先跳原生 `window.confirm()` 防呆；待 L3 正式按鈕 + `UModal` 確認框交付後，
 * 這裡的 `window.confirm()` 應移除，改由呼叫端（按鈕的 UModal 流程）負責確認。  \
 * 匯出此函式是為了讓日後 L3 按鈕的 L2 wiring（例如 `Navbar.vue`）可以直接 import
 * 呼叫，不必重寫一次確認邏輯。
 *
 * @example
 * import { triggerResetCanvas } from '@/composables/useShortcuts'
 * triggerResetCanvas()
 */
export function triggerResetCanvas() {
    const editorStore = useEditorStore();
    if (!window.confirm('確定要重置畫布嗎？此動作無法復原（Ctrl+Z 不會還原）。')) {
        return;
    }
    editorStore.resetCanvas();
}

/**
 * 註冊全域快捷鍵 watcher。  \
 * 元件生命週期結束時 Vue 會自動清理本 composable 註冊的 watcher 與 event listener。
 */
export function useShortcuts() {
    const editorStore = useEditorStore();
    const selectionStore = useSelectionStore();
    const historyStore = useHistoryStore();
    const keybindingStore = useKeybindingStore();

    /** 復原：由未按下轉為按下瞬間觸發一次 */
    onComboTriggered('undo', () => historyStore.undo());

    /** 取消復原：由未按下轉為按下瞬間觸發一次 */
    onComboTriggered('redo', () => historyStore.redo());

    /**
     * 刪除選取的設備與管線，然後清空選取。  \
     * `removeConnection` 一次只收一個 uid，故管線選取需逐一呼叫。  \
     * 兩者皆無選取時為 no-op。
     */
    onComboTriggered('deleteSelection', () => {
        const deviceTargets = [...selectionStore.selectedNodeIds];
        const edgeTargets = [...selectionStore.selectedEdgeIds];
        if (deviceTargets.length === 0 && edgeTargets.length === 0) return;
        if (deviceTargets.length > 0) editorStore.removeDevices(deviceTargets);
        edgeTargets.forEach((uid) => editorStore.removeConnection(uid));
        selectionStore.clearSelection();
    });

    /** 重置畫布（暫時性）：攔截瀏覽器原生 Ctrl+R / Cmd+R 重新整理 */
    onComboTriggered('resetCanvasTemp', () => triggerResetCanvas(), { preventDefault: true });

    /**
     * 開啟快捷鍵設定介面。  \
     * 拿起預覽中優先由 `FactoryCanvas.vue` 的固定 Escape 監聽處理取消，本處不重複開面板；
     * 面板已開啟時本處也不重複觸發，關閉一律交給 `UModal` 自己的 Esc / 外部點擊處理，
     * 避免兩個 Escape 監聽互踩（見 `docs/harry/PLAN_shortcutSettingsPanel.md` §2）。
     */
    onComboTriggered('openSettings', () => {
        if (editorStore.placementArmed || keybindingStore.isSettingsPanelOpen) return;
        keybindingStore.openSettingsPanel();
    });

    /** 暫時切 pan 前的工具，放開後還原（避免把 connect 等工具打回 select） */
    let toolBeforePan: ToolMode | null = null;

    /** Space（可配置）持續按住時暫時切換至 pan 工具，放開後還原為按住前的工具 */
    const holdPan = useComboHeld('holdPan');
    watch(holdPan, (held) => {
        if (held) {
            toolBeforePan = editorStore.activeTool;
            editorStore.setActiveTool('pan');
        } else {
            editorStore.setActiveTool(toolBeforePan ?? 'select');
            toolBeforePan = null;
        }
    });

    /** P（可配置）切換管線工具（connect），再次觸發回到 select */
    onComboTriggered('toggleConnectTool', () => {
        editorStore.setActiveTool(editorStore.activeTool === 'connect' ? 'select' : 'connect');
    });

    /** X（可配置）切換框選工具（box-select），再次觸發回到 pan */
    onComboTriggered('toggleBoxSelectTool', () => {
        editorStore.setActiveTool(editorStore.activeTool === 'box-select' ? 'pan' : 'box-select');
    });
}
