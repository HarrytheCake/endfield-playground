<script setup lang="ts">
import { onMounted } from 'vue';
import { getMockLayoutScenario, toLayoutSnapshot } from '@/data/mockLayout';
import GridCanvas from '@/editor/layout/GridCanvas.vue';
import { useLayoutStore } from '@/store/layoutStore';

/** 提供主畫面唯讀佈局資料及高階快照載入操作 */
const layoutStore = useLayoutStore();

/**
 * 首次進入主畫面且尚無設備時載入示範快照，避免空白畫布無法驗收。
 * 既有資料會完整保留，不會因元件重新掛載而被 fixture 覆寫。
 */
onMounted(() => {
    if (layoutStore.devices.length === 0) {
        layoutStore.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));
    }
});
</script>

<template>
    <div class="relative h-full w-full overflow-auto">
        <GridCanvas :devices="layoutStore.devices" :pipelines="layoutStore.pipelines" />
    </div>
</template>
