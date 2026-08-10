# V7 TODOLIST — 資料 v3 遷移（data_1 → data → src/data）

**版本：** V7  
**建立日期：** 2026-08-01  
**負責人：** aaaaa  
**來源：** `docs/aaaaa/data_1/`（新物件 JSON + schema 說明）  
**對照舊版：** `docs/aaaaa/data_0/`（對齊遷移前 `src/data` 的舊 JSON）  
**狀態總覽：** G1 完成；V7 全線（A–G）完成

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## 概述

### 背景

- **`data_0`**：舊版 JSON（無 modes／media／氣態擴充）。
- **`data_1`**：新版 JSON（schema v3）。
- **`docs/aaaaa/data/`**：以腳本自 `data_1` **原樣複製**重建的工作副本。
- **`src/data` + FlowEngine**：同版本對齊；最小支援 **machineMode** 與 **belt/pipe**；**loss 只進資料、不算**。

### 已定案（2026-08-01）

| 項 | 結論 |
|----|------|
| data 輸出 | 原樣複製 data_1 → data/ |
| Port | TS 改 `belt` \| `pipe` |
| 範圍 | types + src/data + FlowEngine 最小（mode／媒質） |
| 節點 | 新增 `machineMode` |
| loss | 只進資料，計算延後 |
| 腳本 | Node @ `docs/aaaaa/scripts/` |

詳見 [A2_mapping_decision.md](./dev_v7/A2_mapping_decision.md)。

### 流程大綱

```text
A 定案 ✓ → B 腳本 → C 重建 data/ → D types + src/data → E FlowEngine 最小 → F 測試 → G 文件
```

---

## V7-A｜差異分析與對映定案

- [x] **V7-A1** data_0 / data_1 / src 差異與影響盤點
  - 細項：[dev_v7/A1_diff_analysis.md](./dev_v7/A1_diff_analysis.md)

- [x] **V7-A2** 欄位對映與遷移策略定案
  - 細項：[dev_v7/A2_mapping_decision.md](./dev_v7/A2_mapping_decision.md)

---

## V7-B｜轉換腳本（data_1 → data）

- [x] **V7-B1** 實作 `docs/aaaaa/scripts/` Node 腳本（原樣複製 + dry-run + JSON 驗證）
  - 細項：[dev_v7/B1_conversion_script.md](./dev_v7/B1_conversion_script.md)
  - 指令：`pnpm sync:aaaaa-data` / `node docs/aaaaa/scripts/sync-data-from-v1.mjs --dry-run`

---

## V7-C｜定義說明與 data 工作副本

- [x] **V7-C1** 重建 `docs/aaaaa/data/`（JSON + md）；README 文首 playground 註記
  - 細項：[dev_v7/C1_data_docs.md](./dev_v7/C1_data_docs.md)
  - 註記範本：`docs/aaaaa/scripts/playground-data-readme-banner.md`（由 sync 腳本自動注入）

---

## V7-D｜型別與 `src/data`

- [x] **V7-D1** 更新 `src/types`：`PortMedia`、`modes`、`machineMode`、`environment`、`loss`（資料面）
  - 細項：[dev_v7/D1_types_update.md](./dev_v7/D1_types_update.md)
  - 附帶：`machines.ts` 過渡（belt/pipe + `attachDefaultModes`）；完整重產留給 D2

- [x] **V7-D2** 更新／產生 `src/data/*.ts`（含 environments；保留 source/sink stub）
  - 細項：[dev_v7/D2_src_data_update.md](./dev_v7/D2_src_data_update.md)
  - 指令：`pnpm generate:src-data`（讀 `docs/aaaaa/data`）

---

## V7-E｜FlowEngine 最小支援

- [x] **V7-E1** machineMode 配方解析 + belt/pipe 媒質檢查；loss 不計算
  - 細項：[dev_v7/E1_consumers_flow_engine.md](./dev_v7/E1_consumers_flow_engine.md)
  - `resolveMachineMode`；handle 齊全時驗媒質；`/dev/flow-engine` preset 已對齊

---

## V7-F｜測試

- [x] **V7-F1** 單元測試與 `/dev/flow-engine` 氣態／mode／媒質情境
  - 細項：[dev_v7/F1_testing.md](./dev_v7/F1_testing.md)
  - 自動化：G1–G3、L1；手動 preset：`/dev/flow-engine` V7 群組

---

## V7-G｜品質與對外文件

- [x] **V7-G1** README／AGENT_CONTEXT／CONTEXT／品質門檻
  - 細項：[dev_v7/G1_quality_docs.md](./dev_v7/G1_quality_docs.md)
  - 已更新：README、AGENT_CONTEXT、FLOW_ENGINE_GUIDE、claude/CLAUDE、claude/CONTEXT

---

## 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 解除條件 |
|----|---------|---------|----------|
| （無） | A2 已定案 | — | — |

---

## 完成定義（Definition of Done）

- [x] `docs/aaaaa/data/` 可由腳本自 `data_1` 重複產生（內容一致）
- [x] `src/types` 使用 `belt`｜`pipe`；Machine 含 `modes`；Recipe 含 mode／environment；loss 型別存在但不參與計算
- [x] 節點／FlowNode 支援 `machineMode`（缺省 modes[0]）
- [x] FlowEngine：依 mode 取配方；belt↔pipe 錯接標記非法或拒絕建有效邊
- [x] type-check／測試通過或附豁免清單
- [x] README／CONTEXT 已反映 V7；V6 維持鎖定
