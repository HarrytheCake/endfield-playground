# Agent 週摘要｜2026-11-01 起（1102｜Hub catalog 第一刀｜V20）

| meta | value |
|------|-------|
| version | **v1.5（2026-11-01；V21 前提＝V19＋V20 收斂；PR 待裁）** |
| 用途 | Agent 執行本版 catalog 補齊時的強制約束 |
| 公開 | 尚無新 WEEK；延續依據＝[V19-F0](../dev/dev_v19/F0_next_catalog_batch.md)、[V19-E1](../dev/dev_v19/E1_ops_rules_and_handoff.md) |
| 執行計畫 | [todolist_v20](../dev/todolist_v20.md)、[dev_v20/](../dev/dev_v20/)；下一批草案 [todolist_v21](../dev/todolist_v21.md)、[A0](../dev/dev_v21/A0_tryout_panel_plan.md) |
| 決策層 | [1102/PENDING](../collaborator_survey/dispatch_private/1102/PENDING_DECISIONS_20261101.md) |
| 上週 | [AGENT_WEEK_1026](./AGENT_WEEK_1026.md)（V19 主線完成；PR 待裁） |
| 撰寫 | aaaaa |
| 最後更新 | 2026-11-01 |

---

## 0. 三十秒結論

**V20 主線完成。** F0 四項已 listed＋可點測。  
**下一批已定案（文件）：** 輕量試玩／非 Swagger——[F1](../dev/dev_v20/F1_tryout_not_swagger.md)；牌程 [A0](../dev/dev_v21/A0_tryout_panel_plan.md)。  
**V21 硬閘：** 須 **V19＋V20 收斂完畢（合 master）** 後才開 V21-A1／實作。現況：**未開 PR → 未收斂**。  
分支 **`dev/aaaaa1026`**。下一優先＝**開／合 PR**（非 V21 實作）。

---

## 1. 優先序（必須遵守）

| 序 | 內容 | 工單／文件 |
|----|------|------------|
| ~~0~~ | ~~開版定案~~ | **已完成**；[V20-A1](../dev/dev_v20/A1_scope_decision.md) |
| ~~1~~ | ~~P0 點測／定義表~~ | **已完成**；[V20-C1](../dev/dev_v20/C1_port_resolve_demos.md) |
| ~~2~~ | ~~P1 點測／定義表~~ | **已完成**；[V20-D1](../dev/dev_v20/D1_pipeline_gap_demos.md) |
| ~~3~~ | ~~驗收／USAGE~~ | **已完成**；[V20-E1](../dev/dev_v20/E1_acceptance_and_handoff.md) |
| ~~3b~~ | ~~試玩／非 swagger 決策＋牌程~~ | **已完成**；[F1](../dev/dev_v20/F1_tryout_not_swagger.md)、[A0](../dev/dev_v21/A0_tryout_panel_plan.md) |
| 4 | **開 PR → 合 master**（V19＋V20 收斂＝V21 硬閘） | E1 §3；[todolist_v21](../dev/todolist_v21.md) GATE |
| 5 | （收斂後）V21-A1 正式開版 | [todolist_v21](../dev/todolist_v21.md) |
| — | **禁止**改 LayoutView／GridCanvas 業務 | 硬鎖 |
| — | **禁止**改 layoutStore／editorStore／utils/layout **簽名** | 硬鎖 |
| — | **禁止**另開第二 hub／全量 catalog／codegen／完整 Swagger | A-1／A-2／A-3／F1 |
| — | **禁止**在 V19＋V20 未合 master 前開 V21 實作 | F1 D-6／todolist_v21 閘門 |

---

## 2. 禁止表

| 禁止 | 理由 |
|------|------|
| 碰正式畫布業務 | 只 docs／dev |
| 改 store／L1 簽名 | lab 只呼叫 |
| 另開第二 hub 路由 | 單一真相 |
| 一次填滿 F0 §2.3 | 超標 |
| 發明公開工單沒有的範圍 | 本版範圍＝F0；公開編號後只回填 |

---

## 3. 契約形狀

| 項 | 結論 |
|----|------|
| 本版交付 | catalog 第一刀：四項 listed＋可點測（含 gap inventory） |
| 頁面 | `/dev/l1-contract-lab` |
| 維運 | V19-E1 人工規則 |
| 分支 | `dev/aaaaa1026` |
| 解鎖句 | 不發 |
| PR | **主線完成；開 PR 另裁** |

---

## 4. 本版結束應更新

| # | 動作 | 狀態 |
|---|------|------|
| 1 | C1／D1／E1 | `[x]` |
| 2 | todolist_v20 結案 | `[x]` |
| 3 | USAGE／LAB | `[x]` |
| 4 | 公開工單編號回填（若有） | 待 |
| 5 | 開 PR | `[ ]`（**另裁**） |
| 6 | V21 試玩決策／牌程 | `[x]`（草案；實作未開） |

---

## 5. 日誌

### 2026-11-01（v1.5）

- 確認 V21 前提＝V19＋V20 收斂（合 master）；牌0 改硬閘；現況未收斂

### 2026-11-01（v1.4）

- F1：輕量試玩／非 swagger；V21 A0 牌程 0→4；todolist_v21 草案

### 2026-11-01（v1.3）

- V20-E1：驗收通過；主線結案；PR 另裁

### 2026-11-01（v1.2）

- V20-D1：gap waypoints＋addPipeline／removePipeline；下一＝E1

### 2026-11-01（v1.1）

- V20-C1：findPortAt vs hitTestPortAt、resolveConnections；下一＝D1

### 2026-11-01（v1.0）

- V20-A1 正式開版；下一＝C1
