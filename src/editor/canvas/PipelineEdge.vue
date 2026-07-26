<script setup lang="ts">
import { computed } from 'vue';
import { BaseEdge } from '@vue-flow/core';
import type { EdgeProps } from '@vue-flow/core';
import type { FactoryEdgeData } from '@/types/graph';

/** Vue Flow 傳入的邊 props，data 為本管線的 FactoryEdgeData（portType / bendPoints） */
const props = defineProps<EdgeProps<FactoryEdgeData>>();

/**
 * 依「起點 → 彎折點（依序） → 終點」拼接純直線段 SVG path。
 *
 * 彎折點在建立階段已被驗證為純水平 / 純垂直（CR-02 §2.3），
 * 故此處僅需逐點以直線指令連接，不需任何圓角或曲線運算即可畫出直角轉折。
 */
const path = computed(() => {
    const points = [
        { x: props.sourceX, y: props.sourceY },
        ...(props.data.bendPoints ?? []),
        { x: props.targetX, y: props.targetY },
    ];
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
});
</script>

<template>
    <BaseEdge :id="id" :path="path" :marker-end="markerEnd" :interaction-width="20" />
</template>
