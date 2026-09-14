# 步驟 1：確認範圍與基準

## 目標

在修改程式碼前確認工單的新標的、目前分支、工作區狀態與既有依賴，避免誤做已作廢的
footprint 渲染任務。

## 唯讀檢查

1. 確認目前位於預定工作分支。
2. 執行 `git status --short --branch`，記錄既有變更並避免覆蓋。
3. 閱讀以下檔案：
   - `docs/work_dispatch/toby/W0823-T1_placement_footprint_size.md`
   - `src/editor/inspector/InspectorPanel.vue`
   - `src/store/selectionStore.ts`
   - `src/data/machines.ts` 中的 `getMachine()`
4. 確認 `InspectorPanel.vue` 現有的地圖尺寸、snap-to-grid 與產能資訊不可移除。
5. 確認本次新增功能不呼叫任何 store mutation。

## 範圍判定

本步驟確認的正式需求是：

- 單選設備時顯示名稱、佔格與耗電。
- 空選或多選時顯示空狀態。
- 僅修改 `InspectorPanel.vue`。

以下內容不在本切片：

- 單擊選取事件修正。
- 新放置設備 `machineType` 契約修正。
- 配方、環境、效率或管線資訊。
- 多選彙總。
- 旋轉後的完整 B4 尺寸攤平契約。
- 拆分 L2／L3 元件。

## 驗收條件

- 已記錄目前分支與既有工作區變更。
- 已確認唯一程式修改目標。
- 已區分 Inspector 小切片與完整 R-B4。
- 未修改任何檔案。

## 下一步

確認範圍後，才進入「步驟 2：建立唯讀資料接線」。
