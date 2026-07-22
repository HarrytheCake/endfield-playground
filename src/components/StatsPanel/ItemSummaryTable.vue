<script setup lang="ts">
// 1. 定義資料結構規格
interface ItemSummaryRow {
  itemId: string
  name: string
  iconUrl: string
  produced: number   // 每分鐘產量
  consumed: number   // 每分鐘消耗量
  net: number        // 淨產出 (produced - consumed)
  efficiency: number // (0 ~ 1)
}

interface Props {
  rows: ItemSummaryRow[]
}

defineProps<Props>()

// 2. 動態轉換效率顏色
function getEfficiencyClass(efficiency: number) {
  const percent = efficiency * 100 //
  
  if (percent === 100) return 'bg-green-500'               // 100%
  if (percent >= 75 && percent <= 99) return 'bg-yellow-500' // 75~99%
  if (percent >= 1 && percent <= 74) return 'bg-orange-500'  // 1~74%
  return 'bg-neutral-400'                                  // 0% / N/A
}
</script>

<template>
  
  <div class="p-4 border border-gray-200 rounded-lg space-y-3 bg-white">
    
    
    <h3 class="text-base font-bold text-gray-800">項目統計表格 (3.2 ItemSummaryTable)</h3>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead>
          
          <tr class="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
            <th class="pb-2 font-medium">項目</th>
            <th class="pb-2 font-medium text-right">生產 (/min)</th>
            <th class="pb-2 font-medium text-right">消耗 (/min)</th>
            <th class="pb-2 font-medium text-right">淨產出</th>
            <th class="pb-2 font-medium text-center">效率</th>
          </tr>
        </thead>
        
        
        <tbody class="text-sm divide-y divide-gray-100 text-gray-700">
          <tr v-for="row in rows" :key="row.itemId" class="hover:bg-gray-50">
            <!-- 項目名稱與圖示 -->
            <td class="py-2.5 flex items-center space-x-2">
              <img :src="row.iconUrl" class="w-5 h-5 object-contain" alt="icon" />
              <span class="font-medium text-gray-900">{{ row.name }}</span>
            </td>
            
            <!-- 生產與消耗 -->
            <td class="py-2.5 text-right">{{ row.produced }}</td>
            <td class="py-2.5 text-right">{{ row.consumed }}</td>
            
            <!-- 淨產出-->
            <td class="py-2.5 text-right font-mono" :class="row.net >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ row.net >= 0 ? `+${row.net}` : row.net }}
            </td>
            
            <!-- 效率顏色標籤 -->
            <td class="py-2.5 text-center">
              <span 
                :class="getEfficiencyClass(row.efficiency)"
                class="inline-block px-2 py-0.5 rounded text-white text-xs font-semibold min-w-[12.5]"
              >
                {{ Math.round(row.efficiency * 100) }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
S