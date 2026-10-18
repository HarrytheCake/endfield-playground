# Agent 週摘要｜2026-10-18 → 10-25（1018｜#73 機型 id＋引擎讀切片｜V17）

| meta | value |
|------|-------|
| version | **v1.6（2026-10-18；V17-G1 開 PR）** |
| 用途 | Agent 執行本週 aaaaa 工項時的強制約束 |
| 公開／議題 | [#73](https://github.com/dernoson/endfield-playground/issues/73)、[C5](../../roadmap/detail/C5_source_primary_output.md) |
| 執行計畫 | [todolist_v17](../dev/todolist_v17.md)、[dev_v17/](../dev/dev_v17/) |
| 上週 | [AGENT_WEEK_1011](./AGENT_WEEK_1011.md)（V16／#72 已合） |
| 決策層 | [1018/PENDING](../collaborator_survey/dispatch_private/1018/PENDING_DECISIONS_20261025.md) |
| 撰寫 | aaaaa |
| 最後更新 | 2026-10-18 |

---

## 0. 三十秒結論

**V17＝#73：機型查表改以英文 id 為準（過渡 byId ?? byName）＋驗證／引擎對齊＋經 `toTopology` 最小可測讀取。**  
`resolveMachineDef`＠`machines.ts`；F1＝**A 必交**（測試餵入）、B 加分；偵測器只改查表、開 PR 知會 azure。  
配方鍵仍用 `machineDef.name`。不重開 W001 A-5。不發解鎖句。

---

## 1. 優先序

| 序 | 內容 | 文件 |
|----|------|------|
| ~~0~~ | ~~V16／#72 收斂~~ | **已完成**；[B1](../dev/dev_v17/B1_v16_residue_close.md) |
| ~~1~~ | ~~`resolveMachineDef`~~ | **已完成**；[C1](../dev/dev_v17/C1_resolve_machine_def.md) |
| ~~2~~ | ~~驗證 getDef＋E004／W001~~ | **已完成**；[D1](../dev/dev_v17/D1_validation_id_lookup.md) |
| ~~3~~ | ~~引擎查表改 id~~ | **已完成**；[E1](../dev/dev_v17/E1_flow_engine_id_lookup.md) |
| ~~4~~ | ~~toTopology 餵入測試切片~~ | **已完成（A）**；[F1](../dev/dev_v17/F1_engine_topology_slice.md) |
| 5 | 驗收＋PR（Closes #73） | [G1](../dev/dev_v17/G1_acceptance_and_handoff.md) |
| — | **禁止**改配方資料鍵為英文 id | 非本版 |
| — | **禁止**重開 W001 A-5／導流語意 | 只改查表 |
| — | **禁止**整包右側產耗／源素材表單 UI | C5 非本版 |

---

## 2. 禁止表

| 禁止 | 理由 |
|------|------|
| 偵測器直接 `getMachine` 當權威 | #73；應只走 `ctx.getDef` |
| `getRecipesForMachine(英文 id)` | 配方表鍵是中文名 |
| 雙寫 editorStore.primaryOutput | 裁決 B |
| 當本版去廢 `getMachine` | 過渡期要養 dev 頁 |
| 發明 #73 以外的大重構 | AGENT_ROADMAP |

---

## 3. 契約速查

| 項 | 結論 |
|----|------|
| 新模型 machineType | 英文 id |
| 查定義 | `resolveMachineDef`＠`machines.ts`＝`getMachineById ?? getMachine` |
| 查配方 | `getRecipesForMachine(machineDef.name, modeId)` |
| 引擎讀 | 經 `toTopology`；**A＝測試餵入必交**；B＝`/dev` 加分 |
| 偵測器 | 只改查表；A-5 不動；開 PR 知會 azure |
| 雙查移除 | editorStore 中文 machineType 退場後 |
| 分支 | `dev/aaaaa1018` |

---

## 4. 本週結束應更新

| # | 動作 | 狀態 |
|---|------|------|
| 1 | #73 合入／關閉 | `[ ]` |
| 2 | todolist_v17 結案 | `[ ]` |
| 3 | PENDING C-1／F-1／D-1 定案回寫 | `[x]` |
| 4 | ROADMAP C5 引擎讀進度句 | 結算時 |

---

## 5. 日誌

### 2026-10-18（v1.6）

- V17-G1：品質閘全綠（961 tests）；開 [#74](https://github.com/dernoson/endfield-playground/pull/74)（Closes #73）；`/dev` 頁手動待 reviewer

### 2026-10-18（v1.5）

- V17-F1＝A 完成：`flowEngine.topology.layout.test.ts`（源→粉碎→sink 30/min）；B 未做；下一＝G1

### 2026-10-18（v1.4）

- V17-E1 完成：引擎 resolve＋配方走 `def.name`；`crusher` 煙測；下一＝F1

### 2026-10-18（v1.3）

- V17-D1 完成：getDef／E004／W001 查表對齊；下一＝E1

### 2026-10-18（v1.2）

- V17-C1 完成：`resolveMachineDef`＠machines.ts＋測試

### 2026-10-18（v1.1）

- 負責人確認：C-1＝machines.ts；F-1＝A 必交／B 加分；D-1＝只改查表、開 PR 知會 azure

### 2026-10-18（v1.0）

- #72 MERGED；對齊 master `c5af7fc`
- 開 V17／AGENT_WEEK_1018；分支 `dev/aaaaa1018`
- 盤點缺口：`useValidation`／E004／W001／`useFlowEngine`；layout utils 已 byId
