# V12-B1 — V11 殘項收斂（前置）

**對應工項：** V12-B1  
**狀態：** `[x]` 完成（2026-09-11）  
**日期：** 2026-09-11  
**正式依據：** [todolist_v11](../todolist_v11.md)、[V11_acceptance_guide](../dev_v11/V11_acceptance_guide.md)、W0907-A0 前置欄

---

## 1. 背景

V11 工項在 git 上已由主編完成 PR 與 merge；本細項只做**交叉比對＋文件收斂**，不帶新程式刀進 V12。

---

## 2. 交叉比對（git／GitHub）

| 交付 | PR | 狀態 | 合入時間（UTC） |
|------|-----|------|-----------------|
| A0 L1 打底 | [#40](https://github.com/dernoson/endfield-playground/pull/40) | **MERGED** | 2026-09-01T02:34:27Z |
| A1 B1 工具列 | [#43](https://github.com/dernoson/endfield-playground/pull/43) | **MERGED** | 2026-09-04T03:38:40Z |

| 程式路徑 | master 現況 | 結論 |
|----------|-------------|------|
| `src/types/layout.ts` | 有 | 可作為 V12 輸入 |
| `src/utils/layout/*`（含 resolveConnections／toTopology） | 有 | 可組進 store |
| `src/data/mockLayout.ts` | 有 `toLayoutSnapshot` | 測試／dev 可用 |
| `/dev/layout-l1-preview` | 有 | V11 演示保留 |
| `src/store/layoutStore.ts` | **無** | V12 新建 |
| `ToolbarPanel` 真實機器列表 | 隨 #43 | V11 結案；本週硬鎖面板 |

**程式殘刀：** 無。V11 DoD 程式項皆已合入。

---

## 3. 文件殘項（已處置）

| 檔 | 過期寫法 | 處置 |
|----|----------|------|
| [todolist_v11.md](../todolist_v11.md) | 「A1 PR #43 待合入」 | **已改**已合入；V11 結案 |
| [V11_acceptance_guide.md](../dev_v11/V11_acceptance_guide.md) | A1「待合入」 | **已改**已合入 |
| [H1_toolbar_real_machines.md](../dev_v11/H1_toolbar_real_machines.md) | 「待 review_gate 合入」 | **已改** |
| [evidence/H1_acceptance.md](../dev_v11/evidence/H1_acceptance.md) | 缺合入註記 | **已補** |
| CLAUDE.md §4.6 | V11「進行中」 | **已改**完成；新增 V12 |

**不帶入 V12 功能範圍：** 藍圖遷移、editorStore 改寫、擺放鏈、GridCanvas 接 store。

---

## 4. DoD

- [x] §2 比對表已確認
- [x] §3 列出的 V11／CLAUDE 文件已回寫
- [x] todolist_v12 可標 B1 `[x]`，並解除 B1 封鎖列

---

## 5. 開發日誌

### 2026-09-11

- gh 確認 #40／#43 MERGED；回寫 V11／CLAUDE／AGENT_ROADMAP；本細項結案
