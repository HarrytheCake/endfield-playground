import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/app/layouts/MainLayout.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'editor',
            component: MainLayout,
        },
        // Dev-only routes (僅在開發環境可訪問)
        {
            path: '/dev',
            component: () => import('@/app/dev/DevLayout.vue'),
            beforeEnter: () => {
                // 僅在開發環境允許訪問
                return import.meta.env.DEV ? true : '/';
            },
            children: [
                {
                    path: '',
                    redirect: '/dev/flow-engine',
                },
                {
                    path: 'flow-engine',
                    name: 'dev-flow-engine',
                    component: () => import('@/app/dev/FlowEngineTest.vue'),
                },
                {
                    /** V9-H1-4：退役；拓樸／preset 以 FlowEngine 測試頁為準 */
                    path: 'graph-viz',
                    name: 'dev-graph-viz',
                    redirect: { name: 'dev-flow-engine' },
                },
                {
                    path: 'history-replay',
                    name: 'dev-history-replay',
                    component: () => import('@/app/dev/HistoryReplay.vue'),
                },
                {
                    path: 'validation-test',
                    name: 'dev-validation-test',
                    component: () => import('@/app/dev/ValidationTest.vue'),
                },
            ],
        },
        // 獨立於 DevLayout 之外：不掛在左側 dev 工具導覽列，只能直接切換網址到達
        {
            path: '/dev/paper-fig-main-field',
            name: 'dev-paper-fig-main-field',
            component: () => import('@/app/dev/PaperFigMainField.vue'),
            beforeEnter: () => {
                return import.meta.env.DEV ? true : '/';
            },
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/',
        },
    ],
});

export default router;
