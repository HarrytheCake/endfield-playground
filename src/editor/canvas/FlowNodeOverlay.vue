<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import type { NodeProps } from '@vue-flow/core';
import { storeToRefs } from 'pinia';
import type { FactoryNodeData } from '@/types/graph';
import { useFlowStore } from '@/store/flowStore';

const props = defineProps<NodeProps<FactoryNodeData>>();

const flowStore = useFlowStore();
const { nodeEfficiencies, invalidChainUids } = storeToRefs(flowStore);

/** 0~1 效率，undefined 表示尚未計算 */
const efficiency = computed(() => nodeEfficiencies.value.get(props.id));

/** 非合法鏈路 → 灰色虛線外框 */
const isInvalid = computed(() => invalidChainUids.value.has(props.id));

/** CR-01 旋轉畫面效果：rotation（0~3）換算成 CSS 旋轉角度 */
const rotationDeg = computed(() => (props.data.rotation ?? 0) * 90);

function efficiencyColorClass(eff: number): string {
    if (eff >= 1) return 'text-green-500';
    if (eff >= 0.5) return 'text-yellow-400';
    if (eff > 0) return 'text-orange-400';
    return 'text-gray-400';
}
</script>

<template>
    <div
        class="relative min-w-[100px] rounded border bg-zinc-800 px-3 py-2 text-sm text-white"
        :class="isInvalid ? 'border-dashed border-gray-500 opacity-50' : 'border-zinc-600'"
        :style="{ transform: `rotate(${rotationDeg}deg)` }"
    >
        <!-- target handle（左側） -->
        <Handle type="target" :position="Position.Left" />

        <!-- 節點標籤 -->
        <div class="leading-tight font-medium">
            {{ data.label }}
        </div>

        <!-- 效率標示（合法節點且已計算） -->
        <div
            v-if="efficiency !== undefined && !isInvalid"
            class="mt-0.5 text-xs font-bold"
            :class="efficiencyColorClass(efficiency)"
        >
            {{ Math.round(efficiency * 100) }}%
        </div>

        <!-- 非合法鏈路提示 -->
        <div v-if="isInvalid" class="mt-0.5 text-xs text-gray-500">非法</div>

        <!-- source handle（右側） -->
        <Handle type="source" :position="Position.Right" />
    </div>
</template>
