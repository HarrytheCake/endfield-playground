# W1102-T1 步驟 01：範圍與介面

狀態：完成（2026-11-05）。使用者已明確允許依最小方案接線，包含 MainLayout、useFlowEngine 與驗證入口；步驟 02 已完成實作及驗證。

## 目標與檔案

以唯讀檢查確認實際掛載點、既有轉換器及可用引擎入口。此步僅更新本組分析文件，不修改產品程式。

閱讀 MainLayout、LayoutView、ProductionStats、app/StatsPanel 全組、layoutStore、flowStore、useFlowEngine、toTopology 與直接相關測試。

## 執行順序

1. 重新確認分支、HEAD、工作樹及遠端基準；開始實作應從最新 origin/master 建立符合 README 的工作分支，保留既有變更。
2. 核對最新週派工與工單，確認 MainLayout 凍結與引擎唯讀限制是否已有調整。
3. 列出具體最小方案：L2 容器如何掛到正式右欄、layout 資料由哪個既有入口送進引擎、誰負責必要的上游補接。
4. 若現有 API 不支援正式資料來源，記錄所需上游介面與 owner；不得先複製計算管線或同步寫入 editorStore。
5. 定稿現行面板的 products 映射、無設備 flag／文案 prop，以及 ResultPanel／types 的必要變更範圍。
6. 記錄需要解除限制的確切檔案與原因，再取得相應範圍確認；已在對話明確授權的範圍不重複詢問。

## 限制與驗收

- 不把 StatsPanel 改成直接讀 store 的 L3 元件，不重建已移除的舊版表格。
- 不順便搬整個目錄、重寫舊 Inspector 或修改供水行為。
- 驗收產物必須包含確定的修改檔案、props 契約、單一引擎觸發責任與上游分工。
- 目前已確認缺口；尚不能將「完整接線可在原工單檔案內完成」標為通過。

下一步：已依使用者授權執行步驟 02，結果見資料接線文件。

## 本次執行結果

- `git fetch origin` 成功，最新 `origin/master` 仍為 `3b368b1796ebaac59356de2ea095664a9e337a8c`。
- 目前 `dev/toby` 的 HEAD 為 `aad10bc`，只比 master 多本組七份文件；產品程式與 master 一致。不需為了範圍核對切換分支。
- 開始執行時工作樹乾淨。先前觀察到的 CLAUDE.md 刪除已不在工作樹，本次未還原或處理該檔案。
- 正式右欄仍是 MainLayout → app/StatsPanel，無 props；舊 ProductionStats 仍未掛載。
- runFlowEngine 沒有參數，只能讀 editorStore；useFlowEngine 也只監聽 editorStore 與 alerts。
- useValidation 同樣讀 editorStore，並將像素除以 gridSize 轉成格子。toTopology 的座標已是格子，不能直接套用該換算。
- 正式入口目前未註冊 detector；仍需對齊驗證資料來源，不能讓未來 detector 讀到舊 mock 拓撲。

## 具體最小方案（已獲使用者確認）

| 檔案 | 預計修改 | 原因與限制 |
| --- | --- | --- |
| `src/app/layouts/MainLayout.vue` | 建立 layoutStore → toTopology 的 computed；同一拓撲依序交給 validation、FlowEngine；右欄改掛 L2 統計容器 | 此檔被週派工凍結，需要明確確認；僅改資料接線與掛載，不動布局與樣式 |
| `src/composables/useFlowEngine.ts` | 既有 runFlowEngine 接受可選拓撲；useFlowEngine 接受可選響應式拓撲來源，無參數維持舊 editorStore 行為 | 此檔被列唯讀，需要明確確認；不改演算法，不複製結果組裝，不改 flowStore 簽名 |
| `src/composables/useValidation.ts` | 接受與引擎一致的可選格子拓撲來源；舊 editorStore 路徑保留像素換算 | 對齊正式來源與座標，保持驗證先於計算；不改 ValidationContext 簽名 |
| `src/editor/stats/ProductionStats.vue` | 作為正式右欄 L2 容器，讀 itemSummary、映射 products 與無設備 flag，交給現行 StatsPanel | 屬工單指定容器；舊完整面板未掛主路徑，實作時確認舊 Inspector 相容處置，不順便改 Inspector |
| `src/app/StatsPanel/types.ts`、`Index.vue`、`ResultPanel.vue` | 加入可選 `hasDevices?: boolean`，Index 向下傳遞；ResultPanel 顯示無設備文案並呈現一位小數 | 沿用現有 DTO 與外觀，L3 不讀 store；未傳 flag 的既有 Story 不推定為無設備 |
| 共置 Story、直接相關測試 | 覆蓋空設備／空摘要／一般產線；驗證正式來源、清空、debounce 與舊入口相容 | 不產生截圖或 JSON 報告 |

正式計算只有 MainLayout 現有的那一組 watcher，不在 ProductionStats 或 StatsPanel 再啟動引擎。不雙寫 editorStore；dev 頁面的無參數 runFlowEngine 與 useValidation 保持原行為。

### props 與生命週期契約

- L2 `products`：itemSummary 全量逐筆映射，不 filter 淨值為零的中間物。
- L2 `hasDevices`：來源是 layoutStore.devices.length > 0，獨立於 products 是否為空。
- L3 `hasDevices === false` 才顯示「尚未擺放設備」；true 且 products 空時不顯示該文案。其他空狀態本次不擴充。
- products 的 id、name、produce、consume、profit 沿用現行契約；展開狀態屬 L3 本地 UI，不回寫 props。
- MainLayout 內先同步驗證，再由單一 150ms debounce 計算；元件卸載後取消待執行計算，避免舊頁面覆寫 flowStore。
- power、exchangeRate、tips 不新增業務計算；本次只驗收產耗。

### 範圍確認依據

週派工 §2.2 明列 MainLayout 凍結、flowStore／useFlowEngine 唯讀；AGENTS A.11 要求「若修正必須觸及禁止檔案，保留證據並停止，不以旁路修改掩蓋根因」。因此本步完成可審查方案與基準驗證後，需確認上述有限度接線修改，才可執行步驟 02。

使用者後續明確回覆：「允許依最小方案接線，繼續步驟 02」。本單已取得所列範圍授權，不需重複確認；不表示已授權其他凍結區或 push／PR。

步驟 02 最終實作採 `layoutStore.toSnapshot()` 取得可供 adapter 使用的快照，避免把深層唯讀 waypoints 強制轉型。ProductionStats 增加 `overview?: boolean` 切換：正式頁傳 true 掛現行展示面板，舊 Inspector 省略時維持原畫面。不改 store 或 toTopology 簽名。面板的 `hasDevices?: boolean` 型別已建立，向 ResultPanel 傳遞及空狀態文案留在步驟 03。

### 基準測試結果

執行 `pnpm exec vitest run src/__tests__/flowEngine.topology.layout.test.ts src/__tests__/utils/layout/toTopology.test.ts`：2 個測試檔、6 案全部通過（Vitest 4.1.6）。僅證明既有轉換與引擎純函式案例正常，尚未驗證正式頁、watcher、元件或新 props。
