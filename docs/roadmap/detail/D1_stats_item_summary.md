# R-D1 — 右側產耗表接 flowStore

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §6 |
| 里程碑 | M4（2026-11-29）；首次可演示 11/1 |
| 擋門檻 | **是**（主編步驟 7） |
| 建議主責／備援 | aaaaa（CR-04 主責）／— |
| 性質 | 接線 ＋ 畫面 |
| 依賴 | [B2](./B2_placement_chain.md)、[C1](./C1_port_hit_and_draft.md)、[C5](./C5_source_primary_output.md) |
| 狀態 | `[ ]` 未開始 |
| 最後更新 | 2026-08-22 |

---

## 1. 背景與動機

FlowEngine 完整、`flowStore` 完整、`ItemSummaryTable.vue` 存在、`MainLayout` 已掛 `useValidation()` 與 `useFlowEngine()`。**這一項在技術上幾乎沒有新東西要做。** 它之所以是門檻項，是因為它是整條主線的收束點：只有當畫布上的節點帶著正確的 `machineType`、正確的 handle、正確的 `primaryOutput`，右側的數字才會動。

換句話說，本項的實際工作有一半是**除錯前面九個工項留下的資料問題**。ROADMAP §2.2 已經預告了這件事：「若右側空白，是 L2／L3 沒讀 store，或畫布資料缺 `machineType`／handle／源產出，不是要重寫引擎。」這句話要當成本項的除錯守則。

## 2. 使用者看得到什麼

擺完源與加工機、連完管線、設好源素材後，右側出現一張表：哪些材料每分鐘產出多少、消耗多少、淨值多少，含中間物；改動畫布數字會跟著變；空產線顯示空狀態而不是一堆零。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 引擎 | `src/composables/useFlowEngine.ts` | 完整（V9） |
| 結果 store | `src/store/flowStore.ts` | `itemSummary`、`edgeFlows`、`nodeEfficiencies`、`congestedEdges` 皆有 |
| 產耗表 | `src/components/StatsPanel/ItemSummaryTable.vue` | 已存在 |
| 面板容器 | `src/components/StatsPanel/Index.vue`、`src/editor/stats/ProductionStats.vue` | 已存在 |
| 觸發 | `watch([devices, connections], useDebounceFn(runFlowEngine, 150), { deep: true })` | 已掛 |
| 電力 | `totalPowerDemand`／`totalPowerSupply` | 已有（本項不當門檻） |

## 4. 技術決策

### 4.1 顯示欄位（凍結）

| 欄 | 來源 | 格式 |
|----|------|------|
| 材料名 | `ItemSummary.name` | 字串 |
| 產出 | `produced` | 個/分，一位小數 |
| 消耗 | `consumed` | 個/分，一位小數 |
| 淨值 | `net` | 個/分；正值綠、負值紅 |

`efficiency` 的顏色規則沿用既有 `efficiencyColor`（≥1.0 綠、≥0.5 黃、>0 橘、0 灰），不重新定義。**`loss` 不計入 summary**（V7 已定案）。

### 4.2 空狀態（明列為門檻的一部分）

| 情況 | 顯示 |
|------|------|
| 畫布無設備 | 「尚未擺放設備」 |
| 有設備但無源素材 | 「尚未設定產出素材」＋指向 [C5](./C5_source_primary_output.md) 的操作提示 |
| 有源但無連線 | 只列源產出，消耗為 0 |
| 全部就緒 | 完整表格 |

第二種情況特別重要：11 月最可能出現的演示事故就是「右側空白，不知道為什麼」。用明確文案取代空白，可以讓演示現場自己說明問題出在哪。

### 4.3 分層

| 層 | 做什麼 |
|----|--------|
| L1 | 引擎與 `flowStore`（已完成，不動） |
| L2 | `storeToRefs(flowStore)` → 映射成表格 plain props（照抄 [B4](./B4_selection_inspector.md) 的攤平契約） |
| L3 | `ItemSummaryTable.vue` 只吃 rows props，不 import store、**不在面板裡算流量** |

### 4.4 中間物的處理

主編步驟 7 明寫「含中間物」。`itemSummary` 本來就包含所有經過的品項，不需要額外處理；本項只要**不做過濾**即可。若表格過長，加一個「只顯示淨值非零」的切換，列為加分。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | `src/editor/stats/ProductionStats.vue` | L2：讀 `flowStore`，攤平成 rows |
| 修改 | `src/components/StatsPanel/ItemSummaryTable.vue` | L3：只吃 rows，補空狀態 |
| 修改 | `src/components/StatsPanel/Index.vue` | 區塊排版；空狀態文案 |
| 唯讀 | `src/store/flowStore.ts`、`src/composables/useFlowEngine.ts` | **不重寫引擎** |
| **不碰** | 調度券總效率、倉庫預估、電力當門檻 | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 11/01 | 產耗表接 `itemSummary`；空產線顯示空狀態；有連線會變 |
| 11/08 | 空狀態四種情況齊備（見 §4.2） |
| 11/15 | `congestedEdges` 接到 [C3](./C3_pipeline_polyline_render.md) 的 `congested` 視覺（加分） |
| 11/29 | **門檻：** 一條產線的產耗含中間物，數字會隨畫布變動 |

## 7. 不做

- 不重寫 FlowEngine 或 store 骨架
- 不做調度券總效率當主演示（主編藍圈）
- 不做倉庫填滿預估
- 不把電力盈缺當門檻（欄位可顯示，不驗收）
- 不在 L3 做任何計算

## 8. 依賴與封鎖

| 依賴 | 為什麼 |
|------|--------|
| [B2](./B2_placement_chain.md) | 節點要帶正確 `machineType` |
| [C1](./C1_port_hit_and_draft.md)／[C2](./C2_add_connection_contract.md) | 邊要帶 handle，否則引擎建圖時對不上埠 |
| [C5](./C5_source_primary_output.md) | 沒有源素材則所有數字為零 |

**這三項任一未完成，本項都無法演示。** 這是全案依賴最深的一項，因此排在 11/1 第一週，留三週緩衝。

## 9. DoD

- [ ] 空畫布顯示「尚未擺放設備」，不是空白也不是一堆零
- [ ] 一條「源 → 加工」產線的產耗表出現正確數字（與 `/dev/flow-engine` 對同一組資料的結果一致）
- [ ] 表格含中間物
- [ ] 改動畫布（加設備／改連線／改源素材）後數字在 150ms 內更新
- [ ] `ItemSummaryTable.vue` 不 import 任何 store（code review 確認）
- [ ] 面板內無任何流量計算
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 右側空白時誤判為引擎壞掉並開始重寫 | §1 除錯守則：先查 `machineType`／handle／`primaryOutput`；`/dev/flow-engine` 對同一組資料可證明引擎正常 |
| 上游三項延誤導致本項無法驗證 | 用 `/dev` preset 的資料先驗證 L2／L3 接線，主畫布資料到位後再對 |
| 表格過長難讀 | 加「只顯示淨值非零」切換，列加分 |

**未交頂替：** 無。這是 11/29 門檻的核心，也是 [D5](./D5_acceptance_rehearsal.md) 驗收劇本第 4 步。

## 11. 開發日誌

### 2026-08-22
- 建檔。本項技術新增極少，主要工作被定義為「除錯上游資料」與「補空狀態」，避免屆時把時間花在重寫引擎
