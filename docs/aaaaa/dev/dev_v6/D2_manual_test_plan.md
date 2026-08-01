# V6-D2 — 手動與 Dev 頁驗證計畫

**對應工項：** V6-D2  
**狀態：** 預覽頁已提供 M1–M6；M7 仍待主畫布目視  
**依賴：** V6-C1（畫布路徑）、V6-B1（API）  
**最後更新：** 2026-08-02

> V6 鎖定期間：以 `/dev/history-replay` **V6 拖曳驗收**區塊跑 M1–M6；M7 到主編輯畫布一眼確認跟手後勾選 checklist。

---

## 1. 背景與動機

單元測試已覆蓋 `commitDeviceMove` API；Dev 預覽用按鈕模擬「v-model 改座標 → commit」路徑，降低協作者必須整段手拖才能簽核的成本。真拖曳跟手（M7）仍無法在此頁代替。

---

## 2. 環境

- `pnpm dev` → http://localhost:5173
- **主驗收頁：** `/dev/history-replay` → 「V6 拖曳驗收（commitDeviceMove）」
- **M7：** 主編輯畫布 `/`（真拖曳目視）
- 對照：右側「移動所有設備」= `moveDevices`（M6）

---

## 3. 案例

| ID | 步驟 | 預期 | 預覽頁 |
|----|------|------|--------|
| M1 | 模擬單機拖曳 → Undo | 回到拖曳前位置；無雙重位移 | 一鍵 M1→M4 或「模擬拖曳（單）」 |
| M2 | 接 M1 → Redo | 回到拖曳後位置 | 一鍵 M1→M4 |
| M3 | 多機同一筆 commit → Undo | 全部一次還原 | 一鍵 M1→M4 或「模擬拖曳（多）」 |
| M4 | 零位移 commit | undoDepth 不變 | 一鍵 M1→M4 或「模擬零位移」 |
| M5 | 移動→旋轉→刪除交錯 Undo | 座標堆疊合理 | 一鍵 M5 |
| M6 | `moveDevices` → Undo | 仍正常 | 一鍵 M6 或「移動所有設備」 |
| M7 | 主畫布真拖曳過程 | 無明顯抖動／跳回 | **僅主畫布**；驗後手動勾 checklist |

### 可選（非本版失敗條件）

| ID | 步驟 | 觀察 |
|----|------|------|
| M8 | 拖曳連線設備 | 管線端點是否跟隨（**預期本版可能不跟隨**） |
| M9 | 快速連續拖曳 | FlowEngine／面板是否過度重算（僅觀察） |

---

## 4. 檔案

- 實作：`src/app/dev/HistoryReplay.vue`（V6 區塊＋ checklist，localStorage key `aaaaa-v6-d2-checklist`）

---

## 5. 驗證標準

- [ ] M1–M6 於 `/dev/history-replay` 一鍵腳本通過（或手動按鈕＋Undo 核對）
- [ ] M7 主畫布目視後勾選
- [ ] M8 結果寫入日誌（通過／已知落差）（可選）

---

## 6. 開發日誌

### 2026-08-01

- 建立手動清單

### 2026-08-02

- HistoryReplay 擴充 V6 區塊：模擬 commitDeviceMove、一鍵 M1–M6、checklist
- M7 維持主畫布目視
