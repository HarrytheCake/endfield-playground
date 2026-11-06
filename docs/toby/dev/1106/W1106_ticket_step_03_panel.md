# 步驟 03：正式總覽接線

日期：2026-11-06。狀態：完成，正式頁面驗證通過後已執行步驟 04。前置：[步驟 02](./W1106_ticket_step_02_calculation.md) 完成。

## 目標與來源

正式右欄「調度券兌換效率」顯示 L1 自動計價結果；來源為 flowStore 的實際交付量換算總額。

## 預計修改

- `src/editor/stats/ProductionStats.vue`：讀取結果並傳入 exchangeRate。
- `src/app/StatsPanel/ResultPanel.vue`：沿用 master 排版、樣式與數字格式，本功能不修改此檔。
- `docs/toby/test/layoutFlowWiring.test.ts`：本功能測試程式的唯一放置位置，擴充正式資料來源與更新行為驗證。

`src/app/StatsPanel/Index.vue` 與 `types.ts` 已有 exchangeRate 契約，先沿用；只有實際缺少必要契約時才調整。

## 執行順序

1. 由容器映射總額至 exchangeRate，不在 L2 或 L3 重算單價與產量。
2. 正式總覽固定提供數字，無資料為 0，確保顯示 0 /hr。
3. 處理清空設備後等待引擎更新的短暫舊值；容器可依已有 hasDevices 映射為 0。
4. 本輪沿用既有小數精度與大數值上限，不調整展示格式或新增完整值提示。
5. 使用正式頁面與既有 Story 手動檢查零值、小數及大值，不新增或修改 Story 測試；L3 維持 props 契約，禁止為展示元件註冊或匯入 Pinia store。

## 驗收

- 正式總覽有有效交付時顯示券數，不再缺少接線。
- 無設備、無有效交付與無價格總額顯示 0 /hr。
- 切換基地後更新數字；自由畫布仍計價。
- 零值、小數與大值顯示正常，產品展開狀態與耗電／供電顯示正常。
- L3 僅使用 props；本輪沿用既有格式，未新增 title。

下一步：[04 測試與操作驗收](./W1106_ticket_step_04_verification.md)。

## 執行結果

ProductionStats.vue 透過 exchangeRate 傳入 deliveryTicketTotal；無設備立即傳 0。ResultPanel、StatsPanel/types 與所有 Story 測試均未修改。

使用者補充「不需要更改排版，依照 master 即可」。已核對本機 origin/master 的調度券顯示區塊，與目前 ResultPanel 相同；本輪沒有排版變更。

當步接線 17 案通過。以隱藏 Chromium 檢查正式頁面：載入正式「源礦 → 精煉爐 → sink」後，晶體外殼交付 30 個／分，顯示 1,800 /hr；由頂部選單切換武陵為 0、谷地為 1,800、自由畫布為 1,800。供料 15 個／分顯示 900，斷線／history undo／redo 顯示 0 → 900 → 0，清空顯示 0 /hr 與 0 kW / 0 kW。

產線快照與 history action 透過頁面內既有 store 操作，基地切換透過 DOM 按鈕點擊；未宣稱驗證原生拖拉或 Delete。無 runtime error，無截圖或 JSON 報告。首次沙箱內 CDP Page.enable 逾時，使用允許的提升權限重試後全部通過；首次工具逾時不列為功能通過證據。
