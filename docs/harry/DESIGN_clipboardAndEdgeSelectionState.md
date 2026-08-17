# 設計筆記：clipboard store 資料模型 與 管線選取狀態

**狀態：** 設計討論，尚未實作
**對應：** `MILESTONE_0726.md` §5 問題 2（`selectedEdgeIds` 要不要擴充現有欄位）與問題 3（clipboard 資料模型）
**相關檔案（未來實作時）：** `src/store/selectionStore.ts`、`src/store/clipboardStore.ts`（新增）

---

## 1. 管線選取狀態（selectionStore 的 edge 部分）

**不需要獨立的狀態名 / enum**，用陣列的存在與否天然表達狀態就夠了，硬做一個 `status: 'none' | 'selected'` 反而是多餘的一層。實際狀態數要看要不要區分「單選 / 多選」：

| 狀態 | 判斷方式 | 說明 |
|------|----------|------|
| 無管線選取 | `selectedEdgeIds.length === 0` | 預設狀態 |
| 已選取 | `selectedEdgeIds.length > 0` | 不特別區分單 / 多選——`removeConnection` 一次一個要 loop 呼叫，衝突判斷這類邏輯也不需要知道是不是恰好一條，沒必要像 `selectedNodeIds` 那樣另外做 `isMultiSelect` |

但因為 `selectedNodeIds` 和 `selectedEdgeIds` 是**兩個獨立陣列、可以同時有值**（框選同時圈到節點跟管線），真正影響下游行為（尤其是複製）的是兩者的**組合狀態**：

|              | edges 空 | edges 非空 |
|--------------|----------|------------|
| **nodes 空**   | empty      | edgesOnly    |
| **nodes 非空** | nodesOnly  | mixed        |

這 4 種組合不需要真的定義成 4 個具名狀態變數，用 `hasSelection`（nodes）、`hasEdgeSelection`（edges）兩個既有 computed 組合判斷即可。真正需要在意這張表的地方只有**複製**：只有 `nodesOnly` 和 `mixed` 有東西可複製（複製的主體是節點，管線只是附屬——沒有節點就沒有貼上的意義），`edgesOnly` 時 Ctrl+C 應該是 no-op。

### 轉換路徑（誰會寫入這兩個陣列）

```
[pane-click / Esc]              → empty（清空兩者）
[box-select 拖曳]                → 依 Vue Flow 回傳的 nodes/edges 覆寫，可能落在任一格
[單點點擊節點]                    → 走 inspectedDeviceUid，不動 selectedNodeIds／Edge
[Delete 執行完]                   → empty（清空兩者）
[右鍵點管線開選單]                 → 不建議連動改 selectedEdgeIds
```

最後一條是需要留意的設計決策：**右鍵選單的目標管線**跟**「被選取」的管線**建議當成兩個獨立概念，不要共用同一個欄位。理由：右鍵可以在「什麼都沒選」的狀態下直接對單一管線操作（像大多數編輯器右鍵不要求先左鍵選取），如果硬要共用 `selectedEdgeIds`，會變成「右鍵一條管線」意外把使用者原本框選的一批東西選取狀態洗掉，兩個操作互相污染。所以右鍵選單的目標 id 應該留在觸發它的 L2 容器本地（一個 local ref 存「這次選單指向哪條 uid」），不進 store。

---

## 2. Clipboard Store 資料模型

同樣道理：**不需要獨立的 status 欄位**，兩個資料陣列的長度就是狀態本身。

```ts
copiedNodes: FactoryNode[]   // 快照，非即時參照
copiedEdges: FactoryEdge[]   // 快照，只含兩端都在 copiedNodes 內的管線
```

隱含的兩種狀態：

| 狀態 | 判斷方式 |
|------|----------|
| `empty`（尚未複製過 / 已清空） | `copiedNodes.length === 0` |
| `holding`（剪貼簿有內容） | `copiedNodes.length > 0` |

### 轉換路徑

```
empty   ──copy(有選取)──▶ holding
holding ──copy(新的選取)──▶ holding   （直接整批覆寫，不是疊加）
holding ──paste──▶ holding            （貼上「不」清空，可連續貼多次——
                                          這是多數編輯器的慣例，使用者常會連按
                                          Ctrl+V 貼好幾份）
holding ──clear()──▶ empty            （目前沒有觸發點會主動呼叫，先留著給
                                          之後「重置畫布」之類操作決定要不要連動）
empty   ──copy(空選取)──▶ empty       （no-op，不應該把 holding 洗成兩個空陣列）
```

跟選取狀態的耦合點只有一個方向：`copy()` 讀取當下的 `selectedNodeIds` / `selectedEdgeIds` 產生快照，之後兩者就沒關係了——複製完之後即使使用者改變選取甚至刪除原本的設備，剪貼簿內容都不受影響（因為存的是深拷貝快照，不是 id 參照）。這點很重要：如果 clipboardStore 存的是 id 而不是資料快照，原設備被刪除後 Ctrl+V 會找不到來源，行為會很詭異。

### 待確認

- **`paste()` 之後要不要自動 `clear()`（變成「剪下貼上」語意）？** 建議不要，維持「複製貼上」語意（貼上不清空）。如果之後要做「剪下」（Ctrl+X），那是一個新動作：`cut()` = `copy()` + `editorStore.removeDevices()`，不影響這裡的狀態機
- **clipboardStore 要不要放「是否正在複製中」這種暫時性 UI 狀態**（例如貼上按鈕的 loading）？目前 `pasteSelection` 是同步呼叫，不需要 loading 狀態，暫不加——若之後貼上流程變複雜（例如要跳確認框問位移距離），才需要多一個 `pasting: boolean` 這種暫態欄位
