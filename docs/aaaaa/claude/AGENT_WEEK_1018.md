# Agent 週摘要｜2026-10-18 → 10-25（1018｜M3 引擎讀驗收＋lab｜V18）

| meta | value |
|------|-------|
| version | **v3.5（2026-11-01；#79 已合；V18 文件結案）** |
| 用途 | Agent 執行本週派工／改工單時的強制約束 |
| 公開 | [WEEK_1018](../../work_dispatch/WEEK_20261018.md) v1.0、[W1018-A0](../../work_dispatch/aaaaa/1018/W1018-A0_m3_engine_lab.md)、[INTRO](../../work_dispatch/aaaaa/1018/INTRO_meeting_m3_engine_lab.md)、[ACCEPTANCE](../../work_dispatch/aaaaa/1018/ACCEPTANCE_V2_c5_chain.md)、[LAB](../../work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md) |
| 執行計畫 | [todolist_v18](../dev/todolist_v18.md)、[dev_v18/](../dev/dev_v18/) |
| 決策層 | [1018/REVIEW](../collaborator_survey/dispatch_private/1018/REVIEW_20261018.md)、[1018/E3](../collaborator_survey/dispatch_private/1018/E3_risk_backup_staffing.md)、[1018/PENDING](../collaborator_survey/dispatch_private/1018/PENDING_DECISIONS_20261025.md)、[1018/INTRO](../collaborator_survey/dispatch_private/1018/INTRO_A0_m3_engine_lab.md) |
| 操作總則 | [AGENT_ROADMAP](./AGENT_ROADMAP.md)（v1.6；檔案地圖仍指 0907，已知過期） |
| 上週 | [AGENT_WEEK_1011](./AGENT_WEEK_1011.md)（V16／#72 已合） |
| 撰寫 | aaaaa |
| 最後更新 | 2026-10-25 |

---

## 0. 三十秒結論

**V17 已合：** [#74](https://github.com/dernoson/endfield-playground/pull/74)／[#76](https://github.com/dernoson/endfield-playground/pull/76) MERGED（#73／#58 CLOSED）。  
**本週 V18＝W1018-A0 ②：** **A＋B 皆交**（驗收步驟 **與** L1 contract lab）。問卷 ≤2h；負責人裁兩者都做。不做引擎大改、不做正式頁表單、不碰 toby C1 鎖檔。開版文件先 commit、**先不開 PR**。

---

## 1. 優先序（必須遵守）

| 序 | 內容 | 工單／文件 |
|----|------|------------|
| ~~0~~ | ~~派工已發（WEEK＋十張工單）~~ | **已完成**；PR [#77](https://github.com/dernoson/endfield-playground/pull/77) |
| ~~1~~ | ~~V17 殘項收斂~~ | **已完成**；[V18-B1](../dev/dev_v18/B1_v17_residue_close.md) |
| ~~2~~ | ~~**②A 驗收步驟**~~ | **已完成**；[C1](../dev/dev_v18/C1_m3_acceptance_steps.md) |
| ~~3~~ | ~~**②B lab** 併入分支~~ | **已 merge**；隨本週 PR；[D1](../dev/dev_v18/D1_l1_lab_pr.md) |
| 4 | 驗收＋回寫（公開 V2） | [E1](../dev/dev_v18/E1_acceptance_and_handoff.md) |
| — | **禁止**改 GridCanvas／LayoutView／MainLayout | 鎖表 WEEK §2.2 |
| — | **禁止**擴大 V17、整包右側產耗、正式頁源素材表單 | W1018-A0 §2 |
| — | **禁止**寫 `editorStore` 的 primaryOutput | 裁決 B |

---

## 2. 禁止表

| 禁止 | 理由 |
|------|------|
| 碰 `GridCanvas.vue`／`LayoutView.vue` | toby T1 鎖 |
| 碰 `MainLayout.vue` | harry 暫停；凍結 |
| 碰 `editorStore` 簽名／雙寫 primaryOutput | 裁決 B；WEEK 退回列 |
| 擴大 V17 引擎／查表重構 | 工單明文；碼已在 #74 |
| 正式頁源素材下拉當本版主交付 | 可延；本週只要證明 |
| 自己開 C1 draft／拉管線 | owner＝toby |
| 公開工單寫入風險等級／個人檔連結 | 公開／私密分界 |
| 發明 detail／定案沒有的範圍 | [AGENT_ROADMAP §6.1](./AGENT_ROADMAP.md) |

---

## 3. 契約形狀（已定／待決分開）

| 項 | 結論 |
|----|------|
| 寫入 | 已有 `setDevicePrimaryOutput`（#72） |
| 引擎讀 | 已決＝經 `toTopology`（#74） |
| 機型查表 | 已有 `resolveMachineDef`（#74） |
| 本版交付 | **②A 步驟清單＋②B lab 合入**（已決 A＋B） |
| 時數 | 問卷 ≤2h；**兩者都做** |
| 解鎖句 | **本版不發** |
| 分支 | **`dev/aaaaa1018`**（已決；自 master 新開） |
| lab 來源 | `origin/dev/aaaaa1019-l1-lab` |
| PR | 開版文件先 commit；**lab／功能 PR 另裁** |

---

## 4. 本週結束應更新

| # | 動作 | 誰／何處 | 狀態 |
|---|------|----------|------|
| 1 | ②A＋②B 可驗收；公開 V2 | aaaaa | `[ ]` |
| 2 | 回寫 todolist_v18 狀態 | Agent／aaaaa | `[~]`（開版） |
| 3 | REVIEW／E3／PENDING 日誌補一行 | 決策層 `1018/` | `[~]`（開版已對齊） |
| 4 | 10/25 驗收結果回寫 WEEK／ROADMAP（V2） | 主編／aaaaa | 結算時 |
| — | **不動** CLAUDE §4.6 索引、AGENT_ROADMAP 版本 | 已知過期，下次一併補 | 維持 |

---

## 5. 驗收對照（公開）

以 [WEEK_20261018 §0.2](../../work_dispatch/WEEK_20261018.md) 為準。aaaaa 對應 **V2**（C5 鏈可演示）。

| 項 | 對象 | 本週目標 |
|----|------|----------|
| **V2** | aaaaa A0 | 源設 primaryOutput 後經引擎／拓樸可測產出；有簡短驗收步驟 **與** lab |
| V1 | toby T1 | 兩 port 拉線——**零檔案交集** |
| V3–V6 | 其餘 | 閘門／DeviceShape／點選稿／C3 加分——**零檔案交集** |

> 判定實況一律以 `git`／`gh` 為準，不以文件宣稱為準。

---

## 6. 日誌

### 2026-11-01（v3.5）

- #79 MERGED；todolist_v18／D1／E1 標結案；執行權改掛 AGENT_WEEK_1026／V19

### 2026-10-25（v3.4）

- 公開 INTRO／ACCEPTANCE／LAB 補埠幾何與 L2 `PortRef` FAQ；開 PR → master

### 2026-10-25（v3.3）

- V18-D1：merge `aaaaa1019-l1-lab`；`/dev/l1-contract-lab` 在分支

### 2026-10-25（v3.2）

- V18-C1：M3 驗收步驟落版；兩測檔 8 passed；下一＝D1 lab

### 2026-10-25（v3.1）

- 負責人確認：A-1＝A＋B；A-2＝`dev/aaaaa1018`；A-3＝先 commit 開版文件、先不開 PR
- M-1／M-2＝非 aaaaa 主責（主編／toby C1／MBD DeviceShape）

### 2026-10-25（v3.0）

- 對齊 `origin/master`；V17 #74／#76 收斂
- 開 V18 執行計畫（todolist_v18＋dev_v18）；分支 `dev/aaaaa1018`
- 決策層 `1018/` 對齊 W1018-A0／V18（REVIEW／INTRO／PENDING／E3）
- 本週主線＝② 驗收步驟或 lab；引擎碼／查表已在 master

### 2026-10-19（公開派工）

- WEEK_20261018 v1.0＋十張工單合入（#77）；roadmap v1.20

### 2026-10-18（v2.x｜V17 超前線・已封存）

- V17＝#73＋#58；#74／#76 MERGED。執行權移交本檔 v3.0／V18
- 舊日誌細節見 [todolist_v17](../dev/todolist_v17.md)
