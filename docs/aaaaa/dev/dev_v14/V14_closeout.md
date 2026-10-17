# V14 收斂盤點 — 0921 公開工單 × 執行計畫（2026-09-27）

**分支：** `dev/aaaaa0921`
**對照：** [W0921-A0](../../../work_dispatch/aaaaa/0921/W0921-A0_placement_precheck.md)、[W0921-A1](../../../work_dispatch/aaaaa/0921/W0921-A1_connect_rules.md)、[todolist_v14](../todolist_v14.md)
**品質閘實跑：** `pnpm test` → **46 files／854 tests** 綠；`type-check` 綠
**結論一句：** **程式與驗收已收斂；[#54](https://github.com/dernoson/endfield-playground/pull/54)／[#55](https://github.com/dernoson/endfield-playground/pull/55) 於 2026-09-27 MERGED（master 有 `placementCheck`／`connectRules`）。** 文件狀態收斂見 [V15-B1](../dev_v15/B1_v14_residue_close.md)。

---

## 0. 併入 T1（#55）

| 項 | 處理 |
|----|------|
| 方式 | `git merge origin/dev/toby`（保留原 commit；合入 #54 時 #55 自動 marked merged） |
| `placementCheck` | **單一份**：保留本 PR 的 `canMoveDevice`＋`DRAFT_ID` 撞名防護；`LayoutView` 採 `DeepReadonly`（相容 Pinia 唯讀面，T1 `LayoutView.vue` 直傳 store） |
| 測試 | 兩邊 `placementCheck` 案例合併；`layoutStore.test.ts` **未改** |
| L2 | `usePlacementIntent`／`GridCanvas`／`LayoutView`／`ToolbarPanel` script 來自 T1，呼叫端未另改 |
| 連線缺口 | 第 1 點已修；第 2 點＝P7 已知缺口 |
---

## 1. 公開工單對照

| 公項               | 等級               | 程式 DoD                                                             | 超額／偏離                                                     | 公開狀態             |
| ------------------ | ------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------- |
| **W0921-A0**（V2） | 確定・最優・擋門檻 | **齊**（`placementCheck`＋store 提共用；`layoutStore.test.ts` 未改） | 無                                                             | **已合 master（#54）** |
| **W0921-A1**       | 次優・不擋門檻     | **齊**（錨點共用＋`canConnect`）                                     | ①方向＝有序 output→input；②**提前** `addPipeline`←`canConnect` | **同 PR 第二節・已合** |

公開工單 DoD 核取方塊若仍未勾，屬文件債、不擋後續版本。

---

## 2. V14 執行項狀態

| 項                  | 狀態                                                                 | 備註                               |
| ------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| A1 定案             | `[x]`                                                                | 決策 #6 已被防線提前覆寫，見 §3 P2 |
| B1 V13 收斂         | `[x]`                                                                |                                    |
| C1 A0               | `[x]`                                                                |                                    |
| D1 A1               | `[x]`                                                                | 含方向修正＋store 防線             |
| E1 驗收／說明／演示 | `[x]`                                                                |                                    |
| E1 開 PR            | `[x]` [#54](https://github.com/dernoson/endfield-playground/pull/54) | 單 PR 分節                         |
| E1 合入／上游回寫   | `[x]` 合入已核；文件 meta 見 V15-B1                                   | P5 殘件可續掛（公開 DoD 勾選等）   |

---

## 3. 待處理問題

### P1｜開 PR — **已定案**

- [#54](https://github.com/dernoson/endfield-playground/pull/54)；單 PR 分節。

### P1b｜審核：單端斷線仍查命中端 — **本 PR 已修**

- 規則 7 只表示 null **本身**不違規；已命中端仍套用方向／媒質／單埠單線。
- `direction.ports` 改為 `PortRef[]`（單端時長度 1）。

### P2｜A1「本週不做 addPipeline」已提前做完

- 預覽曾可寫入非法管線；store 已擋。
- 10/04 可少做該防線；PR body 明寫提前量。

### P3｜方向比 C2 改寫句更嚴

- 實作＝有序 `output → input`。PR 對齊「回復原文必須 output→input」。

### P4｜門檻鏈仍缺 T1（非本版）

- 公開 V1＝toby；本 PR 不交落子鏈。

### P5｜合入後上游回寫（**部分完成｜V15-B1**）

| 檔                    | 動作                  | 2026-10-10 |
| --------------------- | --------------------- | ---------- |
| todolist_v14／closeout／E1 | 狀態改已合 master | **已做（V15-B1）** |
| ROADMAP detail/B2     | 開發日誌：L1 預檢已交 | 可續掛／非擋 |
| ROADMAP_OUTLINE §9.1  | 門檻結算              | WEEK_1004 已結算 M2；可續掛細勾 |
| 公開 W0921-A0／A1 DoD | 勾選                  | 可續掛 |
| REVIEW／PENDING       | 補合入狀態            | 0921 決策層可補一行 |

### P6｜不在本版

- 選取／旋轉／刪除；解鎖句；L2 highlight（10/18）；T1。

### P7｜`addDevice`／`moveDevice` 可貼埠繞過 `canConnect`（**已知缺口・本 PR 不修**）

審核於 #54 重現：先放懸空 `pipe` 管線，再 `moveDevice` 讓 belt 埠錨點落在端點上 → store `ok`，但對同佈局重跑 `canConnect` 得 `media`。

- **原因：** `canConnect` 只接在 `addPipeline`；放置／移動只跑 `assessInvolving`（佔格）。
- **本 PR：** 不修（超出「連線 draft／addPipeline 防線」切片；需在移動後重掃既有管線語意）。
- **後續：** 建議排 10/04+ 或獨立工項——`moveDevice`／`addDevice` 成功後對受影響管線重跑 `canConnect`，或 `layoutIssues` 納入連線語意。
- **PR／文件：** 標為已知缺口，不宣稱「繞過 UI 也擋得住」涵蓋移動貼埠。

---

## 4. 0928 交接用一句

```text
V14：A0 placementCheck＋A1 canConnect（錨點／媒質共用；方向＝output→input；
addPipeline 已接 canConnect）。#54／#55 已合 master。不發解鎖句。
toby 接 canPlaceDevice；conflicts 認 __draft__。
```

### 2026-10-10｜V15-B1

- `gh pr view`：#54／#55 MERGED；master 有產物檔；todolist 結案
