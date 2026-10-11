<template>
    <div class="validation-test">
        <div class="mb-6">
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">驗證系統測試</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                測試 validationStore 的 detector 註冊與 E001 設備重疊偵測
            </p>
        </div>

        <!-- 使用說明 -->
        <div
            class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950"
        >
            <h3 class="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-200">📖 使用說明</h3>
            <div class="space-y-2 text-xs text-blue-800 dark:text-blue-300">
                <p class="font-semibold">驗證系統架構（CR-03）：</p>
                <ul class="ml-4 space-y-1">
                    <li>
                        • 本頁於 setup 時以 <code>registerDetector()</code> 掛上
                        <code>E001_deviceOverlap</code>，因此下方警示會實際反映設備重疊
                    </li>
                    <li>
                        • 透過 <code>useValidation()</code> 監聽
                        <code>editorStore.nodes / edges</code>，一有變動立即重跑所有已註冊 detector
                    </li>
                    <li>
                        • 下方「目前警示」直接讀取
                        <code>validationStore.alerts</code>，即正式環境右側面板未來要消費的資料
                    </li>
                </ul>

                <p class="mt-3 font-semibold">測試流程：</p>
                <ol class="ml-4 list-decimal space-y-1">
                    <li>點擊「清空所有設備」建立基線，警示應為 0 筆</li>
                    <li>點擊「新增設備 A」，警示仍為 0 筆</li>
                    <li>點擊「新增與 A 重疊的設備 B」，警示出現 1 筆 E001</li>
                    <li>點擊「新增不重疊的設備 C」，警示筆數維持 1 筆</li>
                    <li>點擊「清空所有設備」，警示應歸零</li>
                </ol>
            </div>
        </div>

        <!-- 目前警示 -->
        <div
            class="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
            <div class="mb-3 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                    目前警示（{{ validationStore.alerts.length }}）
                </h3>
                <div class="flex space-x-3 text-xs">
                    <span class="text-red-600 dark:text-red-400">
                        Error:
                        <span class="font-mono font-semibold">{{
                            validationStore.errorCount
                        }}</span>
                    </span>
                    <span class="text-yellow-600 dark:text-yellow-400">
                        Warning:
                        <span class="font-mono font-semibold">{{
                            validationStore.warningCount
                        }}</span>
                    </span>
                </div>
            </div>
            <div class="max-h-64 space-y-2 overflow-y-auto">
                <div
                    v-for="alert in validationStore.alerts"
                    :key="alert.uid"
                    class="rounded p-3 text-xs"
                    :class="
                        alert.level === 'error'
                            ? 'bg-red-50 dark:bg-red-950'
                            : 'bg-yellow-50 dark:bg-yellow-950'
                    "
                >
                    <span class="font-mono font-semibold">{{ alert.code }}</span>
                    <span class="ml-2 text-gray-700 dark:text-gray-300">{{ alert.message }}</span>
                </div>
            </div>
            <p v-if="validationStore.alerts.length === 0" class="text-xs text-gray-400">(無警示)</p>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <!-- 左側：測試操作 -->
            <div
                class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
                <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">測試操作</h3>
                <div class="space-y-2">
                    <button
                        @click="testPlaceDeviceA"
                        class="w-full rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                    >
                        ➕ 新增設備 A（精煉爐 @10,10）
                    </button>
                    <button
                        @click="testPlaceOverlappingDeviceB"
                        class="w-full rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                    >
                        ➕ 新增與 A 重疊的設備 B（精煉爐 @11,11）
                    </button>
                    <button
                        @click="testPlaceNonOverlappingDeviceC"
                        class="w-full rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                    >
                        ➕ 新增不重疊的設備 C（精煉爐 @50,50）
                    </button>
                    <button
                        @click="testPlaceUnconnectedMachine"
                        class="w-full rounded-md bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700"
                    >
                        ➕ 新增沒接線的機器（精煉爐 @20,20，觸發 E004）
                    </button>
                    <button
                        @click="testPlaceMismatchedConnection"
                        class="w-full rounded-md bg-yellow-600 px-3 py-2 text-sm text-white hover:bg-yellow-700"
                    >
                        ⚡ 新增加工機連線（粉碎機 ➔ 精煉爐，觸發 E004+W001）
                    </button>
                    <button
                        @click="testPlacePureW001Connection"
                        class="w-full rounded-md bg-amber-500 px-3 py-2 text-sm text-white hover:bg-amber-600"
                    >
                        🎯 新增純粹 W001（源機 ➔ 精煉爐，僅 1 筆 W001，無 E004）
                    </button>
                    <button
                        @click="testPlaceExtraMaterialConnection"
                        class="w-full rounded-md bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700"
                    >
                        ⚡ 新增多餘材料的連線設備（Exact Set Match 觸發 W001）
                    </button>
                    <button
                        @click="testClearDevices"
                        :disabled="editorStore.nodes.length === 0 && editorStore.edges.length === 0"
                        class="w-full rounded-md bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                        🗑️ 清空所有設備與管線
                    </button>
                </div>
            </div>

            <!-- 右側：設備與管線清單 -->
            <div
                class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
                <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Editor Nodes（{{ editorStore.nodes.length }}）
                </h3>
                <div class="max-h-40 space-y-1 overflow-y-auto">
                    <div
                        v-for="node in editorStore.nodes"
                        :key="node.id"
                        class="rounded bg-gray-50 p-2 text-xs dark:bg-gray-900"
                    >
                        <span class="font-mono text-gray-500">{{ node.id.slice(0, 8) }}</span>
                        <span class="ml-2 text-gray-700 dark:text-gray-300">{{
                            node.data?.machineType || 'Unknown'
                        }}</span>
                        <span class="ml-2 text-gray-500">
                            @({{ node.position.x }}, {{ node.position.y }}) px
                        </span>
                    </div>
                </div>
                <p v-if="editorStore.nodes.length === 0" class="mb-4 text-xs text-gray-400">
                    (無節點)
                </p>

                <h3 class="mt-4 mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Editor Connections（{{ editorStore.edges.length }}）
                </h3>
                <div class="max-h-36 space-y-1 overflow-y-auto">
                    <div
                        v-for="edge in editorStore.edges"
                        :key="edge.id"
                        class="rounded bg-gray-50 p-2 text-xs dark:bg-gray-900"
                    >
                        <span class="font-mono text-gray-500">{{ edge.id.slice(0, 8) }}</span>
                        <span class="ml-2 font-mono text-gray-700 dark:text-gray-300">
                            {{ edge.source.slice(0, 8) }} → {{ edge.target.slice(0, 8) }}
                        </span>
                    </div>
                </div>
                <p v-if="editorStore.edges.length === 0" class="text-xs text-gray-400">(無管線)</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/store/editorStore';
import { useValidationStore } from '@/store/validationStore';
import { useValidation } from '@/composables/useValidation';
import { E001_deviceOverlap } from '@/lib/validation/detectors/E001_deviceOverlap';
import { E004_missingInput } from '@/lib/validation/detectors/E004_missingInput';
import { W001_unmatchedMaterial } from '@/lib/validation/detectors/W001_unmatchedMaterial';

/** 藍圖 store：本頁所有測試設備皆透過此 store 擺放 / 清除 */
const editorStore = useEditorStore();
/** 驗證 store：本頁展示其 alerts / errorCount / warningCount */
const validationStore = useValidationStore();

/** 註冊必須早於 useValidation()：後者的 watch 是 immediate，setup 當下就會跑一次 */
validationStore.registerDetector(E001_deviceOverlap);
validationStore.registerDetector(E004_missingInput);
validationStore.registerDetector(W001_unmatchedMaterial);

/** 啟動 editorStore → validationStore 的自動重跑監聽 */
useValidation();

/**
 * 在像素座標 (200,200)（gridSize 20 下即格子 (10,10)）擺放一台精煉爐，作為重疊測試的基準設備 A。
 * @example
 * testPlaceDeviceA()
 */
function testPlaceDeviceA() {
    editorStore.placeDevice({
        id: crypto.randomUUID(),
        type: 'default',
        position: { x: 200, y: 200 },
        data: { label: '測試設備 A', machineType: '精煉爐', recipeIndex: 0, rotation: 0 },
    });
}

/**
 * 在像素座標 (220,220)（即格子 (11,11)）擺放一台精煉爐，與設備 A 佔用格子重疊，用於觸發 E001。
 * @example
 * testPlaceOverlappingDeviceB()
 */
function testPlaceOverlappingDeviceB() {
    editorStore.placeDevice({
        id: crypto.randomUUID(),
        type: 'default',
        position: { x: 220, y: 220 },
        data: { label: '測試設備 B', machineType: '精煉爐', recipeIndex: 0, rotation: 0 },
    });
}

/**
 * 在像素座標 (1000,1000)（即格子 (50,50)）擺放一台精煉爐，與既有設備不重疊，用於驗證 E001 不誤報。
 * @example
 * testPlaceNonOverlappingDeviceC()
 */
function testPlaceNonOverlappingDeviceC() {
    editorStore.placeDevice({
        id: crypto.randomUUID(),
        type: 'default',
        position: { x: 1000, y: 1000 },
        data: { label: '測試設備 C', machineType: '精煉爐', recipeIndex: 0, rotation: 0 },
    });
}

/**
 * 在像素座標 (400,400)（即格子 (20,20)）擺放一台未接線的精煉爐，用於驗證觸發 E004。
 * @example
 * testPlaceUnconnectedMachine()
 */
function testPlaceUnconnectedMachine() {
    editorStore.placeDevice({
        id: crypto.randomUUID(),
        type: 'default',
        position: { x: 400, y: 400 },
        data: { label: '未接線精煉爐', machineType: '精煉爐', recipeIndex: 0, rotation: 0 },
    });
}

/**
 * 測試 W001：上游輸出「藍鐵粉末」，下游「精煉爐」需要赤銅相關材料，兩者接線後觸發 W001。
 * @example
 * testPlaceMismatchedConnection()
 */
function testPlaceMismatchedConnection() {
    const srcId = crypto.randomUUID();
    const dstId = crypto.randomUUID();

    // 1. 放置上游設備（粉碎機，產出藍鐵粉末）
    editorStore.placeDevice({
        id: srcId,
        type: 'default',
        position: { x: 100, y: 600 },
        data: { label: '上游粉碎機（藍鐵）', machineType: '粉碎機', recipeIndex: 1, rotation: 0 },
    });

    // 2. 放置下游設備（精煉爐，需赤銅材料）
    editorStore.placeDevice({
        id: dstId,
        type: 'default',
        position: { x: 400, y: 600 },
        data: { label: '下游精煉爐（需赤銅）', machineType: '精煉爐', recipeIndex: 2, rotation: 0 },
    });

    // 3. 連接管線
    editorStore.addConnection({
        id: crypto.randomUUID(),
        source: srcId,
        target: dstId,
    });
}

/**
 * 測試純粹 W001：上游為源類機器（物品輸出口，is_source: true），輸出「赤銅礦」；
 * 下游精煉爐在預設基礎模式（base_mode）下無法單獨精煉赤銅礦（赤銅需在 liquid_mode 加清水）。
 * 因上游是源機，E004 自動忽略；下游有入邊，不報 E004；
 * 僅有精煉爐材料不符 ➔ 畫面上純粹只有 1 筆 W001 Warning（0 Errors）。
 * @example
 * testPlacePureW001Connection()
 */
function testPlacePureW001Connection() {
    const srcId = crypto.randomUUID();
    const dstId = crypto.randomUUID();

    // 1. 放置上游源設備（物品輸出口，is_source: true，不套用 E004）
    editorStore.placeDevice({
        id: srcId,
        type: 'default',
        position: { x: 100, y: 400 },
        data: {
            label: '物品輸出口（赤銅礦）',
            machineType: '物品輸出口',
            primaryOutput: '赤銅礦',
            rotation: 0,
        },
    });

    // 2. 放置下游加工設備（精煉爐，base_mode 無法單獨精煉赤銅礦）
    editorStore.placeDevice({
        id: dstId,
        type: 'default',
        position: { x: 400, y: 400 },
        data: {
            label: '下游精煉爐（基礎模式）',
            machineType: '精煉爐',
            rotation: 0,
        },
    });

    // 3. 連接管線
    editorStore.addConnection({
        id: crypto.randomUUID(),
        source: srcId,
        target: dstId,
    });
}

/**
 * 測試 W001（多餘材料）：送入材料 A ＋ 多餘材料 B 至下游設備，驗證 Exact Set Match 觸發 W001。
 * @example
 * testPlaceExtraMaterialConnection()
 */
function testPlaceExtraMaterialConnection() {
    const srcId1 = crypto.randomUUID();
    const srcId2 = crypto.randomUUID();
    const dstId = crypto.randomUUID();

    // 上游 1：產出赤銅粉末
    editorStore.placeDevice({
        id: srcId1,
        type: 'default',
        position: { x: 100, y: 800 },
        data: { label: '上游粉碎機（赤銅）', machineType: '粉碎機', recipeIndex: 3, rotation: 0 },
    });

    // 上游 2：產出藍鐵粉末（多餘材料）
    editorStore.placeDevice({
        id: srcId2,
        type: 'default',
        position: { x: 100, y: 1000 },
        data: {
            label: '上游粉碎機（多餘材料）',
            machineType: '粉碎機',
            recipeIndex: 1,
            rotation: 0,
        },
    });

    // 下游設備：精煉爐
    editorStore.placeDevice({
        id: dstId,
        type: 'default',
        position: { x: 400, y: 900 },
        data: { label: '下游精煉爐', machineType: '精煉爐', recipeIndex: 0, rotation: 0 },
    });

    // 連接兩條管線至下游
    editorStore.addConnection({
        id: crypto.randomUUID(),
        source: srcId1,
        target: dstId,
    });
    editorStore.addConnection({
        id: crypto.randomUUID(),
        source: srcId2,
        target: dstId,
    });
}

/**
 * 刪除畫布上所有設備與管線，用於驗證清空後 alerts 一併歸零。
 * @example
 * testClearDevices()
 */
function testClearDevices() {
    const allUids = editorStore.nodes.map((n) => n.id);
    editorStore.removeDevices(allUids);
    editorStore.edges = [];
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
