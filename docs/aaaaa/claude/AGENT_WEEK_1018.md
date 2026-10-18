# Agent 週摘要｜2026-10-18 → 10-25（1018｜V17＝#73＋#58）

| meta | value |
|------|-------|
| version | **v1.7（2026-10-18；V17 擴寫＝#73＋#58；#73 已交／#58 下一刀）** |
| 用途 | Agent 執行本週 aaaaa 工項時的強制約束 |
| 公開／議題 | [#73](https://github.com/dernoson/endfield-playground/issues/73)、[#58](https://github.com/dernoson/endfield-playground/issues/58)、[C5](../../roadmap/detail/C5_source_primary_output.md) |
| 執行計畫 | [todolist_v17](../dev/todolist_v17.md)、[dev_v17/](../dev/dev_v17/) |
| 會議介紹 | [INTRO](../../work_dispatch/aaaaa/1011/INTRO_meeting_c5_primary_output.md) |
| 上週 | [AGENT_WEEK_1011](./AGENT_WEEK_1011.md)（V16／#72 已合） |
| 撰寫 | aaaaa |
| 最後更新 | 2026-10-18 |

---

## 0. 三十秒結論

**V17＝兩則 Issue：**

| Issue | 內容 | 狀態 |
|-------|------|------|
| [#73](https://github.com/dernoson/endfield-playground/issues/73) | 機型查表英文 id＋驗證／引擎＋`toTopology` 30/min | **實作完**；[#74](https://github.com/dernoson/endfield-playground/pull/74) 交審 |
| [#58](https://github.com/dernoson/endfield-playground/issues/58) | 正式頁停載示範；dev／正式 history 隔離 | **下一刀**；[H1](../dev/dev_v17/H1_stop_auto_demo_snapshot.md)→[H2](../dev/dev_v17/H2_clear_history_on_context_switch.md)→[H3](../dev/dev_v17/H3_history_isolation_acceptance.md) |

配方鍵仍用 `machineDef.name`。不重開 W001 A-5。不發解鎖句。#58 **不**預設重置 layoutStore。

---

## 1. 優先序

| 序 | 內容 | 文件 |
|----|------|------|
| ~~0–4~~ | ~~#73：B1→F1~~ | **已完成** |
| ~~5~~ | ~~#73 開 PR~~ | **已開** [#74](https://github.com/dernoson/endfield-playground/pull/74)；合入跟審＝[G1](../dev/dev_v17/G1_acceptance_and_handoff.md) |
| **6** | **#58 停自動 fixture** | [H1](../dev/dev_v17/H1_stop_auto_demo_snapshot.md) |
| **7** | **#58 情境切換 clear history** | [H2](../dev/dev_v17/H2_clear_history_on_context_switch.md) |
| **8** | **#58 驗收＋PR** | [H3](../dev/dev_v17/H3_history_isolation_acceptance.md) |
| — | **禁止**改配方資料鍵為英文 id | 非本版 |
| — | **禁止**重開 W001 A-5 | 只改查表（#73） |
| — | **禁止**整包右側產耗／源素材表單 UI | C5 非本版 |
| — | **禁止**雙 Pinia；**禁止**本版預設清空 layoutStore | #58 只清 history |

---

## 2. 禁止表

| 禁止 | 理由 |
|------|------|
| 偵測器直接 `getMachine` 當權威 | #73；應只走 `ctx.getDef` |
| `getRecipesForMachine(英文 id)` | 配方表鍵是中文名 |
| 雙寫 editorStore.primaryOutput | 裁決 B |
| 當本版去廢 `getMachine` | 過渡期要養 dev 頁 |
| 發明 #73／#58 以外的大重構 | AGENT_ROADMAP |
| 未對齊 toby／harry 就擴大改 LayoutView 行為 | #58 只動開頁 fixture＋history 邊界 |

---

## 3. 契約速查

| 項 | 結論 |
|----|------|
| 新模型 machineType | 英文 id |
| 查定義 | `resolveMachineDef`＠`machines.ts` |
| 查配方 | `getRecipesForMachine(machineDef.name, modeId)` |
| 引擎讀 | 經 `toTopology`；F1＝A 已交 |
| #58 正式頁 | 不自動 `loadSnapshot(connected)` |
| #58 歷史 | 跨正式／dev → `historyStore.clear()` |
| 分支 | #73＝`dev/aaaaa1018`（#74）；#58＝`dev/aaaaa1018-58` |

---

## 4. 本週結束應更新

| # | 動作 | 狀態 |
|---|------|------|
| 1 | #73 合入／關閉 | `[ ]`（#74 交審） |
| 2 | #58 合入／關閉 | `[ ]` |
| 3 | todolist_v17 結案 | `[ ]`（兩線都合後） |
| 4 | ROADMAP C5／S1-2 進度句 | 結算時 |

---

## 5. 日誌

### 2026-10-18（v1.7）

- V17 範圍擴寫＝**#73＋#58**；H1／H2／H3 建檔
- 分支分線：#73 留 `dev/aaaaa1018`／#74；#58 開 **`dev/aaaaa1018-58`**
- #73 線維持已交（#74）；**下一刀＝H1＠aaaaa1018-58**

### 2026-10-18（v1.6）

- V17-G1：品質閘全綠；開 [#74](https://github.com/dernoson/endfield-playground/pull/74)（Closes #73）

### 2026-10-18（v1.5–v1.0）

- F1→E1→D1→C1→定案→開版（#73 線）
