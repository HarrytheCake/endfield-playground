# V20-F1 — 決策：Lab 朝「輕量可調參試玩」，不做完整 Swagger

**對應工項：** V20-F1（決策／交接；**非本版實作**）
**狀態：** `[x]` 定案落檔（2026-11-01）。D-6 閘門 **已滿足**（[#82](https://github.com/dernoson/endfield-playground/pull/82)，2026-11-02）
**日期：** 2026-11-01
**依賴：** [E1](./E1_acceptance_and_handoff.md) `[x]`
**承接：** [todolist_v21](../todolist_v21.md)（草案）、[dev_v21/A0_tryout_panel_plan.md](../dev_v21/A0_tryout_panel_plan.md)

---

## 1. 問題

L1 lab 是否要加入類 swagger 的：**任意呼叫、參數輸入、各式 response 一覽**？

---

## 2. 決策（2026-11-01｜負責人方向・文件定案）

| # | 結論 |
|---|------|
| D-1 | **不做**完整 Swagger／OpenAPI／codegen／任意 JSON body 瀏覽器 |
| D-2 | **要做**「輕量可調參試玩」：少數高價值 API＋有限欄位＋執行→真呼叫→JSON |
| D-3 | response 用**固定情境矩陣**（ok／失敗／null／prefer…），不是 schema explorer |
| D-4 | 仍掛 **`/dev/l1-contract-lab` 單一 hub**；不另開第二路由 |
| D-5 | 實作版本建議＝**V21**；本檔只定案＋牌程輸入 |
| D-6 | **V21 開工前提（硬）＝V19＋V20 收斂完畢**（合入 master）；未收斂不開 V21-A1／實作 |

### 為什麼不做成完整 swagger

- Hub 對象含**無開發經驗**者：一鍵案例＋少數調參比「填完整參數表」更跟得上
- 契約真相已是 TS 型別＋`contractCatalog`；再維一套 OpenAPI＝雙源
- 全 API 參數化＝變相第二套 playground，遠超 catalog／教學切片

### 為什麼仍要可調參

- 一鍵案例座標寫死；L2 常要「改個 point／prefer 再試」
- 與現有 JSON 輸出面板相容，增量小

---

## 3. 與既有約束對齊

| 既有 | 關係 |
|------|------|
| V19 A-3／A-4 | 單一 lab；不做自動同步——本決策不放寬 |
| V19-E1 維運 | 改試玩仍須改 catalog／USAGE 一句 |
| V20 F0 §2.3 | 全量 catalog **另一條線**；試玩面板**不取代** inventory 補齊 |
| 簽名／畫布 | 仍不改 store／utils 簽名、不碰正式畫布 |

---

## 4. 開發日誌

### 2026-11-08｜閘門已滿足

- #82 已合 master；V21-A1 於 `dev/aaaaa1102` 開版。D-6 條文不變

### 2026-11-01｜閘門確認

- D-6：V21 前提＝V19＋V20 收斂（合 master）

### 2026-11-01｜定案

- 依建議：輕量可調參；非 swagger
- 牌程／細項見 V21-A0；實作未開
