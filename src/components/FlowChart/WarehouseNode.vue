<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core';
const props = defineProps<NodeProps<{ label: string; iconUrl: string; itemName: string }>>();
</script>

<template>
    <div
        class="aspect-ratio-4/3; flex min-w-[12.5] flex-col items-center justify-center rounded-full border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm shadow-sm"
        :class="{ 'border-solid border-blue-500 ring-2 ring-blue-200': selected }"
    >
        <Handle type="target" :position="Position.Left" />

        <div class="mb-0.5 text-xl">{{ data.iconUrl }}</div>
        <div class="text-xs font-bold text-amber-900">{{ data.label }}</div>
        <div class="text-[11px] text-amber-700">品項: {{ data.itemName }}</div>
    </div>
</template>
