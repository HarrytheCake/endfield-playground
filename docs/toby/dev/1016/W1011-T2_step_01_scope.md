# W1011-T2 步驟 01：範圍與介面確認

狀態：待執行。

## 目標與檔案

以讀取與記錄確認最新基準及事件契約。本步不修改產品程式；更新本分析與索引中的決策紀錄。

## 執行順序

1. 執行 `git status --short --branch`、`git rev-parse --short HEAD`，與分析基準比對，列出已有變更。
2. 重讀最新 T2／週派工及 H2 接口；若本機新增 G2 的 DeviceShape，核對是否有可用拖曳狀態，不因新檔存在就整套掛載。
3. 搜尋 GridCanvas／LayoutView 呼叫端。目前主要為 LayoutView → GridCanvas、GridCanvas Story、MainLayout → LayoutView；確認後續變更沒有增加新的消費端。
4. 固定 `LayoutView` 的 `select-device: [id: string | null]` 契約，H2 在 MainLayout 保存選取。T2 不保證面板已顯示。
5. 固定 GridCanvas 的唯讀預覽 prop：建議 `deviceDragPreview = null | { deviceId, position }`；省略時維持現有顯示與 Story 相容。保留 cell-click(Position)，不在 GridCanvas 加 Pinia。
6. 固定手勢優先序：中鍵／平移工具優先；一般左鍵再分設備／空白；武裝落子僅在空白未拖動的 click 生效。記錄像素拖曳門檻，例如 4 px，並驗證不依 zoom 改變手感。
7. 固定無位移語意：未超過門檻視為點選；超過門檻但回原格不提交也不當點選。空白拖曳不清選取，空白點擊 emit null。
8. 記錄出界文件落差：保留現有 Error 與 action 契約；如驗收方要求出界拒絕，屬需求／L1 待裁，不能在 L2 旁路阻擋。
9. 確認取消、失去捕捉、卸載與重入的清理策略，及未來 C1 可插入埠命中的位置。

## 限制與驗收

- 不改 store、全域快捷鍵或 MainLayout；不額外建立 selection store。
- 座標只使用同一套 useGridViewport，不混入 canvasStore 的另一套 offset／zoom。
- 驗收：事件／prop、手勢矩陣、門檻、文件落差與禁止檔案均有明確紀錄；沒有以「已分析」宣稱功能已完成。

下一步：[步驟 02](./W1011-T2_step_02_gestures.md)。
