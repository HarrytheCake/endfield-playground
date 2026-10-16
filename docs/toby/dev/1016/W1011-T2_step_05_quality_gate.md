# W1011-T2 步驟 05：品質門檻與交付證據

狀態：待執行。

## 目標與檔案

驗證最終 diff，整理交付證據並交接 H2／C1。以本單程式與測試、Story、分析文件為限，不順便修復無關基準問題。

## 執行順序

1. 檢查 git diff／git status，核對禁止檔案沒有本次變更；區分原有與本次內容。
2. 搜尋 GridCanvas 的 store import、props 寫入，及 LayoutView 的 moveDevice／history 使用位置。確認 moveDevice 僅在正常完成手勢路徑呼叫，L2 未自行 execute Command。
3. 若當前環境實際提供 validate-changes skill，依 AGENTS 使用；未提供則手動執行下列四項，不聲稱已使用不存在的 skill：

   ```powershell
   pnpm type-check
   pnpm lint-check
   pnpm format-check
   pnpm test
   ```

4. 格式或 lint 修正只處理本單檔案，避免全專案自動修正擴大 diff。勿用會自動 lint／format 全專案的 validate-all 代替只讀檢查。
5. 修改 Story 時執行 pnpm build-storybook，並保留步驟 04 的實際開啟檢查紀錄。其餘建置檢查依變更需要執行，完成門檻後不無故反覆跑測試。
6. 執行 git diff --check，檢查新增文件連結、路徑與狀態。清楚區分計畫、已執行與未執行項目。
7. 交接 Harry：事件名稱 select-device、payload 為實例 ID 或 null、只在一般未拖動點擊發出，MainLayout local ref 由 H2 保存；不得宣稱本單已完成左側面板。
8. 交接後續 C1：保留指標分流位置，hitTestPortAt 需連續格座標；T2 未接管線模式、未掛完整 shapes。
9. 更新分析與索引狀態，記錄檔案、驗證指令／結果、操作案例、出界文件落差及剩餘上游事項。
10. 提供具體可審查 diff 與交付摘要。使用者明確指示後才 push／開 PR；沒有指示時將 PR 列為尚未執行，不自行勾選工單全部完成。

## 完成條件

- 核心操作與回歸案例有證據，所有必需品質檢查通過，或如實列出阻礙／既有失敗。
- 拖曳途中不寫 store、有效放開只提交一次，GridCanvas 無 Pinia。
- 本單禁止範圍沒有擴張；未將邊界規則、面板接線、快捷鍵或樣式替換混入。
- 交付摘要足以讓未讀對話的審查者了解行為、限制與驗證結果。

若尚有本單必要功能或驗證未完成，維持進行中，不因文件已建立而宣稱完成。
