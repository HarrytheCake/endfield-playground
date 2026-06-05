<script setup lang="ts">
import { ref } from 'vue';
import Navbar from '@/editor/navbar/Navbar.vue';
import ProjectSidebar from '@/editor/sidebar/ProjectSidebar.vue';
import ToolbarPanel from '@/editor/toolbar/ToolbarPanel.vue';
import FactoryCanvas from '@/editor/canvas/FactoryCanvas.vue';
import InspectorSidebar from '@/editor/inspector/InspectorSidebar.vue';
import { useFlowEngine } from '@/composables/useFlowEngine';
import { useValidation } from '@/composables/useValidation';

const sidebarOpen = ref(false);
const inspectorOpen = ref(true);

/**
 * 啟動 CR-03 驗證監聽（藍圖變動時 sync 重跑所有 detector）。  \
 * 必須在 useFlowEngine() 之前呼叫，FlowEngine 才能讀到最新的 alerts。
 */
useValidation();

/** 啟動 CR-04 FlowEngine 監聽（watch + debounce 150ms） */
useFlowEngine();
</script>

<template>
    <div class="editor-layout">
        <header class="area-navbar">
            <Navbar :sidebar-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
        </header>

        <div class="area-workspace">
            <ProjectSidebar v-model:open="sidebarOpen" />

            <div class="workspace-main">
                <main class="area-canvas">
                    <FactoryCanvas />
                </main>
                <section class="area-toolbar">
                    <ToolbarPanel />
                </section>
            </div>

            <InspectorSidebar v-model:open="inspectorOpen" />
        </div>
    </div>
</template>
