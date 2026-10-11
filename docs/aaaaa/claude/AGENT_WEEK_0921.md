# Agent 週摘要｜2026-09-21 → 09-27（0921｜M2 門檻週）

| meta | value |
|------|-------|
| version | **v1.6（2026-09-27；開 PR 單支分節）** |
| 用途 | 供 Agent 執行本週派工／改工單時的**強制約束**；細節以公開 WEEK 與個人工單為準 |
| 公開 | [WEEK_0921](../../work_dispatch/WEEK_20260921.md) v1.2、[W0921-A0](../../work_dispatch/aaaaa/0921/W0921-A0_placement_precheck.md)、[W0921-A1](../../work_dispatch/aaaaa/0921/W0921-A1_connect_rules.md) |
| 執行計畫 | [todolist_v14](../dev/todolist_v14.md)、[dev_v14/](../dev/dev_v14/) |
| 收斂盤點 | [V14_closeout](../dev/dev_v14/V14_closeout.md) |
| PR | [#54](https://github.com/dernoson/endfield-playground/pull/54) |
| 決策層 | [0921/REVIEW](../collaborator_survey/dispatch_private/0921/REVIEW_20260921.md)、[0921/E3](../collaborator_survey/dispatch_private/0921/E3_risk_backup_staffing.md)、[0921/PENDING](../collaborator_survey/dispatch_private/0921/PENDING_DECISIONS_20260927.md) |
| 操作總則 | [AGENT_ROADMAP](./AGENT_ROADMAP.md)（v1.6；檔案地圖仍指 0907，已知過期） |
| 撰寫 | aaaaa |
| 最後更新 | 2026-09-27 |

---

## 0. 三十秒結論

**V14 程式已收斂；單 PR 分節交審（A0＋A1）。**  
- 證據／盤點：[evidence/V14_dod.md](../dev/dev_v14/evidence/V14_dod.md)、[V14_closeout](../dev/dev_v14/V14_closeout.md)  
- 演示：`/dev/placement-connect-check.html`  
- **提前量：** `addPipeline`←`canConnect`；方向＝有序 output→input

不發解鎖句。門檻鏈仍缺 **T1**（V1）。合入後做 closeout P5。


---

## 1. 優先序（必須遵守）

| 序 | 內容 | 工單／文件 |
|----|------|------------|
| ~~0~~ | ~~V13 文件收斂（前置）~~ | **已完成**；[V14-B1](../dev/dev_v14/B1_v13_residue_close.md) |
| ~~1~~ | ~~A0 落子前預檢（擋門檻）~~ | **已完成**；[V14-C1](../dev/dev_v14/C1_placement_precheck.md)；待開 PR |
| ~~2~~ | ~~A1 連線規則純函式（次優）~~ | **已完成**；[V14-D1](../dev/dev_v14/D1_connect_rules.md)；待開 PR |
| ~~3~~ | ~~驗收＋說明／演示~~ | **已完成（PR 除外）**；[V14-E1](../dev/dev_v14/E1_acceptance_and_handoff.md) `[~]` |
| ~~4~~ | ~~開 PR（單支分節）~~ | **已開** [#54](https://github.com/dernoson/endfield-playground/pull/54) |
| 5 | 合入後上游回寫（P5） | closeout P5 |
| — | **禁止**選取／旋轉／刪除接線 | WEEK §2.1 |
| — | **禁止**替 toby 寫落子鏈或改其檔 | 規則 17 |

（原「禁止本週 addPipeline 接 canConnect」已提前解除並完成。）

---

## 2. 禁止表

| 禁止 | 理由 |
|------|------|
| 碰 `src/editor/layout/LayoutView.vue`／`GridCanvas.vue` | toby 本週鎖（落子鏈） |
| 碰 `src/editor/toolbar/usePlacementIntent.ts`、`ToolbarPanel.vue` 意圖層 | toby；G1 只動資料來源那幾行＋視覺 |
| 碰 `src/app/layouts/MainLayout.vue` | toby 全檔鎖（shirone 僅 StatsPanel import 一行例外，與本版無關） |
| 改 `editorStore` 任何簽名 | 舊藍圖世界；本版不經該路徑 |
| 另寫一份佔格／重疊判定 | A0 是**提共用**，不是重寫；兩套判定＝預覽綠、落下紅 |
| 順手做 `rotateDevice`／`createPlacedDevice` 工廠 | WEEK §2.1：本週不做；工廠延 10 月 |
| A0 未交完就開 A1 且拖住 A0 PR | 分開 PR；A0 擋門檻 |
| A1 同週動 `layoutStore.ts` | A0 已在動；A1 本週不做 `addPipeline` 內部防線 |
| 發新解鎖句／暗示選取已開 | 點擊落子已裁；選取／旋轉／刪除仍鎖 |
| 公開工單寫入風險等級／個人檔連結 | 公開／私密分界 |
| 發明 detail／定案沒有的範圍 | [AGENT_ROADMAP §6.1](./AGENT_ROADMAP.md) |

---

## 3. 契約形狀（已定案，勿另議）

| 項 | 結論 |
|----|------|
| A0 簽章 | 照 [V13-D1 §3](../dev/dev_v13/D1_placement_precheck_gap.md)；**不在工單重寫** |
| A0 回傳 | **沿用既有 `PlacementResult`**；不新增型別 |
| `DeviceDraft` | **不含 `id`**；`conflicts` 裡 draft 用 `DRAFT_ID = '__draft__'` |
| A0 作法 | 把 `collectLayoutIssues`／`assessInvolving` **移出**共用；`layoutStore.test.ts` **未修改且全綠** |
| A0 效能 JSDoc | 設備數超過約 200 時呼叫端自行 debounce／增量；此前不做最佳化 |
| A1 回傳 | **discriminated union** `ConnectResult`；`message` 不進 union → `describeConnectFailure` |
| A1 順序 | **先**提 `resolveConnections` 錨點共用，**再**寫 `canConnect` |
| A1 本週不做 | `addPipeline` 內部防線（10/11）；L2 呼叫端（toby／10/18） |
| `label` | 落子端填 **`machine.name`（中文名）**；本週不建工廠 |
| 解鎖句 | **本版不發** |

---

## 4. 本週結束應更新

| # | 動作 | 誰／何處 | 狀態 |
|---|------|----------|------|
| 1 | A0 合入；回寫 ROADMAP B2／B1 相關進度句（若有） | aaaaa | `[ ]` |
| 2 | 回寫 todolist_v14 狀態 | Agent／aaaaa | `[ ]` |
| 3 | REVIEW／E3／PENDING 日誌補一行 | 決策層 `0921/` | `[ ]`（開版已建） |
| 4 | 9/27 門檻結果回寫 [ROADMAP §9.1](../../roadmap/ROADMAP_OUTLINE.md) | 主編／aaaaa | 結算時 |
| — | **不動** CLAUDE §4.6 索引、AGENT_ROADMAP 版本 | 已知過期，下次一併補 | 維持 |

---

## 5. 驗收對照（公開）

以 [WEEK_20260921 §0.1](../../work_dispatch/WEEK_20260921.md) 為準。aaaaa 對應 **V2（A0）**；A1 不在 V1–V8 之列。

門檻日實況見決策層 [REVIEW §3](../collaborator_survey/dispatch_private/0921/REVIEW_20260921.md)（以 `git`／`gh` 為準）。

| 項 | 對象 | 本週實況（截至 2026-09-27，`gh`／`origin/master`） |
|----|------|------------------------------------------------------|
| **V1** | toby T1 | **未達**；未見 W0921-T1 PR；`usePlacementIntent.ts` 不在 master |
| **V2** | aaaaa A0 | **程式已達本分支**；**PR／master 未達**（見 closeout） |
| V3 | goodmorning G1 | **未達**；#48 仍 OPEN，最後活動 2026-09-14T17:37Z |
| V4 | shirone S1 | **達成**；#53 於 09-24 合入（10×R100 rename＋`MainLayout` 一行） |
| V5 | dernoson D0 | 觀察中（待審僅 #48；選取／旋轉／刪除未見放行） |
| V6 | harry H1 | **未達**；`pipelinePolyline.ts`／`PipelinePolylineDemo.vue` 不在 master |
| V8 | paper P1 | 未核（加分） |

> 判定實況一律以 `git`／`gh` 為準，不以文件宣稱為準。

---

## 6. 日誌

### 2026-09-27（v1.6）

- 負責人確認開 PR；定案單 PR 分節（A0＋A1）；下一＝合入後 P5

### 2026-09-27（v1.5）

- 收斂盤點：[V14_closeout](../dev/dev_v14/V14_closeout.md)；程式齊、PR 未開；P1–P6
- addPipeline 防線已提前；§0／§1 改寫

### 2026-09-27（v1.4）

- E1：品質閘綠；DoD 證據、USAGE、週報、INTRO、演示頁齊；**PR 暫緩等確認**
- §0／§1 改寫；下一優先＝負責人確認後開 PR

### 2026-09-27（v1.3）

- V14-D1 完成：`canConnect`＋`portAnchorIndex`／`portMedia` 共用；未動 `layoutStore`
- §0／§1 改寫；下一優先＝開 PR（A0／A1 分開）或 E1

### 2026-09-27（v1.2）

- V14-C1 實作完成：`placementCheck.ts`＋store 提共用＋測試；不發解鎖句
- §0／§1／§5 改寫；下一優先＝開 PR 或（有餘裕）D1

### 2026-09-27（v1.1）

- V14-B1 完成：#51 合入、零 `src/` 殘刀、簽章＝V13-D1 §3；`dev_v13/` meta 與 todolist_v13 指向已收斂
- V14-A1 完成；狀態總覽改「前置完成、主線待開」；**下一刀＝C1／A0**
- §0／§1 優先序改寫；已知過期索引（CLAUDE／AGENT_ROADMAP）仍不動

### 2026-09-27（v1.0）

- v1.0：依 WEEK v1.2／W0921-A0／A1 開 AGENT_WEEK；執行計畫＝todolist_v14＋dev_v14
- 負責人確認：文件時態＝執行計畫（交期維持工單原文、狀態全 `[ ]`）；REVIEW＝門檻日結算風格；不發解鎖句
- A1（connectRules）進 todolist 為正式次優項；未交零影響
- 對齊決策層 `dispatch_private/0921/`（REVIEW／E3／INTRO／PENDING_20260927）
