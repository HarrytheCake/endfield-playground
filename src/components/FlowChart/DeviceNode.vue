<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core';
import { getEfficiencyBg } from '@/utils/flowHelpers';

const props = defineProps<
    NodeProps<{
        label: string;
        efficiency: number | null;
        iconUrl: string;
        recipeName: string | null;
    }>
>();
</script>

<template>
    <div
        class="min-w-[15] border-2 p-3 text-sm shadow-md"
        :class="[getEfficiencyBg(data.efficiency), selected ? 'border-blue-500' : '']"
    >
        <!-- 輸入點 -->
        <Handle type="target" :position="Position.Left" />

        <div class="mb-1 flex items-center gap-2">
            <span class="text-lg">{{ data.iconUrl }}</span>
            <span class="font-bold text-gray-800">{{ data.label }}</span>
        </div>
        <div class="text-xs text-gray-600">配方: {{ data.recipeName || '無' }}</div>
        <div class="mt-1 text-xs font-semibold text-gray-700">
            效率:
            {{
                data.efficiency !== null ? `${(data.efficiency * 100).toFixed(0)}%` : '未計算 (灰)'
            }}
        </div>

        <!-- 輸出點 -->
        <Handle type="source" :position="Position.Right" />
    </div>
</template>
