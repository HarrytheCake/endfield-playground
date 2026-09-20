# V13 驗收指南 — aaaaa 本週交付（A1 契約重訂草案）

**週次：** 2026-09-14 → 2026-09-20
**負責人：** aaaaa
**最後更新：** 2026-09-19
**工單：** [W0914-A1](../../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)
**對照公開驗收：** [WEEK_20260914 §0.1](../../../work_dispatch/WEEK_20260914.md)

---

## 0. 交付總覽

| 工項 | 內容 | PR | 分支 |
|------|------|-----|------|
| A1 契約重訂 | C2 規則表＋`ConnectResult`；D4 v2 schema＋舊檔政策 | [#51](https://github.com/dernoson/endfield-playground/pull/51) | `dev/aaaaa0914` |
| （追加）0921 前置 | `canPlaceDevice` 缺口盤點與簽章草案 | 同上 | 同上 |

V13 執行計畫：[todolist_v13.md](../todolist_v13.md)＋本目錄 `dev_v13/`。

**想跳過細讀的話**，[evidence/A1_dod.md](./evidence/A1_dod.md) 已把 W0914-A0（7 條）與 W0914-A1（5 條）的 DoD 逐條列出查證方式與結果，並附可自行重跑的 `git`／`gh` 指令。本指南是**內容**檢查，那份是**條件**檢查，兩者不重複。

**A1 不在 WEEK §0.1 的 V1–V7 之列**——它是次優、不擋門檻。本週 aaaaa 對應的公開驗收項是 **V1（`layoutStore` 進 master）**，已於 2026-09-14 隨 PR [#45](https://github.com/dernoson/endfield-playground/pull/45) 達成，驗收步驟見 [V12_acceptance_guide](../dev_v12/V12_acceptance_guide.md)。

---

## 1. 這是一支純文件 PR

| 項 | 值 |
|----|-----|
| 動到的目錄 | `docs/roadmap/detail/`、`docs/roadmap/ROADMAP_OUTLINE.md`、`docs/aaaaa/dev/` |
| 動到 `src/` | **否** |
| 要跑品質閘 | **否**（見 §4 的例外） |
| 解鎖句 | **無**（[E1 §2](./E1_acceptance_and_handoff.md)） |

---

## 2. C1 — C2 連線契約（約 3 分鐘）

讀 [roadmap/detail/C2](../../../roadmap/detail/C2_add_connection_contract.md)，確認：

| 檢查 | 預期 |
|------|------|
| §4.1 規則表 | 六條原規則**逐條**有「成立／改寫／作廢」標記，不是整段重寫 |
| 規則 5、6 | 標作廢，且各有一句為什麼（被規則 3 吸收／已由 `addPipeline` 涵蓋） |
| 新增規則 7 | 斷線管線合法；`from`／`to` 為 `null` 不算違規 |
| §4.3 型別 | discriminated union；`ok` 為 discriminant；**無** `message` 欄位 |
| 描述函式 | `describeConnectFailure` 有出現，且說明 L3 不組文案的原則仍成立 |
| §4.4 | 「端點判定必須與 `resolveConnections` 共用」有寫成明文（獨立一節，非夾在別節裡） |
| §5 落點 | `src/utils/layout/connectRules.ts`（**不是** `src/utils/`） |
| §5／§8／§10 | 已**移除**改 `editorStore.addConnection`／標 Breaking／10/11 跨 CR 協商 |
| meta | 狀態 `[ ]`；`最後更新` 2026-09-19 |

---

## 3. C2 — D4 藍圖格式（約 2 分鐘）

讀 [roadmap/detail/D4](../../../roadmap/detail/D4_blueprint_json_io.md)，確認：

| 檢查 | 預期 |
|------|------|
| §4.1 schema | `version: 2`；`devices`／`pipelines`；**無** `nodes`／`edges`／handle 要求 |
| 版本號理由 | 「跳 2 讓拒絕發生在第一個檢查點」一句以上 |
| 舊檔政策 | 「不讀舊檔」＋**資訊缺口**理由（舊檔沒有路徑資訊，轉換等於憑空造圖） |
| 拒絕提示 | 有一句面向使用者的提示文字 |
| §4.4 | 已改為沿用 `layoutStore.loadSnapshot`；CR-01 協商需求已移除 |
| §4.6／§4.6.1 兩道驗證 | 形狀（`parseBlueprint`）／語意（`LayoutIssues`）分開，且寫明「形狀錯全拒、語意違規載入並警示」 |
| §8 依賴 | `primaryOutput` 已滿足；新增對 C2 `canConnect` 的依賴 |
| meta | 狀態 `[ ]`；`最後更新` 2026-09-19 |

---

## 4. 上游回寫（約 1 分鐘）

```bash
git diff --name-only origin/master
```

| 預期 | 說明 |
|------|------|
| 清單中**無** `src/` 開頭的路徑 | 本版硬約束；若有則 §1 的「不跑品質閘」失效，須補跑 `pnpm type-check`／`lint-check`／`format-check`／`test` |
| 含 `docs/roadmap/ROADMAP_OUTLINE.md` | §5／§6 勾選、§9 封鎖表、版本紀錄三處 |
| 含兩份 detail | C2、D4 |

讀 [ROADMAP_OUTLINE §9](../../../roadmap/ROADMAP_OUTLINE.md)，確認 R-C2／R-D4 兩列已解除且寫明解除條件。

---

## 5. D1 — 0921 落子前置（約 2 分鐘）

讀 [D1_placement_precheck_gap.md](./D1_placement_precheck_gap.md)，確認：

| 檢查 | 預期 |
|------|------|
| §2 缺口 | 可獨立閱讀；不必回頭讀 `layoutStore.ts` 就懂為什麼現有 API 不夠 |
| §3 簽章 | `DeviceDraft` 不含 `id`；回傳沿用 `PlacementResult`；`DRAFT_ID` 有定義 |
| §4 落點 | 寫明是「把 store 私有函式提出來共用」，且列出 `layoutStore.test.ts` 原樣綠的驗收條件 |
| §5 切片 | L1 排 9/21–9/23，L2 可平行 |
| §6 相鄰缺口 | 四項各有現況、用途、不決理由 |

---

## 6. PR body 必備

1. **範圍宣告**（純文件、不解鎖；見 [E1 §2.1](./E1_acceptance_and_handoff.md)）
2. **下游消費者**（見 [todolist_v13](../todolist_v13.md) 概述）
3. **0921 交接摘要**（[E1 §4](./E1_acceptance_and_handoff.md)）
4. **兩項風險下降**（[E1 §5](./E1_acceptance_and_handoff.md)）

---

## 7. 相關文件

| 文件 | 用途 |
|------|------|
| [todolist_v13.md](../todolist_v13.md) | 工項狀態總表 |
| [A1_scope_decision.md](./A1_scope_decision.md) | 7 項定案與理由 |
| [B1_v12_residue_close.md](./B1_v12_residue_close.md) | V12 收斂與帶入的待決 |
| [C1_c2_connect_contract.md](./C1_c2_connect_contract.md) | C2 規則重判 |
| [C2_d4_blueprint_format.md](./C2_d4_blueprint_format.md) | D4 schema 與舊檔政策 |
| [D1_placement_precheck_gap.md](./D1_placement_precheck_gap.md) | 0921 落子前置 |
| [E1_acceptance_and_handoff.md](./E1_acceptance_and_handoff.md) | PR、回寫、交接 |
| [evidence/A1_dod.md](./evidence/A1_dod.md) | A0／A1 工單 DoD 逐條查證證據 |
| [W0914-A1](../../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md) | 公開工單與 DoD |
