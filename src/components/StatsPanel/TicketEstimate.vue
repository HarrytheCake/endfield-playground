<script setup lang="ts">

interface TicketRow {
  itemId: string
  name: string
  ratePerMin: number     // 每分鐘速率
  ticketPerHour: number  // 每小時工單數
}

interface Props {
  rows: TicketRow[]
  totalTicketPerHour: number // 每小時總工單數
}

defineProps<Props>()
</script>

<template>
  
  <div class="p-4 border border-gray-200 rounded-lg space-y-3 bg-white">
    
    
    <div class="flex justify-between items-center">
      <h3 class="text-base font-bold text-gray-800">3.3 工單預估 (TicketEstimate)</h3>
      <span class="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded font-medium">Phase 2</span>
    </div>

    <!-- 總計數據區塊 -->
    <div class="p-3 bg-gray-50 rounded-md">
     
      <p class="text-sm font-medium text-gray-700">
        每小時總工單數：
        <span class="text-base font-bold text-blue-600">{{ totalTicketPerHour }}</span> 張/小時
      </p>
    </div>
    <!-- 表格區塊 -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead>
        
          <tr class="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
            <th class="pb-2 font-medium">項目名稱</th>
            <th class="pb-2 font-medium text-right">每分鐘速率 (/min)</th>
            <th class="pb-2 font-medium text-right">每小時工單 (/hr)</th>
          </tr>
        </thead>
        
        
        <tbody class="text-sm divide-y divide-gray-100 text-gray-700">
          <tr v-for="row in rows" :key="row.itemId" class="hover:bg-gray-50">
            <td class="py-2.5 font-medium text-gray-900">{{ row.name }}</td>
            <td class="py-2.5 text-right font-mono">{{ row.ratePerMin }}</td>
            <td class="py-2.5 text-right font-mono text-gray-900 font-semibold">{{ row.ticketPerHour }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
