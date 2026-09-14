/**
 * V12-D1 演示頁的獨立入口（dev only）
 *
 * 開發進度存證頁不進 `src/router`／`DevLayout.vue`：那兩個檔屬於他人本週工作，  \
 * 互相牽動只會製造衝突。這裡自己 `createApp`，只掛 Pinia 與樣式，  \
 * 由 Vite dev server 以獨立 HTML 提供：
 *
 * ```text
 * pnpm dev → http://localhost:5173/dev/layout-store-preview.html
 * ```
 *
 * `vite build` 只吃根目錄 `index.html`，本入口不會進 production bundle。
 */

import { createApp, h } from 'vue';
import { createPinia } from 'pinia';
import '@/style.css';
import LayoutStorePreview from '@/app/dev/LayoutStorePreview.vue';

/** 對齊 DevLayout 內容區的淺色底，讓元件的 dark: 變體不會落在深色 :root 上 */
const app = createApp(() =>
    h('div', { class: 'min-h-screen bg-gray-50 p-6 text-gray-900' }, [h(LayoutStorePreview)]),
);

app.use(createPinia());
app.mount('#app');
