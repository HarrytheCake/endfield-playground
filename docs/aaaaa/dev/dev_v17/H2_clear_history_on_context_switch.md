# V17-H2 — 切換正式／dev 情境時清空 history（#58）

**對應工項：** V17-H2
**狀態：** `[ ]` 未開始
**日期：** 2026-10-18
**依賴：** [H1](./H1_stop_auto_demo_snapshot.md)（建議先做或同 PR；可並行）
**正式依據：** [#58](https://github.com/dernoson/endfield-playground/issues/58)
**開發分支：** `dev/aaaaa1018-58`（同 H1）

---

## 1. 背景

`/dev/*` 與正式頁 `/` 共用同一個 Pinia → 共用同一份 `historyStore`。  
在 A 頁 `execute` 的 Command，切到 B 頁後 Ctrl+Z 仍會 undo 到 A 頁操作。

會寫入 history 的 dev 頁（issue 列舉）：

- `HistoryReplay.vue`
- `LayoutStorePreview.vue`（**獨立 HTML** `dev/layout-store-preview.html`，不一定走 `src/router`）
- `PaperFigMainField.vue`

`historyStore` **已有** `clear()`（清空 undo／redo 堆疊）。

---

## 2. 技術決策（暫定｜實作前可微調）

| 決定 | 說明 |
|------|------|
| 策略 | **切換情境時 `historyStore.clear()`**（issue 初步方向）；不做兩套 Pinia／雙 historyStore |
| Router 邊界 | `/`（正式）↔ `/dev` 及子路（含 `/dev/paper-fig-main-field`）跨界 → `clear()` |
| 獨立 HTML 入口 | `layout-store-preview.html` 等：在**該頁 mount** 時 `clear()`；回到正式頁時於 `LayoutView`／App **mount 或路由進入 `/`** 再 `clear()` |
| 是否重置 layoutStore | **本版預設否**（只清歷史）。若 dev 殘留 devices 污染正式頁，另開議題／加決；勿與 #58 範圍膨脹綁死 |
| 同區內導航 | `/dev/a` → `/dev/b`：**不必**清（同屬 dev 情境） |

### 2.1 待決（不擋開工；實作時寫進 PR）

| ID | 題 | 預設 |
|----|-----|------|
| H-1 | 獨立 HTML 與 SPA 不同 document 時 Pinia 是否本來就分開？ | 實作時驗證；若已隔離則只處理 **router 內** `/`↔`/dev`；仍建議正式頁進場 clear 一次防 recents |
| H-2 | 進正式頁是否連 `layoutStore` 空載一併處理 | **否**（H1 已停自動 fixture；殘留資料另議） |

---

## 3. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | `src/router/index.ts` 或 App 級 `watch`／`afterEach` | 偵測跨「正式／dev」→ `useHistoryStore().clear()` |
| 可選 | `LayoutView.vue` | 進正式頁再 clear 一次（雙保險；與 H1 同檔注意 diff 說明） |
| 可選 | 各會寫 history 的 dev 頁 `onMounted` | 進 dev 情境 clear，避免帶著正式頁堆疊進來 |
| 測試 | 新建或擴充 history／router 測 | 跨界後 `undoDepth === 0`；同區導航不清空亦可測 |

---

## 4. 驗證標準

| # | 案例 | 預期 |
|---|------|------|
| 1 | 正式頁操作 → 進 `/dev/history-replay` → 回 `/` → Ctrl+Z | 不撤銷「僅在 dev 做的」Command；理想＝進正式時堆疊已空或僅含正式頁之後的操作 |
| 2 | `/dev/a` → `/dev/b` | 堆疊**可**保留（同情境） |
| 3 | 單元／整合 | 模擬 afterEach 跨界呼叫後 `canUndo === false` |

---

## 5. DoD

- [ ] 跨正式↔dev（router）會 `clear()`
- [ ] 獨立 HTML 入口有對應策略（驗證後寫進 H3／PR）
- [ ] 有測試或 H3 手動腳本可復驗
- [ ] 未引入第二份 Pinia；未改 Command 協定

---

## 6. 開發日誌

### 2026-10-18

- 建檔；策略＝clear on context switch；layoutStore 重置非本版預設
