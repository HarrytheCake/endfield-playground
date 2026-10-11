# V14 驗收證據 — W0921-A0／A1 工單 DoD 逐條查證

**週次：** 2026-09-21 → 2026-09-27
**負責人：** aaaaa
**查證時間：** 2026-09-27
**分支：** `dev/aaaaa0921`（相對 `origin/master`）
**工單：** [W0921-A0](../../../../work_dispatch/aaaaa/0921/W0921-A0_placement_precheck.md)、[W0921-A1](../../../../work_dispatch/aaaaa/0921/W0921-A1_connect_rules.md)
**結論：** **兩張工單程式 DoD 全部成立**；另提前 `addPipeline`←`canConnect`、方向＝有序 output→input。**PR [#54](https://github.com/dernoson/endfield-playground/pull/54)**（單支分節）。

> 判定一律以 `git`／本機品質閘實查為準，不以文件宣稱為準。

---

## 1. W0921-A0｜落子前預檢（公開 V2）

| # | DoD | 查證 | 結果 |
|---|-----|------|------|
| 1 | `placementCheck.ts` 匯出 `canPlaceDevice`／`canMoveDevice`／`DRAFT_ID`／`DeviceDraft`／`LayoutView` | `src/utils/layout/placementCheck.ts` 存在；`export const DRAFT_ID = '__draft__'` | **成立** |
| 2 | 提共用、非複製；store 改呼叫共用版 | `layoutStore.ts` diff 刪私有檢查、改 import `canPlaceDevice`／`canMoveDevice` | **成立** |
| 3 | `layoutStore.test.ts` **未修改**且全綠 | `git diff origin/master...HEAD -- src/__tests__/store/layoutStore.test.ts` → **空**；`pnpm test` 該檔綠 | **成立** |
| 4 | 新測：空地／重疊含 `__draft__`／未知機型／非有限／移動原位 | `placementCheck.test.ts`（93 行） | **成立** |
| 5 | JSDoc 含約 200 台效能句 | `collectLayoutIssues`／`canPlaceDevice` 註解 | **成立** |
| 6 | 未 import `editorStore`；diff 不含 `src/editor/*` | grep 零命中；`git diff --name-only` 無 `src/editor` | **成立** |
| 7 | 品質閘綠 | 見 §3 | **成立** |
| 8 | PR body 宣告 `DRAFT_ID` | [#54](https://github.com/dernoson/endfield-playground/pull/54) body | **已開** |

---

## 2. W0921-A1｜連線規則（次優・不擋門檻）

| # | DoD | 查證 | 結果 |
|---|-----|------|------|
| 1 | 錨點提共用；`resolveConnections` 既有測未改且綠 | `portAnchorIndex.ts`；`git diff …/resolveConnections.test.ts` → **空** | **成立** |
| 2 | `canConnect` discriminated union；無 `message` | `ConnectResult` 型別；失敗走 `describeConnectFailure` | **成立** |
| 3 | 規則 7（斷線放行）有測 | `connectRules.test.ts` | **成立** |
| 4 | 媒質與 FlowEngine 共用 | `portMedia.ts`／`getMachinePortMedia`；`useFlowEngine` 改呼叫 | **成立** |
| 5 | 與 A0 分開 commit | 初版分開；其後防線提前再動 `layoutStore.addPipeline` | **程式成立**；開 PR 見 closeout P1 |
| 5b | （提前）`addPipeline` 呼叫 `canConnect` | `layoutStore.ts`＋`layoutStore.canConnect.test.ts` | **已做**（超工單「本週不做」） |
| 6 | PR 標題／body 帶 `W0921-A1` | [#54](https://github.com/dernoson/endfield-playground/pull/54) 第二節 | **已開** |

---

## 3. 品質閘實跑（2026-09-27）

| 指令 | 結果 |
|------|------|
| `pnpm type-check` | 綠 |
| `pnpm lint-check` | 綠（既有 warn 不擋） |
| `pnpm test` | **46 files／854 tests** 全綠 |
| 焦點測 | `placementCheck`＋`connectRules`＋`layoutStore`＋`resolveConnections`＝62 綠 |

---

## 4. 全分支 `src/` 變更清單（相對 `origin/master`）

```text
src/__tests__/utils/layout/connectRules.test.ts     （新增）
src/__tests__/utils/layout/placementCheck.test.ts   （新增）
src/composables/useFlowEngine.ts                    （媒質改共用）
src/store/layoutStore.ts                            （預檢改呼叫共用）
src/utils/layout/connectRules.ts                    （新增）
src/utils/layout/placementCheck.ts                  （新增）
src/utils/layout/portAnchorIndex.ts                 （新增）
src/utils/layout/portMedia.ts                       （新增）
src/utils/layout/resolveConnections.ts              （錨點改共用）
src/app/dev/PlacementConnectCheckDemo.vue           （週會演示）
src/app/dev/standalone/placementConnectCheckMain.ts （獨立入口）
dev/placement-connect-check.html                    （Vite 獨立 HTML）
```

**與他人開著的鎖檔零重疊：** 未觸 `LayoutView`／`GridCanvas`／`ToolbarPanel`／`MainLayout`／`usePlacementIntent`。

---

## 5. 週會視覺化

| 項 | 值 |
|----|-----|
| 入口 | `pnpm dev` → `http://localhost:5173/dev/placement-connect-check.html` |
| 內容 | A0 四卡（空地／重疊／未知／原位）＋ A1 四卡（合法／規則 7／媒質／佔用） |
| 約束 | **不寫入 store**；不掛 `src/router` |

口頭節奏見 [INTRO](../../../collaborator_survey/dispatch_private/0921/INTRO_A0_placement_precheck.md)；L2 接線見 [USAGE](../USAGE_l2_placement_and_connect.md)。

---

## 6. 可自行重跑

```bash
git diff origin/master...HEAD -- src/__tests__/store/layoutStore.test.ts
git diff origin/master...HEAD -- src/__tests__/utils/layout/resolveConnections.test.ts
pnpm type-check && pnpm test
rg editorStore src/utils/layout/placementCheck.ts src/utils/layout/connectRules.ts
git diff --name-only origin/master...HEAD | rg "^src/editor"
```

預期：前兩條 diff **空**；品質閘綠；rg **零命中**。
