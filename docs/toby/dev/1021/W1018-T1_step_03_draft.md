# W1018-T1 步驟 03 本地 draft

狀態：已驗證。日期：2026-10-21。[步驟索引](./W1018-T1_steps.md)。

## 目標與檔案

在 LayoutView 增加 connection 手勢與本地 draft，讓一般左鍵依埠、設備體、空白判斷；GridCanvas 透過 props 顯示預覽與目標。

## 限制

手勢按下後固定種類，保留明確平移。draft 不寫 store 或歷史；游標保存為 CSS 座標，視角變動後重新命中，不保存過期格座標。

## 驗收結果

原生滑鼠按埠移動能看到預覽與目標 highlight；拖曳期間 layout action、管線數與歷史深度皆為零。注入 pointercancel 後預覽清除，不新增資料。

下一步：[放開驗證與提交](./W1018-T1_step_04_commit.md)。
