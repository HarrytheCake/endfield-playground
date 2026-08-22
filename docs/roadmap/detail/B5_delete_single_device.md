# R-B5 — 刪除單台

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §4 |
| 里程碑 | M2（2026-09-27） |
| 擋門檻 | 否（加分；但 9/27 門檻句含「能刪單台」，故最遲 9/27） |
| 建議主責／備援 | toby／harry（暫定）／aaaaa |
| 性質 | 接線（L2） |
| 依賴 | [B2](./B2_placement_chain.md) |
| 狀態 | `[ ]` 未開始 |
| 最後更新 | 2026-08-22 |

---

## 1. 背景與動機

刪除是擺放月裡成本最低的一項：`removeDevices(uids)` 已在 `editorStore.ts:453` 就位並自動進歷史，`useShortcuts` 也已存在。本項存在的理由不是技術難度，而是**它是「放上去 → 改主意 → 拿掉」這個最小閉環的最後一塊**。沒有刪除，使用者第一次放錯就只能重整頁面，任何演示都會被這件事打斷。

同時，本項是 [B3](./B3_rotation_90.md) 的替代品：主編 9/20 的小目標寫「旋轉 90 度或刪單台，擇一演示穩定；另一項最晚 9/27」。兩者都由同一批 L2 人力承擔，工時緊時可依實際狀況二選一先做。

## 2. 使用者看得到什麼

選中一台設備按 Delete，設備消失；按 Undo，設備回來。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 刪除 action | `editorStore.removeDevices(uids)` | 已有，進歷史 |
| 連線刪除 | `editorStore.removeConnection(uid)` | 已有（本項不接，屬 10 月） |
| 快捷鍵 | `src/composables/useShortcuts.ts` | 已有 |
| 選取 | `src/store/selectionStore.ts` | 已有 |
| 歷史 | `src/store/historyStore.ts` | 已有，Undo／Redo 可用 |

## 4. 技術決策

### 4.1 範圍（凍結）

| 做 | 不做 |
|----|------|
| 選取單台 → Delete → 移除 | 框選多台一起刪 |
| Undo 還原 | 刪除確認對話框 |
| 刪除時一併移除該設備的連線 | 連線單獨刪除（10 月 [C1](./C1_port_hit_and_draft.md) 範圍） |

### 4.2 連線的連帶處理

刪除設備時，掛在它身上的連線必須一起消失，否則會留下懸空邊，讓 FlowEngine 建圖時出現指向不存在節點的 edge。

| 方案 | 作法 | 採用 |
|------|------|------|
| A. L2 先呼叫 `removeConnection` 再 `removeDevices` | 容器自己組兩步 | 否——兩個 Command 進歷史，Undo 要按兩次 |
| **B. `removeDevices` 內部處理連帶** | L1 一個 action 一個 Command | **是** |

若現況 `removeDevices` 尚未處理連帶，**由 aaaaa 在 L1 側補**，L2 不得自己串兩步。這是「缺 action 時回報維護者補上，不在 L2 自組 Command」規則的具體應用。

### 4.3 快捷鍵

沿用既有 `useShortcuts` 註冊機制，不新開一套鍵盤事件監聽。Delete 與 Backspace 皆綁定；輸入框有焦點時不觸發。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | `src/composables/useShortcuts.ts` | 註冊 Delete／Backspace → `removeDevices(selectedUids)` |
| 修改 | `src/editor/canvas/FactoryCanvas.vue` | 若需右鍵或按鈕入口 |
| 可能修改 | `src/store/editorStore.ts` | **僅 aaaaa**：`removeDevices` 補連帶移除連線 |
| 新建 | `src/__tests__/store/removeDevicesCascade.test.ts` | 連帶移除的斷言（若 §4.2 需補） |
| **不碰** | 框選、連線單獨刪除、確認對話框 | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 09/20 | Delete 刪單台可用（與 [B3](./B3_rotation_90.md) 擇一先做） |
| 09/27 | **門檻句：** 另一項補齊；Undo 可還原 |

## 7. 不做

- 不做框選多物刪除（明列於 11/29 前不做清單）
- 不做刪除確認 UI
- 不做刪除動畫
- 不做「刪除後自動選取鄰近設備」這類體驗優化

## 8. 依賴與封鎖

依賴 [B2](./B2_placement_chain.md)（要先放得上去）。若 §4.2 需要 L1 補連帶移除，則對 aaaaa 有一項小依賴，須在 9/13 前提出，避免卡到 9/20。

## 9. DoD

- [ ] 選中一台按 Delete，設備消失
- [ ] 該設備的連線一併消失，無懸空邊
- [ ] Undo 一次即完整還原（設備與連線同時回來）
- [ ] 輸入框有焦點時按 Delete 不會誤刪設備
- [ ] 全域搜尋確認容器內無直接 mutate `nodes`／`edges`
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 留下懸空邊，11 月建圖時才爆 | §4.2 由 L1 一個 action 處理；DoD 明列 |
| Undo 要按兩次（兩個 Command） | 同上；review 時確認歷史堆疊只多一筆 |
| 與 [B3](./B3_rotation_90.md) 搶同一份工時 | 9/20 擇一，9/27 補另一項；兩項皆為加分，不同時擋門檻 |

**未交頂替：** 9/27 門檻句雖含「能刪單台」，但若未交，可用 Undo 代替演示（放錯後 Undo 移除），門檻不失守；10 月起則須補上，因為連線月會頻繁需要刪掉試錯的設備。

## 11. 開發日誌

### 2026-08-22
- 建檔。連帶移除連線的處理位置明確歸 L1，避免 L2 自組兩步 Command
