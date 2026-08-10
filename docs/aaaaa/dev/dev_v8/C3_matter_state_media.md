# V8-C3 — form 與 belt／pipe 一致性

**對應工項：** V8-C3  
**狀態：** 完成  
**依賴：** E1（`form` 已入庫）  
**最後更新：** 2026-08-02

---

## 1. 規則

| form | 線路媒質 |
|------|---------|
| `solid` | `belt`（輸送帶） |
| `liquid` | `pipe`（管道） |
| `gas` | `pipe`（管道） |

- 輸入端與輸出端運送的品項皆依其 `form` 選擇線路類型
- 與埠上宣告的 `PortMedia`、邊上實際媒質不一致 → FlowEngine 標非法／略過
- **僅引擎側**；UI 連線拒絕後續版本

欄位名以 JSON **`form`** 為準（初稿 `matterState` 作廢）。

---

## 2. 實作摘要

- `getItemForm`／`formToPortMedia`（products／flow types）
- `useFlowEngine.isItemFormMediaMismatch`：handle 齊全且上游產出物態全與線路不符 → 非法
- 測試：`src/__tests__/flowEngine.v8.formMedia.test.ts`（M1 solid→pipe／M2 gas→belt／M3 liquid→pipe）

---

## 3. DoD

- [x] 有 form 時 solid↔belt、liquid／gas↔pipe 驗證接上
- [x] 專項測試覆蓋對／錯配對（見 F1）
- [x] 與 C2 上限聯動（依埠媒質 30／60）

---

## 4. 開發日誌

### 2026-08-01

- 初稿
- form 資料入庫後接上引擎檢查

### 2026-08-02

- 補 M1–M3 專項測試；工項標完成
