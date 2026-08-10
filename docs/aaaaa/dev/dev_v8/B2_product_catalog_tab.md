# V8-B2 — 產品／材料目錄分頁（flow-engine）

**對應工項：** V8-B2  
**狀態：** 完成  
**依賴：** A1、E1（`form`）

---

## 1. 目標

在 `/dev/flow-engine` 「產品／材料」分頁：

- 列出 materials＋products
- JSON 檢視
- form（solid／liquid／gas）色塊 placeholder；正式圖像後補

---

## 2. 實作

| 檔案 | 說明 |
|------|------|
| `src/app/dev/ProductCatalogPanel.vue` | 篩選（全部／材料／產品）＋form 標籤＋JSON |
| `src/app/dev/FlowEngineTest.vue` | 頂部分頁接線 |

顯示欄：id／name、`form`、產品配方數、媒質對應提示（solid→belt）。

---

## 3. DoD

- [x] 可瀏覽品項＋JSON
- [x] placeholder 視覺區存在
- [x] `form` 欄位顯示（E1 資料）

---

## 4. 開發日誌

### 2026-08-01

- 初稿（曾寫 matterState；實際欄位為 `form`）
- 完成 ProductCatalogPanel
