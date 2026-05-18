<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useFlowStore } from '@/store/flowStore';
import { useEditorStore } from '@/store/editorStore';

const flowStore = useFlowStore();
const editorStore = useEditorStore();

const {
    totalPowerDemand,
    totalPowerSupply,
    powerBalance,
    hasPowerShortage,
    edgeFlowCount,
    invalidChainCount,
    itemSummary,
    isCalculating,
    hasResults,
} = storeToRefs(flowStore);

const { nodeCount } = storeToRefs(editorStore);

// G2：電力狀態文字
const powerStatusText = computed(() => {
    const abs = Math.abs(powerBalance.value).toFixed(1);
    return hasPowerShortage.value ? `⚠️ 不足 ${abs} kW` : `✅ 盈餘 ${abs} kW`;
});
const powerStatusClass = computed(() =>
    hasPowerShortage.value ? 'text-red-400' : 'text-green-400',
);

// G3：淨產量顏色
function netClass(net: number): string {
    if (net > 0.005) return 'text-green-400';
    if (net < -0.005) return 'text-red-400';
    return 'text-zinc-400';
}

// G3：效率顏色
function effClass(eff: number): string {
    if (eff >= 1) return 'text-green-500';
    if (eff >= 0.5) return 'text-yellow-400';
    if (eff > 0) return 'text-orange-400';
    return 'text-zinc-500';
}
</script>

<template>
    <div class="space-y-4 text-sm text-zinc-200">
        <!-- G2：整體電力統計 -->
        <section>
            <h4 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                電力統計
            </h4>
            <div class="space-y-1">
                <div class="flex justify-between">
                    <span class="text-zinc-400">總耗電</span>
                    <span>{{ totalPowerDemand.toFixed(1) }} kW</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-zinc-400">總供電</span>
                    <span>{{ totalPowerSupply.toFixed(1) }} kW</span>
                </div>
                <div class="flex justify-between font-semibold">
                    <span class="text-zinc-400">電力狀態</span>
                    <span :class="powerStatusClass">{{ powerStatusText }}</span>
                </div>
            </div>
        </section>

        <!-- G2：設備 / 管線計數 -->
        <section>
            <h4 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                畫布概況
            </h4>
            <div class="space-y-1">
                <div class="flex justify-between">
                    <span class="text-zinc-400">設備數量</span>
                    <span>{{ nodeCount }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-zinc-400">有效管線</span>
                    <span>{{ edgeFlowCount }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-zinc-400">非法節點</span>
                    <span :class="invalidChainCount > 0 ? 'text-zinc-500' : 'text-zinc-400'">
                        {{ invalidChainCount }}
                    </span>
                </div>
            </div>
        </section>

        <!-- G3：產出摘要表 -->
        <section>
            <h4 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                產出摘要
                <span v-if="isCalculating" class="ml-1 animate-pulse text-zinc-500">…</span>
            </h4>

            <!-- G4：空白狀態 -->
            <div
                v-if="!hasResults && !isCalculating"
                class="py-3 text-center text-xs text-zinc-500"
            >
                畫布尚無合法鏈路，<br />請連接物品輸出口至輸入口。
            </div>

            <!-- 摘要表格 -->
            <template v-else-if="hasResults">
                <div class="overflow-x-auto">
                    <table class="w-full text-xs">
                        <thead>
                            <tr class="border-b border-zinc-700 text-zinc-400">
                                <th class="pb-1 text-left font-medium">品項</th>
                                <th class="pb-1 text-right font-medium">產</th>
                                <th class="pb-1 text-right font-medium">耗</th>
                                <th class="pb-1 text-right font-medium">淨</th>
                                <th class="pb-1 text-right font-medium">效率</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="item in itemSummary"
                                :key="item.itemId"
                                class="border-b border-zinc-800"
                            >
                                <td class="py-1 pr-1 text-zinc-200">{{ item.name }}</td>
                                <td class="py-1 text-right text-zinc-300">
                                    {{ item.produced.toFixed(1) }}
                                </td>
                                <td class="py-1 text-right text-zinc-300">
                                    {{ item.consumed.toFixed(1) }}
                                </td>
                                <td
                                    class="py-1 text-right font-semibold"
                                    :class="netClass(item.net)"
                                >
                                    {{ item.net > 0 ? '+' : '' }}{{ item.net.toFixed(1) }}
                                </td>
                                <td
                                    class="py-1 text-right font-bold"
                                    :class="effClass(item.efficiency)"
                                >
                                    {{ Math.round(item.efficiency * 100) }}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </template>
        </section>
    </div>
</template>
