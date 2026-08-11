# 待實作：removeConnection MVP（刪除單一管線）

**狀態：** 規劃中，尚未動工（等 harry 對這份計畫拍板，或轉交 L1 review 後再開工）
**對應：** `MILESTONE_0726.md` 五項缺口中的第二項，`removeConnection`
**前置：** `addConnection` MVP 已完成（見 `PLAN_addConnection.md`），現在畫布上已能畫出真實管線，`removeConnection` 才有東西可刪
**相關檔案：**

- `src/store/selectionStore.ts`（**L1**，需擴充）
- `src/composables/useShortcuts.ts`（L2）
- `src/editor/canvas/FactoryCanvas.vue`（L2）
- `src/store/editorStore.ts`（`removeConnection` action，已存在且有測試，未變更，僅呼叫）

---

## 1. 現況核對

`editorStore.removeConnection(uid)` 已存在（`editorStore.ts:597`）且有單元測試（`editorStore.test.ts:422`），但**沒有任何 UI 路徑會呼叫它**：

- `useShortcuts.ts` 的 Delete 鍵只讀 `selectionStore.selectedNodeIds`，呼叫 `editorStore.removeDevices()`，完全不知道有管線這回事
- `selectionStore.ts` 只有 `selectedNodeIds` 一個欄位，Vue Flow 的 edge 點選事件目前根本沒被監聽

這跟 MILESTONE 文件 §2 表格與 §3 的判斷一致：這項卡在 **L1 缺一個「目前選取的管線 uid」狀態**，L2 不該自己在 `FactoryCanvas.vue` 開 local ref 繞過去。

## 2. 建議方案：直接擴充 selectionStore（不另開 pipelineSelectionStore）

對應 MILESTONE §5 問題 2 的答案 —— 選取本質上是同一件事（畫布上「目前選中的東西」），沒有理由拆兩個 store，之後任何「選取中有沒有東西」的 UI 判斷都要同時查兩個 store，容易漏掉。

### `selectionStore.ts` 擴充內容（需 L1 過目 / 動手）

- 新增 `selectedEdgeIds: ref<string[]>([])`
- 新增 `hasEdgeSelection` computed
- `setSelection` 是否要改簽名同時接 nodes/edges，或另外新增 `setEdgeSelection(ids: string[])` 一個獨立函式——傾向後者，因為 Vue Flow 的 `selection-change` 事件本來就分別給 `nodes` 和 `edges` 兩個陣列，維持職責單純
- `clearSelection()` 要不要一併清 edge 選取——傾向一併清（畫布上「清空選取」應該是使用者唯一的心智模型），除非 L1 認為兩者該分開清

## 3. L2 這邊要接的東西（等 L1 補完再動工）

- `FactoryCanvas.vue`：`handleSelectionChange` 目前只取 `selection.nodes`，改為同時讀 `selection.edges`，寫入 `selectionStore.setEdgeSelection()`
- `useShortcuts.ts`：Delete 鍵邏輯除了現有的 `removeDevices()`，加一段讀 `selectionStore.selectedEdgeIds`，逐一呼叫 `editorStore.removeConnection(uid)`（`removeConnection` 一次只收一個 uid，沒有批次版本，需要 loop）
- 刪除後同樣呼叫 `selectionStore.clearSelection()`（若上面決定一併清）

## 4. 明確不在本次範圍內

- edge 上的獨立刪除按鈕／icon（MILESTONE 原文提了兩種觸發方式，Delete 鍵覆蓋率已足夠，圖示屬於加分項，留給 L3 有空再做）
- 節點與管線同時選取時的刪除順序 / 是否要分開兩次歷史紀錄——目前 `removeDevices` 與 `removeConnection` 各自是獨立 Command，混合選取時會產生多筆歷史記錄而非一筆 macro，MVP 先接受這個行為，之後有需要再跟 L1 討論要不要包成 macro
- `editorStore.removeConnection` 加批次版本——目前用 loop 呼叫就能動，除非效能有問題否則不動 L1 的 action 簽名

## 5. 待確認

- `selectedEdgeIds` 的擴充要不要由 harry 自己先寫個草案交給 L1 review，還是完全交給 L1 定義後再等通知——**這點需要使用者決定**，尚未拍板