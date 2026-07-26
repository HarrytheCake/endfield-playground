<template>
    <div class="history-replay">
        <div class="mb-6">
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">歷史回放測試</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                測試 historyStore 的 undo/redo 機制，驗證 Command Pattern 實作
            </p>
        </div>

        <!-- 使用說明 -->
        <div
            class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950"
        >
            <h3 class="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-200">📖 使用說明</h3>
            <div class="space-y-2 text-xs text-blue-800 dark:text-blue-300">
                <p class="font-semibold">歷史系統架構（CR-08）：</p>
                <ul class="ml-4 space-y-1">
                    <li>• <strong>Command Pattern</strong>：每個操作都是可逆的指令物件</li>
                    <li>
                        • <strong>8 個高階 Actions</strong>：placeDevice, moveDevices,
                        removeDevices, connectPorts, disconnectPorts, updateRecipe, rotateMachine,
                        updateFacing
                    </li>
                    <li>• <strong>自動記錄</strong>：所有 editorStore 操作自動進入歷史堆疊</li>
                    <li>
                        •
                        <strong>完整保留</strong
                        >：所有操作依序保留在歷史堆疊中，可逐步復原至最初狀態
                    </li>
                </ul>

                <p class="mt-3 font-semibold">測試流程：</p>
                <ol class="ml-4 list-decimal space-y-1">
                    <li>點擊「測試操作」區的按鈕執行操作（會自動記錄到 Undo Stack）</li>
                    <li>觀察 Undo Stack 增加一筆記錄，Editor State 更新</li>
                    <li>點擊「⏮️ Undo」還原操作（記錄移到 Redo Stack）</li>
                    <li>點擊「⏭️ Redo」重做操作（記錄回到 Undo Stack）</li>
                    <li>執行新操作會清空 Redo Stack（分支點規則）</li>
                </ol>
            </div>
        </div>

        <!-- 使用範例 -->
        <div
            class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950"
        >
            <h3 class="mb-3 text-sm font-semibold text-green-900 dark:text-green-200">
                💡 使用範例
            </h3>
            <div class="grid grid-cols-3 gap-4">
                <!-- 範例 1 -->
                <div class="rounded-lg bg-white p-3 dark:bg-gray-800">
                    <div class="mb-2 text-xs font-semibold text-green-700 dark:text-green-300">
                        範例 1：基礎 Undo/Redo
                    </div>
                    <ol
                        class="ml-4 list-decimal space-y-1 text-xs text-gray-700 dark:text-gray-300"
                    >
                        <li>點擊「➕ 擺放設備」3 次</li>
                        <li>觀察 Undo Stack 有 3 筆記錄</li>
                        <li>點擊「⏮️ Undo」2 次</li>
                        <li>觀察設備數量從 3 → 1</li>
                        <li>點擊「⏭️ Redo」1 次</li>
                        <li>觀察設備數量從 1 → 2</li>
                    </ol>
                </div>

                <!-- 範例 2 -->
                <div class="rounded-lg bg-white p-3 dark:bg-gray-800">
                    <div class="mb-2 text-xs font-semibold text-green-700 dark:text-green-300">
                        範例 2：移動與還原
                    </div>
                    <ol
                        class="ml-4 list-decimal space-y-1 text-xs text-gray-700 dark:text-gray-300"
                    >
                        <li>點擊「➕ 擺放設備」1 次</li>
                        <li>記住設備的 X 座標</li>
                        <li>點擊「↔️ 移動所有設備」</li>
                        <li>觀察 X 座標 +50</li>
                        <li>點擊「⏮️ Undo」</li>
                        <li>觀察座標恢復原值</li>
                    </ol>
                </div>

                <!-- 範例 3 -->
                <div class="rounded-lg bg-white p-3 dark:bg-gray-800">
                    <div class="mb-2 text-xs font-semibold text-green-700 dark:text-green-300">
                        範例 3：分支點測試
                    </div>
                    <ol
                        class="ml-4 list-decimal space-y-1 text-xs text-gray-700 dark:text-gray-300"
                    >
                        <li>點擊「➕ 擺放設備」2 次</li>
                        <li>點擊「⏮️ Undo」1 次</li>
                        <li>觀察 Redo Stack 有 1 筆</li>
                        <li>點擊「➕ 擺放設備」</li>
                        <li>觀察 Redo Stack 清空</li>
                        <li>（新分支產生，舊未來被丟棄）</li>
                    </ol>
                </div>
            </div>
        </div>

        <!-- 快速測試場景 -->
        <div
            class="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950"
        >
            <h3 class="mb-3 text-sm font-semibold text-purple-900 dark:text-purple-200">
                🚀 快速測試場景
            </h3>
            <div class="flex space-x-2">
                <button
                    @click="runScenario1"
                    class="rounded-md bg-purple-600 px-3 py-2 text-xs text-white hover:bg-purple-700"
                >
                    場景 1：連續擺放 5 台設備
                </button>
                <button
                    @click="runScenario2"
                    class="rounded-md bg-purple-600 px-3 py-2 text-xs text-white hover:bg-purple-700"
                >
                    場景 2：擺放 → 移動 → 刪除
                </button>
                <button
                    @click="runScenario3"
                    class="rounded-md bg-purple-600 px-3 py-2 text-xs text-white hover:bg-purple-700"
                >
                    場景 3：連續 51 次操作
                </button>
            </div>
            <div
                v-if="scenarioMessage"
                class="mt-3 rounded-md bg-white p-2 text-xs text-purple-700 dark:bg-gray-800 dark:text-purple-300"
            >
                {{ scenarioMessage }}
            </div>
        </div>

        <!-- 控制面板 -->
        <div
            class="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
            <div class="flex items-center justify-between">
                <div class="flex space-x-3">
                    <button
                        @click="undo"
                        :disabled="!historyStore.canUndo"
                        class="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        ⏮️ Undo
                    </button>
                    <button
                        @click="redo"
                        :disabled="!historyStore.canRedo"
                        class="rounded-md bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        ⏭️ Redo
                    </button>
                    <button
                        @click="clear"
                        class="rounded-md bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
                    >
                        🗑️ Clear
                    </button>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    Depth: <span class="font-mono font-semibold">{{ historyStore.undoDepth }}</span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <!-- 左側：History Stacks -->
            <div class="space-y-4">
                <!-- Undo Stack -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        Undo Stack（{{ historyStore.undoStack.length }}）
                    </h3>
                    <div class="max-h-96 space-y-2 overflow-y-auto">
                        <div
                            v-for="(command, index) in historyStore.undoStack"
                            :key="command.id"
                            class="rounded bg-blue-50 p-3 text-xs dark:bg-blue-900"
                        >
                            <div class="font-mono text-blue-600 dark:text-blue-400">
                                #{{ index + 1 }}
                            </div>
                            <div class="mt-1 text-gray-700 dark:text-gray-300">
                                Type: <span class="font-semibold">{{ command.type }}</span>
                            </div>
                            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                ID: {{ command.id.slice(0, 8) }}...
                            </div>
                        </div>
                    </div>
                    <p v-if="historyStore.undoStack.length === 0" class="text-xs text-gray-400">
                        (空)
                    </p>
                </div>

                <!-- Redo Stack -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        Redo Stack（{{ historyStore.redoStack.length }}）
                    </h3>
                    <div class="max-h-96 space-y-2 overflow-y-auto">
                        <div
                            v-for="(command, index) in historyStore.redoStack"
                            :key="command.id"
                            class="rounded bg-purple-50 p-3 text-xs dark:bg-purple-900"
                        >
                            <div class="font-mono text-purple-600 dark:text-purple-400">
                                #{{ index + 1 }}
                            </div>
                            <div class="mt-1 text-gray-700 dark:text-gray-300">
                                Type: <span class="font-semibold">{{ command.type }}</span>
                            </div>
                            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                ID: {{ command.id.slice(0, 8) }}...
                            </div>
                        </div>
                    </div>
                    <p v-if="historyStore.redoStack.length === 0" class="text-xs text-gray-400">
                        (空)
                    </p>
                </div>
            </div>

            <!-- 右側：State Snapshot -->
            <div class="space-y-4">
                <!-- Editor State -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        Editor State 快照
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <span class="text-xs text-gray-500">Nodes:</span>
                            <span
                                class="ml-2 font-mono font-semibold text-blue-600 dark:text-blue-400"
                            >
                                {{ editorStore.nodes.length }}
                            </span>
                        </div>
                        <div>
                            <span class="text-xs text-gray-500">Edges:</span>
                            <span
                                class="ml-2 font-mono font-semibold text-purple-600 dark:text-purple-400"
                            >
                                {{ editorStore.edges.length }}
                            </span>
                        </div>
                        <div class="border-t border-gray-200 pt-3 dark:border-gray-700">
                            <h4 class="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Nodes Detail:
                            </h4>
                            <div class="max-h-48 space-y-1 overflow-y-auto">
                                <div
                                    v-for="node in editorStore.nodes"
                                    :key="node.id"
                                    class="rounded bg-gray-50 p-2 text-xs dark:bg-gray-900"
                                >
                                    <span class="font-mono text-gray-500">{{
                                        node.id.slice(0, 8)
                                    }}</span>
                                    <span class="ml-2 text-gray-700 dark:text-gray-300">
                                        {{ node.data?.machineType || 'Unknown' }}
                                    </span>
                                    <span class="ml-2 text-gray-500">
                                        @({{ node.position.x }}, {{ node.position.y }})
                                    </span>
                                </div>
                            </div>
                            <p v-if="editorStore.nodes.length === 0" class="text-xs text-gray-400">
                                (無節點)
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Test Actions -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        測試操作
                    </h3>
                    <div class="space-y-2">
                        <button
                            @click="testPlaceDevice"
                            class="w-full rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                        >
                            ➕ 測試：擺放設備
                        </button>
                        <button
                            @click="testMoveDevices"
                            :disabled="editorStore.nodes.length === 0"
                            class="w-full rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            ↔️ 測試：移動所有設備
                        </button>
                        <button
                            @click="testRemoveDevices"
                            :disabled="editorStore.nodes.length === 0"
                            class="w-full rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            ❌ 測試：刪除所有設備
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useEditorStore } from '@/store/editorStore';
import { useHistoryStore } from '@/store/historyStore';

/** 藍圖 store：本頁所有測試操作（擺放 / 移動 / 刪除）皆透過此 store 觸發 */
const editorStore = useEditorStore();
/** 歷史紀錄 store：本頁展示其 undo / redo 堆疊內容 */
const historyStore = useHistoryStore();
/** 快速測試場景執行進度提示文字 */
const scenarioMessage = ref('');

/**
 * 呼叫 historyStore 還原上一筆操作。
 * @example
 * undo()
 */
function undo() {
    historyStore.undo();
}

/**
 * 呼叫 historyStore 取消還原上一筆 undo 的操作。
 * @example
 * redo()
 */
function redo() {
    historyStore.redo();
}

/**
 * 使用者確認後清空所有歷史紀錄，避免誤觸清空後無法復原。
 * @example
 * clear()
 */
function clear() {
    if (confirm('確定要清空所有歷史記錄嗎？')) {
        historyStore.clear();
    }
}

/**
 * 在畫布隨機座標擺放一台測試用粉碎機，用於驗證 placeDevice 是否正確進入歷史堆疊。
 * @example
 * testPlaceDevice()
 */
function testPlaceDevice() {
    editorStore.placeDevice({
        id: crypto.randomUUID(),
        type: 'default',
        position: {
            x: Math.random() * 400,
            y: Math.random() * 400,
        },
        data: {
            label: '測試設備',
            machineType: '粉碎機',
            recipeIndex: 0,
            rotation: 0,
        },
    });
}

/**
 * 將畫布上所有設備往右移動 50 像素，用於驗證 moveDevices 的批次移動與單一歷史項目行為。
 * @example
 * testMoveDevices()
 */
function testMoveDevices() {
    const allUids = editorStore.nodes.map((n) => n.id);
    editorStore.moveDevices(allUids, { x: 50, y: 0 });
}

/**
 * 刪除畫布上所有設備，用於驗證 removeDevices 的批次刪除與 undo 還原行為。
 * @example
 * testRemoveDevices()
 */
function testRemoveDevices() {
    const allUids = editorStore.nodes.map((n) => n.id);
    editorStore.removeDevices(allUids);
}

// 快速測試場景
/**
 * 連續呼叫 5 次 testPlaceDevice，驗證 Undo Stack 會累積對應筆數的獨立歷史項目。
 * @example
 * await runScenario1()
 */
async function runScenario1() {
    scenarioMessage.value = '執行中：連續擺放 5 台設備...';
    for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        testPlaceDevice();
    }
    scenarioMessage.value = '✓ 完成！Undo Stack 應有 5 筆記錄，試試 Undo 看看';
}

/**
 * 依序執行擺放 3 台、移動、刪除，驗證多種操作類型混合入歷史堆疊時仍能正確 undo/redo。
 * @example
 * await runScenario2()
 */
async function runScenario2() {
    scenarioMessage.value = '執行中：擺放 → 移動 → 刪除...';

    // 擺放 3 台
    for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        testPlaceDevice();
    }
    scenarioMessage.value = '擺放完成，移動中...';

    // 移動
    await new Promise((resolve) => setTimeout(resolve, 300));
    testMoveDevices();
    scenarioMessage.value = '移動完成，刪除中...';

    // 刪除
    await new Promise((resolve) => setTimeout(resolve, 300));
    testRemoveDevices();
    scenarioMessage.value = '✓ 完成！Undo Stack 應有 5 筆記錄（3×擺放 + 1×移動 + 1×刪除）';
}

/**
 * 連續擺放 51 次設備，驗證歷史堆疊完整保留每一筆操作，undoDepth 應等於實際操作次數。
 * @example
 * await runScenario3()
 */
async function runScenario3() {
    scenarioMessage.value = '執行中：連續擺放 51 次設備...';
    for (let i = 0; i < 51; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        testPlaceDevice();
        if (i % 10 === 0) {
            scenarioMessage.value = `執行中：${i + 1} / 51 步...`;
        }
    }
    scenarioMessage.value = `✓ 完成！Undo Stack 完整保留 51 筆記錄，當前 Depth: ${historyStore.undoDepth}`;
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
