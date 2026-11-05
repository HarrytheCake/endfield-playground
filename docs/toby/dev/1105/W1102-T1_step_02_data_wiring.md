# W1102-T1 步驟 02：資料接線

狀態：未執行。前置：步驟 01 已定稿允許檔案與引擎整合入口。

## 目標與修改檔案

讓正式 layout 的設備、管線及衍生連線進入既有引擎，並由 L2 將 flowStore.itemSummary 映射為現行 products props。

候選為 `src/editor/stats/ProductionStats.vue` 的 L2 容器與步驟 01 核准的掛載／整合檔案；實際清單必須先記入步驟 01。`toTopology.ts`、store、引擎原則上唯讀，必要補接由確認後的上游範圍處理。

## 執行順序

1. 沿用 toTopology，核對 machineType、machineMode、primaryOutput、sourceRatePerMin、handle 與媒質保留。
2. 透過已確認的正式入口使用既有引擎，不雙寫 editorStore，不另複製計算流程。
3. 確認只有一處負責正式計算排程；validation 先於計算，避免重複 watcher 或互相覆寫 flowStore。
4. 使用 storeToRefs 與 computed 保留響應性，逐欄映射 itemId/name/produced/consumed/net 為 id/name/produce/consume/profit。
5. 由 layoutStore 的設備數提供無設備狀態；保留中間物、零淨值與負淨值。
6. 補與實際整合風險相關的測試，優先驗證正式來源變更會更新 flowStore，及清空後沒有殘留舊結果。

## 限制與驗收

- L2 不計算流量；L3 不知道 store。
- 不改 store 公開簽名，不重寫引擎，不用未合入的 cake 分支當底。
- 使用同一組源 → 粉碎機 → 輸入口資料，與既有 topology 測試預期比對。
- 變更正式 layout 資料可驅動最新 summary；純函式測試通過不能替代此條件。
- 若入口仍不可用，記錄為上游缺口，不以 mock 數據宣告完成。

下一步：正式來源與 L2 props 均可驗證後執行步驟 03。
