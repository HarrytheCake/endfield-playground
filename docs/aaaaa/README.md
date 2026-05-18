# CR-04｜基礎流量估算（即時重算、右側統計面板、總耗電量顯示）

**負責人：** aaaaa  
**階段：** Phase 1（基礎估算）/ Phase 2（調度券效率）  
**依賴 CR：** CR-01（設備擺放）、CR-02（管線連接）、CR-03（警示與 Error 狀態）  
**文件版本：** v0.1  
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
        ├─ buildGraph()         ← 過濾 Error 節點
        ├─ topologicalSort()    ← Kahn's Algorithm，偵測環路
        ├─ propagateFlows()     ← 正向傳播，計算每條邊流量與每台設備效率
        └─ calcItemSummary()    ← 彙整品項生產 / 消耗 / 淨產量
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

### 3.1 靜態流量分析（穩態假設）

FlowEngine 採**有向圖拓撲排序後正向傳播**，假設產線在穩定狀態下以最大可能效率運行。

#### Step 1：建立有向圖

- 節點（Node）= 已部署設備（PlacedDevice）
- 邊（Edge）= 管線連接（Connection），含方向（source port → target port）
- 過濾掉 `useValidationStore.hasBlockingError(uid)` 為 `true` 的節點與邊

#### Step 2：拓撲排序（Kahn's Algorithm）

```
入度為 0 的節點 → 加入佇列
依序處理 → 移除出邊 → 更新鄰接節點入度
若最終處理節點數 < 總節點數 → 偵測到環路 → 標記該子圖，略過
```

#### Step 3：正向傳播

從 source 節點（無輸入接口的礦機、種植機等）開始，依拓撲順序計算：

1. **收集輸入流量**：取所有入邊的 `rate`（個/min）
2. **計算設備效率**：
   ```
   efficiency = min( 各輸入品項 supplied_rate / required_rate )
   ```
3. **計算輸出流量**：
   ```
   output_rate = recipe.output_rate_per_min × efficiency
   ```
4. **分流器（Splitter）**：輸入流量平均分配至各輸出（或依使用者設定比例）
5. **匯流器（Merger）**：各輸入流量加總後輸出

#### Step 4：品項摘要

- `produced`：所有 source 輸出 + 設備生產量
- `consumed`：所有 sink 消耗 + 設備原料消耗量
- `net = produced - consumed`

### 3.2 電力計算

```
totalPowerDemand = Σ devices.power_cost（有效設備）
totalPowerSupply = Σ powerPlants.power_output
surplus = totalPowerSupply - totalPowerDemand
```

供電範圍判斷由 CR-03 負責；CR-04 只讀取已標記的 Error/Warning 狀態。

### 3.3 效率顏色編碼

| 效率區間 | 顏色 | Tailwind class |
|----------|------|----------------|
| 100% | 綠色 | `text-green-500` |
| 50%–99% | 黃色 | `text-yellow-400` |
| 1%–49% | 橘色 | `text-orange-400` |
| 0%（無輸入） | 灰色 | `text-gray-400` |

---

## 四、Pinia Store 設計

### `useFlowStore`（`src/store/flowStore.ts`）

```typescript
interface FlowStore {
  // 計算結果
  edgeFlows: Map<string, EdgeFlow>           // connectionUid → 流量
  nodeEfficiencies: Map<string, number>      // deviceUid → 效率 0~1
  itemSummary: ItemSummary[]                 // 品項摘要
  totalPowerDemand: number                   // 總耗電量（kW）
  totalPowerSupply: number                   // 總供電量（kW）

  // Phase 2
  ticketRates: Map<string, number>           // itemId → 券/hr 兌換率
  ticketTotal: number | null                 // 總調度券/hr
  warehouseCapacity: number | null           // 倉庫容量（格）

  // 元資料
  lastCalculatedAt: number                   // timestamp（ms）
  isCalculating: boolean                     // 計算中 flag
}
```

### 型別定義（`src/types/flow.ts`）

```typescript
interface EdgeFlow {
  connectionUid: string
  itemId: string
  rate: number          // 個/min
}

interface ItemSummary {
  itemId: string
  name: string
  produced: number      // 個/min
  consumed: number      // 個/min
  net: number           // produced - consumed
  efficiency: number    // 0~1（上游瓶頸）
}
```

---

## 五、右側統計面板規格

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

## 六、開發版本紀錄

| 版本 | 日期 | 說明 |
|------|------|------|
| v0.1 | 2026-05-18 | 初版文件建立，規劃 Phase 1 開發架構 |

---

## 七、參考文件

- [spec/04_flow_simulation.md](../../spec/04_flow_simulation.md) — 官方 Feature Spec
- [spec/00_top_spec.md](../../spec/00_top_spec.md) — 系統 Top Spec
- [spec/03_validation.md](../../spec/03_validation.md) — 警示系統（CR-03，提供 Error 狀態）
