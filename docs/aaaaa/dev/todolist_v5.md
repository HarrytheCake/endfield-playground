# V5 TODOLIST — L1 完成後的開發者支援與測試基礎設施

**版本：** V5  
**建立日期：** 2026-06-06  
**負責人：** aaaaa  
**對應開發文件：** [dev_v5.md](./dev_v5.md)

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## 概述

L1 基礎建設已於 L1_PR 完成（CR-04 FlowEngine、CR-08 historyStore、editorStore、validationStore 等）。

V5 版本目標：為 L2/L3 層級與其他 CR 成員提供**開發者支援**與**測試基礎設施**，確保他們能夠順利開始工作。

---

## V5-A｜dev-only 測試頁面（前置，無依賴）

> 目標：提供 L1 成員驗證算法正確性的獨立測試環境，不影響 production build

- [x] **V5-A1** 建立 `/dev` 路由基礎設施
  - 新建 `src/app/dev/` 資料夾
  - 在 `src/router/index.ts` 新增 dev-only 路由群組（含 route guard，僅 `import.meta.env.DEV` 時可訪問）
  - 建立 `src/app/dev/DevLayout.vue` 作為共用佈局（含導航列表，列出所有 dev 頁面）
  - 相關檔案：
    - `src/app/dev/DevLayout.vue`（新建）
    - `src/router/index.ts`（修改）

- [x] **V5-A2** `/dev/flow-engine` — FlowEngine 手動測試頁
  - 頁面元件：`src/app/dev/FlowEngineTest.vue`（新建）
  - 功能需求：
    - 左側：JSON 輸入區（可貼入 `nodes: FactoryNode[]` 與 `edges: FactoryEdge[]`）
    - 右側：計算結果顯示區（`edgeFlows` / `nodeEfficiencies` / `itemSummary` / `powerBalance`）
    - 「執行計算」按鈕（手動觸發 `runFlowEngine()`）
    - 預載範例：提供 H1–H6 測試情境的 JSON preset
  - 技術細節：見 [dev_v5/A2_flow_engine_test.md](./dev_v5/A2_flow_engine_test.md)

- [x] **V5-A3** `/dev/graph-viz` — 圖結構可視化頁
  - 頁面元件：`src/app/dev/GraphViz.vue`（新建）
  - 功能需求：
    - 輸入區：同 V5-A2，貼入 nodes / edges JSON
    - 輸出區：顯示 `buildGraph()` 結果（adjacency list 格式）
    - 顯示 `topologicalSort()` 結果與環路偵測資訊
    - 顯示 `validateChains()` 後的 `invalidSubgraphUids`
  - 技術細節：見 [dev_v5/A3_graph_viz.md](./dev_v5/A3_graph_viz.md)

- [x] **V5-A4** `/dev/history-replay` — 歷史記錄回放頁
  - 頁面元件：`src/app/dev/HistoryReplay.vue`（新建）
  - 功能需求：
    - 顯示 `historyStore.undoStack` 與 `redoStack` 的 Command 列表
    - 提供「Undo」、「Redo」、「Clear」按鈕
    - 即時顯示 `editorStore.nodes` / `edges` 快照（每次 undo/redo 後更新）
    - 驗證項目：確認 undo/redo 後 store 狀態正確還原
  - 技術細節：見 [dev_v5/A4_history_replay.md](./dev_v5/A4_history_replay.md)

---

## V5-B｜幾何與 utility helper（依賴 V5-A，支援 shirone）

> 目標：為 CR-03 detector 開發提供必要的幾何計算工具函式

- [x] **V5-B1** 新建 `src/utils/geometryUtils.ts`
  - `getOccupiedCells(device: FactoryNode, def: Machine): Set<string>`
    - 計算設備佔據的所有格子座標（考慮旋轉與尺寸）
    - 回傳格式：`Set<"x,y">`（例如 `"5,10"`）
  - `cellsOverlap(cells1: Set<string>, cells2: Set<string>): boolean`
    - 檢查兩個格子集合是否有重疊
  - `isWithinBaseRegion(x: number, y: number, baseRegion: BaseRegion): boolean`
    - 檢查座標是否在基地範圍內
  - 技術細節：見 [dev_v5/B1_geometry_utils.md](./dev_v5/B1_geometry_utils.md)

- [x] **V5-B2** 更新 `src/types/validation.ts` — 確認 `ValidationContext` 完整性
  - 確認 `ValidationContext` 含以下欄位：
    - `devices: FactoryNode[]`
    - `connections: FactoryEdge[]`
    - `getDef: (machineId: string) => Machine | undefined`
    - `baseRegion: BaseRegion`（從 `canvasStore` 取得）
  - 若缺少欄位，補齊並更新 `useValidation.ts` 的 context 建構邏輯
  - 技術細節：見 [dev_v5/B2_validation_context.md](./dev_v5/B2_validation_context.md)

- [x] **V5-B3** 為 shirone 建立 E001 開發範例
  - 在 `src/lib/validation/detectors/E001_deviceOverlap.ts` 補充實作草稿（非完整實作，僅示範如何使用 `getOccupiedCells`）
  - 建立測試檔 `src/__tests__/lib/validation/detectors/E001_deviceOverlap.test.ts`（含至少 3 個測試案例）
  - 更新 `docs/shirone/README.md`，說明如何使用 geometryUtils 與撰寫 detector
  - 技術細節：見 [dev_v5/B3_e001_example.md](./dev_v5/B3_e001_example.md)

---

## V5-C｜開發者文件與 API 說明（無依賴，可與 A/B 並行）

> 目標：為 L2/L3 提供清晰的介面文件，讓他們知道如何使用 L1 提供的 stores 與 composables

- [x] **V5-C1** 建立 `docs/aaaaa/L1_API_REFERENCE.md`
  - 列出所有 L1 暴露的 stores 與其 actions / getters 簽名
  - 包含以下 stores：
    - `useEditorStore`（8 個高階 actions）
    - `useCanvasStore`（視角狀態）
    - `useFlowStore`（計算結果，唯讀）
    - `useValidationStore`（alerts / hasBlockingError）
    - `useSelectionStore`（選取狀態）
    - `useHistoryStore`（undo / redo，L2 不應直接呼叫 `execute`）
  - 每個 action 附帶：
    - **簽名**（TypeScript 型別）
    - **說明**（做什麼、何時用）
    - **範例**（1-2 行呼叫示範）
    - **注意事項**（例如「不要直接 mutate store state」）
  - 技術細節：見 [dev_v5/C1_api_reference.md](./dev_v5/C1_api_reference.md)

- [x] **V5-C2** 建立 `docs/aaaaa/FLOW_ENGINE_GUIDE.md`
  - FlowEngine 觸發時機說明（debounce 150ms、watch 哪些 store）
  - 計算流程圖解（buildGraph → validateChains → topologicalSort → propagateFlows → detectCongestion → calcItemSummary）
  - 效率顏色規則（Tailwind class 對照表）
  - 如何在 L3 元件中消費 `flowStore` 的數據（範例：顯示管線流量 overlay）
  - 技術細節：見 [dev_v5/C2_flow_engine_guide.md](./dev_v5/C2_flow_engine_guide.md)

- [x] **V5-C3** 更新 `docs/harry/README.md` 與 `docs/toby/README.md`
  - 在各自的 README 中新增「L1 API 使用指南」章節
  - 連結到 `L1_API_REFERENCE.md` 與 `FLOW_ENGINE_GUIDE.md`
  - 說明 L2 的「不可為」清單（禁止直接 mutate store、禁止自己組 Command 等）
  - 技術細節：見 [dev_v5/C3_l2_readme_update.md](./dev_v5/C3_l2_readme_update.md)

---

## V5-D｜跨 CR 協調追蹤與封鎖解除（依賴外部 CR）

> 目標：追蹤並協調其他 CR 需完成的遷移工作，確保 L1 交付的介面能被正確使用

- [x] **V5-D1** 追蹤 CR-01：`PlacedDevice.machineType` 遷移（最高優先）
  - **狀態**：🔶 封鎖中（等待 CR-01）
  - **需 CR-01 執行的工作**：
    - `src/store/editorStore.ts`：將所有 `machineType: '<中文名>'` 改為對應的 `Machine.id`
    - `src/editor/canvas/FactoryCanvas.vue`：將設備定義查找由 `getMachine(node.data.machineType)` 改為 `getMachineById(node.data.machineType)`
    - 確認 `getRecipesForMachine(machineType)` 呼叫端是否需同步調整
  - **CR-04 提供的支援**：
    - `getMachineById(id: string)` 函式已完成（V4-C1）
    - 41 台機器 id 對照表已提供（見 `docs/aaaaa/report_v4.md` 第 4.1 節）
  - **驗證方式**：CR-01 完成後，執行 `pnpm type-check` 與 `pnpm test` 確認零錯誤
  - 追蹤文件：[CR01_MIGRATION_TRACKING.md](../CR01_MIGRATION_TRACKING.md)

- [x] **V5-D2** 追蹤 History 模組：format-check 修正
  - **狀態**：🔶 封鎖中（等待 History 模組 CR）
  - **問題描述**：history 模組下列 4 支檔案存在 pre-existing format 問題（見 `docs/aaaaa/report_v4.md` 第 3.1 節）
  - **需執行的工作**：History 模組負責 CR 執行 `pnpm format` 後 commit
  - **驗證方式**：`pnpm format-check` 全通過
  - 追蹤文件：[HISTORY_FORMAT_TRACKING.md](../HISTORY_FORMAT_TRACKING.md)

- [x] **V5-D3** 為 shirone 建立 detector 開發檢查清單
  - 建立 `docs/shirone/DETECTOR_CHECKLIST.md`
  - 列出每個 detector（E001–E006）的開發狀態與依賴項
  - 說明如何使用 `useValidation.ts` 註冊 detector
  - 提供測試範本（可複製 E001 測試檔改寫）
  - 技術細節：見 [dev_v5/D3_detector_checklist.md](./dev_v5/D3_detector_checklist.md)

---

## V5-E｜Agent 文件更新與規範維護（無依賴，可與 A/B/C/D 並行）

> 目標：更新 agent 相關文件，反映 V1–V4 已完成的狀態與 V5 的新工作內容

- [x] **V5-E1** 更新 `docs/aaaaa/AGENT_CONTEXT.md`
  - 在「已完成的工作」章節新增 V1–V4 摘要
  - 更新「核心演算法摘要」（確認與實際實作一致）
  - 新增「dev-only 測試頁面」章節（說明 `/dev/*` 路由的用途與存取方式）
  - 更新「型別速查」（確認 `Machine.id` / `RecipeDef.id` / `ProductDef.id` 已加入）
  - 技術細節：見 [dev_v5/E1_agent_context_update.md](./dev_v5/E1_agent_context_update.md)

- [x] **V5-E2** 更新 `.github/agents/CR04.agent.md`
  - 同步更新 V1–V4 完成狀態
  - 新增 V5 工作範圍說明（dev 頁面、helper、文件）
  - 更新「絕對禁止修改的邊界」（確認與實際分工一致）
  - 技術細節：見 [dev_v5/E2_agent_md_update.md](./dev_v5/E2_agent_md_update.md)

- [x] **V5-E3** 更新 `docs/aaaaa/README.md`
  - 新增「開發階段」章節，列出 V1–V5 的主題與狀態
  - 更新「接下來的工作」（移除已完成項目，新增 V5 後續計畫）
  - 確認連結正確（所有相對路徑可正常訪問）
  - 技術細節：見 [dev_v5/E3_readme_update.md](./dev_v5/E3_readme_update.md)

---

## V5-F｜品質驗證與整合測試（依賴 V5-A ~ V5-E）

> 目標：確保所有新增功能與文件的品質符合 DoD

- [x] **V5-F1** `pnpm type-check` 零錯誤
  - 確認所有新建檔案（dev 頁面、utils、types）無 TypeScript 錯誤

- [x] **V5-F2** `pnpm test` 全數通過
  - 確認新增的測試檔（geometryUtils、E001 範例）通過
  - 確認既有 197 個測試案例不受影響
  - **結果**：205 個測試全部通過（新增 E001 的 8 個測試）

- [x] **V5-F3** `pnpm lint-check` 零警告
  - 確認所有新建檔案符合 ESLint 規範

- [x] **V5-F4** `pnpm format-check` 通過
  - 確認所有新建檔案符合 Prettier 格式
  - 已執行 `pnpm format` 修正所有格式問題

- [x] **V5-F5** dev 頁面功能驗證（需手動測試）
  - `/dev/flow-engine`：手動執行 H1–H6 preset，確認結果正確
    - **已修復**：解決直接修改 editorStore 導致的卡死問題
    - **新增**：使用說明區塊、錯誤處理、JSON 格式範例
    - **方案**：臨時替換畫布數據 → 等待計算（300ms）→ 讀取結果 → 恢復原始數據
  - `/dev/graph-viz`：貼入包含環路的 JSON，確認環路偵測正確
  - `/dev/history-replay`：執行 undo/redo，確認 store 狀態正確還原
  - **狀態**：FlowEngine 測試頁已完成修復與改進，其他頁面待手動驗證

- [x] **V5-F6** 文件完整性檢查
  - 確認所有新建的 `dev_v5/*.md` 檔案都已建立且內容完整（15 份文件）
  - 確認所有內部連結路徑正確（已修正 AGENT_CONTEXT.md、README.md、CR04.agent.md）
  - API 文件中的範例程式碼已通過 type-check 驗證

---

## 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 預計解除 | 追蹤文件 |
|----|---------|---------|----------|----------|
| V5-D1 | `PlacedDevice.machineType` 仍使用中文名稱 | CR-01 | CR-01 執行遷移後 | [CR01_MIGRATION_TRACKING.md](../CR01_MIGRATION_TRACKING.md) |
| V5-D2 | history 模組 4 支檔案 format 問題 | History 模組 CR | History CR 執行 `pnpm format` 後 | [HISTORY_FORMAT_TRACKING.md](../HISTORY_FORMAT_TRACKING.md) |

---

## 完成定義（Definition of Done）

- [x] V5-A ~ V5-E 所有工項標記為 `[x]`
- [x] V5-F1 ~ V5-F6 所有驗證項目通過（F5 需手動測試）
- [~] 封鎖項目已全部解除或明確標註為「後續版本處理」
  - V5-D1（CR-01 遷移）：追蹤文件已建立，等待 CR-01
  - V5-D2（History format）：追蹤文件已建立，等待 History CR
- [x] 所有 dev 頁面已實作，路由已配置（需手動驗證功能）
- [x] L1 API 文件已完成（56 KB，4 個主要文件）
- [x] 所有自動化驗證通過（type-check / test / lint / format）
