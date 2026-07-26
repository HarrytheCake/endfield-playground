<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
defineProps<{
  data: { label: string; iconUrl: string; ratePerMin: number }
  selected?: boolean
}>()
</script>

<template>
  <div 
    class="px-4 py-3 rounded-full bg-white border border-gray-300 text-sm shadow-sm flex flex-col items-center justify-center min-w-[12.5] aspect-ratio-4/3;"
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
