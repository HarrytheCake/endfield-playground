# V17-H1 — 正式頁停載示範快照（#58）

**對應工項：** V17-H1
**狀態：** `[x]` 完成
**日期：** 2026-10-18
**依賴：** [A1](./A1_scope_decision.md)（V17 範圍含 #58）
**正式依據：** [#58](https://github.com/dernoson/endfield-playground/issues/58)、[#57](https://github.com/dernoson/endfield-playground/pull/57) S1-2
**開發分支：** `dev/aaaaa1018-58`（基於 `dev/aaaaa1018`／#74；見 [H3](./H3_history_isolation_acceptance.md)）

---

## 1. 背景

`src/editor/layout/LayoutView.vue` 在 `onMounted` 且 `layoutStore.devices.length === 0` 時呼叫：

```ts
layoutStore.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')))
```

該 `loadSnapshot` **會推入 `historyStore`**。使用者連按 Ctrl+Z 會把示範一併撤掉 → 畫布空白。

來源：toby 0914 整合指南曾指示「空畫布載 fixture 方便驗收」。**負責人已裁：正式頁不應自動載示範；示範屬 dev 用途。**

---

## 2. 技術決策

| 決定 | 說明 |
|------|------|
| 正式頁 | **刪除** `LayoutView` 開頁自動 `loadSnapshot(connected)` |
| 示範資料 | 只留在 `/dev`（例：`layout-store-preview`、既有 fixture 頁） |
| 空畫布驗收 | 靠手動放置／拖曳（toby T2 等）；不依賴進頁自動產線 |
| 歷史 | 本細項只停載入；堆疊隔離見 [H2](./H2_clear_history_on_context_switch.md) |

### 2.1 不在本細項

- 路由切換清 history → H2
- 整包重置 `layoutStore` 當離開 dev → 若需要，於 H2／H3 裁決
- 改 `loadSnapshot` 語意為「可選不進歷史」→ **非本版預設**（改呼叫點較小）

---

## 3. 檔案計畫

| 動作 | 檔案 |
|------|------|
| 修改 | `src/editor/layout/LayoutView.vue`（移除 onMounted 自動載入與 mockLayout import） |
| 測試 | `src/__tests__/editor/layoutView.noAutoSnapshot.test.ts`（源碼契約） |
| 可選 | toby GUIDE 交叉引用（本項未改他人指南） |

---

## 4. 驗證標準

| # | 案例 | 預期 | 結果 |
|---|------|------|------|
| 1 | 硬重新整理進 `/`，且 store 空 | 畫布**空白**；無自動 connected 產線 | ✅ 程式已刪；手動列 H3 |
| 2 | 手動放置設備後再重新整理 | **不**被 fixture 覆寫 | ✅ 已無自動載入路徑 |
| 3 | `/dev` 示範頁 | 仍可載 fixture | ✅ 未改 dev 頁 |
| 4 | 契約測 | 無 mockLayout／onMounted 自動載 | ✅ |

---

## 5. DoD

- [x] `LayoutView` 不再自動 `loadSnapshot(connected)`
- [x] 正式頁空進＝空白畫布（契約測＋H3 手動）
- [x] 未改 `editorStore`；未擴大改 GridCanvas 行為

---

## 6. 開發日誌

### 2026-10-18｜完成

- 移除 `LayoutView` `onMounted`＋`@/data/mockLayout` import
- 契約測 `layoutView.noAutoSnapshot.test.ts` 綠
- **下一刀＝H2**

### 2026-10-18

- 建檔；納入 V17 第二主線 #58
