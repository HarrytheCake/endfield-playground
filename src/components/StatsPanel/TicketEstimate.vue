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
    <div class="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-white">
        <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-white">工單預估 TicketEstimate</h3>
           
        </div>

        <!-- 總計數據區塊 -->
        <div class="rounded-md bg-zinc-900 p-3">
            <p class="text-sm font-medium text-gray-200">
                每小時總工單數：
                <span class="text-base font-bold text-white">{{ totalTicketPerHour }}</span>
                張/小時
            </p>
        </div>
        <!-- 表格區塊 -->
        <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left">
                <thead>
                    <tr
                        class="border-b border-zinc-700 text-xs tracking-wider text-zinc-400 uppercase"
                    >
                        <th class="pb-2 font-medium">項目名稱</th>
                        <th class="pb-2 text-right font-medium">每分鐘速率 (/min)</th>
                        <th class="pb-2 text-right font-medium">每小時工單 (/hr)</th>
                    </tr>
                </thead>

                <tbody class="divide-y divide-zinc-800 text-sm text-gray-200">
                    <tr v-for="row in rows" :key="row.itemId" class="hover:bg-zinc-900">
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
