# FlowEngine 使用指南 — L2/L3 開發者手冊

**版本：** V7  
**建立日期：** 2026-06-06  
**最後更新：** 2026-08-01  
**負責人：** aaaaa (CR-04)  
**適用對象：** L2 容器層（harry, toby）、L3 元件層（avery, goodmorning, MBD）

---

## 目錄

1. [FlowEngine 概述](#flowengine-概述)
2. [觸發時機與監聽策略](#觸發時機與監聽策略)
3. [計算流程詳解](#計算流程詳解)
4. [效率顏色規則](#效率顏色規則)
5. [在 L3 中使用 flowStore](#在-l3-中使用-flowstore)
6. [驗證情境速查](#驗證情境速查)
7. [常見問題 FAQ](#常見問題-faq)
8. [V7：machineMode 與媒質](#v7machinemode-與媒質)

---

## FlowEngine 概述

### 什麼是 FlowEngine

**FlowEngine** 是「明日方舟：終末地 集成工業模擬器」的**核心計算引擎**，負責：

- 🔄 計算每條管線的流量（個/min）與堵塞狀態
- ⚡ 計算每台設備的效率（0~1）
- 📊 統計每個品項的產量 / 消耗 / 淨值
- ⚠️ 偵測環路、堵塞、非合法鏈路
- 🔌 計算電力需求與供應平衡

### 輸入與輸出

```
輸入（從 editorStore 讀取）
  ├─ nodes: FactoryNode[]        設備列表
  ├─ edges: FactoryEdge[]        管線連接
  └─ validationStore.alerts      驗證警示（過濾掉有 Error 的設備）

↓ FlowEngine 計算 ↓

輸出（寫入 flowStore）
  ├─ edgeFlows: Map<uid, EdgeFlow>          管線流量
  ├─ nodeEfficiencies: Map<uid, number>     設備效率
  ├─ itemSummary: ItemSummary[]             品項統計
  ├─ congestedEdges: Set<uid>               堵塞管線
  ├─ invalidChainUids: Set<uid>             非合法鏈路設備
  ├─ sinkDeliveries: Map<itemId, rate>     物品輸入口交付量
  ├─ totalPowerDemand: number               總耗電量（kW）
  └─ totalPowerSupply: number               總供電量（kW）
```

### 核心原則

1. **自動觸發** — L2/L3 無需手動呼叫，editorStore 變動後自動執行
2. **唯讀消費** — L2/L3 只從 `flowStore` 讀取結果，不修改
3. **防抖動** — 150ms debounce，避免連續操作時重複計算
4. **過濾錯誤** — 有 CR-03 Error 的設備不參與計算

---

## 觸發時機與監聽策略

### Watch 目標

FlowEngine 使用 `watch` 監聽以下狀態變化：

```typescript
watch(
  [
    () => editorStore.nodes,       // 設備擺放、移動、刪除、配方變更
    () => editorStore.edges,       // 管線連接、刪除
    () => validationStore.alerts,  // 驗證警示更新（Error 設備過濾）
  ],
  useDebounceFn(runFlowEngine, 150),  // 150ms 防抖動
  { deep: true, immediate: true }
);
```

### 觸發條件

以下操作會觸發 FlowEngine 重新計算：

| 操作 | 觸發對象 | Debounce |
|------|---------|----------|
| `editorStore.placeDevice()` | nodes | ✅ 150ms |
| `editorStore.moveDevices()` | nodes | ✅ 150ms |
| `editorStore.removeDevices()` | nodes + edges | ✅ 150ms |
| `editorStore.setRecipe()` | nodes（deep） | ✅ 150ms |
| `editorStore.addConnection()` | edges | ✅ 150ms |
| `editorStore.removeConnection()` | edges | ✅ 150ms |
| `validationStore.run()` | alerts | ✅ 150ms |

### 防抖動機制

```typescript
// 使用者快速擺放 5 台設備
editorStore.placeDevice(device1)  // t=0ms
editorStore.placeDevice(device2)  // t=50ms
editorStore.placeDevice(device3)  // t=100ms
editorStore.placeDevice(device4)  // t=150ms
editorStore.placeDevice(device5)  // t=200ms

// FlowEngine 只在 t=350ms 時執行一次（最後操作 + 150ms）
```

### 初始化順序

在 `MainLayout.vue` 的 `setup` 中：

```typescript
import { useValidation } from '@/composables/useValidation'
import { useFlowEngine } from '@/composables/useFlowEngine'

// ⚠️ 順序很重要：validation 必須先於 FlowEngine
useValidation()   // 先啟動驗證監聽
useFlowEngine()   // 再啟動流量計算
```

**原因：** FlowEngine 依賴 `validationStore.hasBlockingError()` 過濾掉有錯誤的設備。

---

## 計算流程詳解

### 流程圖

```
runFlowEngine()
  │
  ├─ 1. buildGraph(nodes, edges, hasBlockingError)
  │      過濾有 CR-03 Error 的設備與管線
  │      建立 FlowGraph：nodes Map + edges Map + adjacency list
  │
  ├─ 2. validateChains(graph)
  │      反向 BFS，標記「非合法鏈路」（無 sink 下游的設備）
  │      → graph.invalidSubgraphUids
  │
  ├─ 3. topologicalSort(graph)
  │      Kahn's Algorithm，偵測環路
  │      環路內的設備標記為 invalid，不參與計算
  │      → sortedNodes: string[]（拓撲順序）
  │
  ├─ 4. propagateFlows(sortedNodes, graph)
  │      依拓撲順序正向傳播，計算流量與效率
  │      ┌─ source node: 直接輸出 recipe.output_rate_per_min
  │      ├─ normal device: efficiency = min(supplied_i / required_i)
  │      │                 output = recipe_rate × efficiency
  │      ├─ splitter: input ÷ output_count（或使用者設定比例）
  │      └─ merger: Σ inputs
  │      → edgeFlows: Map<uid, EdgeFlow>
  │
  ├─ 5. detectCongestion(graph, edgeFlows)
  │      多遍反向傳播，偵測堵塞並修正上游速率
  │      若下游滿載，標記 EdgeFlow.isCongested = true
  │      → congestedEdges: Set<uid>
  │
  ├─ 6. calcItemSummary(graph)
  │      彙整所有設備的輸入/輸出，按品項統計
  │      produced = 所有 source / 設備輸出加總
  │      consumed = 所有 sink / 設備輸入加總
  │      net = produced − consumed
  │      → itemSummary: ItemSummary[]
  │
  ├─ 7. sinkDeliveries（交付量統計）
  │      統計所有物品輸入口（sink）的實際接收量
  │      → sinkDeliveries: Map<itemId, rate>
  │
  └─ 8. applyResult(result)
         一次性批次寫入 flowStore（避免多次響應式更新）
```

### 關鍵步驟說明

#### 1. buildGraph — 建立有向圖

```typescript
function buildGraph(
  nodes: FactoryNode[],
  edges: FactoryEdge[],
  hasBlockingError: (uid: string) => boolean
): FlowGraph
```

- 過濾有 `validationStore.hasBlockingError(uid) === true` 的設備與管線
- 將節點 `data.machineMode` 寫入 `FlowNode`（缺省則於配方解析時用 `modes[0]`）
- 建立有向圖結構：
  - `nodes: Map<uid, FlowNode>`
  - `edges: Map<uid, EdgeMeta>`
  - `adjacencyList: Map<uid, string[]>` （uid → 下游設備 uid[]）

#### 2. validateChains — 反向 BFS 鏈路驗證

```typescript
function validateChains(graph: FlowGraph): void
```

- 從所有 `isSink = true` 的節點開始**反向** BFS
- 能追溯到的節點標記為 `isValid = true`
- 無法追溯到的節點（孤立 / 無 sink 下游）標記為 `isValid = false`
- 結果儲存於 `graph.invalidSubgraphUids`
- **V7**：當邊的 source／target handle 齊全時，比對兩端 `PortMedia`（`belt`｜`pipe`）；belt↔pipe 錯接則兩端視為非法

**範例：**
```
礦機 → 熔爐 → （無連線）    // 熔爐無 sink 下游 → invalid
礦機 → 熔爐 → sink         // 正常鏈路 → valid
belt 口 → pipe 口          // V7 媒質錯接 → invalid
```

#### 3. topologicalSort — 拓撲排序與環路偵測

```typescript
function topologicalSort(graph: FlowGraph): string[]
```

- 使用 **Kahn's Algorithm**（入度計數法）
- 偵測環路：若排序完成後仍有節點未處理 → 環路存在
- 環路內的節點標記為 `isValid = false`，不參與流量計算

**範例：**
```
A → B → C → A    // 環路，三個節點都標記 invalid
D → E → sink     // 正常鏈路，正常計算
```

#### 4. propagateFlows — 正向傳播

```typescript
function propagateFlows(sortedNodes: string[], graph: FlowGraph): Map<string, EdgeFlow>
```

- 依拓撲順序遍歷節點（source → sink）
- 計算每台設備的效率與輸出：

**效率計算公式：**
```typescript
efficiency = min(
  inputRates[itemA] / requiredRates[itemA],
  inputRates[itemB] / requiredRates[itemB],
  ...
)
// 效率由最缺乏的輸入品項決定（瓶頸）
```

**輸出計算公式：**
```typescript
outputRates[itemX] = recipeOutputRates[itemX] × efficiency
```

**特殊節點：**
- **Source node（物品輸出口）**：直接輸出 `recipe.output_rate_per_min`，無上游依賴
- **Sink node（物品輸入口）**：只有輸入，無輸出
- **Splitter（分流器）**：`output = input ÷ output_count`（Phase 1 均分）
- **Merger（匯流器）**：`output = Σ inputs`

#### 5. detectCongestion — 堵塞偵測

```typescript
function detectCongestion(graph: FlowGraph, edgeFlows: Map<string, EdgeFlow>): void
```

- 多遍**反向傳播**（sink → source）
- 若下游設備滿載（輸入 ≥ 需求），上游管線標記 `isCongested = true`
- 修正上游設備的輸出速率（避免過度生產）

**範例：**
```
礦機(100/min) → 熔爐(需求 50/min)
                 ↓
              熔爐滿載 → 管線堵塞（isCongested = true）
                 ↓
              礦機降速至 50/min
```

#### 6. calcItemSummary — 品項統計

```typescript
function calcItemSummary(graph: FlowGraph): ItemSummary[]
```

- 彙整所有設備的輸入/輸出，按品項分組：
  - `produced` = 所有 source + 設備輸出的該品項加總
  - `consumed` = 所有 sink + 設備輸入的該品項加總
  - `net` = produced − consumed
  - `efficiency` = 所有使用該品項設備的平均效率

**輸出範例：**
```typescript
[
  {
    itemId: 'copper_ore',
    name: '赤銅礦',
    produced: 120,     // 個/min
    consumed: 100,     // 個/min
    net: 20,           // 盈餘
    efficiency: 0.95
  }
]
```

---

## 效率顏色規則

### Tailwind CSS Class 對照表

FlowEngine 計算的設備效率（0~1）對應以下 Tailwind class：

| 效率範圍 | Tailwind Class | 顏色 | 說明 |
|----------|---------------|------|------|
| **100%** | `text-green-500` | 🟢 綠色 | 供料足夠，滿速運轉 |
| **50% ~ 99%** | `text-yellow-400` | 🟡 黃色 | 上游輕微瓶頸 |
| **1% ~ 49%** | `text-orange-400` | 🟠 橘色 | 上游大幅瓶頸 |
| **0%** | `text-gray-400` | ⚪ 灰色 | 無輸入或非合法鏈路 |

### 顏色判斷函式

```typescript
function getEfficiencyClass(efficiency: number): string {
  if (efficiency >= 1) return 'text-green-500'      // 100%
  if (efficiency >= 0.5) return 'text-yellow-400'   // 50~99%
  if (efficiency > 0) return 'text-orange-400'      // 1~49%
  return 'text-gray-400'                            // 0%
}
```

### Vue 元件範例

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useFlowStore } from '@/store/flowStore'

const flowStore = useFlowStore()
const props = defineProps<{ deviceUid: string }>()

const efficiency = computed(() => 
  flowStore.nodeEfficiencies.get(props.deviceUid) ?? 0
)

const efficiencyClass = computed(() => {
  const eff = efficiency.value
  if (eff >= 1) return 'text-green-500'
  if (eff >= 0.5) return 'text-yellow-400'
  if (eff > 0) return 'text-orange-400'
  return 'text-gray-400'
})

const efficiencyText = computed(() => 
  `${(efficiency.value * 100).toFixed(1)}%`
)
</script>

<template>
  <div class="efficiency-badge" :class="efficiencyClass">
    {{ efficiencyText }}
  </div>
</template>

<style scoped>
.efficiency-badge {
  font-weight: 600;
  font-size: 14px;
}
</style>
```

---

## 在 L3 中使用 flowStore

### 1. 顯示管線流量 Overlay

在管線上顯示流量標示與堵塞狀態：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useFlowStore } from '@/store/flowStore'

const flowStore = useFlowStore()
const props = defineProps<{ connectionUid: string }>()

const edgeFlow = computed(() => 
  flowStore.edgeFlows.get(props.connectionUid)
)

const isCongested = computed(() => 
  flowStore.congestedEdges.has(props.connectionUid)
)

const isInvalid = computed(() =>
  !edgeFlow.value && flowStore.lastCalculatedAt > 0
)
</script>

<template>
  <div 
    v-if="edgeFlow" 
    class="edge-overlay"
    :class="{
      'bg-orange-500': isCongested,
      'bg-gray-500': isInvalid
    }"
  >
    <div class="item-name">{{ edgeFlow.itemId }}</div>
    <div class="flow-rate">
      {{ edgeFlow.rate.toFixed(1) }} / min
    </div>
    <div v-if="isCongested" class="congestion-badge">
      ⚠️ 堵塞
    </div>
  </div>
</template>

<style scoped>
.edge-overlay {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}

.congestion-badge {
  color: #fbbf24;
  font-weight: bold;
}
</style>
```

### 2. 顯示設備效率 Badge

在設備節點上顯示效率標記：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useFlowStore } from '@/store/flowStore'
import { useValidationStore } from '@/store/validationStore'

const flowStore = useFlowStore()
const validationStore = useValidationStore()
const props = defineProps<{ deviceUid: string }>()

const efficiency = computed(() => 
  flowStore.nodeEfficiencies.get(props.deviceUid) ?? 0
)

const hasError = computed(() =>
  validationStore.hasBlockingError(props.deviceUid)
)

const isInvalid = computed(() =>
  flowStore.invalidChainUids.has(props.deviceUid)
)

const badgeClass = computed(() => {
  if (hasError.value) return 'bg-red-500 text-white'
  if (isInvalid.value) return 'bg-gray-500 text-gray-300'
  
  const eff = efficiency.value
  if (eff >= 1) return 'bg-green-500 text-white'
  if (eff >= 0.5) return 'bg-yellow-400 text-gray-900'
  if (eff > 0) return 'bg-orange-400 text-white'
  return 'bg-gray-400 text-gray-900'
})

const badgeText = computed(() => {
  if (hasError.value) return 'ERROR'
  if (isInvalid.value) return 'INVALID'
  return `${(efficiency.value * 100).toFixed(0)}%`
})
</script>

<template>
  <div class="efficiency-badge" :class="badgeClass">
    {{ badgeText }}
  </div>
</template>

<style scoped>
.efficiency-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
```

### 3. 統計面板：品項摘要列表

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useFlowStore } from '@/store/flowStore'

const flowStore = useFlowStore()

const sortedItems = computed(() => 
  [...flowStore.itemSummary].sort((a, b) => b.net - a.net)
)

function getNetClass(net: number): string {
  if (net > 0) return 'text-green-500'
  if (net < 0) return 'text-red-500'
  return 'text-gray-500'
}
</script>

<template>
  <div class="stats-panel">
    <h3>品項統計</h3>
    <div class="item-list">
      <div 
        v-for="item in sortedItems" 
        :key="item.itemId"
        class="item-row"
      >
        <span class="item-name">{{ item.name }}</span>
        <div class="item-stats">
          <span class="produced">產 {{ item.produced.toFixed(1) }}</span>
          <span class="consumed">耗 {{ item.consumed.toFixed(1) }}</span>
          <span class="net" :class="getNetClass(item.net)">
            {{ item.net > 0 ? '+' : '' }}{{ item.net.toFixed(1) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  padding: 16px;
  background: var(--ui-bg);
}

.item-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--ui-border);
}

.item-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.net {
  font-weight: 600;
}
</style>
```

### 4. 電力統計顯示

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useFlowStore } from '@/store/flowStore'

const flowStore = useFlowStore()

const powerStatus = computed(() => {
  const balance = flowStore.powerBalance
  if (balance >= 0) {
    return {
      text: `✅ 電力盈餘 ${balance.toFixed(1)} kW`,
      class: 'text-green-500'
    }
  } else {
    return {
      text: `⚠️ 電力不足 ${Math.abs(balance).toFixed(1)} kW`,
      class: 'text-red-500'
    }
  }
})
</script>

<template>
  <div class="power-stats">
    <div class="stat-row">
      <span>總耗電</span>
      <span>{{ flowStore.totalPowerDemand.toFixed(1) }} kW</span>
    </div>
    <div class="stat-row">
      <span>總供電</span>
      <span>{{ flowStore.totalPowerSupply.toFixed(1) }} kW</span>
    </div>
    <div class="stat-row" :class="powerStatus.class">
      <span>{{ powerStatus.text }}</span>
    </div>
  </div>
</template>
```

---

## 驗證情境速查

以下是常見的測試情境與預期結果（對應 `/dev/flow-engine` 測試頁的 H1–H6 preset）：

### H1：單條完整鏈路（100% 效率）

**設備配置：**
```
礦機(赤銅礦, 60/min) → 熔爐(配方:赤銅塊, 需求 60/min) → sink
```

**預期結果：**
- 礦機效率：100% 🟢
- 熔爐效率：100% 🟢
- 管線流量：60/min 赤銅礦
- 品項統計：赤銅塊 produced = 30/min, consumed = 30/min, net = 0

---

### H2：上游瓶頸（50% 效率）

**設備配置：**
```
礦機(30/min) → 熔爐(需求 60/min) → sink
```

**預期結果：**
- 礦機效率：100% 🟢
- 熔爐效率：50% 🟡（上游只供應一半）
- 管線流量：30/min
- 熔爐輸出：15/min（原本 30/min × 50%）

---

### H3：多輸入瓶頸

**設備配置：**
```
礦機A(赤銅礦, 30/min) ┐
                        ├→ 反應池(需求 A:60, B:60) → sink
礦機B(藍鐵礦, 60/min) ┘
```

**預期結果：**
- 反應池效率：50% 🟡（赤銅礦是瓶頸，只有 30/60）
- 反應池輸出：原配方輸出 × 50%

---

### H4：設備有 CR-03 Error

**設備配置：**
```
礦機 → 熔爐(有 E001 重疊錯誤) → sink
```

**預期結果：**
- 熔爐**不參與計算**（被 buildGraph 過濾）
- 礦機標記為 `invalidChainUids`（無有效下游）
- 礦機效率：0% ⚪

---

### H5：環路

**設備配置：**
```
A → B → C → A    (環路)
D → sink         (正常鏈路)
```

**預期結果：**
- A、B、C 標記為 `invalidChainUids`
- A、B、C 效率：0% ⚪
- D 正常計算

---

### H6：下游堵塞

**設備配置：**
```
礦機(100/min) → 熔爐(需求 50/min) → sink
```

**預期結果：**
- 管線標記 `isCongested = true` ⚠️
- 礦機降速至 50/min（匹配下游需求）
- 熔爐效率：100% 🟢（需求被滿足）

---

## 常見問題 FAQ

### Q1：如何手動觸發 FlowEngine？

**A：** FlowEngine 由 `watch` 自動觸發，L2/L3 不應手動呼叫。若需強制重新計算，修改 `editorStore` 任一狀態即可。

**測試用途：**
```typescript
import { useFlowEngine } from '@/composables/useFlowEngine'

const { runFlowEngine } = useFlowEngine()
runFlowEngine()  // 僅限 dev 測試頁使用
```

---

### Q2：為何設備效率顯示 0%？

可能原因：

1. **無上游輸入** — 設備沒有連接管線
2. **上游有 Error** — 上游設備被 CR-03 detector 標記錯誤
3. **非合法鏈路** — 設備無 sink 下游（`invalidChainUids`）
4. **環路** — 設備在環路內，被 topologicalSort 標記 invalid

**排查步驟：**
```typescript
const flowStore = useFlowStore()
const validationStore = useValidationStore()

// 1. 檢查是否在非合法鏈路
if (flowStore.invalidChainUids.has(deviceUid)) {
  console.log('設備無有效下游（sink）')
}

// 2. 檢查是否有 Error
if (validationStore.hasBlockingError(deviceUid)) {
  console.log('設備有驗證錯誤')
}

// 3. 檢查上游是否有輸入
const device = graph.nodes.get(deviceUid)
if (device.inputRates.size === 0) {
  console.log('設備無上游輸入')
}
```

---

### Q3：管線顯示「堵塞」是什麼意思？

**A：** 下游設備已滿載（輸入 ≥ 需求），無法接收更多品項。FlowEngine 會：

1. 標記管線 `EdgeFlow.isCongested = true`
2. 反向修正上游設備輸出速率
3. 在 UI 上顯示橘色堵塞標記 ⚠️

**解決方式：**
- 增加下游設備數量（分流）
- 升級下游設備配方（提高處理速度）
- 移除部分上游設備

---

### Q4：如何取得某個品項的總產量？

```typescript
const flowStore = useFlowStore()

const copperSummary = flowStore.itemSummary.find(
  item => item.itemId === 'copper_ore'
)

if (copperSummary) {
  console.log(`赤銅礦產量：${copperSummary.produced} 個/min`)
  console.log(`淨值：${copperSummary.net} 個/min`)
}
```

---

### Q5：如何判斷整個產線是否有電力不足？

```typescript
const flowStore = useFlowStore()

if (flowStore.hasPowerShortage) {
  console.log(`⚠️ 電力不足 ${Math.abs(flowStore.powerBalance)} kW`)
} else {
  console.log(`✅ 電力盈餘 ${flowStore.powerBalance} kW`)
}
```

---

### Q6：FlowEngine 會影響效能嗎？

**A：** FlowEngine 針對效能已優化：

- ✅ **150ms debounce** — 避免連續操作時重複計算
- ✅ **過濾錯誤節點** — 有 Error 的設備不參與計算
- ✅ **單次批次寫入** — `applyResult()` 一次性更新 flowStore
- ✅ **拓撲排序快取** — 環路偵測結果快取

**實測數據（V4）：**
- 50 台設備 + 100 條管線：< 50ms
- 200 台設備 + 400 條管線：< 200ms

---

### Q7：如何在開發時測試 FlowEngine？

使用 `/dev/flow-engine` 測試頁：

1. 貼入 H1–H11 或 V7（G1–G3／L1）preset JSON
2. 點選「執行計算」
3. 檢視 edgeFlows / nodeEfficiencies / itemSummary

**測試頁路由：**
```
http://localhost:5173/dev/flow-engine
```

僅在 `import.meta.env.DEV` 時可訪問。

---

## V7：machineMode 與媒質

### machineMode

- 節點欄位：`FactoryNode.data.machineMode?: string`
- 缺省：該機器 `modes[0].id`（`resolveMachineMode`）
- 配方解析：`getRecipesForMachine(machineType, machineMode)[recipeIndex]`
- `recipeIndex` 是 **mode 過濾後**列表的索引，不是全機器配方表索引

### PortMedia（belt｜pipe）

- `PortDef.media`: `'belt'`（固體／傳送帶）或 `'pipe'`（液體／氣體／管線）
- `validateChains`：當邊的 source／target handle **皆有值**時比對兩端媒質；belt↔pipe → 非法
- handle 缺省（抽象測試邊）則**跳過**媒質合法性檢查；速率仍可依品項 `form` 套用上限
- 速率：`belt` → 30／min，`pipe` → 60／min（`PIPE_RATE_LIMIT`）

### loss

- `MachineMode.loss` 僅在資料／型別存在
- FlowEngine **不**把 loss 算進 `itemSummary`（刻意延後）

### 手動驗證

`/dev/flow-engine` → V7 群組：G1（氣態＋mode）、G2（錯誤 mode）、G3（belt↔pipe）、L1（loss 不進 summary）

### V8：埠基數／form／速率／H8（已實作）

定案與工項：[todolist_v8.md](./dev/todolist_v8.md)／[A1_scope_decision.md](./dev/dev_v8/A1_scope_decision.md)。

| 項 | 說明 |
|----|------|
| Dev | `/dev/flow-engine` 機器／產品分頁（JSON＋placeholder） |
| 埠 | 每埠最多一條邊；複數埠依 `modes[].ports`；無 handle 且該方向僅一埠時，多條抽象邊亦非法 |
| 速率 | `BELT_RATE_LIMIT=30`；`PIPE_RATE_LIMIT=60`（埠媒質優先，否則依品項 `form`，皆未知則 30） |
| H8 | 雙鏈→匯流器→Sink；滿速 belt 匯入後出口 30 → 反向堵塞（上游約 15／15） |
| form | `ItemForm`：`solid`→belt，`liquid`／`gas`→pipe；錯配 → `isItemFormMediaMismatch` 標非法 |
| 驗證 | **僅 FlowEngine**（CR-04 先行；CR-02 UI 拒絕後續） |
| 拓樸 | `DevTopologySvg`／graph-viz 依當前 mode ports；點節點可切 `machineMode` |

測試：`src/__tests__/flowEngine.v8.*.test.ts`、`itemForm.test.ts`。

---

## 進階主題

### 自訂堵塞偵測邏輯

若需擴展 `detectCongestion()` 邏輯（例如考慮緩衝池），在 `useFlowEngine.ts` 修改：

```typescript
function detectCongestion(graph: FlowGraph, edgeFlows: Map<string, EdgeFlow>): void {
  // 自訂邏輯
}
```

### 效率計算覆寫

若某台設備需要非線性效率計算（例如提純機），在 `Machine.calcEfficiency` 設定回調：

```typescript
const purifier: Machine = {
  id: 'purifier',
  name: '提純機',
  calcEfficiency: (inputs) => {
    // 自訂效率公式
    return customEfficiency
  },
  // ...
}
```

---

## 相關文件

- **L1 API Reference** — [docs/aaaaa/L1_API_REFERENCE.md](./L1_API_REFERENCE.md)
- **FlowEngine 原始碼** — [src/composables/useFlowEngine.ts](../../src/composables/useFlowEngine.ts)
- **FlowEngine 測試** — [src/__tests__/composables/useFlowEngine.test.ts](../../src/__tests__/composables/useFlowEngine.test.ts)
- **V7 mode／媒質測試** — [src/__tests__/flowEngine.v7.modeMedia.test.ts](../../src/__tests__/flowEngine.v7.modeMedia.test.ts)
- **V8 埠／速率／H8／form** — `src/__tests__/flowEngine.v8.*.test.ts`
- **開發測試頁** — `/dev/flow-engine`

---

**文件版本：** V8  
**最後更新：** 2026-08-02  
**維護者：** aaaaa (CR-04)  
**問題回報：** 見 `docs/aaaaa/dev/todolist_v8.md`
