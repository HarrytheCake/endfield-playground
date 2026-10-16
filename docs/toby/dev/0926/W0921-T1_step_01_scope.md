# 步驟 01：確認範圍、分支與 A0 狀態

## 目標

在程式修改前確認來源、目前分支、工作樹、前置 API 與重疊修改範圍。

## 唯讀檢查

1. 執行 `git status --short --branch`；使用者已指定在 `dev/toby` 執行，不建立派工原列的 `dev/toby0921`。
2. 閱讀最新 W0921-T1、GUIDE、A0、goodmorning 的工具列分工，以及實際 `ToolbarPanel`、`LayoutView`、`GridCanvas`、`layoutStore`。
3. 確認 `src/utils/layout/placementCheck.ts`、`canPlaceDevice` 是否已存在，並核對實際簽章、唯讀資料契約與 `DRAFT_ID`。不可只憑 9/24 交期假設已合入。
4. 確認工具列檔案是否已有其他人變更；保留 template／style，避免以整份檔案覆蓋。
5. 核對分析摘要中的 2026-09-26 使用者裁定：Esc 維持現況、工具列切換時解除新意圖、完整落子等 A0 合入。

## 驗收條件

- 已辨識本次允許與禁止的路徑，且既有變更與本次變更可區分。
- 已確認 A0 是可 import、尚未合入或簽章不合；若尚未合入，先做步驟 02，暫不完成步驟 03。若契約不合，保留證據並交由 A0 owner 補正。
- 尚未修改程式碼。

## 下一步

進入 [步驟 02](./W0921-T1_step_02_intent.md)。

## 執行結果（2026-09-26）

已在 `dev/toby` 完成範圍檢查；開始時只有本工單文件屬未追蹤變更。A0 的 `placementCheck.ts`／`canPlaceDevice` 尚未出現在本分支，因此先執行步驟 02。
