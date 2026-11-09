# 調度券兌換效率分析

日期：2026-11-06。基準分支：`dev/toby`；分析基準提交：`89ef7e8`。

本功能已依使用者「每個步驟驗證後執行下一步」的指示完成四個步驟。正式程式與接線測試已更新，Story 測試維持原檔；各步驟證據見索引與分步文件。依使用者最新指示提交至 dev/toby 並推送 origin/dev/toby；實際提交與推送結果以 Git 紀錄為準。

初版已提交為 `88cfd89`。其後使用者確認加入「武陵調度券」「谷地調度券」，自由畫布依實際採用單價來源分開顯示；此券種擴充已實作並驗證，本次依使用者指示另行提交並與初版一併推送。

價格基準更新：使用者已將谷地「鋼製零件」price 改為 3，並將武陵 price=25 的品項名稱更正為「低容量武陵電池」。以目前 `src/data/plans.ts` 為準，兩種低容量電池不可視為同一品項。原始 `docs/aaaaa/data/plans.json` 尚未同步，重新生成資料前應先處理來源落差，避免覆蓋使用者修正。

## 1. 已確認規則

| 項目 | 使用者確認結果 |
| --- | --- |
| 價格來源 | 自動使用 `src/data/plans.ts` 的 `product_values[].price` |
| 價格單位 | `price` 視為券／個 |
| 產量來源 | 使用 `sinkDeliveries` 實際交付量，單位個／分 |
| 公式 | 調度券／小時 = Σ（實際交付量／分鐘 × 單價／個 × 60） |
| 武陵地區 | 使用武陵計畫價格 |
| 四號谷地 | 使用四號谷地計畫價格 |
| 自由畫布 | 每個品項先查武陵價格，沒有才查四號谷地；仍須計價 |
| 無資料 | 無設備、無交付量或沒有對應價格時，貢獻為 0；總覽顯示 `0 /hr` |
| 券種 | 武陵價格對應武陵調度券，谷地價格對應谷地調度券；自由畫布分別加總、分列顯示 |

自由畫布的優先規則是逐品項查價，與先前選過哪個基地無關。選定武陵或四號谷地時使用該基地價格，跨基地回退僅適用自由畫布。

## 2. 資料來源與初版分析時現況

下表路徑皆相對專案根目錄。

| 用途 | 檔案與欄位 | 現況 |
| --- | --- | --- |
| 基地選項 | `src/components/BaseRegionSelector/Index.vue` | 武陵地區 `wuling`、四號谷地 `valley4`、自由畫布 `null` |
| 基地狀態 | `src/store/canvasStore.ts`：`baseRegion` | 預設為 `null`；切換不進 history |
| 頂部事件 | `src/editor/navbar/Navbar.vue`：`handleBaseRegionChange` | 呼叫 `canvasStore.setBaseRegion` |
| 正式價格 | `src/data/plans.ts`：`product_values` | 計畫名稱為「武陵」與「四號谷地」 |
| 價格原始資料 | `docs/aaaaa/data/plans.json` | 由 `docs/aaaaa/scripts/generate-src-data.mjs` 產生正式資料；本次不需改價格資料 |
| 價格型別 | `src/types/plan.ts`：`ProductValue.price` | 既有註解含「券／個或內部評估值」，本功能依使用者確認採券／個 |
| 交付量計算 | `src/composables/useFlowEngine.ts`：`runFlowEngine` | 合計合法 sink 的正值 `inputRates`，寫入 `sinkDeliveries` |
| 交付量狀態 | `src/store/flowStore.ts`：`sinkDeliveries` | `Map<itemId, 個／分>`，可直接作為換算輸入 |
| 既有券數 | `src/store/flowStore.ts`：`ticketRates`、`ticketOutput`、`ticketTotal` | 手動設定兌換率，以正淨產量乘兌換率；契約與本次需求不同 |
| 正式總覽容器 | `src/editor/stats/ProductionStats.vue` | 已傳 power、products、hasDevices，尚未傳 exchangeRate |
| 展示組合 | `src/app/StatsPanel/Index.vue` | 已將 exchangeRate prop 傳給 ResultPanel |
| 數字顯示 | `src/app/StatsPanel/ResultPanel.vue` | 無 prop 顯示 `-`；超過 999999 顯示 `999,999+` |

初版資料流如下；券種擴充後的分類來源見第 7 節：

```text
canvasStore.baseRegion + plans.product_values
                    ↓ 選取品項價格（L1）
flowStore.sinkDeliveries → 每項交付量 × 價格 × 60 → 加總（L1）
                    ↓
ProductionStats.vue → exchangeRate prop（L2）
                    ↓
StatsPanel / ResultPanel → 調度券兌換效率（L3）
```

`editorStore.currentPlan` 目前預設武陵，與頂部基地選擇沒有同步。本功能必須跟隨 `baseRegion`，不能只使用 currentPlan 推定價格。

## 3. 問題與建議方案

1. 總覽沒有 exchangeRate 接線，即使既有 store 有券數結果也不會顯示。
2. 舊計算使用正淨產量；本次使用實際交付量，不能只補 prop 即視為完成。
3. 舊兌換率已定義為「每 1 個／分對應多少券／小時」，計畫單價則依本次確認為券／個；應明確區分，避免少乘或重複乘 60。
4. 依執行方案在 flowStore 內建立獨立的 deliveryTicketPrices、deliveryTicketOutput、deliveryTicketTotal，供正式總覽使用；券種擴充以 deliveryTicketRates 提供分類結果。舊 Inspector 的 ticketRates、ticketOutput、ticketTotal 保留既有契約，相關既有測試通過。
5. 基地與價格選取、換算都屬 L1；L2 僅映射資料，L3 僅處理展示。無需因價格切換而重跑整個 FlowEngine。

## 4. 範圍

初版修改 `src/store/flowStore.ts`、`src/editor/stats/ProductionStats.vue` 與既有 `docs/toby/test/layoutFlowWiring.test.ts`，並更新 `src/types/plan.ts` 的價格單位註解。初版依 master 排版。後續依使用者確認加入券種分列，調整 `src/app/StatsPanel/ResultPanel.vue` 的券種列、`Index.vue` 的 props 傳遞、`types.ts` 的 props 型別及 `src/types/flow.ts` 的券種契約；其餘排版與既有數字格式沿用。

沿用既有引擎交付量，不重寫配方或流量。設備額定耗電與供電、畫布放置、折線、旋轉、基地尺寸與倉庫預估維持原範圍。Delete 依先前決定僅記錄；不在此次修正。不主動提交、push 或建立 PR。

依使用者最新指示，本功能新增或調整的測試程式僅放在 `docs/toby/test/layoutFlowWiring.test.ts`。不新增測試檔、不修改 `src/__tests__/` 或 Story 測試；畫面呈現另以正式頁面及既有 Story 手動檢查。

## 5. 驗收基準

| 案例 | 預期 |
| --- | --- |
| 低容量武陵電池交付 2 個／分，武陵 price=25 | 3000 券／小時 |
| 同一交付量切換四號谷地 | 無此品項價格，0 券／小時 |
| 同一交付量切換自由畫布 | 使用武陵價格，3000 券／小時 |
| 低容量谷地電池交付 2 個／分，四號谷地 price=16 | 1920 券／小時 |
| 同一谷地電池交付量，武陵／自由畫布 | 武陵為 0；自由畫布回退谷地為 1920 券／小時 |
| 自由畫布交付紫晶質瓶 2 個／分 | 武陵無此價格，使用谷地 price=2，240 券／小時 |
| 同時交付低容量武陵電池與紫晶質瓶，各 2 個／分，自由畫布 | 武陵調度券 3000、谷地調度券 240／小時；既有總額 API 為 3240 |
| 鋼製零件交付 2 個／分，谷地 price=3 | 360 券／小時 |
| 只有 itemSummary 正淨產量，sinkDeliveries 為空 | 0 券／小時 |
| 有交付量，但該基地無價格 | 該品項不增加券數 |
| 沒設備、沒交付量、斷線後引擎結果已更新或清空 | 0 /hr |
| 同一品項送入多個合法 sink | 使用引擎已彙總的交付量，換算一次 |
| 基地往返切換 | 沒有上一基地價格殘留 |

單元測試可注入明確交付量以隔離換算規則；正式接線驗收須使用真實配方與設備，不以注入結果替代完整引擎驗證。

## 6. 最終實作與限制

- 使用獨立自動衍生結果；券種擴充後正式總覽映射 deliveryTicketRates。無設備時容器立即將各券種映射為 0，避免等待引擎更新期間顯示舊券數。
- ResultPanel 沿用既有數字格式、精度與 `999,999+` 上限。券種擴充使用 exchangeRates 分列名稱與數字；未提供時沿用原 exchangeRate 展示。完整數值仍保存在 store，未新增 title。
- 價格表以品項是否存在決定優先順序；計算時排除非正值與非有限價格／交付量。異常價格不額外推定另一基地價格；正式正值價格案例均通過驗收。
- 每項乘積非有限時略過，總額累加限制於 Number.MAX_VALUE，避免 NaN／Infinity 傳入展示。
- 正式資料流使用既有 runFlowEngine 的交付量，未改引擎與基地切換 action。測試確認基地切換不額外呼叫 applyResult。
- 正式資料原始 JSON 尚未同步使用者價格修正；本輪未執行重新生成，也未覆蓋使用者的 plans.ts 變更。
- 全套 59 檔／1051 案、接線 19 案、型別、Lint、格式、docs 測試格式與 Storybook 建置通過。13 個既有 Story 通過，無障礙既有問題見步驟 04。

執行順序與狀態見 [步驟索引](./W1106_ticket_steps.md)。

## 7. 券種擴充的來源與驗證

- 券種名稱由使用者確認，未宣稱來自價格 JSON 的既有欄位。
- flowStore 的 deliveryTicketQuotes 在選價時保留 currency；自由畫布武陵同名覆蓋同時決定券種。deliveryTicketRates 使用既有每項換算結果，按 currency 分別累計，單一基地只提供一種券，自由畫布依序提供武陵與谷地，無交付仍保留零值。
- 券種及來源型別定義於 `src/types/flow.ts`。價格仍來自 plans.ts，交付量仍來自 sinkDeliveries；未修改 FlowEngine 或正式價格資料。
- ProductionStats 映射 exchangeRates，清空畫布時每種券立即為零；Index 傳 props，ResultPanel 僅顯示資料。正式頁面不再將混合券數顯示成單一總額，既有 deliveryTicketTotal API 保留。
- 自由畫布交付低容量武陵電池 2 個／分及紫晶質瓶 2 個／分，分別顯示武陵調度券 3000 /hr、谷地調度券 240 /hr。同名價格測試確認只歸入武陵，沒有重複計入谷地。
- 擴充既有接線測試的斷言，仍為 19 案；完整 59 檔 1051 案通過。型別、Lint、格式、docs 測試格式與 Storybook 建置通過，13 個既有 Story 通過；無障礙既有問題未變。
- 正式頁面驗證有價配方交付、基地切換、雙券種零值、小數、大值上限與不裁切。混合電池／瓶交付量以頁面內 store 注入驗證分類與顯示，未宣稱該注入案例是完整配方驗收。
