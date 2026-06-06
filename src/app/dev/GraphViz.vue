<template>
    <div class="graph-viz">
        <div class="mb-6">
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">圖結構視覺化</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                查看 buildGraph、topologicalSort 與 validateChains 的執行結果
            </p>
        </div>

        <!-- 使用說明 -->
        <div
            class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950"
        >
            <h3 class="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-200">📖 使用說明</h3>
            <ul class="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                <li>• 本頁面展示 FlowEngine 三大核心步驟的執行結果</li>
                <li>• 鄰接表：顯示每個節點的下游連線</li>
                <li>• 拓撲排序：使用 Kahn's Algorithm，偵測環路</li>
                <li>• 合法鏈路：反向 BFS 找出無法到達 Sink 的節點</li>
                <li>• 點擊預設按鈕載入測試情境，或貼上自訂 JSON</li>
            </ul>
        </div>

        <!-- 預設情境按鈕 -->
        <div class="mb-6">
            <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                🎯 預設測試情境
            </h3>
            <div class="grid grid-cols-6 gap-2">
                <button
                    v-for="preset in presets"
                    :key="preset.id"
                    @click="loadPreset(preset.id)"
                    :class="[
                        'rounded-md px-3 py-2 text-xs font-medium transition-colors',
                        selectedPreset === preset.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
                    ]"
                >
                    {{ preset.name }}
                </button>
            </div>
            <div
                v-if="selectedPreset"
                class="mt-2 rounded-md bg-gray-100 p-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
                {{ presets.find((p) => p.id === selectedPreset)?.description }}
            </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <!-- 左側：輸入區 -->
            <div class="space-y-4">
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
                        @click="analyzeGraph"
                        class="mt-3 w-full rounded-md bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
                    >
                        🔍 分析圖結構
                    </button>
                </div>
            </div>

            <!-- 右側：結果顯示區 -->
            <div class="space-y-4">
                <!-- Adjacency List -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        1. Adjacency List（鄰接表）
                    </h3>
                    <div v-if="graphData" class="space-y-2">
                        <div
                            v-for="[uid, neighbors] in Object.entries(graphData.adjacencyList)"
                            :key="uid"
                            class="rounded bg-gray-50 p-2 text-xs dark:bg-gray-900"
                        >
                            <span class="font-mono text-blue-600 dark:text-blue-400">{{
                                uid
                            }}</span>
                            <span class="text-gray-500"> →</span>
                            <span class="ml-2 text-gray-700 dark:text-gray-300">
                                {{ (neighbors as string[]).join(', ') || '(無下游)' }}
                            </span>
                        </div>
                    </div>
                    <p v-else class="text-xs text-gray-400">尚未分析</p>
                </div>

                <!-- Topological Sort -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        2. Topological Sort（拓撲排序）
                    </h3>
                    <div v-if="graphData">
                        <div class="mb-3">
                            <span class="text-xs text-gray-500">排序結果：</span>
                            <div class="mt-1 flex flex-wrap gap-2">
                                <span
                                    v-for="(uid, index) in graphData.topoOrder"
                                    :key="uid"
                                    class="rounded bg-green-100 px-2 py-1 font-mono text-xs text-green-800 dark:bg-green-900 dark:text-green-200"
                                >
                                    {{ Number(index) + 1 }}. {{ uid }}
                                </span>
                            </div>
                        </div>
                        <div v-if="graphData.hasCycle">
                            <span class="text-xs font-semibold text-red-600 dark:text-red-400">
                                ⚠️ 偵測到環路！
                            </span>
                            <p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                環路節點將無法參與流量計算
                            </p>
                        </div>
                        <div v-else>
                            <span class="text-xs font-semibold text-green-600 dark:text-green-400">
                                ✓ 無環路
                            </span>
                        </div>
                    </div>
                    <p v-else class="text-xs text-gray-400">尚未分析</p>
                </div>

                <!-- Invalid Chains -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        3. Invalid Chains（非合法鏈路）
                    </h3>
                    <div v-if="graphData">
                        <div v-if="graphData.invalidChainUids.length > 0">
                            <span
                                class="text-xs font-semibold text-orange-600 dark:text-orange-400"
                            >
                                ⚠️ 發現 {{ graphData.invalidChainUids.length }} 個非合法節點
                            </span>
                            <div class="mt-2 flex flex-wrap gap-2">
                                <span
                                    v-for="uid in graphData.invalidChainUids"
                                    :key="uid"
                                    class="rounded bg-orange-100 px-2 py-1 font-mono text-xs text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                >
                                    {{ uid }}
                                </span>
                            </div>
                            <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                這些節點無法連接到任何 Sink，將不參與流量計算
                            </p>
                        </div>
                        <div v-else>
                            <span class="text-xs font-semibold text-green-600 dark:text-green-400">
                                ✓ 所有鏈路合法
                            </span>
                        </div>
                    </div>
                    <p v-else class="text-xs text-gray-400">尚未分析</p>
                </div>

                <!-- Mermaid Flowchart -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        4. Mermaid Flowchart（可複製）
                    </h3>
                    <div v-if="mermaidCode">
                        <textarea
                            :value="mermaidCode"
                            readonly
                            class="h-48 w-full rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-xs dark:border-gray-600 dark:bg-gray-900"
                        />
                        <button
                            @click="copyMermaid"
                            class="mt-2 rounded-md bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            📋 複製 Mermaid 代碼
                        </button>
                    </div>
                    <p v-else class="text-xs text-gray-400">尚未分析</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { buildGraph, topologicalSort, validateChains } from '@/composables/useFlowEngine';
import type { FactoryNode, FactoryEdge } from '@/types/graph';

const jsonInput = ref('');
const graphData = ref<any>(null);
const mermaidCode = ref('');
const errorMessage = ref('');
const selectedPreset = ref<string | null>(null);

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
                id: 'src',
                type: 'default',
                position: { x: 0, y: 100 },
                data: {
                    label: '物品輸出口',
                    machineType: '物品輸出口',
                    recipeIndex: 1,
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
    h3: {
        nodes: [
            {
                id: 'src',
                type: 'default',
                position: { x: 0, y: 150 },
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
                position: { x: 200, y: 150 },
                data: { label: '分流器', machineType: '分流器', recipeIndex: 0, rotation: 0 },
            },
            {
                id: 'sink1',
                type: 'default',
                position: { x: 400, y: 100 },
                data: {
                    label: '物品輸入口1',
                    machineType: '物品輸入口',
                    recipeIndex: 0,
                    rotation: 0,
                },
            },
            {
                id: 'sink2',
                type: 'default',
                position: { x: 400, y: 200 },
                data: {
                    label: '物品輸入口2',
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
                    recipeIndex: 2,
                    rotation: 0,
                },
            },
            {
                id: 'c1',
                type: 'default',
                position: { x: 150, y: 100 },
                data: { label: '粉碎機', machineType: '粉碎機', recipeIndex: 1, rotation: 0 },
            },
            {
                id: 'c2',
                type: 'default',
                position: { x: 300, y: 100 },
                data: { label: '精煉爐', machineType: '精煉爐', recipeIndex: 0, rotation: 0 },
            },
            {
                id: 'c3',
                type: 'default',
                position: { x: 450, y: 100 },
                data: { label: '塑型機', machineType: '塑型機', recipeIndex: 1, rotation: 0 },
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
    graphData.value = null;
    mermaidCode.value = '';
}

function analyzeGraph() {
    try {
        errorMessage.value = '';
        const data = JSON.parse(jsonInput.value);

        if (!data.nodes || !data.edges) {
            throw new Error('JSON 格式錯誤：需包含 nodes 和 edges 欄位');
        }

        const nodes: FactoryNode[] = data.nodes;
        const edges: FactoryEdge[] = data.edges;

        // 使用真實 FlowEngine 函數（正確順序：先拓撲排序檢測環路，再驗證鏈路）
        const graph = buildGraph(nodes, edges);
        const topoOrder = topologicalSort(graph); // 先檢測環路
        validateChains(graph); // 再驗證合法鏈路

        // 構建鄰接表
        const adjacencyList: Record<string, string[]> = {};
        for (const [uid, outEdges] of graph.outEdges) {
            adjacencyList[uid] = outEdges;
        }

        // 收集非合法節點
        const invalidChainUids = Array.from(graph.invalidSubgraphUids);

        graphData.value = {
            adjacencyList,
            topoOrder,
            hasCycle: graph.hasCycle,
            invalidChainUids,
        };

        // 產生 Mermaid flowchart
        generateMermaid(nodes, edges);
    } catch (error: any) {
        errorMessage.value = error?.message || '分析失敗';
        console.error('分析失敗：', error);
    }
}

function generateMermaid(nodes: FactoryNode[], edges: FactoryEdge[]) {
    let code = 'graph LR\n';

    for (const node of nodes) {
        code += `  ${node.id}["${node.data?.machineType || node.id}"]\n`;
    }

    for (const edge of edges) {
        code += `  ${edge.source} -->|${edge.id}| ${edge.target}\n`;
    }

    mermaidCode.value = code;
}

function copyMermaid() {
    navigator.clipboard.writeText(mermaidCode.value);
    alert('已複製到剪貼簿！');
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
