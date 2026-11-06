# 調度券兌換效率與券種分類工作摘要

## 完成狀態

- 工作日期：2026-11-06，Asia/Taipei。
- 狀態：**調度券兌換效率與券種分類完成**，已推送至 `origin/dev/toby`。
- 功能提交：`88cfd89`「完成調度券兌換效率並補齊驗證紀錄」、`5a90274`「新增調度券種類並分別顯示兌換效率」。
- 相關文件：[分析](../dev/1106/W1106_ticket_analysis.md)、[步驟索引](../dev/1106/W1106_ticket_steps.md)、[正式總覽接線](../dev/1106/W1106_ticket_step_03_panel.md)、[驗證紀錄](../dev/1106/W1106_ticket_step_04_verification.md)。
- 前輪工作：[產能估算與正式配方](./2026-11-05_W1102-T1_stats-panel.md)、[耗電／供電統計](./2026-11-06_power-stats.md)。本摘要記錄其後的調度券功能。

## 最終行為

正式總覽使用合法 sink 實際收到的交付量，自動讀取基地計畫的品項單價，換算每小時可兌換的調度券。依使用者確認，單價視為券／個：

```text
每項調度券／小時 = 實際交付量（個／分）× 單價（券／個）× 60
每種券的兌換效率 = 採用該券種單價的各品項券數加總
```

| 基地選擇 | 價格與顯示規則 |
| --- | --- |
| 武陵地區 | 只使用武陵計畫價格，顯示武陵調度券 |
| 四號谷地 | 只使用四號谷地計畫價格，顯示谷地調度券 |
| 自由畫布 | 每個品項優先採武陵價格，沒有才採谷地；依採用來源分別顯示兩種券 |
| 沒設備、無交付量或無對應價格 | 對應券數為 0；保留可見券種名稱及 `0 /hr` |

自由畫布按品項查價，與之前選過的基地無關；同名品項只採武陵一次，不重複計入谷地。單一基地不跨基地補價。基地切換以 computed 更新價格與券數，無須額外執行 FlowEngine。

例如自由畫布每分鐘交付低容量武陵電池 2 個、紫晶質瓶 2 個，顯示「武陵調度券 ≈ 3,000 /hr」及「谷地調度券 ≈ 240 /hr」。正式面板分列顯示，不將兩種券當成同一種券；既有混合總額 API 保留相容性。

## 資料來源

下表列出執行時來源、原始資料與型別；列為來源不代表本輪修改該檔案。

| 資料 | 來源檔案 | 用途 |
| --- | --- | --- |
| 基地選項 | [BaseRegionSelector/Index.vue](../../../src/components/BaseRegionSelector/Index.vue) | 武陵地區、四號谷地、自由畫布；透過事件通知上層 |
| 選定基地 | [canvasStore.ts](../../../src/store/canvasStore.ts)、[Navbar.vue](../../../src/editor/navbar/Navbar.vue) | baseRegion 為 wuling、valley4 或 null；沿用既有選單與 action |
| 品項單價 | [plans.ts](../../../src/data/plans.ts) | 使用對應計畫的 product_values[].name／price，以品項名稱匹配交付量 |
| 價格原始資料與生成器 | [plans.json](../../aaaaa/data/plans.json)、[generate-src-data.mjs](../../aaaaa/scripts/generate-src-data.mjs) | 正式資料的生成來源；本輪未重新生成，與使用者更正的 plans.ts 尚有落差 |
| 單價單位 | [plan.ts](../../../src/types/plan.ts) | ProductValue.price 明確註記券／個，換算每小時須乘 60 |
| 正式畫布設備與管線 | [layoutStore.ts](../../../src/store/layoutStore.ts)、[toTopology.ts](../../../src/utils/layout/toTopology.ts) | 沿用既有正式拓撲與接線來源 |
| 實際交付量 | [useFlowEngine.ts](../../../src/composables/useFlowEngine.ts) | runFlowEngine 合計合法 sink 的正值 inputRates，寫入 sinkDeliveries；本輪未改引擎 |
| 交付量、查價與券數 | [flowStore.ts](../../../src/store/flowStore.ts) | 使用 sinkDeliveries 查價換算，按實際價格來源分別累計券種 |
| 券種型別 | [flow.ts](../../../src/types/flow.ts) | TicketCurrency、TicketUnitPrice、TicketCurrencyRate 定義券種、來源與每小時數值 |
| 券種名稱 | 使用者確認；對應邏輯在 [flowStore.ts](../../../src/store/flowStore.ts) | wuling 顯示武陵調度券，valley4 顯示谷地調度券；名稱不是價格 JSON 的既有欄位 |
| 正式總覽 props | [ProductionStats.vue](../../../src/editor/stats/ProductionStats.vue) | 映射結果與空畫布零值，不在容器重算價格或流量 |

正式資料流：基地選擇與計畫價格 → 保留品項單價及券種來源 → sinkDeliveries 逐項換算 → 各券種加總 → ProductionStats 傳入 exchangeRates → StatsPanel／ResultPanel 顯示。

## 修改檔案與結果

| 檔案 | 變更內容 |
| --- | --- |
| [flowStore.ts](../../../src/store/flowStore.ts) | 新增 deliveryTicketPrices、deliveryTicketOutput、deliveryTicketTotal；券種擴充以內部 deliveryTicketQuotes 保留單價來源，並提供 deliveryTicketRates 分類結果 |
| [plans.ts](../../../src/data/plans.ts) | 納入使用者修正：谷地鋼製零件 price 由 1 改為 3；武陵 price=25 的品項更正為低容量武陵電池 |
| [plan.ts](../../../src/types/plan.ts)、[flow.ts](../../../src/types/flow.ts) | 明確單價單位，新增券種、單價來源及分類效率型別 |
| [ProductionStats.vue](../../../src/editor/stats/ProductionStats.vue) | 將自動計算結果傳入 overview，空畫布立即將各券種數值映射為 0 |
| [StatsPanel/types.ts](../../../src/app/StatsPanel/types.ts)、[Index.vue](../../../src/app/StatsPanel/Index.vue) | 新增可選 exchangeRates props 並傳給 ResultPanel；保留舊 exchangeRate 契約 |
| [ResultPanel.vue](../../../src/app/StatsPanel/ResultPanel.vue) | 單基地顯示一種券，自由畫布分列兩種券；沿用既有字型、顏色、數字格式及 999,999+ 上限，僅擴充券種列所需空間 |
| [layoutFlowWiring.test.ts](../test/layoutFlowWiring.test.ts) | 在前輪 13 案上新增 6 案，最終 19 案；券種擴充補入分類、同名優先、基地切換與歸零斷言 |
| [AGENTS.md](../claude/AGENTS.md) | 統一測試程式只放指定接線檔，不新增其他測試檔、不修改共用測試或 Story 測試；更新 test-writer 說明 |
| [分析及執行文件](../dev/1106/W1106_ticket_steps.md) | 記錄四步執行、需求確認、來源、驗收及後續券種擴充 |

舊 Inspector 的 ticketRates、ticketOutput、ticketTotal 手動設定契約保留。自動計價使用實際交付量，與舊正淨產量計算分開。L3 元件維持 props-only，未匯入 Pinia store；未修改既有 Story 測試。

## 驗證結果

以下為功能及券種擴充完成時的實際驗證紀錄。本次僅新增摘要，未重跑程式測試。

| 項目 | 結果與範圍 |
| --- | --- |
| pnpm type-check／lint-check／format-check | 全部通過 |
| pnpm test | 59 個測試檔、1051 案通過 |
| 指定接線測試 | 1 檔 19 案通過，包含真實配方、換算、基地切換、歷史操作、錯誤排除及券種斷言 |
| pnpm exec prettier --check docs/toby/test/ | 通過，補足一般格式檢查未涵蓋的目錄 |
| pnpm build-storybook | 通過；既有重名元件、Browserslist、chunk 大小及 plugin timing 警告保留 |
| Storybook 瀏覽器檢查 | 13 個既有 Story 與既有 play、鍵盤操作通過，未新增 Story 測試 |
| 正式交付產線 | 源礦經正式精煉配方生成晶體外殼，交付 30 個／分，谷地調度券 1800／小時；供料降至 15 時為 900 |
| 正式多產線與倉庫 | 兩條源礦 → 精煉爐 → 倉庫存貨口交付 60 個／分，谷地券 3600；阻擋其中一條後交付 30、券數 1800，額定耗電仍為 10 kW |
| 基地切換與恢復 | DOM 操作基地選單可更新可見券種；斷線、history undo／redo 與清空可更新券數 |
| 混合券種展示 | 注入電池及瓶交付量後，武陵券 3000、谷地券 240；驗證分類與展示，不當作完整配方產線驗收 |
| 邊界展示 | 單券種、雙券種零值、小數 22.5、大值 999,999+ 與 DOM 不裁切檢查通過；無 runtime error |

未產生截圖或 JSON 報告。docs 測試被既有 ESLint ignore 略過，lint-check 通過不代表涵蓋該目錄；其型別、格式及測試執行均已驗證。

## 已知問題與範圍

- 原始 plans.json 尚未同步本次 plans.ts 的兩項價格資料修正。重新執行資料生成前需先同步，避免覆蓋已確認資料。
- 顯示超過 999999 時仍為 999,999+，完整值保存在 store；未新增完整數值 title。沒有有效價格、非正或非有限交付量不增加券數。
- 既有 Story 有產耗配色對比度問題，LongTextOverflow 另有捲動區焦點問題；詳見驗證文件，不宣稱全面無障礙通過。
- Delete 快捷鍵來源不一致的既有問題依使用者指示只記錄，不在本輪修正。history action 驗證通過不代表原生 Delete 通過。
- 本輪未改配方、流量、設備電力或倉庫計算，也未新增手動兌換設定或設定持久化。

## 提交與摘要狀態

功能提交 `88cfd89` 與 `5a90274` 已推送至 origin/dev/toby；新增本摘要前，工作樹乾淨且與遠端同步。本次依使用者指示將摘要提交至 dev/toby 並推送 origin/dev/toby，實際結果以 Git 紀錄為準；未建立 PR。
