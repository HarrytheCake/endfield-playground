# V13 驗收證據 — W0914-A0／A1 工單 DoD 逐條查證

**週次：** 2026-09-14 → 2026-09-20
**負責人：** aaaaa
**查證時間：** 2026-09-19
**工單：** [W0914-A0](../../../../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md)、[W0914-A1](../../../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)
**結論：** **兩張工單 DoD 全部成立。**

> 判定一律以 `git`／`gh` 實查為準，不以文件宣稱為準（V12-B1 教訓；[AGENT_WEEK_0914 §5](../../../claude/AGENT_WEEK_0914.md) 已列為原則）。

---

## 1. W0914-A0｜`layoutStore` 收尾並合入 master

| # | DoD | 查證 | 結果 |
|---|-----|------|------|
| 1 | #45 上的 review 意見逐條已回 | `gh pr view 45 --json reviews,comments` | **成立**。dernoson 兩輪 `COMMENTED`（09-13T11:39、09-14T16:19）後於 09-14T17:11 `APPROVED`；aaaaa 兩則回覆逐條對照 review 編號列出修訂 commit |
| 2 | `layoutStore.test.ts` 綠，涵蓋四點契約 | 隨 #45 合入；`src/__tests__/store/layoutStore.test.ts` 534 行在 master | **成立** |
| 3 | `editorStore.test.ts` 原樣綠 | #45 diff 未含該檔 | **成立** |
| 4 | `type-check`／`lint-check` 綠 | PR 合入前 CI 通過 | **成立** |
| 5 | **#45 已合入 master** | `git cat-file -e origin/master:src/store/layoutStore.ts` | **成立**。merge commit `f95ed9f`，09-14T17:12:28Z |
| 6 | diff 不含 `MainLayout.vue`／`src/editor/layout/*`／`ToolbarPanel.vue` | `git show --stat f95ed9f` 過濾三者 | **成立**，零命中 |
| 7 | §4 演示頁去留已在 PR 明寫 | PR body「演示頁的定位（請先讀這段）」整段 | **成立**。選「一起交」，並說明改 Vite 獨立 HTML 入口的兩個理由（避免共用 Pinia 污染 `historyStore`、`vite build` 不吃它） |

### 1.1 §4 四個本地檔的最終去向

工單 §4 要求「二選一講清楚，不要留在中間狀態」。實查四檔在 master 的狀態：

| 檔 | 在 master |
|----|-----------|
| `src/app/dev/DevLayout.vue` | 是（#45 未改動此檔，屬既有） |
| `src/app/dev/LayoutStorePreview.vue` | 是（#45 新增，1187 行） |
| `src/app/dev/layoutStorePreviewUtils.ts` | 是（#45 新增，293 行） |
| `src/__tests__/app/layoutStorePreviewUtils.test.ts` | 是（#45 新增，121 行） |

**無中間狀態。** 另外 #45 依 review 5 撤回了原本對 `src/router` 的改動，改掛 `dev/layout-store-preview.html` 獨立入口——這也是 [V13-D1 §6](../D1_placement_precheck_gap.md) 把 belt 佈線純函式列為「相鄰缺口」的原因：它們雖已進版控，住址仍是 dev-only。

---

## 2. W0914-A1｜C2／D4 契約重訂草案

| # | DoD | 查證 | 結果 |
|---|-----|------|------|
| 1 | C2 §4 已改寫為新模型版本，六條規則**逐條**標「成立／改寫／作廢」 | [detail/C2 §4.1](../../../../roadmap/detail/C2_add_connection_contract.md) 表格 | **成立**。1／2／3 改寫、4 成立、5 作廢（由 3 吸收）、6 作廢（已由 `addPipeline` 涵蓋），另新增規則 7「斷線管線合法」 |
| 2 | D4 §4.1 schema 已改為 `devices`／`pipelines`，版本號與舊檔政策各一句話 | [detail/D4 §4.1／§4.2／§4.3](../../../../roadmap/detail/D4_blueprint_json_io.md) | **成立**。`{ version: 2, planId?, devices, pipelines }`；版本號跳 2 與「不讀舊檔」各獨立一節並附理由 |
| 3 | 兩份 detail 狀態欄 `[!]` → `[ ]`，各補開發日誌一則 | 兩檔 meta 表與 §11 | **成立**，各補 2026-09-19 一則 |
| 4 | `pnpm type-check` 綠（**若動了** `src/types/layout.ts`） | `git diff --name-only origin/master...dev/aaaaa0914` | **不適用**。未動 `src/types/layout.ts`；工單 §4 允許落型別草案，負責人 9/19 決定不用該額度（[A1 §2.1](../A1_scope_decision.md)） |
| 5 | diff 不含任何 `src/editor/*`、不含 `addConnection` 實作 | 同上指令 | **成立**。全分支 14 個變更檔**全在 `docs/` 底下**，零 `src/` 路徑；`addConnection` 僅出現在文件敘述中（說明「本項不碰它」），無實作 |

### 2.1 超出工單的追加交付

| 項 | 出處 | 說明 |
|----|------|------|
| 0921 落子前置盤點 | [D1](../D1_placement_precheck_gap.md) | 非工單項，負責人 9/19 追加。不擋任何人，未交只是 0921 派工要現場盤 |
| ROADMAP_OUTLINE 回寫 | v1.10 | 工單 DoD 未列，但 [AGENT_ROADMAP §4.4 規則 19](../../../claude/AGENT_ROADMAP.md)「封鎖一律回寫大綱 §9」要求 |
| 待確認問題分級 | 決策層 `0914/` | 非工單項，負責人 9/19 追加 |

---

## 3. 全分支變更清單（14 檔，全在 `docs/`）

```text
docs/aaaaa/claude/AGENT_WEEK_0914.md
docs/aaaaa/dev/dev_v12/evidence/E1_unlock.md
docs/aaaaa/dev/dev_v13/A1_scope_decision.md
docs/aaaaa/dev/dev_v13/B1_v12_residue_close.md
docs/aaaaa/dev/dev_v13/C1_c2_connect_contract.md
docs/aaaaa/dev/dev_v13/C2_d4_blueprint_format.md
docs/aaaaa/dev/dev_v13/D1_placement_precheck_gap.md
docs/aaaaa/dev/dev_v13/E1_acceptance_and_handoff.md
docs/aaaaa/dev/dev_v13/V13_acceptance_guide.md
docs/aaaaa/dev/todolist_v12.md
docs/aaaaa/dev/todolist_v13.md
docs/roadmap/ROADMAP_OUTLINE.md
docs/roadmap/detail/C2_add_connection_contract.md
docs/roadmap/detail/D4_blueprint_json_io.md
```

**與他人開著的 PR 零重疊：** #50（toby：`LayoutView.vue`／`GridCanvas.vue`／`MainLayout.vue`）、#48（goodmorning：`ToolbarPanel.vue`）都在 `src/` 底下，本分支未觸及。

---

## 4. 重現指令

```bash
# A0-5：master 上有 store
git cat-file -e origin/master:src/store/layoutStore.ts && echo OK

# A0-6：#45 未碰禁區
git show --stat f95ed9f | grep -E 'MainLayout.vue|src/editor/layout/|ToolbarPanel.vue'   # 應無輸出

# A0-1／7：review 與演示頁去留
gh pr view 45 --json reviews,comments,body

# A1-5：本分支不含 src/
git diff --name-only origin/master...dev/aaaaa0914 | grep '^src/'                        # 應無輸出
```

---

## 5. 日誌

### 2026-09-19

- 建檔。依負責人指示「檢驗本週派工工項是否皆已完成」，對 A0（7 條）與 A1（5 條）逐條實查
- A0 全數成立；其中 DoD 7（演示頁去留）確認為「一起交」且四檔皆在 master，無中間狀態
- A1 四條成立、一條不適用（未動 `src/types/layout.ts`，型別草案額度未用）
- 順帶確認本分支 14 個變更檔全在 `docs/`，與 #48／#50 零重疊
