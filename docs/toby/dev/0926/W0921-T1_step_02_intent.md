# 步驟 02：建立意圖層並接工具列

## 目標

讓真機器卡片的 id 能由畫布側讀到，且不把 UI 暫態放入 `editorStore` 或 `layoutStore`。

## 修改檔案

- 新增 `src/editor/toolbar/usePlacementIntent.ts`。
- 修改 `src/editor/toolbar/ToolbarPanel.vue` 的 `<script>`，保留 template／style 原樣。

## 實作要點

1. 模組層建立 `ref<string | null>`，由 composable 暴露唯讀 `armedMachineId`、`arm(machineId)` 與 `disarm()`；不 import Pinia store。
2. `handleRealMachineClick` 移除 console 輸出，呼叫 `arm(row.id)`；保留真機器列表由 `listToolbarMachines` 供應。
3. 同機再點取消時同步清除本地高亮；切換真機器分類或點舊五顆按鈕時，清高亮並呼叫 `disarm()`。這是使用者已裁定的狀態同步；不修改 template／style。
4. Esc 維持既有快捷鍵行為，不在本 composable 或工具列加 Esc 取消監聽。
5. 為新增變數與函式撰寫符合專案規範的繁體中文 JSDoc；註解須反映實際「連續落子後保持武裝」行為。

## 驗收條件

- 工具列點真機器後，另一個呼叫 `usePlacementIntent()` 的元件讀得到相同 id。
- 舊五顆按鈕與真機器列表仍可操作；工具列 diff 只在 script。
- 本步不修改 `layoutStore`、畫布或 A0 預檢。

## 下一步

進入 [步驟 03](./W0921-T1_step_03_placement.md)。

## 執行結果（2026-09-26）

已完成兩個檔案的修改。工具列 diff 僅涉及 `<script>`；意圖 composable 不 import store。`pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test` 皆通過，現有測試共 43 個檔案、827 項。Vite 載入檢查確認兩個呼叫端讀到同一份 id、再次選同機會解除、`disarm()` 會清空。首頁實際點擊落子仍屬步驟 03／04，尚未驗收。
