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

### V7 資料 v3 遷移（2026-08-01）

**目標**：對齊 `data_1` schema v3；同版更新 types、`src/data`、FlowEngine 最小支援。

**定案摘要**：
- Port 媒質：`belt`｜`pipe`（廢止執行期依賴 `item`｜`liquid`）
- 機器：`modes[]`；節點 `data.machineMode`（缺省 `modes[0].id`）
- `loss`：進型別與資料；**不**算進 `itemSummary`
- 資料流：`data_1` → `pnpm sync:aaaaa-data` → `docs/aaaaa/data` → `pnpm generate:src-data` → `src/data`

**FlowEngine**：
- `resolveMachineMode` + `getRecipesForMachine(type, mode)` 再取 `recipeIndex`
- handle 齊全時檢查 belt↔pipe；錯接則該邊／節點視為非法
- 測試：`flowEngine.v7.modeMedia.test.ts`；`/dev/flow-engine` V7 群組

**技術文件**：[todolist_v7.md](./dev/todolist_v7.md)｜[dev_v7/](./dev/dev_v7/)

### V8 Dev 預覽＋引擎規則（✅ 實作完成 A–G，2026-08-02）

- `/dev/flow-engine` 機器／產品分頁（placeholder 視覺）
- 單埠單線；H8 匯流＋堵塞回推 15／15；belt 30／pipe 60
- `form`（ItemForm）：solid→belt、liquid／gas→pipe；引擎 `isItemFormMediaMismatch`
- 驗證僅 FlowEngine（CR-04 先行）；CR-02 UI 拒絕／正式圖／loss→summary 本版不做
- 測試：`flowEngine.v8.portCardinality|rateLimits|h8Merger|formMedia.test.ts`

**技術文件**：[todolist_v8.md](./dev/todolist_v8.md)｜[dev_v8/](./dev/dev_v8/)

### V9 強化視覺化預覽工具（✅ 實作完成 A–G，2026-08-02）

- **V6 已完成／解鎖**
- modes-only 埠；`products.json`／`materials.json` 分離；停止假產品注入
- 「基礎材料輸出點」（form→belt／pipe）；物品輸出口僅固體；總產值＝物品輸入口
- `findShortestReverseChain`（`src/utils/reverseChain.ts`）；息壤選短鏈
- `matchRecipeByInputs`：輸入種類完全吻合；不齊無產出；同集合取資料順序第一
- 機器 tag 分頁；WxH 格點拓樸；F1 盤點＋F2（V9 preset／最短鏈套用）

**技術文件**：[todolist_v9.md](./dev/todolist_v9.md)｜[dev_v9/](./dev/dev_v9/)

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
| `src/composables/useFlowEngine.ts` | **CR-04 主責**：FlowEngine（含 `matchRecipeByInputs`） |
| `src/utils/reverseChain.ts` | **CR-04 主責**：V9 最短反向鏈路 |
| `src/store/flowStore.ts` | **CR-04 主責**：Pinia store，儲存計算結果 |
| `src/types/flow.ts` | **CR-04 主責**：FlowEngine 型別定義 |
| `src/editor/stats/ProductionStats.vue` | **CR-04 主責**：右側統計面板 |
| `src/editor/canvas/FactoryCanvas.vue` | **CR-04 參與**：管線 / 設備 overlay 顯示 |
| `src/data/machines.ts` | **CR-04 暫維護（codegen）**：機器（modes-only 埠） |
| `src/data/products.ts` | **CR-04 暫維護（codegen）**：產品配方（不含材料假產品） |
| `src/data/materials.ts` | **CR-04 暫維護（codegen）**：基礎材料＋form |
| `src/data/environments.ts` | **CR-04 暫維護（codegen）**：環境標籤 |
| `src/types/machine.ts` | **CR-04 主責**：`PortMedia`、`MachineMode`、`loss` |
| `src/store/editorStore.ts` | **CR-01 主責，CR-04 監聽**：畫布設備與管線狀態 |
| `src/types/graph.ts` | 通用圖節點（`machineMode`／`primaryOutput`／`environment`） |
| `src/types/editor.ts` | 編輯器通用型別 |
| `src/app/dev/FlowEngineTest.vue` | Dev 引擎測試（H／V7／V9 preset） |

### 不可修改的邊界

| 檔案 / 模組 | 主責 CR | CR-04 應對待方式 |
|-------------|---------|-----------------|
| `src/data/machines.ts`／`products.ts` 結構決策 | CR-01 長期主責 | V7 由 CR-04 codegen；結構變更須協商 |
| `src/store/editorStore.ts` | CR-01 | 唯讀 watch，不新增欄位（`machineMode` 在 node.data） |
| 管線 / 連接狀態 | CR-02 | 唯讀 watch |
| Error / Warning 狀態 | CR-03 | 呼叫 `useValidationStore`，不修改 |
| `docs/` 其他協作者資料夾 | 各自負責 | **嚴禁修改** |

---

## 📐 核心演算法摘要

```
runFlowEngine()
  ├─ buildGraph()         過濾 Error；Source 用 primaryOutput；一般機不預填 rates
  ├─ validateChains()     反向 BFS + matchRecipeByInputs + PortMedia／form
  ├─ topologicalSort()    Kahn's Algorithm；偵測環路則略過該子圖
  ├─ propagateFlows()     正向傳播（V9：依正流量品項再匹配配方）
  │    ├─ source          primaryOutput × sourceRatePerMin（預設 30）
  │    ├─ normal device   match → efficiency = min(supplied/required)
  │    ├─ splitter／merger 透傳／匯流
  │    └─ 無匹配          efficiency=0、無產出
  └─ calcItemSummary()    produced / consumed / net（不含 mode.loss）
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
| V7：正確 mode＋pipe 氣態鏈 | 合法計算；配方依 machineMode |
| V7：錯誤 machineMode | 無對應配方／鏈路非法 |
| V7：belt↔pipe 錯接 | 兩端 invalid |
| V7：mode.loss 有資料 | itemSummary **不含** loss 扣減 |

---

## 🔗 跨 CR 介面契約

### 從 CR-01 讀取（設備資料）
```typescript
// 預期從 useEditorStore 取得
const devices: PlacedDevice[]   // 已擺放設備列表；node.data.machineMode 可選
// 預期從 src/data/machines.ts / products.ts 取得
const machine = getMachineById(machineType: string)
// MachineDef 含：modes[]（ports.media: belt|pipe、loss?）、power 等
// 配方：getRecipesForMachine(machineType, machineMode) → RecipeDef[]
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
| V5 | L1 完成後的開發者支援與測試基礎設施 | [todolist_v5.md](./dev/todolist_v5.md) / [dev_v5/](./dev/dev_v5/) | ✅ CR-04 交付完成（跨 CR 封鎖追蹤中） |
| V6 | 拖曳移動進歷史堆疊（MILESTONE_0726） | [todolist_v6.md](./dev/todolist_v6.md) / [dev_v6/](./dev/dev_v6/) | ✅ 完成／已解鎖 |
| **V7** | **資料 v3 遷移（modes／belt·pipe／machineMode）** | [todolist_v7.md](./dev/todolist_v7.md) / [dev_v7/](./dev/dev_v7/) | ✅ 完成 |
| **V8** | **Dev 預覽＋埠一對一／pipe60／H8／form** | [todolist_v8.md](./dev/todolist_v8.md) / [dev_v8/](./dev/dev_v8/) | ✅ 實作完成（A–G） |
| **V9** | **強化視覺化預覽工具** | [todolist_v9.md](./dev/todolist_v9.md) / [dev_v9/](./dev/dev_v9/) | ✅ 實作完成（A–G） |

### 開發文件索引

**L1 層 API 文件（必讀）**：
- [L1 API Reference](./L1_API_REFERENCE.md) — 6 個 stores 完整 API
- [FlowEngine Guide](./FLOW_ENGINE_GUIDE.md) — 流量引擎使用指南
- [L1 PR 總結](./L1_PR.md) — L1 層完成總結

**V5 開發者支援文件**：
- [V5 總覽](./dev/todolist_v5.md) — V5 工項清單
- [V5 開發文件資料夾](./dev/dev_v5/) — 15 份技術文件

**V7 資料遷移**：
- [V7 總覽](./dev/todolist_v7.md) — V7 工項清單
- [V7 開發文件資料夾](./dev/dev_v7/) — A–G 細項
- 指令：`pnpm sync:aaaaa-data`、`pnpm generate:src-data`

**V8（實作完成）**：
- [V8 總覽](./dev/todolist_v8.md) — 工項清單（A–G）
- [V8 開發文件資料夾](./dev/dev_v8/) — A–G 細項
- 定案：[A1_scope_decision.md](./dev/dev_v8/A1_scope_decision.md)

**V9（實作完成＋H1）**：
- [V9 總覽](./dev/todolist_v9.md) — 工項清單（A–G＋H1）
- [V9 開發文件資料夾](./dev/dev_v9/) — A–G／H1 細項
- 定案：[A1_scope_decision.md](./dev/dev_v9/A1_scope_decision.md)
- 關鍵碼：`src/utils/reverseChain.ts`、`matchRecipeByInputs`／`matchRecipeByEdgeCandidates`（`useFlowEngine.ts`）

**V6～V9 協作者文件（2026-08-02）**：
- [MILESTONE_0802_V6_V9_REPORT.md](./MILESTONE_0802_V6_V9_REPORT.md) — 彙總報告
- [CR04_FOR_COLLABORATORS.md](./CR04_FOR_COLLABORATORS.md) — 使用方式＋下一步
- [DATA_FORMAT_GUIDE.md](./DATA_FORMAT_GUIDE.md) — 資料格式

**V6（完成）**：
- [V6 總覽](./dev/todolist_v6.md) — 已解鎖
- [MILESTONE_0726.md](./MILESTONE_0726.md) — §0 結案回應

**產品 Roadmap（2026-08-23 → 11-29，規劃完成待執行）**：
- [ROADMAP_OUTLINE.md](../roadmap/ROADMAP_OUTLINE.md) — 大綱：22 個工項、週曆、封鎖追蹤（**公開**）
- [roadmap/detail/](../roadmap/detail/) — 各工項細項（A1–A4／B1–B5／C1–C5／D1–D5／E1–E2；**公開**）
- [work_dispatch/](../work_dispatch/) — 每週派工與各人工單（**公開**）
- 決策層（未進版控，見 `docs/aaaaa/collaborator_survey/`）：Agent 操作文檔 `dispatch_private/AGENT_ROADMAP.md`、上游 ROADMAP v0.2、問卷與 commit 分析、個人檔與風險矩陣、E3 人力調度、派工複查報告

詳見下方 §產品 Roadmap 文件。

---

## 🗺️ 產品 Roadmap 文件（docs/roadmap/）

`docs/roadmap/` 為 **2026-08-23 → 11-29 產品 roadmap 的執行文件**，結構與 `dev/` 相同（大綱 ↔ 細項資料夾），但主題是**跨團隊的階段交付與派工**，不是單一版本的技術實作。2026-08-23 起它與 `docs/work_dispatch/` 一併移出個人資料夾，改放 `docs/` 根層，全員可讀。

| 檔案 | 職責 |
|------|------|
| [ROADMAP_OUTLINE.md](../roadmap/ROADMAP_OUTLINE.md) | 大綱：工項總表、群組、週曆、封鎖追蹤、DoD；**不寫長篇技術細節** |
| [roadmap/detail/](../roadmap/detail/) | 21 份工項細項：背景、決策、檔案計畫、週切片、DoD、風險頂替 |
| [work_dispatch/](../work_dispatch/) | 每週派工大綱與各人工單 |
| `collaborator_survey/dispatch_private/AGENT_ROADMAP.md` | **Agent 操作文檔**：讀檔順序、硬規則、常見任務流程、常見誤判（決策層，未進版控） |

**Agent 若要協助 roadmap 相關工作（產週工單、執行工項、回報進度），先讀 `dispatch_private/AGENT_ROADMAP.md`，不要直接翻 21 份細項。**

**公開／未公開分界：** `docs/roadmap/` 與 `docs/work_dispatch/` 是全員可讀的公開文件，**不得**寫入或連結問卷、commit 分析、個人檔、風險等級與查勤名單；那些一律留在 `docs/aaaaa/collaborator_survey/`（已 gitignore）。

| 群組 | 里程碑 | 主題 | 擋門檻的必要工項 |
|------|--------|------|------------------|
| R-A | 2026-08-30 | 對齊：能打開、能放一台、佔格與資料一致 | A1、A2 |
| R-B | 2026-09-27 | 擺放：真機器選單、擺放鏈、旋轉、資訊、單刪 | B1、B2、B4 |
| R-C | 2026-10-25 | 連線：port 對 port、90 度彎折、拖移、源素材 | C1、C2、C3、C5 |
| R-D | 2026-11-29 | 串通：右側產耗、重疊與配方警訊、JSON 存讀 | D1、D2、D4、D5 |
| R-E | 跨月 | 支撐：codegen 維運、三層守門、風險備援 | — |

**與 CR-04 的關係：** aaaaa 在本輪主責 R-A2（佔格／port 對資料）、R-C5／R-D1／R-D4（引擎與 IO 側），並為 R-C2、R-D3 提供共用純函式。上游來源為主編已確認的 ROADMAP v0.2（決策層文件，未進版控）。
