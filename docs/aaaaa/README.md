# CR-04｜FlowEngine 靜態流量分析引擎

**負責人：** aaaaa  
**階段：** Phase 1 完成 ✅ / Phase 2 完成 ✅ / V3 技術債修正完成 ✅  
**依賴 CR：** CR-01（設備擺放）、CR-02（管線連接）、CR-03（警示與 Error 狀態）  
**文件版本：** v1.3  
**最後更新：** 2026-05-22

---

## 一、功能概述

CR-04 是模擬器的**核心計算引擎**，稱為 **FlowEngine**。

每當畫布狀態（設備擺放、管線連接、配方設定）發生變動，FlowEngine 自動以靜態流量分析重新計算整條產線的穩態產能，並：

1. **管線 Overlay**：每條管線顯示品項名稱 + 實際流量 /min，堵塞管線以橘色標示
2. **設備 Overlay**：每台設備顯示當前效率 %，依效率區間顯示顏色
3. **右側統計面板（ProductionStats）**：
   - 電力統計（耗電 / 供電 / 盈缺）
   - 產出摘要（所有品項的 produced / consumed / net / efficiency）
   - **總產出**（原料剩餘配額 + 機器產出交付量，供下一段產線規劃使用）
   - 建造計畫：原料供給剩餘、計畫產物進度、機器用量限制
4. Phase 2：**調度券兌換效率**（V2 完成）、**倉庫填滿預估**（V2 完成）

有 CR-03 Error 的設備與管線**略過計算**，不影響其餘正常節點。

---

## 二、檔案結構

```
src/
├── composables/
│   └── useFlowEngine.ts        ← 核心演算法（D2–D9）+ watch 觸發（E1）
├── store/
│   └── flowStore.ts            ← Pinia store，唯一寫入點
├── data/
│   ├── devices.ts              ← 設備定義 + 配方查詢 API（CR-04 暫維護）
│   └── plans.ts                ← 建造計畫資料（計畫原料 / 機器限制 / 產物價格）
├── editor/
│   └── stats/
│       └── ProductionStats.vue ← 右側統計面板（唯讀 flowStore + editorStore）
├── types/
│   └── flow.ts                 ← FlowEngine 相關型別（EdgeFlow, ItemSummary, FlowGraph…）
└── app/layouts/
    └── MainLayout.vue          ← 掛載 useFlowEngine()（E2）
```

---

## 三、架構資料流

```
畫布操作（CR-01 / CR-02 修改 editorStore.nodes / edges）
         │
         ▼  watch([nodes, edges], { deep: true, immediate: true })
            useDebounceFn(runFlowEngine, 150ms)
  ┌────────────────────────────────────┐
  │  runFlowEngine()  [useFlowEngine.ts]│
  │                                    │
  │  buildGraph(nodes, edges)          │ ← 過濾 CR-03 Error，建立 FlowGraph
  │       ↓                            │
  │  validateChains(graph)             │ ← 反向 BFS，排除非合法鏈路
  │       ↓                            │
  │  topologicalSort(graph)            │ ← Kahn's Algorithm，偵測環路
  │       ↓                            │
  │  propagateFlows(sorted, graph)     │ ← 正向傳播，計算流量與效率
  │       ↓                            │
  │  detectCongestion(graph, flows)    │ ← 多遍反向傳播，修正上游速率
  │       ↓                            │
  │  calcItemSummary(graph)            │ ← 彙整 produced/consumed/net/efficiency
  │       ↓                            │
  │  sinkDeliveries（inline）          │ ← 統計 sink 節點接收量（總產出用）
  └────────────────────────────────────┘
         │
         ▼  flowStore.applyResult(payload)  [一次性批次寫入]
  useFlowStore（Pinia）
         │
         ├── FactoryCanvas.vue   ← 管線 / 設備 overlay（消費 edgeFlows / nodeEfficiencies / invalidChainUids）
         └── ProductionStats.vue ← 統計面板（消費 itemSummary / sinkDeliveries / powerBalance…）
```

---

## 四、型別定義（`src/types/flow.ts`）

### 常數
```typescript
export const BELT_RATE_LIMIT = 30; // 傳送帶每條連線上限（個/min）
```

### 圖結構型別
```typescript
interface EdgeMeta {
  connectionUid: string;
  sourceDeviceUid: string;
  targetDeviceUid: string;
}

interface FlowNode {
  deviceUid:   string;
  machineType: string;
  recipeIndex: number;         // 對應 devices.ts 中的配方索引
  isSource:    boolean;        // 物品輸出口
  isSink:      boolean;        // 物品輸入口
  isValid:     boolean;        // false = Error / 非合法鏈路 / 配方不符 / 環路
  efficiency:  number;         // 0~1，正向傳播後由 detectCongestion 修正
  outputRates: Map<string, number>; // itemId → 個/min（已套用 detectCongestion 修正）
  inputRates:  Map<string, number>; // itemId → 個/min（同上）
}

interface FlowGraph {
  nodes:              Map<string, FlowNode>;
  outEdges:           Map<string, string[]>; // deviceUid → connectionUid[]
  inEdges:            Map<string, string[]>;
  edgeMeta:           Map<string, EdgeMeta>;
  hasCycle:           boolean;
  invalidSubgraphUids: Set<string>;
}
```

### 計算結果型別
```typescript
interface EdgeFlow {
  connectionUid: string;
  itemId:        string;
  rate:          number;       // 個/min，已套用 BELT_RATE_LIMIT 截斷
  isCongested:   boolean;      // 上游供給 > 下游需求
}

interface ItemSummary {
  itemId:     string;
  name:       string;
  produced:   number;          // 所有合法節點 outputRates 加總（個/min）
  consumed:   number;          // 所有合法節點 inputRates 加總（個/min）
  net:        number;          // produced - consumed
  efficiency: number;          // 產出此品項的所有設備效率最小值
}
```

---

## 五、Pinia Store（`src/store/flowStore.ts`）

### State

| 欄位 | 型別 | 說明 |
|------|------|------|
| `edgeFlows` | `Map<string, EdgeFlow>` | connectionUid → 管線流量（rate、isCongested） |
| `nodeEfficiencies` | `Map<string, number>` | deviceUid → 效率 0~1 |
| `itemSummary` | `ItemSummary[]` | 所有品項 produced/consumed/net/efficiency，依 net 降序 |
| `sinkDeliveries` | `Map<string, number>` | itemId → 物品輸入口實際接收速率（個/min） |
| `congestedEdges` | `Set<string>` | isCongested=true 的 connectionUid |
| `invalidChainUids` | `Set<string>` | 非合法鏈路節點 deviceUid（畫布灰色虛線用） |
| `totalPowerDemand` | `number` | 所有有效設備耗電加總（kW） |
| `totalPowerSupply` | `number` | 供電加總（kW，待 CR-01 定義） |
| `isCalculating` | `boolean` | 計算中 flag |
| `lastCalculatedAt` | `number` | 完成時間戳（ms） || `ticketRates` | `Map<string, number>` | 品項 itemId → 調度券單價（個/min），用戶手動設定 |
| `warehouseCapacity` | `number` | 目標倉庫總儲存量（個），0 = 未設定 |
### Computed

| 欄位 | 說明 |
|------|------|
| `powerBalance` | `totalPowerSupply - totalPowerDemand`（正=盈餘） |
| `hasPowerShortage` | 電力不足 boolean |
| `edgeFlowCount` | 有效管線數 |
| `congestedEdgeCount` | 堵塞管線數 |
| `invalidChainCount` | 非合法鏈路節點數 |
| `hasResults` | 是否有合法鏈路計算結果 |
| `ticketOutput` | `Map<string, number>` — 各品項調度券收益（itemId × ticketRate） |
| `ticketTotal` | 全品項調度券收益總和（團/min） |
| `warehouseEstimates` | `Map<string, number>` — 各品項填滿目標倉庫需要分鐘數、warehouseCapacity = 0 時為空 |

### applyResult 簽名
```typescript
flowStore.applyResult({
  edgeFlows:       Map<string, EdgeFlow>,
  nodeEfficiencies: Map<string, number>,
  itemSummary:     ItemSummary[],
  sinkDeliveries:  Map<string, number>,   // ← 2026-05-19 新增
  congestedEdges:  Set<string>,
  invalidChainUids: Set<string>,
  totalPowerDemand: number,
  totalPowerSupply: number,
})
```

---

## 六、演算法詳解（`src/composables/useFlowEngine.ts`）

### D4 — calcDeviceRate（速率計算）

```typescript
export function calcDeviceRate(recipe: RecipeDef) {
  const cyclePerMin = 60 / recipe.timeSeconds;
  // inputRates[itemId]  = input.quantity  × cyclePerMin
  // outputRates[itemId] = output.quantity × cyclePerMin
}
```

**重要公式：**
```
速率（個/min） = quantity × (60 / timeSeconds)
```

---

### C1 — validateChains（合法鏈路驗證）

**5 步驟流程：**

```
Step 1  收集所有 isSink && isValid 的節點加入 BFS 佇列
Step 2  反向 BFS（沿 inEdges 往上游走）
        → 標記所有可到達 sink 的節點至 reachableSinks
Step 3  未被標記的節點：node.isValid = false，加入 invalidSubgraphUids
Step 4  對合法且非 source/sink 節點：
        從上游節點的 outputRates 推斷 incomingItemIds
        呼叫 validateRecipeMatch(machineType, recipeIndex, incomingItemIds)
        不符 → node.isValid = false，加入 invalidSubgraphUids
Step 5  _propagateInvalidDownstream(graph)
        正向 BFS，配方不符節點的下游連帶標記非法（sink 不繼續傳播）
```

**validateRecipeMatch 規則：**
```typescript
// 1. 找不到配方           → false
// 2. recipe.inputs 為空  → true（source 節點永遠合法）
// 3. recipe.inputs.every(input => incomingItemIds.has(input.itemId))
```

---

### D3 — topologicalSort（Kahn's Algorithm）

```
1. 計算所有合法節點的入度（只計算兩端均 isValid 的邊）
2. 入度 0 的節點加入佇列
3. 從佇列取出節點 → 放入 sorted；對所有下游鄰居減少入度
4. 若某鄰居入度降為 0 → 加入佇列
5. 結束後若 sorted.length < 合法節點總數 → 有環路
   將環路節點加入 invalidSubgraphUids，hasCycle = true
```

---

### D6 — propagateFlows（正向傳播）

依拓撲序處理每個合法節點：

```
source 節點：
  outputRates 取自 buildGraph 初始化值（理論速率）
  每條 outEdge：rate = Math.min(recipeRate, BELT_RATE_LIMIT)

sink 節點：
  inputRates = 接收到的所有品項速率加總
  efficiency = 1

一般設備：
  received = 所有入邊流量加總（按品項分組）
  efficiency = Math.min(1, ...( supplied[i] / required[i] ))
  inputRates[itemId]  = required[itemId] × efficiency
  outputRates[itemId] = recipeOutputRate[itemId] × efficiency
  
  出邊品項配對：
    優先配對下游 recipe.inputs 中的 itemId
    fallback：取 outputAvailable 中第一個有量的品項
  edge.rate = Math.min(actual_output, BELT_RATE_LIMIT)
```

---

### D7 — detectCongestion（堵塞反向傳播）⚠️ 多遍迭代

**核心問題：** 堵塞可能需要多遍才能從下游傳回到最上游的 source 節點。

**演算法：**
```
MAX_PASSES = nodes.size + 2
for pass in range(MAX_PASSES):
    changed = false
    for each (connUid, flow) in edgeFlows:
        demand = targetNode.inputRates[flow.itemId]
        if flow.rate <= demand + 1e-6: continue   // 無堵塞

        // 標記堵塞，截斷至 demand
        edgeFlows[connUid] = { ...flow, isCongested: true, rate: demand }
        congestionRatio = demand / flow.rate
        changed = true

        if sourceNode.isSource:
            // source 節點：只縮減 outputRates（無 inputRates）
            for each (itemId, rate) in sourceNode.outputRates:
                outputRates[itemId] = rate × congestionRatio
            continue   // source 無 inputRates，不繼續

        // 一般節點：同步縮減 efficiency / outputRates / inputRates
        sourceNode.efficiency ×= congestionRatio
        outputRates ×= congestionRatio（全品項）
        inputRates  ×= congestionRatio（全品項）

        // 同步縮減此節點的其他出邊 rate
        for each other outEdge of sourceNode:
            edgeFlows[upConnUid].rate ×= congestionRatio

        // 檢查更上游入邊是否超出新 demand
        for each inEdge of sourceNode:
            upDemand = sourceNode.inputRates[upFlow.itemId]
            if upFlow.rate > upDemand + 1e-6:
                edgeFlows[upConnUid] = { isCongested: true, rate: upDemand }

    if not changed: break
```

**為何需要多遍：**  
第一遍以拓撲順序迭代 edgeFlows（source→downstream），當處理 `src→粉碎機` 時，粉碎機的 inputRates 尚未被下游堵塞縮減（還是理論值）。直到處理 `粉碎機→反應池` 才縮減粉碎機的 inputRates。第二遍才能偵測到 `src→粉碎機` 也超標，並修正 source.outputRates。

---

### D8 — calcItemSummary（品項統計）

```typescript
for each valid node in graph:
  for each (itemId, rate) in node.outputRates:
    produced[itemId] += rate
    efficiencyByItem[itemId].push(node.efficiency)
  for each (itemId, rate) in node.inputRates:
    consumed[itemId] += rate

net[itemId]        = produced[itemId] - consumed[itemId]
efficiency[itemId] = Math.min(...efficiencyByItem[itemId])
```

---

### sinkDeliveries（物品輸入口交付量）

在 `runFlowEngine` 中，`calcItemSummary` 之後內聯計算：

```typescript
const sinkDeliveriesMap = new Map<string, number>();
for (const [, node] of graph.nodes) {
  if (!node.isValid || !node.isSink) continue;
  for (const [itemId, rate] of node.inputRates) {
    if (rate > 0)
      sinkDeliveriesMap.set(itemId, (sinkDeliveriesMap.get(itemId) ?? 0) + rate);
  }
}
```

`sinkDeliveries` 代表「從物品輸入口真正離開產線」的品項速率，用於計算「總產出」。

---

## 七、建造計畫資料（`src/data/plans.ts`）

### 型別定義
```typescript
interface MaterialRate  { name: string; rate: number | null }  // null = 無限制
interface MachineLimit  { name: string; limit: number | null } // null = 無限制
interface ProductValue  { name: string; price: number }        // 調度券單價
interface Plan {
  id:                string;
  name:              string;
  material_rates:    MaterialRate[];   // 地區原料配額（/min）
  machine_limits:    MachineLimit[];   // 地區機器台數上限
  product_values:    ProductValue[];   // 計畫產物與調度券換算價格
  priority_products: { name: string; max_rate: number | null }[]; // 優先產品
}
```

### 已定義計畫
| ID | 名稱 | 原料限制 | 機器限制 |
|----|------|----------|----------|
| `7dd94e87...` | 四號谷地 | 源礦560、紫晶礦240、藍鐵礦1080 | 全機種無限制 |
| `9bdb2f99...` | 武陵 | 源礦540、赤銅礦240、清水∞、沉積酸∞、藍鐵礦∞ | 多機種有限制 |

---

## 八、右側統計面板（`src/editor/stats/ProductionStats.vue`）

### 資料來源
```typescript
// flowStore（唯讀）
const { itemSummary, sinkDeliveries, totalPowerDemand, totalPowerSupply,
        powerBalance, hasPowerShortage, edgeFlowCount, invalidChainCount,
        isCalculating, hasResults } = storeToRefs(flowStore);

// editorStore（唯讀）
const { nodeCount, currentPlan, machineUsedCounts } = storeToRefs(editorStore);
```

### 區塊說明與 computed 邏輯

#### 1. 電力統計
直接讀取 `totalPowerDemand`、`totalPowerSupply`、`powerBalance`。

#### 2. 畫布概況
直接讀取 `nodeCount`、`edgeFlowCount`、`invalidChainCount`。

#### 3. 產出摘要（itemSummary）
直接渲染 `itemSummary[]`，每列顯示 produced / consumed / net / efficiency。

#### 4. 總產出（totalOutput）
```typescript
// 原料剩餘（有限配額 && remaining > 0）
for (const m of materialUsage) {
  if (m.allocated !== null && m.remaining !== null && m.remaining > 0.005)
    result.push({ name: m.name, rate: m.remaining, type: 'raw' })
}
// 機器交付品（非計畫原料 && sinkDelivery > 0）
for (const [itemId, rate] of sinkDeliveries) {
  if (!planMaterialNames.has(itemId) && rate > 0.005)
    result.push({ name: itemId, rate, type: 'product' })
}
```
灰點 = 原料剩餘，藍點 = 機器產出。

#### 5. 原料供給（materialUsage）
```typescript
// 計畫原料 × FlowEngine 實際提取量
materialUsage = plan.material_rates
  .filter(m => m.rate !== 0)        // 0=此區無此資源
  .map(m => ({
    name:      m.name,
    allocated: m.rate,
    used:      itemSummary.find(s => s.name === m.name)?.produced ?? 0,
    remaining: m.rate === null ? null : m.rate - used
  }))
```
顏色：不足紅 / 接近上限黃（< 10%）/ 正常綠 / 無限灰。

#### 6. 計畫產物（planProducts）
```typescript
// 計畫 product_values 中有 net > 0 的品項
planProducts = plan.product_values
  .filter(p => itemSummary.find(s => s.name === p.name && s.net > 0.005))
  .map(p => ({ ...matchedSummary, price: p.price }))
```

#### 7. 機器用量（machineUsage）
```typescript
// 計畫 machine_limits × 畫布已擺放台數
machineUsage = plan.machine_limits
  .map(m => ({ name, limit, used: machineUsedCounts.get(m.name) ?? 0 }))
  .filter(m => m.used > 0 || m.limit !== -1)
```
顏色：超限紅 / 接近上限黃（≥80%）/ 正常綠 / 無限灰。

---

## 九、效率顏色規則

| 效率區間 | 顏色 | Tailwind class |
|----------|------|----------------|
| 100% | 綠色 | `text-green-500` |
| 50%–99% | 黃色 | `text-yellow-400` |
| 1%–49% | 橘色 | `text-orange-400` |
| 0% | 灰色 | `text-zinc-500` |

---

## 十、Watch 觸發（E1）

```typescript
// src/composables/useFlowEngine.ts
export function useFlowEngine() {
    const editorStore = useEditorStore();
    const debouncedRun = useDebounceFn(runFlowEngine, 150);

    watch(
        [() => editorStore.nodes, () => editorStore.edges], // getter 形式，相容 shallowRef
        debouncedRun,
        { deep: true, immediate: true },
    );

    return { runFlowEngine };
}
```

掛載點（MainLayout.vue）：
```typescript
import { useFlowEngine } from '@/composables/useFlowEngine';
useFlowEngine(); // layout 載入時自動啟動監聽
```

---

## 十一、跨 CR 介面需求（其他 CR 請閱讀）

> 以下列出 CR-04 對各 CR 的**強依賴介面**，若有變更請主動通知 CR-04。

### 【對 CR-01】需求清單

CR-04 透過 `useEditorStore` 讀取畫布狀態，要求如下：

#### N1-01 — `nodes` 的 `data` 欄位結構
```typescript
// FactoryNode.data 必須包含：
interface FactoryNodeData {
  machineType: string;    // 設備類型名稱（對應 devices.ts 的 MachineDef.name）
  recipeIndex?: number;   // 使用者選定的配方索引，預設 0
  label?: string;         // fallback 顯示名（machineType 找不到時使用）
}
```
- `machineType` 是 CR-04 呼叫 `getRecipesForMachine(machineType)` 的查詢鍵
- `recipeIndex` 決定使用哪個配方計算速率，UI 需提供使用者切換介面

#### N1-02 — `edges` 的 id 與方向
```typescript
// FactoryEdge 必須包含：
interface FactoryEdge {
  id:     string;   // 對應 EdgeMeta.connectionUid，CR-04 以此寫入 edgeFlows
  source: string;   // 上游 node.id（物質流向的出發端）
  target: string;   // 下游 node.id（物質流向的終點）
}
```
- `source → target` 的方向必須是物質流向（非管線繪製方向）
- 如果 CR-02 的方向相反，CR-04 的 propagateFlows 會算反

#### N1-03 — 設備定義（`devices.ts`）
CR-04 目前暫維護此 stub。若 CR-01 接管，請保持以下查詢 API 相容：
```typescript
getMachineDef(name: string): MachineDef | undefined
getRecipesForMachine(name: string): RecipeDef[]
// RecipeDef 必須包含：inputs[], outputs[], machine, timeSeconds
// MachineDef 必須包含：isSource?, isSink?, power（-1=待補）
```

#### N1-04 — 電力供應數據
```typescript
// CR-04 目前 totalPowerSupply = 0（無法計算供電）
// CR-01 實作供電設備後，請在 editorStore 暴露：
const totalPowerSupply = computed(() =>
  nodes.value
    .filter(n => n.data.isPowerPlant)
    .reduce((sum, n) => sum + (getMachineDef(n.data.machineType)?.power_output ?? 0), 0)
)
// 或直接由 CR-04 在 runFlowEngine 中計算，前提是 MachineDef 需有 power_output 欄位
```

---

### 【對 CR-02】需求清單

#### N2-01 — Connection 型別（管線資料）
CR-04 的 `buildGraph` 讀取 `editorStore.edges`：
```typescript
// 必須保持的最小結構（已在 FactoryEdge 中）：
{ id, source, target }
// CR-04 不讀取 sourcePortId / targetPortId，但 CR-02 可以自由擴充
```

#### N2-02 — 多邊（同兩節點多條管線）
若 CR-02 允許同一對 source/target 建立多條管線，CR-04 可以正確處理（每條 edge.id 獨立存在 edgeFlows 中）。

#### N2-03 — 分流器 / 匯流器（Splitter / Merger）
目前 CR-04 以 `tags: ['splitter'/'merger']` 作為 stub。若 CR-02 定義正式的 Splitter/Merger：
```typescript
// 期望的識別方式（可協商）：
node.data.machineType === 'Splitter' // 或
node.data.tags?.includes('splitter')
```
CR-04 會根據此資訊啟用均分邏輯。

---

### 【對 CR-03】需求清單

#### N3-01 — hasBlockingError API
```typescript
// useValidationStore 必須暴露：
hasBlockingError(uid: string): boolean
// uid = FactoryNode.id 或 FactoryEdge.id
// 回傳 true → CR-04 在 buildGraph 時將此節點標記為非法（不參與計算）
```

CR-04 以 try-catch 降級（CR-03 未就緒時視為無 Error）：
```typescript
try {
  const vs = require('@/store/validationStore').useValidationStore();
  hasBlockingError = (uid) => vs.hasBlockingError(uid);
} catch {
  hasBlockingError = () => false; // 降級
}
```

---

### 【對 Canvas / FactoryCanvas.vue 維護者】消費指南

CR-04 的計算結果已全部存在 `useFlowStore`，請按以下方式讀取：

#### 管線 Overlay（顯示流量 + 堵塞）
```typescript
const flowStore = useFlowStore();

// 方式：Vue Flow 的 EdgeLabelRenderer + 自訂 overlay
// 對每條 edge（Vue Flow edge.id === connectionUid）：
const flow = flowStore.edgeFlows.get(edge.id);
if (flow) {
  // flow.rate         → 顯示 "X.X /min"
  // flow.isCongested  → true 時顯示橘色警示
  // flow.itemId       → 顯示品項名稱
}
```

#### 設備 Overlay（顯示效率 %）
```typescript
const eff = flowStore.nodeEfficiencies.get(node.id) ?? null;
if (eff !== null) {
  // Math.round(eff * 100) + '%'
  // 顏色：eff >= 1 → green-500 / >= 0.5 → yellow-400 / > 0 → orange-400 / 0 → zinc-500
}
```

#### 非法節點（灰色虛線外框）
```typescript
const isInvalid = flowStore.invalidChainUids.has(node.id);
// isInvalid = true → 套用 class "border-dashed border-zinc-500 opacity-50"
```

---

## 十二、開發版本紀錄

| 版本 | 日期 | 說明 |
|------|------|------|
| v0.1 | 2026-05-18 | 初版文件，規劃 Phase 1 架構 |
| v0.2 | 2026-05-18 | P1-A：types/flow.ts + data/devices.ts |
| v0.3 | 2026-05-18 | P1-B：flowStore.ts |
| v0.4 | 2026-05-18 | P1-C：validateChains + validateRecipeMatch |
| v0.5 | 2026-05-18 | P1-D：buildGraph / topologicalSort / propagateFlows / detectCongestion / calcItemSummary / runFlowEngine |
| v0.6 | 2026-05-18 | P1-E：watch + useDebounceFn，MainLayout 掛載 |
| v0.7 | 2026-05-19 | P1-F~G：FactoryCanvas overlay + ProductionStats 統計面板 |
| v0.8 | 2026-05-19 | Bug Fix：validateChains sink 跳過修正；buildGraph recipeIndex 讀取修正 |
| v0.9 | 2026-05-19 | 建造計畫面板：plans.ts + editorStore 計畫 computed + 原料供給 / 計畫產物 / 機器用量 |
| v0.9.1 | 2026-05-19 | Bug Fix：devices.ts 兩處配方數值修正（赫銅塊 quantity、赫銅零件 quantity+timeSeconds） |
| v1.0 | 2026-05-19 | Bug Fix：detectCongestion 改為多遍迭代，正確回推 source 節點；新增 sinkDeliveries + 總產出面板 || v1.1 | 2026-05-22 | **V1**：Machine 物件動態化重構（詳見 [dev_v1.md](./dev/dev_v1.md)） |
| v1.2 | 2026-05-22 | **V2**：調度券兌換效率 + 倉庫填滿預估完成（詳見 [dev_v2.md](./dev/dev_v2.md)） |
| v1.2.1 | 2026-05-22 | Bug Fix：「帶入計畫」按鈕無反應，改正 applyPlanRates 迭代對象 |
| v1.3 | 2026-05-22 | **V3**：主編審查技術債修正（vitest 分離 / FlowEngineResult 型別外置 / plans.ts -1→null） |
---

## 十三、版本迭代摘要

> 詳細工項清單見各版本 todolist；技術決策見對應 dev 文件。

### V1 — Machine 物件動態化重構
**文件：** [dev_v1.md](./dev/dev_v1.md) ｜ **日期：** 2026-05-22  

| 工項 | 說明 |
|------|------|
| V1-A | `src/data/machines.ts` 新建，將 Machine 資料從 `devices.ts` 分離 |
| V1-B | `src/types/machine.ts` 新建，定義 `MachineDef`、`RecipeDef` 統一型別 |
| V1-C | `useFlowEngine.ts` 配方查詢改用 machines.ts API |
| V1-D | 品質驗證通過（type-check / test / lint / format） |

---

### V2 — 調度券兌換效率 + 倉庫填滿預估（Phase 2）
**文件：** [dev_v2.md](./dev/dev_v2.md) ｜ **日期：** 2026-05-22  

| 工項 | 說明 |
|------|------|
| V2-A | `flowStore.ts` 新增 `ticketRates`、`warehouseCapacity` state 及衍生 computed |
| V2-B | `ProductionStats.vue` 新增「調度券兌換率設定」與「倉庫預估」UI 區塊 |
| V2-C | 品質驗證通過（type-check / test / lint / format） |

**Bug Fix（V2 後）：** 「帶入計畫」按鈕無反應  
- 原因：`applyPlanRates` 迭代 `itemSummary` 但計畫中只有 product_values，找不到品項  
- 修正：改為直接迭代 `product_values`，以 `p.name` 為 itemId（因 `calcItemSummary` 中 `name === itemId`）

---

### V3 — 主編審查技術債修正
**文件：** [dev_v3.md](./dev/dev_v3.md) ｜ **日期：** 2026-05-22  

| 工項 | 說明 | 狀態 |
|------|------|------|
| V3-A | `vitest.config.ts` 獨立分離，`vite.config.ts` 還原為純 vite | ✅ |
| V3-B | `FlowEngineResult` interface 外置至 `src/types/flow.ts` | ✅ |
| V3-C | `plans.ts` 無限制由 `-1` 改為 `null`，下游 Vue 一併更新 | ✅ |
| V3-D | 品質驗證通過（type-check 零錯誤 / 27 tests / lint / format） | ✅ |
| V3-E | `devices.ts` 字串比對改為 machine id（**封鎖中**，待 CR-01） | 🔒 |

---

## 十四、封鎖項目追蹤

> 以下工項因等待外部 CR 介面確認而暫停，目前以 stub 維持現狀，不影響功能運作。

| ID | 說明 | 封鎖原因 | 等待對象 |
|----|------|---------|---------|
| V3-E1 | `RecipeDef.machine` 由字串改為 machine id 型別比對 | CR-01 尚未定義 machine id / enum，字串型 `r.machine === machineName` 暫作 stub | CR-01 machine id 設計確認後 |

---

## 十五、參考文件

- [spec/04_flow_simulation.md](../../spec/04_flow_simulation.md) — 官方 Feature Spec
- [spec/00_top_spec.md](../../spec/00_top_spec.md) — 系統 Top Spec
- [spec/03_validation.md](../../spec/03_validation.md) — 警示系統（CR-03）