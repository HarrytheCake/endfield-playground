# V15-B1 — V14 殘項收斂

**對應工項：** V15-B1
**狀態：** `[x]` 完成（2026-10-10）
**日期：** 2026-10-10
**依賴：** 無（開版前置）
**目的：** 確認 V14 程式已在 master，避免 V15 文件仍寫「PR 交審中」造成雙源
**開發分支：** `dev/aaaaa1004`

---

## 1. 背景

[todolist_v14](../todolist_v14.md) 開版時狀態為「單 PR 分節交審」。公開 WEEK_20261004 已記 #54／#55 合入。本項做交叉比對與文件指向收斂，**不改 V14 程式**。

---

## 2. 查證清單（2026-10-10 實查）

| # | 查什麼 | 預期 | 實況 | 判定 |
|---|--------|------|------|------|
| 1 | `origin/master` 有 `placementCheck.ts`／`connectRules.ts` | 有 | 工作樹（已對齊 master）兩檔皆在 `src/utils/layout/` | **成立** |
| 2 | PR #54／#55 狀態 | MERGED | `gh`：#54 MERGED 2026-09-27T19:02:22Z；#55 MERGED 2026-09-27T19:02:24Z | **成立** |
| 3 | todolist_v14 狀態總覽 | 標結案／已合 master | 已改 `[x]` 已結案／已合 master；E1／DoD PR 項勾選 | **成立** |
| 4 | V15 是否誤把 V14 範圍重做 | **否** | todolist_v15 非目標明文不含 `canPlaceDevice`／`canConnect` 重做；範圍＝出界＋`hitTestPortAt` | **成立** |

### 2.1 一併收斂的 V14 meta（最小改動）

| 檔 | 動作 |
|----|------|
| [todolist_v14](../todolist_v14.md) | 狀態總覽／E1／DoD／P 表／檢核表／日誌 |
| [V14_closeout](../dev_v14/V14_closeout.md) | 結論句、公開狀態、E1 合入、P5 部分完成 |
| [V14-E1](../dev_v14/E1_acceptance_and_handoff.md) | 狀態 `[x]`；回寫表補 #7 |
| [V14_week_report](../dev_v14/V14_week_report.md) | 狀態改已合 |

**不改：** V14 任何 `src/`；CLAUDE §4.6／AGENT_ROADMAP 過期索引（已知債）。

### 2.2 續掛（不擋 V15）

| ID | 說明 |
|----|------|
| P7 | `addDevice`／`moveDevice` 貼埠繞過 `canConnect`——已知缺口，**非 V15** |
| P5 殘 | 公開 W0921 DoD 勾選、B2 細項日誌等文件債 |

---

## 3. 不做

- 不重開 V14 功能
- 不為此項單獨開 PR（可併 V15 文件 commit）
- 不強制大修 CLAUDE §4.6／AGENT_ROADMAP 過期索引（已知債，與 V14-B1 相同策略）

---

## 4. DoD

- [x] §2 表以 `git`／`gh` 核過
- [x] todolist_v15 概述寫明 V14 已合 master（開版即有；本項再確認）
- [x] 無「再實作一遍 canPlaceDevice／canConnect」的範圍漂移

---

## 5. 開發日誌

### 2026-10-10｜完成

- `gh pr view 54／55` → MERGED；產物檔在樹內
- 收斂 todolist_v14／closeout／E1／week_report；下一刀＝V15-C1（`devicesOutsideBase`）

### 2026-10-10

- 建檔；開版時 master 已見 placementCheck／connectRules（待正式勾選查證）
