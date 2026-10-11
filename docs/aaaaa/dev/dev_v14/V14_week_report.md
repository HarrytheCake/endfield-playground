# V14 週報 — 落子預檢＋連線規則（aaaaa｜0921）

**週次：** 2026-09-21 → 2026-09-27（M2 門檻週）
**負責人：** aaaaa
**分支：** `dev/aaaaa0921`
**狀態：** **PR [#54](https://github.com/dernoson/endfield-playground/pull/54) 交審中**（單支分節；合入前公開 V2 未達）
**撰寫：** 2026-09-27
**收斂：** [V14_closeout](./V14_closeout.md)

---

## 1. 本週交什麼

| 工項 | 公開對應 | 產物 | 狀態 |
|------|----------|------|------|
| A0 落子前預檢 | WEEK **V2** | `placementCheck.ts`；store 提共用 | 程式 `[x]`；[#54](https://github.com/dernoson/endfield-playground/pull/54) |
| A1 連線規則 | 次優 | `connectRules`＋錨點／媒質共用；**addPipeline**←`canConnect` | 同上（PR 第二節） |
| 週會演示 | — | `/dev/placement-connect-check.html` | `[x]` |

**不發解鎖句。** 選取／旋轉／刪除仍鎖。

---

## 2. 為什麼重要（門檻句）

- **V2**：toby 要問「這格放不放得下」——預檢已提出共用
- **V1（T1）** 仍缺；A0 合入前可用「放下去才知道」，禁止自算重疊

---

## 3. 驗收摘要

| 檢查 | 結果 |
|------|------|
| `pnpm test`（854）／`type-check` | 綠 |
| `layoutStore.test.ts`／`resolveConnections.test.ts` 未改 | 是 |
| `DRAFT_ID === '__draft__'` | 是 |
| 方向＝output→input；非法管線 `addPipeline`→invalid | 是 |
| 演示頁獨立 HTML | 是 |

---

## 4. 週會

| 資源 | 用途 |
|------|------|
| [INTRO](../../collaborator_survey/dispatch_private/0921/INTRO_A0_placement_precheck.md) | 口頭 |
| [USAGE](./USAGE_l2_placement_and_connect.md) | L2 接線 |
| 演示 | `/dev/placement-connect-check.html` |
| [closeout](./V14_closeout.md) | 待處理 P1–P6 |

**收束句：** 能不能放／能不能連已提出共用；store 擋非法連線；不解鎖選取；**PR 待開**。

---

## 5. 下游／待處理

```text
toby：canPlaceDevice；conflicts 認 __draft__
10/04：錨點共用與 addPipeline 防線已提前 → 改排其餘 C2／L2 highlight
P1：單 PR 分節交審（A0＋A1）← 負責人已確認
合入後：ROADMAP B2／公開 DoD（closeout P5）
```

範圍宣告見 [E1 §2.1](./E1_acceptance_and_handoff.md)。
