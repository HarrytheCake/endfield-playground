/**
 * useShortcuts —— 全域鍵盤快捷鍵綁定
 *
 * 職責屬於 L2 容器層（依 CLAUDE.md §1，「快捷鍵」明列為 L2 範疇）。  \
 * 之所以放在 `src/composables/`，是因為跨 layout 共用，且需要與 L1 stores 直接互動。
 *
 * 目前支援的快捷鍵：
 *   - **Ctrl+Z / Cmd+Z**：呼叫 `historyStore.undo()` 還原藍圖變更
 *   - **Ctrl+Y / Cmd+Y**：呼叫 `historyStore.redo()` 取消還原
 *   - **Delete**：刪除目前選取的設備與管線（分別透過 `editorStore.removeDevices()` / `editorStore.removeConnection()`），然後清空選取
 *   - **Space（按住）**：暫時切換至 `pan` 工具；放開回 `select`
 *   - **Ctrl+R / Cmd+R（暫時性）**：呼叫 `triggerResetCanvas()` 重置畫布。正式入口應為 L3 交付的按鈕 +
 *     `UModal` 確認框（見 `MILESTONE_0726.md`），本鍵位待該按鈕上線後應移除
 *
 * Copy / Paste 暫未實作 —— 需要先有「clipboard store」概念，待 harry / toby 進入  \
 * CR-01 框選互動細節時再補。
 *
 * @example
 * // App.vue
 * import { useShortcuts } from '@/composables/useShortcuts'
 * useShortcuts()
 */

import { computed, watch } from 'vue';
import { useEventListener, useMagicKeys } from '@vueuse/core';
import { useEditorStore } from '@/store/editorStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useHistoryStore } from '@/store/historyStore';

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
    const keys = useMagicKeys();

    /** Ctrl+Z 或 Cmd+Z 是否按下 */
    const isUndo = computed(() => keys['Ctrl+Z'].value || keys['Meta+Z'].value);
    /** Ctrl+Y 或 Cmd+Y 是否按下 */
    const isRedo = computed(() => keys['Ctrl+Y'].value || keys['Meta+Y'].value);

    /**
     * Delete 鍵：刪除選取的設備與管線，然後清空選取。  \
     * `removeConnection` 一次只收一個 uid，故管線選取需逐一呼叫。  \
     * 兩者皆無選取時為 no-op。
     */
    watch(
        () => keys.Delete.value,
        (pressed) => {
            if (!pressed) return;
            const deviceTargets = [...selectionStore.selectedNodeIds];
            const edgeTargets = [...selectionStore.selectedEdgeIds];
            if (deviceTargets.length === 0 && edgeTargets.length === 0) return;
            if (deviceTargets.length > 0) editorStore.removeDevices(deviceTargets);
            edgeTargets.forEach((uid) => editorStore.removeConnection(uid));
            selectionStore.clearSelection();
        },
    );

    /** Ctrl+Z：呼叫 historyStore 還原上一筆藍圖變更 */
    watch(isUndo, (pressed) => {
        if (pressed) historyStore.undo();
    });

    /** Ctrl+Y：呼叫 historyStore 取消還原 */
    watch(isRedo, (pressed) => {
        if (pressed) historyStore.redo();
    });

    /**
     * Space 鍵按住時暫時切換至 pan 工具（拖移畫布），放開回 select。  \
     * 使用原生 keydown / keyup 而非 useMagicKeys 是為了精準掌握按下 / 放開時機。
     */
    useEventListener(window, 'keydown', (event) => {
        if (event.code === 'Space') {
            editorStore.setActiveTool('pan');
        }
    });
    useEventListener(window, 'keyup', (event) => {
        if (event.code === 'Space') {
            editorStore.setActiveTool('select');
        }
    });

    /**
     * Ctrl+R / Cmd+R（**暫時性**）：呼叫 `triggerResetCanvas()`。  \
     * 用原生 `keydown` 監聽（而非 `useMagicKeys`）是為了能 `preventDefault()`，
     * 攔截瀏覽器原生的「重新整理頁面」行為。
     */
    useEventListener(window, 'keydown', (event) => {
        if (event.key.toLowerCase() === 'r' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            triggerResetCanvas();
        }
    });
}
