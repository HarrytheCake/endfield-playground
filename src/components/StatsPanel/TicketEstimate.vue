<script setup lang="ts">
interface TicketRow {
    itemId: string;
    name: string;
    ratePerMin: number; // 每分鐘速率
    ticketPerHour: number; // 每小時工單數
}

interface Props {
    rows: TicketRow[];
    totalTicketPerHour: number; // 每小時總工單數
}

defineProps<Props>();
</script>

<template>
    <div class="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-800">3.3 工單預估 (TicketEstimate)</h3>
            <span class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
                >Phase 2</span
            >
        </div>

        <!-- 總計數據區塊 -->
        <div class="rounded-md bg-gray-50 p-3">
            <p class="text-sm font-medium text-gray-700">
                每小時總工單數：
                <span class="text-base font-bold text-blue-600">{{ totalTicketPerHour }}</span>
                張/小時
            </p>
        </div>
        <!-- 表格區塊 -->
        <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left">
                <thead>
                    <tr
                        class="border-b border-gray-200 text-xs tracking-wider text-gray-500 uppercase"
                    >
                        <th class="pb-2 font-medium">項目名稱</th>
                        <th class="pb-2 text-right font-medium">每分鐘速率 (/min)</th>
                        <th class="pb-2 text-right font-medium">每小時工單 (/hr)</th>
                    </tr>
                </thead>

                <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
                    <tr v-for="row in rows" :key="row.itemId" class="hover:bg-gray-50">
                        <td class="py-2.5 font-medium text-gray-900">{{ row.name }}</td>
                        <td class="py-2.5 text-right font-mono">{{ row.ratePerMin }}</td>
                        <td class="py-2.5 text-right font-mono font-semibold text-gray-900">
                            {{ row.ticketPerHour }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
