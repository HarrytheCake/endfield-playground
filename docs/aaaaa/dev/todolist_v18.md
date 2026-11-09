# V18 TODOLIST — M3 引擎讀驗收＋lab（本週 aaaaa｜W1018-A0）

**版本：** V18
**建立日期：** 2026-10-25
**負責人：** aaaaa
**前置：** [V17](./todolist_v17.md) 已合 master（[#74](https://github.com/dernoson/endfield-playground/pull/74)／[#76](https://github.com/dernoson/endfield-playground/pull/76)）；文件收斂見 [V18-B1](./dev_v18/B1_v17_residue_close.md)
**正式工單：** [W1018-A0](../../work_dispatch/aaaaa/1018/W1018-A0_m3_engine_lab.md)（確定・兩件；本版實作＝② **A＋B**：驗收步驟 **與** lab 合入）
**上游：** [WEEK_20261018](../../work_dispatch/WEEK_20261018.md) **v1.0**、[ROADMAP_OUTLINE](../../roadmap/ROADMAP_OUTLINE.md) **v1.20**、[C5](../../roadmap/detail/C5_source_primary_output.md)、[AGENT_WEEK_1018](../claude/AGENT_WEEK_1018.md)
**週次：** 2026-10-18 → 2026-10-25（連線月第三週；**M3＝10/25**）
**開發分支：** `dev/aaaaa1018`
**狀態總覽：** **`[x]` 已結案**（2026-11-01；[#79](https://github.com/dernoson/endfield-playground/pull/79) MERGED；文件收斂見 [V19-B1](./dev_v19/B1_v18_residue_close.md)）
**待確認問題：** [dispatch_private/1018/PENDING_DECISIONS_20261025.md](../collaborator_survey/dispatch_private/1018/PENDING_DECISIONS_20261025.md)（A-1 已決；M-1／M-2 非本責）

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）
>
> **範圍宣告：** 本版＝W1018-A0 ②：**A＋B 皆交**——（A）M3 彩排用「源素材→拓樸／引擎可測」步驟清單，**與**（B）`dev/aaaaa1019-l1-lab` 開 PR 合入。時數目標仍對齊問卷 ≤2h（負責人已裁兩者都做）。不做正式頁源素材下拉、不做整包右側產耗、不擴大 V17 引擎重構、不碰 toby C1 鎖檔。
> **執行計畫：** 本檔＋`dev_v18/` **即為**本週 aaaaa 執行計畫檔。

---

## 概述

### 目標

1. **① 派工已發：** WEEK＋十張工單已在 master（[#77](https://github.com/dernoson/endfield-playground/pull/77)）——**不列本版實作**
2. **② A＋B（已決）：**
   - **A：** 短文驗收步驟——放源設備 → `setDevicePrimaryOutput` → 經 `toTopology`／既有路徑看到產出速率；失敗看哪
   - **B：** 將 L1 contract lab（`dev/aaaaa1019-l1-lab`）開 PR 進 master
3. **零鎖檔衝突：** 不碰 `GridCanvas`／`LayoutView`（toby T1）、`MainLayout`（凍結）
4. **V17 文件收斂：** todolist／G1／H3 對齊「#74／#76 已合 master」

### 已定案（2026-10-25｜開版＋負責人確認）

| # | 項 | 結論 |
|---|-----|------|
| 1 | 版本範圍 | **V18＝W1018-A0 ②**；①派工已完成不列實作 |
| 2 | 寫入／引擎讀碼 | **已在 master**（#72／#74）；本版**不**再改引擎大包 |
| 3 | ② 範圍 | **已決＝A＋B**（驗收步驟 **與** lab 合入） |
| 4 | 時數 | 問卷 ≤2h；**負責人裁兩者都做**（超標可接受） |
| 5 | 解鎖句 | **不發** |
| 6 | 分支 | **已決＝`dev/aaaaa1018`**（自 `origin/master` 新開；與已合入之 V17 舊線同名無關） |

詳見 [A1_scope_decision.md](./dev_v18/A1_scope_decision.md)。

### 非目標（本版不做）

- 正式頁源素材下拉／左面板表單（C5 UI）
- 整包右側產耗（roadmap D1）
- 擴大 V17 範圍、再開大包引擎重構
- 改 `LayoutView`／`GridCanvas`（toby C1）、`MainLayout`
- 改 `editorStore` 簽名、旋轉／Delete
- 發解鎖句

### 流程大綱

```text
A 定案 → B V17 收斂（前置）
      → C1 ②A 驗收步驟
      → D1 ②B lab PR（可與 C1 平行）
      → E1 驗收＋交接（對齊公開 V2）
```

### 週切片

| 區間 | 切片 | 對應 |
|------|------|------|
| → 10/25 | V17 已合；開 V18；② A＋B | A1、B1、C1、D1 |
| 10/25＝M3 | 公開 **V2**（C5 鏈可演示） | E1 |

### 下游消費者（若開 PR 必寫）

```text
下游消費者：
- M3 彩排／主編驗收：照 C1 步驟可重跑源→引擎產出
- toby T1（C1 UI）：只呼叫既有 hitTestPortAt／canConnect／addPipeline；本版零檔案交集
- 日後左面板表單：仍只呼叫 setDevicePrimaryOutput
```

### 交付宣告

```text
本版交付 W1018-A0 ②：M3 用 C5 讀取鏈驗收步驟 **與** L1 contract lab 合入（A＋B）。
不改引擎大包、不做正式頁表單、不碰 C1 鎖檔。不發解鎖句。
```

---

## V18-A｜範圍與定案

- [x] **V18-A1** 開版決策落版；與 W1018-A0／V17／鎖表邊界（2026-10-25）
    - 細項：[dev_v18/A1_scope_decision.md](./dev_v18/A1_scope_decision.md)

---

## V18-B｜V17 殘項收斂（前置）

- [x] **V18-B1** 確認 #74／#76 在 master；todolist_v17／G1／H3 指向已合入
    - 細項：[dev_v18/B1_v17_residue_close.md](./dev_v18/B1_v17_residue_close.md)

---

## V18-C｜②A 驗收步驟（必做）

- [x] **V18-C1** M3 彩排用「源→`setDevicePrimaryOutput`→`toTopology`／引擎可測」短文（2026-10-25）
    - 細項：[dev_v18/C1_m3_acceptance_steps.md](./dev_v18/C1_m3_acceptance_steps.md)
    - 對照公開驗收：**V2**；本機兩測檔 8 passed

---

## V18-D｜②B Lab 合入（必做）

- [x] **V18-D1** lab 已合 master（[#79](https://github.com/dernoson/endfield-playground/pull/79)，2026-10-25）
    - 細項：[dev_v18/D1_l1_lab_pr.md](./dev_v18/D1_l1_lab_pr.md)
    - 產物：`/dev/l1-contract-lab`＋[USAGE](./USAGE_l1_contract_lab.md)

---

## V18-E｜驗收、交接

- [x] **V18-E1** 對齊公開 V2；文件收斂（2026-11-01｜V19-B1）
    - 細項：[dev_v18/E1_acceptance_and_handoff.md](./dev_v18/E1_acceptance_and_handoff.md)

---

## 封鎖／待決追蹤

| ID | 原因 | 等待對象 | 阻擋本版？ | 何時決 |
|----|------|----------|------------|--------|
| ~~PENDING A-1~~ | ~~② A 或 B~~ | — | **已決＝A＋B** | 2026-10-25 |
| WEEK M-1／M-2 | C1 彎折草稿；DeviceShape 掛載 | **主編／toby／MBD**（**非** aaaaa） | **否** | 見 PENDING |
| — | **不動** GridCanvas／LayoutView／MainLayout | — | — | 本版硬鎖 |

---

## 完成定義（Definition of Done）

### 主線（對照 [W1018-A0 §3](../../work_dispatch/aaaaa/1018/W1018-A0_m3_engine_lab.md)）

- [x] 派工①已發（WEEK＋工單在 master；#77）
- [x] ②A 驗收步驟可跟做（[C1](./dev_v18/C1_m3_acceptance_steps.md)）
- [x] ②B lab 已合 master（#79）
- [x] 未改 C1 鎖檔／`editorStore` 簽名（#79 範圍）
- [x] 不做長篇派工第二主交付

### 品質閘（#79）

- [x] type-check／lint／format／test 綠（合入時）
- [x] diff 不含 `GridCanvas`／`LayoutView`／`MainLayout` 互動大改
- [x] 不發解鎖句

---

## 未交頂替

| 工項 | 未交影響 |
|------|----------|
| ②A | 公開 **V2** 缺可重跑步驟 |
| ②B | 缺可視化 lab；V2 仍可靠 A 過，但負責人已裁兩者都要 |
| B1 V17 收斂 | 文件狀態漂移；不擋程式 |
| E1 回寫 | 結算文件雙源 |

---

## 本週工項檢核（對照 W1018-A0）

| 工項 | 工單要求 | V18 狀態 | 備註 |
|------|----------|----------|------|
| ① | 派工已發 | `[x]` | #77；已在 master |
| ②A | 驗收步驟 | `[x]` | [C1](./dev_v18/C1_m3_acceptance_steps.md) 2026-10-25 |
| ②B | lab 合入 | `[x]` | #79 MERGED |
| 邊界 | 未改 C1 鎖檔 | `[x]` | #79 範圍 |

---

## 開發日誌

### 2026-11-01｜文件收斂結案（V19-B1）

- #79 MERGED 確認；D1／E1／本檔標 `[x]`；後續執行改掛 [todolist_v19](./todolist_v19.md)

### 2026-10-25｜埠幾何／L2 FAQ 寫入公開檔＋開 PR

- INTRO §2.1、LAB §5.3：外錨 vs 邊心、`PortRef`、同格多機認 `deviceId`
- 文件＋lab 碼準備 push／開 PR → master

### 2026-10-25｜派工公開三件

- `work_dispatch/aaaaa/1018/`：INTRO 會議報告、ACCEPTANCE V2、LAB 指南（白話＋詞彙表＋函式串接）

### 2026-10-25｜V18-D1 merge lab

- merge `origin/dev/aaaaa1019-l1-lab` → `dev/aaaaa1018`；衝突解＝todolist_v17 兩行皆留
- type-check 綠；關鍵兩測綠；**開 PR 另裁**

### 2026-10-25｜V18-C1 完成

- 驗收短文落版：最快＝重跑 `layoutStore.primaryOutput`＋`flowEngine.topology.layout`（8 passed）
- 含寫入／toTopology 步驟與失敗排查；下一＝D1 lab

### 2026-10-25｜負責人確認

- A-1＝**A＋B**；A-2＝沿用 `dev/aaaaa1018`；A-3＝先 commit 開版文件、**先不開 PR**
- M-1／M-2＝非 aaaaa 主責（主編／toby／MBD）

### 2026-10-25｜開版

- 對齊 `origin/master`（含 #72／#74／#76／#77）
- 依 WEEK v1.0／W1018-A0／C5 開 V18；前提＝V17 收斂
- 決策層 `dispatch_private/1018/` 對齊 V18；AGENT_WEEK_1018 改寫＝V18
- 分支 `dev/aaaaa1018`；下一刀＝C1（驗收步驟）＋D1（lab）
