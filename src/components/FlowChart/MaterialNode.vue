<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
defineProps<{
  data: { label: string; ratePerMin: number }
  selected?: boolean
}>()
</script>

<template>
  <div 
    class="px-4 py-2 rounded-xl bg-gray-700 text-white border-2 text-sm text-center shadow-md min-w-[12.5]"
    :class="selected ? 'border-blue-500' : 'border-transparent'"
  >
    <div class="font-bold">{{ data.label }}</div>
    <div class="text-xs text-gray-300">供給: {{ data.ratePerMin }}/min</div>
    
    <!-- 輸出連線點 -->
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
