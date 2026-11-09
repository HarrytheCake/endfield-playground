# PR Description 草稿：正式頁源素材選擇（W1026-H1／C5 左面板 L2）

以下內容可直接複製進 GitHub PR 描述欄。

---

## Summary

- 在正式頁選中**源設備**時，左側 `MachineCard` 下方出現「產出素材」下拉。選了材料就呼叫 `layoutStore.setDevicePrimaryOutput(uid, 材料名)`；選「無」就傳 `null`
- 只呼叫既有高階 action，不直接改 `device`，也不改 action 簽名。速率省略，沿用預設 30／min
- **非源設備不顯示下拉**。判斷依機器定義的 `is_source`，涵蓋基礎材料輸出點、物品輸出口、倉庫取貨口三種，與引擎判斷一致
- 選項**依輸出埠媒質過濾**：belt 只列固體，pipe 只列液體與氣體，避免選了之後被引擎判為媒質不符

## 已知限制：正式頁只選得到固體

正式頁放下設備時（`LayoutView` 的 `addDevice`）不會帶 `machineMode`，`layoutStore` 也沒有切換型態的 action。因此正式頁上的基礎材料輸出點固定是 `modes[0]`＝`solid_belt`，下拉只會列出 10 種固體。液體和氣體（清水、沉積酸、惰氣、息壤氣）要等之後有切換型態的入口才選得到。這點已回報 aaaaa，本 PR 不新增 action。過濾函式已支援 `fluid_pipe`，並有單元測試覆蓋。

## 變更檔案

| 檔案 | 變更 |
|------|------|
| `src/editor/sourceOutput/SourceOutputPanel.vue` | **新建**。L2 控制元件，接收 `device` prop；用 Nuxt UI `USelect`，「無」用哨兵值 `__none__`（reka-ui 的 SelectItem 不接受空字串）；值直接從 store 讀，Ctrl+Z 後下拉會跟著回退 |
| `src/editor/sourceOutput/sourceMaterialOptions.ts` | **新建**。純函式，依機器定義＋型態，以 `getMachinePortMedia`／`getMaterialPortMedia` 過濾 `getAllMaterials()`。非源設備回傳 `[]`；查不到埠媒質時不過濾 |
| `src/__tests__/editor/sourceMaterialOptions.test.ts` | **新建**。涵蓋非源設備、預設 belt、`fluid_pipe`、其他源設備 |
| `src/app/layouts/MainLayout.vue` | 抽出 `selectedDevice` computed（`selectedMachineCard` 改從它取值）；左槽 `MachineCard` 下方掛 `SourceOutputPanel` |

未改：`LayoutView`／`GridCanvas`（#78 鎖）、`shapes/*`、`src/app/MachineCard/*`、`layoutStore`、右側 StatsPanel、WarningIcon／Storybook。

## 範圍外

- 速率輸入框、多產出、在畫布上畫產出圖示（工單排除）
- 切換 `machineMode` 的 action 與 UI（見上方已知限制）
- 右側產耗數字（D1）
- 下拉的視覺對稿：目前是 Nuxt UI 預設樣式，放在深色條內。若要對稿屬 L3

## 驗證

- `pnpm type-check`／`pnpm lint-check`／`pnpm format-check`／`pnpm test`：全過（57 個測試檔、981 個測試）
- 用 Edge 在 `pnpm dev` 實測（1920×1080）：
  - 放置基礎材料輸出點並點選 → 出現下拉，選項為「無」＋10 種固體
  - 選「源礦」→ store 中 `primaryOutput: '源礦'`、`sourceRatePerMin: 30`，歷史紀錄多一筆「設定源產出」
  - Ctrl+Z → `primaryOutput` 清除，下拉回到「無」；Ctrl+Y → 恢復（焦點不在輸入框時）
  - 選「無」→ `primaryOutput`／`sourceRatePerMin` 都被移除
  - 點粉碎機（非源設備）→ 不出現下拉
  - console 無錯誤

## 已知風險

- `MachineCard` 已有 686px 高，再加下拉後，畫面較矮時左槽會更早出現捲動；工具列遮住卡片下緣的既有問題也會更明顯（待 paper 決定誰在上層）
- 對已經是「無」的設備再選一次「無」，仍會寫入一筆歷史（action 本身不判斷值有沒有變），影響很小
- 實測時發現一個**既有問題，與本 PR 無關**（原始 master 上也能重現）：undo／redo 快捷鍵沒有 `preventDefault`，Ctrl+Z 會同時觸發瀏覽器原生文字復原，把焦點拉進工具列搜尋框，之後 Ctrl+Y 會被當成打字而略過。另案處理

## 對應文件

| 文件 | 連結 |
|------|------|
| 工單 | [W1026-H1_c5_source_form.md](../work_dispatch/harry/1026/W1026-H1_c5_source_form.md) |
| 週總表 | [WEEK_20261026.md](../work_dispatch/WEEK_20261026.md) v1.1 |
| roadmap | [C5_source_primary_output.md](../roadmap/detail/C5_source_primary_output.md) |
| 計畫 | [PLAN_c5SourceForm.md](PLAN_c5SourceForm.md) |
| 依賴 PR | #72 `setDevicePrimaryOutput`、#74 引擎讀、#75 `MachineCard` 掛載 |

🤖 Generated with [Claude Code](https://claude.com/claude-code)
