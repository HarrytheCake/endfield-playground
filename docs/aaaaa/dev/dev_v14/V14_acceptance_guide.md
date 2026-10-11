# V14 驗收指南 — aaaaa 本週交付（A0 落子前預檢＋A1 次優）

**週次：** 2026-09-21 → 2026-09-27
**負責人：** aaaaa
**最後更新：** 2026-09-27（收斂盤點；PR 待開）
**工單：** [W0921-A0](../../../work_dispatch/aaaaa/0921/W0921-A0_placement_precheck.md)、[W0921-A1](../../../work_dispatch/aaaaa/0921/W0921-A1_connect_rules.md)
**對照公開驗收：** [WEEK_20260921 §0.1](../../../work_dispatch/WEEK_20260921.md)（aaaaa＝**V2**）
**執行計畫：** [todolist_v14](../todolist_v14.md)＋本目錄
**收斂盤點：** [V14_closeout.md](./V14_closeout.md)
**DoD 逐條證據：** [evidence/V14_dod.md](./evidence/V14_dod.md)
**週報／用法：** [V14_week_report.md](./V14_week_report.md)、[USAGE_l2_placement_and_connect.md](./USAGE_l2_placement_and_connect.md)

---

## 0. 交付總覽

| 工項 | 內容 | PR | 分支 |
|------|------|-----|------|
| A0 落子前預檢 | `canPlaceDevice`／`canMoveDevice` 提共用 | [#54](https://github.com/dernoson/endfield-playground/pull/54) | `dev/aaaaa0921` |
| A1 連線規則（次優） | `canConnect`＋錨點共用＋addPipeline 防線 | 同上（body 第二節） | 同上 |
| 週會演示 | 綠／紅卡純函式頁 | 同上 | 同上 |

**A1 不在 WEEK V1–V8 之列**——次優、不擋門檻。公開對應項只有 **V2**。

**想跳過細讀：** [evidence/V14_dod.md](./evidence/V14_dod.md) 已逐條列出查證方式與結果。

---

## 1. 這是程式 PR（非純文件）

| 項 | 值 |
|----|-----|
| 動到的目錄 | `src/utils/layout/`、`src/store/layoutStore.ts`、`src/__tests__/`、`src/composables/useFlowEngine.ts`、`src/app/dev/`、`dev/` |
| 要跑品質閘 | **是** |
| 解鎖句 | **無** |

---

## 2. C1 — A0 預檢（約 5 分鐘）

| 檢查 | 預期 | 2026-09-27 |
|------|------|------------|
| 檔案存在 | `src/utils/layout/placementCheck.ts` | `[x]` |
| 匯出 | `canPlaceDevice`／`canMoveDevice`／`DRAFT_ID`／`DeviceDraft`／`LayoutView` | `[x]` |
| `DRAFT_ID` | `'__draft__'`（字面釘死） | `[x]` |
| store | 私有檢查已移出；`addDevice`／`moveDevice` 呼叫共用版 | `[x]` |
| `git diff …/layoutStore.test.ts` | **空** | `[x]` |
| 新測試 | 空地／重疊含 draft／未知機型／非有限座標／移動原位 | `[x]` |
| JSDoc | 含約 200 台效能句 | `[x]` |
| `grep editorStore placementCheck.ts` | 零命中 | `[x]` |
| diff | 不含 `src/editor/*` | `[x]` |

### 手動對照 WEEK §0.2 A0

```text
pnpm type-check
pnpm test
git diff origin/master...HEAD -- src/__tests__/store/layoutStore.test.ts
```

---

## 3. D1 — A1 連線規則（已交；約 5 分鐘）

| 檢查 | 預期 | 2026-09-27 |
|------|------|------------|
| 檔案 | `connectRules.ts`＋測試 | `[x]` |
| 順序證據 | `resolveConnections` 有提共用；既有測試未改且綠 | `[x]` |
| `canConnect` | discriminated union；無 `message` | `[x]` |
| 規則 7 | 斷線（null 端點）→ `ok: true` 有測 | `[x]` |
| A1 commit 未改 layoutStore 行為契約 | 與 A0 分開 commit | `[x]` |
| 與 A0 | **不同 PR**（開 PR 時） | 待開 |

---

## 4. 品質閘（實跑 2026-09-27）

```text
pnpm type-check   → 綠
pnpm lint-check   → 綠
pnpm test         → 45 files／847 tests 綠
```

---

## 5. 視覺／週會（約 1 分鐘）

```text
1. pnpm dev → http://localhost:5173/dev/placement-connect-check.html
2. A0 分頁：空地綠／重疊紅；JSON 含 __draft__
3. A1 分頁：合法綠、規則 7 綠；媒質／佔用紅＋ describe 文案
4. 確認：本頁不寫 store、不經 src/router
```

口頭稿：[INTRO](../../collaborator_survey/dispatch_private/0921/INTRO_A0_placement_precheck.md)

---

## 6. 公開驗收對照

| 公開項 | 對象 | 開版時（門檻日快照） | 驗收後（本分支） |
|--------|------|----------------------|------------------|
| V2 | aaaaa A0 | 未達（master 無檔） | **程式條件已達**；合入 master 仍待 PR |
| V1 | toby T1 | 未達 | 未變（非本項） |
| V4 | shirone S1 | 已達（#53） | 已達 |

門檻日結算原文見 [REVIEW §3](../../collaborator_survey/dispatch_private/0921/REVIEW_20260921.md)；本節是交付後複驗。

---

## 7. 日誌

### 2026-09-27｜開 PR

- [#54](https://github.com/dernoson/endfield-playground/pull/54)；單支分節；合入前公開 V2 仍記未達

### 2026-09-27｜收斂盤點

- 程式齊（含方向＋addPipeline 提前）；[V14_closeout](./V14_closeout.md) 列 P1–P6；**PR 仍待開**

### 2026-09-27｜驗收

- 品質閘全綠；DoD 證據寫入 `evidence/V14_dod.md`
- 新增週會演示頁與 USAGE／週報／INTRO 更新
- **PR 暫不開**（等負責人確認）

### 2026-09-27｜開版

- 開版；對齊 W0921-A0／A1 DoD 與 WEEK §0.2 速查
