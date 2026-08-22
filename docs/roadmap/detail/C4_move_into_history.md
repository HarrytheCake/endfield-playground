# R-C4 — 拖移進歷史

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §5 |
| 里程碑 | M3（2026-10-25） |
| 擋門檻 | 否（加分；主編標 Undo 為非本輪最高優先） |
| 建議主責／備援 | L2（toby／harry）／aaaaa |
| 性質 | 接線（L2） |
| 依賴 | [B2](./B2_placement_chain.md) |
| 狀態 | `[ ]` 未開始 |
| 最後更新 | 2026-08-22 |

---

## 1. 背景與動機

V6 已經把「拖曳移動進歷史堆疊」在 L1 側做完並解鎖：`moveDevices(uids, delta)` 負責過程中的位移，`commitDeviceMove(uids, before)` 負責結束時把整段移動包成一個 Command 進歷史。剩下的只是 L2 在拖曳結束時呼叫正確的 action，並在開始時記住 `before` 快照。

這一項的價值不在 Undo 本身（主編已標為非最高優先），而在**它是驗證 Command Pattern 有沒有被正確使用的試紙**。如果 L2 在拖曳過程中直接改座標，畫面會動、Undo 會壞，而且壞得不明顯——直到 11 月演示時按 Undo 才發現設備回到奇怪的位置。

## 2. 使用者看得到什麼

拖著設備移動，放開後停在新位置；按 Undo，設備回到拖曳前的位置（一次，不是一格一格退）。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 位移 | `editorStore.moveDevices(uids, delta)` | 已有（`editorStore.ts:320`） |
| 提交 | `editorStore.commitDeviceMove(uids, before)` | 已有（`editorStore.ts:361`） |
| 快照型別 | `DevicePositionSnapshot` | 已有 |
| 歷史 | `src/store/historyStore.ts` | 已有；V6 完成 |
| Dev 回放頁 | `src/app/dev/` HistoryReplay | 已有，可當驗證工具 |
| 快捷鍵 | `src/composables/useShortcuts.ts` | Undo／Redo 綁定可在此註冊 |

## 4. 技術決策

### 4.1 三段式契約（凍結）

| 時機 | 動作 |
|------|------|
| 拖曳開始 | 記下 `before`（所有被拖 uid 的當前座標快照），存 L2 local |
| 拖曳中 | 呼叫 `moveDevices(uids, delta)`；**不進歷史** |
| 拖曳結束 | 呼叫 `commitDeviceMove(uids, before)`；**一次進歷史** |

`before` 存 L2 local ref 而非 store，理由同 [C1](./C1_port_hit_and_draft.md) 的 draft：它是互動過程的暫存，不是藍圖狀態。

### 4.2 方案比較：拖曳中要不要即時更新 store

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 拖曳中只動 CSS transform，結束才寫 store | 效能最好 | FlowEngine 完全不被打擾 | 連線端點不會跟著動，視覺脫節 | 否 |
| **B. 拖曳中呼叫 `moveDevices`，結束才 commit** | V6 已為此設計 | 連線跟隨、狀態一致 | 拖曳中會觸發 FlowEngine watch | **是** |

採 B。FlowEngine 的重算已有 `useDebounceFn(150)` 保護，拖曳中的高頻更新不會造成問題；若實測有效能問題，再考慮拖曳期間暫停引擎，但**不改變契約**。

### 4.3 Undo 快捷鍵

`historyStore` 的 undo 早已存在，綁定 Ctrl+Z／Ctrl+Y 是順手的事，走既有 `useShortcuts`。主編把 Undo／Redo 標為藍圈（非本輪最高優先），因此本項**綁定即可，不做歷史面板、不做操作清單 UI**。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | `src/editor/canvas/FactoryCanvas.vue` | 拖曳三段式；`before` 存 local |
| 修改 | `src/composables/useShortcuts.ts` | Ctrl+Z／Ctrl+Y 綁定（若尚未綁） |
| 唯讀 | `src/store/editorStore.ts`、`src/store/historyStore.ts` | 只呼叫 |
| **不碰** | 歷史面板 UI、多選拖曳、對齊輔助線 | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 10/18 | 拖移進歷史；Undo 一次還原。**若工時不足**，明確在該日寫「本週只移不 Undo」並排進 10/25 |
| 10/25 | 補齊 Undo；連線端點跟隨正確 |

## 7. 不做

- 不做多選拖曳（框選不在 11/29 範圍）
- 不做對齊輔助線、磁吸到其他設備
- 不做歷史操作清單 UI
- 不做拖曳中的合法性檢查（重疊由 11 月警訊呈現）

## 8. 依賴與封鎖

依賴 [B2](./B2_placement_chain.md)。與 [C1](./C1_port_hit_and_draft.md) 共用 `FactoryCanvas.vue` 的 pointer 事件處理，**同一週不得由兩人同時改**，排程上 C1 優先（擋門檻），C4 排在其後。

## 9. DoD

- [ ] 拖曳設備可移動，放開後停在新位置
- [ ] Undo 一次完整還原到拖曳前位置（不是一格一格退）
- [ ] Redo 可再前進
- [ ] 拖曳中連線端點跟著動
- [ ] 全域搜尋確認容器內無直接改 node 座標、無 `historyStore.execute`
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 拖曳中直接改座標，Undo 壞掉且不明顯 | DoD 明確要求「Undo 一次還原」，用 dev HistoryReplay 頁驗證 |
| 與 [C1](./C1_port_hit_and_draft.md) 搶同一份 pointer 事件邏輯 | 排程分週；C1 先，C4 後 |
| 拖曳觸發引擎頻繁重算 | 既有 debounce 150ms 已足夠；實測有問題再議，不改契約 |

**未交頂替：** 10/25 門檻句寫「單台／單線可刪、可拖移（進 Undo 更好）」，因此**只移不 Undo 也算過門檻**。Undo 最遲補在 11 月，不得晚於 [D5](./D5_acceptance_rehearsal.md) 的 11/22 彩排——驗收劇本第 8 步含「Undo 加分」。

## 11. 開發日誌

### 2026-08-22
- 建檔。三段式契約直接沿用 V6 已完成的 L1 設計，本項純為 L2 接線
