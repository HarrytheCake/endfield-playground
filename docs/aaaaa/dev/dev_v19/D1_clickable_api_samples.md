# V19-D1 — 可點測少數 API（對齊 master）

**對應工項：** V19-D1
**狀態：** `[ ]` 未開始
**日期：** 2026-11-01
**依賴：** [C1](./C1_hub_skeleton.md)（可骨架先行後補案例）
**正式依據：** [W1026-A0 §1.3](../../../work_dispatch/aaaaa/1026/W1026-A0_tutorial_lab_api.md)、既有 `L1ContractLab.vue` 一鍵案例
**開發分支：** `dev/aaaaa1026`

---

## 1. 背景

Lab 已有部分「一鍵案例 → JSON」。本周只補**少數**對齊現行 master、且對串接者最容易踩雷的點測；**不大包重構**整頁互動。

---

## 2. 建議本周必點測（可裁）

| 優先 | API | 為什麼 | 註記 |
|------|-----|--------|------|
| P0 | `hitTestPortAt`（含 `prefer`） | #65 審查後契約；緊貼埠對埠消歧 | 定義列／案例若仍缺 `prefer` 句要補 |
| P0 | `devicesOutsideBase` | 出界≠擋落子；toby／畫布消費 | 既有則核對文案 |
| P1 | `connectionWaypoints`（若 #78 已合且對外） | 新 layout util；catalog 尚無 | 確認匯出與呼叫端；僅演示不改簽名 |
| P1 | `setDevicePrimaryOutput` | C5；harry H1 下游 | ⚠ store 寫入案例維持隔離 Pinia（#79 審查） |
| P2 | `canPlaceDevice`／`canConnect` | 既有；過時註記就改 | 不重做綠紅卡專頁 |

> 實作時以「案例能跑＋文案與 master 一致」為準；若某 API 不適合在 lab 寫入 store，維持唯讀／隔離演示。

---

## 3. 技術約束

| 項 | 要求 |
|----|------|
| 呼叫 | 真呼叫 L1／store API，結果 JSON 可見 |
| 簽名 | **不改**被測函式／action 簽名 |
| Pinia | lab 寫入類維持 #79 隔離慣例（勿污染正式頁） |
| 範圍 | 少數案例；其餘標 inventory `todo` |

---

## 4. 檔案

| 動作 | 檔案 |
|------|------|
| 改 | `src/app/dev/L1ContractLab.vue`（案例按鈕／輸出） |
| 改 | `src/app/dev/l1ContractLab/contractCatalog.ts`（定義列對齊） |
| **不碰** | `src/utils/layout/*`、`src/store/layoutStore.ts` 簽名 |

---

## 5. DoD

- [ ] 至少 **2** 個本周補強的可點測案例通過手動驗
- [ ] `hitTestPortAt` 文案含 `prefer`（拖線 output／放開 input）
- [ ] catalog 過時句已改；與 master 行為一致
- [ ] 未改 L1／store 簽名；type-check／相關測綠

---

## 6. 開發日誌

### 2026-11-01

- 建檔；建議清單 P0／P1
