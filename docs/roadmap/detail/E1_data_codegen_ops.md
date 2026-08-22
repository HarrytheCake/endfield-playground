# R-E1 — 資料與 codegen 維運

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §7 |
| 里程碑 | 跨月（2026-08-23 → 11-29） |
| 擋門檻 | 否（但 A2、B1、C5 皆依賴其正確運作） |
| 建議主責／備援 | aaaaa／— |
| 性質 | 資料 |
| 依賴 | — |
| 狀態 | `[ ]` 未開始 |
| 最後更新 | 2026-08-22 |

---

## 1. 背景與動機

V7 建立的資料流已經穩定運作：`data_1` → `pnpm sync:aaaaa-data` → `docs/aaaaa/data` → `pnpm generate:src-data` → `src/data`。本項不是要改這條流程，而是要**在三個月裡持續維持它可跑**。

理由是本輪有多個工項會改資料：[A2](./A2_grid_and_port_alignment.md) 修佔格與埠、[B1](./B1_toolbar_real_machines.md) 需要 tag 分類完整、[C5](./C5_source_primary_output.md) 需要材料 form 正確。每一次改動如果不走 codegen，`src/data` 就會與 `docs/aaaaa/data` 分歧，而分歧的症狀是「我改了 JSON 但畫面沒變」——這種問題排查一次要花掉半天。

## 2. 團隊看得到什麼

任何人改了 `docs/aaaaa/data` 下的 JSON，跑一個指令，`src/data` 就是最新的；測試會擋下不一致。

## 3. 現況盤點

| 對象 | 現況 |
|------|------|
| 同步指令 | `pnpm sync:aaaaa-data` |
| 產生指令 | `pnpm generate:src-data` |
| codegen 腳本 | `generate-src-data.mjs` |
| 資料目錄 | `docs/aaaaa/data`（權威）、`data_0`（封存）、`data_1`（遷移暫存） |
| 產出 | `src/data/machines.ts`／`products.ts`／`materials.ts`／`environments.ts` |
| 一致性檢查 | 部分測試涵蓋，未系統化 |

## 4. 技術決策

### 4.1 唯一權威來源

| 檔案 | 角色 |
|------|------|
| `docs/aaaaa/data/*.json` | **唯一可手改** |
| `src/data/*.ts` | **產物，禁止手改** |
| `data_0`／`data_1` | 封存與暫存，本輪不動 |

有人直接改 `src/data/*.ts` 是本項最需要防的事：改動會在下一次 codegen 被覆蓋，而覆蓋當下沒有任何警告。

### 4.2 改資料的固定流程

```text
1. 改 docs/aaaaa/data/*.json
2. pnpm generate:src-data
3. pnpm test           （一致性測試會擋下遺漏）
4. 一起 commit：JSON 與產物同一筆
```

第 4 條很重要：JSON 與產物分兩筆 commit 會讓 `git bisect` 時出現「資料與程式不同步」的中間狀態。

### 4.3 一致性測試

| 檢查 | 說明 |
|------|------|
| 產物與來源一致 | 重跑 codegen 後 `src/data` 不應有 diff |
| 機器無外層 ports | V9 modes-only 決策；回歸保護 |
| 每台機器有 `size` 且為正整數 | [A2](./A2_grid_and_port_alignment.md) 的前提 |
| 每個材料有 `form` | [C5](./C5_source_primary_output.md) 的前提 |
| tag 值在 `MACHINE_TAGS` 內 | [B1](./B1_toolbar_real_machines.md) 的前提 |

### 4.4 誰可以改資料

只有 aaaaa。其他人發現資料錯誤時**回報而非自行修改**——這不是權限問題，而是因為改 JSON 必須連帶跑 codegen 與測試，漏掉任一步都會造成難查的分歧。回報管道寫進每張相關工單的「卡住找誰」欄。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/__tests__/data/dataConsistency.test.ts` | §4.3 各項檢查 |
| 唯讀維運 | `docs/aaaaa/data/*.json` | 依各工項需求修改 |
| 唯讀 | `generate-src-data.mjs` | 除非 schema 變更，否則不動 |
| **不碰** | `data_0`、`data_1`、正式圖像資源 | |

## 6. 週切片（每月一次檢查點）

| 時間 | 動作 |
|------|------|
| 08/30 | 一致性測試上線；配合 [A2](./A2_grid_and_port_alignment.md) 的資料修正 |
| 09/27 | 確認 tag 完整度足以支撐 [B1](./B1_toolbar_real_machines.md) 的 2–3 類 |
| 10/25 | 確認材料 `form` 完整，支撐 [C5](./C5_source_primary_output.md) 的下拉過濾 |
| 11/29 | 確認演示產線用到的機器資料全部正確 |

## 7. 不做

- 不改 codegen schema（除非某工項明確要求並另開項）
- 不做正式圖像資源
- 不做資料編輯 UI
- 不動 `data_0`／`data_1`
- 不做跨版本資料遷移

## 8. 依賴與封鎖

無前置。本項是 [A2](./A2_grid_and_port_alignment.md)、[B1](./B1_toolbar_real_machines.md)、[C5](./C5_source_primary_output.md) 的共同基礎設施。

## 9. DoD

- [ ] `dataConsistency.test.ts` 涵蓋 §4.3 五項檢查並通過
- [ ] 重跑 codegen 後 `src/data` 無 diff（CI 或本機可驗）
- [ ] §4.2 流程寫進 [A3](./A3_onboarding_onepager.md) 或工單模板
- [ ] 四個月度檢查點皆有紀錄
- [ ] 期間所有資料改動皆為「JSON ＋ 產物同一筆 commit」

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 有人直接改 `src/data/*.ts` | 一致性測試會在下次 codegen 前就抓到 diff；[E2](./E2_layer_guard_pr_rules.md) 列為退回理由 |
| JSON 與產物分兩筆 commit | §4.2 第 4 條；review 檢查 |
| aaaaa 為資料的單點 | 資料改動範圍小、流程文件化，必要時 dernoson 可依 §4.2 代跑 |

**未交頂替：** 一致性測試若未建立，退回人工檢查，但相關工項的排查成本會顯著上升。

## 11. 開發日誌

### 2026-08-22
- 建檔。流程沿用 V7 既有資料鏈，本項新增的只有一致性測試與「唯一可改者」的規定
