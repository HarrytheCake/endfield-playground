# CR-04｜基礎流量估算（即時重算、右側統計面板、總耗電量顯示）

**負責人：** aaaaa  
**階段：** Phase 1（基礎估算）/ Phase 2（調度券效率）  
**依賴 CR：** CR-01（設備擺放）、CR-02（管線連接）、CR-03（警示與 Error 狀態）  
**文件版本：** v0.4  
**最後更新：** 2026-05-18

---

## 一、功能概述

CR-04 是模擬器的**核心計算引擎**，稱為 **FlowEngine**。

每當畫布狀態（設備擺放、管線連接、配方設定）發生變動，FlowEngine 自動以靜態流量分析重新計算整條產線的穩態產能，並：

1. 在**管線與設備**上即時顯示流量速率與效率
2. 在**右側統計面板（ProductionStats）**顯示總耗電量、總供電量、產出摘要表
3. Phase 2 額外支援調度券兌換效率估算與倉庫填滿預估

有 Error（由 CR-03 `useValidationStore` 標記）的設備與管線**略過計算**，不影響其餘正常節點。

---

## 二、技術架構

### 2.1 技術選型

| 層次 | 技術 |
|------|------|
| 框架 | Vue 3 + Vite（Composition API） |
| 狀態管理 | Pinia（`useFlowStore`） |
| 計算觸發 | Vue `watch` + `useDebounceFn`（VueUse，debounce 150ms） |
| 演算法 | 有向圖拓撲排序 + 正向傳播（Kahn's Algorithm） |
| UI 元件 | Nuxt UI v3 + Tailwind CSS v4 |
| 設備資料 | `/src/data/devices.ts`（TypeScript 定義） |

### 2.2 資料流向

```
畫布操作（CR-01 / CR-02）
        │
        ▼  watch（deep）+ debounce 150ms
  FlowEngine（composable）
        │
        ├─ buildGraph()          ← 過濾 Error 節點，建立有向圖
        ├─ validateChains()      ← 反向 BFS 過濾非合法鏈路（P1-C ✅）
        ├─ topologicalSort()     ← Kahn's Algorithm，偵測環路
        ├─ propagateFlows()      ← 正向傳播，計算每條邊流量與每台設備效率
        └─ calcItemSummary()     ← 彙整品項生產 / 消耗 / 淨產量
        │
        ▼
  useFlowStore（Pinia）
        │
        ├─ 管線 overlay（FactoryCanvas）← 顯示 rate 數字與顏色
        ├─ 設備 overlay（FactoryCanvas）← 顯示效率 %
        └─ ProductionStats（右側面板） ← 統計表格
```

### 2.3 主要模組

```
src/
├─ composables/
│   └─ useFlowEngine.ts          ← FlowEngine 核心邏輯與 watch 觸發
├─ store/
│   └─ flowStore.ts              ← Pinia store，儲存計算結果
├─ data/
│   └─ devices.ts                ← 設備與配方定義（CR-01 主責，CR-04 唯讀）
├─ editor/
│   ├─ canvas/
│   │   └─ FactoryCanvas.vue     ← 管線與設備 overlay 顯示
│   └─ stats/
│       └─ ProductionStats.vue   ← 右側統計面板
└─ types/
    └─ flow.ts                   ← FlowEngine 相關型別定義
```

---

## 三、演算法說明

### 3.1 靜態流量分析總覽

FlowEngine 採**有向圖拓撲排序後正向傳播**，假設產線在穩定狀態下以最大可能效率運行。

#### Step 1：建立有向圖

- 節點（Node）= 已部署設備（PlacedDevice）
- 邊（Edge）= 管線連接（Connection），含方向（source port → target port）
- 過濾掉 `useValidationStore.hasBlockingError(uid)` 為 `true` 的節點與邊

#### Step 2：鏈路合法性驗證（詳見 3.2）

- 反向 BFS 過濾無法到達 sink 的孤立節點
- 配方品項符合性檢查（`validateRecipeMatch`）
- 非法節點正向污染傳播（`_propagateInvalidDownstream`）

#### Step 3：拓撲排序（Kahn's Algorithm）

```
入度為 0 的節點 → 加入佇列
依序處理 → 移除出邊 → 更新鄰接節點入度
若最終處理節點數 < 總節點數 → 偵測到環路 → 標記該子圖，略過
```

#### Step 4：正向傳播

從 source 節點（物品輸出口）開始，依拓撲順序計算：

1. **收集輸入流量**：取所有入邊的 `rate`（個/min）
2. **計算設備效率**：
   ```
   efficiency = min( 各輸入品項 supplied_rate / required_rate )
   ```
3. **計算輸出流量**（支援多輸出配方）：
   ```
   output_rate = recipe.output_rate_per_min × efficiency
   edge_rate   = Math.min(output_rate, BELT_RATE_LIMIT)  // 30/min 上限
   ```
4. **分流器（Splitter）**：輸入流量平均分配至各輸出（或依使用者設定比例）
5. **匯流器（Merger）**：各輸入流量加總後輸出

#### Step 5：堵塞反向傳播

```
上游 rate > 下游需求 → isCongested = true
反向更新上游實際輸出（actual = downstream_demand）
遞迴向更上游傳播縮減效果
```

#### Step 6：品項摘要

- `produced`：所有 source 輸出 + 設備生產量
- `consumed`：所有 sink 消耗 + 設備原料消耗量
- `net = produced - consumed`

### 3.4 鏈路合法性驗證（P1-C ✅）

在建圖（buildGraph）之後、拓撲排序之前執行，直接 mutate `FlowGraph`。

#### `validateChains(graph)` — C1

```
Step 1  收集所有 isValid=true 的 sink 節點作為 BFS 起點
Step 2  反向 BFS（從 sink 往上游走 inEdges）
          → 標記所有可以到達 sink 的節點至 reachableSinks
Step 3  未被標記的節點：node.isValid = false，加入 invalidSubgraphUids
Step 4  對仍合法（isValid=true）且非 source 的節點，呼叫 validateRecipeMatch：
          蒐集上游 outputRates（或 fallback 配方 outputs）推斷傳入品項種類
          配方不符 → node.isValid = false，加入 invalidSubgraphUids
Step 5  正向 BFS（_propagateInvalidDownstream）
          將配方不符節點的下游節點連帶標記為非法（防止污染後續流量計算）
          sink 節點不繼續向下傳播
```

#### `validateRecipeMatch(machineType, recipeIndex, incomingItemIds)` — C2

```typescript
// 規則：
// 1. 找不到配方定義            → false
// 2. 配方 inputs 為空（source）→ true
// 3. 配方每個 input.itemId 都必須存在於 incomingItemIds 中 → true/false
recipe.inputs.every((input) => incomingItemIds.has(input.itemId))
```

#### 非法節點對後續的影響

| 狀況 | 結果 |
|------|------|
| 孤立設備（無連接）| `invalidSubgraphUids`，畫布灰色虛線，不計入產值 |
| 配方品項不符 | 同上，且下游連帶非法 |
| CR-03 hasBlockingError | buildGraph 階段直接排除（`isValid=false`） |
| 環路子圖 | topologicalSort 後排除（P1-D 工項） |

### 3.3 靜態流量分析（穩態假設）

```
totalPowerDemand = Σ devices.power_cost（有效設備）
totalPowerSupply = Σ powerPlants.power_output
surplus = totalPowerSupply - totalPowerDemand
```

供電範圍判斷由 CR-03 負責；CR-04 只讀取已標記的 Error/Warning 狀態。

### 3.5 效率顏色編碼

| 效率區間 | 顏色 | Tailwind class |
|----------|------|----------------|
| 100% | 綠色 | `text-green-500` |
| 50%–99% | 黃色 | `text-yellow-400` |
| 1%–49% | 橘色 | `text-orange-400` |
| 0%（無輸入） | 灰色 | `text-gray-400` |

---

## 四、型別定義（`src/types/flow.ts`）✅ 已實作

### 常數

```typescript
export const BELT_RATE_LIMIT = 30; // 每條傳送帶連接線上限（個/min）
```

### 設備 / 配方型別

```typescript
type PortSide = 'left' | 'right' | 'top' | 'bottom';

interface PortDef { side: PortSide; offset: number }

interface MachineDef {
  name: string; width: number; height: number
  inputPorts: PortDef[]; outputPorts: PortDef[]
  power: number  // kW，-1 = 待補
  tags: string[]; isSource?: boolean; isSink?: boolean
}

interface RecipeItem  { itemId: string; quantity: number }
interface RecipeDef   { inputs: RecipeItem[]; outputs: RecipeItem[]; machine: string; timeSeconds: number }
interface ProductDef  { name: string; recipes: RecipeDef[] }
// 速率衍生公式：ratePerMin = quantity × (60 / timeSeconds)
```

### 圖結構型別

```typescript
interface EdgeMeta  { connectionUid: string; sourceDeviceUid: string; targetDeviceUid: string }

interface FlowNode {
  deviceUid: string; machineType: string; recipeIndex: number
  isSource: boolean; isSink: boolean
  isValid: boolean      // false = CR-03 Error / 非合法鏈路 / 配方不符
  efficiency: number    // 0~1
  outputRates: Map<string, number>  // 支援多輸出配方
  inputRates:  Map<string, number>
}

interface FlowGraph {
  nodes: Map<string, FlowNode>
  outEdges: Map<string, string[]>   // deviceUid → connectionUid[]
  inEdges:  Map<string, string[]>
  edgeMeta: Map<string, EdgeMeta>
  hasCycle: boolean
  invalidSubgraphUids: Set<string>  // 孤立 / 環路 / 非法鏈路節點
}
```

### 計算結果型別

```typescript
interface EdgeFlow {
  connectionUid: string; itemId: string
  rate: number          // 個/min，已套用 BELT_RATE_LIMIT
  isCongested: boolean  // 上游供給 > 下游需求
}

interface ItemSummary {
  itemId: string; name: string
  produced: number; consumed: number
  net: number           // produced - consumed（正 = 盈餘，負 = 不足）
  efficiency: number    // 0~1
}
```

---

## 五、Pinia Store 設計（`src/store/flowStore.ts`）✅ 已實作

### State（全部 `ref`）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `edgeFlows` | `Map<string, EdgeFlow>` | connectionUid → 管線流量 |
| `nodeEfficiencies` | `Map<string, number>` | deviceUid → 效率 0~1 |
| `itemSummary` | `ItemSummary[]` | 品項生產/消耗/淨產量/效率 |
| `congestedEdges` | `Set<string>` | 堵塞的 connectionUid |
| `invalidChainUids` | `Set<string>` | 非合法鏈路節點 deviceUid |
| `totalPowerDemand` | `number` | 總耗電量（kW） |
| `totalPowerSupply` | `number` | 總供電量（kW） |
| `isCalculating` | `boolean` | 計算中 flag |
| `lastCalculatedAt` | `number` | 完成時間戳（ms），0 = 尚未計算 |

### Computed

| 欄位 | 說明 |
|------|------|
| `powerBalance` | `totalPowerSupply - totalPowerDemand`（正=盈餘，負=不足） |
| `hasPowerShortage` | 電力不足 boolean |
| `edgeFlowCount` | 有效管線數量 |
| `congestedEdgeCount` | 堵塞管線數量 |
| `invalidChainCount` | 非合法鏈路節點數量 |
| `hasResults` | 是否有合法鏈路計算結果（供空白狀態判斷） |

### Actions

```typescript
// 清空所有計算結果（保留 lastCalculatedAt 歷史）
reset(): void

// 批次寫入計算結果，一次性更新避免多次觸發響應式
// 完成後自動設定 lastCalculatedAt = Date.now() 並關閉 isCalculating
applyResult(payload: {
  edgeFlows: Map<string, EdgeFlow>
  nodeEfficiencies: Map<string, number>
  itemSummary: ItemSummary[]
  congestedEdges: Set<string>
  invalidChainUids: Set<string>
  totalPowerDemand: number
  totalPowerSupply: number
}): void
```

> Phase 2 新增：`ticketRates: Map<string, number>`、`ticketTotal`、`warehouseCapacity` 留待 I1–I7 工項實作。

---

## 六、右側統計面板規格

`ProductionStats.vue` 顯示三個區塊：

### 區塊一：整體電力統計
```
總耗電量：  XXX kW
總供電量：  YYY kW
電力狀態：  ✅ 盈餘 ZZZ kW  /  ⚠️ 不足 ZZZ kW
設備數量：  XX 台（含 X 台有 Error）
管線數量：  XX 條
```

### 區塊二：產出摘要表
| 品項 | 生產（/min） | 消耗（/min） | 淨產量（/min） | 效率 |
|------|-------------|-------------|---------------|------|
| 依實際配置動態產生 |

- 淨產量 > 0：綠色
- 淨產量 < 0：紅色
- 淨產量 = 0：灰色

### 區塊三：調度券兌換效率（Phase 2）
```
調度券預估產出：XXX 券/hr
  └ 品項A × rate/min → YY 券/hr
```

### 區塊四：倉庫填滿預估（Phase 2）
```
倉庫預估（容量：XXXX 格）
  品項A：約 X.X 小時填滿
```

---

## 七、開發版本紀錄

| 版本 | 日期 | 說明 |
|------|------|------|
| v0.1 | 2026-05-18 | 初版文件建立，規劃 Phase 1 開發架構 |
| v0.2 | 2026-05-18 | P1-A：建立 `src/types/flow.ts`（完整型別定義）、`src/data/devices.ts`（14 台設備 stub + 20 配方 + 查詢 API） |
| v0.3 | 2026-05-18 | P1-B：建立 `src/store/flowStore.ts`（Pinia store，含 State / Computed / `reset()` / `applyResult()`） |
| v0.4 | 2026-05-18 | P1-C：建立 `useFlowEngine.ts`，實作 `validateChains()`（反向 BFS × 5 步驟）與 `validateRecipeMatch()` |

---

## 八、參考文件

- [spec/04_flow_simulation.md](../../spec/04_flow_simulation.md) — 官方 Feature Spec
- [spec/00_top_spec.md](../../spec/00_top_spec.md) — 系統 Top Spec
- [spec/03_validation.md](../../spec/03_validation.md) — 警示系統（CR-03，提供 Error 狀態）
