# V16-E1 — 驗收、PR、交接

**對應工項：** V16-E1
**狀態：** `[~]` [#72](https://github.com/dernoson/endfield-playground/pull/72) 交審中
**日期：** 2026-10-18
**依賴：** [C1](./C1_set_device_primary_output.md) `[x]`、[D1](./D1_engine_read_path.md) `[x]`
**正式依據：** [W1011-A0 §3](../../../work_dispatch/aaaaa/1011/W1011-A0_c5_primary_output.md)、[WEEK §0.2 V8](../../../work_dispatch/WEEK_20261011.md)

---

## 1. 驗收表

| # | 步驟 | 預期 | 結果 |
|---|------|------|------|
| 1 | `pnpm test` | 綠 | **通過**（51 files／929 tests） |
| 2 | `pnpm type-check` | 綠 | **通過** |
| 3 | `pnpm lint-check` | 綠 | **通過** |
| 4 | `pnpm format-check` | 綠 | **通過** |
| 5 | diff 不含鎖檔 | GridCanvas／LayoutView／MainLayout／Toolbar／Stats／shapes／detectors 零命中 | **通過**（`src/` 僅 `layoutStore`＋測試） |
| 6 | 未改 `editorStore` 簽名 | 無相關 diff | **通過** |
| 7 | 公開 V8 | `setDevicePrimaryOutput` 在 layoutStore；有測試 | **通過** |
| 8 | PR 有引擎讀接法一句 | 經 `toTopology`（見 [D1](./D1_engine_read_path.md) §3） | **通過**（寫入 PR body） |

---

## 2. PR

| 項 | 內容 |
|----|------|
| 標題 | `W1011-A0：setDevicePrimaryOutput（V16）` |
| 分支 | `dev/aaaaa1011` → `master` |
| 範圍 | 文件＋`layoutStore` action＋測試；V15 收斂文件 |
| 合入序 | WEEK：A0 在 T2／H2 之後亦可；**不擋**樣式平行審 |
| 解鎖句 | **不發** |
| PR | [#72](https://github.com/dernoson/endfield-playground/pull/72) |

### 2.1 PR body 必含

```text
下游消費者：
- 10/18 引擎讀切片（aaaaa）：經 toTopology(layoutStore 快照) 餵入引擎建圖
- 左面板表單（日後）：只呼叫 setDevicePrimaryOutput

本 PR 不做正式頁表單、不做引擎改掛、不改 editorStore。
不發解鎖句。
```

---

## 3. 交接產物

| 產物 | 對象 | 一句話 |
|------|------|--------|
| `setDevicePrimaryOutput(uid, itemId \| null, ratePerMin?)` | 日後左面板／dev 頁 | 寫 `PlacedDevice.primaryOutput`；進歷史（`MachineRecipeChange`）；未知 uid＝no-op 不進歷史 |
| 引擎讀接法註記 | 下週 aaaaa 自己 | **經 `toTopology`**；見 PR／[D1](./D1_engine_read_path.md) |

口頭節奏：[INTRO](../../collaborator_survey/dispatch_private/1011/INTRO_A0_c5_primary_output.md)

---

## 4. 合入後回寫

- [ ] todolist_v16 → E1 結案
- [ ] AGENT_WEEK_1011 §0／§4
- [ ] 決策層 REVIEW／PENDING 日誌一行
- [ ] ROADMAP C5 狀態句（寫入端完成）
- [ ] WEEK V8 勾選（主編／結算時）

---

## 5. DoD

- [x] §1 驗收表通過
- [x] PR 已開（[#72](https://github.com/dernoson/endfield-playground/pull/72)）
- [x] 下游一句話＋引擎接法寫進 PR body
- [x] 未改鎖檔／`editorStore`

---

## 6. 開發日誌

### 2026-10-18｜驗收＋開 PR

- 品質閘四項全綠（929 tests）；鎖檔／editorStore 零 diff
- 開 [#72](https://github.com/dernoson/endfield-playground/pull/72)；body 註明引擎讀＝經 `toTopology`

### 2026-10-18

- 建檔；待 C1 實作後填驗收
