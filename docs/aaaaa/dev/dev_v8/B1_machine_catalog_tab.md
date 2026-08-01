# V8-B1 — 機器目錄分頁（flow-engine）

**對應工項：** V8-B1  
**狀態：** 完成  
**依賴：** A1

---

## 1. 目標

在 `/dev/flow-engine` 新增「機器」分頁：

- 列出全部機器（`getAllMachines`）
- JSON 檢視（可序列化欄位＋目前 activeMode）
- 埠可視化：依 `machineMode` 顯示方位／media／index（色塊 placeholder）
- 多模態可切換，預覽與標籤跟著變

---

## 2. 實作

| 檔案 | 說明 |
|------|------|
| `src/app/dev/MachineCatalogPanel.vue` | 列表＋mode 切換＋SVG 埠示意＋JSON |
| `src/app/dev/FlowEngineTest.vue` | 頂部分頁：引擎／機器／產品 |

---

## 3. DoD

- [x] 可瀏覽全部機器並看 JSON
- [x] 多 mode 機器可切換；ports 預覽更新
- [x] 無正式圖檔依賴

---

## 4. 開發日誌

### 2026-08-01

- 初稿
- 完成 MachineCatalogPanel 與分頁接線
