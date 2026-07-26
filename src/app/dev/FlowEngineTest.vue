<template>
    <div class="flow-engine-test">
        <div class="mb-6">
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                FlowEngine 手動測試
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                測試流量計算引擎的正確性，可選擇 Preset 或自訂 JSON 輸入
            </p>

            <!-- 使用說明 -->
            <div
                class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
            >
                <div class="flex items-start gap-3">
                    <svg
                        class="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div class="flex-1">
                        <h3 class="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
                            使用說明
                        </h3>
                        <ul class="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                            <li>
                                • 點擊上方 <strong>H1~H6</strong> 按鈕載入預設測試情境（完整
                                nodes/edges 格式）
                            </li>
                            <li>• 在 JSON 輸入區可查看或修改數據結構</li>
                            <li>• 點擊「▶️ 執行計算」按鈕觸發 FlowEngine 計算</li>
                            <li>• 右側面板顯示計算結果：管線流量、設備效率、品項統計、電力平衡</li>
                            <li>
                                •
                                <strong class="text-red-600 dark:text-red-400">注意：</strong
                                >此頁面不會修改主畫布，僅用於獨立測試
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
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
                        placeholder='{"nodes": [...], "edges": [...]}'
                    />

                    <!-- 錯誤訊息 -->
                    <div
                        v-if="errorMessage"
                        class="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    >
                        ⚠️ {{ errorMessage }}
                    </div>

                    <button
                        @click="runCalculation"
                        :disabled="isCalculating || !jsonInput"
                        class="mt-3 w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {{ isCalculating ? '計算中...' : '▶️ 執行計算' }}
                    </button>

                    <!-- JSON 格式說明 -->
                    <details class="mt-3">
                        <summary
                            class="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            📖 JSON 格式說明
                        </summary>
                        <div
                            class="mt-2 rounded-md bg-gray-50 p-3 font-mono text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            <pre>
{
  "nodes": [
    {
      "id": "node-1",
      "type": "default",
      "position": { "x": 0, "y": 100 },
      "data": {
        "label": "設備名稱",
        "machineType": "crusher",
        "recipeIndex": 0,
        "rotation": 0
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "sourceHandle": "out-0",
      "targetHandle": "in-0"
    }
  ]
}</pre
                            >
                        </div>
                    </details>
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
import { runFlowEngine } from '@/composables/useFlowEngine';
import { useEditorStore } from '@/store/editorStore';
import { useFlowStore } from '@/store/flowStore';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import type { EdgeFlow, ItemSummary } from '@/types/flow';

/** FlowEngineTest 頁面計算結果的顯示用結構，對應 flowStore 計算完成後讀出的欄位 */
interface FlowEngineTestResult {
    /** 管線流量：edge uid 對應的 EdgeFlow */
    edgeFlows: [string, EdgeFlow][];
    /** 設備效率：node uid 對應的效率值（0~1） */
    nodeEfficiencies: [string, number][];
    /** 品項產出/消耗統計 */
    itemSummary: ItemSummary[];
    /** 電力供需統計 */
    powerBalance: {
        /** 總電力需求（kW） */
        demand: number;
        /** 總電力供應（kW） */
        supply: number;
    };
}

const editorStore = useEditorStore();
const flowStore = useFlowStore();

const selectedPreset = ref<string | null>(null);
const jsonInput = ref('');
const isCalculating = ref(false);
const result = ref<FlowEngineTestResult | null>(null);
const errorMessage = ref<string>('');

// 保存原始畫布數據
let originalNodes: FactoryNode[] = [];
let originalEdges: FactoryEdge[] = [];

const presets = [
    { id: 'h1', name: 'H1', description: '基礎單鏈路：Source → 粉碎機 → Sink（效率 100%）' },
    {
        id: 'h2',
        name: 'H2',
        description: '瓶頸測試：Source(15/min) → 粉碎機(需30/min) → Sink（效率 50%）',
    },
    { id: 'h3', name: 'H3', description: '分流器均分：1→2 分流（各 50%）' },
    { id: 'h4', name: 'H4', description: '環路偵測：A → B → C → A' },
    { id: 'h5', name: 'H5', description: '懸空設備：無輸入輸出（效率 0%）' },
    { id: 'h6', name: 'H6', description: '多級串聯：藍鐵礦 → 粉碎 → 精煉 → 塑型 → 藍鐵瓶' },
];

const presetData: Record<string, { nodes: FactoryNode[]; edges: FactoryEdge[] }> = {
    h1: {
        nodes: [
            {
                id: 'src',
                type: 'default',
                position: { x: 0, y: 100 },
                data: {
                    label: '物品輸出口',
                    machineType: '物品輸出口',
                    recipeIndex: 0,
                    rotation: 0,
                },
            },
            {
                id: 'crusher',
                type: 'default',
                position: { x: 200, y: 100 },
                data: { label: '粉碎機', machineType: '粉碎機', recipeIndex: 0, rotation: 0 },
            },
            {
                id: 'sink',
                type: 'default',
                position: { x: 400, y: 100 },
                data: {
                    label: '物品輸入口',
                    machineType: '物品輸入口',
                    recipeIndex: 0,
                    rotation: 0,
                },
            },
        ],
        edges: [
            {
                id: 'e1',
                source: 'src',
                target: 'crusher',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
            {
                id: 'e2',
                source: 'crusher',
                target: 'sink',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
        ],
    },
    h2: {
        nodes: [
            {
                id: 'miner',
                type: 'default',
                position: { x: 0, y: 100 },
                data: {
                    label: '物品輸出口',
                    machineType: '物品輸出口',
                    recipeIndex: 1, // 使用半速配方 (15/min)
                    rotation: 0,
                },
            },
            {
                id: 'crusher',
                type: 'default',
                position: { x: 200, y: 100 },
                data: { label: '粉碎機', machineType: '粉碎機', recipeIndex: 0, rotation: 0 },
            },
            {
                id: 'sink',
                type: 'default',
                position: { x: 400, y: 100 },
                data: {
                    label: '物品輸入口',
                    machineType: '物品輸入口',
                    recipeIndex: 0,
                    rotation: 0,
                },
            },
        ],
        edges: [
            {
                id: 'e1',
                source: 'miner',
                target: 'crusher',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
            {
                id: 'e2',
                source: 'crusher',
                target: 'sink',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
        ],
    },
    h3: {
        nodes: [
            {
                id: 'src',
                type: 'default',
                position: { x: 0, y: 100 },
                data: {
                    label: '物品輸出口',
                    machineType: '物品輸出口',
                    recipeIndex: 0,
                    rotation: 0,
                },
            },
            {
                id: 'splitter',
                type: 'default',
                position: { x: 200, y: 100 },
                data: { label: '分流器', machineType: '分流器', recipeIndex: 0, rotation: 0 },
            },
            {
                id: 'sink1',
                type: 'default',
                position: { x: 400, y: 50 },
                data: {
                    label: '物品輸入口 1',
                    machineType: '物品輸入口',
                    recipeIndex: 0,
                    rotation: 0,
                },
            },
            {
                id: 'sink2',
                type: 'default',
                position: { x: 400, y: 150 },
                data: {
                    label: '物品輸入口 2',
                    machineType: '物品輸入口',
                    recipeIndex: 0,
                    rotation: 0,
                },
            },
        ],
        edges: [
            {
                id: 'e1',
                source: 'src',
                target: 'splitter',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
            {
                id: 'e2',
                source: 'splitter',
                target: 'sink1',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
            {
                id: 'e3',
                source: 'splitter',
                target: 'sink2',
                sourceHandle: 'out-1',
                targetHandle: 'in-0',
            },
        ],
    },
    h4: {
        nodes: [
            {
                id: 'a',
                type: 'default',
                position: { x: 0, y: 100 },
                data: { label: '設備 A', machineType: '粉碎機', recipeIndex: 0, rotation: 0 },
            },
            {
                id: 'b',
                type: 'default',
                position: { x: 200, y: 100 },
                data: { label: '設備 B', machineType: '粉碎機', recipeIndex: 0, rotation: 0 },
            },
            {
                id: 'c',
                type: 'default',
                position: { x: 400, y: 100 },
                data: { label: '設備 C', machineType: '粉碎機', recipeIndex: 0, rotation: 0 },
            },
        ],
        edges: [
            { id: 'e1', source: 'a', target: 'b', sourceHandle: 'out-0', targetHandle: 'in-0' },
            { id: 'e2', source: 'b', target: 'c', sourceHandle: 'out-0', targetHandle: 'in-0' },
            { id: 'e3', source: 'c', target: 'a', sourceHandle: 'out-0', targetHandle: 'in-0' },
        ],
    },
    h5: {
        nodes: [
            {
                id: 'alone',
                type: 'default',
                position: { x: 200, y: 100 },
                data: { label: '懸空設備', machineType: '粉碎機', recipeIndex: 0, rotation: 0 },
            },
        ],
        edges: [],
    },
    h6: {
        nodes: [
            {
                id: 'src',
                type: 'default',
                position: { x: 0, y: 100 },
                data: {
                    label: '物品輸出口',
                    machineType: '物品輸出口',
                    recipeIndex: 2, // 藍鐵礦 30/min
                    rotation: 0,
                },
            },
            {
                id: 'c1',
                type: 'default',
                position: { x: 150, y: 100 },
                data: { label: '粉碎機', machineType: '粉碎機', recipeIndex: 1, rotation: 0 }, // 藍鐵粉末
            },
            {
                id: 'c2',
                type: 'default',
                position: { x: 300, y: 100 },
                data: { label: '精煉爐', machineType: '精煉爐', recipeIndex: 0, rotation: 0 }, // 藍鐵塊
            },
            {
                id: 'c3',
                type: 'default',
                position: { x: 450, y: 100 },
                data: { label: '塑型機', machineType: '塑型機', recipeIndex: 1, rotation: 0 }, // 藍鐵瓶
            },
            {
                id: 'sink',
                type: 'default',
                position: { x: 600, y: 100 },
                data: {
                    label: '物品輸入口',
                    machineType: '物品輸入口',
                    recipeIndex: 0,
                    rotation: 0,
                },
            },
        ],
        edges: [
            { id: 'e1', source: 'src', target: 'c1', sourceHandle: 'out-0', targetHandle: 'in-0' },
            { id: 'e2', source: 'c1', target: 'c2', sourceHandle: 'out-0', targetHandle: 'in-0' },
            { id: 'e3', source: 'c2', target: 'c3', sourceHandle: 'out-0', targetHandle: 'in-0' },
            { id: 'e4', source: 'c3', target: 'sink', sourceHandle: 'out-0', targetHandle: 'in-0' },
        ],
    },
};

function loadPreset(id: string) {
    selectedPreset.value = id;
    jsonInput.value = JSON.stringify(presetData[id], null, 2);
    errorMessage.value = '';
}

async function runCalculation() {
    try {
        isCalculating.value = true;
        errorMessage.value = '';

        const data = JSON.parse(jsonInput.value);

        if (!data.nodes || !data.edges) {
            throw new Error('JSON 格式錯誤：需包含 nodes 和 edges 欄位');
        }

        // 保存原始畫布數據
        originalNodes = [...editorStore.nodes];
        originalEdges = [...editorStore.edges];

        // 臨時替換為測試數據
        editorStore.nodes = data.nodes;
        editorStore.edges = data.edges;

        // 直接執行 FlowEngine，避免 /dev 路由未掛載 watcher 時無計算結果
        await runFlowEngine();

        // 讀取計算結果
        result.value = {
            edgeFlows: Array.from(flowStore.edgeFlows.entries()),
            nodeEfficiencies: Array.from(flowStore.nodeEfficiencies.entries()),
            itemSummary: flowStore.itemSummary,
            powerBalance: {
                demand: flowStore.totalPowerDemand,
                supply: flowStore.totalPowerSupply,
            },
        };

        // 恢復原始數據
        editorStore.nodes = originalNodes;
        editorStore.edges = originalEdges;

        isCalculating.value = false;
    } catch (error) {
        errorMessage.value = (error as Error)?.message || '計算失敗，請檢查 JSON 格式';
        console.error('計算失敗：', error);

        // 確保恢復原始數據
        if (originalNodes.length > 0 || originalEdges.length > 0) {
            editorStore.nodes = originalNodes;
            editorStore.edges = originalEdges;
        }

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
