# 步驟 1：確認範圍與依賴

## 目標

在修改程式碼前確認工作區、目標檔案與既有依賴，並鎖定 1C／2A 決策，避免為了
Storybook 可見性或命名規範擴大變更。

## 唯讀檢查

1. 執行 `git status --short --branch`，記錄目前分支與既有變更。
2. 確認下列目標檔案尚未存在；若已存在，先閱讀並保留既有內容：
   - `src/editor/layout/GridCanvas.vue`
   - `src/editor/layout/GridCanvas.stories.ts`
3. 閱讀並確認以下依賴：
   - `src/types/layout.ts`
   - `src/data/machines.ts` 的 `getMachineById()`
   - `src/data/mockLayout.ts`
   - `src/utils/layout/deviceOccupancy.ts`
   - `src/utils/layout/toFootprint.ts`
   - `src/app/dev/LayoutL1Preview.vue`
4. 確認 `getMachineById()` 可能回傳 `undefined`，實作時必須安全處理。
5. 確認 `.storybook/main.ts` 只收錄 `src/components/**/*.stories.ts`，但依 1C 不修改設定，
   也不把 Storybook 可見性列為驗收條件。

## 正式需求

- `GridCanvas.vue` 只接收 props 並渲染 SVG。
- props 包含 `devices`、`pipelines`、`cellSize`、`gridWidth`、`gridHeight`。
- 預設值為一格 28px、畫布 12×8 格。
- 顯示格線、設備佔格、設備標籤及管線折線。
- `GridCanvas.stories.ts` 提供 `Connected` 與 `Broken` 兩組 args。

## 不在本切片

- Store 模型與 Command Pattern。
- 管線連接狀態解析或分色。
- 點擊、拖曳、選取、平移、縮放。
- viewport composable。
- Vue Flow 舊畫布搬移或整合。
- Storybook 掃描路徑調整。

## 驗收條件

- 已記錄目前分支與既有工作區變更。
- 已確認兩個程式修改目標與既有依賴狀態。
- 已確認 1C／2A 決策不再於實作期間重新擴張。
- 尚未修改程式碼。

## 下一步

確認範圍後，進入「步驟 2：建立唯讀資料轉換」。
