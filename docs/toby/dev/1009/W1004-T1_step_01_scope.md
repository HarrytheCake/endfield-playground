# W1004-T1 步驟 01：範圍與介面確認

狀態：已完成並複核（2026-10-09）。

## 目標與檔案

確認當前程式可在不碰禁止檔案的前提下完成需求，先固定 GridCanvas／LayoutView 的資料及事件介面。本步以讀取與記錄為主，不修改落子行為。

閱讀最新 T1、GUIDE、A0，以及 GridCanvas、LayoutView、useGridViewport、canvasStore、placementCheck、deviceOccupancy、toFootprint、GridCanvas Story 與直接相關測試。

## 執行順序

1. 執行 `git status --short --branch`；列出既有變更，避免把他人的內容當成本次修改。
2. 搜尋 GridCanvas 的所有呼叫端、`gridWidth`／`gridHeight` 的傳入處與 `cell-click` 訂閱。確認舊 props 是否需要保留相容，不能直接移除未知呼叫端使用的介面。
3. 搜尋 `devicesOutsideBase` 是否已存在；若存在，核對實際型別、唯讀支援、region=null、未知機器與旋轉契約及測試，不只依派工交期判斷。
4. 確認首頁容器有有效寬高，Navbar 基地選擇實際更新同一個 canvasStore。
5. 固定純 props：設備、管線、cellSize、視窗 offset／zoom、基地尺寸或 null、出界 ID。建議基地尺寸傳普通 `{ w, h }`，避免 GridCanvas import canvasStore 常數或型別。
6. 固定點擊接法：可由 L2 傳座標換算 callback，GridCanvas 將本地像素換成 Position 並保留 cell-click；或設計相容事件橋接。選一種，避免畫布與 L2 各自維護不同公式。
7. 固定平移手勢。建議先採中鍵拖曳，避免搶用左鍵落子與既有快捷鍵；確認主要驗收裝置能使用。若採 Space＋拖曳，先核對全域快捷鍵衝突，不改其他互動系統。
8. 訂出 drag 結束抑制 click、pointer capture 釋放、pointercancel 與元件卸載清理方式。
9. 確認 cellSize 是初始化常數或可動態變更。useGridViewport 目前以初始化 cellSize 計算；不得讓顯示更新而換算仍用舊值。

## 限制與驗收

- 不改 MainLayout、工具列視覺、store action 或全域快捷鍵。
- 不把 canvasStore 的 offset／zoom 與 useGridViewport 兩套狀態混用；本工單先由 L2 持有單一視窗狀態。
- 若容器或型別契約必須修改禁止檔案才可修正，保留檔案位置、實際值與失敗案例，列為上游問題。
- 驗收：確認所有呼叫端可維持使用、props 不暴露 store、事件契約與平移方式明確，所有禁止檔案已列入 diff 檢查清單。

下一步：[步驟 02](./W1004-T1_step_02_viewport.md)。

## 執行證據

實作前為 dev/toby，工作樹乾淨，基準 commit 為 26fd3f5。搜尋確認 GridCanvas 只有 LayoutView 與其 Story 呼叫，無其他 gridWidth／gridHeight 傳入，故移除固定格數 props。上游 devicesOutsideBase 尚不存在。

LayoutView 持有 useGridViewport，cellSize 固定為同一初始化值；透過 callback 提供 screenToCell，維持 cell-click(Position)。中鍵拖曳由 L2 處理，左鍵仍落子。GridCanvas 單獨 Story 以 props 提供視窗狀態；未給 callback 時有本地 props 換算。基地傳純尺寸與 ID，不 import store。

首頁 CSS 已提供可用畫布寬高；瀏覽器 resize 後量測為 660.75×630 像素。無需修改 MainLayout。
