# W1011-T2 步驟 03：預覽渲染、提交與選取

狀態：待執行。

## 目標與修改檔案

修改 `LayoutView.vue`、`GridCanvas.vue`；必要時更新 `GridCanvas.stories.ts`。使手勢成為可操作、可取消的完整流程。

## 執行順序

1. GridCanvas 新增步驟 01 固定的可空預覽 prop，預設 null；用 computed 產生顯示資料，僅替換命中設備的 position，不改原始 devices。
2. 設備佔格、標籤與附屬顯示共用預覽位置，避免圖形移動但標籤留在原地。不另外畫一份原位設備；管線維持原座標。
3. 拖曳設備使用可辨識的淺藍拿起狀態。若 G2 已提供符合範圍的狀態可評估沿用；否則僅在 GridCanvas 加必要狀態，不替換整套形狀元件。出界警示不新增判定公式，不讓原位紅框造成預覽位置已檢查的錯覺。
4. LayoutView 宣告 select-device emit。設備未拖動的正常放開 emit ID；空白未拖動 emit null，並允許同次原有空白 click 執行武裝落子。平移工具手勢不發選取事件。
5. 正常 pointerup 以放開座標更新最終預覽，避免最後一段沒有 pointermove 時落到舊格。已拖曳且不同原位置才呼叫一次 moveDevice。
6. action 回傳失敗時只清預覽，設備自然顯示 store 原位置，不彈窗；成功時清預覽後顯示 store 新位置。不自行呼叫 historyStore.execute。
7. pointercancel／lostpointercapture／卸載只清理；結束處理先解除本地有效手勢，再釋放 capture，防止同步／後續 lostpointercapture 重複提交。
8. 移動、平移與取消後抑制 click；設備點選亦不可觸發 addDevice。下一次正常空白點擊恢復既有落子，不依賴 setTimeout 競速。
9. 處理拖曳期間設備被移除的情境：安全清預覽或接受 action invalid，不產生例外。未知預覽 ID 與 null prop 不影響其他設備。
10. Story 補正常預覽、null、未知 ID 等有意義情境，維持現有基地／空資料 Story。確認亮色與暗色模式的拿起狀態可辨識。

## 限制與驗收

- GridCanvas 不 import store、不改 props；本單不掛 MainLayout 接收端。
- 完整拖曳成功只增加一筆歷史；拒絕、單純點選、拖回原格、取消均不新增移動歷史。
- 結束後無殘留 capture、本地預覽、抓取游標或持續 click 抑制。
- 基地出界以既有契約處理；文件所稱禁區拒絕列為差異，不擅自實作。

下一步：[步驟 04](./W1011-T2_step_04_verification.md)。
