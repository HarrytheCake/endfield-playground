# V8-C1 — 單埠單線（埠基數驗證）

**對應工項：** V8-C1  
**狀態：** 完成  
**依賴：** A1

---

## 1. 規則

- 機器在當前 `machineMode` 下的出入口 = `input_ports`／`output_ports`
- **每一個 port 最多對應一條邊**（同一 handle 不可被兩條邊共用）
- 若兩條線路要進入同一入口語意 → 必須先經 **匯流器**，再單線進入該埠
- 「複數出入口」= ports 陣列多筆；**不是**單埠可接多線
- 範例：精煉爐多物品入口＝多個 in port；物品輸入口＝單一 in port

---

## 2. 引擎行為（CR-04 先行）

`validateChains` Step 3.4 `markPortCardinalityViolations`：

| 邊的 handle | 行為 |
|-------------|------|
| 有 `in-N`／`out-N` | 以 `(deviceUid, direction, handle)` 計佔用；>1 條 → 兩端標非法 |
| 無 handle，且該方向僅 1 埠 | 視為佔用 `__sole__`；多條抽象邊仍非法（可抓 H8 雙線進 Sink） |
| 無 handle，且多埠 | **略過**（舊整合測試抽象多線暫相容；正式連線應帶 handle） |

- **不做** CR-02 連線當下拒絕、不做 CR-03 Detector（本版）
- H8 preset 在 C4 改匯流前，雙線直連單埠 Sink 會被標非法（預期）

---

## 3. DoD

- [x] 單埠雙線情境測試會標非法（P1）
- [x] 多埠機器各埠各接一條仍合法（P2）
- [x] 文件註明引擎側先行

測試：`src/__tests__/flowEngine.v8.portCardinality.test.ts`

---

## 4. 開發日誌

### 2026-08-01

- 初稿
- 實作 `portOccupancyKey`／`markPortCardinalityViolations`；P1／P2 通過
