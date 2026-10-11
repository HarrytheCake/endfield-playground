# V13 TODOLIST — C2／D4 契約重訂草案＋0921 落子前置（本週 aaaaa）

**版本：** V13
**建立日期：** 2026-09-19
**負責人：** aaaaa
**前置：** [V12 已結案](./todolist_v12.md)（PR [#45](https://github.com/dernoson/endfield-playground/pull/45) 於 2026-09-14 合入 master）
**正式工單：** [W0914-A1](../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)（次優・可超前・不擋門檻）
**已結案工單：** [W0914-A0](../../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md)（#45 合入即達 DoD；不在本版另立工項）
**上游：** [WEEK_20260914](../../work_dispatch/WEEK_20260914.md) v1.1、[ROADMAP_OUTLINE](../../roadmap/ROADMAP_OUTLINE.md) **v1.10**（R-C2／R-D4 封鎖已於 9/19 解除）
**門檻週：** 2026-09-14 → 2026-09-20（**9/27 門檻倒數第二週**）
**開發分支：** `dev/aaaaa0914`
**狀態總覽：** **`[x]` 全版結案**（2026-09-19 交付；PR [#51](https://github.com/dernoson/endfield-playground/pull/51) 於 2026-09-20T17:48:47Z 合入，merge `9a8da88`）
**收斂於：** [V14-B1](./dev_v14/B1_v13_residue_close.md)（2026-09-27）
**後續版本：** [todolist_v14](./todolist_v14.md)（W0921-A0 落子前預檢＋W0921-A1 連線規則提前量）
**對應 PR：** [#51](https://github.com/dernoson/endfield-playground/pull/51)（2026-09-19 送出；合入時十六檔全在 `docs/`，零 `src/`）
**驗收指南：** [dev_v13/V13_acceptance_guide.md](./dev_v13/V13_acceptance_guide.md)
**待確認問題：** [dispatch_private/0914/PENDING_DECISIONS_20260920.md](../collaborator_survey/dispatch_private/0914/PENDING_DECISIONS_20260920.md)（多數已落入 WEEK_0921；續掛見 [PENDING_20260927](../collaborator_survey/dispatch_private/0921/PENDING_DECISIONS_20260927.md)）

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
- L2（toby／harry）：本版不改任何 src/，對 #50 零影響
- L3（goodmorning）：ToolbarPanel 限視覺，不在 L2 之列；本版對 #48 亦零影響
```

### 交付宣告（本版不發解鎖句）

本版**不發**任何 `layout-*` 解鎖句。理由：解鎖句的用途是放行 L2 的下一刀，而本版交付是文件與契約定義，**擺放／選取本週仍鎖**（[WEEK_20260914 §2](../../work_dispatch/WEEK_20260914.md)）。PR body 改寫一句範圍宣告：

```text
本 PR 僅文件：C2／D4 契約重訂草案＋0921 落子前置盤點。未動 src/；不解鎖擺放／選取。
```

---

## V13-A｜範圍與定案

- [x] **V13-A1** 7 項決策落版；與 W0914-A1／V12／0921 前置的邊界
  - 細項：[dev_v13/A1_scope_decision.md](./dev_v13/A1_scope_decision.md)

---

## V13-B｜V12 殘項收斂（前置）

- [x] **V13-B1** 交叉比對 #45 已合入；回寫 todolist_v12 狀態／封鎖表／DoD 與 E1 證據；確認無程式殘刀帶入 V13
  - 細項：[dev_v13/B1_v12_residue_close.md](./dev_v13/B1_v12_residue_close.md)

---

## V13-C｜契約重訂草案（W0914-A1 主線）

- [x] **V13-C1** C2 連線契約：六條規則逐條標「成立／改寫／作廢」；`ConnectResult` discriminated union；規則落在哪一層
  - 細項：[dev_v13/C1_c2_connect_contract.md](./dev_v13/C1_c2_connect_contract.md)
  - 產物：**已改寫** [roadmap/detail/C2](../../roadmap/detail/C2_add_connection_contract.md) §1／§3／§4／§5／§6／§8／§9／§10／§11，狀態 `[!]` → `[ ]`

- [x] **V13-C2** D4 藍圖格式：`BlueprintFile` 改 `devices`／`pipelines`；`version: 2`；不讀舊檔
  - 細項：[dev_v13/C2_d4_blueprint_format.md](./dev_v13/C2_d4_blueprint_format.md)
  - 產物：**已改寫** [roadmap/detail/D4](../../roadmap/detail/D4_blueprint_json_io.md) §1／§3／§4／§5／§6／§8／§9／§10／§11，狀態 `[!]` → `[ ]`
  - 依賴：C1（§4.6.1 的匯入端過濾引用 C2 的 `canConnect`）——**已解**

---

## V13-D｜0921 落子前置盤點

- [x] **V13-D1** 盤出 B2 在 L1 側的缺口＝落子前預檢無入口；交 `canPlaceDevice`／`canMoveDevice` 簽章草案、落點檔案、0921 週切片建議；相鄰缺口只記錄不決策
  - 細項：[dev_v13/D1_placement_precheck_gap.md](./dev_v13/D1_placement_precheck_gap.md)
  - 產物：本細項本身即交付物（無程式產物）

---

## V13-E｜驗收、PR、交接

- [x] **V13-E1** 對照 W0914-A1 §5 DoD；回寫 ROADMAP_OUTLINE §9 封鎖表；PR body 範圍宣告；0921 交接摘要
  - 細項：[dev_v13/E1_acceptance_and_handoff.md](./dev_v13/E1_acceptance_and_handoff.md)
  - 驗收：[dev_v13/V13_acceptance_guide.md](./dev_v13/V13_acceptance_guide.md)
  - 產物：**已回寫** [ROADMAP_OUTLINE](../../roadmap/ROADMAP_OUTLINE.md) v1.10（§1.2 藍圖格式、§2 工項總表、§5 R-C2、§6 R-D4、§8 里程碑備註、§9 封鎖表兩列解除、§12 版本紀錄）
  - 產物：**已建** [PENDING_DECISIONS_20260920](../collaborator_survey/dispatch_private/0914/PENDING_DECISIONS_20260920.md)（待確認問題分級與 0921 派工對照）

---

## 封鎖／待決追蹤

**分級判準：這題沒答案，本版做不做得完？** 結論是**全部做得完** → 本版先交付完畢，問題整批移入 [PENDING_DECISIONS_20260920](../collaborator_survey/dispatch_private/0914/PENDING_DECISIONS_20260920.md)，於 9/20 週會與進度同時報告並決策，決完編入 0921 派工。

| ID | 原因 | 等待對象 | 阻擋本版？ | 何時決 |
|----|------|---------|-----------|--------|
| ~~C2（D4 草案）依賴 C1~~ | ~~§4.6.1 匯入端過濾引用 C2 的 `canConnect`~~ | — | — | **已解**（C1 於 9/19 定稿） |
| D1 `canPlaceDevice` **實作** | 本版只出簽章草案 | 主編 | **否**，本版交付不含實作 | **9/20 週會**（A-1） |
| S1 未動 → MBD 9/21 無檔可接 | 派工設計疏漏：S1 不押死線卻被當前置 | 主編 | **否**，非 aaaaa 工項 | **9/20 週會**（A-2） |
| #48 掛 5 天無活動 | 等審或等改不明；`mergeable=UNKNOWN` | 主編＋paper | **否**，本版 diff 零重疊 | **9/20 週會**（A-3） |
| 選取面歸屬（R-B4） | `selectionStore` 或 `layoutStore` 未決；跨 CR-01 邊界 | 主編＋aaaaa | **否** | 0921 派工（B-1） |
| `createPlacedDevice` 工廠 | `label` 預設值屬呈現決策 | paper＋aaaaa | **否** | 0921 派工（B-2） |
| `rotateDevice` action（R-B3） | 排序視 B2 進度 | 主編 | **否** | 0921 派工（B-3） |
| belt 佈線純函式升格 | 現住 `src/app/dev/layoutStorePreviewUtils.ts`（dev-only） | C3 owner | **否** | B2／C3 開刀時（B-4） |
| ~~R-C2 的 L2 呼叫端 owner~~ | ~~10/18 draft highlight 那一刀~~ | — | — | **已決（2026-09-20）：toby** |
| ~~Zod 依賴（D4 驗證）~~ | ~~新依賴需同意~~ | — | — | **已決（2026-09-20）：核准引入**，手寫守衛退路移除 |
| `historyStore` 全域堆疊 | V12 PR §4 遺留；佈局與舊藍圖共用單一堆疊，undo 會跨領域跳 | 主編 | **否** | 佈局殼接完後（C-3） |
| — | **不動** `src/`／`editorStore`／toby／goodmorning／harry 的檔 | — | — | 本版硬鎖 |

---

## 完成定義（Definition of Done）

### 主線（對照 [W0914-A1 §5](../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)）

- [x] C2 §4 已改寫為新模型版本，六條規則逐條標「成立／改寫／作廢」（3 改寫／1 成立／2 作廢＋新增規則 7）
- [x] C2 回傳型別為 discriminated union，與 `PlacementResult` 風格一致
- [x] D4 §4.1 schema 已改為 `devices`／`pipelines`
- [x] D4 版本號（`2`）與舊檔政策（不讀舊檔）各一句話寫進文件
- [x] 兩份 detail 狀態欄 `[!]` → `[ ]`，各補開發日誌一則
- [x] [ROADMAP_OUTLINE §9](../../roadmap/ROADMAP_OUTLINE.md) 封鎖表對應兩列已回寫（改劃線並註明解除日期與去向）
- [x] D1 交出 `canPlaceDevice` 簽章草案、落點檔案、0921 切片建議
- [ ] PR body 有範圍宣告（純文件、不解鎖擺放）

### 品質閘

- [x] `diff` 不含任何 `src/` 路徑
- [x] `diff` 不含 `src/editor/*`、不含 `addConnection` 實作（W0914-A1 §5 明列）
- [x] 無需跑 `pnpm type-check`／`test`（未動程式）；若臨時動到 `src/` 則本條失效，須全閘跑過

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
| A1 C2 | §4 六條規則重訂 | **[x]** | C1；detail/C2 全檔改寫 |
| A1 D4 | schema＋版本號＋舊檔政策 | **[x]** | C2；detail/D4 全檔改寫 |
| A1 狀態 | 兩份 detail `[!]` → `[ ]` | **[x]** | E1；ROADMAP_OUTLINE 升 v1.10，§9 兩列解除 |
| （追加） | 0921 落子前置盤點 | **[x]** | D1；非工單項，負責人 9/19 追加 |
| （追加） | 待確認問題分級與延後 | **[x]** | PENDING_DECISIONS_20260920；負責人 9/19 追加 |

---

## 開發日誌

### 2026-09-27｜V14-B1 收斂

- [V14-B1](./dev_v14/B1_v13_residue_close.md) 交叉比對：#51 MERGED、detail/C2／D4 非 `[!]`、§9 兩列已解除、零 `src/` 殘刀、W0921-A0 指向 V13-D1 §3
- **文件殘項：** `dev_v13/` 五份細項 meta 仍 `[ ]`（與本檔 `[x]` 矛盾）→ 已改 `[x]` 並勾 DoD
- 本檔補「收斂於／後續版本」；CLAUDE／AGENT_ROADMAP／README 依前例不動（已知過期）
- **無程式殘刀帶入 V14**；簽章單一來源＝D1 §3

### 2026-09-20｜主編 review 回應

- **謬誤更正（主編指出）：** §下游消費者原寫「L2（toby／harry／goodmorning）」，**goodmorning 不屬 L2**。
  他的 [W0914-G1](../../work_dispatch/goodmorning/0914/W0914-G1_toolbar_land.md) 本週是 `ToolbarPanel.vue` **限視覺**（L3 呈現），
  該工單 §不做 自己就寫明「把工具列接到新畫布的落子＝**L2 的接線，9/21 起**」。我把「開著 PR 的三個人」直接當成 L2 名單，
  是拿**合入帶寬**的分組去套**分層**——兩者不是同一組人
- **主編三項決斷已落檔：**
  1. 舊藍圖不轉換（v2 拒讀 v1）→ [detail/D4 §4.3](../../roadmap/detail/D4_blueprint_json_io.md)；由 aaaaa 提案升為主編決斷
  2. 引入 Zod → [detail/D4 §4.7](../../roadmap/detail/D4_blueprint_json_io.md)；手寫守衛退路移除，另補「schema 為單一來源」約束
  3. R-C2 的 L2 呼叫端＝toby → [detail/C2 §8](../../roadmap/detail/C2_add_connection_contract.md)
- 上表待決 **C-1／C-2 結案**；C-3（`historyStore` 全域堆疊）續掛
- **PR [#50](https://github.com/dernoson/endfield-playground/pull/50) 於 2026-09-20T12:57:30Z 合入 master**（主編 APPROVED）。
  佈局容器已在樹上 → 本版非目標中「碰 `src/editor/layout/*`」的封鎖理由消失，但本版仍不動 `src/`；
  影響的是 detail/C2 的 10/18 切片有容器可接，已回寫該檔 §8

### 2026-09-19（下午）｜全版交付

- **待確認問題分級：** 依「這題沒答案，本版做不做得完」判定，盤出的 10 項**全部不阻擋**
  → 照負責人指示先把本週開發做完，問題整批移入 [PENDING_DECISIONS_20260920](../collaborator_survey/dispatch_private/0914/PENDING_DECISIONS_20260920.md)，
  分 A（9/20 週會必答 3＋流程 1）／B（0921 派工當下 4）／C（10 月以後 3）三組，各帶建議選項與無答預設，
  並附「決策 → 0921 派工」對照表
- **C1／C2 產物落地：** `roadmap/detail/C2`、`roadmap/detail/D4` 兩份全檔改寫，狀態 `[!]` → `[ ]`
- **E1 產物落地：** ROADMAP_OUTLINE 升 **v1.10**；§9 兩列自 2026-08-25 起的封鎖**正式解除**
- **順帶成果：** 重訂過程消掉兩項跨 CR 協商需求（C2 不改 `editorStore.addConnection`；D4 沿用 `loadSnapshot`）
  → detail/C2 §6 的內部防線切片由 10/18 提前至 10/11
- 分級原則本身建議寫進 AGENT_ROADMAP §7（目前只說「不確定就問」，未區分「現在得問」與「可先做完再問」）；
  此建議列在 PENDING_DECISIONS §1，非本版交付

### 2026-09-19（上午）｜開版

- V12 結案確認：PR #45 於 2026-09-14T17:12:28Z 合入 master（merge commit `f95ed9f`）；
  W0914-A0 DoD 主項達成 → **A0 不在 V13 另立工項**
- 負責人確認 7 項決策（範圍／C2 union／D4 v2 拒舊檔／0921 只收 canPlaceDevice／純文件／history 只追蹤／分支）
- 依 W0914-A1 與 0921 前置開 V13；本版為 V5 結構以來第一個**純文件版本**
- 盤點現況：`src/app/dev/layoutStorePreviewUtils.ts` 的 belt 佈線純函式住在 dev-only 檔，
  B2 自動拉線與 C3 折線渲染要用得先升格 → 列入 D1 相鄰缺口
