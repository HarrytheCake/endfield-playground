import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { Alert, Detector, ValidationContext } from '@/types/validation';

/**
 * CR-03 useValidationStore
 *
 * 收集所有 detector 的偵測結果，供 CR-04 FlowEngine 過濾掉有 Error 的節點，  \
 * 並供右側統計面板顯示警示列表。
 *
 * Detector 註冊由各 detector 模組自行呼叫 registerDetector()，  \
 * 也可由初始化階段集中註冊。
 *
 * **本 store 的變更不進歷史**：屬於衍生狀態，由 FlowEngine 與藍圖變動 watch 自動重算。
 *
 * @example
 * import { useValidationStore } from '@/store/validationStore'
 * import { E001_deviceOverlap } from '@/lib/validation/detectors/E001_deviceOverlap'
 *
 * const validationStore = useValidationStore()
 * validationStore.registerDetector(E001_deviceOverlap)
 * validationStore.run({ devices, connections, getDef })
 */
export const useValidationStore = defineStore('validation', () => {
    /** 所有目前有效的警示，每次 run() 後重置 */
    const alerts = ref<Alert[]>([]);

    /** 已註冊的 detector 列表 */
    const detectors = ref<Detector[]>([]);

    /** Error 等級警示數量 */
    const errorCount = computed(() => alerts.value.filter((a) => a.level === 'error').length);

    /** Warning 等級警示數量 */
    const warningCount = computed(() => alerts.value.filter((a) => a.level === 'warning').length);

    /** 是否存在任何 Error 警示 */
    const hasAnyError = computed(() => errorCount.value > 0);

    /**
     * 註冊一個 detector。重複註冊（同 code）會被忽略。
     *
     * @param detector 要註冊的 detector
     * @example
     * validationStore.registerDetector(E001_deviceOverlap)
     */
    function registerDetector(detector: Detector): void {
        if (detectors.value.some((d) => d.code === detector.code)) {
            console.log(`[ValidationStore] detector ${detector.code} already registered`);
            return;
        }
        console.log(`[ValidationStore] registerDetector ${detector.code}`);
        detectors.value = [...detectors.value, detector];
    }

    /**
     * 取消註冊 detector（測試或熱重載時使用）。
     *
     * @param code detector 代碼
     * @returns 是否成功取消
     */
    function unregisterDetector(code: string): boolean {
        const next = detectors.value.filter((d) => d.code !== code);
        if (next.length === detectors.value.length) return false;
        detectors.value = next;
        return true;
    }

    /**
     * 執行所有 detector 並更新 alerts。  \
     * 單一 detector 拋例外不會影響其他 detector，僅在 console 記錄錯誤。
     *
     * @param ctx 驗證上下文
     */
    function run(ctx: ValidationContext): void {
        console.log('[ValidationStore] run start', {
            deviceCount: ctx.devices.length,
            connectionCount: ctx.connections.length,
            detectors: detectors.value.map((d) => d.code),
        });
        console.time('[ValidationStore] run');
        const collected: Alert[] = [];
        for (const detector of detectors.value) {
            console.time(`[Detector ${detector.code}]`);
            console.log(`[ValidationStore] detector ${detector.code} start`);
            try {
                const results = detector.run(ctx);
                collected.push(...results);
                console.log(`[ValidationStore] detector ${detector.code} complete`, {
                    resultCount: results.length,
                });
            } catch (err) {
                console.error(`[Detector ${detector.code}] 偵測失敗:`, err);
            } finally {
                console.timeEnd(`[Detector ${detector.code}]`);
            }
        }
        alerts.value = collected;
        console.timeEnd('[ValidationStore] run');
        console.log('[ValidationStore] run complete', { alerts: alerts.value.length });
    }

    /** 清空所有警示與已註冊 detector */
    function reset(): void {
        alerts.value = [];
        detectors.value = [];
    }

    /**
     * 查詢指定設備是否有 blocking error（CR-04 FlowEngine 用以略過該節點）。
     *
     * @param deviceUid 設備 uid
     * @returns 是否存在針對該設備的 error
     */
    function hasBlockingError(deviceUid: string): boolean {
        return alerts.value.some(
            (a) => a.level === 'error' && a.relatedDeviceUids.includes(deviceUid),
        );
    }

    /**
     * 取得指定設備的所有警示。
     *
     * @param deviceUid 設備 uid
     * @returns 該設備相關的 Alert 陣列（含 error 與 warning）
     */
    function alertsByDevice(deviceUid: string): Alert[] {
        return alerts.value.filter((a) => a.relatedDeviceUids.includes(deviceUid));
    }

    /**
     * 取得指定管線的所有警示。
     *
     * @param connectionUid 管線 uid
     * @returns 該管線相關的 Alert 陣列
     */
    function alertsByConnection(connectionUid: string): Alert[] {
        return alerts.value.filter((a) => a.relatedConnectionUids.includes(connectionUid));
    }

    return {
        /** 所有目前有效的警示，每次 run() 後重置 */
        alerts,
        /** 已註冊的 detector 列表 */
        detectors,
        /** Error 等級警示數量 */
        errorCount,
        /** Warning 等級警示數量 */
        warningCount,
        /** 是否存在任何 Error 警示 */
        hasAnyError,
        /**
         * 註冊一個 detector。重複註冊（同 code）會被忽略。
         *
         * @param detector 要註冊的 detector
         * @example
         * validationStore.registerDetector(E001_deviceOverlap)
         */
        registerDetector,
        /**
         * 取消註冊 detector（測試或熱重載時使用）。
         *
         * @param code detector 代碼
         * @returns 是否成功取消
         */
        unregisterDetector,
        /**
         * 執行所有 detector 並更新 alerts。  \
         * 單一 detector 拋例外不會影響其他 detector，僅在 console 記錄錯誤。
         *
         * @param ctx 驗證上下文
         */
        run,
        /** 清空所有警示與已註冊 detector */
        reset,
        /**
         * 查詢指定設備是否有 blocking error（CR-04 FlowEngine 用以略過該節點）。
         *
         * @param deviceUid 設備 uid
         * @returns 是否存在針對該設備的 error
         */
        hasBlockingError,
        /**
         * 取得指定設備的所有警示。
         *
         * @param deviceUid 設備 uid
         * @returns 該設備相關的 Alert 陣列（含 error 與 warning）
         */
        alertsByDevice,
        /**
         * 取得指定管線的所有警示。
         *
         * @param connectionUid 管線 uid
         * @returns 該管線相關的 Alert 陣列
         */
        alertsByConnection,
    };
});
