# V14-E1 — 驗收、PR、0928 交接

**對應工項：** V14-E1
**狀態：** `[x]` **已合 master**（#54／#55｜2026-09-27 MERGED；文件收斂 2026-10-10｜[V15-B1](../dev_v15/B1_v14_residue_close.md)）
**日期：** 2026-09-27（合入查證 2026-10-10）
**依賴：** [C1](./C1_placement_precheck.md) `[x]`；[D1](./D1_connect_rules.md) `[x]`
**驗收集：** [V14_acceptance_guide.md](./V14_acceptance_guide.md)
**證據：** [evidence/V14_dod.md](./evidence/V14_dod.md)
**收斂盤點：** [V14_closeout.md](./V14_closeout.md)
**週報／用法／口頭：** [V14_week_report.md](./V14_week_report.md)、[USAGE](./USAGE_l2_placement_and_connect.md)、[INTRO](../../collaborator_survey/dispatch_private/0921/INTRO_A0_placement_precheck.md)

---

## 1. 目標

個人與 review_gate 可依同一清單過關；PR body 講清楚這是 **L1 預檢提共用＋連線規則純函式（含 store 防線提前量）**，不是再解一層互動。

---

## 2. 本版不發解鎖句

V11 發過 `layout-L1`，V12 發過 `layout-store`。**V14 不發。**

理由：點擊落子已於 9/23 放行；本版只交預檢／連線純函式。選取／旋轉／刪除仍鎖（WEEK §2.1）。

### 2.1 PR body 用的範圍宣告（可複製）

因後期 `addPipeline` 亦動 `layoutStore.ts`，**定案：單 PR、body 分兩節**（負責人 2026-09-27 確認）。

**PR：** [#54](https://github.com/dernoson/endfield-playground/pull/54)（單支；body 分 A0／A1）

**A0（主線／公開 V2）：**

```text
W0921-A0：canPlaceDevice／canMoveDevice（提共用，非另寫）。
layoutStore.test.ts 未改且全綠。DRAFT_ID='__draft__'。
不發解鎖句；選取／旋轉／刪除仍鎖。toby 可從 conflicts 用 __draft__ 認出預檢對象。
```

**A1（次優＋提前量）：**

```text
W0921-A1：canConnect＋describeConnectFailure；錨點與 resolveConnections 共用；媒質與 FlowEngine 共用。
方向＝有序 output→input（反向亦拒）。
提前：addPipeline 已呼叫 canConnect（原排 10/11）；失敗→PlacementResult invalid。
斷線管線（規則 7）仍可寫入；單端命中時已命中端仍查方向／媒質／佔用。
已知缺口：addDevice／moveDevice 貼埠不重跑 canConnect（見 V14_closeout P7）。
L2 highlight 仍排 10/18。
```

### 2.2 禁止

- 寫成「擺放已完成」——完成的是預檢入口，落子鏈是 T1
- 暗示選取／旋轉／刪除已開
- 把方向誤寫成「只擋同向、反向也算連上」

---

## 3. 上游回寫清單

| #   | 檔                                                                 | 動作                    | 狀態                 |
| --- | ------------------------------------------------------------------ | ----------------------- | -------------------- |
| 1   | [todolist_v14](../todolist_v14.md)                                 | 狀態／待處理回寫        | `[x]` 盤點時         |
| 2   | [V14_closeout](./V14_closeout.md)                                  | 收斂盤點                | `[x]`                |
| 3   | [ROADMAP detail/B2](../../../roadmap/detail/B2_placement_chain.md) | A0 合入後補開發日誌     | `[~]` 可續掛（非擋） |
| 4   | [ROADMAP_OUTLINE](../../../roadmap/ROADMAP_OUTLINE.md) §9.1        | 9/27 門檻結算           | `[~]` WEEK_1004 已結算 M2 |
| 5   | 公開 W0921-A0／A1 DoD                                              | 合入後勾選              | `[~]` 可續掛         |
| 6   | 決策層 REVIEW／PENDING                                             | 補交付一行              | `[~]` 見 closeout P5 |
| 7   | todolist_v14 狀態總覽                                              | 改已合／結案            | `[x]` V15-B1         |

---

## 4. 0928 交接摘要（PR body 或 Discord）

```text
0921 L1（V14；單 PR 分節交審）：
  - A0：placementCheck.ts；DRAFT_ID=__draft__；layoutStore.test.ts 未改
  - A1：connectRules＋錨點／媒質共用；方向 output→input；addPipeline 已接 canConnect
  - 演示：/dev/placement-connect-check.html
  - 不發解鎖句；選取仍鎖

下游：
  - toby：落子鏈呼叫 canPlaceDevice；勿自算 detectOverlaps
  - 10/04：錨點共用與 addPipeline 防線已提前；改排 L2 highlight／其餘 C2 切片
```

---

## 5. DoD

- [x] C1 DoD 全勾（見 evidence）
- [x] D1 DoD 全勾（含方向修正＋addPipeline 提前）
- [x] PR body 含 §2.1 範圍宣告（開 PR 時貼上）
- [x] 未發解鎖句
- [x] todolist_v14／closeout 已回寫
- [x] 週會演示頁＋USAGE／INTRO／週報
- [ ] PR 合入 master（公開 V2）

---

## 6. 開發日誌

### 2026-09-27｜開 PR

- 負責人確認；定案單 PR 分節（A0＋A1）；P1 關閉為進行中

### 2026-09-27｜收斂盤點

- 寫 [V14_closeout](./V14_closeout.md)：程式齊、PR 未開；提出 P1–P6
- 更新 §2.1（A1 含 addPipeline 提前量）

### 2026-09-27｜驗收＋說明文件

- 品質閘綠；DoD 證據；USAGE／週報／演示頁
- 其後：方向語意修正；`addPipeline` 接 `canConnect`

### 2026-09-27

- 開版；固定不發解鎖句與 PR 宣告模板
