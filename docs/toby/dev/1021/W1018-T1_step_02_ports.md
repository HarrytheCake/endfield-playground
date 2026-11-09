# W1018-T1 步驟 02 埠顯示與命中

狀態：已驗證。初版日期：2026-10-21；圓點命中調整：2026-10-23。[步驟索引](./W1018-T1_steps.md)。

## 目標與檔案

在 LayoutView 換算指標的連續格座標，並消費現有 mode、旋轉與埠邊心工具，映射成 readonly 埠 props 後交由 GridCanvas 顯示埠點及 highlight。保留設備拖曳的整數格換算。

## 限制

不得重寫命中或旋轉算法。GridCanvas 不 import Pinia，新增展示狀態透過 readonly props 傳入。依使用者明確選擇，取消原半格／8 px 附近熱區；L2 用可選參數覆寫為可見圓點半徑，L1 預設值不修改。

## 驗收結果

四方向旋轉埠逐一命中，非正方灌裝機 gas_liquid_mode 的 pipe 埠與視覺一致。平移與 zoom=0.25／1／2 下，圓心內側 3 px 可拉線、外側 7 px 不高亮或拉線；高亮不放大圓點。靠近埠的設備體仍可拖設備，圓點外放開不吸附連線。GridCanvas.stories.ts 依使用者要求保持 Git 基準內容。

下一步：[本地 draft](./W1018-T1_step_03_draft.md)。
