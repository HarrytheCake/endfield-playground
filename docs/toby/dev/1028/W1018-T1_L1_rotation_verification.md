# W1018-T1：改接 #79 的執行與驗證紀錄

日期：2026-10-28。對應 [修改步驟](./W1018-T1_L1_rotation_steps.md)。

## 步驟 1：分支與基準

已執行 `git fetch origin`。遠端追蹤基準為 origin/master `d48ac99`、origin/dev/toby `db0c7f8`；#79 的合併提交 `5f79562` 是 origin/master 祖先。PR 差異以 origin/master 為基準；本次未查詢線上 PR metadata。

開始時檢出 master，只有先前新增的分析／步驟文件未追蹤；均保留，未覆寫使用者檔案。

## 步驟 2：rebase

已建立本機備份分支 `backup/toby-before-l1-rebase-20261028` 指向 `db0c7f8`，切換至 dev/toby 並執行 `git rebase origin/master`。

重播原提交 `783a943` 時，layoutStore.ts 與 layoutStore.rotation.test.ts 發生衝突。使用明確來源 origin/master 還原這兩個檔案的工作樹與暫存版本，再繼續 rebase；未使用含混的 ours／theirs 選擇。

完成後 HEAD 為 `a9e3209`。相對備份分支的 `src` 差異為零，確認 rebase 本身未改變既有功能內容；相對 origin/master 的 PR 差異已不包含兩個 L1 檔案。舊 L1 旋轉實作與測試不再出現在重播提交中。

## 步驟 3：L2 修正

僅修改 LayoutView.vue 的旋轉入口：保留呼叫 #79 的 `layoutStore.rotateDevice`，移除不適用的 overlap 拒絕提示，改以通用失敗提示反映 L1 拒絕結果。補上繁體中文 JSDoc 說明重疊由 L1 衍生資料標示，L2 不自行阻擋。

旋轉路徑無直接 store mutation、history.execute 或自行建立 Command；未新增 action，也未修改兩個 L1 檔案。

## 步驟 4：正式頁驗證

以 Chromium headless 開啟 `http://127.0.0.1:5173/`，透過既有 L1 action 載入情境，使用原生滑鼠選取與鍵盤操作驗證正式頁。瀏覽器腳本位於系統暫存目錄，未加入專案，不產生圖片或 JSON 報告。

| 案例 | 結果 |
| --- | --- |
| 未選取按 R | 無旋轉、無歷史 |
| 非正方設備四向旋轉 | 角度循環正確，尺寸、埠與面板同步；原點不變，四筆歷史 |
| 改鍵及長按 | 改鍵生效，重複 keydown 僅一筆旋轉 |
| 文字輸入及設定面板 | 不誤觸旋轉 |
| 平移工具、設備拖曳及埠拉線期間 | 不誤觸旋轉 |
| 與設備重疊 | 旋轉成功、一筆歷史、conflicts 非空，無旋轉失敗提示；原生 Ctrl+Z 與既有 redo action 可還原／重做 |
| 與管線重疊 | 旋轉成功、一筆歷史、conflicts 非空，管線原位且無旋轉失敗提示 |
| 旋轉使埠斷線 | connections 更新，斷線圖示增加；Ctrl+Z 還原連線及圖示，管線座標不變 |
| 已選設備移除 | 不誤轉其他設備，不新增歷史 |

最終 **9 組通過，pageerror=0**。首次腳本使用 locator 點擊第一個 rect，遭同設備文字覆蓋而逾時；改為在設備格內用原生滑鼠座標點擊後，完整重跑通過，沒有因此修改產品程式。

E001 資料流檢查：MainLayout 呼叫的 useValidation 仍監聽 editorStore.nodes／edges，正式 LayoutView／GridCanvas 未消費 layoutStore.layoutIssues。故本次只確認 L1 產生重疊資料，不能宣稱正式頁已顯示 E001 警示；該接線不在本次修改範圍。斷線圖示獨立消費 layoutStore.connections，已實際驗證。

## 步驟 5：文件

PR 草稿將旋轉獨立成段，標記串接 #79，移除本 PR 新增 L1 action／契約測試的歸屬說明；補充重疊允許寫入及 E001 顯示限制。

舊驗證紀錄的旋轉部分標記為歷史版本 783a943，保留當時結果並連結本次驗證，避免把舊的重疊拒絕規則當作現行規則。

## 步驟 6：品質與交付

依 validate-changes skill 依序執行 pnpm format、pnpm lint、pnpm type-check、pnpm test，全數通過；**56 個測試檔、977 項測試成功**。未新增或修改 L1 契約測試。格式化未帶入額外程式差異。

最終 git diff --check 通過；相對 origin/master，layoutStore.ts、layoutStore.rotation.test.ts、GridCanvas.stories.ts 與 WarningIcon 本體均沒有差異。文件相對連結檢查通過。暫時瀏覽器腳本已刪除，未留下圖片或 JSON 報告。

本次尚未提交或推送；rebase 已改寫本機提交，遠端仍為 db0c7f8，後續若要更新原遠端分支需取得 force-with-lease 授權。
