<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core';
const props = defineProps<NodeProps<{ label: string; iconUrl: string }>>();
</script>

<template>
    <div
        class="relative min-w-[15] border-2 border-dashed border-gray-400 bg-gray-100/50 p-3 text-sm opacity-60 select-none"
        :class="{ 'border-solid border-blue-500': selected }"
    >
        <!-- 待導入可能需要連線，暫且保留 Handle -->
        <Handle type="target" :position="Position.Left" />

        <div class="flex items-center gap-2">
            <span class="text-lg grayscale">{{ data.iconUrl }}</span>
            <span class="font-bold text-gray-500">{{ data.label }}</span>
        </div>

        <!-- Phase 2 標記 -->
        <div
            class="absolute -top-2.5 -right-2 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] text-white shadow"
        >
            待導入
        </div>

        <Handle type="source" :position="Position.Right" />
    </div>
</template>
