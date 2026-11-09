# V18-D1 — L1 contract lab 合入（W1018-A0 ②B）

**對應工項：** V18-D1
**狀態：** `[x]` 完成（[#79](https://github.com/dernoson/endfield-playground/pull/79) MERGED 2026-10-25）
**日期：** 2026-10-25（收斂確認 2026-11-01）
**依賴：** 無（來源分支已存在）
**正式工單：** [W1018-A0 §1](../../../work_dispatch/aaaaa/1018/W1018-A0_m3_engine_lab.md)
**來源分支：** `origin/dev/aaaaa1019-l1-lab`
**開發分支：** `dev/aaaaa1018`（已 merge lab → #79）

> **與 C1 皆交：** 本項＝②B（必做）。驗收步驟見 [C1](./C1_m3_acceptance_steps.md)。

---

## 1. 背景

`dev/aaaaa1019-l1-lab` 已含，並於 2026-10-25 merge 進本週分支：

| 產物 | 路徑 |
|------|------|
| Lab 頁 | `src/app/dev/L1ContractLab.vue`＋`l1ContractLab/contractCatalog.ts` |
| 路由／導覽 | `src/router/index.ts`、`DevLayout.vue` |
| 用法 | `docs/aaaaa/dev/USAGE_l1_contract_lab.md` |

合入後可在 `/dev/l1-contract-lab` 演示 V14–V17 契約（含源產出／toTopology／resolve 等）。

---

## 2. 作法進度

| # | 步驟 | 狀態 |
|---|------|------|
| 1 | merge `origin/dev/aaaaa1019-l1-lab` → `dev/aaaaa1018` | `[x]`（衝突：todolist_v17 meta 兩行皆留） |
| 2 | 品質閘（type-check／相關測） | `[x]` type-check；primaryOutput＋topology 8 passed |
| 3 | 開 PR → `master`（W1018-A0 ②B；不發解鎖句） | `[x]` [#79](https://github.com/dernoson/endfield-playground/pull/79) |
| 4 | 合入後回寫 E1／todolist | `[x]` 2026-11-01（V19-B1） |

**不做：** 正式頁掛 lab、改 LayoutView 互動、擴大 catalog 範圍。

---

## 3. 怎麼驗（手動）

```bash
pnpm dev
# Dev 導覽 →「L1 契約實驗室」
# 或 http://localhost:5173/dev/l1-contract-lab
```

| 分頁 | 與 M3／V2 相關 |
|------|----------------|
| V16 | `toTopology` 映射 `primaryOutput`；可選 store 寫入 |
| V17 | `resolveMachineDef`、引擎 30/min、history 情境 |

詳見 [USAGE_l1_contract_lab](../USAGE_l1_contract_lab.md)。公開 V2 仍以 [C1](./C1_m3_acceptance_steps.md) 測試重跑為準；本頁＝可視化。

---

## 4. 鎖檔檢查（預期）

相對 `master` 的碼 diff 應僅：

- `src/app/dev/L1ContractLab.vue`
- `src/app/dev/l1ContractLab/contractCatalog.ts`
- `src/app/dev/DevLayout.vue`（導覽一列）
- `src/router/index.ts`（一條路由）
- docs（USAGE／連結）

**不含** `GridCanvas`／`LayoutView`／`MainLayout` 業務改動。

---

## 5. DoD

- [x] PR 已合——[#79](https://github.com/dernoson/endfield-playground/pull/79)
- [x] 品質閘綠（type-check＋關鍵兩測；2026-10-25）
- [x] 未改 GridCanvas／LayoutView／MainLayout 業務邏輯（diff 僅 dev lab）
- [x] 不發解鎖句

---

## 6. 預定 PR body（開 PR 時貼）

```text
## Summary
- W1018-A0 ②B：合入 L1 contract lab（`/dev/l1-contract-lab`）
- V14–V17 契約表＋一鍵案例；USAGE 見 docs/aaaaa/dev/USAGE_l1_contract_lab.md
- 搭配 V18-C1 驗收步驟（公開 V2 以測試重跑為準）

## 不做
- 正式頁 UI、GridCanvas／LayoutView、解鎖句
```

---

## 7. 開發日誌

### 2026-11-01｜收斂確認

- #79 MERGED；本項標 `[x]`

### 2026-10-25｜merge 進本週分支

- merge `aaaaa1019-l1-lab`；todolist_v17 保留收斂＋串接演示兩行
- type-check 綠；layoutStore.primaryOutput＋flowEngine.topology.layout 8 passed
- 下一：等裁示 push／開 PR → master

### 2026-10-25

- 開版建檔
