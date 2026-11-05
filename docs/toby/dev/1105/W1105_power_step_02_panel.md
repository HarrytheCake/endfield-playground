# 電力統計步驟 02：右欄接線與呈現

狀態：唯讀接線完成；2026-11-06 使用者澄清「需要是總耗電量/供電量」，正式右欄保留耗電／供電標題與數字，不提供手動供電輸入。最新要求供電依資料計算，缺資料顯示 0，已取代先前無限供電預設，無比例條或不足提示。以下供電輸入相關內容為歷史，現行驗證見步驟 04 最後一節。

## 目標與修改範圍

由 `src/editor/stats/ProductionStats.vue` 把 flowStore 的 demand/supply 映射成 `PowerData.used/total`，傳給 overview 的 StatsPanel。`src/app/StatsPanel/Index.vue` 已有 power 傳遞，先核對再決定是否需修改。

必要呈現變更限於 `src/app/StatsPanel/ResultPanel.vue`，案例放在同目錄 `Index.stories.ts`。L3 保持 props-only；不讀 store、不重算設備耗電。

## 執行順序

1. 以 computed 映射響應式電力 refs，傳入既有 power prop，不依 products 是否有資料決定電力區顯示。
2. 有值時顯示帶 kW 單位的耗電／供電；空畫布可呈現 0 kW，不干擾產能區既有「尚未擺放設備」。
3. 釐清零供電狀態：0／0 不除以零；正耗電／0 供電不能只顯示空進度條。供電未實作期間用明確文案說明尚未完成，避免把占位 0 當正式結論。
4. 有正式供電資料後，過載數字保留實際值、條寬限制 0–100%，提供可讀的不足狀態。負載比例為呈現運算，可留在 L3。
5. 補「有耗電且零供電」案例，保留既有無 props、0／0、正常負載、過載案例；檢查 Controls 與 Accessibility，逐項記錄既有及新增問題。

## 驗收條件

- overview 顯示 flowStore 的實際值，設備改變後隨既有排程更新；沒有合法產能摘要時仍顯示耗電。
- 未傳 power 的獨立元件預覽保留合理空值，正式接線可呈現 0，兩者不混為一談。
- 數字、單位與狀態可讀；不溢位、不出現 Infinity／NaN。
- 產能列展開／收合及淨值資料維持前輪行為。
- 未完成供電規則時，只標註耗電與接線完成，不把供電標為完成。

下一步為確認正式供電規則；若仍缺資料，保留本步驗證結果，先完成可獨立執行的品質檢查。

## 實際變更

| 檔案 | 結果 |
| --- | --- |
| `src/editor/stats/ProductionStats.vue` | 將 flowStore 的 totalPowerDemand／totalPowerSupply 映射為 PowerData，傳入 overview；明確設定 supplyPending，未在容器加總設備 |
| `src/app/StatsPanel/types.ts` | PowerData 增加可選 supplyPending，省略時沿用既有已知供電語義；不改 store 契約 |
| `src/app/StatsPanel/ResultPanel.vue` | 正式頁顯示「15 kW / 待確認」與「供電規則尚未完成」，不把占位 0 顯示為已確認供電；未知供電不推定比例或短缺。已知供電不足時顯示「電力不足」，零供電且有需求時滿格，過載條寬仍限制 100%。狀態文字使用 role=status，增加高度避免壓住產能標題，電力數字改白字以改善對比 |
| `src/app/StatsPanel/Index.stories.ts` | 增加 PendingSupplyPower、DemandWithoutSupply 兩個 Story 與 play 驗證，涵蓋待確認文案、避免誤判不足、已知零供電及滿格 |

`Index.vue` 既有 power 傳遞可直接使用，無需修改。耗電數值仍由 `src/data/machines.ts` 的額定 power 經引擎加總寫入 flowStore；原始數據來源為 `docs/aaaaa/data/machines.json`，本步未改設備資料或引擎。L3 只讀 props，負載比例與文案為呈現運算。

## 驗證證據

- `pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test` 通過；全套 59 檔／1,044 案。
- `pnpm build-storybook` 通過；既有 Index 自動註冊重名、Browserslist 舊資料、chunk 大小與 plugin timing 警告仍存在。
- 本機無頭 Chromium 實際開啟 15 個 Story，9 個 play 均完成，無執行錯誤。未傳 power、0／0、正常負載、過載、供電待確認、有需求且零供電均可正常渲染；新兩個 Story 及 0／0 的 axe 結果為零違規。
- 首輪零供電 Story 使用 toHaveStyle 比對 100%，瀏覽器回報換算後的 281px 而失敗；已改為檢查 inline style.width。瀏覽器工具同步補上 console.error 偵測，重跑全部 15 個 Story 通過，並重跑該 Story 檔的格式、lint、type-check 與 Storybook 建置通過。
- 原有 Story 的 axe 限制仍在：Default／Overload 各 2 個 color-contrast 節點、Decimal 1 個、ManyProductions 3 個、ManyTips 5 個、LongText 1 個對比節點及 1 個 Tips scrollable-region-focusable；均為原有產耗／Tips 區。其餘 Story 零違規，不宣稱全介面無障礙完成。
- Storybook manager 實際操作 Controls 的 hasDevices true → false → true，正確切換空狀態與產能列；開啟 Accessibility 分頁，ConnectedProduction 顯示 0 violations／11 passes。
- 正式 `/` 頁透過真實 layoutStore 快照依序載入空畫布、未連線粉碎機、粉碎機＋塑型機、單台粉碎機、空畫布，右欄與 flowStore 均依序為 0 → 5 → 15 → 5 → 0 kW，始終顯示供電待確認且未誤標缺電。
- 原有連線產線仍呈現 30/min；改為 15/min 後更新且保留手動收合。正式配方卡及機器模式檢查亦通過，無瀏覽器執行錯誤。
- 上述正式頁為快照注入驗證，不能替代步驟 04 的原生放置／刪除與 undo/redo 驗收。瀏覽器測試起初以 includes 比對 5，誤匹配到 15；已修正為電力欄位完全相等後全案通過，產品程式無需因此修改。

受限環境首次瀏覽器 CDP 連線逾時，經工具核准後以同一本機測試工具重跑成功；未變更全域設定。Storybook 啟動時全域 settings／registry 寫入權限警告未阻止本機服務。當前環境沒有 validate-changes skill，採手動品質檢查。未產生截圖或 JSON 報告，未提交或 push。

下一步：步驟 03 仍待正式供電數據及運轉條件；本步僅完成耗電右欄接線與電力狀態呈現，不宣告實際供電已完成。
