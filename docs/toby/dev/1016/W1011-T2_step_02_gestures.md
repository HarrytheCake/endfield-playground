# W1011-T2 步驟 02：設備命中與手勢分流

狀態：已完成並驗證（2026-10-16）。本步驗證時尚未接預覽渲染與移位提交。

## 目標與修改檔案

修改 `src/editor/layout/LayoutView.vue`，建立本地手勢與預覽資料；本步不提交設備位置。若需暫停於此步，避免讓未完成的拖曳路徑誤觸原有落子。

## 執行順序

1. 將 PointerEvent 的 clientX／clientY 換成容器內像素，再交由 screenToCell 換格。參照 GridCanvas 既有 bounds／viewBox 比例換算，避免使用會隨 SVG 子元素變動的 offsetX／offsetY。
2. 以 getMachineById、deviceSizeFromMachine、toDeviceFootprint、getDeviceOccupiedCells 取得設備佔格；按 xy 投影命中，涵蓋旋轉後所有格。查不到機型時安全略過，不複製旋轉算法。
3. 若快照設備投影重疊，採固定、與 SVG 繪製順序一致的優先序，例如後繪製者優先；記錄這是 2D 點選規則，不能因此改 store 的合法性判斷。
4. 把原單一 drag 狀態改成可區分設備／空白待定／平移的本地狀態；記錄起始 pointerId、螢幕位置、游標格、設備 ID 與原位置。只保存互動所需資料，避免把 props 或 store 物件當可變預覽。
5. 中鍵或平移工具左鍵沿用 panBy；一般左鍵命中設備準備移動，空白則準備點擊／平移。右鍵及第二根 pointer 不啟動新手勢。
6. 超過步驟 01 固定的螢幕像素門檻才標記拖曳。設備預覽採原位置加游標格差，保留原 z；空白平移從起點計算首次位移，後續以增量更新，避免超過門檻時漏掉起始位移。
7. 需要時捕捉起始 pointer；後續 move／end 僅處理相同 pointerId。預覽位置用 local ref，不呼叫 moveDevice 或直接改 store。
8. 與原 suppressPlacementClick 整合：確認拖曳、取消、下一次正常左鍵點擊的抑制狀態不會殘留，也不讓空白待定手勢提早吞掉合法落子。
9. 以繁體中文 JSDoc 說明新增型別、成員、變數、函式及副作用。保持事件分流清楚，未來可在設備命中前插入 C1 埠判斷，但不預先實作管線模式。

## 限制與驗收

- 不修改 useGridViewport、store 或幾何工具，不新增碰撞／邊界規則。
- 多格設備從中間或角落拿起不跳位；平移後仍命中正確格；保留非零 z。
- 拖曳中的 devices／pipelines／history 完全不變；空白及中鍵平移只更新視窗。
- 若本步尚未接 GridCanvas 預覽，清楚記為內部狀態完成，不能宣稱可用拖曳已交付。

下一步：[步驟 03](./W1011-T2_step_03_preview_commit.md)。

## 執行證據

- LayoutView 新增 CanvasGesture、本地預覽 ref、SVG 矩形座標換算、反向設備佔格命中與 ≥4 CSS px 門檻；一般左鍵捕捉 SVG，明確平移捕捉容器。
- `pnpm type-check` 通過；viewport、deviceOccupancy、toFootprint、layoutStore 四份既有測試共 70 案通過。
- 以本機已快取 Playwright／Chromium 對 `pnpm dev --host 127.0.0.1` 首頁操作，確認設備從 (2,2,z=3) 預覽到 (5,4,z=3) 時 store 位置與 history 深度不變，放開清預覽，空白平移增加 (28,28) offset。
- 同一瀏覽器以原生 mouse click 連續放置兩台 splitter 成功，確認 SVG capture 沒有吞掉原 cell-click；未新增測試套件依賴。
- 本步沒有呼叫 moveDevice；預覽可見與提交在步驟 03 完成。探針位於忽略的 node_modules/.tmp，完整互動回歸會在步驟 04 保存可重跑腳本。
