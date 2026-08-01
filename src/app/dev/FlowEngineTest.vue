<template>
    <div class="flow-engine-test space-y-6">
        <div>
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                FlowEngine 手動測試
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                引擎情境、機器／產品資料預覽（V8-B）
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
                <button
                    v-for="tab in pageTabs"
                    :key="tab.id"
                    type="button"
                    class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                    :class="
                        pageTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                    "
                    @click="pageTab = tab.id"
                >
                    {{ tab.label }}
                </button>
            </div>
        </div>

        <MachineCatalogPanel v-if="pageTab === 'machines'" />
        <ProductCatalogPanel v-else-if="pageTab === 'products'" />

        <template v-else>
            <div
                class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
            >
                <h3 class="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-200">使用說明</h3>
                <ul class="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                    <li>• 點擊 <strong>H1–H11</strong>／<strong>G1–G3、L1</strong> 載入情境並<strong>自動執行計算</strong></li>
                    <li>• 中間拓撲圖：節點依效率著色，管線顯示流量；橘色邊 = 堵塞</li>
                    <li>• 「預期結果」清單可對照右側實際數值做目視驗證</li>
                    <li>• V7／V8：mode、belt↔pipe、form、單埠單線、H8 匯流堵塞</li>
                    <li>• 「機器」「產品／材料」分頁可預覽資料 JSON 與埠／物態 placeholder</li>
                    <li>• 可修改 JSON 後按「執行計算」；此頁不永久改動主畫布</li>
                </ul>
            </div>

        <div
            class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
            <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Preset 測試情境</h3>
            <div class="mb-3 flex flex-wrap gap-2">
                <span class="text-xs font-medium text-gray-500">基礎</span>
                <button
                    v-for="preset in presetsByGroup('basic')"
                    :key="preset.id"
                    type="button"
                    class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                    :class="presetButtonClass(preset.id)"
                    @click="loadPreset(preset.id)"
                >
                    {{ preset.name }}
                </button>
            </div>
            <div class="mb-3 flex flex-wrap gap-2">
                <span class="text-xs font-medium text-gray-500">進階</span>
                <button
                    v-for="preset in presetsByGroup('advanced')"
                    :key="preset.id"
                    type="button"
                    class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                    :class="presetButtonClass(preset.id)"
                    @click="loadPreset(preset.id)"
                >
                    {{ preset.name }}
                </button>
            </div>
            <div class="mb-3 flex flex-wrap gap-2">
                <span class="text-xs font-medium text-gray-500">V7 mode／媒質</span>
                <button
                    v-for="preset in presetsByGroup('v7')"
                    :key="preset.id"
                    type="button"
                    class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                    :class="presetButtonClass(preset.id)"
                    @click="loadPreset(preset.id)"
                >
                    {{ preset.name }}
                </button>
            </div>
            <p v-if="activePresetMeta" class="text-xs text-gray-600 dark:text-gray-400">
                <span class="font-semibold text-gray-800 dark:text-gray-200">{{
                    activePresetMeta.name
                }}</span>
                — {{ activePresetMeta.description }}
            </p>
        </div>

        <div
            v-if="activePresetMeta"
            class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
        >
            <h3 class="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                預期結果（目視對照）
            </h3>
            <ul class="list-inside list-disc space-y-1 text-xs text-amber-900 dark:text-amber-200">
                <li v-for="(hint, i) in activePresetMeta.expected" :key="i">{{ hint }}</li>
            </ul>
        </div>

        <div
            class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
            <div class="mb-3 flex items-center justify-between gap-2">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">拓撲視覺化</h3>
                <div class="flex flex-wrap gap-3 text-[10px] text-gray-500">
                    <span class="inline-flex items-center gap-1">
                        <span class="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />100%
                    </span>
                    <span class="inline-flex items-center gap-1">
                        <span class="inline-block h-2.5 w-2.5 rounded-sm bg-yellow-400" />50–99%
                    </span>
                    <span class="inline-flex items-center gap-1">
                        <span class="inline-block h-2.5 w-2.5 rounded-sm bg-orange-400" />1–49%
                    </span>
                    <span class="inline-flex items-center gap-1">
                        <span class="inline-block h-2.5 w-2.5 rounded-sm bg-zinc-400" />0% / 非法
                    </span>
                    <span class="inline-flex items-center gap-1">
                        <span class="inline-block h-0.5 w-4 bg-orange-500" />堵塞邊
                    </span>
                </div>
            </div>
            <DevTopologySvg
                v-if="parsedGraph"
                :nodes="parsedGraph.nodes"
                :edges="parsedGraph.edges"
                :node-style="topologyNodeStyle"
                :edge-style="topologyEdgeStyle"
                :selected-node-id="selectedTopoNodeId"
                @select-node="selectedTopoNodeId = $event"
            />
            <div
                v-if="selectedTopoNode"
                class="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs dark:border-blue-800 dark:bg-blue-950/40"
            >
                <span class="font-semibold text-blue-900 dark:text-blue-100">
                    {{ selectedTopoNode.data?.label || selectedTopoNode.id }}
                </span>
                <span class="text-gray-500">machineMode</span>
                <button
                    v-for="mode in selectedTopoModes"
                    :key="mode.id"
                    type="button"
                    class="rounded px-2 py-1 font-medium"
                    :class="
                        (selectedTopoNode.data?.machineMode ?? selectedTopoModes[0]?.id) === mode.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                    "
                    @click="setTopoNodeMode(selectedTopoNode.id, mode.id)"
                >
                    {{ mode.label }}
                </button>
                <span v-if="!selectedTopoModes.length" class="text-gray-500">無 modes 資料</span>
            </div>
            <p v-else-if="!parsedGraph" class="text-xs text-gray-400">
                載入 Preset 或貼上合法 JSON 後顯示拓撲
            </p>
            <p v-else class="mt-2 text-[10px] text-gray-400">點選節點可切換 machineMode，埠示意會更新</p>
        </div>

        <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div class="space-y-4">
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        JSON 輸入
                    </h3>
                    <textarea
                        v-model="jsonInput"
                        class="h-80 w-full rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-xs dark:border-gray-600 dark:bg-gray-900"
                        placeholder='{"nodes": [...], "edges": [...]}'
                        @input="selectedPreset = null"
                    />
                    <div
                        v-if="errorMessage"
                        class="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    >
                        {{ errorMessage }}
                    </div>
                    <button
                        type="button"
                        class="mt-3 w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="isCalculating || !jsonInput"
                        @click="runCalculation"
                    >
                        {{ isCalculating ? '計算中...' : '執行計算' }}
                    </button>
                </div>
            </div>

            <div class="space-y-4">
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        1. edgeFlows（管線流量）
                    </h3>
                    <div v-if="result" class="max-h-48 space-y-2 overflow-y-auto">
                        <div
                            v-for="[uid, flow] in result.edgeFlows"
                            :key="uid"
                            class="rounded p-2 text-xs"
                            :class="
                                flow.isCongested
                                    ? 'bg-orange-50 dark:bg-orange-950/40'
                                    : 'bg-gray-50 dark:bg-gray-900'
                            "
                        >
                            <span class="font-mono text-gray-500">{{ uid }}</span>
                            <span class="ml-2 text-blue-600 dark:text-blue-400">{{
                                flow.itemId
                            }}</span>
                            <span class="ml-2 font-semibold text-green-600 dark:text-green-400">
                                {{ flow.rate.toFixed(2) }}/min
                            </span>
                            <span
                                v-if="flow.isCongested"
                                class="ml-2 font-semibold text-orange-600"
                            >
                                堵塞
                            </span>
                        </div>
                        <p v-if="result.edgeFlows.length === 0" class="text-xs text-gray-400">
                            （無有效管線流量）
                        </p>
                    </div>
                    <p v-else class="text-xs text-gray-400">尚未執行計算</p>
                </div>

                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        2. nodeEfficiencies（設備效率）
                    </h3>
                    <div v-if="result" class="max-h-40 space-y-2 overflow-y-auto">
                        <div
                            v-for="[uid, eff] in result.nodeEfficiencies"
                            :key="uid"
                            class="flex items-center justify-between rounded bg-gray-50 p-2 text-xs dark:bg-gray-900"
                        >
                            <span class="font-mono text-gray-500">
                                {{ uid }}
                                <span
                                    v-if="result.invalidChainUids.includes(uid)"
                                    class="ml-1 text-zinc-400"
                                    >非法</span
                                >
                            </span>
                            <span :class="getEfficiencyClass(eff)" class="font-semibold">
                                {{ (eff * 100).toFixed(1) }}%
                            </span>
                        </div>
                    </div>
                    <p v-else class="text-xs text-gray-400">尚未執行計算</p>
                </div>

                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        3. itemSummary / sinkDeliveries
                    </h3>
                    <table
                        v-if="result && result.itemSummary.length > 0"
                        class="mb-3 w-full text-xs"
                    >
                        <thead>
                            <tr class="text-left text-gray-500">
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
                                <td class="py-1.5">{{ item.name }}</td>
                                <td class="py-1.5 text-green-600">{{ item.produced.toFixed(2) }}</td>
                                <td class="py-1.5 text-red-600">{{ item.consumed.toFixed(2) }}</td>
                                <td
                                    class="py-1.5 font-semibold"
                                    :class="item.net >= 0 ? 'text-green-600' : 'text-red-600'"
                                >
                                    {{ item.net.toFixed(2) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-if="result" class="space-y-1 text-xs">
                        <div
                            v-for="[itemId, rate] in result.sinkDeliveries"
                            :key="itemId"
                            class="rounded bg-blue-50 p-2 dark:bg-blue-950/30"
                        >
                            Sink 交付
                            <span class="font-semibold">{{ itemId }}</span>
                            ：{{ rate.toFixed(2) }}/min
                        </div>
                        <p v-if="result.sinkDeliveries.length === 0" class="text-gray-400">
                            （無 sink 交付）
                        </p>
                    </div>
                    <p v-else class="text-xs text-gray-400">尚未執行計算</p>
                </div>

                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        4. 電力 / 非法 / 堵塞摘要
                    </h3>
                    <div v-if="result" class="grid grid-cols-2 gap-3 text-sm">
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
                        <div class="col-span-2 text-xs">
                            <span class="text-gray-500">堵塞邊：</span>
                            <span class="font-mono">{{
                                result.congestedEdges.length
                                    ? result.congestedEdges.join(', ')
                                    : '無'
                            }}</span>
                        </div>
                        <div class="col-span-2 text-xs">
                            <span class="text-gray-500">非法節點：</span>
                            <span class="font-mono">{{
                                result.invalidChainUids.length
                                    ? result.invalidChainUids.join(', ')
                                    : '無'
                            }}</span>
                        </div>
                    </div>
                    <p v-else class="text-xs text-gray-400">尚未執行計算</p>
                </div>
            </div>
        </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { runFlowEngine } from '@/composables/useFlowEngine';
import { useEditorStore } from '@/store/editorStore';
import { useFlowStore } from '@/store/flowStore';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import type { EdgeFlow, ItemSummary } from '@/types/flow';
import { getRecipesForMachine } from '@/data/products';
import MachineCatalogPanel from '@/app/dev/MachineCatalogPanel.vue';
import ProductCatalogPanel from '@/app/dev/ProductCatalogPanel.vue';
import DevTopologySvg from '@/app/dev/DevTopologySvg.vue';
import { getMachine } from '@/data/machines';

type PageTab = 'engine' | 'machines' | 'products';

const pageTabs: { id: PageTab; label: string }[] = [
    { id: 'engine', label: '引擎測試' },
    { id: 'machines', label: '機器' },
    { id: 'products', label: '產品／材料' },
];

const pageTab = ref<PageTab>('engine');
const selectedTopoNodeId = ref<string | null>(null);

/** FlowEngineTest 頁面計算結果的顯示用結構 */
interface FlowEngineTestResult {
    edgeFlows: [string, EdgeFlow][];
    nodeEfficiencies: [string, number][];
    itemSummary: ItemSummary[];
    sinkDeliveries: [string, number][];
    congestedEdges: string[];
    invalidChainUids: string[];
    powerBalance: { demand: number; supply: number };
}

interface PresetMeta {
    id: string;
    name: string;
    group: 'basic' | 'advanced' | 'v7';
    description: string;
    expected: string[];
}

const editorStore = useEditorStore();
const flowStore = useFlowStore();

const selectedPreset = ref<string | null>(null);
const jsonInput = ref('');
const isCalculating = ref(false);
const result = ref<FlowEngineTestResult | null>(null);
const errorMessage = ref('');

let originalNodes: FactoryNode[] = [];
let originalEdges: FactoryEdge[] = [];

/**
 * 依主要產出品項解析 recipeIndex（相對於 mode 過濾後列表）。
 */
function recipeIndexOf(
    machineName: string,
    primaryOutput: string,
    modeId?: string,
    recipePick = 0,
): number {
    const matches = getRecipesForMachine(machineName, modeId)
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.outputs.some((o) => o.itemId === primaryOutput));
    if (!matches.length) {
        console.warn(`[FlowEngineTest] 找不到配方：${machineName} → ${primaryOutput}`);
        return 0;
    }
    return matches[Math.min(recipePick, matches.length - 1)]!.i;
}

interface MakeNodeOpts {
    machineMode?: string;
    /** 以主要產出品項解析 recipeIndex；與 recipeIndex 二選一 */
    primaryOutput?: string;
    recipeIndex?: number;
    /** 同一產出品有多個配方時取第 N 個（0-based） */
    recipePick?: number;
}

/**
 * 建立測試用 FactoryNode。
 */
function makeNode(
    id: string,
    x: number,
    y: number,
    label: string,
    machineType: string,
    opts: MakeNodeOpts | number = {},
): FactoryNode {
    const options: MakeNodeOpts = typeof opts === 'number' ? { recipeIndex: opts } : opts;
    const machineMode = options.machineMode;
    let recipeIndex = options.recipeIndex ?? 0;
    if (options.primaryOutput) {
        recipeIndex = recipeIndexOf(
            machineType,
            options.primaryOutput,
            machineMode,
            options.recipePick ?? 0,
        );
    }
    return {
        id,
        type: 'default',
        position: { x, y },
        data: { label, machineType, recipeIndex, machineMode, rotation: 0 },
    };
}

/**
 * 建立測試用 FactoryEdge（預設 out-0 → in-0，供媒質檢查）。
 */
function makeEdge(id: string, source: string, target: string): FactoryEdge {
    return {
        id,
        source,
        target,
        sourceHandle: 'out-0',
        targetHandle: 'in-0',
    };
}

/**
 * 抽象邊：不帶 handle，略過 belt/pipe 媒質檢查（氣態／跨媒質資料鏈用）。
 */
function makeEdgeLoose(id: string, source: string, target: string): FactoryEdge {
    return { id, source, target };
}

const presets: PresetMeta[] = [
    {
        id: 'h1',
        name: 'H1',
        group: 'basic',
        description: '基礎單鏈路：源礦 Source → 粉碎機(源石粉末) → Sink（效率 100%）',
        expected: [
            '粉碎機效率 ≈ 100%',
            '管線速率受媒質上限約束（belt 30／pipe 60）',
            '無堵塞、無非法節點',
        ],
    },
    {
        id: 'h2',
        name: 'H2',
        group: 'basic',
        description: '瓶頸：Source 半速(源礦) → 粉碎機(源石粉末) → Sink（效率約 50%）',
        expected: ['粉碎機效率 ≈ 50%（黃）', '下游流量約為供料上限', '無環路'],
    },
    {
        id: 'h3',
        name: 'H3',
        group: 'basic',
        description: '分流器均分：1→2（各約 50%）',
        expected: ['分流器效率 100%', '兩條出邊流量大致相等', '兩 Sink 皆有交付'],
    },
    {
        id: 'h4',
        name: 'H4',
        group: 'basic',
        description: '環路偵測：A → B → C → A',
        expected: ['環路子圖被標記非法／略過', 'edgeFlows 應為空或無有效傳播', '拓撲節點偏灰'],
    },
    {
        id: 'h5',
        name: 'H5',
        group: 'basic',
        description: '懸空設備：無連線',
        expected: ['節點屬非法鏈或不參與有效計算', '無 edgeFlows', '無 sink 交付'],
    },
    {
        id: 'h6',
        name: 'H6',
        group: 'basic',
        description: '多級串聯：紫晶礦 → 精煉(紫晶纖維) → 塑型(紫晶質瓶) → Sink',
        expected: [
            '鏈上設備效率多數接近 100%（受 belt 限制）',
            'Sink 有紫晶質瓶交付',
            '可觀察電力需求 > 0',
        ],
    },
    {
        id: 'h7',
        name: 'H7',
        group: 'advanced',
        description: '堵塞：雙 Source 灌同一粉碎機（供過於求）',
        expected: [
            '粉碎機效率仍可到 100%（需求被滿足）',
            '至少一條入邊 isCongested = true（橘色）',
            '摘要區「堵塞邊」非空',
        ],
    },
    {
        id: 'h8',
        name: 'H8',
        group: 'advanced',
        description: '雙鏈 → 匯流器 → Sink：滿速 belt 匯入後出口限 30，反向堵塞約 15／15',
        expected: [
            '圖含匯流器；不雙線直連同一 Sink 口',
            '匯流器→Sink 約 30/min',
            '兩條入匯流器邊堵塞回推約各 15/min',
        ],
    },
    {
        id: 'h9',
        name: 'H9',
        group: 'advanced',
        description: '兩條完全獨立產線並列',
        expected: ['兩鏈互不影響', '各鏈效率獨立為 100%', 'itemSummary 含兩種產物路徑'],
    },
    {
        id: 'h10',
        name: 'H10',
        group: 'advanced',
        description: '配方不符：紫晶礦 Source 灌入「源石粉末」粉碎配方',
        expected: ['粉碎機／下游被標為非法鏈', '有效 edgeFlows 減少或為空', '拓撲節點虛線灰框'],
    },
    {
        id: 'h11',
        name: 'H11',
        group: 'advanced',
        description: '半速 Source + 分流：觀察低流量均分',
        expected: [
            'Source 15/min → 分流後各出邊約 7.5/min',
            '分流器效率 100%',
            '兩 Sink 交付大致相等且偏低',
        ],
    },
    {
        id: 'g1',
        name: 'G1',
        group: 'v7',
        description: '氣態：息壤氣 → 固氣轉化機(solid_mode) → 息壤 → Sink（抽象邊略過媒質）',
        expected: [
            '固氣轉化機效率 ≈ 100%',
            'itemSummary 有「息壤」產出',
            '配方 machineMode = solid_mode',
        ],
    },
    {
        id: 'g2',
        name: 'G2',
        group: 'v7',
        description: '錯誤 mode：精煉爐設 base_mode 卻用 liquid 赤銅塊配方 index',
        expected: ['精煉爐被標為非法鏈', '有效流量中斷或無赤銅塊交付', '拓撲節點偏灰'],
    },
    {
        id: 'g3',
        name: 'G3',
        group: 'v7',
        description: 'belt↔pipe：物品輸出口(belt) → 提純機(pipe in)，帶 handle',
        expected: ['兩端因媒質不符被標非法', '有效 edgeFlows 為空或無交付', '拓撲節點虛線灰框'],
    },
    {
        id: 'l1',
        name: 'L1',
        group: 'v7',
        description: 'loss 延後：固氣轉化機有 loss 資料，summary 不另扣 rate_per_min',
        expected: [
            '機器 modes[].loss 存在（息壤氣 6/min）',
            '息壤氣 consumed ≈ 配方需求（30），不是 36',
            '確認 V7 不算 loss',
        ],
    },
];

const presetData: Record<string, { nodes: FactoryNode[]; edges: FactoryEdge[] }> = {
    h1: {
        nodes: [
            makeNode('src', 0, 100, '物品輸出口', '物品輸出口', { primaryOutput: '源礦' }),
            makeNode('crusher', 200, 100, '粉碎機', '粉碎機', { primaryOutput: '源石粉末' }),
            makeNode('sink', 400, 100, '物品輸入口', '物品輸入口'),
        ],
        edges: [makeEdge('e1', 'src', 'crusher'), makeEdge('e2', 'crusher', 'sink')],
    },
    h2: {
        nodes: [
            makeNode('miner', 0, 100, '物品輸出口(半速)', '物品輸出口', {
                primaryOutput: '源礦',
                recipePick: 1,
            }),
            makeNode('crusher', 200, 100, '粉碎機', '粉碎機', { primaryOutput: '源石粉末' }),
            makeNode('sink', 400, 100, '物品輸入口', '物品輸入口'),
        ],
        edges: [makeEdge('e1', 'miner', 'crusher'), makeEdge('e2', 'crusher', 'sink')],
    },
    h3: {
        nodes: [
            makeNode('src', 0, 100, '物品輸出口', '物品輸出口', { primaryOutput: '源礦' }),
            makeNode('splitter', 200, 100, '分流器', '分流器'),
            makeNode('sink1', 400, 40, '物品輸入口 1', '物品輸入口'),
            makeNode('sink2', 400, 160, '物品輸入口 2', '物品輸入口'),
        ],
        edges: [
            makeEdge('e1', 'src', 'splitter'),
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
            makeNode('a', 0, 100, '設備 A', '粉碎機', { primaryOutput: '源石粉末' }),
            makeNode('b', 200, 100, '設備 B', '粉碎機', { primaryOutput: '源石粉末' }),
            makeNode('c', 400, 100, '設備 C', '粉碎機', { primaryOutput: '源石粉末' }),
        ],
        edges: [makeEdge('e1', 'a', 'b'), makeEdge('e2', 'b', 'c'), makeEdge('e3', 'c', 'a')],
    },
    h5: {
        nodes: [makeNode('alone', 200, 100, '懸空設備', '粉碎機', { primaryOutput: '源石粉末' })],
        edges: [],
    },
    h6: {
        nodes: [
            makeNode('src', 0, 100, '物品輸出口', '物品輸出口', { primaryOutput: '紫晶礦' }),
            makeNode('c1', 200, 100, '精煉爐', '精煉爐', {
                machineMode: 'base_mode',
                primaryOutput: '紫晶纖維',
            }),
            makeNode('c2', 400, 100, '塑型機', '塑型機', {
                machineMode: 'base_mode',
                primaryOutput: '紫晶質瓶',
            }),
            makeNode('sink', 600, 100, '物品輸入口', '物品輸入口'),
        ],
        edges: [
            makeEdge('e1', 'src', 'c1'),
            makeEdge('e2', 'c1', 'c2'),
            makeEdge('e3', 'c2', 'sink'),
        ],
    },
    h7: {
        nodes: [
            makeNode('src1', 0, 40, 'Source A', '物品輸出口', { primaryOutput: '源礦' }),
            makeNode('src2', 0, 160, 'Source B', '物品輸出口', { primaryOutput: '源礦' }),
            makeNode('crusher', 220, 100, '粉碎機', '粉碎機', { primaryOutput: '源石粉末' }),
            makeNode('sink', 440, 100, '物品輸入口', '物品輸入口'),
        ],
        edges: [
            makeEdge('e_a', 'src1', 'crusher'),
            makeEdge('e_b', 'src2', 'crusher'),
            makeEdge('e_out', 'crusher', 'sink'),
        ],
    },
    h8: {
        nodes: [
            makeNode('src1', 0, 40, 'Source A', '物品輸出口', { primaryOutput: '源礦' }),
            makeNode('src2', 0, 180, 'Source B', '物品輸出口', { primaryOutput: '源礦' }),
            makeNode('c1', 200, 40, '粉碎機 A', '粉碎機', { primaryOutput: '源石粉末' }),
            makeNode('c2', 200, 180, '粉碎機 B', '粉碎機', { primaryOutput: '源石粉末' }),
            makeNode('merger', 380, 110, '匯流器', '匯流器'),
            makeNode('sink', 560, 110, 'Sink', '物品輸入口'),
        ],
        edges: [
            makeEdge('e1', 'src1', 'c1'),
            makeEdge('e2', 'src2', 'c2'),
            // 匯流器三入埠：兩鏈分接 in-0／in-1，避免單埠雙線
            {
                id: 'e3',
                source: 'c1',
                target: 'merger',
                sourceHandle: 'out-0',
                targetHandle: 'in-0',
            },
            {
                id: 'e4',
                source: 'c2',
                target: 'merger',
                sourceHandle: 'out-0',
                targetHandle: 'in-1',
            },
            makeEdge('e5', 'merger', 'sink'),
        ],
    },
    h9: {
        nodes: [
            makeNode('srcA', 0, 40, 'Source A', '物品輸出口', { primaryOutput: '源礦' }),
            makeNode('cA', 200, 40, '粉碎機 A', '粉碎機', { primaryOutput: '源石粉末' }),
            makeNode('sinkA', 400, 40, 'Sink A', '物品輸入口'),
            makeNode('srcB', 0, 180, 'Source B', '物品輸出口', { primaryOutput: '紫晶礦' }),
            makeNode('cB', 200, 180, '精煉爐 B', '精煉爐', {
                machineMode: 'base_mode',
                primaryOutput: '紫晶纖維',
            }),
            makeNode('sinkB', 400, 180, 'Sink B', '物品輸入口'),
        ],
        edges: [
            makeEdge('e1', 'srcA', 'cA'),
            makeEdge('e2', 'cA', 'sinkA'),
            makeEdge('e3', 'srcB', 'cB'),
            makeEdge('e4', 'cB', 'sinkB'),
        ],
    },
    h10: {
        nodes: [
            makeNode('src', 0, 100, '紫晶礦 Source', '物品輸出口', { primaryOutput: '紫晶礦' }),
            makeNode('crusher', 220, 100, '粉碎機(源石粉末配方)', '粉碎機', {
                primaryOutput: '源石粉末',
            }),
            makeNode('sink', 440, 100, '物品輸入口', '物品輸入口'),
        ],
        edges: [makeEdge('e1', 'src', 'crusher'), makeEdge('e2', 'crusher', 'sink')],
    },
    h11: {
        nodes: [
            makeNode('src', 0, 100, '半速 Source', '物品輸出口', {
                primaryOutput: '源礦',
                recipePick: 1,
            }),
            makeNode('splitter', 200, 100, '分流器', '分流器'),
            makeNode('sink1', 400, 40, 'Sink 1', '物品輸入口'),
            makeNode('sink2', 400, 160, 'Sink 2', '物品輸入口'),
        ],
        edges: [
            makeEdge('e1', 'src', 'splitter'),
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
    g1: {
        nodes: [
            makeNode('src', 0, 100, '息壤氣 Source', '物品輸出口', { primaryOutput: '息壤氣' }),
            makeNode('converter', 220, 100, '固氣轉化機', '固氣轉化機', {
                machineMode: 'solid_mode',
                primaryOutput: '息壤',
            }),
            makeNode('sink', 440, 100, '物品輸入口', '物品輸入口'),
        ],
        // 抽象邊：Source belt ↔ 固氣 pipe in，略過媒質以驗證氣態配方
        edges: [makeEdgeLoose('e1', 'src', 'converter'), makeEdgeLoose('e2', 'converter', 'sink')],
    },
    g2: {
        nodes: [
            makeNode('srcOre', 0, 40, '赤銅礦', '物品輸出口', { primaryOutput: '赤銅礦' }),
            makeNode('srcWater', 0, 160, '清水', '物品輸出口', { primaryOutput: '清水' }),
            makeNode('refinery', 220, 100, '精煉爐(錯 mode)', '精煉爐', {
                // 故意：base_mode + liquid 配方 index
                machineMode: 'base_mode',
                recipeIndex: recipeIndexOf('精煉爐', '赤銅塊', 'liquid_mode'),
            }),
            makeNode('sink', 440, 100, '物品輸入口', '物品輸入口'),
        ],
        edges: [
            makeEdgeLoose('e1', 'srcOre', 'refinery'),
            makeEdgeLoose('e2', 'srcWater', 'refinery'),
            makeEdgeLoose('e3', 'refinery', 'sink'),
        ],
    },
    g3: {
        nodes: [
            makeNode('src', 0, 100, '物品輸出口', '物品輸出口', { primaryOutput: '源礦' }),
            makeNode('purifier', 220, 100, '提純機', '提純機', {
                machineMode: 'liquid_mode',
                primaryOutput: '赫銅溶液',
            }),
            makeNode('sink', 440, 100, '物品輸入口', '物品輸入口'),
        ],
        edges: [makeEdge('e1', 'src', 'purifier'), makeEdge('e2', 'purifier', 'sink')],
    },
    l1: {
        nodes: [
            makeNode('src', 0, 100, '息壤氣 Source', '物品輸出口', { primaryOutput: '息壤氣' }),
            makeNode('converter', 220, 100, '固氣轉化機(有 loss)', '固氣轉化機', {
                machineMode: 'solid_mode',
                primaryOutput: '息壤',
            }),
            makeNode('sink', 440, 100, '物品輸入口', '物品輸入口'),
        ],
        edges: [makeEdgeLoose('e1', 'src', 'converter'), makeEdgeLoose('e2', 'converter', 'sink')],
    },
};

const activePresetMeta = computed(() => presets.find((p) => p.id === selectedPreset.value) ?? null);

/**
 * 依群組篩選 preset 清單。
 * @param group basic | advanced
 */
function presetsByGroup(group: PresetMeta['group']): PresetMeta[] {
    return presets.filter((p) => p.group === group);
}

/**
 * Preset 按鈕樣式。
 * @param id preset id
 */
function presetButtonClass(id: string): string {
    return selectedPreset.value === id
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600';
}

/** 嘗試解析目前 JSON 為圖資料（失敗時為 null） */
const parsedGraph = computed<{ nodes: FactoryNode[]; edges: FactoryEdge[] } | null>(() => {
    if (!jsonInput.value.trim()) return null;
    try {
        const data = JSON.parse(jsonInput.value) as {
            nodes?: FactoryNode[];
            edges?: FactoryEdge[];
        };
        if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null;
        return { nodes: data.nodes, edges: data.edges };
    } catch {
        return null;
    }
});

const selectedTopoNode = computed(() => {
    const id = selectedTopoNodeId.value;
    if (!id || !parsedGraph.value) return null;
    return parsedGraph.value.nodes.find((n) => n.id === id) ?? null;
});

const selectedTopoModes = computed(() => {
    const type = selectedTopoNode.value?.data?.machineType as string | undefined;
    if (!type) return [];
    return getMachine(type)?.modes ?? [];
});

/**
 * 寫回 JSON 的 machineMode，拓樸埠示意跟著更新。
 */
function setTopoNodeMode(nodeId: string, modeId: string) {
    const g = parsedGraph.value;
    if (!g) return;
    const nodes = g.nodes.map((n) =>
        n.id === nodeId
            ? { ...n, data: { ...n.data, machineMode: modeId, label: n.data?.label ?? n.id } }
            : n,
    );
    jsonInput.value = JSON.stringify({ nodes, edges: g.edges }, null, 2);
}

const topologyNodeStyle = computed(() => {
    const g = parsedGraph.value;
    const map: Record<string, { fill?: string; invalid?: boolean; subtitleExtra?: string }> = {};
    if (!g) return map;
    const effMap = new Map(result.value?.nodeEfficiencies ?? []);
    const invalid = new Set(result.value?.invalidChainUids ?? []);
    for (const n of g.nodes) {
        const eff = effMap.get(n.id);
        const isInvalid = invalid.has(n.id);
        map[n.id] = {
            fill: nodeFillColor(eff, isInvalid),
            invalid: isInvalid,
            subtitleExtra:
                eff === undefined
                    ? n.id
                    : isInvalid
                      ? `${n.id} · 非法`
                      : `${n.id} · ${(eff * 100).toFixed(0)}%`,
        };
    }
    return map;
});

const topologyEdgeStyle = computed(() => {
    const g = parsedGraph.value;
    const map: Record<string, { label?: string; congested?: boolean }> = {};
    if (!g) return map;
    const flowMap = new Map(result.value?.edgeFlows ?? []);
    const congested = new Set(result.value?.congestedEdges ?? []);
    for (const e of g.edges) {
        const flow = flowMap.get(e.id);
        const isC = congested.has(e.id) || flow?.isCongested === true;
        map[e.id] = {
            label: flow ? `${flow.itemId} ${flow.rate.toFixed(1)}${isC ? '!' : ''}` : e.id,
            congested: isC,
        };
    }
    return map;
});

/**
 * 節點填色（效率 / 非法）。
 * @param eff 效率 0~1，未計算時 undefined
 * @param invalid 是否非法鏈
 */
function nodeFillColor(eff: number | undefined, invalid: boolean): string {
    if (invalid) return '#71717a';
    if (eff === undefined) return '#52525b';
    if (eff >= 1) return '#22c55e';
    if (eff >= 0.5) return '#eab308';
    if (eff > 0) return '#fb923c';
    return '#a1a1aa';
}

/**
 * 載入 preset 並自動執行計算。
 * @param id preset id
 */
async function loadPreset(id: string) {
    selectedPreset.value = id;
    selectedTopoNodeId.value = null;
    jsonInput.value = JSON.stringify(presetData[id], null, 2);
    errorMessage.value = '';
    await runCalculation();
}

/**
 * 解析 JSON、暫替 editorStore、執行 FlowEngine、讀結果後還原主畫布。
 */
async function runCalculation() {
    try {
        isCalculating.value = true;
        errorMessage.value = '';

        const data = JSON.parse(jsonInput.value) as {
            nodes?: FactoryNode[];
            edges?: FactoryEdge[];
        };
        if (!data.nodes || !data.edges) {
            throw new Error('JSON 格式錯誤：需包含 nodes 和 edges 欄位');
        }

        originalNodes = [...editorStore.nodes];
        originalEdges = [...editorStore.edges];
        editorStore.nodes = data.nodes;
        editorStore.edges = data.edges;

        await runFlowEngine();

        result.value = {
            edgeFlows: Array.from(flowStore.edgeFlows.entries()),
            nodeEfficiencies: Array.from(flowStore.nodeEfficiencies.entries()),
            itemSummary: flowStore.itemSummary,
            sinkDeliveries: Array.from(flowStore.sinkDeliveries.entries()),
            congestedEdges: Array.from(flowStore.congestedEdges),
            invalidChainUids: Array.from(flowStore.invalidChainUids),
            powerBalance: {
                demand: flowStore.totalPowerDemand,
                supply: flowStore.totalPowerSupply,
            },
        };

        editorStore.nodes = originalNodes;
        editorStore.edges = originalEdges;
        isCalculating.value = false;
    } catch (error) {
        errorMessage.value = (error as Error)?.message || '計算失敗，請檢查 JSON 格式';
        console.error('計算失敗：', error);
        if (originalNodes.length > 0 || originalEdges.length > 0) {
            editorStore.nodes = originalNodes;
            editorStore.edges = originalEdges;
        }
        isCalculating.value = false;
    }
}

/**
 * 效率文字顏色 class。
 * @param eff 0~1
 */
function getEfficiencyClass(eff: number): string {
    if (eff === 1) return 'text-green-500';
    if (eff >= 0.5) return 'text-yellow-400';
    if (eff > 0) return 'text-orange-400';
    return 'text-gray-400';
}
</script>
