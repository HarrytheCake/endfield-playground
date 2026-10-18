# V17-H3 — #58 驗收、PR、交接

**對應工項：** V17-H3
**狀態：** `[~]` 品質閘全綠；[#76](https://github.com/dernoson/endfield-playground/pull/76) 交審中（base＝`dev/aaaaa1018`／#74）
**日期：** 2026-10-18
**依賴：** [H1](./H1_stop_auto_demo_snapshot.md)、[H2](./H2_clear_history_on_context_switch.md)
**正式依據：** [#58](https://github.com/dernoson/endfield-playground/issues/58)
**與 G1 關係：** [G1](./G1_acceptance_and_handoff.md)＝**#73**（[#74](https://github.com/dernoson/endfield-playground/pull/74)）；本細項＝**#58** 專線驗收
**開發分支：** `dev/aaaaa1018-58`

---

## 1. 驗收表（實作後填）

| # | 步驟 | 預期 | 結果 |
|---|------|------|------|
| 1 | 硬重新整理進 `/` | 空白畫布；無自動 connected | ✅ H1 程式＋契約測；手動待 reviewer |
| 2 | 正式頁放置一點 → `/dev/*` 操作 → 回 `/` → Ctrl+Z | 不誤撤 dev 操作；堆疊語意符合 H2 | ✅ H2 單元測（跨界 `undoDepth===0`）；手動待 reviewer |
| 3 | `pnpm type-check`／lint／format／test | 綠 | ✅ 55 files／965 tests（format 補修契約測後） |
| 4 | 知會 toby／harry：空畫布驗收改手動 | PR／會議一句 | ✅ 寫入 [#76](https://github.com/dernoson/endfield-playground/pull/76) body |

---

## 2. PR

| 項 | 內容 |
|----|------|
| PR | [#76](https://github.com/dernoson/endfield-playground/pull/76) |
| 標題 | `fix(#58)：正式頁停載示範＋切換情境清空 history（V17-H）` |
| 分支 | **`dev/aaaaa1018-58`** → **`dev/aaaaa1018`**（疊在 [#74](https://github.com/dernoson/endfield-playground/pull/74) 上；#74 合入後 retarget `master`） |
| 關聯 | Closes #58；Refs #57 S1-2；Refs #74／#73 |
| 解鎖句 | **不發** |

### 2.1 PR body 必含

```text
## Summary
- 正式頁 LayoutView 不再 onMounted 自動 loadSnapshot(connected)
- 跨正式／dev 情境時 historyStore.clear()（策略見 V17-H2）
- 獨立 HTML layout-store-preview 另 Pinia，與 SPA 本就隔離

## 下游
- 正式頁空進＝空白；示範改走 /dev
- toby／harry：空畫布驗收改手動放置

Refs #57 S1-2
Closes #58
```

---

## 3. 交接

| 產物 | 對象 |
|------|------|
| 正式頁無自動 fixture | 產品空畫布語意 |
| history 情境隔離 | 所有寫 history 的 SPA `/dev` 頁作者 |
| 會議復現腳本 | [INTRO](../../../work_dispatch/aaaaa/1011/INTRO_meeting_c5_primary_output.md) §3.5 已標 H1／H2 已修 |

---

## 4. 合入後回寫

- [ ] todolist_v17 H 線結案；若 #73 已合則 V17 可整版 `[x]`
- [ ] AGENT_WEEK_1018
- [ ] 關閉 #58
- [ ] INTRO 會議檔（已預標已修；合入後再核）

---

## 5. DoD

- [x] H1＋H2 DoD 滿足
- [x] §1 品質閘通過（#1／#2 手動待 reviewer）
- [x] PR 已開（[#76](https://github.com/dernoson/endfield-playground/pull/76)；Closes #58）

---

## 6. 開發日誌

### 2026-10-18｜開 PR

- 開 [#76](https://github.com/dernoson/endfield-playground/pull/76)；base＝`dev/aaaaa1018`（避開把 #73 再對 master 重複送審）

### 2026-10-18｜品質閘

- type／lint／format／test 全綠（965 tests）
- 契約測 prettier 補修
- 先逐項 commit

### 2026-10-18

- 建檔；與 G1（#73／#74）分線
