/**
 * useShortcuts —— 全域鍵盤快捷鍵綁定
 *
 * 職責屬於 L2 容器層（依 CLAUDE.md §1，「快捷鍵」明列為 L2 範疇）。  \
 * 之所以放在 `src/composables/`，是因為跨 layout 共用，且需要與 L1 stores 直接互動。
 *
 * 目前支援的快捷鍵：
 *   - **Ctrl+Z / Cmd+Z**：呼叫 `historyStore.undo()` 還原藍圖變更
 *   - **Ctrl+Y / Cmd+Y**：呼叫 `historyStore.redo()` 取消還原
 *   - **Delete**：刪除目前選取的設備（透過 `editorStore.removeDevices()`），然後清空選取
 *   - **Space（按住）**：暫時切換至 `pan` 工具；放開回 `select`
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
     * Delete 鍵：刪除選取的設備並清空選取。  \
     * 無選取時為 no-op（editorStore.removeDevices 對空陣列也 silently 不入歷史）。
     */
    watch(
        () => keys.Delete.value,
        (pressed) => {
            if (!pressed) return;
            const targets = [...selectionStore.selectedNodeIds];
            if (targets.length === 0) return;
            editorStore.removeDevices(targets);
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
}
