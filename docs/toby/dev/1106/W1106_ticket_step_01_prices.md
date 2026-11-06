# 步驟 01：基地價格對應

日期：2026-11-06。狀態：完成，驗證通過後已執行步驟 02。依據 [分析文件](./W1106_ticket_analysis.md)。

## 目標與來源

在 L1 取得目前基地對應的品項價格表。基地來自 `src/store/canvasStore.ts` 的 baseRegion；價格來自 `src/data/plans.ts` 的 product_values，原始資料為 `docs/aaaaa/data/plans.json`。

## 預計修改

- `src/store/flowStore.ts`：加入基地與計畫價格的衍生對應，逐項鍵值與 sinkDeliveries 的 itemId 契約核對。
- `docs/toby/test/layoutFlowWiring.test.ts`：擴充基地價格測試。

## 執行順序

1. 核對 wuling 對應武陵、valley4 對應四號谷地，null 對應自由畫布。
2. 使用正式計畫識別值建立對應，避免混淆 UI 的「武陵地區」與資料的「武陵」。
3. 自由畫布逐項合併：谷地提供後備價格，武陵同名品項優先。
4. 以 computed 跟隨基地更新，不累積上一基地的價格，不依賴切換歷史。
5. 記錄價格缺項及異常價格的處理規則；歧義分開詢問使用者。

## 限制與驗收

不改正式價格資料、不改畫布尺寸、不將價格選取寫入 L3，也不為此同步改動 editorStore 的其他計畫設定。

- 低容量武陵電池：武陵 25、谷地無價格、自由畫布 25。
- 低容量谷地電池：武陵無價格、谷地 16、自由畫布 16。
- 鋼製零件：谷地 3，自由畫布可採用谷地價格。
- 紫晶質瓶：自由畫布可回退谷地價格 2。
- 武陵優先規則使用兩計畫有同名品項的明確測試資料驗證，不將不同名稱的電池當作同一品項；正式資料不為測試而修改。
- 反覆切換基地，價格不殘留。
- 選定單一基地時不跨基地補價。

下一步：[02 實際交付量換算](./W1106_ticket_step_02_calculation.md)。

## 執行結果

flowStore 新增 deliveryTicketPrices，以 canvasStore.baseRegion 及 plans 的計畫 ID 選取價格。自由畫布合併谷地與武陵價格，武陵同名覆蓋；未改正式價格資料。

`pnpm exec vitest run docs/toby/test/layoutFlowWiring.test.ts` 當步 15 案通過。新增基地切換及同名價格優先測試，後者只在測試內替代 plans.find 回傳值，不修改正式資料檔。通過後才進入步驟 02。
