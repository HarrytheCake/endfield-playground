# V16-B1 — V15 殘項收斂

**對應工項：** V16-B1
**狀態：** `[x]` 完成（2026-10-18）
**日期：** 2026-10-18
**依賴：** 無（開版前置）
**目的：** 確認 V15 程式已在 master，避免 V16 文件仍寫「交審中」造成雙源
**開發分支：** `dev/aaaaa1011`

---

## 1. 背景

[todolist_v15](../todolist_v15.md) 開版末狀態為「② #60；③ #65 交審中」。公開 WEEK_20261011 前置已記出界／埠命中在 master。本項做交叉比對與文件指向收斂，**不改 V15 程式**。

---

## 2. 查證清單（2026-10-18 實查）

| # | 查什麼 | 預期 | 實況 | 判定 |
|---|--------|------|------|------|
| 1 | `origin/master` 有 `devicesOutsideBase.ts`／`portHitTest.ts` | 有 | 工作樹（已對齊 master）兩檔皆在 `src/utils/layout/` | **成立** |
| 2 | PR #60／#65 狀態 | MERGED | `gh`：#60 MERGED 2026-10-11；#65 MERGED 2026-10-12 | **成立** |
| 3 | todolist_v15 狀態總覽 | 標結案／已合 master | 已改 `[x]`；D1／E1／檢核表勾選 | **成立** |
| 4 | V16 是否誤把 V15 範圍重做 | **否** | todolist_v16 非目標不含出界／埠命中重做；範圍＝C5 action | **成立** |

### 2.1 一併收斂的 V15 meta（最小改動）

| 檔 | 動作 |
|----|------|
| [todolist_v15](../todolist_v15.md) | 狀態總覽／D1／E1／封鎖表／檢核表／日誌 |
| [V15-D1](../dev_v15/D1_port_hit_test.md) | 狀態 `[x]` MERGED |
| [V15-E1](../dev_v15/E1_acceptance_and_handoff.md) | 狀態 `[x]`；回寫表勾選 |

**不改：** V15 任何 `src/`；CLAUDE §4.6／AGENT_ROADMAP 過期索引（已知債）。

### 2.2 續掛（不擋 V16）

| ID | 說明 |
|----|------|
| C5 引擎讀／表單 | 本版 D1 只定案；實作＝10/18→10/25 |
| 公開 WEEK V10 勾選 | 主編結算層；不擋 V16 開工 |
| PENDING C 組（頂欄／供電樁／點選 owner／history 分堆） | 見 [1011/PENDING](../../collaborator_survey/dispatch_private/1011/PENDING_DECISIONS_20261018.md) |

---

## 3. 不做

- 不重開 V15 功能
- 不為此項單獨開 PR（可併 V16 文件 commit）
- 不強制大修 CLAUDE §4.6／AGENT_ROADMAP 過期索引

---

## 4. DoD

- [x] §2 表以 `git`／`gh` 核過
- [x] todolist_v16 概述寫明 V15 已合 master
- [x] 無「再實作一遍 devicesOutsideBase／hitTestPortAt」的範圍漂移

---

## 5. 開發日誌

### 2026-10-18｜完成

- `gh pr view 60／65` → MERGED；產物檔在樹內
- 收斂 todolist_v15／D1／E1；下一刀＝V16-C1（`setDevicePrimaryOutput`）
