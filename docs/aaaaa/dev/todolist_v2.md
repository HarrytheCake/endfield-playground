# V2 TODOLIST — 調度券與倉庫預估

**版本：** V2  
**建立日期：** 2026-05-22  
**負責人：** aaaaa  
**對應開發文件：** [dev_v2.md](./dev_v2.md)

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## V2-A｜Store 擴充（前置，無外部依賴）

- [x] **V2-A1** 「`src/store/flowStore.ts`」新增使用者可調 state
  - `ticketRates: ref(new Map<string, number>())` — itemId → 兑換率（券/hr per 個/min）
  - `warehouseCapacity: ref(0)` — 倉庫容量（格數，0 = 未設定）

- [x] **V2-A2** 「`src/store/flowStore.ts`」新增衍生 computed
  - `ticketOutput: computed(...)` — `Map<itemId, 券/hr>`，僅包含 net > 0 且已設定兑換率的品項
  - `ticketTotal: computed(...)` — 所有 `ticketOutput` 元素加總（券/hr）
  - `warehouseEstimates: computed(...)` — `Map<itemId, 小時>`，net > 0 時展示填滿時間；`warehouseCapacity <= 0` 時回傳空 Map

- [x] **V2-A3** 「`src/store/flowStore.ts`」新增使用者可調 actions
  - `setTicketRate(itemId: string, rate: number): void` — rate <= 0 時自動刪除該項設定
  - `setWarehouseCapacity(capacity: number): void` — 下限 0（負數視同未設定）

- [x] **V2-A4** 「`src/store/flowStore.ts`」 `reset()` 不重置使用者設定
  - `ticketRates` 與 `warehouseCapacity` 屬於使用者偏好，不得被界面重置清除
  - `return` 列表新增六個 export ：`ticketRates`、`ticketOutput`、`ticketTotal`、`warehouseCapacity`、`warehouseEstimates`、`setTicketRate`、`setWarehouseCapacity`
  - ✅ pnpm type-check 零錯誤

---

## V2-B｜UI 擴充（依賴 V2-A）

- [x] **V2-B1** 「`src/editor/stats/ProductionStats.vue`」 新增調度券設定區塊
  - 位置：總產出區塊下方、倉庫預估上方
  - 對 `itemSummary` 中 net > 0 的品項列出輸入行
  - 每行：`[品項名] [_兑換率 input___] 券/hr`
  - input 表前繫定至 `ticketRates.get(itemId) ?? ''`，修改時呼叫 `setTicketRate()`
  - 區塊導第如 `hasResults` 為 false 時顯示灰色提示文字

- [x] **V2-B2** 「`src/editor/stats/ProductionStats.vue`」 新增調度券預估展開區塊
  - 圖示範例（對齊 spec 節 2.5）：
    ```
    調度券預估產出： XXX 券/hr
      └ 工業爆炸品 × 2.0/min → YY 券/hr
      └ 穩定碳塊 × 1.5/min → ZZ 券/hr
    ```
  - `ticketTotal.value === 0` 時顯示「請先設定兑換率」提示
  - 問語標題区別 `ticketTotal` 與明細展開區塊（可收折 `<UiDisclosure>` 或 `<details>`）

- [x] **V2-B3** 「`src/editor/stats/ProductionStats.vue`」 新增倉庫容量設定區塊
  - 區塊導第：展示一個容量輸入格
  - 標題 + 單位：`倉庫容量` / 单位：格
  - input v-model 綁定至 local `capacityInput`，失焦時呼叫 `setWarehouseCapacity()
  - 0 系未設定，顯示 placeholder 「請輸入容量」

- [x] **V2-B4** 「`src/editor/stats/ProductionStats.vue`」 新增倉庫填滿預估展示區塊
  - `warehouseCapacity.value <= 0` 時展示提示文字取代表格
  - 顯示格式範例（對齊 spec 節 2.5）：
    ```
    倉庫預估（容量：1000 格）
      工業爆炸品：約 8.3 小時填滿
    ```
  - 小數點派到小數點後一位（`toFixed(1)`）
  - 僅列出 `warehouseEstimates` 中有項目的品項（net > 0 且已設定容量）

---

## V2-C｜品質驗證（依賴 V2-A、V2-B）

- [x] **V2-C1** `pnpm type-check` 零錯誤
- [x] **V2-C2** `pnpm test --run` 全數通過（既有 27 條測試不受影響）
- [x] **V2-C3** 手動驗證情境（總共三組）
  - **T-Ticket-1**：設定品項 A 兑換率，驗證 `ticketOutput` 與 `ticketTotal` 數字即時更新
  - **T-Ticket-2**：兑換率設為 0 時品項從明細列表消失
  - **T-Ticket-3**：甲網筆 net = 0 的品項不顯示在調度券區塊
  - **T-Ware-1**：輸入倉庫容量，驗證填滿時間公式：`capacity / net / 60`（小時）
  - **T-Ware-2**：容量為 0 時顯示「請輸入容量」
  - **T-Ware-3**：修改產線配置後倉庫預估自動更新
- [x] **V2-C4** `pnpm lint-check` 零警告
- [x] **V2-C5** `pnpm format-check` 通過

---

## 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 預計解除 |
|----|---------|---------|----------|
| V2-B3 模組就緒 | Nuxt UI v3 input 組件可用性待確認 | 應用環境及 UI 導入方式 | 可使用原生 `<input>` 替代 |
