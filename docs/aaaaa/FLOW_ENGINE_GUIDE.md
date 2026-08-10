# FlowEngine 使用指南 — L2/L3 開發者手冊

**版本：** V9  
**建立日期：** 2026-06-06  
**最後更新：** 2026-08-02  
**負責人：** aaaaa (CR-04)  
**適用對象：** L2 容器層（harry, toby）、L3 元件層（avery, goodmorning, MBD）

**相關：** [協作者使用／下一步](./CR04_FOR_COLLABORATORS.md)｜[資料格式](./DATA_FORMAT_GUIDE.md)｜[V6～V9 報告](./MILESTONE_0802_V6_V9_REPORT.md)

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
9. [Dev 頁面使用說明](#dev-頁面使用說明)（V8／V9 更新）

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
  │      過濾 CR-03 Error；帶入 machineMode／environment
  │      Source：primaryOutput × sourceRatePerMin（預設 30）
  │      一般機器：不預填 rates（V9-E1 待匹配）
  │
  ├─ 2. validateChains(graph)
  │      反向 BFS（無 Sink 下游 → 非法）
  │      埠基數／belt↔pipe／form↔媒質
  │      _resolveRecipesByInputs → matchRecipeByInputs
  │      有配方卻無匹配 → 非法（輸入不齊／種類不符）
  │
  ├─ 3. topologicalSort(graph)
  │      Kahn's Algorithm；環路 → invalid
  │
  ├─ 4. propagateFlows(sortedNodes, graph)
  │      ┌─ source: primaryOutput 速率
  │      ├─ normal: 依正流量品項再 matchRecipeByInputs
  │      │          efficiency = min(supplied/required)
  │      │          無匹配 → efficiency=0、無產出
  │      ├─ splitter / merger
  │      └─ → edgeFlows
  │
  ├─ 5. detectCongestion …
  ├─ 6. calcItemSummary …（不含 mode.loss）
  ├─ 7. sinkDeliveries …（總產值只計 Sink）
  └─ 8. applyResult → flowStore
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
- 寫入 `machineMode`／`environment`（缺省 `modes[0]`／`"none"`）
- **Source**（基礎材料輸出點／物品輸出口）：`primaryOutput` → `outputRates`
- **一般機器**：V9 起不依 `recipeIndex` 預填 rates（匹配後再填）

#### 2. validateChains — 反向 BFS＋配方匹配

```typescript
function validateChains(graph: FlowGraph): void
function matchRecipeByInputs(
  machineType: string,
  incomingItemIds: Set<string>,
  machineMode?: string,
  environment?: string,
): { recipe: RecipeDef; index: number } | null
```

- 從 Sink **反向** BFS；無法到達 Sink → 非法
- 埠一對一、belt↔pipe、form↔媒質（V7／V8）
- **V9-E1**：依上游品項 `matchRecipeByInputs`（種類集合**完全吻合**＋environment）
  - 多候選 → 資料順序第一
  - 無匹配 → 非法／無理論產出
- `recipeIndex` 僅提示；引擎以匹配結果覆寫

**範例：**
```
礦機 → 熔爐 → （無連線）     // 無 sink → invalid
源礦 → 粉碎機 → sink         // E1 匹配源石粉末 → valid
赤銅礦 → 精煉(liquid) → sink // 缺清水 → 無匹配 → invalid
belt 口 → pipe 口            // 媒質錯接 → invalid
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

見下方 [Dev 頁面使用說明](#dev-頁面使用說明)。路由：`http://localhost:5173/dev/flow-engine`（僅 DEV）。

---

## Dev 頁面使用說明

僅 `import.meta.env.DEV` 可訪問。導覽：`/dev`（預設進 flow-engine）。

### 路由一覽

| 路由 | 狀態 | 用途 |
|------|------|------|
| `/dev/flow-engine` | ✅ 主頁 | 引擎計算、拓樸、機器／產品目錄、preset、D1 演示 |
| `/dev/history-replay` | ✅ | Undo／Redo＋V6 拖曳驗收 |
| `/dev/validation-test` | ✅ | Detector／警示 |
| `/dev/graph-viz` | ❌ 退役 | 自動轉址 flow-engine（V9-H1-4） |

---

### `/dev/flow-engine` — 三個分頁

#### 1）引擎測試（預設）

| UI | 用法 |
|----|------|
| Preset 按鈕 | 點選即載入 JSON 並計算。群組：**basic**（H1–H6）、**advanced**（H7–H11）、**v7**（G1–G3／L1）、**v9**（換料／缺清水／息壤／無 Sink） |
| 預期說明 | 每個 preset 下方列出應觀察的效率／堵塞／非法語意 |
| JSON 區 | 可手改 `nodes`／`edges` 後按「執行計算」 |
| 拓樸 SVG | 節點著色＝效率；**橘邊＝堵塞**；點節點可切 `machineMode`（埠示意更新） |
| 摘要面板 | 電力、非法節點、**堵塞邊**列表、Sink 交付、品項 summary |
| D1 最短鏈 | 選產品 →「產生演示圖」：依最短反向鏈建圖（加工機帶 `primaryOutput`） |

**建議手測路徑：**

1. **H1** — 滿速源礦→粉碎→Sink  
2. **H7** — 雙源灌粉碎機：源礦入邊橘邊約 15／15；出邊源石粉末≈30  
3. **H8** — 匯流堵塞：入匯流器邊約 15／15  
4. **H10／G2** — 非法／無匹配配方  
5. **v9-xi-rang** 或 D1 選「息壤」／「赫銅零件」— 反向鏈演示  
6. **v9-swap-*** — E1 換料語意  

#### 2）機器目錄

- 依 `machine_tags` 分頁（基礎生產／合成製造／…）  
- 顯示 WxH 格點＋當前 mode 埠（side／offset／media）  
- 可切 mode 預覽埠變化  

#### 3）產品／材料目錄

- **產品**＝`products.json`；**基礎材料**＝`materials.json`（已分離）  
- 選產品可預覽 D1 最短鏈（步數、葉材料、各步效率個／分）  

---

### Preset 速查（引擎語意）

| ID | 觀察重點 |
|----|----------|
| H1／H2 | 滿速／半速效率 |
| H3／H11 | 分流 |
| H4／H5 | 環路／孤立非法 |
| H6 | 多級串聯 |
| **H7** | 同品雙入：入邊堵塞平分；出邊通常不堵 |
| **H8** | 匯流器出口限 30 → 入邊回推堵塞 |
| H9 | 雙獨立產線 |
| H10 | 輸入無法匹配配方 |
| G1／L1 | 氣態／mode；loss 不進 summary |
| G2 | 錯 mode → 無匹配 |
| G3 | belt↔pipe 錯接非法 |
| v9-* | E1 換料／缺料／無 Sink／息壤短鏈 |

完整盤點：[dev_v9/F1_case_inventory.md](./dev/dev_v9/F1_case_inventory.md)。

---

### `/dev/history-replay` — 歷史與 V6

| 區塊 | 用法 |
|------|------|
| 快速場景／測試操作 | 擺放、移動、刪除 → 觀察 Undo Stack |
| **V6 拖曳驗收** | 與下方 Undo／Redo **同一** `historyStore`。建議先按 **「一鍵 M1→M4（推薦）」**；空畫布時模擬鈕會提示需先擺設備 |
| Undo／Redo／Clear | 還原／重做／清空歷史 |

M7（真拖曳跟手）請到主畫布目視後手動勾選。

---

## V7：machineMode 與媒質

### machineMode

- 節點欄位：`FactoryNode.data.machineMode?: string`
- 缺省：該機器 `modes[0].id`（`resolveMachineMode`）
- 配方候選：`getRecipesForMachine(machineType, machineMode)`
- **V9**：實際選用由 `matchRecipeByInputs` 決定；`recipeIndex` 為匹配後索引（mode 過濾後）

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
| 拓樸 | `DevTopologySvg`（`/dev/flow-engine`）；依當前 mode ports；點節點可切 `machineMode`。`/dev/graph-viz` 已退役（V9-H1-4） |

測試：`src/__tests__/flowEngine.v8.*.test.ts`、`itemForm.test.ts`。

### V9：材料源／輸入匹配／反向鏈路（已實作）

定案與工項：[todolist_v9.md](./dev/todolist_v9.md)／[A1_scope_decision.md](./dev/dev_v9/A1_scope_decision.md)。

| 項 | 說明 |
|----|------|
| 埠資料 | 僅 `modes[]`；預設 `modes[0]` |
| Source | **基礎材料輸出點**（form→belt／pipe）＋物品輸出口（固體）；`primaryOutput` |
| 產品／材料 | `products.json`／`materials.json` 分冊；無材料假產品 |
| 配方 | `matchRecipeByInputs`：種類集合完全吻合；不齊無產出；同集合取第一 |
| 環境 | 節點 `environment`（缺省 `none`）須與配方一致 |
| 反向鏈 | `findShortestReverseChain`（`src/utils/reverseChain.ts`）；息壤選短鏈 |
| 預覽 | 機器 tag 分頁；WxH 格點埠；產品頁顯示最短鏈 |
| Dev | V9 preset（換料／缺清水／息壤／無 Sink）＋「產生演示圖」 |
| 總產值 | 只計 **物品輸入口** 交付 |
| 堵塞 | 同品多入邊（一般機或匯流器）按供給比例分攤 demand（H7／H8） |
| 多輸出 | `matchRecipeByEdgeCandidates`：每邊選一品；`primaryOutput` 優先 |

測試：`reverseChain.test.ts`、`matchRecipeByInputs.test.ts`、`flowEngine.v9.h7Congestion.test.ts`、`flowEngine.v9.h12ByproductMatch.test.ts`。

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

- **協作者使用／下一步** — [CR04_FOR_COLLABORATORS.md](./CR04_FOR_COLLABORATORS.md)
- **資料格式** — [DATA_FORMAT_GUIDE.md](./DATA_FORMAT_GUIDE.md)
- **V6～V9 報告** — [MILESTONE_0802_V6_V9_REPORT.md](./MILESTONE_0802_V6_V9_REPORT.md)
- **L1 API Reference** — [L1_API_REFERENCE.md](./L1_API_REFERENCE.md)
- **FlowEngine 原始碼** — [src/composables/useFlowEngine.ts](../../src/composables/useFlowEngine.ts)
- **V7 mode／媒質測試** — [src/__tests__/flowEngine.v7.modeMedia.test.ts](../../src/__tests__/flowEngine.v7.modeMedia.test.ts)
- **V8 埠／速率／H8／form** — `src/__tests__/flowEngine.v8.*.test.ts`
- **V9** — `reverseChain.test.ts`、`matchRecipeByInputs.test.ts`、`flowEngine.v9.*.test.ts`
- **開發測試頁** — `/dev/flow-engine`

---

**文件版本：** V9.1  
**最後更新：** 2026-08-02  
**維護者：** aaaaa (CR-04)  
**問題回報：** 見 `docs/aaaaa/dev/todolist_v9.md`
