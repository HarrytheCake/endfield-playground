# 待討論：五個 editorStore 高階 action 完全沒有 UI 觸發入口

**狀態：** 待與 harry / toby（L2）、L1、L3 對齊，尚未動工
**相關檔案：** `src/store/editorStore.ts`、`src/store/selectionStore.ts`、`src/editor/canvas/FactoryCanvas.vue`、`src/editor/canvas/PipelineEdge.vue`、`src/editor/inspector/InspectorPanel.vue`
**相關規則：** `CLAUDE.md` §1 三層架構、`docs/dernoson/L2/L2.md` §2（分工表）與 §4.7（Command 歸屬規則）

---

## 1. 問題是什麼

`editorStore` 定義的 8 個高階 action 裡，有 5 個在正式畫面（`/`）上**完全沒有任何觸發方式**——不是邏輯寫錯，是使用者操作路徑根本不存在：

| Action | 現況 |
|---|---|
| `addConnection(edge)` | 沒有任何互動可以「畫一條新管線」；目前畫布上的管線全部來自 `editorStore.ts` 裡的 mock 資料 |
| `removeConnection(uid)` | 沒有任何互動可以「刪除單一一條管線」 |
| `setRecipe(uid, recipeIndex)` | 沒有任何 UI 可以切換設備的配方 |
| `pasteSelection(nodes, edges, offset)` | 沒有 Ctrl+C / Ctrl+V，複製貼上完全未實作 |
| `resetCanvas()` | 沒有任何按鈕可以觸發，僅 dev 測試頁能間接呼叫 |

這跟先前處理過的 `placeDevice()` / `moveDevices()` 兩個問題不同：那兩個是「已經有互動，但繞過了 Command Pattern」；這五個是「連互動本身都還沒被設計出來」，屬於全新功能，不是修 bug。

---

## 2. 這是哪個層級的工作？

依 `CLAUDE.md` §1 與 `L2.md` §2 的分工表，「互動」（拖拉 / 快捷鍵 / 框選 / 連線繪製）明確屬於 **L2**。這五項功能欠缺的正是「使用者怎麼觸發這個 action」這一段，所以**發起與整合的主責在 L2**。

但每一項實際展開後，都會牽出 L1 或 L3 目前還沒交付的東西，不是 L2 能單獨關起門完成的：

| 功能 | L2 要做的事 | 額外牽涉的層級與原因 |
|---|---|---|
| **`addConnection`（連接管線）** | 監聽 Vue Flow 的 `@connect` 事件，組出 `FactoryEdge` 呼叫 `editorStore.addConnection()` | **L3**：`PipelineEdge.vue` 目前只負責畫已存在的線，沒有「拖曳中預覽線」「port hover 高亮」這類視覺回饋元件，需要 L3 新增對應元件並定義 props/emits |
| **`removeConnection`（刪除單一管線）** | 決定觸發方式（選取 edge 後按 Delete，或 edge 上加刪除按鈕/icon），呼叫 `editorStore.removeConnection()` | **L1**：`selectionStore.ts` 目前只追蹤節點選取（`selectedNodeIds`），沒有「目前選取的管線 uid」這個狀態，得先請 L1 擴充，不能讓 L2 自己在 `FactoryCanvas.vue` 裡另開一個 local ref 繞過 store |
| **`setRecipe`（切換配方）** | 在 `InspectorPanel.vue` 讀取目前選取的單一設備、把選單選擇結果 map 成 `editorStore.setRecipe()` 呼叫 | **L3**：配方下拉選單元件目前不存在，`InspectorPanel.vue` 現階段只有工廠尺寸與 snap-to-grid 兩個欄位，需要 L3 先產出這個 UI 元件 |
| **`pasteSelection`（複製貼上）** | 綁定 Ctrl+C / Ctrl+V 快捷鍵（`useShortcuts.ts`） | **L1 優先**：`docs/dernoson/L2/toby.md` 已註明「需要先有 clipboard store 概念」——存哪些節點/邊被複製、複製時要不要順便處理新舊 uid 對照——這是全新的狀態設計，必須先由 L1 定義好，L2 才有東西可以綁 |
| **`resetCanvas`（重置畫布）** | 按鈕點擊呼叫 `editorStore.resetCanvas()`，可能需要確認對話框避免誤觸 | **L3**：需要一顆按鈕元件（放在 `Navbar.vue` 或 `ProjectSidebar.vue`），目前完全沒有對應入口 |

---

## 3. 為什麼不能讓 L2 自己補完全部

`L2.md` §4.7「Command 歸屬規則」明講：L2 若發現某個互動沒有對應的 L1 high-level action，應該反映給 L1 補上，**而不是自己在 L2 組跨 store 邏輯**。`removeConnection` 需要的「管線選取狀態」與 `pasteSelection` 需要的「clipboard 狀態」都屬於**跨畫面重複使用、應該集中管理的 state**，如果讓 L2 自己在元件內部開 local state 湊合，會導致：

- 狀態沒辦法在多個元件間共用（例如右側面板要顯示「已複製 N 個節點」，但 clipboard 狀態只存在 `FactoryCanvas.vue` 內部就拿不到）
- 之後 L1 真的補上正式 store 時，L2 這邊等於要整段重寫，等於做兩次工

所以這兩項建議先由 L1 定義好狀態模型，L2 再接。`addConnection` / `setRecipe` / `resetCanvas` 則主要卡在**缺 L3 元件**，L2 要先跟 L3 對齊 props/emits 介面（依 `L2.md` §5 的規範）才能動工。

---

## 4. 結論與建議切法

- **L2（harry / toby）**：是這五項工作的主導者，負責發起、串接「觸發 → 呼叫 action」這條線
- **L3**：`addConnection`、`setRecipe`、`resetCanvas` 三項需要新的展示元件，L2 得先跟 L3 對齊介面才能動工
- **L1**：`removeConnection` 需要 `selectionStore` 補上管線選取狀態；`pasteSelection` 需要全新的 clipboard store 設計——這兩項應先回報給 L1，不建議 L2 自己動手繞過

建議不要一次性處理全部五項，拆成獨立任務逐一討論設計（尤其 clipboard store 的資料模型、管線選取狀態怎麼跟現有 `selectionStore` 整合），比較適合分開排優先序、分開開 PR。

---

## 5. 待討論的具體問題（下次對齊時要決定）

1. 五項裡優先序怎麼排？哪個對使用者最痛（例如「畫管線」大概率比「複製貼上」更急）
2. `selectionStore` 要不要直接擴充現有欄位（例如加 `selectedEdgeIds`），還是另開一個 `pipelineSelectionStore`？
3. clipboard store 的資料要不要跨 session 持久化（例如存 localStorage），還是純 in-memory、reload 就清空？
4. `setRecipe` 的配方選單 UI 要長怎樣（下拉選單／卡片選擇器），這會影響 L3 元件的 props 設計
5. `resetCanvas` 觸發後要不要先跳確認對話框？該用 Nuxt UI 的哪個元件（`UModal` / `UButton` + confirm）？
