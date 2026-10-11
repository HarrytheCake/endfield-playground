# V14-C1 — 落子前預檢（`placementCheck`｜W0921-A0）

**對應工項：** V14-C1
**狀態：** `[x]` 完成（2026-09-27）
**日期：** 2026-09-27
**依賴：** [A1](./A1_scope_decision.md) `[x]`、[B1](./B1_v13_residue_close.md) `[x]`
**正式工單：** [W0921-A0](../../../work_dispatch/aaaaa/0921/W0921-A0_placement_precheck.md)
**簽章依據：** [V13-D1 §3](../dev_v13/D1_placement_precheck_gap.md)（**不在本檔重述全文，避免雙源**；V14-B1 已確認為唯一依據）
**交期：** **9/24**（工單原文）
**對照公開驗收：** WEEK §0.1 **V2**
**開發分支：** `dev/aaaaa0921`
**產物：** `src/utils/layout/placementCheck.ts`、`src/__tests__/utils/layout/placementCheck.test.ts`；重構 `src/store/layoutStore.ts`

---

## 1. 背景與動機

`layoutStore` 只有「做了才知道」的入口（`addDevice`／`moveDevice`）。檢查邏輯齊全，但 `collectLayoutIssues`／`assessInvolving` 是模組私有——L2 無法在不寫入、不生 uid 的前提下預檢。

若 L2 自行拼 `detectOverlaps`＋佔格函式，會變成兩套判定。本項把私有檢查**搬出來共用**，預檢與真落子走同一路徑。

---

## 2. 技術決策

| 決定 | 理由 |
|------|------|
| 回傳沿用 `PlacementResult` | L2 對預檢與 `addDevice` 用同一套 narrowing |
| `DeviceDraft` 不含 `id` | 型別擋「拿預檢當落子」 |
| `DRAFT_ID = '__draft__'` | conflicts 裡認出 draft；測試釘死 |
| `canMoveDevice` 一併出 | 與落子共用佔格計算；分開交等於做兩次 |
| 提共用、非複製 | store 改呼叫共用版；行為不變的證據＝`layoutStore.test.ts` 未改且全綠 |
| JSDoc 寫效能門檻 | 全量 `collectLayoutIssues` 不便宜；約 200 台以上呼叫端自行 debounce |

簽章型別與函式宣告以 V13-D1 §3 為準。本檔只列落點與驗證。

---

## 3. 檔案修改計畫

| 動作 | 檔案 |
|------|------|
| 新建 | `src/utils/layout/placementCheck.ts` |
| 新建 | `src/__tests__/utils/layout/placementCheck.test.ts` |
| 重構 | `src/store/layoutStore.ts`（移出兩支私有函式；`addDevice`／`moveDevice` 改呼叫） |
| **不碰** | `src/editor/*`、`editorStore`、`layoutStore.test.ts`（**不修改該測試檔**） |

---

## 4. 測試計畫

新測試至少涵蓋：

1. 空地可放 → `ok: true`
2. 重疊拒絕 → `ok: false`；`conflicts` 含 `'__draft__'`
3. 未知機型 → `invalid`
4. 非有限座標 → `invalid`
5. 移動到自己原位 → 可放

回歸：`pnpm test` 下既有 `layoutStore.test.ts` 全綠，且該檔 `git diff` 為空。

---

## 5. 驗證標準（DoD）

對照 [W0921-A0 §5](../../../work_dispatch/aaaaa/0921/W0921-A0_placement_precheck.md)：

- [x] 匯出 `canPlaceDevice`／`canMoveDevice`／`DRAFT_ID`／`DeviceDraft`／`LayoutView`
- [x] 私有函式已**移出**（非複製）
- [x] `layoutStore.test.ts` 未修改且全綠
- [x] §4 五類測試覆蓋
- [x] JSDoc 含「約 200 台」效能句
- [x] `grep editorStore` 於 `placementCheck.ts` 零命中；diff 不含 `src/editor/*`
- [x] 品質閘全綠（type-check／eslint 本檔／prettier 本檔／相關 test）
- [ ] PR body 一行：`DRAFT_ID` 值與 toby 如何從 conflicts 認出自己（開 PR 時）
- [ ] PR 標題帶 `W0921-A0`；分支 `dev/aaaaa0921`（開 PR 時）

### 公開驗收速查（WEEK §0.2 A0）

| 步驟 | 預期 |
|------|------|
| `pnpm type-check`＋`pnpm test` | 全綠 |
| `git diff src/__tests__/store/layoutStore.test.ts` | **空** |
| `grep -n "editorStore" src/utils/layout/placementCheck.ts` | 零命中 |
| diff | 不含 `src/editor/*` |

---

## 6. 未交頂替

T1 改用直接 `addDevice`（失敗不落子）。V1 門檻句仍可能成立，但無即時預覽，且 L2 可能自算重疊——**本項寧可早交**。

---

## 7. 開發日誌

### 2026-09-27（實作）

- 新建 `placementCheck.ts`：移出 `collectLayoutIssues`／`assessInvolving`／`positionFinite`／`pipelineWaypointsValid`；匯出 `canPlaceDevice`／`canMoveDevice`／`DRAFT_ID`
- `layoutStore` 改 import 共用版；`layoutStore.test.ts` **未改**且 36 條全綠；新測 6 條全綠
- JSDoc 含「約 200 台」效能句（`canPlaceDevice`／`canMoveDevice`／`collectLayoutIssues`）
- 品質閘：type-check 過；本檔 prettier／eslint 過

### 2026-09-27（開版）

- 開版；簽章不重述，指向 V13-D1 §3
- 現況：`placementCheck.ts` 不存在於 master
- **B1 完成後：** 前置解除；本檔標「可開工」；下一動作＝開分支實作
