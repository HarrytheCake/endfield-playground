<script setup lang="ts">
import { computed } from 'vue';
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from '@vue-flow/core';

// 1. 承接 3.7 定義的 Edge 資料結構
const props = defineProps<
    EdgeProps<{
        itemName: string;
        ratePerMin: number;
        highlighted?: boolean;
    }>
>();

// 2. 自動計算兩節點之間的貝茲曲線路徑與中央中心點 (labelX, labelY)
const edgePath = computed(() => {
    const [path, x, y] = getBezierPath({
        sourceX: props.sourceX,
        sourceY: props.sourceY,
        sourcePosition: props.sourcePosition,
        targetX: props.targetX,
        targetY: props.targetY,
        targetPosition: props.targetPosition,
    });
    return { path, x, y };
});
</script>

<template>
    <!-- 渲染 SVG 連接線段 -->
    <path
        :id="id"
        :style="style"
        class="vue-flow__edge-path transition-all duration-300"
        :class="[
            data?.highlighted
                ? 'stroke-blue-500 stroke-[3px] drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]'
                : 'stroke-gray-400 stroke-[2px]',
        ]"
        :d="edgePath.path"
        marker-end="url(#vue-flow__arrow)"
    />

    <EdgeLabelRenderer>
        <div
            :style="{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${edgePath.x}px,${edgePath.y}px)`,
                pointerEvents: 'all',
            }"
            class="flex flex-col items-center justify-center rounded border bg-white px-2 py-1 text-[10px] font-medium shadow-sm transition-colors select-none"
            :class="[
                data?.highlighted
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600',
            ]"
        >
            <!-- 顯示品項名稱 -->
            <span class="font-bold whitespace-nowrap">{{ data?.itemName }}</span>
            <!-- 顯示每分鐘流速 -->
            <span class="scale-90 text-gray-400" :class="{ 'text-blue-500': data?.highlighted }">
                {{ data?.ratePerMin }}/min
            </span>
        </div>
    </EdgeLabelRenderer>
</template>

<style scoped>
/* 確保 SVG 線段有平滑的過渡動畫 */
.vue-flow__edge-path {
    fill: none;
}
</style>
