<template>
    <div class="graph-viz">
        <div class="mb-6">
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">圖結構視覺化</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                查看 buildGraph、topologicalSort 與環路偵測的結果
            </p>
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
                        placeholder='{"devices": [...], "connections": [...]}'
                    />
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

const jsonInput = ref('');
const graphData = ref<any>(null);
const mermaidCode = ref('');

function analyzeGraph() {
    try {
        const data = JSON.parse(jsonInput.value);
        const devices = data.devices || [];
        const connections = data.connections || [];

        // 模擬 buildGraph 結果（簡化版本）
        const adjacencyList: Record<string, string[]> = {};
        devices.forEach((d: any) => {
            adjacencyList[d.uid] = [];
        });

        connections.forEach((c: any) => {
            if (adjacencyList[c.source]) {
                adjacencyList[c.source].push(c.target);
            }
        });

        // 模擬 topologicalSort（簡化版本，實際應呼叫真實演算法）
        const topoOrder = devices.map((d: any) => d.uid);
        const hasCycle = false; // 簡化：實際需實作環路偵測

        // 模擬 validateChains（簡化版本）
        const invalidChainUids: string[] = [];

        graphData.value = {
            adjacencyList,
            topoOrder,
            hasCycle,
            invalidChainUids,
        };

        // 產生 Mermaid flowchart
        generateMermaid(devices, connections);
    } catch (error) {
        console.error('分析失敗：', error);
    }
}

function generateMermaid(devices: any[], connections: any[]) {
    let code = 'graph LR\n';

    devices.forEach((d: any) => {
        code += `  ${d.uid}["${d.machineType}"]\n`;
    });

    connections.forEach((c: any) => {
        code += `  ${c.source} --> ${c.target}\n`;
    });

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
