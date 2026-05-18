# CR-04 開發 Todo List

**負責人：** aaaaa  
**最後更新：** 2026-05-18

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## Phase 1 — MVP

### P1-A｜型別與資料基礎（前置，無依賴）

- [ ] **A1** 建立 `src/types/flow.ts`
  - 定義 `EdgeFlow`、`ItemSummary`、`FlowGraph`、`FlowNode`、`FlowEdge` 型別
  - 確保與 CR-01 的 `PlacedDevice`、CR-02 的 `Connection` 型別相容
- [ ] **A2** 確認 `src/data/devices.ts` 結構
  - 確認設備型別含 `power_cost`、`power_output`、`ports`（含 type: `belt`/`pipe`）
  - 確認配方型別含 `inputs[].rate_per_min`、`outputs[].rate_per_min`
  - 若尚未建立，提出最小可行結構供 CR-01 採用（以 stub 資料先行開發）

### P1-B｜Pinia Store（依賴 A1）

- [ ] **B1** 建立 `src/store/flowStore.ts`
  - 實作 `useFlowStore`，含 `edgeFlows`、`nodeEfficiencies`、`itemSummary`
  - 實作 `totalPowerDemand`、`totalPowerSupply` 計算
  - 實作 `isCalculating`、`lastCalculatedAt` 元資料
  - 提供 `reset()` action（清空所有計算結果）

### P1-C｜FlowEngine 核心演算法（依賴 A1、A2）

- [ ] **C1** 建立 `src/composables/useFlowEngine.ts`
- [ ] **C2** 實作 `buildGraph(devices, connections)` — 建立有向圖，過濾 Error 節點
- [ ] **C3** 實作 `topologicalSort(graph)` — Kahn's Algorithm，回傳排序結果與環路標記
- [ ] **C4** 實作 `calcDeviceOutput(device, inputFlows)` — 單設備效率與輸出計算
  - 含分流器均分邏輯
  - 含匯流器加總邏輯
- [ ] **C5** 實作 `propagateFlows(sorted, graph)` — 正向傳播主迴圈
- [ ] **C6** 實作 `calcItemSummary(edgeFlows, devices)` — 品項生產 / 消耗 / 淨產量彙整
- [ ] **C7** 實作 `runFlowEngine()` — 串接以上步驟，寫入 `useFlowStore`

### P1-D｜Watch 觸發（依賴 B1、C7）

- [ ] **D1** 在 `useFlowEngine.ts` 內加入 `watch` + `useDebounceFn(runFlowEngine, 150)`
  - 監聽 `editorStore.nodes`（設備）與 `editorStore.edges`（管線）
  - 監聽 `editorStore` 配方變更事件
- [ ] **D2** 在主 App 或 Editor layout 中 `useFlowEngine()` 啟動監聽

### P1-E｜畫布 Overlay 顯示（依賴 B1、D1）

- [ ] **E1** 在 `FactoryCanvas.vue` 中讀取 `useFlowStore`
- [ ] **E2** 管線上顯示流量速率數字（個/min）
  - 懸停 tooltip 顯示詳細資訊（品項名稱、完整速率）
- [ ] **E3** 設備上顯示效率百分比，依效率套用顏色 class（綠 / 黃 / 橘 / 灰）
- [ ] **E4** 無流量節點顯示灰色（略過計算的 Error 節點）

### P1-F｜右側統計面板（依賴 B1）

- [ ] **F1** 更新 `ProductionStats.vue` 讀取 `useFlowStore`
- [ ] **F2** 實作「整體電力統計」區塊
  - 顯示總耗電量、總供電量、電力狀態（盈餘 / 不足）
  - 顯示設備數量（含 Error 台數）、管線數量
- [ ] **F3** 實作「產出摘要表」區塊
  - 動態列出所有品項
  - 淨產量正 / 負 / 零對應顏色
- [ ] **F4** 空白狀態處理（畫布無設備時顯示提示文字）

### P1-G｜整合測試（依賴 E1–E4、F1–F4）

- [ ] **G1** 手動驗證：單條產線（礦機 → 熔爐），確認流量與效率數值正確
- [ ] **G2** 手動驗證：限流情境（供料不足），效率 < 100% 且顯示正確顏色
- [ ] **G3** 手動驗證：Error 節點略過，下游顯示灰色
- [ ] **G4** 手動驗證：電力統計數值正確，盈餘 / 不足狀態正確
- [ ] **G5** 手動驗證：debounce 正常運作，高頻操作不觸發多餘計算
- [ ] **G6** 手動驗證：產出摘要表顏色與數值正確

---

## Phase 2 — 完整模擬體驗

> Phase 2 在 Phase 1 完全穩定後開始，以下為預計工項。

- [ ] **H1** `useFlowStore` 新增 `ticketRates`、`ticketTotal` 欄位
- [ ] **H2** 在 `ProductionStats.vue` 新增調度券兌換率設定 UI（使用者可輸入各品項兌換率）
- [ ] **H3** 實作調度券總產出計算邏輯
- [ ] **H4** 顯示「調度券預估產出」明細展開區塊
- [ ] **H5** `useFlowStore` 新增 `warehouseCapacity` 欄位
- [ ] **H6** 實作倉庫填滿預估計算（淨產量 → 填滿時間）
- [ ] **H7** 顯示「倉庫預估」區塊

---

## 封鎖項目追蹤

| 工項 | 封鎖原因 | 等待對象 |
|------|----------|----------|
| A2（devices.ts 結構） | 設備資料由 CR-01 主責定義 | CR-01 負責人 |
| C4（分流器 / 匯流器） | 需確認 CR-02 的 Splitter / Merger 節點型別 | CR-02 負責人 |
| E2（管線 overlay） | 需確認 CR-02 管線 Vue Flow edge 的 id 對應方式 | CR-02 負責人 |

---

## 完成定義（Definition of Done）

Phase 1 完成條件：
1. `pnpm type-check` 無錯誤
2. `pnpm lint-check` 無錯誤
3. `pnpm format-check` 通過
4. G1–G6 所有手動驗證通過
5. PR 建立並通過 admin review
