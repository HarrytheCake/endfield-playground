# V8-A1 — 範圍與定案

**對應工項：** V8-A1  
**狀態：** 完成  
**日期：** 2026-08-01

---

## 1. 背景

V7 已完成資料 v3 與 FlowEngine 最小 mode／媒質支援。接下來要：

- 在 dev 頁完善機器／產品瀏覽
- 補齊埠一對一、速率分媒質、匯流堵塞語意、拓樸埠顯示
- 為固液氣標籤預留欄位 → **已定案為 `form` 並入庫**

V6（拖曳進歷史）**維持鎖定**，本版不夾帶 drag-debug。

---

## 2. 最終決策

| 決策項 | 結論 |
|--------|------|
| 版本號 | **V8**（不重開 V6） |
| Dev 預覽位置 | `/dev/flow-engine` 內分頁／分區 |
| 圖像 | placeholder（色塊／文字）；正式圖後補 |
| 埠基數來源 | 當前 `machineMode` → `modes[].ports` |
| 連線基數 | **每埠最多一條邊**；多線進單口必經匯流器 |
| H8 | 雙鏈 → 匯流器 → Sink；滿速匯入後出口上限造成反向堵塞（約 15+15） |
| 驗證 | **僅 FlowEngine**；CR-04 引擎側先行 |
| 拓樸 | graph-viz／flow-engine 拓樸跟 ports；切 mode 更新標籤 |
| 速率 | belt 30／pipe 60 |
| 媒質與物態 | solid→belt；liquid／gas→pipe（依品項 **`form`**） |
| form（ItemForm） | 已寫入 materials／products；codegen 至 `src/data`（初稿名 `matterState` 作廢） |

---

## 3. 與既有版本邊界

| 版本 | 關係 |
|------|------|
| V6 | 鎖定；本版不改 drag／history |
| V7 | 完成；本版延續 belt／pipe、machineMode |
| CR-02／CR-03 | 本版不要求連線 UI 拒絕或 Detector；文件註明後續可對齊 |

---

## 4. 開發日誌

### 2026-08-01

- 依負責人回覆定案；建立 todolist_v8 + dev_v8 骨架

### 2026-08-02

- 定案表更新：`matterState` → **`form`**（已入庫）
