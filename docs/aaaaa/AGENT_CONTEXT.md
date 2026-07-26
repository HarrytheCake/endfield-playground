# CR-04 Agent 自定義代理工具

**用途：** 提供給 AI 輔助開發工具（如 GitHub Copilot、Claude 等）閱讀的快速上下文文件，  
讓 Agent 能在沒有完整閱讀所有 spec 的情況下，精準協助 CR-04 相關開發。

---

## 🤖 Agent 快速上下文

### 你正在協助的工作

這是「明日方舟：終末地 集成工業模擬器」的 **CR-04 流量估算模組**。  
你的任務是協助開發 **FlowEngine**：一個靜態流量分析引擎，計算產線穩態產能並顯示於畫布與右側統計面板。

### L1 完成狀態（2026-06-01）

**L1 基礎建設層已完成**，包含：
- ✅ CR-04 FlowEngine 核心（V1–V4 完成）
  - 靜態流量分析引擎
  - 拓撲排序 + 環路偵測
  - 效率計算 + 堵塞偵測
  - 電力盈缺統計
- ✅ CR-08 historyStore（Command Pattern）
  - Undo/Redo 機制
  - 8 個高階 actions 自動進歷史
- ✅ CR-01 + CR-02 editorStore（8 個高階 actions）
- ✅ CR-03 validationStore 骨架（detector 註冊機制）
- ✅ Tests（197 個案例）
  - FlowEngine：126 個
  - historyStore：41 個
  - editorStore：18 個
  - validationStore：12 個

**文件輸出**：
- [L1 PR 總結](./L1_PR.md)
- [L1 API Reference](./L1_API_REFERENCE.md)
- [FlowEngine Guide](./FLOW_ENGINE_GUIDE.md)

---

### V5 開發者支援與測試基礎設施（2026-06-06）

**目標**：為 L2/L3 開發者提供完整的開發輔助工具與文件

**完成項目**：

#### A 群組：Dev-Only 測試頁面
- ✅ FlowEngine 測試頁面（H1–H6 preset）
- ✅ 圖結構視覺化頁面（Mermaid 輸出）
- ✅ 歷史回放頁面（undo/redo 測試）

#### B 群組：幾何與驗證工具
- ✅ geometryUtils 實作（getOccupiedCells、cellsOverlap、isWithinBaseRegion、isDeviceWithinBaseRegion）
- ✅ ValidationContext 完整性（新增 baseRegion 欄位）
- ✅ E001 Detector 範例（設備重疊檢測）

#### C 群組：開發者文件與 API 說明
- ✅ L1 API Reference（21 KB，6 個 stores 完整 API）
- ✅ FlowEngine 使用指南（23 KB，含 4 個 L3 範例）
- ✅ L2 README 更新（harry + toby 各 12 KB）

#### D 群組：跨 CR 協調追蹤
- ✅ CR-01 machineType 遷移追蹤（等待 CR-01）
- ✅ History format-check 追蹤（等待 History CR）
- ✅ Detector 開發 Checklist（給 shirone）

**技術文件**：[dev_v5/](./dev/dev_v5/) 資料夾（15 份文件）

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

### src/types/flow.ts

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

### src/types/validation.ts（V5-B2）

```typescript
interface ValidationContext {
  devices: PlacedDevice[];          // 所有已擺放設備
  connections: Connection[];        // 所有管線連接
  getDef: (machineType: string) => MachineDef | undefined;  // 查詢設備定義
  baseRegion: BaseRegion;           // 'wuling' | 'valley4' | null
}
```

**組裝位置**：`src/composables/useValidation.ts`  
**消費者**：所有 Detectors（E001–E006）

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

---

## 📁 開發文件規範（dev/ 資料夾）

每次啟動新的開發版本（如資料結構重構、功能擴充、效能優化），須在 `docs/aaaaa/dev/` 下建立以下兩份文件：

### dev_VN.md — 技術細節文件

| 章節 | 內容 |
|------|------|
| `## 1. 背景與動機` | 說明為何需要此版本，目標是什麼 |
| `## 2. 技術決策` | 列出關鍵設計決策、方案比較表與選擇理由 |
| `## 3. 型別設計` | 新增或修改的 TypeScript 介面 / 型別，附完整 code block |
| `## 4. 檔案修改計畫` | 以表格列出新建 / 修改 / 不動的檔案與說明 |
| `## 5. 遷移說明` | 舊格式 → 新格式的轉換規則（如有資料遷移需求） |
| `## 6. 開發日誌` | 以**日期倒序**記錄每次開發決策、Bug 修正、設計更動 |

### todolist_VN.md — 工項核查清單

| 格式規則 | 說明 |
|---------|------|
| 工項群組 `V<N>-<字母>` | 例如 `V1-A`、`V1-B`，按依賴順序排列 |
| 單項 `V<N>-<字母><數字>` | 例如 `V1-A1`、`V1-A2`，描述具體實作細節 |
| 狀態標記 | `[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中 |
| 封鎖項目 | 必須填入「封鎖項目追蹤」表格，記錄封鎖原因與等待對象 |

### 現有版本索引

| 版本 | 主題 | 文件 | 狀態 |
|------|------|------|------|
| V1 | Machine 物件動態化重構 | [dev_v1.md](./dev/dev_v1.md) / [todolist_v1.md](./dev/todolist_v1.md) | ✅ 完成 |
| V2 | 調度券兌換效率與倉庫填滿預估 | [dev_v2.md](./dev/dev_v2.md) / [todolist_v2.md](./dev/todolist_v2.md) | ✅ 完成 |
| V3 | 技術債修正 | [dev_v3.md](./dev/dev_v3.md) / [todolist_v3.md](./dev/todolist_v3.md) | ✅ 完成 |
| V4 | 主編 0526 介面設計建議修正 | [dev_v4.md](./dev/dev_v4.md) / [todolist_v4.md](./dev/todolist_v4.md) | ✅ 完成 |
| **V5** | **L1 完成後的開發者支援與測試基礎設施** | [todolist_v5.md](./dev/todolist_v5.md) / [dev_v5/](./dev/dev_v5/) | ⚠️ 進行中 |

### 開發文件索引

**L1 層 API 文件（必讀）**：
- [L1 API Reference](./L1_API_REFERENCE.md) — 6 個 stores 完整 API
- [FlowEngine Guide](./FLOW_ENGINE_GUIDE.md) — 流量引擎使用指南
- [L1 PR 總結](./L1_PR.md) — L1 層完成總結

**V5 開發者支援文件**：
- [V5 總覽](./dev/todolist_v5.md) — V5 工項清單
- [V5 開發文件資料夾](./dev/dev_v5/) — 15 份技術文件
