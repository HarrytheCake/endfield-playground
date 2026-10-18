# V17 TODOLIST — 機型查詢統一（英文 id）＋引擎讀新模型最小切片（#73）

**版本：** V17
**建立日期：** 2026-10-18
**負責人：** aaaaa（[#73](https://github.com/dernoson/endfield-playground/issues/73) assignee）
**前置：** [V16](./todolist_v16.md) 已合 master（[#72](https://github.com/dernoson/endfield-playground/pull/72)）；文件收斂見 [V17-B1](./dev_v17/B1_v16_residue_close.md)
**正式依據：** [#73](https://github.com/dernoson/endfield-playground/issues/73)、[C5 §4.1a](../../roadmap/detail/C5_source_primary_output.md)（引擎讀義務）、[V16-D1](./dev_v16/D1_engine_read_path.md)（接法＝`toTopology`）
**上游：** [WEEK_20261011](../../work_dispatch/WEEK_20261011.md) v1.2（C5 引擎讀排本週）、[AGENT_WEEK_1018](../claude/AGENT_WEEK_1018.md)
**週次：** 2026-10-18 → 2026-10-25（連線月第三週；M3＝10/25）
**開發分支：** `dev/aaaaa1018`
**狀態總覽：** **`[~]`**（2026-10-18；C1–F1 完成；G1 品質閘綠、PR 交審中）
**待確認問題：** [dispatch_private/1018/PENDING_DECISIONS_20261025.md](../collaborator_survey/dispatch_private/1018/PENDING_DECISIONS_20261025.md)（C-1／F-1／D-1 **已決**）

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）
>
> **範圍宣告：** 本版＝（1）全專案機型查表改以英文 id 為準＋過渡雙查；（2）驗證 getDef／E004／W001 對齊；（3）引擎查定義對齊＋經 `toTopology` 的最小可測讀取路徑。**不發解鎖句**。不做正式頁源素材表單、不做整包右側產耗（D1）。
> **執行計畫：** 本檔＋`dev_v17/` **即為**本週 aaaaa 執行計畫檔。

---

## 概述

### 問題（整理自 #73）

| 層 | 現況 | 風險 |
|----|------|------|
| 新模型 | `PlacedDevice.machineType`＝**英文 id**；`toTopology` 原樣傳出 | — |
| 驗證 | `getDef`→`getMachine`（**中文名**）；E004／W001 另直接 `getMachine` | 改讀 layoutStore 後全略過 → 無警示 |
| 引擎 | 內部全 `getMachine`；配方鍵仍是中文名 | 改讀後源非源、配方全空 |
| 佈局 L1 utils | 多數已 `defaultGetMachine = getMachineById` | **已對**；非本版主刀 |
| 舊 editorStore／dev 頁 | `machineType` 仍可能是中文名 | 不得一次砍斷 |

### 目標

1. **單一入口：** 新模型查機型＝`getMachineById`；過渡期允許 `byId ?? byName`
2. **驗證：** `ValidationContext.getDef` 對齊；E004／W001 **只**走 `ctx.getDef`；配方仍 `getRecipesForMachine(machineDef.name, …)`
3. **引擎：** 查定義改英文 id（經同一入口）；配方以 `machineDef.name`；並兌現 V16 註記——經 `toTopology` 餵入的最小可測路徑
4. **相容：** `/dev/validation-test`、`/dev/flow-engine-test` 不壞
5. **V16 文件收斂：** #72 MERGED 回寫

### 已定案（2026-10-18｜開版＋負責人確認）

| # | 項 | 結論 |
|---|-----|------|
| 1 | 版本範圍 | **V17＝#73 查表統一＋引擎讀最小切片**（與 #72 預告接法一併） |
| 2 | 查表入口 | 新模型權威＝`getMachineById`；過渡＝`resolveMachineDef = byId ?? byName` |
| 3 | 放置 | **已決**＝`src/data/machines.ts` 旁 export |
| 4 | 配方鍵 | **維持** `machineDef.name`（中文）呼叫 `getRecipesForMachine` |
| 5 | 偵測器 | E004／W001 **只改查表**；A-5 不動；開 PR 知會 azure |
| 6 | 引擎讀路徑 | **經 `toTopology`**；F1＝**A 必交**（測試餵入）；B（`/dev` 掛載）時數夠再加 |
| 7 | 解鎖句 | **不發** |
| 8 | 分支 | **`dev/aaaaa1018`** |

詳見 [A1_scope_decision.md](./dev_v17/A1_scope_decision.md)。

### 非目標（本版不做）

- 正式頁源素材下拉／左面板表單（C5 UI）
- 整包右側產耗（roadmap D1）
- 把 `getRecipesForMachine` 改成以英文 id 為鍵（資料層大遷移）
- 廢除 `getMachine`／立刻刪 editorStore
- 改 GridCanvas／MainLayout／toby C1 UI／樣式鎖檔（F1＝A 預設零交集；僅做 B 時才評估 `/dev`）
- azure 的 W001 語意／A-5 模式裁決重開（本版只改**查表**）

### 流程大綱

```text
A 定案 → B V16 收斂
      → C1 resolveMachineDef（共用入口）
      → D1 驗證 getDef＋E004／W001
      → E1 引擎查表改 id（配方走 name）
      → F1 經 toTopology 最小讀取切片＋測試
      → G1 驗收＋PR
```

### 週切片

| 區間 | 切片 | 對應 |
|------|------|------|
| → 10/18 | 定案；V16 收斂；C1 開工 | A1、B1、C1 |
| 10/18–19 | 驗證＋引擎查表 | D1、E1 |
| 10/19–20 | toTopology 餵入最小切片＋測試 | F1 |
| → 10/25 前 | 驗收／PR；擋 M3 演示鏈 | G1 |

### 下游消費者（PR 必寫）

```text
下游消費者：
- 正式頁／驗證：layoutStore 英文 id 設備可被 E004／W001 正確判定
- 引擎：toTopology 拓樸可建圖算產耗（源→粉碎機→輸入口）
- azure／dev 頁：中文名 machineType 仍可經雙查過渡運作
```

### 交付宣告

```text
本 PR 統一機型查表（英文 id 為準；過渡 byId ?? byName），
並讓驗證／引擎能消費 toTopology／layoutStore 的英文 id。
配方鍵仍用 machineDef.name。不廢 getMachine；不發解鎖句；不做右側產耗整包。
關聯 #73／#72／#57 S4-2。
```

---

## V17-A｜範圍與定案

- [x] **V17-A1** 開版決策落版；對齊 #73／V16-D1／鎖表（C-1／F-1／D-1 已決）
    - 細項：[dev_v17/A1_scope_decision.md](./dev_v17/A1_scope_decision.md)

---

## V17-B｜V16 殘項收斂（前置）

- [x] **V17-B1** 確認 #72 MERGED；todolist_v16／E1 結案
    - 細項：[dev_v17/B1_v16_residue_close.md](./dev_v17/B1_v16_residue_close.md)

---

## V17-C｜共用查表入口

- [x] **V17-C1** `resolveMachineDef`：`getMachineById ?? getMachine`；註明移除雙查時機
    - 細項：[dev_v17/C1_resolve_machine_def.md](./dev_v17/C1_resolve_machine_def.md)
    - 產物：**`src/data/machines.ts`** export；`machines.test.ts`＋3 案

---

## V17-D｜驗證路徑（getDef＋E004／W001）

- [x] **V17-D1** `useValidation` 的 `getDef` 改走 resolve；E004／W001 移除直接 `getMachine`；補英文 id 測試
    - 細項：[dev_v17/D1_validation_id_lookup.md](./dev_v17/D1_validation_id_lookup.md)
    - 產物：`useValidation.ts`、`E004_missingInput.ts`、`W001_unmatchedMaterial.ts`、對應測試
    - **已決：** 只改查表、A-5 不動；開 PR 時知會 azure

---

## V17-E｜引擎查表對齊

- [x] **V17-E1** `useFlowEngine` 內 `getMachine(…)` 改 resolve；配方呼叫改 `machineDef.name`
    - 細項：[dev_v17/E1_flow_engine_id_lookup.md](./dev_v17/E1_flow_engine_id_lookup.md)
    - 產物：`useFlowEngine.ts`（`recipesForMachineType`）；英文 id 煙測＋引擎回歸 64 綠

---

## V17-F｜引擎讀新模型最小切片

- [x] **V17-F1** 經 `toTopology` 餵引擎的可測路徑＋單元測試（源→粉碎機→物品輸入口，30/min）——**A 必交**；B（`/dev`）本版未做
    - 細項：[dev_v17/F1_engine_topology_slice.md](./dev_v17/F1_engine_topology_slice.md)
    - 產物：`src/__tests__/flowEngine.topology.layout.test.ts`（2 案綠）
    - 對照：C5 §4.1a、V16-D1

---

## V17-G｜驗收、PR、交接

- [~] **V17-G1** 品質閘 `[x]`；開 PR `[~]`；合入後回寫 #73 `[ ]`
    - 細項：[dev_v17/G1_acceptance_and_handoff.md](./dev_v17/G1_acceptance_and_handoff.md)

---

## 封鎖／待決追蹤

| ID | 原因 | 等待對象 | 阻擋本版？ | 何時決 |
|----|------|----------|------------|--------|
| ~~PENDING C-1~~ | ~~放置~~ | — | **已決＝machines.ts** | 2026-10-18 |
| ~~PENDING F-1~~ | ~~切片深度~~ | — | **已決＝A 必交；B 加分** | 2026-10-18 |
| ~~PENDING D-1~~ | ~~azure~~ | — | **已決＝只改查表、開 PR 知會** | 2026-10-18 |
| — | 正式頁表單／右側產耗 | — | **否**（非本版） | 之後 |
| — | **不動** GridCanvas／樣式／toolbar（F1＝A） | — | — | 本版硬鎖 |
---

## 完成定義（Definition of Done）

### 主線（對照 [#73](https://github.com/dernoson/endfield-playground/issues/73)）

- [x] 以 layoutStore／英文 id 餵入時，E004（無輸入加工機）、W001（材料不符）能正確發警示（有測試）
- [x] 以 `toTopology` 拓樸餵引擎：源→粉碎機→物品輸入口，產耗各 30/min（有測試）
- [ ] 既有 dev 頁（validation-test／flow-engine-test）仍可運作
- [x] `pnpm type-check`／lint-check／format-check／test 綠（961 tests）
- [ ] PR 關聯 #73；註明雙查移除時機

### 品質閘

- [x] 不重開 W001 A-5 語意；不改 `editorStore` 簽名
- [x] 不發解鎖句
- [x] 配方資料層未改鍵（仍中文名）

---

## 未交頂替

| 工項 | 未交影響 |
|------|----------|
| D1 驗證查表 | 正式頁改讀 layoutStore 後配方警示全滅 |
| E1／F1 引擎 | #72 寫入的 primaryOutput 經 toTopology 仍算不出數字；M3 演示失守 |
| C1 共用入口 | 各處各寫雙查 → 日後漏改 |
| G1 PR | 擋 #73 結案 |

---

## 本週工項檢核（對照 #73）

| 工項 | 要求 | V17 狀態 | 備註 |
|------|------|----------|------|
| 查表入口 | getMachineById 為準＋過渡 | `[x]` | C1 2026-10-18 |
| 驗證 | getDef＋E004／W001 | `[x]` | D1 2026-10-18 |
| 引擎查表 | 英文 id | `[x]` | E1 2026-10-18 |
| 引擎切片 | toTopology 餵入可測 | `[x]` | F1 2026-10-18（A；B 未做） |
| 相容 | dev 頁不壞 | `[~]` | G1：回歸測綠；手動待 reviewer |
| V16 | #72 收斂 | `[x]` | B1 |

---

## 開發日誌

### 2026-10-18｜V17-G1 驗收＋開 PR

- 品質閘四項全綠（961 tests）；`/dev` 頁手動待 reviewer；開 PR（Closes #73）

### 2026-10-18｜V17-F1 完成（A）

- `flowEngine.topology.layout.test.ts`：英文 id 快照→toTopology→引擎；產耗 30/min；**下一刀＝G1**

### 2026-10-18｜V17-E1 完成

- 引擎查定義→resolve；配方經 `def.name`；`crusher` 煙測＋64 綠；**下一刀＝F1**

### 2026-10-18｜V17-D1 完成

- getDef→resolve；E004／W001 只走 getDef；T10／T19＋回歸綠；**下一刀＝E1**

### 2026-10-18｜V17-C1 完成

- `resolveMachineDef`＋3 測綠

### 2026-10-18｜C-1／F-1／D-1 定案

- 放置＝`machines.ts`；F1＝A 必交、B 加分；偵測器只改查表、開 PR 知會 azure

### 2026-10-18｜開版

- #72 MERGED；對齊 `origin/master`＠`c5af7fc`
- 依 #73＋V16-D1 開 V17；分支 `dev/aaaaa1018`
- 盤點：layout utils 已 `getMachineById`；缺口在 `useValidation`／E004／W001／`useFlowEngine`
- 決策層 `dispatch_private/1018/`＋`AGENT_WEEK_1018` 同步建立
