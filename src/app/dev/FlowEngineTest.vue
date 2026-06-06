<template>
    <div class="flow-engine-test">
        <div class="mb-6">
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                FlowEngine 手動測試
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                測試流量計算引擎的正確性，可選擇 Preset 或自訂 JSON 輸入
            </p>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <!-- 左側：輸入區 -->
            <div class="space-y-4">
                <!-- Preset 選擇器 -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        Preset 測試情境
                    </h3>
                    <div class="grid grid-cols-3 gap-2">
                        <button
                            v-for="preset in presets"
                            :key="preset.id"
                            @click="loadPreset(preset.id)"
                            class="rounded-md px-3 py-2 text-sm font-medium transition-colors"
                            :class="
                                selectedPreset === preset.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            "
                        >
                            {{ preset.name }}
                        </button>
                    </div>
                    <p v-if="selectedPreset" class="mt-3 text-xs text-gray-600 dark:text-gray-400">
                        {{ presets.find((p) => p.id === selectedPreset)?.description }}
                    </p>
                </div>

                <!-- JSON 輸入區 -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        JSON 輸入
                    </h3>
                    <textarea
                        v-model="jsonInput"
                        class="h-96 w-full rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-xs dark:border-gray-600 dark:bg-gray-900"
                        placeholder='{"devices": [...], "connections": [...]}'
                    />
                    <button
                        @click="runCalculation"
                        :disabled="isCalculating"
                        class="mt-3 w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {{ isCalculating ? '計算中...' : '▶️ 執行計算' }}
                    </button>
                </div>
            </div>

            <!-- 右側：結果顯示區 -->
            <div class="space-y-4">
                <!-- edgeFlows -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        1. edgeFlows（管線流量）
                    </h3>
                    <div v-if="result" class="space-y-2">
                        <div
                            v-for="[uid, flow] in result.edgeFlows"
                            :key="uid"
                            class="rounded bg-gray-50 p-2 text-xs dark:bg-gray-900"
                        >
                            <span class="font-mono text-gray-500">{{ uid }}</span>
                            <span class="ml-2 text-blue-600 dark:text-blue-400">
                                {{ flow.itemId }}
                            </span>
                            <span class="ml-2 font-semibold text-green-600 dark:text-green-400">
                                {{ flow.rate.toFixed(2) }}/min
                            </span>
                        </div>
                    </div>
                    <p v-else class="text-xs text-gray-400">尚未執行計算</p>
                </div>

                <!-- nodeEfficiencies -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        2. nodeEfficiencies（設備效率）
                    </h3>
                    <div v-if="result" class="space-y-2">
                        <div
                            v-for="[uid, eff] in result.nodeEfficiencies"
                            :key="uid"
                            class="flex items-center justify-between rounded bg-gray-50 p-2 text-xs dark:bg-gray-900"
                        >
                            <span class="font-mono text-gray-500">{{ uid }}</span>
                            <span :class="getEfficiencyClass(eff)" class="font-semibold">
                                {{ (eff * 100).toFixed(1) }}%
                            </span>
                        </div>
                    </div>
                    <p v-else class="text-xs text-gray-400">尚未執行計算</p>
                </div>

                <!-- itemSummary -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        3. itemSummary（品項統計）
                    </h3>
                    <table v-if="result && result.itemSummary.length > 0" class="w-full text-xs">
                        <thead>
                            <tr class="text-left text-gray-500 dark:text-gray-400">
                                <th class="pb-2">品項</th>
                                <th class="pb-2">產出</th>
                                <th class="pb-2">消耗</th>
                                <th class="pb-2">淨值</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="item in result.itemSummary"
                                :key="item.itemId"
                                class="border-t border-gray-200 dark:border-gray-700"
                            >
                                <td class="py-2">{{ item.name }}</td>
                                <td class="py-2 text-green-600 dark:text-green-400">
                                    {{ item.produced.toFixed(2) }}
                                </td>
                                <td class="py-2 text-red-600 dark:text-red-400">
                                    {{ item.consumed.toFixed(2) }}
                                </td>
                                <td
                                    class="py-2 font-semibold"
                                    :class="item.net > 0 ? 'text-green-600' : 'text-red-600'"
                                >
                                    {{ item.net.toFixed(2) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-else class="text-xs text-gray-400">尚未執行計算</p>
                </div>

                <!-- powerBalance -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        4. powerBalance（電力統計）
                    </h3>
                    <div v-if="result" class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500">需求：</span>
                            <span class="font-semibold text-red-600"
                                >{{ result.powerBalance.demand.toFixed(0) }} kW</span
                            >
                        </div>
                        <div>
                            <span class="text-gray-500">供應：</span>
                            <span class="font-semibold text-green-600"
                                >{{ result.powerBalance.supply.toFixed(0) }} kW</span
                            >
                        </div>
                        <div class="col-span-2">
                            <span class="text-gray-500">差額：</span>
                            <span
                                class="font-semibold"
                                :class="
                                    result.powerBalance.supply - result.powerBalance.demand >= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                "
                            >
                                {{
                                    (
                                        result.powerBalance.supply - result.powerBalance.demand
                                    ).toFixed(0)
                                }}
                                kW
                            </span>
                        </div>
                    </div>
                    <p v-else class="text-xs text-gray-400">尚未執行計算</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useEditorStore } from '@/store/editorStore';
import { useFlowStore } from '@/store/flowStore';

const editorStore = useEditorStore();
const flowStore = useFlowStore();

const selectedPreset = ref<string | null>(null);
const jsonInput = ref('');
const isCalculating = ref(false);
const result = ref<any>(null);

const presets = [
    { id: 'h1', name: 'H1', description: '基礎單鏈路：礦機 → 粉碎機 → Sink' },
    { id: 'h2', name: 'H2', description: '瓶頸情境：礦機（15）→ 粉碎機（需求30）' },
    { id: 'h3', name: 'H3', description: '分流器均分：Source → 分流器 → 2×Sink' },
    { id: 'h4', name: 'H4', description: '環路偵測：A → B → A' },
    { id: 'h5', name: 'H5', description: '懸空設備：單台設備無上游' },
    { id: 'h6', name: 'H6', description: '多級串聯：Source → 粉碎機 → 熔爐 → Sink' },
];

const presetData: Record<string, any> = {
    h1: {
        devices: [
            { uid: 'src', machineType: '物品輸出口', x: 0, y: 0, recipeIndex: 0, rotation: 0 },
            { uid: 'crusher', machineType: '粉碎機', x: 2, y: 0, recipeIndex: 0, rotation: 0 },
            { uid: 'sink', machineType: '物品輸入口', x: 4, y: 0, recipeIndex: 0, rotation: 0 },
        ],
        connections: [
            { uid: 'e1', source: 'src', target: 'crusher' },
            { uid: 'e2', source: 'crusher', target: 'sink' },
        ],
    },
    h2: {
        devices: [
            { uid: 'miner', machineType: '礦機', x: 0, y: 0, recipeIndex: 0, rotation: 0 },
            { uid: 'crusher', machineType: '粉碎機', x: 2, y: 0, recipeIndex: 0, rotation: 0 },
        ],
        connections: [{ uid: 'e1', source: 'miner', target: 'crusher' }],
    },
    // 其他 preset 暫時使用簡化版本
    h3: { devices: [], connections: [] },
    h4: { devices: [], connections: [] },
    h5: { devices: [], connections: [] },
    h6: { devices: [], connections: [] },
};

function loadPreset(id: string) {
    selectedPreset.value = id;
    jsonInput.value = JSON.stringify(presetData[id], null, 2);
}

function runCalculation() {
    try {
        isCalculating.value = true;
        const data = JSON.parse(jsonInput.value);

        // 將數據載入 editorStore
        editorStore.nodes = data.devices || [];
        editorStore.edges = data.connections || [];

        // 等待 FlowEngine watch 觸發（實際應用中會自動觸發）
        setTimeout(() => {
            // 讀取 flowStore 結果
            result.value = {
                edgeFlows: Array.from(flowStore.edgeFlows.entries()),
                nodeEfficiencies: Array.from(flowStore.nodeEfficiencies.entries()),
                itemSummary: flowStore.itemSummary,
                powerBalance: flowStore.powerBalance,
            };
            isCalculating.value = false;
        }, 200);
    } catch (error) {
        console.error('計算失敗：', error);
        isCalculating.value = false;
    }
}

function getEfficiencyClass(eff: number): string {
    if (eff === 1) return 'text-green-500';
    if (eff >= 0.5) return 'text-yellow-400';
    if (eff > 0) return 'text-orange-400';
    return 'text-gray-400';
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
