<template>
    <div class="dev-layout min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Header -->
        <header
            class="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        >
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="flex h-16 items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                            🧪 CR-04 Dev Tools
                        </h1>
                        <span
                            class="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        >
                            DEV ONLY
                        </span>
                    </div>
                    <RouterLink
                        to="/"
                        class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                        ← 返回主編輯器
                    </RouterLink>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
                <!-- Sidebar Navigation -->
                <aside class="md:col-span-1">
                    <nav class="sticky top-24 space-y-2">
                        <h2
                            class="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                        >
                            測試頁面
                        </h2>
                        <RouterLink
                            v-for="page in devPages"
                            :key="page.path"
                            :to="page.path"
                            class="block rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                            :class="{
                                'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200':
                                    route.path === page.path,
                                'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800':
                                    route.path !== page.path,
                            }"
                        >
                            <div class="flex items-center space-x-2">
                                <span>{{ page.icon }}</span>
                                <span>{{ page.name }}</span>
                            </div>
                            <p class="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400">
                                {{ page.description }}
                            </p>
                        </RouterLink>
                    </nav>
                </aside>

                <!-- Page Content -->
                <main class="md:col-span-3">
                    <RouterView />
                </main>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

/** 目前路由，供左側導覽列判斷哪個測試頁面處於選取狀態 */
const route = useRoute();

/** 左側導覽列可切換的 dev 測試頁面清單 */
const devPages = [
    {
        path: '/dev/flow-engine',
        name: 'FlowEngine 測試',
        icon: '⚙️',
        description: '手動測試流量計算引擎',
    },
    {
        path: '/dev/graph-viz',
        name: '圖結構視覺化',
        icon: '🔀',
        description: '查看拓撲排序與環路偵測',
    },
    {
        path: '/dev/history-replay',
        name: '歷史回放',
        icon: '⏮️',
        description: '測試 undo/redo 機制',
    },
    {
        path: '/dev/validation-test',
        name: '驗證系統測試',
        icon: '🚨',
        description: '測試 detector 註冊與警示顯示',
    },
];
</script>

<style scoped>
/* Additional styles if needed */
</style>
