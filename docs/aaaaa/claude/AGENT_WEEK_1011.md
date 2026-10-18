# Agent 週摘要｜2026-10-11 → 10-18（1011｜C5 寫入 action｜V16）

| meta | value |
|------|-------|
| version | **v1.5（2026-10-18；V16-C1 完成）** |
| 用途 | Agent 執行本週派工／改工單時的強制約束 |
| 公開 | [WEEK_1011](../../work_dispatch/WEEK_20261011.md) v1.2、[W1011-A0](../../work_dispatch/aaaaa/1011/W1011-A0_c5_primary_output.md) |
| 執行計畫 | [todolist_v16](../dev/todolist_v16.md)、[dev_v16/](../dev/dev_v16/) |
| 決策層 | [1011/REVIEW](../collaborator_survey/dispatch_private/1011/REVIEW_20261011.md)、[1011/E3](../collaborator_survey/dispatch_private/1011/E3_risk_backup_staffing.md)、[1011/PENDING](../collaborator_survey/dispatch_private/1011/PENDING_DECISIONS_20261018.md)、[1011/INTRO](../collaborator_survey/dispatch_private/1011/INTRO_A0_c5_primary_output.md) |
| 操作總則 | [AGENT_ROADMAP](./AGENT_ROADMAP.md)（v1.6；檔案地圖仍指 0907，已知過期） |
| 撰寫 | aaaaa |
| 最後更新 | 2026-10-18 |

---

## 0. 三十秒結論

**V16-C1 已完成：`layoutStore.setDevicePrimaryOutput`＋測試＋進歷史。**  
下一刀＝E1 開 PR（body 註明引擎讀＝經 `toTopology`）。  
toby＝設備拖曳；C1＝toby（10/18 週）——**禁止**改 GridCanvas／LayoutView。  
引擎讀取實作＝**下週**；正式頁表單＝不在本版。

---

## 1. 優先序（必須遵守）

| 序 | 內容 | 工單／文件 |
|----|------|------------|
| ~~0~~ | ~~派工已發（WEEK＋十張工單）~~ | **已完成**；PR #66 |
| ~~1~~ | ~~V15 殘項收斂~~ | **已完成**；[V16-B1](../dev/dev_v16/B1_v15_residue_close.md) |
| ~~2~~ | ~~② `setDevicePrimaryOutput`＋測試＋進歷史~~ | **已完成**；[V16-C1](../dev/dev_v16/C1_set_device_primary_output.md) |
| ~~3~~ | ~~引擎讀接法定案~~ | **已決＝toTopology**；[V16-D1](../dev/dev_v16/D1_engine_read_path.md)（PR body 待寫） |
| 4 | 驗收＋開 PR | [V16-E1](../dev/dev_v16/E1_acceptance_and_handoff.md) |
| — | **禁止**改 GridCanvas／LayoutView／MainLayout／ToolbarPanel | 鎖表 WEEK §2.2 |
| — | **禁止**本週做引擎整包改掛／右側產耗表／正式頁表單 | C5 週切片 |
| — | **禁止**寫 `editorStore` 的 primaryOutput | 裁決 B |

---

## 2. 禁止表

| 禁止 | 理由 |
|------|------|
| 碰 `GridCanvas.vue`／`LayoutView.vue` | toby T2 鎖 |
| 碰 `MainLayout.vue` | harry H2 鎖 |
| 碰 `ToolbarPanel.vue` | goodmorning；arm 不准刪 |
| 碰 `src/app/StatsPanel/*`／`MachineCard` 內部 | shirone |
| 碰 `src/editor/layout/shapes/*` | G／S／avery 各自樣式 |
| 碰 `src/lib/validation/detectors/*` | azure Z2 |
| 寫 `editorStore` 的 primaryOutput／雙寫 | 裁決 B＝唯一寫入點 layoutStore |
| 引擎改掛／watch layoutStore 整包 | 排 10/18→10/25；本版只註記 |
| 正式頁源素材下拉 UI | 可延；本週只要 action |
| 自己開 C1 draft／拉管線 | owner＝toby；10/18 週 |
| 公開工單寫入風險等級／個人檔連結 | 公開／私密分界 |
| 發明 detail／定案沒有的範圍 | [AGENT_ROADMAP §6.1](./AGENT_ROADMAP.md) |

---

## 3. 契約形狀（已定／待決分開）

| 項 | 結論 |
|----|------|
| 簽章 | `setDevicePrimaryOutput(uid, itemId \| null, ratePerMin?) → void` |
| 行為 | 寫 `PlacedDevice.primaryOutput`／`sourceRatePerMin`；進歷史；可 Undo |
| 未知 uid | **靜默 no-op，且不進歷史** |
| 預設速率 | 省略＝**30**／min |
| 清除 | `itemId === null` |
| store | **僅** `layoutStore` |
| 歷史型別 | **已決**＝`MachineRecipeChange` |
| 引擎讀取 | **已決**＝經 `toTopology`；本版只寫 PR |
| 解鎖句 | **本版不發** |
| 分支 | `dev/aaaaa1011` |

---

## 4. 本週結束應更新

| # | 動作 | 誰／何處 | 狀態 |
|---|------|----------|------|
| 1 | C5 action 合入；roadmap C5 狀態句 | aaaaa | `[ ]` |
| 2 | 回寫 todolist_v16 狀態 | Agent／aaaaa | `[ ]` |
| 3 | REVIEW／E3／PENDING 日誌補一行 | 決策層 `1011/` | `[~]`（開版已補 INTRO） |
| 4 | 10/18 驗收結果回寫 WEEK／ROADMAP（V8） | 主編／aaaaa | 結算時 |
| 5 | 下週引擎讀切片開工前確認 PR 註記 | aaaaa | 合入後 |
| — | **不動** CLAUDE §4.6 索引、AGENT_ROADMAP 版本 | 已知過期，下次一併補 | 維持 |

---

## 5. 驗收對照（公開）

以 [WEEK_20261011 §0.2](../../work_dispatch/WEEK_20261011.md) 為準。aaaaa 對應 **V8**（C5 寫入 action）。

| 項 | 對象 | 本週目標 |
|----|------|----------|
| **V8** | aaaaa A0 | `setDevicePrimaryOutput` 在 `layoutStore`；有測試 |
| V1 | toby T2 | 設備可拖——**零檔案交集** |
| V2–V7／V9 | 其餘 | 左面板／樣式／#64／閘門——**零檔案交集** |

> 判定實況一律以 `git`／`gh` 為準，不以文件宣稱為準。

---

## 6. 日誌

### 2026-10-18（v1.5）

- V16-C1 完成：`setDevicePrimaryOutput`＋測試；品質閘 929 綠；下一＝E1 開 PR

### 2026-10-18（v1.4）

- 負責人確認：D-1＝`MachineRecipeChange`；D-2＝經 `toTopology`；未知 uid＝no-op 不進歷史
- 回寫 todolist_v16／A1／C1／D1／PENDING／INTRO

### 2026-10-18（v1.3）

- 對齊 `origin/master`；V15 #60／#65 收斂
- 開 V16 執行計畫（todolist_v16＋dev_v16）；分支 `dev/aaaaa1011`
- 決策層補 INTRO；PENDING 加 D-1／D-2（歷史型別／引擎接法）
- 本週主線＝C5 寫入 action；引擎讀／表單仍非本版

### 2026-10-13（v1.2）

- PR #66 裁決回寫；C1 owner＝toby

### 2026-10-12（v1.0–v1.1）

- 會議重派；AGENT_WEEK 初版（派工約束）
