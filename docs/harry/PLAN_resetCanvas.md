# 待實作：resetCanvas 暫時性觸發（Ctrl+R）

**狀態：** 實作中（本文件記錄本次變更範圍，供 harry / toby review 對照）
**對應：** `MILESTONE_0726.md` 五項缺口中的第五項，`resetCanvas`
**相關檔案：**

- `src/composables/useShortcuts.ts`（L2，本次唯一改動點）
- `src/store/editorStore.ts`（`resetCanvas` action，未變更，僅呼叫）

---

## 1. 範圍與限制（依使用者指示）

- 這次**只**做 `useShortcuts.ts` 裡的 `Ctrl+R` 快捷鍵綁定，**不**動 `Navbar.vue` / `ProjectSidebar.vue`，也**不**建任何 L3 按鈕元件
- 程式碼註解必須明確標示這是**暫時性**觸發，不是最終 UX（MILESTONE §4 已定案 `resetCanvas` 最終要有正式按鈕入口，由 L3 交付）
- 保留一個可重用的觸發函式（`triggerResetCanvas`），從 `useShortcuts.ts` export 出去；日後 L3 交出按鈕元件、L2（harry / toby）把它接到 `Navbar.vue` 或 `ProjectSidebar.vue` 時，直接 import 呼叫同一個函式即可，不必重寫確認邏輯

## 2. 發現的風險（需要記錄，非本次要解的問題）

1. **`editorStore.resetCanvas()` 目前沒有走 Command Pattern**——直接 mutate `nodes.value` / `edges.value`，不會進 `historyStore`，代表**按下去無法 Ctrl+Z 復原**。這是 L1 既有實作（原本標註「dev / 測試用」），本次不改 L1，只是照文件既有行為接上真實觸發
2. **`Ctrl+R` 在多數瀏覽器是「重新整理頁面」的原生快捷鍵**——用 `keydown` 監聽並呼叫 `event.preventDefault()` 通常能攔下，但仍記錄為已知風險，之後如果使用者反映衝突，需要換一顆鍵或改成非瀏覽器保留鍵位

## 3. 因風險 1 而加的暫時性安全網

由於本次操作**不可復原**，在呼叫 `editorStore.resetCanvas()` 前，先用瀏覽器原生 `window.confirm()` 做一次二次確認——這不是正式 UX（正式版本按 MILESTONE §5 問題 5 應該用 `UModal`），純粹是暫時性快捷鍵沒有配套 UI 時，避免誤觸清空整個畫布且無法復原的最低限度防呆。等 L3 交出正式按鈕、改用 `UModal` 確認框時，這段 `window.confirm()` 要一併移除。

## 4. 具體變更

`useShortcuts.ts`：

- 新增 `export function triggerResetCanvas()`：內部呼叫 `useEditorStore()`，跳 `window.confirm()`，確認後呼叫 `editorStore.resetCanvas()`
- 函式與 `useShortcuts()` 內的 watch 都要有 JSDoc 註明「暫時性快捷鍵，待 L3 正式按鈕與 UModal 確認框交付後移除」
- 在 `useShortcuts()` 內綁 `Ctrl+R`／`Cmd+R`（同 Undo/Redo 用 `useMagicKeys` computed 判斷），按下時呼叫 `triggerResetCanvas()`，並 `event.preventDefault()` 攔截瀏覽器原生重新整理（需改用原生 `keydown` 監聽而非 `useMagicKeys`，因為 `useMagicKeys` 不give 攔截 preventDefault 的機會，會被瀏覽器搶先重新整理）
- 更新檔案頂部的 JSDoc 快捷鍵清單，加入 Ctrl+R 並標註「暫時性」

## 5. 明確不在本次範圍內

- L3 按鈕元件本體
- 正式 `UModal` 確認框
- `editorStore.resetCanvas()` 改走 Command Pattern（進歷史）——如果要做需要跟 L1 討論，不在本次 L2 範圍

## 6. 驗證方式

- `pnpm type-check` / `lint-check` / `format-check` / `test`
- 手動測試：畫布上放置幾個節點後按 `Ctrl+R`，確認彈出瀏覽器 confirm、取消不清空、確認後畫布回到 mock 初始狀態，且瀏覽器沒有真的重新整理頁面