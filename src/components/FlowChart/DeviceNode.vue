<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { getEfficiencyBg } from '@/utils/flowHelpers'

const props = defineProps<{
  data: { label: string; efficiency: number | null; iconUrl: string; recipeName: string | null }
  selected?: boolean
}>()
</script>

<template>
  <div 
    class="p-3 border-2 text-sm shadow-md min-w-[15]"
    :class="[getEfficiencyBg(data.efficiency), selected ? 'border-blue-500' : '']"
  >
    <!-- 輸入點 -->
    <Handle type="target" :position="Position.Left" />

    <div class="flex items-center gap-2 mb-1">
      <span class="text-lg">{{ data.iconUrl }}</span>
      <span class="font-bold text-gray-800">{{ data.label }}</span>
    </div>
    <div class="text-xs text-gray-600">配方: {{ data.recipeName || '無' }}</div>
    <div class="text-xs font-semibold mt-1 text-gray-700">
      效率: {{ data.efficiency !== null ? `${(data.efficiency * 100).toFixed(0)}%` : '未計算 (灰)' }}
    </div>

    <!-- 輸出點 -->
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
