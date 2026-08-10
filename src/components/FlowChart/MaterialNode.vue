<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core';
const props = defineProps<NodeProps<{ label: string; ratePerMin: number }>>();
</script>

<template>
    <div
        class="min-w-[12.5] rounded-xl border-2 bg-gray-700 px-4 py-2 text-center text-sm text-white shadow-md"
        :class="selected ? 'border-blue-500' : 'border-transparent'"
    >
        <div class="font-bold">{{ data.label }}</div>
        <div class="text-xs text-gray-300">供給: {{ data.ratePerMin }}/min</div>

        <!-- 輸出連線點 -->
        <Handle type="source" :position="Position.Right" />
    </div>
</template>
