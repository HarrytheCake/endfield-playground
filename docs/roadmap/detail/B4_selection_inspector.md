# R-B4 — 選取與設備資訊面板

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §4 |
| 里程碑 | M2（2026-09-27）；首次可演示 9/13 |
| 擋門檻 | **是**（主編步驟 5） |
| 建議主責／備援 | L2 攤平（toby／harry 暫定）＋L3 呈現（MBD／goodmorning）／aaaaa |
| 性質 | 接線 ＋ 畫面 |
| 依賴 | [A2](./A2_grid_and_port_alignment.md)、[B2](./B2_placement_chain.md) |
| 狀態 | `[ ]` 未開始 |
| 最後更新 | 2026-08-22 |

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
| `recipes` | `{ name: string; inputs: string; outputs: string; timeText: string }[]` | `getRecipesForMachine` 攤平 | 空陣列 |
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

- [ ] 點選一台設備，Inspector 顯示名稱、佔格、配方、耗電
- [ ] 點空白處回到空狀態
- [ ] `InspectorPanel.vue` 不 import 任何 store 與 `src/data/*`（code review 確認）
- [ ] props 形狀與 §4.1 一致，全部為 plain 值
- [ ] 佔格文字在設備旋轉後跟著更新
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 把 `FactoryNode` 整包丟進 L3 | DoD 列入 import 檢查；[E2](./E2_layer_guard_pr_rules.md) 列為退回理由 |
| 被要求順便顯示效率 | §4.3 明寫界線；要加請開 11 月工項 |
| L3 未必有人接 | 攤平（L2）與呈現（L3）拆成兩張工單；L3 未交時容器直接輸出純文字列表頂替 |

**未交頂替：** L3 視覺可丟棄，攤平契約不可丟棄——後續 [D1](./D1_stats_item_summary.md)、[D2](./D2_e001_overlap_alert.md) 都要照抄這個範例。

## 11. 開發日誌

### 2026-08-22
- 建檔。攤平契約設計為後續右側面板的通用範例，欄位刻意全部為 plain 字串以杜絕 L3 做格式化
