# W1102-T1 步驟 03：面板與空狀態

狀態：完成（2026-11-05）。面板、格式、Story 與瀏覽器互動驗證完成；正式主畫面整條產線的操作驗收仍留在步驟 04。

## 目標與修改檔案

在現行右欄顯示實際產耗，並區分「沒有設備」與「有設備但無摘要」。

候選檔案為 `src/app/StatsPanel/Index.vue`、`ResultPanel.vue`、`types.ts`、必要的共置 Story，以及步驟 01 已確認的 L2 props 傳遞檔案。

## 執行順序

1. Index 將 products 與無設備狀態傳入 ResultPanel，全程只使用 props。
2. 無設備時在產能列表區顯示「尚未擺放設備」，不渲染一排零值品項。
3. 有設備但 summary 為空時，不錯誤宣稱無設備；其他空狀態的完整設計留待後續切片。
4. 保留現行展示外觀，將個/min 的生產、消耗與淨值呈現清楚；依 D1 核對一位小數與淨值正綠負紅。
5. 保留中間物，核對負淨值、長名稱、多筆資料及響應更新後的展開狀態。
6. Story 至少涵蓋無設備、一般產線與有設備但無摘要；不在 Storybook 註冊 Pinia。

## 限制與驗收

- 不重建 ItemSummaryTable，不改左欄、設備、折線、電力或調度券功能。
- 不用 products.length 判斷是否有設備。
- Index、ResultPanel 與子展示元件無 store import、無流量計算。
- Story 可獨立渲染；正式頁資料更新後顯示相同欄位與單位。
- 新增或修改程式依 AGENTS 補繁體中文 JSDoc。

下一步：空狀態與資料展示成立後執行步驟 04。

## 實際修改

| 檔案 | 結果 |
| --- | --- |
| `src/app/StatsPanel/Index.vue` | hasDevices 向 ResultPanel 傳遞；withDefaults 明確保留 undefined，未提供狀態不會被當成無設備 |
| `src/app/StatsPanel/ResultPanel.vue` | 明確 false 時顯示「尚未擺放設備」並隱藏尚未清除的舊摘要；生產、消耗、淨值固定一位小數，標題標示個/分；正綠負紅沿用既有配色 |
| 同上 | 本地明細改為逐筆副本，展開不回寫 props；刷新／排序依品項 id 保留展開狀態；名稱與箭頭共用原生按鈕，支援 Enter／Space 及 aria-expanded |
| `src/app/StatsPanel/Index.stories.ts` | title 對齊 `L3/StatsPanel/Index`；保留原 7 個 Story、新增 6 個 Story，並為 7 個 Story 加入 play 斷言 |

沒有新增流量計算、store import 或其他空狀態文案；未改電力／調度券業務邏輯、左欄、設備或畫布。極大產耗不再以 K／M 捨去精度，改保留完整一位小數及千分位；固定欄寬內裁切，以 title 提供完整數值與單位。

## 驗證結果

- `pnpm type-check`、`pnpm lint-check`、`pnpm format-check` 通過。
- `pnpm test`：59 個測試檔、1,040 案通過；Vitest 數量不包含 Story 的 play 斷言。
- `pnpm build-storybook` 通過。既有同名 Index 元件掃描衝突、Browserslist 資料陳舊及 chunk 體積警告仍存在，不是本步失敗。
- 本機無介面 Chromium 實際開啟全部 13 個 Story，驗證無 runtime error／play failure；沒有產生截圖或 JSON 報告。
- 正常產線保留兩個零淨值品項及四個 `30.0`；DecimalRates 驗證 `1,234.6`、`淨值+34.6`、`淨值-0.1` 及正負顏色。
- EmptyFactory、EmptyWithStaleProducts 顯示指定文案且沒有品項按鈕；MinimalProps、DevicesWithoutSummary 不誤顯示無設備。
- LiveUpdates 先展開源礦、再將產品排序反轉及更新為 15/min，源礦仍展開、源石粉末仍收合；傳入 args 的 isExpanded 保持 false。
- Chromium 原生 Enter／Space 驗證明細收合與展開。
- 實際開啟 Controls，切換 hasDevices true → false → true，預覽從兩筆品項切為文案再恢復兩筆品項。
- 實際開啟正常產線 Accessibility 分頁並等待掃描完成：Violations 0、Passes 11、Inconclusive 0。
- `.storybook/preview.ts` 未修改、未註冊 Pinia；展示元件仍可獨立掛載。

Storybook 開發伺服器曾對使用者目錄的全域設定／runtime registry 寫入產生沙箱警告，但預覽、Controls 與 Accessibility 均可正常使用；未因此修改使用者全域設定或專案依賴。

## axe 已知限制

以下針對各 Story 的實際元件根節點執行 axe-core 4.13.0，數量為違規節點數；不代表整個應用程式的無障礙結果。

| Story | color-contrast | 其他 |
| --- | --- | --- |
| Default | 3 | 無 |
| MinimalProps | 0 | 無 |
| EmptyFactory | 0 | 無 |
| DevicesWithoutSummary | 0 | 無 |
| ConnectedProduction | 0 | 無 |
| EmptyWithStaleProducts | 0 | 無 |
| DecimalRates | 1 | 無 |
| LiveUpdates | 0 | 無 |
| OverloadPower | 3 | 無 |
| ZeroSupplyPower | 1 | 無 |
| ManyProductionsOverflow | 4 | 無 |
| ManyTipsOverflow | 6 | 無 |
| LongTextOverflow | 2 | scrollable-region-focusable：Tips 捲動區 1 個 |

逐項核對來源：灰色電力數字、紅色負淨值及紅色 Tips 的現行配色對比不足；長 Tips 捲動區缺少可聚焦入口。本步沒有變更這些既有顏色或重做 Tips。負淨值沿用既有紅色，因此 DecimalRates 也會重現同一對比問題，不能宣稱所有 Story 零違規。完整焦點順序、螢幕閱讀器及正式頁仍待後續驗收。

## 交付狀態與下一步

本步產品變更已完成，與步驟 02 變更一併保留於工作樹；尚未 commit、push 或建立 PR。下一步為步驟 04 的正式頁產線、連線變更、清空與面板開合操作驗收。

## 正式頁補查：產耗數字未直接顯示

使用者回報「為何沒顯示數字」後，在獨立 Chromium 正式 `/` 頁載入同一組真實幾何產線，確認 flowStore 已有源礦與源石粉末各 30/min，但 L2 映射沒有提供 isExpanded，ResultPanel 因此預設收合，只露出兩筆 `淨值+0.0`。先前 ConnectedProduction Story 明確傳入 isExpanded=true，沒有揭露正式 L2 的預設值落差。

修正 `ProductionStats.vue` 的 products 映射，提供 `isExpanded: true`，讓正式右欄初次出現品項時直接顯示生產／消耗。仍由展示層按 id 保存使用者後續的手動收合狀態，不在每次引擎刷新時強制展開。

正式頁補驗證：

- 空 layout 顯示「尚未擺放設備」，無執行期錯誤。
- 透過現有 loadSnapshot action 在獨立測試頁載入產線；兩品項直接顯示四個 `30.0`，無需先點擊展開。
- 點擊源礦明細收合後，使用現有 setDevicePrimaryOutput 將供給改為 15/min；源石粉末顯示生產／消耗各 `15.0`，源礦仍維持手動收合。
- 再次執行四項品質檢查與 59 檔、1,040 案測試，全部通過。此次未改展示元件或 Story，未重跑 Storybook 建置。

本次僅補上正式頁的快照載入及點擊／源速率變更驗證，不代表步驟 04 的畫布原生拉線、清空、開合、全部邊界與完整無障礙驗收已完成。

另外，正式 overview 目前只傳 products 與 hasDevices，power／exchangeRate 尚未接線，因此電力與調度券區域仍顯示 `-`；這與產耗明細收合是不同原因。本次沒有擴充這兩個非產耗區塊。

## 使用者追加：接入正式設備配方

依使用者「改接入正式配方」指示，擴充 MainLayout 的設備資訊資料映射：由 `src/data/products.ts` 的 `getRecipesForMachine()` 按設備中文名稱與有效模式讀取正式配方，再將加工秒數、投入／產出名稱及單次數量傳入 MachineCard。展示元件維持 props 驅動，不讀取 store。

「目前配方」使用 flowStore 的實際正流量入料，重用引擎既有 `matchRecipeByInputs()` 規則；無匹配或非法鏈路顯示佔位符號。未將全部可用配方誤設為正在執行，也未改寫設備的 recipeIndex 或引擎演算法。

獨立 Chromium 正式頁驗證結果：

- 粉碎機顯示 12 筆正式配方，源礦供料時目前配方為「源石粉末（2秒）」。
- 將來源改為砂葉後，目前配方更新為「砂葉粉末（2秒）」；清除供料後恢復佔位符號。
- 精煉爐 base_mode 顯示 11 筆，liquid_mode 顯示 2 筆，均與正式查詢結果一致；未供料時不顯示目前配方。
- 取消設備選取後資訊卡收起，無瀏覽器執行期錯誤。
- `pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test` 全部通過（59 檔、1,040 案）。

本次未調整 L3 元件與 Story，未重跑 Storybook。變更保留於工作樹，尚未提交。

## 使用者追加：空白產能清單提示

依使用者「空白時顯示 尚未擺放設備」指示，覆蓋前述僅 hasDevices=false 顯示文案的規則。ResultPanel 改為 `visibleProducts.length === 0` 時顯示「尚未擺放設備」，涵蓋未傳入產品、有設備但無摘要與無設備三種情況；hasDevices=false 仍立即隱藏上一輪品項。

同步更新 MinimalProps 與 DevicesWithoutSummary 的 Story 斷言。四項品質檢查、59 檔／1,040 案測試及 Storybook 建置全部通過。

已在 Chromium 驗證全部 13 個 Story 與互動斷言；空清單均顯示指定文案。空白相關 Story 的 axe 檢查無違規，其餘既有配色對比與 Tips 捲動區限制同前述紀錄。
