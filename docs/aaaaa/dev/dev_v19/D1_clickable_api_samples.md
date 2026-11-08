# V19-D1 — 可點測少數 API（對齊 master）

**對應工項：** V19-D1
**狀態：** `[x]` 完成（2026-11-01）
**日期：** 2026-11-01
**依賴：** [C1](./C1_hub_skeleton.md) `[x]`
**正式依據：** [W1026-A0 §1.3](../../../work_dispatch/aaaaa/1026/W1026-A0_tutorial_lab_api.md)、既有 `L1ContractLab.vue` 一鍵案例
**開發分支：** `dev/aaaaa1026`

---

## 1. 背景

Lab 已有部分「一鍵案例 → JSON」。本周只補**少數**對齊現行 master、且對串接者最容易踩雷的點測；**不大包重構**整頁互動。

---

## 2. 本周補強結果

| 優先 | API | 結果 |
|------|-----|------|
| P0 | `hitTestPortAt`＋`prefer` | **已補**按鈕「hitTestPortAt prefer（緊貼）」；雙序＋三 prefer 對照 |
| P0 | `devicesOutsideBase` | **既有**核對；文案仍強調出界≠擋落子 |
| P1 | `buildConnectionWaypoints` | **已補**可點測；catalog／inventory 改 listed |
| P1 | `setDevicePrimaryOutput` | **既有**（獨立 Pinia）；未改 |
| P2 | `canPlace`／`canConnect` | **既有**；總覽誤用句補 prefer／waypoints |

---

## 3. 技術約束

| 項 | 結果 |
|----|------|
| 真呼叫 API | 是 |
| 未改簽名 | 是 |
| Pinia 隔離 | 寫入類仍走 `withLabPinia` |
| 範圍 | 少數補強；其餘 inventory 仍 todo |

**下一批（非本項）：** 見 [F0](./F0_next_catalog_batch.md)——`findPortAt`、`resolveConnections`、`addPipeline`、`buildGapConnectionWaypoints`。

---

## 4. 檔案

| 動作 | 檔案 |
|------|------|
| 改 | `src/app/dev/L1ContractLab.vue` |
| 改 | `src/app/dev/l1ContractLab/contractCatalog.ts` |
| **未碰** | `src/utils/layout/*`、`src/store/layoutStore.ts` 簽名 |

---

## 5. DoD

- [x] 至少 **2** 個本周補強可點測（prefer 緊貼、buildConnectionWaypoints）
- [x] `hitTestPortAt` 文案含 `prefer`（拖線 output／放開 input）
- [x] catalog 對齊；inventory waypoints → listed
- [x] 未改 L1／store 簽名；type-check／lint 綠

---

## 6. 開發日誌

### 2026-11-01｜下一批指向 F0

- 本項範圍不變；待列補齊交 [F0](./F0_next_catalog_batch.md)／V20

### 2026-11-01｜完成

- 緊貼埠對埠 prefer 案例；waypoints 一鍵演示
- 下一＝E1 維運規則／驗收（收斂前不開 PR）

### 2026-11-01

- 建檔；建議清單 P0／P1
