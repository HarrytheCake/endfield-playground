# W1102-T1 步驟 02：資料接線

狀態：完成（2026-11-05）。使用者已明確允許最小方案；完成資料接線與自動驗證，正式頁人工操作留在步驟 04。

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

## 實際修改與結果

| 檔案 | 實作結果 |
| --- | --- |
| `src/app/layouts/MainLayout.vue` | computed 使用 layoutStore.toSnapshot 與衍生 connections 呼叫 toTopology；驗證與引擎共用 getter；右欄掛 ProductionStats overview |
| `src/composables/useFlowEngine.ts` | runFlowEngine 可選擇明確拓撲；useFlowEngine 可選擇響應式 getter；無參數保留舊入口；150ms VueUse 計時器合併操作並隨 scope 釋放 |
| `src/composables/useValidation.ts` | 可選格子拓撲來源，不再誤除 gridSize；正式來源同步驗證，舊入口保留像素換算及原排程 |
| `src/editor/stats/ProductionStats.vue` | overview 模式讀 flowStore 映射 products 與 hasDevices；未傳 overview 時保留舊 Inspector 顯示；不增加引擎 watcher |
| `src/app/StatsPanel/types.ts` | 建立可選 hasDevices 契約；本步尚未在 ResultPanel 使用 |
| `docs/toby/test/layoutFlowWiring.test.ts` | 新增 8 案，透過真實 layoutStore、resolveConnections、validation 與引擎驗證完整資料接線；依使用者要求由 `src/__tests__/composables/` 搬至此處 |

沒有修改 store 公開簽名、toTopology、計算演算法、畫布、設備或左欄；沒有雙寫 editorStore。L3 仍只接 props。

### 自動驗收證據

- 初輪測試把既有純函式案例的手工連線當成真實幾何，因此未能解出連線；已修正測試快照以符合實際埠方位，未修改機器定義或引擎來迎合測試。
- 真實幾何：粉碎機 `(4,0)` 的輸入錨點 `(4,-1)`、輸出錨點 `(4,3)`；輸入口 `(10,0)` 的右側輸入錨點 `(11,1)`。測試由管線端點自動衍生 connections，不手工塞連線。
- 相關 5 檔 46 案通過；新增 8 案涵蓋 30/min 產耗與零淨值中間物、連線斷開、清空、快速變更取最後快照、同步驗證封鎖／恢復、舊入口相容、正式來源不監聽舊 editorStore、scope 停止取消排程。
- 型別檢查揭露 store 的深層唯讀管線不能只展開外層陣列；已沿用既有快照 API 解決，未使用型別斷言或改 adapter 契約。
- 最終 `pnpm type-check`、`pnpm lint-check`、`pnpm format-check` 均通過。
- 最終 `pnpm test`：59 個測試檔、1,040 案全部通過。
- 當前環境未提供 validate-changes skill，因此手動執行四項檢查。未修改 Story，本步未執行 Storybook 建置或瀏覽器人工驗收。

### 下一步條件

步驟 02 接線已完成。本步結束時空畫布尚未新增文案；後續步驟 03 已完成 hasDevices 傳遞、undefined／false 區分、空狀態、一位小數與 Story，詳見該步紀錄。正式頁操作驗收及 PR 仍未完成，不得宣告整張工單交付。

本輪變更尚未 commit、push 或建立 PR。
