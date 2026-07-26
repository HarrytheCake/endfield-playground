<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useEditorStore } from '@/store/editorStore';
import ProductionStats from '@/editor/stats/ProductionStats.vue';

const editorStore = useEditorStore();
const { mapWidth, mapHeight, snapToGrid } = storeToRefs(editorStore);

/** 工廠寬度輸入框的 model，寫入時同步呼叫 editorStore.setMapSize 更新地圖尺寸 */
const mapWidthInput = computed({
    get: () => mapWidth.value,
    set: (value: number) => editorStore.setMapSize(Number(value), mapHeight.value),
});

/** 工廠高度輸入框的 model，寫入時同步呼叫 editorStore.setMapSize 更新地圖尺寸 */
const mapHeightInput = computed({
    get: () => mapHeight.value,
    set: (value: number) => editorStore.setMapSize(mapWidth.value, Number(value)),
});
</script>

<template>
    <div class="panel flex h-full flex-col gap-3 p-3">
        <h2 class="panel-title">Inspector</h2>
        <div class="space-y-3">
            <UFormField label="工廠寬度">
                <UInputNumber v-model="mapWidthInput" :min="64" :step="16" />
            </UFormField>

            <UFormField label="工廠高度">
                <UInputNumber v-model="mapHeightInput" :min="64" :step="16" />
            </UFormField>

            <UCheckbox
                :model-value="snapToGrid"
                label="Snap to grid"
                @update:model-value="editorStore.setSnapToGrid(Boolean($event))"
            />
        </div>

        <div class="mt-2 border-t border-zinc-700 pt-3">
            <h3 class="text-xs tracking-wide text-zinc-400 uppercase">未來預留</h3>
            <ul class="mt-2 space-y-1 text-sm text-zinc-300">
                <li>電力模式</li>
                <li>模擬速度</li>
                <li>生產目標</li>
            </ul>
        </div>

        <div class="mt-2 border-t border-zinc-700 pt-3">
            <h3 class="text-xs tracking-wide text-zinc-400 uppercase">產能資訊</h3>
            <div class="mt-2">
                <ProductionStats />
            </div>
        </div>
    </div>
</template>
