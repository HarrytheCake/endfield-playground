# V17-H2 — 切換正式／dev 情境時清空 history（#58）

**對應工項：** V17-H2
**狀態：** `[x]` 完成
**日期：** 2026-10-18
**依賴：** [H1](./H1_stop_auto_demo_snapshot.md)
**正式依據：** [#58](https://github.com/dernoson/endfield-playground/issues/58)
**開發分支：** `dev/aaaaa1018-58`（同 H1）

---

## 1. 背景

`/dev/*` 與正式頁 `/` 共用同一個 Pinia → 共用同一份 `historyStore`。  
在 A 頁 `execute` 的 Command，切到 B 頁後 Ctrl+Z 仍會 undo 到 A 頁操作。

會寫入 history 的 dev 頁（issue 列舉）：

- `HistoryReplay.vue`
- `LayoutStorePreview.vue`（**獨立 HTML** `dev/layout-store-preview.html`）
- `PaperFigMainField.vue`

`historyStore` **已有** `clear()`（清空 undo／redo 堆疊）。

---

## 2. 技術決策

| 決定 | 說明 |
|------|------|
| 策略 | 跨情境 → `historyStore.clear()`；不做雙 Pinia |
| Router | `installClearHistoryOnContextSwitch(router)`＠`afterEach` |
| 路徑規則 | `/`＝formal；`/dev…`（含 paper-fig）＝dev；其餘當 formal |
| 同區 | `/dev/a`→`/dev/b` **不清** |
| layoutStore | **不**重置（本版） |
| 獨立 HTML | **另 document＋自建 Pinia** → 與 SPA **本就隔離**；無需再 clear（見 §2.1） |

### 2.1 待決結案（實作驗證）

| ID | 題 | 結論 |
|----|-----|------|
| H-1 | 獨立 HTML 是否同 Pinia？ | **否**。`layout-store-preview.html` → `layoutStorePreviewMain.ts` 自行 `createApp`／`createPinia`，與 `main.ts` SPA 分開。SPA 內 `/`↔`/dev` 才是本項主戰場。 |
| H-2 | 是否連清 layoutStore？ | **否**（維持） |

---

## 3. 檔案計畫

| 動作 | 檔案 |
|------|------|
| 新建 | `src/utils/history/historyContext.ts` |
| 新建 | `src/utils/history/clearHistoryOnContextSwitch.ts` |
| 修改 | `src/router/index.ts`（註冊 afterEach） |
| 測試 | `src/__tests__/utils/history/historyContext.test.ts` |

---

## 4. 驗證標準

| # | 案例 | 預期 | 結果 |
|---|------|------|------|
| 1 | `/`→`/dev/…`→`/` | 跨界後 `undoDepth===0` | ✅ 單元測 |
| 2 | `/dev/a`→`/dev/b` | 堆疊保留 | ✅ |
| 3 | 路徑分類 | formal／dev 規則 | ✅ |

---

## 5. DoD

- [x] 跨正式↔dev（router）會 `clear()`
- [x] 獨立 HTML 策略已驗證並寫明（本就隔離）
- [x] 有單元測試
- [x] 未引入第二份 Pinia；未改 Command 協定

---

## 6. 開發日誌

### 2026-10-18｜完成

- `historyContext`＋router `afterEach`；3 測綠
- 獨立 HTML＝另 Pinia，不需額外 clear
- **下一刀＝H3**（驗收＋開 PR）

### 2026-10-18

- 建檔；策略＝clear on context switch；layoutStore 重置非本版預設
