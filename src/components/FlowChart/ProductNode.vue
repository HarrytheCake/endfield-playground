<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core';
const props = defineProps<NodeProps<{ label: string; iconUrl: string; ratePerMin: number }>>();
</script>

<template>
    <div
        class="aspect-ratio-4/3; flex min-w-[12.5] flex-col items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm"
        :class="{ 'border-blue-500 ring-2 ring-blue-200': selected }"
    >
        <Handle type="target" :position="Position.Left" />

        <div class="flex items-center gap-1">
            <span>{{ data.iconUrl }}</span>
            <span class="font-bold text-gray-800">{{ data.label }}</span>
        </div>
        <div class="text-xs text-gray-500">{{ data.ratePerMin }}/min</div>

        <Handle type="source" :position="Position.Right" />
    </div>
</template>
