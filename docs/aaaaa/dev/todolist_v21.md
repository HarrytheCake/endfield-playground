# V21 TODOLIST — Lab 輕量可調參試玩

**版本：** V21
**建立日期：** 2026-11-01
**負責人：** aaaaa
**前置／開工閘門：** **已滿足**（2026-11-08 核）。[V19](./todolist_v19.md)＋[V20](./todolist_v20.md) 已由 [#82](https://github.com/dernoson/endfield-playground/pull/82) 於 **2026-11-02 MERGED**，且為 `origin/master` 祖先。決策 [V20-F1](./dev_v20/F1_tryout_not_swagger.md)
**正式依據：** [WEEK_20261102](../../work_dispatch/WEEK_20261102.md) **v1.2**、[W1102-A0](../../work_dispatch/aaaaa/1102/W1102-A0_v21_a1_open.md)、[V20-F1](./dev_v20/F1_tryout_not_swagger.md)、[A0 牌程](./dev_v21/A0_tryout_panel_plan.md)
**上游：** [todolist_v19](./todolist_v19.md)、[todolist_v20](./todolist_v20.md)、[AGENT_WEEK_1102](../claude/AGENT_WEEK_1102.md)
**週次：** 2026-11-02 → 2026-11-08（公開工單＝只開版，≤2h）
**開發分支：** `dev/aaaaa1102`（自已含 #82 的 `origin/master` 新開；不沿用 `dev/aaaaa1026`）
**狀態總覽：** **`[~]` C1 已交**（2026-11-08；A1／C1 `[x]`；E1 交接已寫；D1 未開工）
**待確認問題：** [dispatch_private/1102/PENDING](../collaborator_survey/dispatch_private/1102/PENDING_DECISIONS_20261101.md)（A 組已決；試玩＝獨立分頁，C1 已依此實作）

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中
>
> **收斂定義（仍有效，現況已滿足）：**（1）V19／V20 主線 DoD 皆 `[x]`；（2）相關變更已 **合入 `master`**（PR MERGED；以 `git`／`gh` 為準）。
> **本週實況：** 牌 1 已開。牌 2／C1 已由負責人下令實作（逾原 ≤2h 只開版）。牌 3 `canConnect` 仍未開工。

---

## 概述

### 目標

1. hub 內可對少數 API **改參數再執行**（真呼叫）
2. 保留情境快捷（對齊現有一鍵案例）
3. response 以 JSON＋少數固定情境為主，非 schema 瀏覽器

### 已定案（2026-11-08｜正式開版）

| # | 項 | 結論 |
|---|-----|------|
| 1 | 閘門 | **已過**（#82） |
| 2 | 產品 | **輕量試玩**；非 swagger（[F1](./dev_v20/F1_tryout_not_swagger.md)） |
| 3 | 本週 | 牌 1 已開；**牌 2／C1 已交**（負責人下令，逾 W1102 ≤2h 原裁） |
| 4 | 第一刀 API | `hitTestPortAt`、`findPortAt`（P0，牌 2）；`canConnect`（P1，牌 3） |
| 5 | 頁面 | 同一 lab 的「試玩」分頁；文案先講兩套座標，函式名在後 |
| 6 | 分支 | **`dev/aaaaa1102`** |
| 7 | 解鎖句 | 不發 |

詳見 [A1](./dev_v21/A1_scope_decision.md)。

### 非目標

- 完整 Swagger UI／OpenAPI／任意 JSON 請求
- 全 inventory 自動產生表單
- F0 §2.3 全量 catalog（另牌）
- 改 `LayoutView`／`GridCanvas`／store／utils 簽名
- 本版做成完整 swagger，或在 C1 順便做 `canConnect`

### 牌程（摘要）

見 [A0 §3](./dev_v21/A0_tryout_panel_plan.md)：

```text
牌0 V19＋V20 收斂（硬閘）→ 牌1 A1開版 → 牌2 C1試玩殼＋P0
  → 牌3 D1 canConnect → 牌4 E1驗收
```

| 牌 | 工項 | 本週（W1102） |
|----|------|----------------|
| 0 | V19＋V20 收斂 | `[x]` #82 |
| 1 | A1 開版 | `[x]` |
| 2 | C1 試玩殼＋P0 | `[x]` |
| 3 | D1 canConnect | `[ ]` 未開工 |
| 4 | E1 驗收 | `[ ]` 未開工 |

### 閘門現況（2026-11-08 核）

| 項 | 狀態 |
|----|------|
| V19 主線 DoD | `[x]` |
| V20 主線 DoD | `[x]` |
| PR → master／MERGED | **`[x]` [#82](https://github.com/dernoson/endfield-playground/pull/82)**（2026-11-02） |
| **收斂完畢？** | **是** → A1 已開；C1 實作本週仍不做 |

---

## V21-A｜開版

- [x] **V21-A1** 確認 V19＋V20 已合 master；正式開版；覆核 F1／A0；開分支；建 C1／D1／E1（狀態＝未開工）
    - 細項：[A1](./dev_v21/A1_scope_decision.md)
    - 分支：`dev/aaaaa1102`

---

## V21-C｜試玩殼＋P0

- [x] **V21-C1** 試玩 UI＋`hitTestPortAt`／`findPortAt` 可調參
    - 細項：[C1](./dev_v21/C1_tryout_shell_p0.md)
    - 準則：A0 §2／§5

---

## V21-D｜P1

- [ ] **V21-D1** `canConnect` 可調參＋成功／失敗情境
    - 細項：[D1](./dev_v21/D1_can_connect_tryout.md)
    - 準則：A0 §2／§5

---

## V21-E｜驗收

- [~] **V21-E1** C1 的 USAGE／LAB／會議報告／交接已寫；全版仍等 `canConnect`
    - 細項：[E1](./dev_v21/E1_acceptance_and_handoff.md)
    - 給別人：[HANDOFF](../../work_dispatch/aaaaa/1102/HANDOFF_tryout_p0.md)、[會議報告](../../work_dispatch/aaaaa/1102/INTRO_meeting_v21_tryout.md)

---

## 封鎖／待決追蹤

| ID | 原因 | 等待 | 擋開版？ | 擋 C1 實作？ |
|----|------|------|----------|----------------|
| ~~GATE-1920~~ | ~~V19＋V20 未合 master~~ | — | **已解除**（#82） | 否 |
| ~~分頁或內嵌~~ | 已用獨立分頁 | — | 否 | 否 |
| 公開 WEEK | W1102-A0 已在 | — | 否 | 否 |

---

## 完成定義（全版；本週只要求開版列）

- [x] 閘門已過（#82）
- [x] C1：單一 hub「試玩」分頁；P0 各 ≥2 快捷；無簽名變更
- [ ] A0 §5 實作 DoD（牌 2–4）
- [ ] 未做完整 swagger／OpenAPI／第二 hub（實作完成時再勾）
- [ ] 未改鎖檔／簽名（實作完成時再勾）

---

## 開發日誌

### 2026-11-08｜進度、會議報告、交接

- 工單 §4、WEEK 日誌、README 一句改成實況（不改派）
- 公開會議報告與交接給 L2／第一次進 lab 的人
- E1 維持進行中：`canConnect` 未驗

### 2026-11-08｜V21-C1

- 負責人下令開工牌 2
- 「試玩」分頁：hitTestPortAt／findPortAt 可調參＋情境快捷；真呼叫
- 不含 canConnect

### 2026-11-08｜牌 1 開版

- 核對 #82 已在 `origin/master`；分支 `dev/aaaaa1102`
- A1 `[x]`；C1／D1／E1 檔已建、**實作未開工**
- 本週不做試玩畫面

### 2026-11-01｜閘門確認

- **已確認：** V21 前提＝V19＋V20 **收斂完畢**（合 master）；牌 0＝硬閘
- 當日現況未收斂 → 不開 A1（其後於 11/02 由 #82 滿足）

### 2026-11-01｜草案＋牌程

- 承接 V20-F1；A0 牌程 0→4 落檔
