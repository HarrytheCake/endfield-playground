# CR-04 Agent 自定義代理工具

**用途：** 提供給 AI 輔助開發工具（如 GitHub Copilot、Claude 等）閱讀的快速上下文文件，  
讓 Agent 能在沒有完整閱讀所有 spec 的情況下，精準協助 CR-04 相關開發。

---

## 🤖 Agent 快速上下文

### 你正在協助的工作

這是「明日方舟：終末地 集成工業模擬器」的 **CR-04 流量估算模組**。  
你的任務是協助開發 **FlowEngine**：一個靜態流量分析引擎，計算產線穩態產能並顯示於畫布與右側統計面板。

### 專案技術棧
- **Vue 3** Composition API（`<script setup>`）
- **Vite** + TypeScript
- **Pinia** 狀態管理
- **VueUse**（`useDebounceFn`、`useLocalStorage`）
- **Nuxt UI v3** + **Tailwind CSS v4**
- **Vue Flow**（畫布節點連線）

### 關鍵檔案位置

| 檔案 | 說明 |
|------|------|
| `src/composables/useFlowEngine.ts` | **CR-04 主責**：FlowEngine 核心邏輯 |
| `src/store/flowStore.ts` | **CR-04 主責**：Pinia store，儲存計算結果 |
| `src/types/flow.ts` | **CR-04 主責**：FlowEngine 型別定義 |
| `src/editor/stats/ProductionStats.vue` | **CR-04 主責**：右側統計面板 |
| `src/editor/canvas/FactoryCanvas.vue` | **CR-04 參與**：管線 / 設備 overlay 顯示 |
| `src/data/devices.ts` | **CR-01 主責，CR-04 唯讀**：設備與配方資料 |
| `src/store/editorStore.ts` | **CR-01 主責，CR-04 監聽**：畫布設備與管線狀態 |
| `src/types/graph.ts` | 通用圖節點型別（Vue Flow） |
| `src/types/editor.ts` | 編輯器通用型別 |

### 不可修改的邊界

| 檔案 / 模組 | 主責 CR | CR-04 應對待方式 |
|-------------|---------|-----------------|
| `src/data/devices.ts` | CR-01 | 唯讀引入，不修改結構 |
| `src/store/editorStore.ts` | CR-01 | 唯讀 watch，不新增欄位 |
| 管線 / 連接狀態 | CR-02 | 唯讀 watch |
| Error / Warning 狀態 | CR-03 | 呼叫 `useValidationStore`，不修改 |
| `docs/` 其他協作者資料夾 | 各自負責 | **嚴禁修改** |

---

## 📐 核心演算法摘要

```
runFlowEngine()
  ├─ buildGraph()         過濾 Error 節點（useValidationStore.hasBlockingError）
  ├─ topologicalSort()    Kahn's Algorithm；偵測環路則略過該子圖
  ├─ propagateFlows()     正向傳播
  │    ├─ source nodes    直接輸出 recipe.output_rate_per_min
  │    ├─ normal device   efficiency = min(supplied/required); output = recipe_rate × efficiency
  │    ├─ splitter        input ÷ output_count（或依比例）
  │    └─ merger          Σ inputs
  └─ calcItemSummary()    produced / consumed / net
```

**流量單位：** 個/分鐘（`rate_per_min`）  
**觸發：** `watch([devices, connections], useDebounceFn(runFlowEngine, 150), { deep: true })`

---

## 🏗️ 型別速查

```typescript
// src/types/flow.ts

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
  efficiency: number    // 0~1
}

interface FlowStore {
  edgeFlows: Map<string, EdgeFlow>
  nodeEfficiencies: Map<string, number>
  itemSummary: ItemSummary[]
  totalPowerDemand: number
  totalPowerSupply: number
  lastCalculatedAt: number
  isCalculating: boolean
}
```

---

## ✅ 效率顏色規則

```typescript
function efficiencyColor(e: number): string {
  if (e >= 1.0) return 'text-green-500'
  if (e >= 0.5) return 'text-yellow-400'
  if (e > 0)    return 'text-orange-400'
  return 'text-gray-400'  // 0% 或略過
}
```

---

## 🧪 驗證情境速查

| 情境 | 預期結果 |
|------|----------|
| 礦機 → 熔爐，供料充足 | 熔爐效率 100%，管線顯示正確速率 |
| 礦機速率 < 熔爐需求 | 熔爐效率 = 礦機速率 / 熔爐需求 |
| 設備有 Error（CR-03 標記） | 該設備與其下游顯示灰色，不顯示數值 |
| 分流器 | 兩側輸出各 = 輸入 ÷ 2 |
| 電力盈餘 | ProductionStats 顯示「✅ 盈餘 ZZZ kW」 |
| 電力不足 | ProductionStats 顯示「⚠️ 不足 ZZZ kW」 |
| 環路 | 偵測後略過該子圖，其餘正常計算 |

---

## 🔗 跨 CR 介面契約

### 從 CR-01 讀取（設備資料）
```typescript
// 預期從 useEditorStore 取得
const devices: PlacedDevice[]   // 已部署設備列表
// 預期從 src/data/devices.ts 取得
const deviceDef = getDeviceDef(deviceId: string): DeviceDef
// DeviceDef 必須含：power_cost, power_output?, ports[], recipes[]
// Recipe 必須含：inputs[].{ itemId, rate_per_min }, outputs[].{ itemId, rate_per_min }
```

### 從 CR-02 讀取（管線資料）
```typescript
// 預期從 usePipelineStore（或 useEditorStore.edges）取得
const connections: Connection[]
// Connection 必須含：uid, sourceDeviceUid, sourcePortId, targetDeviceUid, targetPortId
```

### 從 CR-03 讀取（警示狀態）
```typescript
// 呼叫方式
const validation = useValidationStore()
validation.hasBlockingError(uid: string): boolean
```

### 輸出至畫布（供 CR-01 / CR-02 消費）
```typescript
const flow = useFlowStore()
flow.edgeFlows.get(connectionUid)       // 管線流量
flow.nodeEfficiencies.get(deviceUid)    // 設備效率
```

---

## 📋 開發優先序

```
A（型別）→ B（Store）→ C（演算法）→ D（Watch）→ E（Canvas overlay）→ F（統計面板）→ G（測試）
```

Phase 1 完成後再進行 Phase 2（調度券 / 倉庫預估）。

詳細工項見 [TODOLIST.md](./TODOLIST.md)。
