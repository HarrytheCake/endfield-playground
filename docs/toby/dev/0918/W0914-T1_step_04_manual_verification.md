# 步驟 4：手動驗收主畫面

## 目標

使用正式 `pnpm dev` 首頁驗證新畫布接線，而不是以 Storybook 或 dev 頁取代主畫面驗收。

## 操作方式

1. 執行 `pnpm dev`。
2. 開啟 Vite 顯示的首頁網址。
3. 確認中間 `area-canvas` 顯示：
   - SVG 格線。
   - `connected` 場景的兩台設備。
   - 一條 belt 管線。
4. 確認 Navbar、左側選單、下方 Toolbar、StatsPanel 與 Inspector 仍可正常渲染。
5. 重新進入首頁或重新掛載畫面，確認已有資料不會被覆寫或重複加入。
6. 觸發一次 undo，記錄初始 snapshot 是否被清空；只記錄現況，不在本工單修改 store。

## 邊界案例

- layoutStore 已有設備時，初始化不得載入 fixture 覆寫它們。
- 畫布資料為空時，應於 mounted 後載入一次初始場景。
- 固定尺寸畫布即使沒有平移縮放也算通過。
- Toolbar 操作未反映到新畫布時，記為新舊 store 並存的已知過渡狀態，不擴大修正。

## 靜態檢查

執行：

```bash
grep -n "store\|vue-flow" src/editor/layout/GridCanvas.vue
git diff --stat
git diff -- src/editor/canvas/FactoryCanvas.vue \
    src/editor/layout/useGridViewport.ts \
    src/editor/toolbar/ToolbarPanel.vue \
    src/editor/inspector \
    src/components/StatsPanel
```

第一個指令應無輸出；禁止檔案的 diff 也應為空。

## 驗收條件

- 驗收現場為正式首頁。
- 格線、設備與管線均可見。
- 沒有新增擺放、選取、拖曳或切換器。
- 已記錄初始 snapshot 的 undo 行為與新舊 store 過渡限制。
- 禁止檔案沒有變更。

## 下一步

手動驗收完成後，進入「步驟 5：品質檢查與交付」。
