<script setup lang="ts">
import type { ToolMode } from '@/types/editor';
import { ref } from 'vue';
import { useEditorStore } from '@/store/editorStore';

defineProps<{
    /** 左側專案選單目前是否展開，控制收合按鈕圖示與 aria-label */
    sidebarOpen: boolean;
}>();

defineEmits<{
    /** 使用者點擊收合按鈕，請求上層切換左側選單開關狀態 */
    (event: 'toggle-sidebar'): void;
}>();

const editorStore = useEditorStore();
/** 目前開啟的檔案名稱，顯示於右側徽章（暫為寫死值，尚未接檔案系統） */
const fileName = ref('factory-layout-001.json');

/** 工具列可切換的編輯模式清單，對應 editorStore.activeTool */
const tools: Array<{ id: ToolMode; label: string }> = [
    { id: 'select', label: '選取' },
    { id: 'pan', label: '移動畫布' },
];
</script>

<template>
    <UHeader>
        <template #left>
            <UButton
                size="sm"
                variant="ghost"
                color="neutral"
                icon="i-lucide-panel-left"
                :aria-label="sidebarOpen ? '收合左側選單' : '展開左側選單'"
                @click="$emit('toggle-sidebar')"
            />
            <span class="text-toned text-sm font-semibold"> 終末地集成工業系統模擬器 </span>
        </template>

        <template #right>
            <UFieldGroup size="sm">
                <UButton
                    v-for="tool in tools"
                    :key="tool.id"
                    color="neutral"
                    :variant="editorStore.activeTool === tool.id ? 'solid' : 'soft'"
                    :label="tool.label"
                    @click="editorStore.setActiveTool(tool.id)"
                />
            </UFieldGroup>
            <UBadge color="neutral" variant="outline" size="md" :label="`目前檔名：${fileName}`" />
        </template>
    </UHeader>
</template>
