# V13 TODOLIST — C2／D4 契約重訂草案＋0921 落子前置（本週 aaaaa）

**版本：** V13
**建立日期：** 2026-09-19
**負責人：** aaaaa
**前置：** [V12 已結案](./todolist_v12.md)（PR [#45](https://github.com/dernoson/endfield-playground/pull/45) 於 2026-09-14 合入 master）
**正式工單：** [W0914-A1](../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)（次優・可超前・不擋門檻）
**已結案工單：** [W0914-A0](../../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md)（#45 合入即達 DoD；不在本版另立工項）
**上游：** [WEEK_20260914](../../work_dispatch/WEEK_20260914.md) v1.1、[ROADMAP_OUTLINE](../../roadmap/ROADMAP_OUTLINE.md) v1.9（R-C2／R-D4 皆 `[!]`）
**門檻週：** 2026-09-14 → 2026-09-20（**9/27 門檻倒數第二週**）
**開發分支：** `dev/aaaaa0914`
**狀態總覽：** `[ ]` A–E 未開始
**驗收指南：** [dev_v13/V13_acceptance_guide.md](./dev_v13/V13_acceptance_guide.md)

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）
>
> **範圍宣告：** 本版為**純文件版本**。交付＝兩份 roadmap detail 的 §4 重訂＋一份落子前置盤點；**不動 `src/`**。
> **執行計畫：** 本檔＋`dev_v13/` **即為** C2／D4 重訂與 0921 前置的執行計畫檔。

---

## 概述

### 目標

1. **C2 連線契約重訂：** 把建立在 `FactoryNode`／`FactoryEdge` 上的六條規則，改寫成 `PlacedDevice`／`Pipeline` 版本，逐條標「成立／改寫／作廢」
2. **D4 藍圖格式重訂：** schema 改 `devices`／`pipelines`，版本號與舊檔政策各一句話定死
3. **0921 落子前置：** 盤出 B2 擺放鏈在 L1 側的實際缺口（落子前預檢），交簽章草案與週切片建議
4. **兩份 detail 脫離 `[!]`：** 狀態改 `[ ]`（已定義、待實作），回寫 [ROADMAP_OUTLINE §9](../../roadmap/ROADMAP_OUTLINE.md) 封鎖表
5. **不阻擋合入帶寬：** 本週 #48（goodmorning）、#50（toby）仍開著，本版 diff 不得與其重疊

### 已定案（2026-09-19｜負責人確認）

| # | 項 | 結論 |
|---|----|------|
| 1 | 版本範圍 | **V13＝W0914-A1＋0921 落子前置**；A0 已合入，不另立工項 |
| 2 | C2 回傳形狀 | **discriminated union**，對齊既有 `PlacementResult`／`LayoutIssues` |
| 3 | D4 版本號 | **`version: 2`** |
| 4 | D4 舊檔政策 | **不讀舊檔**；匯入 `version: 1` 直接拒絕整檔並提示 |
| 5 | 0921 前置範圍 | **只收 `canPlaceDevice` 一項**；純文件（缺口盤點＋簽章草案＋切片建議），不動 `src/` |
| 6 | `historyStore` 全域堆疊 | **不進本版**；只在封鎖／待決追蹤表留列，等佈局殼接完再議 |
| 7 | 分支 | `dev/aaaaa0914` |

詳見 [A1_scope_decision.md](./dev_v13/A1_scope_decision.md)。

### 非目標（本版不做）

- 寫 `canConnect`／`blueprintIo`／`canPlaceDevice` 的**實作**與測試；寫匯出／匯入 UI
- 改 `editorStore.addConnection`、`editorStore` 任何簽名
- 動 `src/`（**含 `src/types/layout.ts`**）；[W0914-A1 §4](../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md) 允許落型別草案，本版選擇不用該額度（見 A1 §2.1）
- 碰 `src/editor/layout/*`、`src/app/layouts/MainLayout.vue`（toby PR #50 開著）
- 碰 `src/editor/toolbar/ToolbarPanel.vue`（goodmorning PR #48 開著）
- 碰 `src/editor/layout/useGridViewport.ts`、`src/router/*`（harry）
- 把 0921 前置擴大到 `rotateDevice`／選取面／belt 佈線純函式升格（僅記錄，不決策）
- 解鎖擺放／選取；本週互動仍鎖

### 流程大綱

```text
A 定案 → B V12 收斂（前置）
      → C1 C2 連線契約重訂 → C2 D4 藍圖格式重訂
      → D1 0921 落子前置盤點
      → E1 驗收＋PR＋交接
```

### 週切片

| 區間 | 切片 | 對應 |
|------|------|------|
| → 9/19 | 定案落檔；V12 收斂 | A1、B1 |
| → 9/20 | C2／D4 §4 重訂；落子前置盤點；PR | C1、C2、D1、E1 |

本版排在週末兩天，理由是 A0（#45）已於 9/14 合入、aaaaa 不在本週關鍵路徑上（關鍵路徑已轉到 toby T1／#50）。

### 下游消費者（PR 必寫）

```text
下游消費者：
- R-C2 實作（10/04 純函式門檻）：依本版 §4 重訂後的規則表與 ConnectResult 形狀開工
- R-D4 實作（11/08 純函式）：依本版 BlueprintFile v2 schema；loadSnapshot 已可當 loadBlueprint 用
- R-B2 擺放鏈（0921 起）：依 D1 的 canPlaceDevice 簽章草案；本版不實作
- L2（toby／harry／goodmorning）：本版不改任何 src/，對 #48／#50 零影響
```

### 交付宣告（本版不發解鎖句）

本版**不發**任何 `layout-*` 解鎖句。理由：解鎖句的用途是放行 L2 的下一刀，而本版交付是文件與契約定義，**擺放／選取本週仍鎖**（[WEEK_20260914 §2](../../work_dispatch/WEEK_20260914.md)）。PR body 改寫一句範圍宣告：

```text
本 PR 僅文件：C2／D4 契約重訂草案＋0921 落子前置盤點。未動 src/；不解鎖擺放／選取。
```

---

## V13-A｜範圍與定案

- [ ] **V13-A1** 7 項決策落版；與 W0914-A1／V12／0921 前置的邊界
  - 細項：[dev_v13/A1_scope_decision.md](./dev_v13/A1_scope_decision.md)

---

## V13-B｜V12 殘項收斂（前置）

- [ ] **V13-B1** 交叉比對 #45 已合入；回寫 todolist_v12 狀態／封鎖表／DoD 與 E1 證據；確認無程式殘刀帶入 V13
  - 細項：[dev_v13/B1_v12_residue_close.md](./dev_v13/B1_v12_residue_close.md)

---

## V13-C｜契約重訂草案（W0914-A1 主線）

- [ ] **V13-C1** C2 連線契約：六條規則逐條標「成立／改寫／作廢」；`ConnectResult` discriminated union；規則落在哪一層
  - 細項：[dev_v13/C1_c2_connect_contract.md](./dev_v13/C1_c2_connect_contract.md)
  - 產物：改寫 [roadmap/detail/C2](../../roadmap/detail/C2_add_connection_contract.md) §3／§4／§5／§11，狀態 `[!]` → `[ ]`

- [ ] **V13-C2** D4 藍圖格式：`BlueprintFile` 改 `devices`／`pipelines`；`version: 2`；不讀舊檔
  - 細項：[dev_v13/C2_d4_blueprint_format.md](./dev_v13/C2_d4_blueprint_format.md)
  - 產物：改寫 [roadmap/detail/D4](../../roadmap/detail/D4_blueprint_json_io.md) §3／§4／§5／§11，狀態 `[!]` → `[ ]`
  - 依賴：C1（§4.4 的匯入端過濾要引用 C2 的規則表）

---

## V13-D｜0921 落子前置盤點

- [ ] **V13-D1** 盤出 B2 在 L1 側的缺口＝落子前預檢無入口；交 `canPlaceDevice`／`canMoveDevice` 簽章草案、落點檔案、0921 週切片建議；相鄰缺口只記錄不決策
  - 細項：[dev_v13/D1_placement_precheck_gap.md](./dev_v13/D1_placement_precheck_gap.md)
  - 產物：本細項本身即交付物（無程式產物）

---

## V13-E｜驗收、PR、交接

- [ ] **V13-E1** 對照 W0914-A1 §5 DoD；回寫 ROADMAP_OUTLINE §9 封鎖表；PR body 範圍宣告；0921 交接摘要
  - 細項：[dev_v13/E1_acceptance_and_handoff.md](./dev_v13/E1_acceptance_and_handoff.md)
  - 驗收：[dev_v13/V13_acceptance_guide.md](./dev_v13/V13_acceptance_guide.md)

---

## 封鎖／待決追蹤

| ID | 原因 | 等待對象 | 解除條件 |
|----|------|---------|----------|
| C2（D4 草案） | §4.4 匯入端過濾引用 C2 規則表 | V13-C1 | C1 規則表定稿 |
| D1 `canPlaceDevice` **實作** | 本版只出簽章草案 | 主編週會（9/20）裁示 B2 是否 9/21 開刀 | 擺放解鎖 |
| `historyStore` 全域堆疊 | **待決**；V12 PR §4 遺留。佈局與舊藍圖共用單一堆疊，undo 會跨領域跳 | 主編 | 佈局殼接完（T1／#50 合入）後另議 |
| `createPlacedDevice` 工廠 | 相鄰缺口；本版只記錄 | — | 0921 派工時決 |
| `rotateDevice` action（R-B3） | 相鄰缺口；本版只記錄 | — | 0921 派工時決 |
| 選取面歸屬（R-B4） | 相鄰缺口；`selectionStore` 或 `layoutStore` 未決 | 主編＋aaaaa | 0921 派工時決 |
| belt 佈線純函式升格 | 相鄰缺口；現住 `src/app/dev/layoutStorePreviewUtils.ts`（dev-only） | — | B2／C3 開刀時 |
| — | **不動** `src/`／`editorStore`／toby／goodmorning／harry 的檔 | — | 本版硬鎖 |

---

## 完成定義（Definition of Done）

### 主線（對照 [W0914-A1 §5](../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)）

- [ ] C2 §4 已改寫為新模型版本，六條規則逐條標「成立／改寫／作廢」
- [ ] C2 回傳型別為 discriminated union，與 `PlacementResult` 風格一致
- [ ] D4 §4.1 schema 已改為 `devices`／`pipelines`
- [ ] D4 版本號（`2`）與舊檔政策（不讀舊檔）各一句話寫進文件
- [ ] 兩份 detail 狀態欄 `[!]` → `[ ]`，各補開發日誌一則
- [ ] [ROADMAP_OUTLINE §9](../../roadmap/ROADMAP_OUTLINE.md) 封鎖表對應兩列已回寫
- [ ] D1 交出 `canPlaceDevice` 簽章草案、落點檔案、0921 切片建議
- [ ] PR body 有範圍宣告（純文件、不解鎖擺放）

### 品質閘

- [ ] `diff` 不含任何 `src/` 路徑
- [ ] `diff` 不含 `src/editor/*`、不含 `addConnection` 實作（W0914-A1 §5 明列）
- [ ] 無需跑 `pnpm type-check`／`test`（未動程式）；若臨時動到 `src/` 則本條失效，須全閘跑過

---

## 未交頂替

| 工項 | 未交影響 |
|------|----------|
| C1 C2 草案 | **續順延至 10 月首週**；C2 純函式最遲 10/04，延一週仍在安全範圍。**不可再延第三次**（已延 9/07、9/14 兩次） |
| C2 D4 草案 | 同上；D4 純函式排 11/08，時間餘裕較大，但與 C2 同批交較省 review |
| D1 落子前置 | 0921 派工時由主編／aaaaa 現場盤，多花約 1h；不擋 B2 開工 |
| B1 V12 收斂 | **不可未交**；未收斂則 V13 前置不成立（本版已於 9/19 完成） |

---

## 本週工項檢核（對照 W0914-A0／A1）

| 工項 | 工單要求 | V13 狀態 | 備註 |
|------|----------|----------|------|
| A0 | #45 合入 master | **已達（V12）** | 2026-09-14T17:12:28Z；本版只做收斂回寫 |
| A1 C2 | §4 六條規則重訂 | [ ] | C1 |
| A1 D4 | schema＋版本號＋舊檔政策 | [ ] | C2 |
| A1 狀態 | 兩份 detail `[!]` → `[ ]` | [ ] | E1 |
| （追加） | 0921 落子前置盤點 | [ ] | D1；非工單項，負責人 9/19 追加 |

---

## 開發日誌

### 2026-09-19

- V12 結案確認：PR #45 於 2026-09-14T17:12:28Z 合入 master（merge commit `f95ed9f`）；
  W0914-A0 DoD 主項達成 → **A0 不在 V13 另立工項**
- 負責人確認 7 項決策（範圍／C2 union／D4 v2 拒舊檔／0921 只收 canPlaceDevice／純文件／history 只追蹤／分支）
- 依 W0914-A1 與 0921 前置開 V13；本版為 V5 結構以來第一個**純文件版本**
- 盤點現況：`src/app/dev/layoutStorePreviewUtils.ts` 的 belt 佈線純函式住在 dev-only 檔，
  B2 自動拉線與 C3 折線渲染要用得先升格 → 列入 D1 相鄰缺口
