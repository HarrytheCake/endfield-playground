# R-B4 — 選取與設備資訊面板

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §4 |
| 里程碑 | M2（2026-09-27）；首次可演示 9/13 |
| 擋門檻 | **是**（主編步驟 5） |
| 建議主責／備援 | L2 攤平（toby／harry 暫定）＋L3 呈現（MBD／goodmorning）／aaaaa |
| 性質 | 接線 ＋ 畫面 |
| 依賴 | [A2](./A2_grid_and_port_alignment.md)、[B2](./B2_placement_chain.md) |
| 狀態 | `[~]` 進行中（W0823-T1 提前切片已合入；攤平契約未完成） |
| 最後更新 | 2026-08-30 |

---

## 1. 背景與動機

主編步驟 5「點選顯示設備資訊」是整條主線裡**最容易做出可見成果、風險最低**的一項：不需要新演算法、不需要新 action，資料全部現成，只要把選取狀態接到面板。它同時是驗證「L2 攤平、L3 只吃 props」這條分層規則是否真的跑得動的第一個實例。

過去這類任務失敗的模式是把 `FactoryNode` 原物件整包丟進 L3，L3 於是開始 `node.data.xxx?.yyy`，一路長出對 store 結構的隱性依賴。本項要把攤平這一步做出範例，後面的右側產耗表（[D1](./D1_stats_item_summary.md)）與警訊列表（[D2](./D2_e001_overlap_alert.md)）都照抄。

## 2. 使用者看得到什麼

點畫布上一台設備，右側（或 Inspector）出現這台機的名稱、佔格、配方、耗電；點空白處資訊消失。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 選取狀態 | `src/store/selectionStore.ts` | 已有 |
| Inspector 殼 | `src/editor/inspector/InspectorSidebar.vue`、`InspectorPanel.vue` | 殼已存在 |
| 機器查詢 | `getMachine`／`getMachineById` | 已有 |
| 配方查詢 | `getRecipesForMachine(machineName, modeId?)` | 已有 |
| 機器模式 | `resolveMachineMode`／`modes[]` | 已有（V7／V9） |
| 視覺稿 | `docs/paper/` 資訊欄稿 | 對齊 9/20，不擋門檻 |

## 4. 技術決策

### 4.1 攤平契約（本項的核心交付）

L2 負責把 store 物件轉成 plain props，L3 只認以下形狀：

| prop | 型別 | 來源 | 缺值 |
|------|------|------|------|
| `name` | `string` | `machine.name` | 必有 |
| `machineId` | `string` | `machine.id` | 必有 |
| `sizeText` | `string` | `"3×2"`，rotation 已套用 | 必有 |
| `modeLabel` | `string \| null` | 目前 `machineMode` 的 label | 單模態給 `null` |
| `recipes` | `{ label: string; inputs: string; outputs: string; timeText: string }[]` | `getRecipesForMachine` 攤平（**`RecipeDef` 無 `name`**，`label` 由 L2 自行組字） | 空陣列 |
| `powerText` | `string \| null` | 耗電，含單位 | 無資料給 `null` |
| `portsText` | `string` | 例如 `"入 2／出 1"` | 必有 |

**L3 不得收到 `FactoryNode`、`Machine`、`RecipeDef` 任何原始型別。** 所有數值在 L2 就轉成可直接顯示的字串，L3 不做格式化、不做單位換算、不做 fallback 判斷。

### 4.2 方案比較：資訊放哪一塊

| 方案 | 位置 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 右側 StatsPanel 加一個 Tab | 與產耗表同區 | 右側只有一塊，不搶版面 | 11 月產耗表要進來時會打架 | 否 |
| **B. 既有 Inspector** | `InspectorSidebar.vue` | 殼已存在；與產耗表分離 | 右側同時有兩塊需協調寬度 | **是** |
| C. 畫布上浮動卡片 | 貼著設備 | 直觀 | 遮擋畫布；需處理定位，成本高 | 否 |

採 B。主編大綱寫「右側或 Inspector」，兩者皆可；選 Inspector 是因為殼已存在且 11 月不會與產耗表爭位置。

### 4.3 配方顯示的範圍

9 月只顯示**靜態資料**：這台機能做哪些配方、每個配方吃什麼出什麼。**不顯示**目前實際產速——那是 11 月 [D1](./D1_stats_item_summary.md) 接 `flowStore` 之後的事。這條界線要寫進工單，否則很容易被要求「順便把效率也顯示出來」。

### 4.4 多選與空選

| 情況 | 顯示 |
|------|------|
| 未選取 | 空狀態文案（例如「點選設備以查看資訊」） |
| 選取 1 台 | 完整資訊 |
| 選取多台 | 本階段顯示「已選取 N 台」即可；框選多物本身不在 11/29 範圍 |

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | `src/editor/inspector/InspectorSidebar.vue` | L2 容器：讀 `selectionStore`＋`editorStore`，攤平成 §4.1 props |
| 修改 | `src/editor/inspector/InspectorPanel.vue` | L3 呈現：只吃 props |
| 唯讀 | `src/store/selectionStore.ts`、`src/data/machines.ts`、`src/data/products.ts` | |
| **不碰** | `flowStore`、`validationStore`、`FactoryCanvas.vue` 互動 | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 09/13 | 點選設備 → 資訊區出現名稱＋佔格（配方可先 mock） |
| 09/20 | 接真實 `getRecipesForMachine`；套 paper 資訊欄視覺 |
| 09/27 | **門檻：** 名稱、佔格、配方、耗電齊備；空狀態正確 |

## 7. 不做

- 不顯示即時產速、效率、流量（11 月）
- 不做可編輯欄位（源素材設定是 [C5](./C5_source_primary_output.md)）
- 不做多選聚合統計
- 不在 L3 做任何格式化或 fallback

## 8. 依賴與封鎖

| 依賴 | 說明 |
|------|------|
| [B2](./B2_placement_chain.md) | 要先放得上設備才有東西可選 |
| [A2](./A2_grid_and_port_alignment.md) | `sizeText`／`portsText` 正確性依賴資料修正 |
| paper 資訊欄稿 | 不擋門檻 |

本項可與 [B2](./B2_placement_chain.md) 並行：先用手動塞進 store 的節點驗證面板，不必等擺放鏈完全打通。

## 9. DoD

- [~] 點選一台設備，Inspector 顯示名稱、佔格、配方、耗電 —— **名稱／佔格／耗電已有**（PR #33）；**配方尚未**
- [x] 點空白處回到空狀態（文案「未選取設備」）
- [ ] `InspectorPanel.vue` 不 import 任何 store 與 `src/data/*`（code review 確認）——**未達**：現況仍 `import` `editorStore`／`selectionStore`／`getMachine`（T1 允許唯讀 store；正式 B4 須拆攤平）
- [ ] props 形狀與 §4.1 一致，全部為 plain 值
- [ ] 佔格文字在設備旋轉後跟著更新（現況顯示 `width×height` 定義值，未跟 node rotation）
- [x] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過（合入時閘）

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 把 `FactoryNode` 整包丟進 L3 | DoD 列入 import 檢查；[E2](./E2_layer_guard_pr_rules.md) 列為退回理由 |
| 被要求順便顯示效率 | §4.3 明寫界線；要加請開 11 月工項 |
| L3 未必有人接 | 攤平（L2）與呈現（L3）拆成兩張工單；L3 未交時容器直接輸出純文字列表頂替 |

**未交頂替：** L3 視覺可丟棄，攤平契約不可丟棄——後續 [D1](./D1_stats_item_summary.md)、[D2](./D2_e001_overlap_alert.md) 都要照抄這個範例。

## 11. 開發日誌

### 2026-08-22
- 建檔

### 2026-08-25
- W0823-T1 改指向本項提前切片（原 canvas／overlay 因佈局自建排廢除）

### 2026-08-30
- toby PR #33 合入：`InspectorPanel.vue` 顯示選取設備名稱／佔格／耗電＋空狀態
- **距離 §4.1 攤平契約仍有差距**（面板直接讀 store＋`getMachine`）；9/13 切片應優先拆 L2 攤平層，再補配方

### 2026-08-30（08/31 週派工前檢修）

- **[W0831-T1](../../work_dispatch/toby/0831/W0831-T1_inspector_flatten.md) 只做 §4.1 的子集**：`name`／`machineId`／`sizeText`／`powerText` 四項先攤成 plain 值；`modeLabel`／`recipes`／`portsText` 留 09/13–09/20。理由是本週 L2 僅 toby 3–5h 單線，一次上齊七欄會跨週延宕（派工規則 10）。
- **配方欄位勘誤：** §4.1 寫 `recipes[].name`，但 `RecipeDef` **無 `name` 欄位**……（工單 GUIDE 已按此更正）。
- **拆檔位置：** 若本週拆出展示子元件，限 `src/editor/inspector/`；§5 的 `InspectorSidebar.vue` 為容器角色，維持不變。

### 2026-08-30 晚（主編會議）

- **佈局拔 Vue Flow 提前開工** → 本週 **不加深**綁在現行 Vue Flow 選取上的 Inspector 功能。
- W0831-T1 **改寫**：先澄清「抱著整包機器資料」≠ 資料驗證；可選輕量攤平（不要求點選演示）或 Discord 回「等佈局」結案。
- 上週合入後點選可能沒反應——記為已知，**不**派修畫布。正式 B4 加深改掛新選取契約之後。

### 2026-09-21（W0914 結算）

**本項本週無派工，但出現一項必須擋下的風險。**

W0914 的右側工單是**產線總覽 StatsPanel**（[S1](../../work_dispatch/shirone/0914/W0914-S1_stats_panel_land.md)），不是本項——9/15 的 PR #49 review 已更正過一次，此處再記一遍以免後續誤讀。

**⚠ `InspectorSidebar` 不得被移除。** MBD 於 9/20 在 `dev/MBD` 分支改了 `src/app/layouts/MainLayout.vue`，移除了 `InspectorSidebar` 的 import、`inspectorOpen` ref 與整個標籤。該分支未開 PR，**這份 diff 不得合入**——`InspectorSidebar` 是本項呈現端的唯一入口，刪掉等於把 B4 已合入的成果（PR #33 的 `InspectorPanel.vue`）從主畫面斷開。已回寫大綱 §4 的 R-B4 條目。

**前置狀態更新：** 主畫面已於 9/20 換成 `MainLayout` → `LayoutView` → `GridCanvas`（PR #50）。§4.1 攤平契約要接的「新選取契約」，其載體從此是 `LayoutView.vue` 與 `layoutStore`，**不再是 `FactoryCanvas` 的 Vue Flow 選取**。§5 檔案計畫在本項重啟時需依此重訂。

本項仍等 [B2](./B2_placement_chain.md) 的落子鏈，且 B2 已由「等前置」改為「等裁決」。**本項不列 M2 硬綁**（9/15 撤回擴大後維持），改列 M3 前置。

### 2026-09-23（主編裁決）

**風險關閉：主編裁定 `dev/MBD` 不合入**（該分支 6 筆 commit 整批不進 master，MBD 原本的 StatsPanel 樣式工作轉由 shirone 承接）。移除 `InspectorSidebar` 的那份 diff 不會再有合入路徑，上一條目的 ⚠ 解除。

**本項續鎖。** 同日 B2 解鎖的範圍只有**點擊落子**；**選取／旋轉／刪除未放行**，本項送審一律退回。前置不變：等 B2 落子鏈進 master。
