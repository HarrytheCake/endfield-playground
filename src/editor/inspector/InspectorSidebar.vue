<script setup lang="ts">
import InspectorPanel from '@/editor/inspector/InspectorPanel.vue';

/** 右側 Inspector 面板目前是否展開，雙向綁定給父層控制 */
const open = defineModel<boolean>('open', { required: true });
</script>

<template>
    <USidebar
        v-model:open="open"
        side="right"
        collapsible="icon"
        :style="{ '--sidebar-width': '20rem' }"
        :ui="{
            gap: 'h-[calc(100%-var(--ui-header-height))]',
            container:
                'absolute top-(--ui-header-height) bottom-0 h-[calc(100%-var(--ui-header-height))] bg-black',
            header: 'px-2',
            body: 'p-0',
        }"
    >
        <template #header="{ state }">
            <div
                class="flex w-full items-center"
                :class="state === 'collapsed' ? 'justify-center' : 'justify-between gap-2'"
            >
                <div v-if="state === 'expanded'" class="min-w-0">
                    <p class="text-highlighted truncate text-sm font-semibold">Inspector</p>
                    <p class="text-muted truncate text-xs">地圖與模擬參數</p>
                </div>

                <UButton
                    size="sm"
                    variant="ghost"
                    color="neutral"
                    :icon="
                        state === 'expanded'
                            ? 'i-lucide-panel-right-close'
                            : 'i-lucide-panel-right-open'
                    "
                    :aria-label="state === 'expanded' ? '收合右側面板' : '展開右側面板'"
                    @click="open = !open"
                />
            </div>
        </template>

        <template #default="{ state }">
            <InspectorPanel v-if="state === 'expanded'" />
        </template>
    </USidebar>
</template>
