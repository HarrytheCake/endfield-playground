# V13-B1 — V12 殘項收斂（前置）

**對應工項：** V13-B1
**狀態：** `[x]` 完成（2026-09-19）
**日期：** 2026-09-19
**正式依據：** [todolist_v12](../todolist_v12.md)、[V12_acceptance_guide](../dev_v12/V12_acceptance_guide.md)、[W0914-A0](../../../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md) DoD

---

## 1. 背景

V12 的程式已由 PR [#45](https://github.com/dernoson/endfield-playground/pull/45) 合入 master，但 V12 文件停在「PR 待審」的狀態。本細項只做**交叉比對＋文件收斂**，不帶新程式刀進 V13——沿用 [V12-B1 收斂 V11](../dev_v12/B1_v11_residue_close.md) 的同一套作法。

---

## 2. 交叉比對（git／GitHub）

| 交付 | PR | 狀態 | 合入時間（UTC） | merge commit |
|------|-----|------|-----------------|--------------|
| A0 layoutStore 契約＋`/dev` 演示 | [#45](https://github.com/dernoson/endfield-playground/pull/45) | **MERGED** | 2026-09-14T17:12:28Z | `f95ed9f` |

| 程式路徑 | master 現況 | 結論 |
|----------|-------------|------|
| `src/store/layoutStore.ts` | **有** | W0914-A0 DoD「`git cat-file -e origin/master:src/store/layoutStore.ts` 成立」達成 |
| `src/types/layout.ts`（含 `PlacementResult`／`LayoutIssues`） | 有 | V13 C1／C2／D1 的型別基準 |
| `src/__tests__/store/layoutStore.test.ts` | 有 | — |
| `src/app/dev/LayoutStorePreview.vue`＋`layoutStorePreviewUtils.ts` | **有**（隨 #45 一起交） | W0914-A0 §4 的二選一已選「一起交」；不是留本地 |
| `dev/layout-store-preview.html`（Vite 獨立入口） | 有 | 不掛 `src/router`／`DevLayout` |
| `src/store/editorStore.ts` | 未動簽名 | V12 硬約束成立 |

**程式殘刀：無。** V12 DoD 程式項皆已合入。

### 2.1 順帶確認的一件事

W0914-A0 §4 要求「演示頁去留不要留在中間狀態」。結論是**一起交了**——`src/app/dev/LayoutStorePreview.vue`、`layoutStorePreviewUtils.ts` 與對應測試都在 master 上。這一點對 V13-D1 有影響：該檔裡的 belt 佈線純函式（`buildBlockedXy`／`bfsGridPath`／`findRoutableBeltWaypoints`／`compressGridPath`）**已經在版控裡**，0921 若要升格到 `src/utils/layout/` 是搬家，不是重寫。

---

## 3. 文件殘項（已處置）

| 檔 | 過期寫法 | 處置 |
|----|----------|------|
| [todolist_v12.md](../todolist_v12.md) 狀態總覽 | 「A–E 完成（E1 待 PR 合入）」 | **已改**「全版結案」＋合入時間／commit；補指向 V13 |
| [todolist_v12.md](../todolist_v12.md) 封鎖表 E1 | 「PR 待合入」 | **已改**「#45 已合入 master」 |
| [todolist_v12.md](../todolist_v12.md) DoD 首條 | 「在 master **或可審 PR**」 | **已改**「已在 master」 |
| [dev_v12/evidence/E1_unlock.md](../dev_v12/evidence/E1_unlock.md) §6 | PR 狀態「待審」 | **已改** MERGED＋commit；補一句 W0914-A0 DoD 達成 |
| [todolist_v12.md](../todolist_v12.md) 開發日誌 | 缺結案記錄 | **已補** 2026-09-19 一則 |

**未處置（依負責人 2026-09-19 裁示，本次不動）：**

| 檔 | 現況 | 為什麼不動 |
|----|------|-----------|
| [claude/CLAUDE.md](../../claude/CLAUDE.md) §4.6 版本索引 | V12 仍寫「進行中」；無 V13 列 | 負責人選擇本次只收斂 todolist；索引待下次一併更新 |
| [claude/AGENT_ROADMAP.md](../../claude/AGENT_ROADMAP.md) | v1.6，仍指 0907／AGENT_WEEK_0907 | 同上 |
| [docs/aaaaa/README.md](../../README.md) | 未反映 V12 結案 | 同上；本版無程式產出，對外狀態未變 |

> 這三項是**已知過期**，不是漏掉。下次動 CLAUDE 索引時一併補 V12 完成／V13 現行。

---

## 4. 帶進 V13 的待決

| 項 | 來源 | 本版處置 |
|----|------|----------|
| `historyStore` 全域堆疊 | V12 PR 第二輪 review §4，當時記「本 PR 不處理」 | **不進 V13 範圍**（負責人 9/19 裁）；只在 [todolist_v13](../todolist_v13.md) 待決追蹤表留列 |

該待決的實質內容：`layoutStore` 的變更類 action 全部經 `useHistoryStore()` 組 Command，與舊藍圖世界共用同一個全域堆疊。佈局殼接進主畫面後（T1／#50），使用者在佈局視角按 undo 可能退回一個流程視角的操作。**要等殼真的接上、能觀察到實際行為，再決定是否分堆疊。**

**不帶入 V13 功能範圍：** 擺放鏈實作、選取接線、`canConnect`／`blueprintIo` 實作、任何 `src/` 變更。

---

## 5. DoD

- [x] §2 比對表已確認（#45 MERGED、master 路徑存在）
- [x] §3 列出的 V12 文件已回寫
- [x] §3 未處置項已明列，不留「以為改了」的落差
- [x] §4 待決已登進 todolist_v13 追蹤表
- [x] todolist_v13 可標 B1 `[x]`，V13 前置成立

---

## 6. 開發日誌

### 2026-09-19

- `gh` 確認 #45 MERGED（2026-09-14T17:12:28Z，`f95ed9f`）；`git log` 確認 merge commit 在 master
- 回寫 todolist_v12 四處與 evidence/E1_unlock §6；CLAUDE／AGENT_ROADMAP／README 依裁示不動並明列
- 確認演示頁隨 #45 一起交（非留本地）→ belt 佈線純函式已在版控，供 D1 引用
