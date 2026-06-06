<template>
    <div class="history-replay">
        <div class="mb-6">
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">歷史回放測試</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                測試 historyStore 的 undo/redo 機制，驗證 Command Pattern 實作
            </p>
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
import { useEditorStore } from '@/store/editorStore';
import { useHistoryStore } from '@/store/historyStore';

const editorStore = useEditorStore();
const historyStore = useHistoryStore();

function undo() {
    historyStore.undo();
}

function redo() {
    historyStore.redo();
}

function clear() {
    if (confirm('確定要清空所有歷史記錄嗎？')) {
        historyStore.clear();
    }
}

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

function testMoveDevices() {
    const allUids = editorStore.nodes.map((n) => n.id);
    editorStore.moveDevices(allUids, { x: 50, y: 0 });
}

function testRemoveDevices() {
    const allUids = editorStore.nodes.map((n) => n.id);
    editorStore.removeDevices(allUids);
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
