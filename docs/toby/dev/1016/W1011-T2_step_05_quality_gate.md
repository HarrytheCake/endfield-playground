# W1011-T2 步驟 05：品質門檻與交付證據

狀態：本地品質檢查及交付紀錄已完成（2026-10-16），使用者已指示將最終變更提交本機 Git；未 push 或建立 PR。以下保留各階段的驗證與調整紀錄。

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

## 執行證據

### 品質結果

已讀取並使用專案 [validate-changes](../../../dernoson/claude/skills/validate-changes/SKILL.md) 流程：格式修正 → lint 修正 → 型別 → 測試。為符合本工單避免全域自動修正的限制，前兩項只對本次四份程式檔執行，最後額外以全專案只讀檢查確認。

| 指令 | 結果 |
| --- | --- |
| pnpm exec prettier --write（本次四份程式檔） | 通過 |
| pnpm exec eslint --fix（本次四份程式檔） | 通過 |
| pnpm type-check | 通過 |
| pnpm test | 49 份測試檔、912 案全部通過 |
| pnpm format-check | 全專案通過 |
| pnpm lint-check | 全專案通過 |
| pnpm build | 正式建置通過 |
| pnpm build-storybook | 靜態建置通過 |
| 獨立 Chromium 瀏覽器驗收 | 曾完成 29／29 案，非 Vitest 計數的一部分；腳本後續依使用者要求移除 |
| Storybook 實際檢查 | 九個 Story、Controls JSON 更新與清空預覽、Accessibility 均通過 |
| git diff --check／文件相對連結／禁止檔案比對 | 通過；最後交付前再核對 |

Storybook 開發伺服器曾提示無法寫入使用者目錄的全域 settings／runtime registry，但成功啟動並完成所有畫面驗收。建置保留既有 Index 元件命名衝突、Browserslist 資料過期、chunk size／plugin timing 提示，未擴大修改處理；兩項建置均 exit 0。

### 最終變更

| 檔案 | 結果 |
| --- | --- |
| src/editor/layout/LayoutView.vue | 指標命中、手勢分流、local ref 預覽、單次移位提交、select-device、取消與 click 抑制、預覽出界映射 |
| src/editor/layout/GridCanvas.vue | 唯讀預覽 prop、設備與標籤位置同步、淺藍拿起狀態與操作說明 |
| src/editor/layout/GridCanvas.stories.ts | 三個新預覽／空值／未知 ID Story，保留原六個 Story |
| src/__tests__/editor/LayoutView.browser.mjs | 曾用於正式頁互動驗收，後續依使用者要求移除；結果保留為歷史紀錄 |
| docs/toby/dev/1016/W1011-T2*.md／兩張 png | 本工單分析、五步紀錄及亮／暗預覽證據 |

禁止檔案 layoutStore、placementCheck、editorStore、MainLayout、全域快捷鍵、Storybook preview 設定、package.json 與 lockfile 均未修改。未掛入 shapes，未增加 selection store、管線跟隨或邊界拒絕規則。

### 操作與交接

正式頁一般左鍵按住設備，移動至少 4 CSS px 後顯示淺藍拿起預覽；使用者最新要求恢復 sky-300，外框維持原設定。到空位放開提交，重疊位置放開回原位。一般左鍵拖空白、中鍵、平移工具或既有 Space 都可平移；工具列武裝後的空白點擊仍可連續落子。

- H2：LayoutView 提供 `select-device(id | null)`，僅一般未拖動左鍵點擊發出；id 為 PlacedDevice.id，MainLayout local ref 的接收與面板顯示仍由 H2 處理。
- C1：可在明確平移之後、設備命中之前加入埠分支；hitTestPortAt 使用連續格座標，本次未預先接拉線。
- 出界：既有 action 允許框外移位且 UI 顯示 Error；週派工文字差異已保留，若改為拒絕須由需求／L1 處理。
- 實體裝置／完整無障礙人工驗收未執行，詳見步驟 04；本次不宣稱已完成 H2 整合或所有裝置驗收。
- 本輪完成本地實作及驗證；Git commit、push 與 PR 均未執行，工單「開 PR」仍待後續明確指示。

### 使用者參考色調整後複驗

參考圖取主要像素色 #4D7991；只替換拿起填色，外框 class、2.5 粗細與 4 2 虛線均未變。補上集中色票與全域 import，既有瀏覽器測試改以實際 RGB(77,121,145) 驗證，亮暗截圖已更新並檢視。

調色後重新執行 scoped format／lint 修正、type-check、912 案 Vitest、29 案 Chromium、全專案 format-check／lint-check、正式及 Storybook 建置，全部通過。assets 預設被 Prettier 忽略，新增 tokens.css 另以 `--ignore-path .gitignore` 明確格式化。此輪未重新執行九個 Story 的 axe 掃描；前述九個 Story／Controls／Accessibility 結果為調色前紀錄。

### 恢復先前顏色

使用者之後要求變回先前顏色，已恢復 sky-300，移除參考色 tokens.css 及其全域 import。外框、標籤與拖曳行為不變；既有瀏覽器色彩斷言與亮暗模式證據同步恢復。以上參考色複驗保留為歷史紀錄，不代表目前色值。

恢復後 scoped format／lint、type-check、全專案 format-check／lint-check、912 案 Vitest 與 29 案 Chromium 全部通過；git diff --check 通過，src/style.css 已無相對基準變更。此次未重跑建置或 Storybook axe 掃描。

### 保留原本外框

使用者再次明確指定保留原本外框，已移除拖曳時新增的 2.5 加粗與 4 2 虛線。最終拖曳外框與未拖曳時同為 1.5 實線，沿用既有正常／出界配色，填色仍為 sky-300。瀏覽器回歸新增對原外框顏色的比較，並同步更新粗細與實線斷言。

複驗通過：scoped format／lint、type-check、全專案 format-check／lint-check、912 案 Vitest 與 29 案 Chromium。瀏覽器測試補上等待預覽 DOM 出現，避免讀到前一個渲染狀態；亮暗截圖已更新。本輪未重跑建置或 Storybook axe 掃描。

### 移除獨立瀏覽器腳本

依使用者後續要求刪除 `src/__tests__/editor/LayoutView.browser.mjs`，同步移除文件中的有效連結與執行指令。先前的 29 案 Chromium 結果及截圖保留為歷史證據；產品程式、套件設定與既有 Vitest 測試不變。

移除後 format-check、lint-check、type-check 全部通過，Vitest 仍為 49 份測試檔、912 案通過；未重新執行已刪除的瀏覽器腳本。
