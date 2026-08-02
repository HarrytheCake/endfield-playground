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

        <!-- V6 拖曳驗收（commitDeviceMove） -->
        <div
            class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950"
        >
            <h3 class="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                V6 拖曳驗收
            </h3>
            <div class="mb-3 space-y-2 text-xs text-amber-800 dark:text-amber-300">
                <p>
                    <strong>目的：</strong>驗證「拖曳結束」會正確寫入歷史（模擬改座標 →
                    <code class="rounded bg-white/60 px-1 dark:bg-black/30">commitDeviceMove</code
                    >）。 與下方 <strong>Undo／Redo／Clear</strong>、<strong>Undo Stack</strong>
                    是<strong>同一套</strong>
                    <code class="rounded bg-white/60 px-1 dark:bg-black/30">historyStore</code
                    >——一鍵腳本跑完後，可直接用下方 Undo 再驗一次。
                </p>
                <p>
                    <strong>建議路徑（最快）：</strong>按
                    <span class="font-semibold">「一鍵 M1→M4」</span>（會自動清場並擺設備）→
                    看綠／紅結果 → checklist 會自動勾選通過項。
                </p>
                <p>
                    <strong>手動路徑：</strong>右側「➕ 擺放設備」至少 1～2 台 → 再按上方模擬按鈕 →
                    用下方 Undo／Redo 觀察座標。M7（跟手）請到
                    <RouterLink class="underline" to="/">主編輯畫布</RouterLink>
                    真拖曳後手動勾選。
                </p>
                <p class="text-amber-700 dark:text-amber-400">
                    目前畫布：{{ nodeCount }} 台設備
                    <span v-if="v6Busy" class="ml-2 font-semibold">· 腳本執行中…</span>
                </p>
            </div>

            <div class="mb-3 overflow-x-auto rounded-md bg-white/80 p-2 dark:bg-gray-900/80">
                <table class="w-full text-left text-xs text-amber-900 dark:text-amber-200">
                    <thead>
                        <tr class="border-b border-amber-200 dark:border-amber-800">
                            <th class="py-1 pr-3 font-semibold">項</th>
                            <th class="py-1 pr-3 font-semibold">怎麼測</th>
                            <th class="py-1 font-semibold">通過長相</th>
                        </tr>
                    </thead>
                    <tbody class="align-top">
                        <tr>
                            <td class="py-1 pr-3 font-mono">M1</td>
                            <td class="py-1 pr-3">模擬拖曳（單）→ 下方 Undo</td>
                            <td class="py-1">座標回到拖曳前</td>
                        </tr>
                        <tr>
                            <td class="py-1 pr-3 font-mono">M2</td>
                            <td class="py-1 pr-3">接 M1 → 下方 Redo</td>
                            <td class="py-1">座標回到拖曳後</td>
                        </tr>
                        <tr>
                            <td class="py-1 pr-3 font-mono">M3</td>
                            <td class="py-1 pr-3">模擬拖曳（多）→ Undo 一次</td>
                            <td class="py-1">兩台都還原（需 ≥2 台）</td>
                        </tr>
                        <tr>
                            <td class="py-1 pr-3 font-mono">M4</td>
                            <td class="py-1 pr-3">模擬零位移</td>
                            <td class="py-1">undoDepth 不變</td>
                        </tr>
                        <tr>
                            <td class="py-1 pr-3 font-mono">M5</td>
                            <td class="py-1 pr-3">一鍵 M5（交錯）</td>
                            <td class="py-1">拖曳／旋轉／刪除交錯 Undo 合理</td>
                        </tr>
                        <tr>
                            <td class="py-1 pr-3 font-mono">M6</td>
                            <td class="py-1 pr-3">一鍵 M6 或右側「移動所有設備」</td>
                            <td class="py-1">moveDevices 路徑 Undo 正常</td>
                        </tr>
                        <tr>
                            <td class="py-1 pr-3 font-mono">M7</td>
                            <td class="py-1 pr-3">
                                <RouterLink class="underline" to="/">主畫布</RouterLink> 真拖曳
                            </td>
                            <td class="py-1">跟手無抖動（此頁無法代替）</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="mb-2 flex flex-wrap gap-2">
                <button
                    type="button"
                    class="rounded-md bg-amber-800 px-3 py-2 text-xs text-white hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="v6Busy"
                    :title="v6Busy ? '腳本執行中' : '推薦：自動清場、擺設備並驗 M1–M4'"
                    @click="runV6ScriptM1toM4"
                >
                    一鍵 M1→M4（推薦）
                </button>
                <button
                    type="button"
                    class="rounded-md bg-amber-800 px-3 py-2 text-xs text-white hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="v6Busy"
                    :title="v6Busy ? '腳本執行中' : '自動驗 M5 交錯 Undo'"
                    @click="runV6ScriptM5"
                >
                    一鍵 M5（交錯）
                </button>
                <button
                    type="button"
                    class="rounded-md bg-blue-700 px-3 py-2 text-xs text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="v6Busy || nodeCount === 0"
                    :title="v6NeedNodesHint(1) || '對現有設備跑 moveDevices'"
                    @click="runV6ScriptM6"
                >
                    一鍵 M6（moveDevices）
                </button>
                <span
                    class="mx-1 hidden h-8 w-px self-center bg-amber-300 sm:inline-block dark:bg-amber-700"
                    aria-hidden="true"
                />
                <button
                    type="button"
                    class="rounded-md bg-amber-700 px-3 py-2 text-xs text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="v6Busy || nodeCount === 0"
                    :title="v6NeedNodesHint(1) || 'M1：單機模擬拖曳結束'"
                    @click="simulateDragCommitSingle"
                >
                    模擬拖曳（單）
                </button>
                <button
                    type="button"
                    class="rounded-md bg-amber-700 px-3 py-2 text-xs text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="v6Busy || nodeCount < 2"
                    :title="v6NeedNodesHint(2) || 'M3：多機同一筆 commit'"
                    @click="simulateDragCommitMulti"
                >
                    模擬拖曳（多）
                </button>
                <button
                    type="button"
                    class="rounded-md bg-amber-700 px-3 py-2 text-xs text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="v6Busy || nodeCount === 0"
                    :title="v6NeedNodesHint(1) || 'M4：零位移不應進歷史'"
                    @click="simulateZeroDisplacement"
                >
                    模擬零位移
                </button>
            </div>
            <p
                v-if="v6ButtonHint"
                class="mb-3 text-xs font-medium text-amber-700 dark:text-amber-400"
            >
                {{ v6ButtonHint }}
            </p>

            <div
                v-if="v6Busy"
                class="mb-3 rounded-md border border-amber-400 bg-amber-100 p-2 text-xs font-semibold text-amber-900 dark:bg-amber-900 dark:text-amber-100"
            >
                腳本執行中，請稍候（按鈕暫時鎖定）…
            </div>

            <div
                v-if="v6Message"
                class="mb-3 rounded-md bg-white p-2 font-mono text-xs whitespace-pre-wrap text-amber-900 dark:bg-gray-900 dark:text-amber-200"
                :class="
                    v6Pass === false
                        ? 'border border-red-400'
                        : v6Pass
                          ? 'border border-green-500'
                          : ''
                "
            >
                {{ v6Message }}
            </div>

            <div class="rounded-md bg-white p-3 dark:bg-gray-900">
                <div class="mb-2 flex items-center justify-between">
                    <h4 class="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        驗收勾選（通過後勾；一鍵腳本會自動勾）
                    </h4>
                    <button
                        type="button"
                        class="text-xs text-gray-500 underline hover:text-gray-800 dark:hover:text-gray-200"
                        @click="resetV6Checklist"
                    >
                        重置勾選
                    </button>
                </div>
                <ul class="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                    <li
                        v-for="item in v6ChecklistItems"
                        :key="item.id"
                        class="flex items-start gap-2"
                    >
                        <input
                            :id="`v6-${item.id}`"
                            v-model="v6Checklist[item.id]"
                            type="checkbox"
                            class="mt-0.5"
                        />
                        <label :for="`v6-${item.id}`" class="cursor-pointer leading-snug">
                            <span class="font-semibold">{{ item.id }}</span>
                            — {{ item.label }}
                            <span
                                v-if="item.id === 'M7'"
                                class="ml-1 text-amber-700 dark:text-amber-300"
                            >
                                （需
                                <RouterLink class="underline" to="/">主編輯畫布</RouterLink>
                                目視跟手；此頁無法代替，驗後可手動勾選）
                            </span>
                        </label>
                    </li>
                </ul>
            </div>
        </div>

        <!-- 控制面板：與上方 V6 共用 historyStore -->
        <div
            class="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
            <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
                歷史控制（與上方 V6 驗收<strong>同一</strong> Undo／Redo 堆疊）
            </p>
            <div class="flex items-center justify-between">
                <div class="flex space-x-3">
                    <button
                        @click="undo"
                        :disabled="!historyStore.canUndo"
                        :title="historyStore.canUndo ? '還原上一筆' : '目前沒有可 Undo 的紀錄'"
                        class="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        ⏮️ Undo
                    </button>
                    <button
                        @click="redo"
                        :disabled="!historyStore.canRedo"
                        :title="historyStore.canRedo ? '重做' : '目前沒有可 Redo 的紀錄'"
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
                    <h3 class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                        Undo Stack（{{ historyStore.undoStack.length }}）
                    </h3>
                    <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
                        V6 一鍵腳本與手動模擬拖曳寫入的紀錄也在這裡
                    </p>
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
                            ↔️ 測試：移動所有設備（M6／moveDevices）
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
import { computed, ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { RouterLink } from 'vue-router';
import { useEditorStore } from '@/store/editorStore';
import { useHistoryStore } from '@/store/historyStore';
import type { DevicePositionSnapshot } from '@/types/editor';

/** 藍圖 store：本頁所有測試操作（擺放 / 移動 / 刪除）皆透過此 store 觸發 */
const editorStore = useEditorStore();
/** 歷史紀錄 store：本頁展示其 undo / redo 堆疊內容 */
const historyStore = useHistoryStore();
/** 快速測試場景執行進度提示文字 */
const scenarioMessage = ref('');

/** V6 區塊忙碌中（一鍵腳本執行時禁用按鈕） */
const v6Busy = ref(false);
/** V6 結果訊息 */
const v6Message = ref('');
/** V6 最近一次腳本是否全部通過（null = 僅手動操作） */
const v6Pass = ref<boolean | null>(null);

/** 目前畫布設備數（供 V6 按鈕啟用條件） */
const nodeCount = computed(() => editorStore.nodes.length);

/**
 * 手動模擬按鈕缺設備時的提示（一鍵 M1→M4／M5 不需預先擺放）。
 * @param need 至少需要的設備數
 */
function v6NeedNodesHint(need: number): string {
    if (v6Busy.value) return '腳本執行中';
    if (nodeCount.value >= need) return '';
    if (need <= 1) {
        return '需先有設備：請按右側「➕ 擺放設備」，或改用「一鍵 M1→M4（推薦）」';
    }
    return `需至少 ${need} 台設備（目前 ${nodeCount.value}）：請再擺放，或改用「一鍵 M1→M4（推薦）」`;
}

/** 常駐顯示的按鈕狀態說明（有禁用原因時） */
const v6ButtonHint = computed(() => {
    if (v6Busy.value) return '';
    if (nodeCount.value === 0) {
        return '提示：模擬拖曳／零位移／M6 目前無法點——畫布是空的。請用「一鍵 M1→M4（推薦）」或右側「➕ 擺放設備」。';
    }
    if (nodeCount.value < 2) {
        return '提示：「模擬拖曳（多）」需要 ≥2 台。可再擺一台，或只用一鍵腳本／單機模擬。';
    }
    return '';
});

type V6CheckId = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7';

const v6ChecklistItems: { id: V6CheckId; label: string }[] = [
    { id: 'M1', label: '模擬拖曳（單）後，下方 Undo 回到拖曳前座標' },
    { id: 'M2', label: '接 M1 後，下方 Redo 回到拖曳後座標' },
    { id: 'M3', label: '模擬拖曳（多）後，一次 Undo 兩台都還原' },
    { id: 'M4', label: '模擬零位移後，Depth 不變（不寫入歷史）' },
    { id: 'M5', label: '一鍵 M5：拖曳／旋轉／刪除交錯 Undo 合理' },
    { id: 'M6', label: '一鍵 M6 或「移動所有設備」後 Undo 正常' },
    { id: 'M7', label: '主畫布真拖曳跟手（無抖動／跳回）' },
];

/** M1–M6 勾選狀態（持久化）；M7 僅展示不可勾選通過 */
const v6Checklist = useLocalStorage<Record<V6CheckId, boolean>>('aaaaa-v6-d2-checklist', {
    M1: false,
    M2: false,
    M3: false,
    M4: false,
    M5: false,
    M6: false,
    M7: false,
});

/**
 * 短延遲，讓一鍵腳本 UI 可讀。
 * @param ms 毫秒
 */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 讀取指定 uid 的目前座標快照。
 * @param uids 設備 uid
 */
function snapshotPositions(uids: string[]): DevicePositionSnapshot {
    const snap: DevicePositionSnapshot = {};
    for (const uid of uids) {
        const node = editorStore.nodes.find((n) => n.id === uid);
        if (node) snap[uid] = { x: node.position.x, y: node.position.y };
    }
    return snap;
}

/**
 * 模擬 Vue Flow v-model：不經歷史直接改寫 position。
 * @param uids 要移動的 uid
 * @param delta 位移
 * @returns 改寫前的 before 快照
 */
function applyDragPositions(
    uids: string[],
    delta: { x: number; y: number },
): DevicePositionSnapshot {
    const before = snapshotPositions(uids);
    const uidSet = new Set(uids);
    editorStore.nodes = editorStore.nodes.map((n) =>
        uidSet.has(n.id)
            ? {
                  ...n,
                  position: {
                      x: n.position.x + delta.x,
                      y: n.position.y + delta.y,
                  },
              }
            : n,
    );
    return before;
}

/**
 * 格式化單一節點座標供訊息顯示。
 * @param uid 節點 id
 */
function fmtPos(uid: string): string {
    const n = editorStore.nodes.find((x) => x.id === uid);
    if (!n) return '(missing)';
    return `(${n.position.x}, ${n.position.y})`;
}

/**
 * 模擬單機拖曳結束：改座標 + commitDeviceMove。
 */
function simulateDragCommitSingle(): void {
    const node = editorStore.nodes[0];
    if (!node) {
        v6Message.value = '無法執行：畫布無設備。請用「一鍵 M1→M4（推薦）」或右側「➕ 擺放設備」。';
        v6Pass.value = false;
        return;
    }
    const before = applyDragPositions([node.id], { x: 50, y: 0 });
    const afterExpected = { x: before[node.id].x + 50, y: before[node.id].y };
    const depthBefore = historyStore.undoDepth;
    editorStore.commitDeviceMove([node.id], before);
    const afterActual = editorStore.nodes.find((n) => n.id === node.id)!.position;
    const noDouble =
        Math.abs(afterActual.x - afterExpected.x) < 1e-6 &&
        Math.abs(afterActual.y - afterExpected.y) < 1e-6;
    const entered = historyStore.undoDepth === depthBefore + 1;
    v6Pass.value = noDouble && entered;
    v6Message.value = [
        `模擬拖曳（單）uid=${node.id.slice(0, 8)}`,
        `before=${JSON.stringify(before[node.id])} → now=${fmtPos(node.id)}`,
        `undoDepth ${depthBefore} → ${historyStore.undoDepth}`,
        noDouble ? '✓ 無雙重位移' : '✗ 座標不符（疑似雙重位移）',
        entered ? '✓ 已進歷史' : '✗ 未進歷史',
    ].join('\n');
}

/**
 * 模擬多機同一筆 commitDeviceMove。
 */
function simulateDragCommitMulti(): void {
    const uids = editorStore.nodes.map((n) => n.id);
    if (uids.length < 2) {
        v6Message.value =
            '無法執行：需要至少 2 台設備。請再擺放一台，或改用「一鍵 M1→M4（推薦）」。';
        v6Pass.value = false;
        return;
    }
    const before = applyDragPositions(uids, { x: 40, y: 10 });
    const depthBefore = historyStore.undoDepth;
    editorStore.commitDeviceMove(uids, before);
    const entered = historyStore.undoDepth === depthBefore + 1;
    v6Pass.value = entered;
    v6Message.value = [
        `模擬拖曳（多）${uids.length} 台；應為單一歷史項目`,
        `undoDepth ${depthBefore} → ${historyStore.undoDepth}`,
        entered ? '✓ 一筆進歷史' : '✗ 歷史深度異常',
        '請按 Undo：全部應一次還原',
    ].join('\n');
}

/**
 * 零位移 commit：undoDepth 應不變。
 */
function simulateZeroDisplacement(): void {
    const node = editorStore.nodes[0];
    if (!node) {
        v6Message.value = '無法執行：畫布無設備。請用「一鍵 M1→M4（推薦）」或右側「➕ 擺放設備」。';
        v6Pass.value = false;
        return;
    }
    const before = snapshotPositions([node.id]);
    const depthBefore = historyStore.undoDepth;
    editorStore.commitDeviceMove([node.id], before);
    const ok = historyStore.undoDepth === depthBefore;
    v6Pass.value = ok;
    v6Message.value = [
        `零位移 commit uid=${node.id.slice(0, 8)} @${fmtPos(node.id)}`,
        `undoDepth ${depthBefore} → ${historyStore.undoDepth}`,
        ok ? '✓ 未進歷史（M4 通過）' : '✗ 不應增加歷史',
    ].join('\n');
    if (ok) v6Checklist.value.M4 = true;
}

/**
 * 一鍵跑 M1→M4：自動斷言並勾選通過項。
 */
async function runV6ScriptM1toM4(): Promise<void> {
    v6Busy.value = true;
    v6Pass.value = null;
    const lines: string[] = [];
    let allOk = true;

    try {
        // 清空干擾：至少保證有節點
        while (editorStore.nodes.length > 0) {
            editorStore.removeDevices(editorStore.nodes.map((n) => n.id));
        }
        historyStore.clear();
        await delay(80);

        // M1
        v6Message.value = 'M1：擺放 → 模擬拖曳 → Undo...';
        testPlaceDevice();
        await delay(120);
        const uid = editorStore.nodes[0]!.id;
        const before1 = applyDragPositions([uid], { x: 50, y: 0 });
        const after1 = { x: before1[uid].x + 50, y: before1[uid].y };
        editorStore.commitDeviceMove([uid], before1);
        const posAfterCommit = { ...editorStore.nodes.find((n) => n.id === uid)!.position };
        const m1NoDouble =
            Math.abs(posAfterCommit.x - after1.x) < 1e-6 &&
            Math.abs(posAfterCommit.y - after1.y) < 1e-6;
        historyStore.undo();
        const posAfterUndo = editorStore.nodes.find((n) => n.id === uid)!.position;
        const m1Ok =
            m1NoDouble &&
            Math.abs(posAfterUndo.x - before1[uid].x) < 1e-6 &&
            Math.abs(posAfterUndo.y - before1[uid].y) < 1e-6;
        lines.push(m1Ok ? '✓ M1 Undo 還原' : '✗ M1 失敗');
        v6Checklist.value.M1 = m1Ok;
        allOk &&= m1Ok;
        await delay(120);

        // M2
        v6Message.value = 'M2：Redo...';
        historyStore.redo();
        const posAfterRedo = editorStore.nodes.find((n) => n.id === uid)!.position;
        const m2Ok =
            Math.abs(posAfterRedo.x - after1.x) < 1e-6 &&
            Math.abs(posAfterRedo.y - after1.y) < 1e-6;
        lines.push(m2Ok ? '✓ M2 Redo' : '✗ M2 失敗');
        v6Checklist.value.M2 = m2Ok;
        allOk &&= m2Ok;
        await delay(120);

        // M3
        v6Message.value = 'M3：多機一次 Undo...';
        testPlaceDevice();
        await delay(80);
        const uids = editorStore.nodes.map((n) => n.id);
        const before3 = applyDragPositions(uids, { x: 30, y: 20 });
        editorStore.commitDeviceMove(uids, before3);
        historyStore.undo();
        const m3Ok = uids.every((id) => {
            const n = editorStore.nodes.find((x) => x.id === id)!;
            return (
                Math.abs(n.position.x - before3[id].x) < 1e-6 &&
                Math.abs(n.position.y - before3[id].y) < 1e-6
            );
        });
        lines.push(m3Ok ? '✓ M3 多機一次還原' : '✗ M3 失敗');
        v6Checklist.value.M3 = m3Ok;
        allOk &&= m3Ok;
        await delay(120);

        // M4
        v6Message.value = 'M4：零位移...';
        const depthBefore = historyStore.undoDepth;
        const first = editorStore.nodes[0]!;
        editorStore.commitDeviceMove([first.id], snapshotPositions([first.id]));
        const m4Ok = historyStore.undoDepth === depthBefore;
        lines.push(m4Ok ? '✓ M4 零位移不進歷史' : '✗ M4 失敗');
        v6Checklist.value.M4 = m4Ok;
        allOk &&= m4Ok;

        v6Pass.value = allOk;
        v6Message.value = ['一鍵 M1→M4 完成', ...lines, allOk ? '全部通過' : '有失敗項'].join('\n');
    } finally {
        v6Busy.value = false;
    }
}

/**
 * M5：移動 → 旋轉 → 刪除，交錯 Undo 後座標堆疊合理。
 */
async function runV6ScriptM5(): Promise<void> {
    v6Busy.value = true;
    try {
        while (editorStore.nodes.length > 0) {
            editorStore.removeDevices(editorStore.nodes.map((n) => n.id));
        }
        historyStore.clear();
        await delay(60);

        testPlaceDevice();
        await delay(80);
        const uid = editorStore.nodes[0]!.id;
        const origin = snapshotPositions([uid])[uid];

        const before = applyDragPositions([uid], { x: 60, y: 0 });
        editorStore.commitDeviceMove([uid], before);
        const moved = { ...editorStore.nodes.find((n) => n.id === uid)!.position };

        editorStore.rotateDevice(uid, 1);
        await delay(60);

        // 再擺一台後刪除移動過的那台，留下堆疊
        testPlaceDevice();
        await delay(60);
        const otherId = editorStore.nodes.find((n) => n.id !== uid)!.id;
        editorStore.removeDevices([otherId]);

        // Undo 刪除 → Undo 旋轉 → Undo 移動
        historyStore.undo(); // 還原 other
        historyStore.undo(); // 還原 rotation
        const afterUndoRotate = editorStore.nodes.find((n) => n.id === uid);
        const stillMoved =
            afterUndoRotate &&
            Math.abs(afterUndoRotate.position.x - moved.x) < 1e-6 &&
            Math.abs(afterUndoRotate.position.y - moved.y) < 1e-6;

        historyStore.undo(); // 還原移動
        const afterUndoMove = editorStore.nodes.find((n) => n.id === uid);
        const backToOrigin =
            afterUndoMove &&
            Math.abs(afterUndoMove.position.x - origin.x) < 1e-6 &&
            Math.abs(afterUndoMove.position.y - origin.y) < 1e-6;

        const ok = Boolean(stillMoved && backToOrigin);
        v6Pass.value = ok;
        v6Checklist.value.M5 = ok;
        v6Message.value = [
            'M5 交錯 Undo',
            stillMoved ? '✓ Undo 刪除／旋轉後仍在移動後座標' : '✗ 旋轉／刪除 undo 後座標錯亂',
            backToOrigin ? '✓ 再 Undo 移動回到原點' : '✗ 移動 undo 未回原點',
        ].join('\n');
    } finally {
        v6Busy.value = false;
    }
}

/**
 * M6：既有 moveDevices 路徑。
 */
async function runV6ScriptM6(): Promise<void> {
    v6Busy.value = true;
    try {
        if (editorStore.nodes.length === 0) testPlaceDevice();
        await delay(60);
        const uid = editorStore.nodes[0]!.id;
        const before = snapshotPositions([uid])[uid];
        testMoveDevices();
        const mid = editorStore.nodes.find((n) => n.id === uid)!.position;
        const movedOk = Math.abs(mid.x - (before.x + 50)) < 1e-6;
        historyStore.undo();
        const after = editorStore.nodes.find((n) => n.id === uid)!.position;
        const undoOk = Math.abs(after.x - before.x) < 1e-6 && Math.abs(after.y - before.y) < 1e-6;
        const ok = movedOk && undoOk;
        v6Pass.value = ok;
        v6Checklist.value.M6 = ok;
        v6Message.value = [
            'M6 moveDevices',
            movedOk ? '✓ X+50' : '✗ 位移不符',
            undoOk ? '✓ Undo 還原' : '✗ Undo 失敗',
        ].join('\n');
    } finally {
        v6Busy.value = false;
    }
}

/**
 * 重置 checklist 勾選（含 localStorage）。
 */
function resetV6Checklist(): void {
    v6Checklist.value = {
        M1: false,
        M2: false,
        M3: false,
        M4: false,
        M5: false,
        M6: false,
        M7: false,
    };
}

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
