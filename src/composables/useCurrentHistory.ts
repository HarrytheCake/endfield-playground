import { HistoryManager } from '@/lib/history';
import type { HistoryBasicRecord, HistoryRecordType } from '@/types/history';
import { onMounted, onUnmounted, ref } from 'vue';

/**
 * 監控當前歷史紀錄
 * @param type 歷史紀錄類型 (預設: 所有類型)
 */
export function useCurrentHistory(type?: HistoryRecordType) {
    const current = ref<HistoryBasicRecord | null>(null);
    const callbackId = ref<number | null>(null);

    onMounted(() => {
        callbackId.value = HistoryManager.subscribe((event) => {
            if (type && event.current?.type !== type) return;
            current.value = event.current;
        });
    });

    onUnmounted(() => {
        if (callbackId.value !== null) {
            HistoryManager.unsubscribe(callbackId.value);
            callbackId.value = null;
        }
    });

    return {
        /** 當前歷史紀錄 */
        current,
    };
}
