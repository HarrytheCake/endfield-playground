# 步驟 02：實際交付量換算

日期：2026-11-06。狀態：完成，驗證通過後已執行步驟 03。前置：[步驟 01](./W1106_ticket_step_01_prices.md) 完成。

## 目標與來源

使用 `src/store/flowStore.ts` 的 sinkDeliveries 與步驟 01 的價格表，計算每項及總調度券／小時。sinkDeliveries 由 `src/composables/useFlowEngine.ts` 加總合法 sink 實際接收速率後寫入。

## 預計修改

- `src/store/flowStore.ts`：自動計價的品項明細與總額。
- `docs/toby/test/layoutFlowWiring.test.ts`：換算、加總與重設測試。
- 必要時更新 `src/types/plan.ts` 的價格單位註解。

## 執行順序

1. 依使用者要求執行分析方案，建立獨立自動衍生結果，保留既有 ticketRates、ticketOutput、ticketTotal 契約。
2. 逐項讀取交付量與價格，計算 `deliveryPerMin × price × 60`。
3. 合計所有有效品項；無交付、無價格或重設結果後總額為 0。
4. 對非法數值加防護，避免 NaN／Infinity 進入總覽；異常價格的回退語意先依使用者確認。
5. 基地切換直接更新衍生結果，沿用引擎現有流量計算與 debounce。

## 驗收

- 低容量武陵電池 2 個／分 × 武陵 25 × 60 = 3000；切換谷地因無對應價格為 0。
- 低容量谷地電池 2 個／分 × 谷地 16 × 60 = 1920；自由畫布回退谷地同為 1920。
- 自由畫布同時交付低容量武陵電池與紫晶質瓶各 2 個／分 = 3240。
- 鋼製零件 2 個／分 × 谷地 3 × 60 = 360。
- 只有正淨產量、沒有 sinkDeliveries 時為 0。
- 清空結果後歸零；多個 sink 同品項使用引擎彙總量，不重複加總。
- 既有產耗、額定耗電、供電與倉庫衍生結果不受影響。

下一步：[03 正式總覽接線](./W1106_ticket_step_03_panel.md)。

## 執行結果

新增 deliveryTicketOutput 與 deliveryTicketTotal，使用 sinkDeliveries 逐項乘以價格及 60。缺價格、非正與非有限輸入不計價，避免非有限乘積與總額溢位。既有手動券數及倉庫功能保留。

當步 `pnpm exec vitest run docs/toby/test/layoutFlowWiring.test.ts src/__tests__/store/flowStore.test.ts` 共 2 檔 38 案通過，`pnpm type-check` 通過。既有共用測試僅執行、未修改；新增測試均放在指定接線檔。通過後才進入步驟 03。
