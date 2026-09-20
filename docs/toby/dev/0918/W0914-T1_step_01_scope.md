# 步驟 1：確認範圍與前置依賴

## 目標

在修改程式碼前確認分支、工作樹、前置 PR 與目標檔案現況，鎖定本次只做 L2 唯讀接線。

## 唯讀檢查

1. 執行 `git status --short --branch`，區分既有變更與本次工作。
2. 確認目前位於 `dev/toby0914`；若仍在 master，先建立工單分支再修改。
3. 確認下列前置檔案存在並閱讀其公開契約：
   - `src/store/layoutStore.ts`
   - `src/editor/layout/GridCanvas.vue`
   - `src/data/mockLayout.ts`
   - `src/editor/layout/useGridViewport.ts`
4. 確認 `MainLayout.vue` 的 `area-canvas` 目前仍掛 `FactoryCanvas`。
5. 確認工作樹沒有其他人的未提交變更；若有重疊檔案，停止並回報。

## 範圍確認

- 本工單只新增容器、傳遞資料及替換首頁掛載點。
- `GridCanvas` 只接受 props，不得讀取 store。
- `loadSnapshot` 只能在 LayoutView 初始化且 store 為空時呼叫。
- 不接平移縮放、不做切換器、不修改互動功能。

## 驗收條件

- 已記錄分支與工作樹狀態。
- #45、GridCanvas 與 #47 的實際程式碼均存在。
- 已確認允許及禁止修改的檔案。
- 尚未修改程式碼。

## 下一步

確認前置條件無誤後，進入「步驟 2：建立 LayoutView 資料接線」。
