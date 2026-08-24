<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { BaseEdge } from '@vue-flow/core';
import type { EdgeProps } from '@vue-flow/core';
import type { FactoryEdgeData } from '@/types/graph';
import type { PortSide } from '@/types/machine';
import { buildPipelinePath, type PortAnchor } from '@/utils/pipelinePath';
import { PIPELINE_GRID_SIZE_KEY } from './injectionKeys';

/** Vue Flow 傳入的邊 props，data 為本管線的 FactoryEdgeData（portType） */
const props = defineProps<EdgeProps<FactoryEdgeData>>();

/**
 * 畫布格線像素大小，由 `FactoryCanvas.vue` 用 `provide` 注入（見 `injectionKeys.ts`）。
 * 用 inject 而非直接 `useCanvasStore()`，是為了遵守 L3 不 import store 的規則
 * （R-C3 DoD 明確要求），同時仍能吃到 `canvasStore.gridSize` 的即時值。
 * 找不到 provide（例如未來獨立測試／dev 預覽）時 fallback 20，與 canvasStore 預設值一致。
 */
const gridSize = inject(PIPELINE_GRID_SIZE_KEY, ref(20));

/**
 * 依起訖埠的座標與所在邊（Vue Flow 已提供，不需 `FactoryCanvas.vue` 額外計算），
 * 透過 `buildPipelinePath`（R-C3 §4.2 凍結演算法）算出直角折線頂點，拼成 SVG path。
 * Z 形的中繼點會吸附到 `gridSize` 的格線，讓管線中段貼齊背景格線。
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
    return buildPipelinePath(from, to, gridSize.value)
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
        .join(' ');
});
</script>

<template>
    <BaseEdge :id="id" :path="path" :marker-end="markerEnd" :interaction-width="20" />
</template>
