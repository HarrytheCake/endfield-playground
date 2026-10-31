# V20-C1 — P0：findPortAt 對照＋resolveConnections

**對應工項：** V20-C1
**狀態：** `[x]` 完成（2026-11-01）
**日期：** 2026-11-01
**依賴：** [A1](./A1_scope_decision.md) `[x]`
**準則：** [F0 §2.1／§5](../dev_v19/F0_next_catalog_batch.md)
**開發分支：** `dev/aaaaa1026`
**產物：** `L1ContractLab.vue`（V15 兩鈕）；`contractCatalog.ts` 定義列＋inventory `listed`

---

## 1. 目標與結果

| API | 要交 | 結果 |
|-----|------|------|
| `collectPortAnchors`／`findPortAt` | 定義表＋一鍵對照：**格點精確 ≠ `hitTestPortAt` 熱區** | **已補**「findPortAt vs hitTestPortAt」 |
| `resolveConnections` | 定義表＋可點測（對齊／斷線） | **已補**「resolveConnections（對齊／斷線）」 |
| （P2）`resolvePortAnchorCell` | 同故事可併定義列 | **已列**定義表＋案例內呼叫 |

---

## 2. 技術約束

| 項 | 結果 |
|----|------|
| 真呼叫 | 是 |
| 簽名 | 未改 `utils/layout` |
| 畫布 | 未碰 |
| catalog | 三列 inventory → `listed`；V15 定義表擴充 |

---

## 3. 檔案

| 動作 | 檔案 |
|------|------|
| 改 | `src/app/dev/L1ContractLab.vue` |
| 改 | `src/app/dev/l1ContractLab/contractCatalog.ts` |
| 改 | `docs/aaaaa/dev/USAGE_l1_contract_lab.md` |
| **未碰** | `src/utils/layout/*` 簽名、正式畫布 |

---

## 4. DoD

- [x] `findPortAt`（及錨點）inventory＝`listed`＋可點測／對照文案
- [x] `resolveConnections` inventory＝`listed`＋可點測
- [x] 未改簽名；type-check／lint／format 綠
- [x] 回寫 todolist_v20／本檔日誌

---

## 5. 開發日誌

### 2026-11-01｜完成

- V15 分頁新增兩鈕；定義表＋inventory 對齊
- 下一＝**V20-D1**

### 2026-11-01

- 開版建檔；等待開工
