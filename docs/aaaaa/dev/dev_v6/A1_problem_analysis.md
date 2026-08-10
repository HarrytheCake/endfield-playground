# V6-A1 — 問題與影響分析

**對應工項：** V6-A1  
**來源：** [MILESTONE_0726.md](../../MILESTONE_0726.md)  
**狀態：** 進行中（分析稿，供定案與實作引用）

---

## 1. 背景與動機

編輯器中放置、旋轉、刪除等操作已透過 L1 高階 action 進入 `historyStore`，唯獨**滑鼠拖曳移動設備**看起來成功，卻無法 Ctrl+Z。主編於 0726 milestone 將此列為待討論／待修項目。

V6 目標：在不違反 Command 歸屬規則的前提下，讓拖曳移動與其他核心操作一樣可復原。

---

## 2. 問題陳述

| 現象 | 說明 |
|------|------|
| 拖曳後 Ctrl+Z 無效 | undo stack 沒有對應 `MachineMovement` 紀錄 |
| `moveDevices` 未被呼叫 | L2 設計預期的唯一移動入口實際未接上拖曳路徑 |
| 與 `placeDevice` 同類但更難 | place 是「一次寫入」；拖曳是「過程中已被 Vue Flow 改完 position」 |

---

## 3. 根本原因

`FactoryCanvas.vue` 使用：

```vue
<VueFlow v-model:nodes="nodes" ... :nodes-draggable="true" />
```

`nodes` 來自 `storeToRefs(editorStore).nodes`。拖曳期間 Vue Flow **逐幀**寫入 `position`，store 與 history 皆不知情。

拖曳結束時畫面已是最終座標。若在 `@node-drag-stop` 再呼叫現行：

```typescript
moveDevices(uids, delta) // execute 內 applyDelta(+1)
```

會造成**位移套用兩次**。

現行 `moveDevices`（摘要）：

- 空 `uids` → 直接 return
- `historyStore.execute` 的 `execute` / `undo` 分別 `applyDelta(+1)` / `applyDelta(-1)`
- 假設呼叫當下 position 仍是「移動前」

拖曳路徑打破了這個假設。

---

## 4. 與既有設計的落差

`docs/dernoson/L2/toby.md` / `L2.md` 預期：

> L2 收集 uids + delta，呼叫一次 `moveDevices`；L1 包成單一歷史項目。

此預期假設 L2 **主動套用位移**。未考慮 `v-model` 已先套用。  
目前 Canvas **沒有** `@node-drag-*` handler —— 屬「互動未接線」，不是單純寫錯一行。

---

## 5. 影響範圍

| 面向 | 影響 |
|------|------|
| 使用者 | 拖曳是唯一「看似正常但無法 undo」的核心操作 |
| 多選 | `moveDevices` 已支援 `uids[]`；拖曳必須一次提交所有被拖節點 |
| CR-02 | 管線跟隨應未來掛在同一 L1 入口；本版只預留、不實作 |
| HistoryReplay | 直接呼叫 `moveDevices(delta)` 的測試鈕應保持可用 |
| FlowEngine | 拖曳中 position 連動已會觸發 watch 重算；undo 後亦然。本版不改 FlowEngine API |

### 牽涉檔案（估計）

| 檔案 | 角色 |
|------|------|
| `src/store/editorStore.ts` | L1：移動 API / Command |
| `src/editor/canvas/FactoryCanvas.vue` | L2：drag start/stop |
| `src/__tests__/store/editorStore.test.ts` | 單元測試 |
| `src/app/dev/HistoryReplay.vue` | 若簽名 breaking 需同步 |
| `docs/aaaaa/L1_API_REFERENCE.md` | API 文件 |
| `docs/dernoson/L2/*`（他人） | 需協調更新，aaaaa 不直接改 |

---

## 6. 方案比較（繼承 milestone）

| 方案 | 做法 | 優點 | 缺點 | 結論 |
|------|------|------|------|------|
| A | L2 自組「execute no-op」Command | 改動小 | 違反 Command 歸屬；繞過 `moveDevices`；未來管線跟隨吃不到 | 否決 |
| B | L1 支援「已套用」確認 | 符合分層；單一入口可擴充 | 需定 API 形狀；測資／文件要更新 | **建議採用** |
| C | 改單向 nodes + 本地拖曳視覺 | 資料流最乾淨 | 重寫拖曳／對齊／多選成本高 | 本版不做 |

---

## 7. 風險

1. **職責邊界**：`editorStore` 與 `FactoryCanvas` 分屬不同主責；若未授權，aaaaa 只能出文件與協調
2. **雙重位移回歸**：測試必須鎖住 commit 路徑不 `+delta` 兩次
3. **零位移拖曳**：按下後未移動就 stop —— 不應產生歷史項目
4. **多選拖曳 uid 集合**：應以 drag 實際移動的節點（或選取集合 ∩ 拖曳）為準，避免漏網或多餘
5. **redo 語意**：應用絕對座標快照或可重入的 delta，避免 redo 漂移

---

## 8. 驗證標準（本文件層級）

- [x] 根因與「為何不能直接呼叫現行 moveDevices」已寫清
- [x] 方案 A/B/C 取捨表完整
- [x] 非目標已列出
- [ ] 待 A2 定案後，本分析中的「建議」升級為「已採納」

---

## 9. 開發日誌

### 2026-08-01

- 依 `MILESTONE_0726.md` 建立分析稿
- 確認現行 `moveDevices` 僅支援 apply-delta 模式
- 確認 `FactoryCanvas` 僅有 `v-model:nodes`，無 drag handler
