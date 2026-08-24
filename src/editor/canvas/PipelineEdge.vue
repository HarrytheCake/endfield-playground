<script setup lang="ts">
import { computed } from 'vue';
import { BaseEdge } from '@vue-flow/core';
import type { EdgeProps } from '@vue-flow/core';
import type { FactoryEdgeData } from '@/types/graph';
import type { PortSide } from '@/types/machine';
import { buildPipelinePath, type PortAnchor } from '@/utils/pipelinePath';

/** Vue Flow 傳入的邊 props，data 為本管線的 FactoryEdgeData（portType） */
const props = defineProps<EdgeProps<FactoryEdgeData>>();

/**
 * 依起訖埠的座標與所在邊（Vue Flow 已提供，不需 `FactoryCanvas.vue` 額外計算），
 * 透過 `buildPipelinePath`（R-C3 §4.2 凍結演算法）算出直角折線頂點，拼成 SVG path。
 *
 * `sourcePosition`／`targetPosition` 的字串值（'top'|'right'|'bottom'|'left'）
 * 與 `PortSide` 完全一致，可直接當作 `PortAnchor.side` 使用。
 */
const path = computed(() => {
    const from: PortAnchor = {
        x: props.sourceX,
        y: props.sourceY,
        side: props.sourcePosition as PortSide,
    };
    const to: PortAnchor = {
        x: props.targetX,
        y: props.targetY,
        side: props.targetPosition as PortSide,
    };
    return buildPipelinePath(from, to)
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
        .join(' ');
});
</script>

<template>
    <BaseEdge :id="id" :path="path" :marker-end="markerEnd" :interaction-width="20" />
</template>
