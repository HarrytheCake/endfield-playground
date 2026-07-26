<script setup lang="ts">
// 1. 定義資料結構規格
interface ItemSummaryRow {
    itemId: string;
    name: string;
    iconUrl: string;
    produced: number; // 每分鐘產量
    consumed: number; // 每分鐘消耗量
    net: number; // 淨產出 (produced - consumed)
    efficiency: number; // (0 ~ 1)
}

interface Props {
    rows: ItemSummaryRow[];
}

defineProps<Props>();

import { getEfficiencyBg } from '@/utils/flowHelpers';

// 2. 動態轉換效率顏色
function getEfficiencyClass(efficiency: number) {
    return getEfficiencyBg(efficiency);
}
</script>

<template>
    <div class="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-white">
        <h3 class="text-base font-bold text-white">項目統計表格 (3.2 ItemSummaryTable)</h3>

        <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left">
                <thead>
                    <tr
                        class="border-b border-zinc-700 text-xs tracking-wider text-zinc-400 uppercase"
                    >
                        <th class="pb-2 font-medium">項目</th>
                        <th class="pb-2 text-right font-medium">生產 (/min)</th>
                        <th class="pb-2 text-right font-medium">消耗 (/min)</th>
                        <th class="pb-2 text-right font-medium">淨產出</th>
                        <th class="pb-2 text-center font-medium">效率</th>
                    </tr>
                </thead>

                <tbody class="divide-y divide-zinc-800 text-sm text-gray-200">
                    <tr v-for="row in rows" :key="row.itemId" class="hover:bg-zinc-900">
                        <!-- 項目名稱與圖示 -->
                        <td class="flex items-center space-x-2 py-2.5">
                            <img :src="row.iconUrl" class="h-5 w-5 object-contain" alt="icon" />
                            <span class="font-medium text-gray-900">{{ row.name }}</span>
                        </td>

                        <!-- 生產與消耗 -->
                        <td class="py-2.5 text-right">{{ row.produced }}</td>
                        <td class="py-2.5 text-right">{{ row.consumed }}</td>

                        <!-- 淨產出-->
                        <td
                            class="py-2.5 text-right font-mono"
                            :class="row.net >= 0 ? 'text-green-600' : 'text-red-600'"
                        >
                            {{ row.net >= 0 ? `+${row.net}` : row.net }}
                        </td>

                        <!-- 效率顏色標籤 -->
                        <td class="py-2.5 text-center">
                            <span
                                :class="getEfficiencyClass(row.efficiency)"
                                class="inline-block min-w-[12.5] rounded px-2 py-0.5 text-xs font-semibold text-white"
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
