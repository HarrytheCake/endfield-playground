# V19 TODOLIST — L1 API Hub MVP（本週 aaaaa｜W1026-A0）

**版本：** V19
**建立日期：** 2026-11-01
**負責人：** aaaaa
**前置：** [V18](./todolist_v18.md) 已合 master（[#79](https://github.com/dernoson/endfield-playground/pull/79)）；C1 L2 UI [#78](https://github.com/dernoson/endfield-playground/pull/78) **已合**（2026-10-31）；文件收斂見 [V19-B1](./dev_v19/B1_v18_residue_close.md)
**正式工單：** [W1026-A0](../../work_dispatch/aaaaa/1026/W1026-A0_tutorial_lab_api.md)（確定・tutorial＋Lab／API／詞彙；問卷 ≤2h，**本版接受超標**）
**上游：** [WEEK_20261026](../../work_dispatch/WEEK_20261026.md) **v1.1**、[ROADMAP_OUTLINE](../../roadmap/ROADMAP_OUTLINE.md) **v1.21**、[AGENT_WEEK_1026](../claude/AGENT_WEEK_1026.md)
**週次：** 2026-10-26 → 2026-11-01（問卷週 1026；#78 合入收尾週）
**開發分支：** `dev/aaaaa1026`
**狀態總覽：** **`[x]` 主線完成並已合 master**（[#82](https://github.com/dernoson/endfield-playground/pull/82)，2026-11-02；A–E `[x]`）
**下一批：** [todolist_v20](./todolist_v20.md) 同 PR 已合；[todolist_v21](./todolist_v21.md) **閘門已過、已開版**（本週只開版；見 [AGENT_WEEK_1102](../claude/AGENT_WEEK_1102.md)）
**待確認問題：** [dispatch_private/1026/PENDING_DECISIONS_20261101.md](../collaborator_survey/dispatch_private/1026/PENDING_DECISIONS_20261101.md)（A 組已決；M 組非本責）

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）
>
> **開工閘門：** **V19 實作（C1／D1）開工條件＝V18 收斂完成**（[V19-B1](./dev_v19/B1_v18_residue_close.md) `[x]`）。開版文件可先落檔；**本專案收斂前不要開任何 PR**。
>
> **範圍宣告：** 本版＝在既有 `/dev/l1-contract-lab` 上做 **MVP Hub 骨架**（目錄＋詞彙＋可點測少數 API）；教學優先做在 lab 頁內。全量 catalog、自動同步列後續週。只動 `docs/`、`src/app/dev/*`（及必要的 lab 文案／演示）。**不改**正式畫布鎖檔、不改 store／utils 簽名。
> **執行計畫：** 本檔＋`dev_v19/` **即為**本週 aaaaa 執行計畫檔。

---

## 概述

### 目標

1. **① Tutorial／最短路徑：** 新 clone 能在 lab 頁內跟到「開 dev → lab → 正式頁能做什麼」（過時步驟刪或改）
2. **② MVP Hub 骨架：** 單一真相＝`/dev/l1-contract-lab`——目錄（inventory）＋詞彙白話＋少數 API 可點測
3. **③ 維運規則落文件：** 後續 L1 新增／更新如何進 hub（本周**不做**自動 codegen）
4. **④ 零鎖檔衝突：** 不碰 `LayoutView`／`GridCanvas` 業務；不改 `layoutStore`／`editorStore`／`utils/layout` **簽名**

### 已定案（2026-11-01｜負責人）

| # | 項 | 結論 |
|---|-----|------|
| A-1 | 本周範圍 | **C＝MVP hub 骨架**；全量 catalog 後續週 |
| A-2 | Hub 邊界（長期） | **layout utils ＋ layoutStore 公開 action ＋（可選）驗證／引擎 adapter** |
| A-3 | 頁面 | **延續並強化** `/dev/l1-contract-lab`（單一真相） |
| A-4 | 自動顯示 | **本周不做自動**；只寫後續維運規則 |
| A-5 | Tutorial | **教學主要在 lab／hub 頁內**（給無經驗者優先） |
| A-6 | 分支 | **`dev/aaaaa1026`** |
| A-7 | 時數 | 問卷 ≤2h；**接受本周超標** |

詳見 [A1_scope_decision.md](./dev_v19/A1_scope_decision.md)。

### 非目標（本版不做）

- 全量 catalog 一次列完（後續週）
- JSDoc／codegen 自動同步進 hub
- 另開第二個 hub 路由（如 `/dev/l1-api-hub`）
- 改 `LayoutView`／`GridCanvas`／`MainLayout` 正式互動
- 改 `layoutStore`／`editorStore`／L1 純函式**簽名**（除非修 lab 演示必要且先問 D0）
- 整包右側產耗、再寫長篇派工當第二主交付
- 發解鎖句

### 流程大綱

```text
A 定案 → B V18／#78 收斂（前置）
      → C1 Hub 骨架（目錄＋詞彙＋頁內教學入口）
      → D1 可點測少數 API（補缺口／對齊 master）
      → E1 維運規則＋驗收／交接（公開 V2）
```

### 週切片

| 區間 | 切片 | 對應 |
|------|------|------|
| → 11/01 | 定案落檔；V18 收斂；MVP 骨架＋少數點測 | A1、B1、C1、D1 |
| 11/01 | 公開 **V2**（tutorial／Lab 可跟） | E1 |

### 下游消費者（若開 PR 必寫）

```text
下游消費者：
- 無開發經驗協作者：lab 頁內教學＋詞彙，可跟做最短路徑
- L2／驗證／引擎串接：以 lab＋contractCatalog 為查 API 入口
- 後續週全量 catalog：沿本版目錄骨架擴充，不另開第二真相源
```

### 交付宣告

```text
本版交付 W1026-A0：強化 /dev/l1-contract-lab 為 L1 Hub MVP（目錄＋詞彙＋少數可點測 API）＋頁內教學最短路徑＋維運規則。
不改 L1／store 簽名、不碰正式畫布。全量 catalog／自動同步列後續。不發解鎖句。
```

---

## V19-A｜範圍與定案

- [x] **V19-A1** 開版決策落版；與 W1026-A0／V18／鎖表邊界（2026-11-01）
    - 細項：[dev_v19/A1_scope_decision.md](./dev_v19/A1_scope_decision.md)

---

## V19-B｜V18／上週殘項收斂（前置・**實作閘門**）

- [x] **V19-B1** 確認 #79／#78 在 master；todolist_v18 結案；公開 WEEK 若仍寫 #78 OPEN 僅知悉（主編結算改）（2026-11-01）
    - 細項：[dev_v19/B1_v18_residue_close.md](./dev_v19/B1_v18_residue_close.md)
    - **本項 `[x]`＝V19 實作開工條件已滿足**

---

## V19-C｜Hub 骨架（目錄＋詞彙＋頁內教學）

- [x] **V19-C1** 在 `/dev/l1-contract-lab` 加：長期邊界目錄（inventory）、詞彙入口強化、頁內「最短路徑／給無經驗者」教學區（2026-11-01）
    - 細項：[dev_v19/C1_hub_skeleton.md](./dev_v19/C1_hub_skeleton.md)
    - 產物：`L1ContractLab.vue`／`contractCatalog.ts`（及 USAGE／LAB 互連）
    - 對照公開驗收：**V2**

---

## V19-D｜可點測少數 API（對齊 master）

- [x] **V19-D1** 補／修正少數可點測案例（`hitTestPortAt`＋`prefer`、`buildConnectionWaypoints`）（2026-11-01）
    - 細項：[dev_v19/D1_clickable_api_samples.md](./dev_v19/D1_clickable_api_samples.md)
    - 產物：lab V15 分頁新增按鈕；catalog／inventory 對齊

---

## V19-E｜維運規則、驗收、交接

- [x] **V19-E1** 寫「後續 L1 進 hub」維運規則；對齊公開 V2；回寫 todolist／AGENT_WEEK／決策層（2026-11-01）
    - 細項：[dev_v19/E1_ops_rules_and_handoff.md](./dev_v19/E1_ops_rules_and_handoff.md)
    - **PR：** 主線已收斂；開 PR → master **另裁**（本項不強制 push）

---

## V19-F｜下一批交接（非本週必交程式）

- [x] **V19-F0** 盤點 inventory `todo`；裁下一批 P0／P1 清單落檔（2026-11-01）
    - 細項：[dev_v19/F0_next_catalog_batch.md](./dev_v19/F0_next_catalog_batch.md)
    - 承接草案：[todolist_v20](./todolist_v20.md)
    - **本項只交文件**；實作屬 V20（或下一週正式工單）

---

## 封鎖／待決追蹤

| ID | 原因 | 等待對象 | 阻擋本版？ | 何時決 |
|----|------|----------|------------|--------|
| ~~PENDING A-1～A-7~~ | ~~範圍／頁／自動／教學／分支／時數~~ | — | **已決**（見上表） | 2026-11-01 |
| WEEK M 組 | #78 結算勾選、DeviceShape／P2 等 | **主編／各 owner**（**非** aaaaa） | **否** | 結算 |
| — | **不動** LayoutView／GridCanvas 業務、store／L1 簽名 | — | — | 本版硬鎖 |

---

## 完成定義（Definition of Done）

### 主線（對照 [W1026-A0 §3](../../work_dispatch/aaaaa/1026/W1026-A0_tutorial_lab_api.md)）

- [x] tutorial 可跟做（lab 頁內最短路徑；USAGE／LAB 互連）
- [x] `/dev/l1-contract-lab` 從 DevLayout 找得到（既有；本版強化）
- [x] 詞彙／API 說明有白話入口（頁內）
- [x] Hub 有目錄骨架（標出已列／待列；對齊 A-2 長期邊界）
- [x] 少數 API 可點測且與 master 契約一致
- [x] 維運規則已寫（不做自動同步；頁內摘要＋E1）
- [x] 未改 C1／正式畫布鎖檔；未改 store／L1 簽名

### 品質閘（有碼 PR 時）

- [x] type-check／lint／format 綠（實作後已跑）
- [x] diff 主要在 `docs/`、`src/app/dev/*`
- [x] 不發解鎖句

---

## 未交頂替

| 工項 | 未交影響 |
|------|----------|
| C1 Hub 骨架 | 公開 **V2** 缺可查入口；下游仍靠散落 USAGE |
| D1 點測 | 無經驗者無法自測；僅有靜態表 |
| E1 維運規則 | 後續週全量 catalog 無約定，易雙源 |
| B1 收斂 | 文件狀態漂移；不擋程式 |

---

## 本週工項檢核（對照 W1026-A0）

| 工項 | 工單要求 | V19 狀態 | 備註 |
|------|----------|----------|------|
| ① | Tutorial 對齊現況 | `[x]` | 頁內「入門」5 步 |
| ② | Lab／API／詞彙可查 | `[x]` | 入門／詞彙／目錄＋USAGE／LAB |
| ③ | API 與 master 一致 | `[x]` | D1：prefer＋waypoints |
| 邊界 | 未改鎖檔 | `[x]` | 僅 docs／`src/app/dev/*` |

---

## 開發日誌

### 2026-11-08｜#82 已合

- V19＋V20 收斂完畢；V21 開版見 [todolist_v21](./todolist_v21.md)

### 2026-11-01｜V20 正式開版（交接）

- V20-A1 `[x]`；實作走 C1（同分支 `dev/aaaaa1026`）
- V19 本身仍：**開 PR 待裁**

### 2026-11-01｜V19-F0 下一批清單

- inventory 待列盤點；其後由 V20-A1 正式承接

### 2026-11-01｜V19-E1 驗收完成

- 維運規則落版（E1 §1＋入門頁摘要）；公開 V2 驗收表通過
- 主線結案；**開 PR 待裁**

### 2026-11-01｜V19-D1 可點測補強

- `hitTestPortAt prefer（緊貼）`、`buildConnectionWaypoints`；下一＝**E1**

### 2026-11-01｜V19-C1 Hub 骨架完成

- `/dev/l1-contract-lab`：入門／詞彙／目錄分頁；catalog inventory 骨架
- 下一刀＝**D1 可點測少數 API**

### 2026-11-01｜開版文件 commit；V18 收斂完成

- V18 todolist／D1／E1 標結案（#79）；B1 `[x]` → **實作閘門開**
- 約束：**本專案收斂前不開任何 PR**
- 下一刀＝**C1 Hub 骨架**

### 2026-11-01｜開版

- 對齊 `origin/master`（含 #78／#79／#81 等）
- 依 WEEK v1.1／W1026-A0 開 V19；分支 `dev/aaaaa1026`
- 負責人裁 A-1＝C、A-2＝layout utils＋layoutStore＋可選驗證／引擎、A-3＝強化既有 lab、A-4＝只寫維運、A-5＝頁內教學、A-7＝接受超標
- 決策層 `dispatch_private/1026/`＋`AGENT_WEEK_1026` 同步建立
- 開工條件＝V18 收斂（B1）
