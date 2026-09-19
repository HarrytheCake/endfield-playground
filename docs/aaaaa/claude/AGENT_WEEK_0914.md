# Agent 週摘要｜2026-09-14 → 09-20（0914）

| meta | value |
|------|-------|
| version | **v1.1（2026-09-19 下午；A1 交付完成、§4 五項回寫全數執行、待確認問題分級後延後）** |
| 用途 | 供 Agent 執行本週派工／改工單時的**強制約束**；細節以公開 WEEK 與個人工單為準 |
| 公開 | [WEEK_0914](../../work_dispatch/WEEK_20260914.md) v1.1、[W0914-A0](../../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md)、[W0914-A1](../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md) |
| 執行計畫 | [todolist_v13](../dev/todolist_v13.md)、[dev_v13/](../dev/dev_v13/) |
| 決策層 | [0914/REVIEW](../collaborator_survey/dispatch_private/0914/REVIEW_20260914.md)、[0914/E3](../collaborator_survey/dispatch_private/0914/E3_risk_backup_staffing.md) |
| 操作總則 | [AGENT_ROADMAP](./AGENT_ROADMAP.md)（v1.6；檔案地圖仍指 0907，已知過期） |
| 撰寫 | aaaaa |
| 最後更新 | 2026-09-19 |

---

## 0. 三十秒結論

**A0 已經完成了。** PR [#45](https://github.com/dernoson/endfield-playground/pull/45) 於 2026-09-14 合入 master，`useLayoutStore()` 在樹上，W0914-A0 的 DoD 主項達成。

本週 Agent 的最高優先因此**不是**交 store，而是兩件事：

1. **A1 契約重訂草案**（C2／D4），純文件，不動 `src/`
2. **不要碰任何還開著的 PR 所屬的檔**——#50（toby）、#48（goodmorning）本週都在等合入，關鍵路徑已從 aaaaa 轉到他們身上

**禁止**解鎖或鼓勵擺放／選取；擺放最早 9/21 才開，且要主編週會裁示。

---

## 1. 優先序（必須遵守）

| 序 | 內容 | 工單／文件 |
|----|------|------------|
| 0 | V12 文件收斂（前置；已於 9/19 完成） | [V13-B1](../dev/dev_v13/B1_v12_residue_close.md) |
| 1 | **C2 連線契約重訂** | [W0914-A1](../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)、[V13-C1](../dev/dev_v13/C1_c2_connect_contract.md) |
| 2 | **D4 藍圖格式重訂** | W0914-A1、[V13-C2](../dev/dev_v13/C2_d4_blueprint_format.md) |
| 3 | 0921 落子前置盤點（非工單項，負責人追加） | [V13-D1](../dev/dev_v13/D1_placement_precheck_gap.md) |
| 4 | 上游回寫＋PR（不發解鎖句） | [V13-E1](../dev/dev_v13/E1_acceptance_and_handoff.md) |
| — | A0 收尾 | **已結案**；只做文件回寫，不重開工項 |
| — | **禁止**擺放／選取／加深 FactoryCanvas | WEEK §2 |

時數衝突時：**C1／C2（工單主線）＞ D1（追加項）**。D1 未交不擋任何人，只是 0921 派工要現場盤。

---

## 2. 禁止表

| 禁止 | 理由 |
|------|------|
| 碰 `src/editor/layout/LayoutView.vue`／`GridCanvas.vue`／`src/app/layouts/MainLayout.vue` | **toby PR #50 開著**（9/18 送出），這三個檔正在他的 diff 裡 |
| 碰 `src/editor/toolbar/ToolbarPanel.vue`＋stories | **goodmorning PR #48 開著**；本週 owner 是他（限視覺） |
| 碰 `src/editor/layout/useGridViewport.ts`、`src/router/*` | harry 的檔 |
| 動 `src/` 任何路徑（**含 `src/types/layout.ts`**） | 本版為純文件；工單雖允許型別草案，負責人 9/19 決定不用該額度（[V13-A1 §2.1](../dev/dev_v13/A1_scope_decision.md)） |
| 寫 `canConnect`／`blueprintIo`／`canPlaceDevice` 實作 | W0914-A1：「本週只要答案，不要實作」 |
| 改 `editorStore.addConnection` 或任何 `editorStore` 簽名 | 新模型下根本不需要（[V13-C1 §5.2](../dev/dev_v13/C1_c2_connect_contract.md)）；碰了就是擴大範圍 |
| 把 0921 前置擴大到 `rotateDevice`／選取面／belt 佈線升格 | 負責人 9/19 裁：只收 `canPlaceDevice`，其餘只記錄 |
| 替 toby 寫容器接線、回頭改他的容器 | 規則 17：上游不吃下游。用錯讀取面就 PR comment 指出 |
| 發解鎖句 | 本版交付是定義不是實作；擺放／選取仍鎖（[V13-E1 §2](../dev/dev_v13/E1_acceptance_and_handoff.md)） |
| 在 store 或 `canConnect` 另寫一份埠錨點判定 | 必須與 `resolveConnections` 共用；兩套會在「同格多埠」時得出不同結果 |
| 公開工單寫入風險等級／個人檔連結 | 公開／私密分界 |
| 發明 detail／定案沒有的範圍 | [AGENT_ROADMAP §6.1](./AGENT_ROADMAP.md) |

---

## 3. 契約形狀（已定案，勿另議）

| 項 | 結論 |
|----|------|
| C2 回傳 | **discriminated union**，`ok` 為 discriminant；對齊 `PlacementResult` |
| C2 `message` | **不放進 union**；另出 `describeConnectFailure()` |
| C2 規則 5／6 | **作廢**（被規則 3 吸收／已由 `addPipeline` 涵蓋） |
| C2 新增規則 7 | **斷線管線合法**；`from`／`to` 為 `null` 不是違規 |
| C2 落點 | `src/utils/layout/connectRules.ts`；`addPipeline` 內部作最終防線 |
| D4 版本號 | **`version: 2`** |
| D4 舊檔 | **不讀**；匯入 v1 直接拒絕整檔並提示 |
| D4 匯入 action | **沿用 `layoutStore.loadSnapshot`**；不新增、不碰 `editorStore` |
| D4 兩道驗證 | 形狀錯 → 全拒；語意違規 → 載入並警示 |
| `canPlaceDevice` | 回傳沿用既有 `PlacementResult`；draft 在 `conflicts` 中以 `'__draft__'` 代稱 |
| `historyStore` 全域堆疊 | **本版不處理**；只在 todolist 待決追蹤表留列 |

---

## 4. 本週結束應更新

| # | 動作 | 誰／何處 | 狀態 |
|---|------|----------|------|
| 1 | C2／D4 兩份 detail 狀態 `[!]` → `[ ]`，各補開發日誌 | aaaaa；`roadmap/detail/` | **已done** |
| 2 | ROADMAP_OUTLINE §5／§6 勾選、§9 封鎖表解除、版本紀錄升版 | aaaaa；[E1 §3](../dev/dev_v13/E1_acceptance_and_handoff.md) | **已done（v1.10）**；回寫時另發現 §1.2／§2／§8 也帶「待重訂」字樣，一併補 |
| 3 | 回寫 todolist_v13 狀態 | Agent／aaaaa | **已done**（A–E 全 `[x]`） |
| 4 | REVIEW／E3 日誌補一行 | 決策層 `0914/` | **已done**；另新建 `PENDING_DECISIONS_20260920` |
| 5 | 0921 交接摘要貼 PR body 或 Discord | aaaaa | **已done**（[#51](https://github.com/dernoson/endfield-playground/pull/51) body） |
| 6 | 工單 DoD 逐條查證證據 | aaaaa；[evidence/A1_dod.md](../dev/dev_v13/evidence/A1_dod.md) | **已done**（負責人 9/19 追加） |
| — | **不動** CLAUDE §4.6 索引、AGENT_ROADMAP 版本 | 負責人 9/19 裁示；已知過期，下次一併補 | 維持 |

---

## 5. 驗收對照（公開）

以 [WEEK_20260914 §0.1](../../work_dispatch/WEEK_20260914.md) 為準。

| 項 | 對象 | 本週實況（截至 9/19 下午，`gh` 實查） |
|----|------|----------------------|
| **V1** | aaaaa A0 | **達成**；#45 於 09-14T17:12:28Z 合入（merge `f95ed9f`） |
| V2 | toby T1 | PR #50 開著（9/18 送出），**最後活動 9/18T15:32，尚無 review** |
| V3 | harry H1 | 達成；#47 於 09-14 合入 |
| V4 | shirone S1 | 未達；`src/app/StatsPanel/` 不存在，仍在 `src/components/StatsPanel/`（10 檔） |
| V5 | goodmorning G1 | 未達；#48 自 9/13 開著，**最後活動 9/14T17:37，已 5 天無動靜** |

**A1 不在 V1–V7 之列**（次優、不擋門檻），個人步驟見 [V13_acceptance_guide](../dev/dev_v13/V13_acceptance_guide.md)；工單條件查證見 [evidence/A1_dod.md](../dev/dev_v13/evidence/A1_dod.md)。

V2／V4／V5 三項不是 aaaaa 的工項，**也不阻擋 A1**。它們要在 9/20 週會報告並決策，清單見決策層 [PENDING_DECISIONS_20260920](../collaborator_survey/dispatch_private/0914/PENDING_DECISIONS_20260920.md)。

> 判定實況一律以 `git`／`gh` 為準，不以文件宣稱為準——這是 V12-B1 學到的教訓。

---

## 6. 日誌

### 2026-09-19

- v1.0：A0 於週初即合入，重心改為 A1 契約重訂；禁止表以「還開著的 PR 所屬檔案」為主軸
- 契約形狀寫死（C2 union／D4 v2 拒舊檔／canPlaceDevice 回傳沿用 PlacementResult）
- 對齊 WEEK v1.1、todolist_v13、dispatch_private/0914
- **v1.1（下午）：** A1 交付完成，§4 回寫五項全數執行（第 5 項待 PR）；§5 驗收對照改以 `gh` 實查數據填寫
- 新增 §4 第 6 項：工單 DoD 逐條查證證據。**理由**——本週兩張工單共 12 條 DoD，
  過去只在 todolist 勾選，審閱者無從得知「怎麼查的」。獨立一份證據檔並附重現指令，
  比在 todolist 塞一堆查證細節好讀。建議後續版本沿用
- 待確認問題經分級後確認**全部不阻擋本週開發**，故先交付、後決策；
  分級原則建議寫進 AGENT_ROADMAP §7（目前只說「不確定就問」，未區分「現在得問」與「可先做完再問」）
