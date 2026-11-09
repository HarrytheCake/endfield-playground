# W1018-T1 步驟 01 範圍與契約

狀態：已驗證。日期：2026-10-21。[步驟索引](./W1018-T1_steps.md)。

## 目標與檔案

閱讀 README、工單、本週派工與 C1 規格，對照 LayoutView、GridCanvas、portHitTest、portAnchorIndex、connectRules 及 layoutStore 的現況。

## 限制

產品修改限於工單指定畫布檔案；可補對應 Story 與驗證。禁止修改 L1 工具、stores、MainLayout 或他人 shapes，不新增旋轉、Delete 或 Ctrl+Z 入口。

## 驗收結果

已確認分支 `dev/toby` 與既有變更。命中使用連續格座標，儲存端點使用外側整數錨點；canConnect 可允許斷線，UI 必須另外核對兩端 PortRef。基礎測試 5 個檔案、67 項通過。

下一步：[埠顯示與命中](./W1018-T1_step_02_ports.md)。
