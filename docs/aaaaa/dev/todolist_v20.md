# V20 TODOLIST — Hub catalog 下一批補齊（本版 aaaaa｜V19-F0 延續）

**版本：** V20
**建立日期：** 2026-11-01
**負責人：** aaaaa
**前置：** [V19](./todolist_v19.md) 主線完成；本版與 V19 已由 [#82](https://github.com/dernoson/endfield-playground/pull/82) 合入（2026-11-02）。輸入清單 [V19-F0](./dev_v19/F0_next_catalog_batch.md)
**正式依據：** [V19-F0](./dev_v19/F0_next_catalog_batch.md)、[V19-E1 維運](./dev_v19/E1_ops_rules_and_handoff.md)；公開 WEEK／Wxxxx **待補編號**（不擋本版）
**上游：** [todolist_v19](./todolist_v19.md)、[AGENT_WEEK_1102](../claude/AGENT_WEEK_1102.md)
**週次：** 2026-11-01 起（接 1026 週之後；內部延續）
**開發分支：** `dev/aaaaa1026`（接續 V19）
**狀態總覽：** **`[x]` 主線完成並已合 master**（2026-11-02 [#82](https://github.com/dernoson/endfield-playground/pull/82)；A–E `[x]`）
**下一批：** [V20-F1](./dev_v20/F1_tryout_not_swagger.md) → [todolist_v21](./todolist_v21.md)（**閘門已過**；2026-11-08 已開版，牌 2 未開工）
**待確認問題：** [dispatch_private/1102/PENDING_DECISIONS_20261101.md](../collaborator_survey/dispatch_private/1102/PENDING_DECISIONS_20261101.md)（A 組已決）

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中
>
> **開工閘門：** **V20 實作（C1）開工條件＝A1 定案**（本項已滿足）。不另等 V19 PR 合入。
>
> **範圍宣告：** 延續 `/dev/l1-contract-lab`，依 F0 將 **P0／P1 四項** `todo`→`listed`＋可點測。**不**一次填滿全量；**不**做 codegen；**不改**正式畫布／store／L1 簽名。
> **執行計畫：** 本檔＋`dev_v20/` **即為**本版執行計畫檔。

---

## 概述

### 目標

1. **P0：** `findPortAt`／錨點（對照熱區）、`resolveConnections` → 定義表＋可點測
2. **P1：** `addPipeline`／`removePipeline`、`buildGapConnectionWaypoints`（inventory 新列）→ 可點測
3. **維運：** 遵守 V19-E1；單一 hub 不變

### 已定案（2026-11-01｜正式開版）

| # | 項 | 結論 |
|---|-----|------|
| A-1 | 範圍 | **＝F0 §2.1**；§2.3 不做 |
| A-2 | 頁面 | **`/dev/l1-contract-lab`** |
| A-3 | 自動同步 | **不做** |
| A-4 | 分支 | **`dev/aaaaa1026`** |
| A-5 | 解鎖句 | **不發** |
| A-6 | 時數 | 以切片做完為準（可超標） |
| A-7 | 閘門 | A1 後即可 C1（不另等 V19 PR） |

詳見 [A1_scope_decision.md](./dev_v20/A1_scope_decision.md)。

### 非目標

- 全量 layout utils／全部 store computed 一次列完
- detectors／E001 全掛（可選，另刀）
- 改 `LayoutView`／`GridCanvas`／store／utils 簽名
- 另開第二 hub 路由
- JSDoc／codegen 自動同步

### 流程大綱

```text
A1 定案 → C1 P0 點測／定義表
       → D1 P1 點測／定義表（含 gap inventory）
       → E1 驗收／USAGE／週摘要
```

### 下游消費者（若開 PR 必寫）

```text
下游消費者：
- L2／無經驗協作者：熱區 vs findPortAt、resolveConnections、管線寫入、gap waypoints 可自測
- 後續 catalog：沿同一 hub；勿另開第二真相源
```

### 交付宣告

```text
本版交付：L1 Hub catalog 第一刀補齊（findPortAt／resolveConnections／addPipeline／buildGapConnectionWaypoints）。
不改 L1／store 簽名、不碰正式畫布。全量 catalog／自動同步仍後續。不發解鎖句。
```

---

## V20-A｜開版

- [x] **V20-A1** 覆核 F0；定案；建 `dev_v20/`；AGENT／決策層（2026-11-01）
    - 細項：[dev_v20/A1_scope_decision.md](./dev_v20/A1_scope_decision.md)
    - **本項 `[x]`＝C1 開工條件已滿足**

---

## V20-C｜P0 可點測／定義表

- [x] **V20-C1** `findPortAt`／`collectPortAnchors`（對照 `hitTestPortAt`）＋`resolveConnections`（2026-11-01）
    - 細項：[dev_v20/C1_port_resolve_demos.md](./dev_v20/C1_port_resolve_demos.md)
    - 產物：lab V15 兩鈕；inventory／定義表 listed

---

## V20-D｜P1 可點測／定義表

- [x] **V20-D1** `addPipeline`／`removePipeline`＋`buildGapConnectionWaypoints`（inventory 新列）（2026-11-01）
    - 細項：[dev_v20/D1_pipeline_gap_demos.md](./dev_v20/D1_pipeline_gap_demos.md)
    - 產物：lab V15 gap＋V16 add／remove；catalog listed

---

## V20-E｜驗收／交接

- [x] **V20-E1** USAGE／LAB／AGENT 回寫；本批 inventory 清乾淨；品質閘（2026-11-01）
    - 細項：[dev_v20/E1_acceptance_and_handoff.md](./dev_v20/E1_acceptance_and_handoff.md)
    - DoD 對照 [F0 §6](./dev_v19/F0_next_catalog_batch.md)
    - **PR：** 主線已收斂；開／與 V19 同 PR **另裁**

---

## V20-F｜下一批決策（非本版實作）

- [x] **V20-F1** Lab＝輕量可調參試玩；**不做**完整 Swagger（2026-11-01）
    - 細項：[dev_v20/F1_tryout_not_swagger.md](./dev_v20/F1_tryout_not_swagger.md)
    - 牌程／草案：[todolist_v21](./todolist_v21.md)、[A0](./dev_v21/A0_tryout_panel_plan.md)

---

## 封鎖／待決追蹤

| ID | 原因 | 等待對象 | 阻擋本版？ | 何時決 |
|----|------|----------|------------|--------|
| ~~A-1～A-7~~ | ~~開版範圍／分支／閘門~~ | — | **已決** | 2026-11-01 |
| 公開 WEEK／工單編號 | 回填 meta | 主編／派工 | **否** | 有檔再補 |
| PR → master | 開／拆 PR | 負責人 | **否**（主線已收） | 另裁 |
| — | **不動**畫布／簽名 | — | — | 硬鎖 |

---

## 完成定義（Definition of Done）

### 主線

- [x] F0 P0 兩項 listed＋可點測（C1）
- [x] F0 P1 兩項 listed＋可點測（D1）
- [x] `buildGapConnectionWaypoints` 進 inventory
- [x] 未改鎖檔／簽名（C1／D1 已核）
- [x] 未做 F0 §2.3 全量
- [x] 不發解鎖句

### 品質閘（有碼時）

- [x] type-check／lint／format 綠（C1／D1）
- [x] diff 主要在 `docs/`、`src/app/dev/*`

---

## 未交頂替

| 工項 | 未交影響 |
|------|----------|
| C1 | 熱區／錨點／連線解析仍只靠 dont 句 |
| D1 | 管線寫入／gap waypoints 無自測 |
| E1 | USAGE／週摘要漂移 |

---

## 開發日誌

### 2026-11-08｜#82 已合

- 本版與 V19 同 PR 收斂；V21-A1 另分支 `dev/aaaaa1102`

### 2026-11-01｜V20-F1 試玩決策

- 定案：輕量可調參；非 swagger；V21 草案＋牌程已備

### 2026-11-01｜V20-E1 驗收完成

- 驗收表通過；USAGE／LAB／AGENT 回寫；主線結案
- **開 PR 待裁**（可與 V19 同線）

### 2026-11-01｜V20-D1 完成

- buildGapConnectionWaypoints、addPipeline／removePipeline 可點測；inventory listed
- 下一＝**E1**

### 2026-11-01｜V20-C1 完成

- findPortAt vs hitTestPortAt、resolveConnections 可點測；inventory／定義表 listed
- 下一＝**D1**

### 2026-11-01｜V20-A1 正式開版

- 範圍鎖定 F0 §2.1；分支接續 `dev/aaaaa1026`
- `dev_v20/` A1／C1／D1／E1 就緒；下一＝**C1**

### 2026-11-01｜草案建立

- 承接 V19-F0；其後升級為正式開版
