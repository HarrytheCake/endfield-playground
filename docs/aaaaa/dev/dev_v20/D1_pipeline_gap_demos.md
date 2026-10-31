# V20-D1 — P1：addPipeline／removePipeline＋buildGapConnectionWaypoints

**對應工項：** V20-D1
**狀態：** `[x]` 完成（2026-11-01）
**日期：** 2026-11-01
**依賴：** [C1](./C1_port_resolve_demos.md) `[x]`
**準則：** [F0 §2.1／§5](../dev_v19/F0_next_catalog_batch.md)
**開發分支：** `dev/aaaaa1026`
**產物：** lab V15／V16 可點測；inventory 新列 `buildGapConnectionWaypoints`；`addPipeline`／`removePipeline` → `listed`

---

## 1. 目標與結果

| API | 要交 | 結果 |
|-----|------|------|
| `addPipeline`／`removePipeline` | 獨立 Pinia 一鍵寫入／刪除；文案標 **內含 canConnect** | **已補** V16「addPipeline／removePipeline」 |
| `buildGapConnectionWaypoints` | **inventory 新增列**＋可點測；對照單轉角 | **已補** V15「buildGapConnectionWaypoints」 |
| （可選 P2）獨立 `describeConnectFailure` | 有餘力 | **併入** addPipeline 案例輸出（未另開鈕） |

---

## 2. 技術約束

| 項 | 結果 |
|----|------|
| 真呼叫 | 是 |
| Pinia | 寫入類走 `withLabPinia` |
| 簽名 | 未改 |
| 畫布 | 未碰 |

---

## 3. 檔案

| 動作 | 檔案 |
|------|------|
| 改 | `src/app/dev/L1ContractLab.vue` |
| 改 | `src/app/dev/l1ContractLab/contractCatalog.ts` |
| 改 | USAGE／todolist／AGENT |
| **未碰** | store／utils 簽名、正式畫布 |

---

## 4. DoD

- [x] `addPipeline`／`removePipeline` listed＋可點測（隔離 Pinia）
- [x] `buildGapConnectionWaypoints` 進 inventory＋listed＋可點測
- [x] 未改簽名；品質閘綠
- [x] 回寫 todolist／本檔

---

## 5. 開發日誌

### 2026-11-01｜完成

- gap 對照單轉角；add／remove＋失敗端點案例
- 下一＝**E1**

### 2026-11-01

- 開版建檔
