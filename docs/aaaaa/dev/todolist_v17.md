# V17 TODOLIST — #73 機型 id／引擎讀切片 ＋ #58 歷史隔離

**版本：** V17
**建立日期：** 2026-10-18
**負責人：** aaaaa（[#73](https://github.com/dernoson/endfield-playground/issues/73)、[#58](https://github.com/dernoson/endfield-playground/issues/58) assignee）
**前置：** [V16](./todolist_v16.md) 已合 master（[#72](https://github.com/dernoson/endfield-playground/pull/72)）；文件收斂見 [V17-B1](./dev_v17/B1_v16_residue_close.md)
**正式依據：** [#73](https://github.com/dernoson/endfield-playground/issues/73)、[#58](https://github.com/dernoson/endfield-playground/issues/58)、[C5 §4.1a](../../roadmap/detail/C5_source_primary_output.md)、[V16-D1](./dev_v16/D1_engine_read_path.md)、[#57](https://github.com/dernoson/endfield-playground/pull/57) S1-2
**上游：** [WEEK_20261011](../../work_dispatch/WEEK_20261011.md) v1.2、[AGENT_WEEK_1018](../claude/AGENT_WEEK_1018.md)
**週次：** 2026-10-18 → 2026-10-25（連線月第三週；M3＝10/25）
**開發分支：** #73＝`dev/aaaaa1018`（[#74](https://github.com/dernoson/endfield-playground/pull/74)）；#58＝**`dev/aaaaa1018-58`**（本線）
**狀態總覽：** **`[~]`**（2026-10-18；#73／#74 交審中；#58＠`dev/aaaaa1018-58`：H1／H2 完成；**H3 品質閘綠、待開 PR**）
**會議介紹：** [INTRO_meeting_c5_primary_output](../../work_dispatch/aaaaa/1011/INTRO_meeting_c5_primary_output.md)

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）
>
> **範圍宣告：** 本版＝（1）**#73** 機型查表英文 id＋驗證／引擎對齊＋經 `toTopology` 最小可測讀取；（2）**#58** 正式頁停載示範＋dev／正式操作歷史隔離。**不發解鎖句**。不做正式頁源素材表單、不做整包右側產耗（D1）。
> **執行計畫：** 本檔＋`dev_v17/` **即為**本週 aaaaa 執行計畫檔。

---

## 概述

### 雙主線狀態

| 主線 | Issue | 內容 | 狀態 |
|------|-------|------|------|
| **查表＋引擎讀** | [#73](https://github.com/dernoson/endfield-playground/issues/73) | resolve／驗證／引擎／toTopology 30/min | **實作完**；PR [#74](https://github.com/dernoson/endfield-playground/pull/74) |
| **歷史隔離** | [#58](https://github.com/dernoson/endfield-playground/issues/58) | 停自動 fixture；情境切換 `history.clear()` | **下一刀**；細項 H1–H3 |

### 問題（整理自 #73）

| 層 | 現況（修前） | 風險 |
|----|--------------|------|
| 新模型 | `PlacedDevice.machineType`＝**英文 id**；`toTopology` 原樣傳出 | — |
| 驗證 | `getDef`→`getMachine`（**中文名**）；E004／W001 另直接 `getMachine` | 改讀 layoutStore 後全略過 → 無警示 |
| 引擎 | 內部全 `getMachine`；配方鍵仍是中文名 | 改讀後源非源、配方全空 |
| 佈局 L1 utils | 多數已 `defaultGetMachine = getMachineById` | **已對**；非本版主刀 |
| 舊 editorStore／dev 頁 | `machineType` 仍可能是中文名 | 不得一次砍斷 |

### 問題（整理自 #58）

| 層 | 現況 | 風險 |
|----|------|------|
| Pinia | `/` 與 `/dev/*` 共用 `historyStore` | Ctrl+Z 跨頁誤撤 |
| 正式頁開頁 | `LayoutView` 空 store 時 `loadSnapshot(connected)` 且**進歷史** | 連 Undo → 畫布空白 |
| 示範資料 | 混在正式頁 | 違反「示範屬 dev」裁決 |

### 目標

**#73**

1. **單一入口：** `resolveMachineDef = byId ?? byName`
2. **驗證：** getDef／E004／W001 只走 resolve；配方仍 `machineDef.name`
3. **引擎：** 查定義改 id；經 `toTopology` 可測 30/min
4. **相容：** 既有中文名 dev 頁不壞

**#58**

5. 正式頁**不**自動載示範快照
6. 跨正式／dev 情境清空 history（互不影響）

### 已定案

| # | 項 | 結論 |
|---|-----|------|
| 1 | 版本範圍 | **V17＝#73＋#58** |
| 2 | 查表入口 | `resolveMachineDef`＠`machines.ts` |
| 3 | 配方鍵 | **維持** `machineDef.name` |
| 4 | 偵測器 | 只改查表；A-5 不動；#74 知會 azure |
| 5 | 引擎讀 | 經 `toTopology`；F1＝A 必交（已交）；B 未做 |
| 6 | #58 策略 | H1 停自動載；H2 `history.clear()`；不預設重置 layoutStore |
| 7 | PR 分線 | #73→G1／[#74](https://github.com/dernoson/endfield-playground/pull/74)；#58→H3／另 PR |
| 8 | 解鎖句 | **不發** |
| 9 | 分支 | #73＝`dev/aaaaa1018`；#58＝**`dev/aaaaa1018-58`**（基於前者） |

詳見 [A1_scope_decision.md](./dev_v17/A1_scope_decision.md)。

### 非目標（本版不做）

- 正式頁源素材下拉／左面板表單（C5 UI）
- 整包右側產耗（roadmap D1）
- 配方資料層改英文 id 鍵；廢除 `getMachine`
- 雙 Pinia／兩套 historyStore
- 本版預設重置 `layoutStore`（與 #58 清歷史分離）
- 重開 W001 A-5；改 GridCanvas／樣式鎖檔（#58 僅動 LayoutView 開頁邏輯＋history 邊界）

### 流程大綱

```text
#73 線（已完成實作）
A → B → C1 → D1 → E1 → F1 → G1（#74 交審）

#58 線（下一刀）
H1 停自動 fixture → H2 情境切換 clear history → H3 驗收＋PR（Closes #58）
```

### 週切片

| 區間 | 切片 | 對應 |
|------|------|------|
| → 10/18 | #73 定案→實作→#74 | A–G1 |
| 10/18– | #58 文件＋實作 | H1–H3 |
| → 10/25 前 | #58 合入；#73 若未合跟審 | H3／G1 |

### 下游消費者

```text
#73：
- 正式頁／驗證：英文 id 可被 E004／W001 判定
- 引擎：toTopology 可建圖算產耗
- azure：僅查表路徑變更

#58：
- 正式頁空進＝空白；Ctrl+Z 不再清掉「進頁示範」
- toby／harry：空畫布驗收改手動
- dev 頁作者：跨情境不再污染正式 Undo
```

---

## V17-A｜範圍與定案

- [x] **V17-A1** 開版；後擴寫＝#73＋#58
    - 細項：[dev_v17/A1_scope_decision.md](./dev_v17/A1_scope_decision.md)

---

## V17-B｜V16 殘項收斂（前置）

- [x] **V17-B1** 確認 #72 MERGED；todolist_v16／E1 結案
    - 細項：[dev_v17/B1_v16_residue_close.md](./dev_v17/B1_v16_residue_close.md)

---

## V17-C｜共用查表入口（#73）

- [x] **V17-C1** `resolveMachineDef`
    - 細項：[dev_v17/C1_resolve_machine_def.md](./dev_v17/C1_resolve_machine_def.md)

---

## V17-D｜驗證路徑（#73）

- [x] **V17-D1** getDef＋E004／W001
    - 細項：[dev_v17/D1_validation_id_lookup.md](./dev_v17/D1_validation_id_lookup.md)

---

## V17-E｜引擎查表對齊（#73）

- [x] **V17-E1** useFlowEngine resolve＋配方 name
    - 細項：[dev_v17/E1_flow_engine_id_lookup.md](./dev_v17/E1_flow_engine_id_lookup.md)

---

## V17-F｜引擎讀新模型最小切片（#73）

- [x] **V17-F1** toTopology 餵入測試（A）；B 未做
    - 細項：[dev_v17/F1_engine_topology_slice.md](./dev_v17/F1_engine_topology_slice.md)

---

## V17-G｜#73 驗收、PR

- [~] **V17-G1** 品質閘 `[x]`；PR [#74](https://github.com/dernoson/endfield-playground/pull/74) 交審中；合入後關 #73 `[ ]`
    - 細項：[dev_v17/G1_acceptance_and_handoff.md](./dev_v17/G1_acceptance_and_handoff.md)

---

## V17-H｜#58 歷史隔離＋停載示範

- [x] **V17-H1** 正式頁 `LayoutView` 停自動 `loadSnapshot(connected)`
    - 細項：[dev_v17/H1_stop_auto_demo_snapshot.md](./dev_v17/H1_stop_auto_demo_snapshot.md)
    - 產物：`LayoutView.vue`；`layoutView.noAutoSnapshot.test.ts`
- [x] **V17-H2** 跨正式／dev 情境 `historyStore.clear()`
    - 細項：[dev_v17/H2_clear_history_on_context_switch.md](./dev_v17/H2_clear_history_on_context_switch.md)
    - 產物：`historyContext.ts`／`clearHistoryOnContextSwitch.ts`；router 註冊；單元測
- [~] **V17-H3** 品質閘 `[x]`（965 tests）；開 PR `[ ]`（先 commit）；Closes #58 `[ ]`
    - 細項：[dev_v17/H3_history_isolation_acceptance.md](./dev_v17/H3_history_isolation_acceptance.md)

---

## 封鎖／待決追蹤

| ID | 原因 | 等待對象 | 阻擋本版？ | 何時決 |
|----|------|----------|------------|--------|
| ~~PENDING C-1／F-1／D-1~~ | #73 查表／切片 | — | **已決** | 2026-10-18 |
| H-1（H2 文件） | 獨立 HTML 與 SPA 是否同 Pinia | 實作時驗證 | 否（有預設） | H2 實作 |
| H-2（H2 文件） | 是否連清 layoutStore | — | **預設否** | 已暫定 |
| — | 正式頁表單／右側產耗 | — | **否** | 之後 |

---

## 完成定義（Definition of Done）

### 主線 #73

- [x] 英文 id → E004／W001 有警示（測試）
- [x] toTopology → 產耗各 30/min（測試）
- [~] dev 頁相容（回歸綠；手動待 reviewer）
- [x] 品質閘綠（開 #74 時 961 tests）
- [~] PR [#74](https://github.com/dernoson/endfield-playground/pull/74) 交審；合入後關 #73

### 主線 #58

- [x] 正式頁開頁不自動載 connected（H1）
- [x] 跨正式／dev 操作歷史互不影響（clear 策略）（H2）
- [x] H1／H2 單元測；H3 手動腳本待驗收
- [ ] PR Closes #58

### 品質閘（兩線共用）

- [x] #73：不重開 A-5；不改 editorStore 簽名；不發解鎖句
- [ ] #58：知會 toby／harry；不發解鎖句

---

## 未交頂替

| 工項 | 未交影響 |
|------|----------|
| ~~D1／E1／F1~~ | ~~已交~~ |
| G1 #74 未合 | #73 不關；英文 id 鏈未進 master |
| H1 | 正式頁 Ctrl+Z 仍可清掉示範 → 空白 |
| H2 | dev／正式 Undo 互相污染 |
| H3 | #58 不關 |

---

## 本週工項檢核

| 工項 | 要求 | V17 狀態 | 備註 |
|------|------|----------|------|
| #73 查表入口 | resolve | `[x]` | C1 |
| #73 驗證 | getDef＋E004／W001 | `[x]` | D1 |
| #73 引擎查表 | 英文 id | `[x]` | E1 |
| #73 引擎切片 | toTopology 可測 | `[x]` | F1＝A |
| #73 PR | Closes #73 | `[~]` | #74 |
| #58 停自動 fixture | LayoutView | `[x]` | H1 2026-10-18 |
| #58 歷史隔離 | clear on switch | `[x]` | H2 2026-10-18 |
| #58 品質閘 | type／lint／format／test | `[x]` | H3 2026-10-18 |
| #58 PR | Closes #58 | `[ ]` | H3 待開 |
| V16 | #72 收斂 | `[x]` | B1 |

---

## 開發日誌

### 2026-10-18｜V17-H3 品質閘

- 四項全綠（965 tests）；先逐項 commit；**不開 PR**

### 2026-10-18｜V17-H2 完成

- router afterEach 跨正式／dev → `history.clear()`；獨立 HTML 另 Pinia；**下一刀＝H3**

### 2026-10-18｜V17-H1 完成

- `LayoutView` 移除開頁 `loadSnapshot(connected)`；契約測綠；**下一刀＝H2**

### 2026-10-18｜V17 擴寫納入 #58

- 範圍＝#73＋#58；建 H1／H2／H3；A1／AGENT／會議檔對齊
- 分支：#73 保持 `dev/aaaaa1018`；#58 另開 **`dev/aaaaa1018-58`**
- **#73 線實作已完成**（#74 交審）；下一刀曾＝H1＠aaaaa1018-58

### 2026-10-18｜V17-G1 驗收＋開 PR（#73）

- 品質閘四項全綠（961 tests）；開 [#74](https://github.com/dernoson/endfield-playground/pull/74)（Closes #73）

### 2026-10-18｜V17-F1／E1／D1／C1／B1／開版

- 見前版日誌；#73 線 C→F 全 `[x]`
