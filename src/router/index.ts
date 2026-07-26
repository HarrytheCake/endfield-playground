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
                    path: 'graph-viz',
                    name: 'dev-graph-viz',
                    component: () => import('@/app/dev/GraphViz.vue'),
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
        {
            path: '/:pathMatch(.*)*',
            redirect: '/',
        },
    ],
});

export default router;
