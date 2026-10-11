# V13-E1 — 驗收、PR、0921 交接

**對應工項：** V13-E1
**狀態：** `[x]` 完成（2026-09-19；V14-B1 於 2026-09-27 收斂 meta）
**日期：** 2026-09-19
**依賴：** [C1](./C1_c2_connect_contract.md)、[C2](./C2_d4_blueprint_format.md)、[D1](./D1_placement_precheck_gap.md)
**驗收集：** [V13_acceptance_guide.md](./V13_acceptance_guide.md)

---

## 1. 目標

個人與 review_gate 可依同一清單過關；PR body 講清楚這是一支**純文件 PR**，不解鎖任何東西。

---

## 2. 本版不發解鎖句

V11 發過 `layout-L1：…`，V12 發過 `layout-store：…`。**V13 不發。**

理由：解鎖句的用途是放行 L2 的下一刀，而本版交付是契約定義與盤點，**擺放／選取本週仍鎖**（[WEEK_20260914 §2](../../../work_dispatch/WEEK_20260914.md)）。發一句「C2 已定義」只會讓人以為可以開始接連線。

### 2.1 PR body 用的範圍宣告（可複製）

```text
本 PR 僅文件：C2 連線契約／D4 藍圖格式重訂草案，加一份 0921 落子前置盤點。
未動 src/；不解鎖擺放／選取；對 #48、#50 零影響。
R-C2、R-D4 狀態由 [!] 改 [ ]（已定義、待實作），實作分別排 10/04、11/08。
```

### 2.2 禁止

- 寫成「連線契約已完成」——完成的是**定義**，不是實作
- 暗示 B2／R-C2 已解封
- 在未經主編週會裁示下，把 [D1 §5](./D1_placement_precheck_gap.md) 的 0921 切片講成已排定的派工

---

## 3. 上游回寫清單

本版動的是 roadmap 公開文件，**回寫不是選配**（[AGENT_ROADMAP §4.4 規則 19](../../claude/AGENT_ROADMAP.md)：封鎖一律回寫大綱 §9）。

| # | 檔 | 動作 | 狀態 |
|---|----|------|------|
| 1 | [roadmap/detail/C2](../../../roadmap/detail/C2_add_connection_contract.md) | §3／§4／§5／§6／§10 改寫；meta 狀態 `[!]` → `[ ]`；§11 補日誌 | **已回寫** |
| 2 | [roadmap/detail/D4](../../../roadmap/detail/D4_blueprint_json_io.md) | §3／§4／§5／§8／§10 改寫；meta 狀態 `[!]` → `[ ]`；§11 補日誌 | **已回寫** |
| 3 | [ROADMAP_OUTLINE](../../../roadmap/ROADMAP_OUTLINE.md) §5／§6 | R-C2、R-D4 的 `[!]` 勾選改 `[ ]`，刪掉「待重新定義／待重訂格式」的註 | **已回寫** |
| 4 | [ROADMAP_OUTLINE](../../../roadmap/ROADMAP_OUTLINE.md) §9 封鎖表 | C2、D4 兩列解除；解除條件寫「V13 重訂完成（2026-09-19）」 | **已回寫** |
| 5 | [ROADMAP_OUTLINE](../../../roadmap/ROADMAP_OUTLINE.md) 版本紀錄 | 升版並記一行；改期／狀態變更不得只留口頭（規則 20） | **已回寫（v1.10）** |
| 6 | [ROADMAP_OUTLINE](../../../roadmap/ROADMAP_OUTLINE.md) §1.2／§2／§8 | 藍圖格式定案句、§2 工項總表 R-C2 名稱、§8 的 10/04 與 11/22 備註 | **已回寫**（回寫過程追加） |

> §5 的升版需要主編知情。R-C2／R-D4 **不是**在改月底門檻必要項清單（兩者本來就是必要項，只是從「待定義」變「已定義」），依 [AGENT_ROADMAP §7](../../claude/AGENT_ROADMAP.md) 不需要主編＋aaaaa 雙簽；但 PR 仍由主編合入。

---

## 4. 0921 交接摘要（PR body 或 Discord 一段）

這一段是給下週派工者看的，不是給 review 看的：

```text
0921 給 L1 的一刀（建議）：placementCheck.ts
  - canPlaceDevice(draft, layout) / canMoveDevice(id, position, layout)
  - 回傳沿用既有 PlacementResult；draft 在 conflicts 中以 '__draft__' 代稱
  - 作法是把 layoutStore 裡私有的 collectLayoutIssues / assessInvolving 提出來共用，
    不是另寫一份；提完 layoutStore.test.ts 要原樣綠
  - 排 9/21 → 9/23，讓 L2 有四天可接；兩者不同檔，可平行開工
  - 細節：docs/aaaaa/dev/dev_v13/D1_placement_precheck_gap.md

未收但已盤到的相鄰缺口（0921 派工時要決）：
  createPlacedDevice 工廠 / rotateDevice / 選取面歸屬 / belt 佈線純函式升格
```

---

## 5. 兩項風險下降要講出來

本版重訂順帶消掉了兩個原本掛在 10 月／11 月的跨 CR 協商需求。這不是文字修飾，是排程上的實際變化，週會要提：

| 原風險 | 現況 | 來源 |
|--------|------|------|
| C2 要改 `editorStore.addConnection`，屬 CR-01 主責，須標 Breaking 並最遲 10/11 提出協商 | **消失。** 連線動作落在 `layoutStore.addPipeline`，是 aaaaa 自己的檔 | [C1 §5.2](./C1_c2_connect_contract.md) |
| D4 要新增 `editorStore.loadBlueprint`，須 CR-01 同意，最遲 11/8 提出；未獲同意則退回逐一呼叫並記技術債 | **消失。** `layoutStore.loadSnapshot` 已滿足方案 B 的全部要求（一次寫入、一筆 Macro、Undo 一次還原） | [C2 §4.1](./C2_d4_blueprint_format.md) |

C2 的週切片因此把「內部防線」從 10/18 提前到 10/11。

---

## 6. PR 檢查清單

**已於 2026-09-19 送出：** [#51](https://github.com/dernoson/endfield-playground/pull/51)「V13 / W0914-A1: C2 連線契約＋D4 藍圖格式重訂（純文件）」，base `master`，15 檔 +1885／-140。

- [x] 標題帶 `W0914-A1`／`V13`
- [x] §2.1 範圍宣告（純文件、不解鎖）
- [x] 下游消費者段落（見 [todolist_v13](../todolist_v13.md) 概述）
- [x] §4 的 0921 交接摘要
- [x] §5 兩項風險下降
- [x] 硬約束：`diff` 不含任何 `src/` 路徑（`gh pr view 51 --json files` 實查零命中）
- [x] 追加：body 末段「已知未決」列出三項與本 PR 直接相關的待確認問題

---

## 7. DoD（本細項）

- [x] C1＋C2＋D1 各自 DoD 滿足
- [x] §3 上游回寫完成（五項＋追加一項）
- [x] [驗收指南](./V13_acceptance_guide.md)步驟可跑通（§4 的 `git diff --name-only` 零 `src/`；節號已於 9/19 校正）
- [x] PR 可審；body 含 §2.1／§4／§5 → [#51](https://github.com/dernoson/endfield-playground/pull/51)
- [x] 未發任何解鎖句

---

## 8. 開發日誌

### 2026-09-19

- 定：本版不發解鎖句，改用範圍宣告（§2）
- 列出五項上游回寫；確認 C2／D4 脫離 `[!]` 不屬「變更門檻必要項清單」，不需雙簽
- 整理 §5 兩項風險下降，供週會與 10 月排程引用
- **下午：§3 回寫全數執行完畢**，ROADMAP_OUTLINE 升 v1.10。回寫時追加第 6 項——
  §1.2 的藍圖格式列、§2 工項總表的 R-C2 名稱、§8 里程碑表的 10/04 與 11/22 備註都還帶著「待重訂」字樣，
  原清單漏列。教訓：**同一句話會散在大綱好幾處**，只查 §9 封鎖表會漏
- **PR [#51](https://github.com/dernoson/endfield-playground/pull/51) 已送出**（base `master`，15 檔 +1885／-140，零 `src/`）。
  body 依 §6 清單組成，並在末段加「已知未決」——列出 C2 的 L2 owner、Zod 依賴、是否 9/21 開 B2 三項。
  **理由**：這三項會影響審閱者對「這份契約能不能照著做」的判斷，藏在決策層文件裡對他不公平
