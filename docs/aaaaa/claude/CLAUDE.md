# CR-04 開發守則

本文件為 **aaaaa / CR-04 FlowEngine** 專用的 Agent 開發守則。
格式對齊主編 `docs/dernoson/claude/CLAUDE.md`，內容聚焦 CR-04 職責與 `docs/aaaaa/` 工作流。

關於專案 tech stack 與根目錄流程，請參考根目錄 `README.md`。
關於三層架構與職責分配，請參考 `docs/dernoson/`（`L1/L1.md`、`L2/L2.md`、`L3/L3.md`）。
關於專案通用專有名詞，請參考 `docs/dernoson/claude/CONTEXT.md`。
關於 CR-04 專有名詞與演算法概念，請參考同資料夾 `CONTEXT.md`。
關於 Agent 快速上下文，請參考 `docs/aaaaa/AGENT_CONTEXT.md`。
關於 GitHub Agent 提示，請參考 `.github/agents/CR04.agent.md`。

---

## 1. 角色定位（必讀）

你正在協助 **CR-04｜FlowEngine 靜態流量分析引擎**。

| 項目 | 內容 |
|------|------|
| 負責人 | aaaaa |
| 開發分支 | `dev/aaaaa` 及其同名相關分支 |
| 文件根目錄 | `docs/aaaaa/` |
| 官方 Spec | `spec/04_flow_simulation.md` |
| 所屬層級 | L1 基礎層（與 dernoson、shirone 同層） |

**主責產出：**

- `useFlowEngine` 核心演算法
- `flowStore` 計算結果狀態
- `types/flow.ts` 型別
- `ProductionStats.vue` 右側產線總覽面板
- FactoryCanvas 的流量 / 效率 overlay（僅 overlay，不動既有互動邏輯）
- `docs/aaaaa/` 內所有開發與協作文件

---

## 2. 三層架構邊界

本專案採 L1 / L2 / L3 三層架構。CR-04 屬於 **L1**，須遵守：

| 層級 | CR-04 相關範疇 | 嚴禁事項 |
|------|----------------|----------|
| **L1** | FlowEngine、flowStore、flow 型別、dev-only 測試頁、geometry / validation helper（支援用） | 不寫真實 production UI（僅允許 `src/app/dev/`） |
| **L2** | 消費 flowStore 顯示 overlay（由 harry / toby 主責） | CR-04 不擅自改 L2 互動邏輯 |
| **L3** | 純展示元件 | CR-04 不直接改 L3；統計面板若屬 L1 交付則維持現況邊界 |

硬規則：

1. L3 不得 import Pinia store；若需擴充統計面板視覺，優先透過 props / emits 協商，不破壞分層
2. L1 debug 頁放 `src/app/dev/`，並加 dev-only route guard
3. 修改跨層介面前，必須先與對應 CR / 主編確認

詳細邊界見 `docs/dernoson/L1/L1.md`。

---

## 3. 不可修改的邊界

| 檔案 / 模組 | 主責 | CR-04 應對方式 |
|-------------|------|----------------|
| `src/data/devices.ts` / `machines.ts` 結構決策 | CR-01 | 唯讀引入；資料結構變更須協商 |
| `src/store/editorStore.ts` | CR-01 | 唯讀 watch，不新增欄位 |
| 管線 / 連接狀態 | CR-02 | 唯讀 watch |
| `validationStore` / Detectors | CR-03 / shirone | 呼叫 `hasBlockingError`，不修改 detector 邏輯 |
| `docs/` 其他協作者資料夾 | 各自負責 | **嚴禁修改** |
| `docs/dernoson/` | 主編 | 唯讀參考，不擅自改 |

**可自由修改（CR-04 主責）：**

| 檔案 | 說明 |
|------|------|
| `src/composables/useFlowEngine.ts` | 核心演算法與 watch |
| `src/store/flowStore.ts` | 計算結果唯一寫入點 |
| `src/types/flow.ts` | FlowEngine 型別 |
| `src/editor/stats/ProductionStats.vue` | 右側統計面板 |
| `src/app/dev/` 下 FlowEngine / graph / history 相關測試頁 | Dev-only |
| `docs/aaaaa/**` | 本 CR 文件區 |

FactoryCanvas overlay：僅新增流量 / 效率顯示，**不動**既有拖拉、連線、選取邏輯。

---

## 4. 版本開發工作流（docs/aaaaa/dev/）

每次啟動新版本（如 V6），**優先**建立開發關聯檔案，再寫程式碼。

### 4.1 必須建立的結構

```text
docs/aaaaa/dev/
├── todolist_vN.md          # 開發大綱 + 細項文件指向（僅此）
└── dev_vN/                 # 各工項技術細項資料夾
    ├── A1_xxx.md
    ├── B1_xxx.md
    └── ...
```

規則：

| 檔案 | 職責 |
|------|------|
| `todolist_vN.md` | 版本概述、工項群組清單、狀態標記、指向 `dev_vN/` 內細項文件；**不寫長篇技術細節** |
| `dev_vN/*.md` | 各工項的背景、決策、型別、檔案計畫、遷移、驗證標準 |

> V1–V4 曾使用單一 `dev_vN.md`；自 V5 起改為 `todolist_vN.md` + `dev_vN/` 資料夾。**新版本一律採 V5 結構。**

### 4.2 版本啟動前的資料整理

負責人會提供：開發版本號、開發需求、用戶反饋、問題回報等資料。Agent 必須：

1. **詳細分析與整理**上述資料（動機、範圍、依賴、風險、跨 CR 影響）
2. 將整理結果寫入 `todolist_vN.md` 概述與各 `dev_vN/` 細項的「背景 / 決策」章節
3. 對照 `report_v*.md`、既有封鎖項目、主編里程碑（如 `MILESTONE_*.md`）確認前置條件

### 4.3 初步建檔後必須提問

初步建立 `todolist_vN.md` 與 `dev_vN/` 後，若對需求、範圍、優先序、跨 CR 介面有任何不確定：

1. **先向負責人（aaaaa）提問**，列出具體選項與建議
2. 取得答覆後再更新相關檔案
3. **禁止**在需求不清時擅自擴大範圍或選定未確認的技術方案

### 4.4 todolist 格式

| 規則 | 說明 |
|------|------|
| 工項群組 `V<N>-<字母>` | 如 `V6-A`，按依賴順序排列 |
| 單項 `V<N>-<字母><數字>` | 如 `V6-A1`，描述實作細節並連結細項 md |
| 狀態標記 | `[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中 |
| 封鎖項目 | 必須記入文末「封鎖項目追蹤」表，寫明原因與等待對象 |

### 4.5 細項文件建議章節

每個 `dev_vN/<工項>.md` 建議包含：

1. 背景與動機
2. 技術決策（有方案比較時必須寫比較表與選擇理由）
3. 型別設計（如有）
4. 檔案修改計畫
5. 遷移說明（如有）
6. 驗證標準
7. 開發日誌（日期倒序）

### 4.6 現有版本索引

| 版本 | 主題 | 文件 | 狀態 |
|------|------|------|------|
| V1 | Machine 物件動態化重構 | [todolist_v1.md](../dev/todolist_v1.md) / [dev_v1.md](../dev/dev_v1.md) | 完成 |
| V2 | 調度券兌換效率與倉庫填滿預估 | [todolist_v2.md](../dev/todolist_v2.md) / [dev_v2.md](../dev/dev_v2.md) | 完成 |
| V3 | 技術債修正 | [todolist_v3.md](../dev/todolist_v3.md) / [dev_v3.md](../dev/dev_v3.md) | 完成 |
| V4 | Machine id 欄位化 | [todolist_v4.md](../dev/todolist_v4.md) / [dev_v4.md](../dev/dev_v4.md) | 完成 |
| V5 | L1 完成後的開發者支援與測試基礎設施 | [todolist_v5.md](../dev/todolist_v5.md) / [dev_v5.md](../dev/dev_v5.md) / [dev_v5/](../dev/dev_v5/) | CR-04 交付完成（跨 CR 封鎖追蹤中） |
| V6 | 拖曳移動進歷史堆疊（MILESTONE_0726） | [todolist_v6.md](../dev/todolist_v6.md) / [dev_v6/](../dev/dev_v6/) | 已鎖定（待手動 M1–M7） |
| V7 | 資料 v3 遷移（data_1 → data → src/data） | [todolist_v7.md](../dev/todolist_v7.md) / [dev_v7/](../dev/dev_v7/) | **完成**（A–G） |
| V8 | Dev 預覽＋埠一對一／pipe60／H8／form | [todolist_v8.md](../dev/todolist_v8.md) / [dev_v8/](../dev/dev_v8/) | **實作完成**（A–G） |
| V9 | 強化視覺化預覽工具 | [todolist_v9.md](../dev/todolist_v9.md) / [dev_v9/](../dev/dev_v9/) | **文件就緒**（實作未開始） |

V5 相關入口：`V5_INIT_REPORT.md`、`todolist_v5.md`、`dev_v5.md`、`dev_v5/`。  
V6 相關入口：`MILESTONE_0726.md`、`todolist_v6.md`、`dev_v6/`。  
V7 相關入口：`data_0/`、`data_1/`、`data/`、`todolist_v7.md`、`dev_v7/`；指令 `pnpm sync:aaaaa-data`、`pnpm generate:src-data`。  
V8 相關入口：`todolist_v8.md`、`dev_v8/`（V6 維持鎖定）。  
V9 相關入口：`todolist_v9.md`、`dev_v9/`（現行規劃）。  
最新功能完成報告：`docs/aaaaa/report_v4.md`（V4；後續版本應新增對應 `report_vN.md`）。

---

## 5. 程式碼註解規則

對齊主編守則：

- 一律使用繁體中文（專有名詞、API 名稱除外）
- **嚴格禁止表情符號**
- 使用 JSDoc（`/** ... */`）；單行也用 `/** */`，不用 `//` 做正式註解
- 註解描述「為什麼」與「意圖」，不重複程式碼字面行為

必須註解：函數、型別成員、Pinia store 變數與 return 成員、`.vue` 的 props / emits / 副作用 hook。

---

## 6. 程式碼設計規則

- 優先使用 Nuxt UI v3、VueUse、Tailwind；不重複造輪子
- TypeScript 避免 `any`；必要時加註解說明原因
- 遵照 SOLID；不過度設計；不實作未要求的功能
- FlowEngine 計算結果**只**透過 `flowStore.applyResult` 批次寫入
- 觸發重算使用 `useDebounceFn(..., 150)`，避免高頻重算
- 流量單位統一為 **個/分鐘**（`rate_per_min`）

---

## 7. Store 與跨 CR 契約

### 7.1 Command Pattern（消費端）

CR-04 主要是計算引擎，通常不直接組 Command。若需改動會進歷史的操作：

- 不得在 L2 風格路徑自行呼叫 `historyStore.execute()`
- 應透過 L1 高階 actions；缺 action 時回報對應維護者補上

### 7.2 讀取契約

| 來源 | 讀取內容 | 用途 |
|------|----------|------|
| CR-01 `editorStore` | `nodes` / `edges`（或 devices / connections） | 建圖與重算觸發 |
| CR-01 設備資料 | `getMachineById` / recipes | 速率與電力 |
| CR-02 | 管線邊資料 | 邊流量 |
| CR-03 | `hasBlockingError(uid)` | 略過 Error 節點 |

### 7.3 輸出契約

| 消費者 | 讀取 |
|--------|------|
| FactoryCanvas | `edgeFlows`、`nodeEfficiencies`、`invalidChainUids`、`congestedEdges` |
| ProductionStats | `itemSummary`、`sinkDeliveries`、電力與調度券相關 computed |

`machineType` 決策（主編已定案）：存 **`Machine.id`（snake_case 英文）**，不用中文 `name`。遷移由 CR-01 執行；CR-04 測試與呼叫端在遷移後跟進 `getMachineById`。詳見 `report_v4.md` 與 `CR01_MIGRATION_TRACKING.md`。

---

## 8. 提交流程與品質門檻

對齊根目錄 `README.md` 開發者守則，並補充：

```bash
pnpm type-check
pnpm lint-check
pnpm format-check
pnpm test
```

- 分支：`dev/aaaaa` 或 `dev/<feature>`（與 aaaaa 相關）
- Commit 訊息簡潔、繁中為主；不加表情符號、不加 AI 生成字樣
- 不擅自 push、不擅自建 PR、不擅自合併 master
- 開發完成後**必須更新** `docs/aaaaa/README.md` 狀態，供其他協作者使用
- 完成工項後更新對應 `todolist_vN.md` 狀態標記

**Definition of Done（一般版本）：**

1. type-check / lint-check / format-check / test 通過
2. 對應 todolist 工項已標記完成或封鎖原因已記錄
3. `README.md`（及必要時 `AGENT_CONTEXT.md` / `CR04.agent.md`）已反映現況
4. 跨 CR 需求已寫入報告或追蹤文件，而非只留在對話中

---

## 9. 互動原則

- 大量或跨多檔變更：先與負責人討論步驟，一次只執行一個步驟
- 不擅自建立與本次任務無關的 README / CHANGELOG / 規劃檔
- 需求或技術決策不確定時：**提問，不要擅自定案**
- 修 bug 不順便重構；重構不順便改邏輯
- 遇到其他 CR 介面未就緒：明確說明 stub 策略與等待對象，寫入封鎖追蹤

進度回報格式建議：

> 「目前 `XXX` 尚未定義，我先以 stub 實作，等 CR-XX 確認後對齊」

---

## 10. 安全與隱私

- 禁止讀取 `.env`、`.env.*`、`.secrets`、任何 credentials
- 不在程式碼、commit、PR 中留下金鑰、token、密碼
- 對外部資料做 schema 驗證（若引入 Zod 或同等機制）

---

## 11. 可用 Skills 與 Agents

CR-04 專用 skills / agents 放在 `docs/aaaaa/claude/`，透過根目錄 `.claude/` symlink 生效（見 §12）。完整規則見各自的 `SKILL.md` / agent 定義檔，此處僅列索引：

**Skills**（`.claude/skills/`，用 `/<name>` 或符合觸發條件時自動使用）：

- `validate-changes`：跑 format → lint → type-check → test；**改完程式碼、回報「完成」前必須跑**
- `add-jsdoc`：依 §5 註解規則，為指定範圍的 TS / Vue 補齊 JSDoc
- `flow-engine-test`：跑 FlowEngine 單元測試與 H1–H6 / 堵塞 / 環路回歸清單

**Agents**（`.claude/agents/`，用 Task／Agent 呼叫）：

- `test-writer`：建立或更新 Vitest 單元測試（優先 FlowEngine / flowStore；鏡射至 `src/__tests__/`）
- `dependency-grapher`：畫模組相依圖（Mermaid），預設輸出 `docs/aaaaa/graphs/`，不改原始碼

---

## 12. 關鍵參考文件索引

| 文件 | 用途 |
|------|------|
| [README.md](../README.md) | CR-04 對外狀態與導覽（開發後必更新） |
| [AGENT_CONTEXT.md](../AGENT_CONTEXT.md) | Agent 快速上下文 |
| [report_v4.md](../report_v4.md) | 最新功能完成報告（V4） |
| [V5_INIT_REPORT.md](../V5_INIT_REPORT.md) | V5 初始化報告 |
| [L1_API_REFERENCE.md](../L1_API_REFERENCE.md) | L1 Store API |
| [FLOW_ENGINE_GUIDE.md](../FLOW_ENGINE_GUIDE.md) | FlowEngine 使用指南 |
| [L1_PR.md](../L1_PR.md) | L1 完成總結 |
| [todolist_v5.md](../dev/todolist_v5.md) | V5 工項清單 |
| [dev_v5.md](../dev/dev_v5.md) | V5 技術總覽 |
| [dev_v5/](../dev/dev_v5/) | V5 細項文件 |
| [todolist_v6.md](../dev/todolist_v6.md) | V6 工項清單（拖曳進歷史，已鎖定） |
| [dev_v6/](../dev/dev_v6/) | V6 細項文件 |
| [todolist_v7.md](../dev/todolist_v7.md) | V7 工項清單（資料 v3 遷移，**完成**） |
| [dev_v7/](../dev/dev_v7/) | V7 細項文件 |
| [todolist_v8.md](../dev/todolist_v8.md) | V8 工項清單（Dev 預覽＋引擎規則，A–G 完成） |
| [dev_v8/](../dev/dev_v8/) | V8 細項文件 |
| [todolist_v9.md](../dev/todolist_v9.md) | V9 工項清單（強化視覺化預覽，文件就緒） |
| [dev_v9/](../dev/dev_v9/) | V9 細項文件 |
| [MILESTONE_0726.md](../MILESTONE_0726.md) | V6 來源里程碑 |
| [CONTEXT.md](./CONTEXT.md) | CR-04 專有名詞（PortMedia／machineMode／form／埠一對一） |
| `spec/04_flow_simulation.md` | 官方功能規格 |
| `.github/agents/CR04.agent.md` | GitHub Agent 提示 |

---

## 13. 套用本資料夾（可選）

若要以 Claude Code 載入本守則，可在 repo 根目錄建立連結（與主編說明類似）：

```powershell
New-Item -ItemType SymbolicLink -Path "CLAUDE.md" -Target "docs\aaaaa\claude\CLAUDE.md"
```

或同時連結整個設定目錄（skills / agents 會被偵測到）：

```powershell
New-Item -ItemType SymbolicLink -Path ".claude" -Target "docs\aaaaa\claude"
```

注意：與 `docs/dernoson/claude` 的連結擇一使用，避免互相覆蓋。團隊預設可能指向主編目錄；CR-04 專用開發時再切換至本目錄。
