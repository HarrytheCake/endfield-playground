<script setup lang="ts">
import { ref } from 'vue';
import Navbar from '@/editor/navbar/Navbar.vue';
import ProjectSidebar from '@/editor/sidebar/ProjectSidebar.vue';
import ToolbarPanel from '@/editor/toolbar/ToolbarPanel.vue';
import FactoryCanvas from '@/editor/canvas/FactoryCanvas.vue';
import InspectorSidebar from '@/editor/inspector/InspectorSidebar.vue';
import { useFlowEngine } from '@/composables/useFlowEngine';

const sidebarOpen = ref(false);
const inspectorOpen = ref(true);

// E2：啟動 FlowEngine 監聽（watch + debounce 150ms）
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
