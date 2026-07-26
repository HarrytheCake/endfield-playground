<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
defineProps<{
  data: { label: string; iconUrl: string }
  selected?: boolean
}>()
</script>

<template>
  <div 
    class="p-3 border-2 border-dashed border-gray-400 bg-gray-100/50 opacity-60 text-sm min-w-[15] relative select-none"
    :class="{ 'border-solid border-blue-500': selected }"
  >
    <!-- 待導入可能需要連線，暫且保留 Handle -->
    <Handle type="target" :position="Position.Left" />

    <div class="flex items-center gap-2">
      <span class="text-lg grayscale">{{ data.iconUrl }}</span>
      <span class="font-bold text-gray-500">{{ data.label }}</span>
    </div>
    
    <!-- Phase 2 標記 -->
    <div class="absolute -top-2.5 -right-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow">
      待導入
    </div>

    <Handle type="source" :position="Position.Right" />
  </div>
</template>
