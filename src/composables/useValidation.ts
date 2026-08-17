/**
 * CR-03 useValidation
 *
 * 串接 editorStore 變動到 validationStore：藍圖一改，所有已註冊 detector 立即重新執行，  \
 * 結果寫入 `validationStore.alerts`，供 CR-04 FlowEngine 與右側統計面板消費。
 *
 * 監聽策略：
 *   - 監聽目標：`editorStore.nodes` 與 `editorStore.edges`
 *   - `immediate: true`：setup 時跑一次初始驗證
 *   - `deep: true`：捕捉節點內部變動（旋轉、配方、tag 變更等）
 *   - **不使用 debounce**：驗證必須先於 FlowEngine 完成，FlowEngine 才能讀到最新 alerts
 *
 * 為了讓 FlowEngine 用到最新的 alerts，**請在 MainLayout setup 時先呼叫本 composable，再呼叫 `useFlowEngine()`**。
 *
 * @example
 * // MainLayout.vue
 * useValidation()
 * useFlowEngine()
 */

import { watch } from 'vue';
import { useEditorStore } from '@/store/editorStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useValidationStore } from '@/store/validationStore';
import { getMachine } from '@/data/machines';
import type { ValidationContext } from '@/types/validation';

/**
 * 啟動驗證監聽。  \
 * 元件生命週期結束時 Vue 會自動清理本 composable 註冊的 watcher。
 *
 * @returns 暴露 `runValidation()` 供外部手動觸發（如 dev 測試頁、單元測試）
 */
export function useValidation() {
    const editorStore = useEditorStore();
    const canvasStore = useCanvasStore();
    const validationStore = useValidationStore();

    /**
     * 從目前的 editorStore 建立 ValidationContext。  \
     * getDef 直接代理至 `getMachine`，提供 detector 取得設備靜態定義。
     * baseRegion 從 canvasStore 取得，用於 E002 / E006 等邊界檢查。
     * @returns 供各 detector 讀取的驗證上下文
     * @example
     * const context = buildContext()
     */
    function buildContext(): ValidationContext {
        return {
            devices: editorStore.nodes,
            connections: editorStore.edges,
            getDef: getMachine,
            baseRegion: canvasStore.baseRegion,
        };
    }

    /** 用當前藍圖狀態跑一次完整驗證；結果寫入 validationStore.alerts */
    function runValidation(): void {
        console.log('[Validation] runValidation start', {
            devices: editorStore.nodes.length,
            connections: editorStore.edges.length,
        });
        validationStore.run(buildContext());
        console.log('[Validation] runValidation complete');
    }

    watch([() => editorStore.nodes, () => editorStore.edges], runValidation, {
        deep: true,
        immediate: true,
    });

    return {
        /** 用當前藍圖狀態跑一次完整驗證；結果寫入 validationStore.alerts */
        runValidation,
    };
}
