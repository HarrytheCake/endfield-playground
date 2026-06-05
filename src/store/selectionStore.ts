import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

/**
 * CR-01 useSelectionStore
 *
 * 追蹤畫布上目前選取的設備節點 uid 清單。  \
 * 屬於純 UI 互動狀態（**不進歷史**）—— 框選 / Shift+點選 / 程式碼設定皆透過本 store 寫入。
 *
 * 主要消費者：
 *   - `FactoryCanvas.vue`（L2）：偵測 Vue Flow `selection-change` 事件後寫入
 *   - `useShortcuts`（L2）：Delete 鍵讀取選取清單後呼叫 `editorStore.removeDevices()`
 *
 * @example
 * const selection = useSelectionStore()
 * selection.setSelection(['node-1', 'node-2'])
 * if (selection.hasSelection) {
 *     editorStore.removeDevices(selection.selectedNodeIds)
 *     selection.clearSelection()
 * }
 */
export const useSelectionStore = defineStore('selection', () => {
    /** 目前選取的節點 uid 清單；空陣列代表無選取 */
    const selectedNodeIds = ref<string[]>([]);

    /** 是否存在任何選取（給 UI 判斷按鈕 disabled 等狀態） */
    const hasSelection = computed(() => selectedNodeIds.value.length > 0);

    /** 是否為多重選取（兩個以上） */
    const isMultiSelect = computed(() => selectedNodeIds.value.length > 1);

    /**
     * 整批覆寫目前的選取清單。  \
     * 若要清空請呼叫 `clearSelection()` 而非傳入空陣列，語意較清楚。
     *
     * @param ids 新的選取 uid 陣列
     */
    function setSelection(ids: string[]) {
        selectedNodeIds.value = ids;
    }

    /** 清空目前選取清單 */
    function clearSelection() {
        selectedNodeIds.value = [];
    }

    return {
        /** 目前選取的節點 uid 清單；空陣列代表無選取 */
        selectedNodeIds,
        /** 是否存在任何選取（給 UI 判斷按鈕 disabled 等狀態） */
        hasSelection,
        /** 是否為多重選取（兩個以上） */
        isMultiSelect,
        /**
         * 整批覆寫目前的選取清單。  \
         * 若要清空請呼叫 `clearSelection()` 而非傳入空陣列，語意較清楚。
         *
         * @param ids 新的選取 uid 陣列
         */
        setSelection,
        /** 清空目前選取清單 */
        clearSelection,
    };
});
