# V16 TODOLIST — C5 `setDevicePrimaryOutput`（本週 aaaaa｜W1011-A0）

**版本：** V16
**建立日期：** 2026-10-18
**負責人：** aaaaa
**前置：** [V15](./todolist_v15.md) 程式已合 master（[#60](https://github.com/dernoson/endfield-playground/pull/60)／[#65](https://github.com/dernoson/endfield-playground/pull/65)）；文件收斂見 [V16-B1](./dev_v16/B1_v15_residue_close.md)
**正式工單：** [W1011-A0](../../work_dispatch/aaaaa/1011/W1011-A0_c5_primary_output.md)（確定・兩件；本版實作＝② `setDevicePrimaryOutput`）
**上游：** [WEEK_20261011](../../work_dispatch/WEEK_20261011.md) **v1.2**、[ROADMAP_OUTLINE](../../roadmap/ROADMAP_OUTLINE.md) **v1.19**、[C5](../../roadmap/detail/C5_source_primary_output.md)、[AGENT_WEEK_1011](../claude/AGENT_WEEK_1011.md)
**週次：** 2026-10-11 → 2026-10-18（連線月第二週；設備拖曳＋畫布樣式；**無技術門檻日**；M3＝10/25）
**開發分支：** `dev/aaaaa1011`
**狀態總覽：** **`[x]` 已結案／已合 master**（[#72](https://github.com/dernoson/endfield-playground/pull/72) MERGED 2026-10-18；續見 [V17](./todolist_v17.md)）
**待確認問題：** [dispatch_private/1011/PENDING_DECISIONS_20261018.md](../collaborator_survey/dispatch_private/1011/PENDING_DECISIONS_20261018.md)（A／B／D-1／D-2 已裁；C 組不擋本版）

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）
>
> **範圍宣告：** 本版＝`layoutStore.setDevicePrimaryOutput`＋測試＋進歷史。**不發解鎖句**。不做正式頁表單、不做引擎改掛（只在 PR 註明 10/18→10/25 接法）。不碰 toby／harry／樣式鎖檔。
> **執行計畫：** 本檔＋`dev_v16/` **即為**本週 aaaaa 執行計畫檔。

---

## 概述

### 目標

1. **② C5 寫入 action：** `setDevicePrimaryOutput(uid, itemId | null, ratePerMin?) → void`；寫 `PlacedDevice.primaryOutput`／`sourceRatePerMin`；進歷史；可 Undo
2. **引擎讀取接法註記：** PR 寫明經 `toTopology` 餵引擎；**本版不實作**引擎改掛
3. **零鎖檔衝突：** 不碰 `GridCanvas`／`LayoutView`／`MainLayout`／`ToolbarPanel`／Stats／shapes／detectors
4. **V15 文件收斂：** todolist／E1／D1 狀態對齊「#60／#65 已合 master」

### 已定案（2026-10-18｜開版＋負責人確認）

| # | 項 | 結論 |
|---|-----|------|
| 1 | 版本範圍 | **V16＝W1011-A0 ②**；①派工已完成不列實作 |
| 2 | store 歸屬 | **已裁 B**＝`layoutStore`／`PlacedDevice.primaryOutput`（PR #59） |
| 3 | 回傳 | **`void`**（對齊 C5／工單） |
| 4 | 未知 uid | **靜默 no-op，且不進歷史** |
| 5 | 預設速率 | 省略 `ratePerMin`＝**30**／min；`itemId === null`＝清除欄位 |
| 6 | 歷史型別 | **已決**＝`HistoryRecordType.MachineRecipeChange` |
| 7 | 引擎讀取 | **已決**＝經 `toTopology`；本版只寫 PR；實作排 10/18→10/25（見 [D1](./dev_v16/D1_engine_read_path.md)） |
| 8 | 解鎖句 | **不發** |
| 9 | 分支 | **`dev/aaaaa1011`** |

詳見 [A1_scope_decision.md](./dev_v16/A1_scope_decision.md)。

### 非目標（本版不做）

- 正式頁源素材下拉／左面板表單（harry／H2 槽；依 C5 排 10/18）
- 引擎全面改掛 `layoutStore`／整包右側產耗（D1；本版只註明最小接法）
- 速率輸入 UI、多產出、產品當源產出
- 改 `GridCanvas`／`LayoutView`（toby T2）、`MainLayout`（harry H2）
- 碰 `editorStore` 簽名、旋轉／Delete／選取面架構
- C1 拉管線互動（owner＝toby；10/18 週）
- 發解鎖句

### 流程大綱

```text
A 定案 → B V15 收斂（前置）
      → C1 setDevicePrimaryOutput＋測試（必做）
      → D1 引擎讀取接法定案（寫進 PR；不實作）
      → E1 驗收＋PR＋交接
```

### 週切片

| 區間 | 切片 | 對應 |
|------|------|------|
| → 10/18 | 定案落檔；V15 收斂；C1 開工 | A1、B1、C1 |
| 10/18 | 測試綠；D1 接法一句寫進 PR；開 PR | D1、E1 |
| → 10/18 驗 | 公開 **V8**（C5 寫入 action） | E1 |
| 10/18→10/25 | 引擎讀取最小切片（下版） | 非本版 |

### 下游消費者（PR 必寫）

```text
下游消費者：
- 10/18 引擎讀切片（aaaaa）：經 toTopology 讀 PlacedDevice.primaryOutput
- 左面板表單（日後 harry／H2 槽）：只呼叫 setDevicePrimaryOutput；不自 mutate
- toby T2／harry H2／樣式鏈：本版零檔案交集
```

### 交付宣告（本版不發解鎖句）

```text
本 PR 交付 layoutStore.setDevicePrimaryOutput（進歷史、可 Undo）。
不改 editorStore；不做正式頁表單；不做引擎改掛。
10/18 引擎讀取最小接法：經 toTopology(layoutStore 快照) 餵入引擎建圖。不發解鎖句。
```

---

## V16-A｜範圍與定案

- [x] **V16-A1** 開版決策落版；與 W1011-A0／V15／鎖表邊界（2026-10-18）
    - 細項：[dev_v16/A1_scope_decision.md](./dev_v16/A1_scope_decision.md)

---

## V16-B｜V15 殘項收斂（前置）

- [x] **V16-B1** 確認 #60／#65 在 master；todolist_v15／E1／D1 指向已合入
    - 細項：[dev_v16/B1_v15_residue_close.md](./dev_v16/B1_v15_residue_close.md)

---

## V16-C｜C5 寫入 action（W1011-A0 ②・必做）

- [x] **V16-C1** `setDevicePrimaryOutput`＋測試；進歷史；不寫 `editorStore`
    - 細項：[dev_v16/C1_set_device_primary_output.md](./dev_v16/C1_set_device_primary_output.md)
    - 產物：`src/store/layoutStore.ts`（新增 action）、`src/__tests__/store/layoutStore.primaryOutput.test.ts`
    - 對照公開驗收：**V8**

---

## V16-D｜引擎讀取接法定案（PR 註記・本版不實作）

- [x] **V16-D1** 接法已決＝經 `toTopology`；PR body 一句待開 PR 時寫入
    - 細項：[dev_v16/D1_engine_read_path.md](./dev_v16/D1_engine_read_path.md)
    - 對照：C5 §4.1a 附帶義務；實作＝下週

---

## V16-E｜驗收、PR、交接

- [x] **V16-E1** 品質閘 `[x]`；PR [#72](https://github.com/dernoson/endfield-playground/pull/72) **MERGED**；合入回寫見 [V17-B1](./dev_v17/B1_v16_residue_close.md)
    - 細項：[dev_v16/E1_acceptance_and_handoff.md](./dev_v16/E1_acceptance_and_handoff.md)

---

## 封鎖／待決追蹤

| ID | 原因 | 等待對象 | 阻擋本版？ | 何時決 |
|----|------|----------|------------|--------|
| ~~PENDING D-1~~ | ~~歷史型別~~ | — | **已決＝MachineRecipeChange** | 2026-10-18 |
| ~~PENDING D-2~~ | ~~引擎讀取接法~~ | — | **已決＝經 toTopology** | 2026-10-18 |
| — | **不動** GridCanvas／LayoutView／MainLayout／toolbar／Stats／shapes／detectors | — | — | 本版硬鎖 |
| — | 正式頁表單／引擎改掛 | — | **否**（非本版） | 10/18→10/25 |

---

## 完成定義（Definition of Done）

### 主線（對照 [W1011-A0 §3](../../work_dispatch/aaaaa/1011/W1011-A0_c5_primary_output.md)）

- [x] 派工①已發（WEEK＋工單在 master；PR #66）
- [x] `setDevicePrimaryOutput` 有測試；進歷史；可 Undo
- [x] PR 註明 10/18 引擎讀取最小接法（經 `toTopology`）
- [x] 未改 `editorStore` 簽名；未改 C1／toby／harry 鎖檔
- [x] `pnpm type-check`／lint-check／format-check／test 綠（929）

### 品質閘

- [x] diff 不含 `src/editor/layout/*`、`MainLayout`、`ToolbarPanel`、Stats、shapes、detectors
- [x] diff 不含選取／旋轉／Delete 接線、不含 `editorStore` 簽名變更
- [x] 不發解鎖句

---

## 未交頂替

| 工項 | 未交影響 |
|------|----------|
| C1 ② | 10/18 引擎讀無欄可寫；正式頁源永遠產不出數字 |
| D1 接法註記 | 下週開工多猜一天；不擋本版合入但擋交接清晰度 |
| B1 V15 收斂 | 文件狀態漂移；不擋程式 |
| E1 PR | 擋公開 V8 |

---

## 本週工項檢核（對照 W1011-A0）

| 工項 | 工單要求 | V16 狀態 | 備註 |
|------|----------|----------|------|
| ① | 派工已發 | `[x]` | PR #66；已在 master |
| ② | `setDevicePrimaryOutput`＋測試＋進歷史 | `[x]` | 2026-10-18 |
| PR 註 | 10/18 引擎讀接法（toTopology） | `[x]` | 寫入 PR body |
| 邊界 | 未改 editorStore／C1 檔 | `[x]` | C1 實作確認 |

---

## 開發日誌

### 2026-10-18｜V16 結案

- [#72](https://github.com/dernoson/endfield-playground/pull/72) MERGED；主編核准；續 #73／V17（機型 id 查表＋引擎讀最小切片）

### 2026-10-18｜V16-E1 開 PR

- 驗收表全過；開 [#72](https://github.com/dernoson/endfield-playground/pull/72)（body 註明引擎讀＝經 `toTopology`）；合入後再結案回寫

### 2026-10-18｜V16-C1 完成

- `setDevicePrimaryOutput`＋6 測綠；歷史＝`MachineRecipeChange`；未知／重複 uid 不進歷史
- 品質閘全綠（929 tests）；**下一刀＝E1 開 PR**

### 2026-10-18｜D-1／D-2／未知 uid 定案

- 負責人確認：歷史＝`MachineRecipeChange`；引擎讀＝經 `toTopology`；未知 uid＝靜默 no-op 且不進歷史
- D1 細項勾選；下一刀＝C1 實作

### 2026-10-18｜開版

- 對齊 `origin/master`（含 #60／#65／#66 及後續合入）
- 依 WEEK v1.2／W1011-A0／C5 開 V16；前提＝V15 收斂
- 決策層 `dispatch_private/1011/` 補 INTRO；AGENT_WEEK_1011 對齊執行計畫
- 分支 `dev/aaaaa1011`；下一刀＝C1（`setDevicePrimaryOutput`）
