# PR Description 草稿：三項 editorStore 高階 action 補觸發入口

對應 `docs/harry/MILESTONE_0726.md` 五項缺口中的三項。以下內容可直接複製進 GitHub PR 描述欄，或依 review 需要拆成多支 PR。

---

## Summary

- 新增畫布拖曳連線功能，`editorStore.addConnection()` 終於有真實 UI 觸發（詳見 [PLAN_addConnection.md](PLAN_addConnection.md)）
- 補上管線刪除的兩種觸發方式（選取 + Delete 鍵、右鍵選單），`editorStore.removeConnection()` 終於有真實 UI 觸發（詳見 [PLAN_removeConnection.md](PLAN_removeConnection.md)）
- 新增 `Ctrl+R` 暫時性快捷鍵觸發 `editorStore.resetCanvas()`，明確標註待 L3 正式按鈕 + `UModal` 確認框交付後移除（詳見 [PLAN_resetCanvas.md](PLAN_resetCanvas.md)）

## 1. addConnection（畫管線）

**變更檔案：** `src/editor/canvas/FlowNodeOverlay.vue`、`src/editor/canvas/FactoryCanvas.vue`

- `FlowNodeOverlay.vue`：節點依 `machine.modes[].input_ports` / `output_ports` 動態產生對應數量的 Vue Flow `Handle`，id 命名為 `in-{索引}` / `out-{索引}`，與 `useFlowEngine.ts` 既有的 handle id 解析格式對齊。這是本次調查發現的前置阻塞——原本每個節點只有左右各一顆沒有 id 的 Handle，多埠機器（如粉碎機兩個輸入）永遠只能連到埠 0，且不會擋下 belt/pipe 誤接
- `FactoryCanvas.vue`：`VueFlow` 新增 `@connect` 監聽，`handleConnect()` 依來源節點機型與出發 handle 解析出埠媒質，組出 `FactoryEdge` 後呼叫 `editorStore.addConnection()`（全程走 L1 高階 action，自動進歷史）

**範圍外：** port hover 高亮、拖曳中預覽線、手動彎折點、autoNode（分流/匯流/物流橋）

## 2. removeConnection（刪除管線）

**變更檔案：** `src/store/selectionStore.ts`（L1）、`src/composables/useShortcuts.ts`（L2）、`src/editor/canvas/FactoryCanvas.vue`（L2）

- `selectionStore.ts`：新增 `selectedEdgeIds` / `hasEdgeSelection` / `setEdgeSelection()`，`clearSelection()` 同步清空節點與管線選取
- `useShortcuts.ts`：Delete 鍵除了原有的 `removeDevices()`，新增逐一呼叫 `editorStore.removeConnection()` 刪除選取中的管線
- `FactoryCanvas.vue`：
  - `handleSelectionChange()` 同時讀取 Vue Flow `selection-change` 事件的 `edges`，寫入 `selectionStore.setEdgeSelection()`
  - 新增 `@edge-context-menu` 監聽，右鍵點擊管線時於游標位置開啟 `UDropdownMenu`（Nuxt UI 內建元件，未新增任何 L3 元件），選單提供「刪除管線」選項

**兩種觸發方式：**
1. 點選管線（或框選）→ 按 Delete
2. 滑鼠右鍵點擊管線 → 選單點「刪除管線」

**範圍外：** 節點與管線混合選取時的歷史記錄合併（目前各自產生獨立 Command）、`removeConnection` 批次版本

## 3. resetCanvas（重置畫布，暫時性觸發）

**變更檔案：** `src/composables/useShortcuts.ts`

- 新增 `export function triggerResetCanvas()`：跳原生 `window.confirm()` 二次確認後呼叫 `editorStore.resetCanvas()`
- `useShortcuts()` 內綁 `Ctrl+R` / `Cmd+R`（原生 `keydown` 監聽 + `preventDefault()`，避免與瀏覽器「重新整理頁面」衝突）

**已知風險（已在程式碼註解與 PLAN 文件記錄，非本次修復範圍）：**
- `editorStore.resetCanvas()` 目前未走 Command Pattern，操作**無法** Ctrl+Z 復原，因此暫時性快捷鍵加了 `window.confirm()` 防呆
- `Ctrl+R` 與部分瀏覽器原生重新整理鍵位衝突，已用 `preventDefault()` 攔截，但仍記錄為已知風險

**明確標註為暫時性：** 正式入口應為 L3 交付的按鈕（`Navbar.vue` 或 `ProjectSidebar.vue`）+ `UModal` 確認框；`triggerResetCanvas()` 已 export，屆時 L2 直接 import 呼叫即可，不必重寫確認邏輯，該按鈕上線後本鍵位應移除

## 驗證

```
pnpm type-check   # 通過
pnpm lint-check   # 通過
pnpm format-check # 通過
pnpm test         # 27 個測試檔、289 個測試全通過
```

手動測試待補：畫布上連線、多埠機器分埠連線、Delete 鍵刪管線、右鍵選單刪管線、Ctrl+R 重置流程。

## 對應文件

| 功能 | 計畫文件 |
|------|----------|
| addConnection | [docs/harry/PLAN_addConnection.md](PLAN_addConnection.md) |
| removeConnection | [docs/harry/PLAN_removeConnection.md](PLAN_removeConnection.md) |
| resetCanvas（暫時性） | [docs/harry/PLAN_resetCanvas.md](PLAN_resetCanvas.md) |
| 原始缺口清單 | [docs/harry/MILESTONE_0726.md](MILESTONE_0726.md) |