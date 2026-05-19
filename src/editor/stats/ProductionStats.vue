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
    sinkDeliveries,
    isCalculating,
    hasResults,
} = storeToRefs(flowStore);

const { nodeCount, currentPlan, machineUsedCounts } = storeToRefs(editorStore);

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

// ── 建造計畫：原料消耗 ───────────────────────────────────────────────────────
/** 計畫原料 × FlowEngine 實際使用量 */
const materialUsage = computed(() => {
    if (!currentPlan.value) return [];
    const summaryMap = new Map(itemSummary.value.map((s) => [s.name, s]));
    return currentPlan.value.material_rates
        .filter((m) => m.rate !== 0) // rate=0 表示該區域無此資源，不顯示
        .map((m) => {
            const used = summaryMap.get(m.name)?.produced ?? 0;
            const remaining = m.rate === -1 ? -1 : m.rate - used;
            return { name: m.name, allocated: m.rate, used, remaining };
        });
});

/** remaining 文字：-1 = ∞ */
function remainingText(remaining: number): string {
    if (remaining === -1) return '∞';
    return remaining.toFixed(1);
}

/** remaining 顏色 */
function remainingClass(allocated: number, remaining: number): string {
    if (allocated === -1) return 'text-zinc-400';
    if (remaining < -0.005) return 'text-red-400';
    if (remaining < allocated * 0.1 + 0.005) return 'text-yellow-400';
    return 'text-green-400';
}

// ── 總產出：原料剩餘 + 機器交付量 ─────────────────────────────────────────────
/**
 * 總產出 = 計畫原料剩餘配額 + 物品輸入口實際接收的機器產出品
 * 灰點 = 原料剩餘；藍點 = 機器產出
 */
const totalOutput = computed(() => {
    const result: { name: string; rate: number; type: 'raw' | 'product' }[] = [];
    const planMaterialNames = new Set(currentPlan.value?.material_rates.map((m) => m.name) ?? []);

    // 1. 計畫原料剩餘（有限配額且剩餘 > 0）
    for (const m of materialUsage.value) {
        if (m.allocated !== -1 && m.remaining > 0.005) {
            result.push({ name: m.name, rate: m.remaining, type: 'raw' });
        }
    }

    // 2. 物品輸入口交付量（非計畫原料的品項）
    for (const [itemId, rate] of sinkDeliveries.value) {
        if (!planMaterialNames.has(itemId) && rate > 0.005) {
            result.push({ name: itemId, rate, type: 'product' });
        }
    }

    // 排序：原料剩餘靠前，各類內依速率降序
    result.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'raw' ? -1 : 1;
        return b.rate - a.rate;
    });

    return result;
});

// ── 建造計畫：最終產物 ────────────────────────────────────────────────────────
/** 計畫產物清單中，實際有 net > 0 的品項 */
const planProducts = computed(() => {
    if (!currentPlan.value) return [];
    const productSet = new Set(currentPlan.value.product_values.map((p) => p.name));
    const priceMap = new Map(currentPlan.value.product_values.map((p) => [p.name, p.price]));
    return itemSummary.value
        .filter((s) => productSet.has(s.name) && s.net > 0.005)
        .map((s) => ({ ...s, price: priceMap.get(s.name) ?? 0 }));
});

// ── 建造計畫：機器使用量 ────────────────────────────────────────────────────
/** 計畫機器限制 × 畫布已擺放數量 */
const machineUsage = computed(() => {
    if (!currentPlan.value) return [];
    return currentPlan.value.machine_limits
        .map((m) => ({
            name: m.name,
            limit: m.limit,
            used: machineUsedCounts.value.get(m.name) ?? 0,
        }))
        .filter((m) => m.used > 0 || m.limit !== -1);
});

/** 機器數量顏色 */
function machineCountClass(used: number, limit: number): string {
    if (limit === -1) return 'text-zinc-300';
    if (used >= limit) return 'text-red-400';
    if (used >= limit * 0.8) return 'text-yellow-400';
    return 'text-green-400';
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

        <!-- 總產出 -->
        <section v-if="hasResults">
            <h4 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                總產出
                <span class="ml-1 font-normal text-zinc-600 normal-case">/min</span>
            </h4>
            <div v-if="totalOutput.length === 0" class="py-2 text-center text-xs text-zinc-500">
                尚無可用產出
            </div>
            <div v-else class="space-y-1">
                <div
                    v-for="item in totalOutput"
                    :key="item.name"
                    class="flex items-center justify-between text-xs"
                >
                    <div class="flex items-center gap-1.5">
                        <span
                            class="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            :class="item.type === 'raw' ? 'bg-zinc-500' : 'bg-blue-400'"
                        />
                        <span class="text-zinc-200">{{ item.name }}</span>
                    </div>
                    <span class="font-semibold text-green-400">
                        {{ item.rate.toFixed(1) }}
                    </span>
                </div>
            </div>
        </section>

        <!-- 總產出 -->
        <section v-if="hasResults">
            <h4 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                總產出
                <span class="ml-1 font-normal text-zinc-600 normal-case">/min</span>
            </h4>
            <div v-if="totalOutput.length === 0" class="py-2 text-center text-xs text-zinc-500">
                尚無可用產出
            </div>
            <div v-else class="space-y-1">
                <div
                    v-for="item in totalOutput"
                    :key="item.name"
                    class="flex items-center justify-between text-xs"
                >
                    <div class="flex items-center gap-1.5">
                        <span
                            class="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            :class="item.type === 'raw' ? 'bg-zinc-500' : 'bg-blue-400'"
                        />
                        <span class="text-zinc-200">{{ item.name }}</span>
                    </div>
                    <span class="font-semibold text-green-400">
                        {{ item.rate.toFixed(1) }}
                    </span>
                </div>
            </div>
        </section>

        <!-- 建造計畫：原料消耗 -->
        <section v-if="currentPlan && materialUsage.length > 0">
            <h4 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                原料供給（{{ currentPlan.name }}）
            </h4>
            <div class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead>
                        <tr class="border-b border-zinc-700 text-zinc-400">
                            <th class="pb-1 text-left font-medium">原料</th>
                            <th class="pb-1 text-right font-medium">供給</th>
                            <th class="pb-1 text-right font-medium">已用</th>
                            <th class="pb-1 text-right font-medium">剩餘</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="m in materialUsage"
                            :key="m.name"
                            class="border-b border-zinc-800"
                        >
                            <td class="py-1 pr-1 text-zinc-200">{{ m.name }}</td>
                            <td class="py-1 text-right text-zinc-400">
                                {{ m.allocated === -1 ? '∞' : m.allocated.toFixed(0) }}
                            </td>
                            <td class="py-1 text-right text-zinc-300">
                                {{ m.used > 0.005 ? '-' + m.used.toFixed(1) : '—' }}
                            </td>
                            <td
                                class="py-1 text-right font-semibold"
                                :class="remainingClass(m.allocated, m.remaining)"
                            >
                                {{ remainingText(m.remaining) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- 建造計畫：最終產物 -->
        <section v-if="currentPlan">
            <h4 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                計畫產物
            </h4>
            <div v-if="planProducts.length === 0" class="py-2 text-center text-xs text-zinc-500">
                尚無計畫產物輸出
            </div>
            <div v-else class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead>
                        <tr class="border-b border-zinc-700 text-zinc-400">
                            <th class="pb-1 text-left font-medium">產物</th>
                            <th class="pb-1 text-right font-medium">產量/min</th>
                            <th class="pb-1 text-right font-medium">效率</th>
                            <th class="pb-1 text-right font-medium">單價</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="p in planProducts"
                            :key="p.itemId"
                            class="border-b border-zinc-800"
                        >
                            <td class="py-1 pr-1 text-zinc-200">{{ p.name }}</td>
                            <td class="py-1 text-right font-semibold text-green-400">
                                +{{ p.net.toFixed(1) }}
                            </td>
                            <td class="py-1 text-right font-bold" :class="effClass(p.efficiency)">
                                {{ Math.round(p.efficiency * 100) }}%
                            </td>
                            <td class="py-1 text-right text-zinc-400">{{ p.price }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- 建造計畫：機器使用量 -->
        <section v-if="currentPlan && machineUsage.length > 0">
            <h4 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                機器用量
            </h4>
            <div class="space-y-1">
                <div
                    v-for="m in machineUsage"
                    :key="m.name"
                    class="flex items-center justify-between text-xs"
                >
                    <span class="text-zinc-300">{{ m.name }}</span>
                    <span class="font-semibold" :class="machineCountClass(m.used, m.limit)">
                        {{ m.used }} / {{ m.limit === -1 ? '∞' : m.limit }}
                    </span>
                </div>
            </div>
        </section>
    </div>
</template>
