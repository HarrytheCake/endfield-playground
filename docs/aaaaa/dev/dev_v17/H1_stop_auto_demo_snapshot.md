# V17-H1 — 正式頁停載示範快照（#58）

**對應工項：** V17-H1
**狀態：** `[ ]` 未開始
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
| 正式頁 | **刪除**（或永久關閉）`LayoutView` 開頁自動 `loadSnapshot(connected)` |
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
| 修改 | `src/editor/layout/LayoutView.vue`（移除／關閉 onMounted 自動載入） |
| 可選 | 相關註解／toby GUIDE 交叉引用一句（勿大改他人指南） |
| 測試 | 若有掛 LayoutView 的測：斷言 mount 後不因空 store 自動出現 connected 設備；否則補精簡測或手動驗收列入 H3 |

---

## 4. 驗證標準

| # | 案例 | 預期 |
|---|------|------|
| 1 | 硬重新整理進 `/`，且 store 空 | 畫布**空白**；無自動 connected 產線 |
| 2 | 手動放置設備後再重新整理 | 行為依現有 persist／store 生命週期；**不**被 fixture 覆寫既有資料（目前程式本就 `length===0` 才載；刪掉後更單純） |
| 3 | `/dev` 示範頁 | 仍可載 fixture／自行放置（不受本項刪正式頁邏輯影響） |

---

## 5. DoD

- [ ] `LayoutView` 不再自動 `loadSnapshot(connected)`
- [ ] 正式頁空進＝空白畫布（可手動驗）
- [ ] 未改 `editorStore`；未擴大改 GridCanvas 行為

---

## 6. 開發日誌

### 2026-10-18

- 建檔；納入 V17 第二主線 #58
