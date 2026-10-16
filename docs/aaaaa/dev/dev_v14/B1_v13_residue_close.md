# V14-B1 — V13 殘項收斂（前置）

**對應工項：** V14-B1
**狀態：** `[x]` 完成（2026-09-27）
**日期：** 2026-09-27
**正式依據：** [todolist_v13](../todolist_v13.md)、[V13_acceptance_guide](../dev_v13/V13_acceptance_guide.md)、[W0921-A0](../../../work_dispatch/aaaaa/0921/W0921-A0_placement_precheck.md) 設計稿欄
**依賴：** [A1](./A1_scope_decision.md)

---

## 1. 背景

V13（純文件）已由 PR [#51](https://github.com/dernoson/endfield-playground/pull/51) 合入 master，todolist 亦標全版完成；但 `dev_v13/` 多數細項 meta 仍停在「未開始」。本細項只做**交叉比對＋文件收斂**，不帶新程式刀進 V14——沿用 [V13-B1 收斂 V12](../dev_v13/B1_v12_residue_close.md) 的同一套作法。

---

## 2. 交叉比對（git／GitHub）

| # | 檢查 | 預期 | 結果 |
|---|------|------|------|
| 1 | PR #51 | MERGED | **成立**；2026-09-20T17:48:47Z；merge `9a8da88` |
| 2 | `todolist_v13` 狀態總覽 | A–E 全 `[x]` | **成立**（總覽與五節皆 `[x]`） |
| 3 | `roadmap/detail/C2`、`D4` | 狀態 `[ ]`（已定義、待實作），非 `[!]` | **成立**（兩檔 meta 皆 `[ ]` **已定義、待實作**） |
| 4 | ROADMAP_OUTLINE §9 | C2／D4 封鎖列已解除 | **成立**（~~R-C2~~／~~R-D4~~；解除日 2026-09-19；大綱現 v1.13） |
| 5 | V13 是否留下未合入的 `src/` 殘刀 | **無** | **成立**；`gh pr view 51 --json files` 十六檔**全在 `docs/`**，零 `src/` |
| 6 | A0 工單是否指向 V13-D1 | 是 | **成立**；[W0921-A0](../../../work_dispatch/aaaaa/0921/W0921-A0_placement_precheck.md)「設計稿」＝[V13-D1 §3](../dev_v13/D1_placement_precheck_gap.md) |

**程式殘刀：無。** V13 為純文件版本；V14-C1 從零新建 `placementCheck.ts`，不繼承未合入分支。

### 2.1 簽章依據（帶入本版）

| 項 | 處置 |
|----|------|
| `canPlaceDevice`／`canMoveDevice`／`DRAFT_ID` 簽章 | **帶入**——[C1](./C1_placement_precheck.md) **照 V13-D1 §3 實作，不另開簽章討論章**（防雙源） |
| C2／D4 契約正文 | **不帶入重寫**——A1（connectRules）只做實作，契約已在 detail |
| 0914 PENDING 已決（toby 呼叫端／Zod／拒讀 v1） | **不重開** |
| 續掛（history／選取／工廠／belt） | 已在 [PENDING_20260927](../../collaborator_survey/dispatch_private/0921/PENDING_DECISIONS_20260927.md) |

---

## 3. 文件殘項（已處置）

| 檔 | 過期寫法 | 處置 |
|----|----------|------|
| `dev_v13/A1`／`C1`／`C2`／`D1`／`E1` meta 狀態 | 仍 `[ ]` 未開始（與 todolist `[x]` 矛盾） | **已改** `[x]` 完成，並勾各檔 DoD |
| [todolist_v13.md](../todolist_v13.md) | 缺「收斂於／後續版本」 | **已補** 指向本檔與 todolist_v14 |
| [todolist_v13.md](../todolist_v13.md) 開發日誌 | 缺 V14-B1 收斂記錄 | **已補** 2026-09-27 一則 |

**未處置（已知過期，本次不動——沿用 V13-B1 裁示）：**

| 檔 | 現況 | 為什麼不動 |
|----|------|-----------|
| [claude/CLAUDE.md](../../claude/CLAUDE.md) §4.6 | 無 V13／V14；V12 可能仍寫進行中 | 與 AGENT_ROADMAP 一併補 |
| [claude/AGENT_ROADMAP.md](../../claude/AGENT_ROADMAP.md) | v1.6，仍指 0907 | 同上 |
| [docs/aaaaa/README.md](../../README.md) | 未反映 V13／V14 | 對外狀態待 A0 有程式產出再更 |

> 這三項是**已知過期**，不是漏掉。下次動索引時一併補 V13 完成／V14 現行。

---

## 4. DoD

- [x] §2 六列已查證並填結果
- [x] §3 列出的 V13 文件已回寫；未處置項已明列
- [x] 確認本版 C1 不另開「簽章討論」章節（避免與 V13-D1 雙源）
- [x] 無程式殘刀需併入 `dev/aaaaa0921`
- [x] todolist_v14 可標 B1 `[x]`，V14 前置成立

---

## 5. 開發日誌

### 2026-09-27

- `gh` 確認 #51 MERGED（2026-09-20T17:48:47Z，`9a8da88`）；files 全 `docs/`、零 `src/`
- detail/C2／D4 meta＝`[ ]` 已定義待實作；ROADMAP §9 兩列已解除（v1.10 起，現 v1.13）
- W0921-A0 設計稿欄指向 V13-D1 §3——簽章單一來源成立
- 收斂 `dev_v13/` 五份細項 meta／DoD 與 todolist_v13 指向；CLAUDE／AGENT_ROADMAP／README 依前例不動並明列
