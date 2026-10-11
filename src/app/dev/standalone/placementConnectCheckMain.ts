/**
 * V14 週會演示：落子預檢／連線規則（dev only）
 *
 * ```text
 * pnpm dev → http://localhost:5173/dev/placement-connect-check.html
 * ```
 *
 * 不掛 `src/router`／`DevLayout`（不動他人檔；不進 production bundle）。
 */

import { createApp, h } from 'vue';
import '@/style.css';
import PlacementConnectCheckDemo from '@/app/dev/PlacementConnectCheckDemo.vue';

const app = createApp(() =>
    h('div', { class: 'min-h-screen bg-slate-50 p-6 text-slate-900' }, [
        h(PlacementConnectCheckDemo),
    ]),
);

app.mount('#app');
