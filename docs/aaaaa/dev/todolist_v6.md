# V6 TODOLIST — 拖曳移動進歷史堆疊（MILESTONE_0726）

**版本：** V6  
**建立日期：** 2026-08-01  
**最後更新：** 2026-08-02  
**負責人：** aaaaa  
**來源：** [MILESTONE_0726.md](../MILESTONE_0726.md)  
**狀態總覽：** ✅ **已完成／已解鎖** — A–F 通過；HistoryReplay 覆蓋 M1–M6；M7 主畫布跟手列為已知 UX 觀察（不阻擋關閉）

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## 概述

### 問題（一句話）

畫布上以滑鼠拖曳移動設備時，Vue Flow 的 `v-model:nodes` 已直接改寫 `editorStore.nodes` 的 `position`，但從未呼叫 `moveDevices()`，因此 **Ctrl+Z 無法復原拖曳移動**。

### 目標

1. 拖曳結束後，移動進入 `historyStore`（單一歷史項目；多選一次 undo 全還原）
2. 遵守 Command 歸屬：L2 不自行 `historyStore.execute()`，一律走 L1 高階 action
3. 介面預留未來 CR-02「移動時管線跟隨」擴充點，但 **本版不實作管線跟隨**
4. 既有「主動呼叫 `moveDevices(uids, delta)`」路徑（如 HistoryReplay 測試鈕）行為保持正確

### 已定案（2026-08-01）

| 項 | 結論 |
|----|------|
| API | 新增 `commitDeviceMove(uids, before)`；保留 `moveDevices(uids, delta)` |
| 實作 | `editorStore` + `FactoryCanvas` 皆由 aaaaa 先改並測試，供協作者檢驗後由主編 merge |
| 範圍 | 只做移動能 undo；管線跟隨留 CR-02 |
| 零位移 | 不進歷史 |

### 非目標（本版不做）

- 方案 C / 方案 A
- CR-02 管線端點跟隨 / auto-connect
- 拖曳過程中降低 FlowEngine 重算頻率

### 流程大綱

```text
A 分析定案 ✓ → B L1 API ✓ → C L2 Canvas ✓ → D 單元＋預覽 ✓ → E 文件 ✓ → F 品質 ✓ → 解鎖 ✓
```

### 驗收確認（2026-08-02）

| ID | 項目 | 結果 |
|----|------|------|
| V6-D1 | editorStore 單元測試 | 通過（31） |
| V6-D2 M1–M6 | `/dev/history-replay` V6 區塊 | 通過（一鍵腳本／API 路徑） |
| V6-D2 M7 | 主畫布真拖曳跟手 | 已知觀察項；不阻擋關閉（管線跟隨仍非目標） |
| type-check | `pnpm type-check` | 通過 |

---

## V6-A｜問題分析與介面定案（前置）

- [x] **V6-A1** 問題與影響分析整理
  - 細項：[dev_v6/A1_problem_analysis.md](./dev_v6/A1_problem_analysis.md)

- [x] **V6-A2** API 方案定案
  - 細項：[dev_v6/A2_api_decision.md](./dev_v6/A2_api_decision.md)

---

## V6-B｜L1 `editorStore` 移動 API

- [x] **V6-B1** 實作 `commitDeviceMove`
  - 檔案：`src/store/editorStore.ts`、`src/types/editor.ts`
  - 細項：[dev_v6/B1_editor_store_api.md](./dev_v6/B1_editor_store_api.md)

---

## V6-C｜L2 `FactoryCanvas` 拖曳接線

- [x] **V6-C1** Canvas 拖曳 handler 接上 L1
  - 檔案：`src/editor/canvas/FactoryCanvas.vue`
  - 細項：[dev_v6/C1_factory_canvas_handlers.md](./dev_v6/C1_factory_canvas_handlers.md)

---

## V6-D｜測試

- [x] **V6-D1** `editorStore` 單元測試補齊
  - 細項：[dev_v6/D1_unit_tests.md](./dev_v6/D1_unit_tests.md)

- [x] **V6-D2** Dev 預覽＋驗收（`/dev/history-replay` V6：M1–M6；M7 觀察）
  - 細項：[dev_v6/D2_manual_test_plan.md](./dev_v6/D2_manual_test_plan.md)
  - 實作：`src/app/dev/HistoryReplay.vue`

---

## V6-E｜文件與跨層協調

- [x] **V6-E1** aaaaa 文件已更新（L1_API_REFERENCE、todolist、MILESTONE）；dernoson/L2 README 待主編／L2 同步
  - 細項：[dev_v6/E1_docs_and_coordination.md](./dev_v6/E1_docs_and_coordination.md)

---

## V6-F｜品質驗證

- [x] **V6-F1** 自動化品質門檻（type-check／editorStore tests）＋ D2 預覽驗收
  - 細項：[dev_v6/F1_quality_gate.md](./dev_v6/F1_quality_gate.md)

---

## 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 解除條件 |
|----|---------|---------|----------|
| （無） | 已於 2026-08-02 解鎖 | — | — |

---

## 完成定義（Definition of Done）

- [x] V6-A2 已定案並寫入 A2「最終決策」表
- [x] 單選／多選移動可 undo／redo（單元測試＋ HistoryReplay M1–M3）
- [x] 拖曳路徑不產生雙重位移（commit 語意＋預覽腳本斷言）
- [x] 既有 `moveDevices(uids, delta)` 測試仍通過
- [x] L2 未直接呼叫 `historyStore.execute()` 組移動 Command（程式已走 `commitDeviceMove`）
- [x] 本版未實作管線跟隨，但 API / 文件已註明擴充點
- [x] 零位移不進歷史（單元測試＋預覽 M4）
- [x] V6-D／V6-F 驗證通過；已解鎖，現行開發走 **V9**
- [x] `docs/aaaaa/README.md` 已反映 V6 完成／解鎖
