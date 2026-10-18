/**
 * V17-H2／#58：router 導航後依情境邊界清空 history。
 */

import type { Router } from 'vue-router';
import { useHistoryStore } from '@/store/historyStore';
import { shouldClearHistoryOnNavigate } from '@/utils/history/historyContext';

/**
 * 註冊 `afterEach`：跨正式／dev 時呼叫 `historyStore.clear()`。
 *
 * 須在 `app.use(pinia)` 之後、`app.use(router)` 時或之後呼叫（本專案於 router 模組底註冊，
 * 實際導航發生在 pinia 已安裝之後）。
 */
export function installClearHistoryOnContextSwitch(router: Router): void {
    router.afterEach((to, from) => {
        if (!shouldClearHistoryOnNavigate(from.fullPath, to.fullPath)) return;
        useHistoryStore().clear();
    });
}
