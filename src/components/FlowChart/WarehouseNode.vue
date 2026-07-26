<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
defineProps<{
  data: { label: string; iconUrl: string; itemName: string }
  selected?: boolean
}>()
</script>

<template>
  <div 
    class="px-4 py-3 rounded-full bg-amber-50 border-2 border-dashed border-amber-400 text-sm shadow-sm flex flex-col items-center justify-center min-w-[12.5] aspect-ratio-4/3;"
    :class="{ 'border-solid border-blue-500 ring-2 ring-blue-200': selected }"
  >
    <Handle type="target" :position="Position.Left" />
    
    <div class="text-xl mb-0.5">{{ data.iconUrl }}</div>
    <div class="text-xs font-bold text-amber-900">{{ data.label }}</div>
    <div class="text-[11px] text-amber-700">品項: {{ data.itemName }}</div>
  </div>
</template>
