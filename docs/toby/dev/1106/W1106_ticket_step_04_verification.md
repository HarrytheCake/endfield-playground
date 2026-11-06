# 步驟 04：測試與操作驗收

日期：2026-11-06。狀態：完成。前置：[步驟 03](./W1106_ticket_step_03_panel.md) 完成。

## 目標與修改範圍

驗證正式畫布、引擎交付量、自動計價與展示的完整資料流。依使用者指示，本功能測試程式僅擴充既有 `docs/toby/test/layoutFlowWiring.test.ts`；不新增測試檔、不修改 Story 測試或 `src/__tests__/`。以下操作與品質結果以文末實際紀錄為準。

## 驗收順序

1. 執行換算測試：單品、多品、兩基地價格差異、自由畫布優先與回退、無價格、零交付、重設。
2. 以正式配方建立可交付有價產品的產線，核對源素材、設備模式與流量，不以假配方代替接線。
3. 檢查交付品項鍵值可匹配 plans 的產品名稱。僅向 store 注入交付量的測試，記為換算測試，不視為正式產線驗收。
4. 由頂部依序切換武陵、谷地、自由畫布，交付量相同時價格按規則改變。
5. 調整源流量、斷開管線、恢復管線、清空設備，確認數字跟隨計算結果更新，空畫布為 0 /hr。
6. 使用可用且已接線的 history action 驗證 undo／redo。Delete 已知來源問題只紀錄，不在此次修正或宣稱通過。
7. 開啟 Storybook，確認 Controls、邊界狀態、鍵盤與 Accessibility 結果；既有問題與本次新增問題分開記錄。

## 品質指令

依變更範圍執行並記錄實際結果：

```text
pnpm exec vitest run docs/toby/test/layoutFlowWiring.test.ts
pnpm exec prettier --check docs/toby/test/
pnpm type-check
pnpm lint-check
pnpm format-check
pnpm test
pnpm build-storybook
git diff --check
```

一般 format-check 不涵蓋 docs 測試目錄，因此另列格式指令。禁止主動產生測試截圖或 JSON 報告，驗收採文字紀錄。既有無障礙或建置警告應如實列出，不將部分通過描述為全面通過。

## 完成紀錄

完成後更新本文件及 [步驟索引](./W1106_ticket_steps.md)，填入修改檔案、資料來源、指令結果、正式操作結果及已知限制。另建工作摘要須依使用者要求；提交、push、PR 亦需明確指示。

## 實際結果

| 檢查 | 結果 |
| --- | --- |
| 指定接線測試 | 1 檔 19 案通過；本輪新增 6 案 |
| 全套 pnpm test | 59 檔 1051 案通過 |
| pnpm type-check | 通過 |
| pnpm lint-check | 通過 |
| pnpm format-check | 通過 |
| docs 測試 prettier 檢查 | 通過 |
| pnpm build-storybook | 通過 |
| 既有 StatsPanel Story | 13 個通過，含既有 play 與鍵盤操作；未修改 Story 檔 |
| 正式頁面 | 步驟 03 的交付換算、基地切換、供料變動、斷線、history undo／redo 與清空通過 |

新增 6 案涵蓋基地價格、同名覆蓋、交付換算、手動契約隔離與非法交付、正式精煉配方流量／歷史操作、多產線同品項交付與錯誤排除。兩條正式「源礦 → 精煉爐 → 倉庫存貨口」交付晶體外殼 60 個／分，總額 3600；阻擋其中一台精煉爐後交付 30、總額 1800，兩台額定耗電仍為 10 kW。未修改引擎或設備資料。

早期新增測試曾誤用不存在的 recalculate 方法，改為既有 runFlowEngine 入口後通過；這是測試撰寫問題，未因此修改正式 API。

Story axe 仍有既有問題：Default 對比度 2 處、DecimalRates 1 處、OverloadPower 2 處、ManyProductionsOverflow 3 處、ManyTipsOverflow 5 處、LongTextOverflow 對比度 1 處與 scrollable-region-focusable 1 處；其餘 7 個 Story 無違規。未將 13 個 Story 通過描述為全面無障礙通過。建置仍有既有 Index 同名元件、Browserslist 過期、chunk 大小與 plugin timing 警告。

正式頁面操作細節與首次 CDP 工具逾時見步驟 03。Delete 依要求不處理，原始 plans.json 與使用者更正的 plans.ts 尚未同步。數字沿用既有顯示上限與精度。本輪依使用者指示提交至 dev/toby，不 push，實際提交結果以 Git 紀錄為準；未建立額外工作摘要。
