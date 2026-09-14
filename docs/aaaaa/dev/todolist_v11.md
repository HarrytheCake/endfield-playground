# V11 TODOLIST — 佈局 L1 打底（SVG 自建｜本週 aaaaa）

**版本：** V11  
**建立日期：** 2026-08-31  
**負責人：** aaaaa  
**前置：** V10 個人交付已收斂（F1／H1 以手動完成標注；殘項不帶入本版）  
**正式工單：** [W0831-A0](../../work_dispatch/aaaaa/0831/W0831-A0_layout_l1_foundation.md)（最優）、[W0831-A1](../../work_dispatch/aaaaa/0831/W0831-A1_toolbar_real_machines.md)（次優）  
**上游：** [LAYOUT_REWRITE_EARLY_START_0831](../LAYOUT_REWRITE_EARLY_START_0831.md)、[佈局視角渲染層自建_初步規劃與評估](../佈局視角渲染層自建_初步規劃與評估.md)、[R-B2](../../roadmap/detail/B2_placement_chain.md)  
**門檻週：** 2026-08-31 → 2026-09-06  
**開發分支：** A0→`dev/aaaaa0831`（已合入）；A1→`dev/aaaaa0831-h1`  
**狀態總覽：** `[x]` A–H **完成**；A0 PR [#40](https://github.com/dernoson/endfield-playground/pull/40)、A1 PR [#43](https://github.com/dernoson/endfield-playground/pull/43) **皆已合入 master**（#43＝2026-09-04）  
**驗收指南：** [dev_v11/V11_acceptance_guide.md](./dev_v11/V11_acceptance_guide.md)

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）
>
> **範圍宣告：** 本版＝本週 aaaaa 工項（A0＋A1）。時數衝突時 **A0＞A1**。  
> **執行計畫：** 本檔＋`dev_v11/` **即為**佈局 L1 執行計畫檔（評估文「計畫檔未產出」由此承接）。  
> **實作策略：** 接手 API／演算法先依原定寫法落地；驗證階段再逐步修正，不在初稿階段發明第二套契約。

---

## 概述

### 目標

1. **L1 打底可解鎖 L2：** `types/layout`＋`resolveConnections`＋`toTopology` **三件皆可測**後，方可發 §2 宣告
2. **既有 4／6 對齊規劃檔名並補測**（含 `portAnchor` → `portAnchors`）
3. **`/dev` 格點演示為本版必要**（看得見格子／連線衍生結果的前置）
4. **不動 `editorStore`：** 只交型別、純函式、Breaking 註記；store 改寫不在本版
5. **次優 B1：** 工具列 ≥1 分類真實機器名＋佔格（與既有五顆按鈕並存）

### 已定案（2026-08-31｜負責人確認）

| # | 項 | 結論 |
|---|----|------|
| 1 | 版本範圍 | **V11**＝A0＋A1；優先序 **A0＞A1** |
| 2 | L2 解鎖門檻 | **型別＋`resolveConnections`＋`toTopology` 兩支皆可測** |
| 3 | store | **不動**；只型別／純函式／Breaking 註記 |
| 4 | `types/layout` vs `footprint` | layout＝領域模型；footprint＝幾何 DTO，由 layout 轉入 |
| 5 | `toTopology` 輸出 | **適配現有 FlowEngine** nodes／edges 形，隔離引擎 |
| 6 | 連線判定 | 管線端點格＝埠外側錨點（`resolvePortAnchorCell`）→ 衍生 Connection；無對上＝斷線（管線保留） |
| 7 | 既有 4／6 | **對齊檔名＋補測**（含 `portAnchors`） |
| 8 | `/dev` 格點 | **本版必要** |
| 9 | V10 殘項 | **不帶入**；F1／H1 手動完成 |
| 10 | 分支 | `dev/aaaaa0831` |
| 11 | 計畫檔 | 本 todolist＋`dev_v11/` 即執行計畫 |

詳見 [A1_scope_decision.md](./dev_v11/A1_scope_decision.md)。

### 非目標（本版不做）

- 改寫 `editorStore`（`nodes`／`edges` → `devices`／`pipelines` 實作）
- 加深舊 `FactoryCanvas`／`FlowNodeOverlay`／Vue Flow 佈局畫布
- L2 強綁：GridCanvas 產品化、B2 落子鏈、選取端、畫布互動
- L3 MachineCard 正式視覺、刪除／改寫既有五顆工具列按鈕
- 擴張 `EquipmentType`、改 store 簽名、`dataTransfer` key、接 `armPlacement`
- V10 文件收尾以外的歷史版重寫

### 流程大綱

```text
A 定案 → B types/layout → C 既有 utils 對齊／補測
      → D resolveConnections → E toTopology
      → F /dev 格點演示 → G 驗收＋解鎖宣告
      H B1 工具列（次優；時數讓位 A0）
```

### 週切片

| 區間 | 切片 | 對應 |
|------|------|------|
| → 約 9/1 | 定案落檔；types 草圖＋Breaking；utils 改名／補測 | A1、B1、C1 |
| → 約 9/3 | `resolveConnections`／`toTopology` 可測 | D1、E1 |
| → 9/6 | `/dev` 格點必要演示；解鎖宣告或「缺什麼」；B1 盡力 | F1、G1、H1 |

### 下游消費者（PR 必寫）

```text
下游消費者：
- L2（toby／harry 等宣告後）：GridCanvas 只讀渲染／擺放薄片吃 types/layout ＋純函式
- FlowEngine：經 toTopology adapter 吃 nodes／edges 形；本版不改引擎本體
- B2：等 L1 宣告＋後續 store 模型；本版不接落子
- W0831-S1 MachineCard：吃 B1 攤好的 id／name／sizeText（未交用列表頂替）
- goodmorning G1：只做工具列視覺，與 B1 資料列表互不擋
```

### L2 解鎖句（達門檻時發）

```text
layout-L1：types/layout + resolveConnections + toTopology 可測已推；L2 可開 <允許的下一刀>
```

未達則 PR／Discord 寫明「尚未解鎖、缺什麼」。**未發此句 → 全隊 L2 強綁維持等待。**

---

## V11-A｜範圍與定案

- [x] **V11-A1** 11 項決策落版；與 A0／A1／既有 layout utils／FlowEngine adapter 邊界
  - 細項：[dev_v11/A1_scope_decision.md](./dev_v11/A1_scope_decision.md)

---

## V11-B｜型別與 Breaking 註記

- [x] **V11-B1** `types/layout.ts`：PlacedDevice／Pipeline／衍生 Connection；轉 footprint；Breaking 註記（`devices`／`pipelines`）
  - 細項：[dev_v11/B1_types_layout.md](./dev_v11/B1_types_layout.md)
  - 產物：`src/types/layout.ts`、`src/utils/layout/toFootprint.ts`、`toFootprint.test.ts`

---

## V11-C｜既有 layout utils 對齊

- [x] **V11-C1** `portAnchor` → `portAnchors`；補 `deviceOccupancy` 等缺測；全綠
  - 細項：[dev_v11/C1_layout_utils_align.md](./dev_v11/C1_layout_utils_align.md)
  - 產物：`portAnchors.ts`、`deviceOccupancy.test.ts`

---

## V11-D｜resolveConnections

- [x] **V11-D1** 純函式＋測試：端點＝埠錨點 → Connection；斷線保留管線
  - 細項：[dev_v11/D1_resolve_connections.md](./dev_v11/D1_resolve_connections.md)
  - 產物：`resolveConnections.ts`、`resolveConnections.test.ts`（6）

---

## V11-E｜toTopology

- [x] **V11-E1** 純函式＋測試：layout → FlowEngine 可用的 nodes／edges 形
  - 細項：[dev_v11/E1_to_topology.md](./dev_v11/E1_to_topology.md)
  - 產物：`toTopology.ts`、`toTopology.test.ts`（4）；可餵 `buildGraph`

---

## V11-F｜／dev 格點演示（必要）

- [x] **V11-F1** `/dev` 頁：看得見格子＋衍生連線（或斷線）結果；不接 editorStore
  - 細項：[dev_v11/F1_dev_grid_preview.md](./dev_v11/F1_dev_grid_preview.md)
  - 產物：`LayoutL1Preview.vue`、`mockLayout.ts`；路由 `/dev/layout-l1-preview`

---

## V11-G｜驗收、PR、解鎖宣告

- [x] **V11-G1** 品質閘；PR；達門檻則發 layout-L1 解鎖句，否則標缺什麼
  - 細項：[dev_v11/G1_acceptance_and_unlock.md](./dev_v11/G1_acceptance_and_unlock.md)
  - 證據：[dev_v11/evidence/G1_unlock.md](./dev_v11/evidence/G1_unlock.md)
  - PR：https://github.com/dernoson/endfield-playground/pull/40（**已合入 master**）
  - 解鎖句：`layout-L1：types/layout + resolveConnections + toTopology 可測已推；L2 可開最小 GridCanvas 只讀渲染（仍待 store 模型另開）`

---

## V11-H｜B1 工具列真機器（次優）

- [x] **V11-H1** ToolbarPanel ≥1 分類真實機器名＋佔格；與五顆按鈕並存；不接 store 落子
  - 細項：[dev_v11/H1_toolbar_real_machines.md](./dev_v11/H1_toolbar_real_machines.md)
  - 產物：`toolbarMachines.ts`、`ToolbarPanel.vue`；測 4 綠
  - 證據：[dev_v11/evidence/H1_acceptance.md](./dev_v11/evidence/H1_acceptance.md)
  - PR：https://github.com/dernoson/endfield-playground/pull/43
  - 驗收：主 app `/` 手動（無 `/dev` 專頁）；見 [V11_acceptance_guide §2](./dev_v11/V11_acceptance_guide.md)

---

## 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 解除條件 |
|----|---------|---------|----------|
| B1 | — | — | **已解除**（A1 定案；B1 型別已落地） |
| C1 | — | — | **已解除**（portAnchors 改名＋deviceOccupancy 補測） |
| D1 | — | — | **已解除**（resolveConnections 可測） |
| E1 | — | — | **已解除**（toTopology 可測；解鎖三件齊） |
| F1 | — | — | **已解除**（`/dev/layout-l1-preview`） |
| G1 | — | — | **已解除**（解鎖句已發；PR #40 已合入 master） |
| H1 | — | — | **已解除**（真實機器列表並存；不接落子） |
| — | **不動** editorStore／舊畫布加深 | — | 本版硬鎖 |

---

## 完成定義（Definition of Done）

### L1 主線（解鎖硬標準）

- [x] `src/types/layout.ts`（或等價）可編譯；Breaking 註記已寫
- [x] `resolveConnections` 單元測試綠
- [x] `toTopology` 單元測試綠
- [x] 既有 layout utils 檔名對齊＋補測綠
- [x] `/dev` 格點演示可跑（本版必要）
- [x] 未改 `editorStore` 簽章；未加深舊 Vue Flow 佈局畫布
- [x] 達門檻：已發 `layout-L1：…；L2 可開 …`

### B1 次優

- [x] ≥1 分類真實機器名＋`width×height`；既有五顆按鈕仍可用；未呼叫 store 落子

### 品質閘

- [x] `pnpm type-check`／`lint-check`／本範圍 `test` 可過（layout 59＋toolbar 4＝63）
- [x] A0 PR #40 含下游消費者與 Breaking 註記；A1 PR #43 已合入（含 H1 下游段落）

---

## 未交頂替

| 工項 | 未交影響 |
|------|----------|
| B／D／E（解鎖三件） | **不得**發 L2 解鎖句；下週強綁 L2 維持等待 |
| C1 改名／補測 | 不擋「函式可測」字面，但 PR 應完成以免下游 import 分裂 |
| F1 `/dev` | **本版必要**；未交則 G1 不得標個人驗收完成 |
| H1 B1 | 不擋 L1 解鎖；9/6 演示弱化；9/27 整包仍硬綁 B1 |
| store 改寫 | 本版刻意不做；B2 仍缺 store 模型（宣告後另開） |

---

## 本週工項檢核（對照 W0831-A0／A1）

| 工項 | 工單要求 | V11 狀態 | 備註 |
|------|----------|----------|------|
| A1 定案 | 範圍／契約 | [x] | 11 項 |
| B1 型別 | types/layout＋Breaking | [x] | toFootprint＋測 |
| C1 utils | 檔名對齊＋補測 | [x] | portAnchors＋deviceOccupancy 測 |
| D1 連線 | resolveConnections 可測 | [x] | 解鎖必要 |
| E1 拓樸 | toTopology 可測 | [x] | 解鎖必要 |
| F1 演示 | /dev 格點 | [x] | `/dev/layout-l1-preview` |
| G1 驗收 | 品質閘＋解鎖句 | [x] | 見 evidence/G1_unlock |
| H1 B1 | 工具列真機器 | [x] | 並存列表；不接落子 |

---

## 開發日誌

### 2026-08-31

- 依 W0831-A0／A1、EARLY_START、佈局評估文開 V11
- 負責人確認 11 項決策；解鎖門檻升為型別＋兩支皆可測；`/dev` 升必要；utils 改名＋補測
- 實作策略：原定 API／演算法先寫，驗證階段再修
- V10 F1／H1 手動完成、不帶入本版
- 分支：`dev/aaaaa0831`
- **V11-B1 完成：** `types/layout`＋`toFootprint`＋測試 5 綠；type-check 過；不動 store
- **V11-C1 完成：** `portAnchors` 改名；`deviceOccupancy.test.ts`；layout 測 47 綠
- **V11-D1 完成：** `resolveConnections` 幾何對齊；測試 6；layout 測 53 綠
- **V11-E1 完成：** `toTopology` Adapter；斷線不進 edges；可餵 `buildGraph`；layout 測 57 綠；**解鎖三件齊**
- **V11-F1 完成：** `/dev/layout-l1-preview`；connected／broken fixture；mockLayout 測 2；可發 G1 解鎖句
- **V11-G1 完成：** 品質閘過；解鎖句已發；證據 `evidence/G1_unlock.md`；PR #40 已合入 master
- **V11-H1 完成：** 工具列真實機器分類列表與五顆並存；點選＝本地＋console；不接 store

### 2026-09-11

- V12-B1 收斂：確認 PR [#43](https://github.com/dernoson/endfield-playground/pull/43) 已於 2026-09-04 MERGED；本檔狀態總覽／品質閘改為已合入；V11 **結案**（後續 store 見 [todolist_v12](./todolist_v12.md)）

### 2026-09-01

- PR #40 合入 master；H1 自最新 master 切 `dev/aaaaa0831-h1` 續推
- 新增 [V11_acceptance_guide.md](./dev_v11/V11_acceptance_guide.md)、[H1_acceptance.md](./dev_v11/evidence/H1_acceptance.md)
- 回寫 W0831-A0／A1 與 WEEK_20260831 驗收步驟；A1 PR [#43](https://github.com/dernoson/endfield-playground/pull/43)（其後已合入，見 2026-09-11）
