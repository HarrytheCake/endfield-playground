# V15-E1 — 驗收、PR、交接

**對應工項：** V15-E1
**狀態：** `[x]` #60／#65 皆 MERGED（2026-10-18 收斂）
**日期：** 2026-10-10（2026-10-11 拆分／修正；2026-10-18 合入回寫）
**依賴：** [C1](./C1_devices_outside_base.md) `[x]`、[D1](./D1_port_hit_test.md) `[x]`
**正式依據：** [W1004-A0 §5](../../../work_dispatch/aaaaa/1004/W1004-A0_dispatch_and_e003.md)、[WEEK §0.2 V10](../../../work_dispatch/WEEK_20261004.md)

---

## 1. 驗收結果

| # | 步驟 | 預期 | 結果 |
|---|------|------|------|
| 1 | `pnpm test` | 綠 | **48 files／896 tests 通過**（拆分後重跑） |
| 2 | `pnpm type-check` | 綠 | **通過** |
| 3 | `pnpm lint-check` | 綠 | **通過** |
| 4 | `pnpm format-check` | 綠 | **通過** |
| 5 | diff 不含鎖檔 | `GridCanvas`／`MainLayout`／`ToolbarPanel`／detectors／TopBarButton 零命中 | **通過**（`src/` 只新增 `devicesOutsideBase`＋測試） |
| 6 | 未改 `canPlaceDevice` | `placementCheck.ts`／`layoutStore.ts` 無 diff | **通過** |
| 7 | 公開 V10 | ②③ 皆有測試 | **通過**（#60＋#65 皆 MERGED） |

---

## 2. PR

| 項 | 內容 |
|----|------|
| PR | [#60](https://github.com/dernoson/endfield-playground/pull/60) |
| 標題 | `W1004-A0：devicesOutsideBase（V15）` |
| 分支 | `dev/aaaaa1004` → `master` |
| 範圍 | 文件＋`devicesOutsideBase`；`hitTestPortAt` 已移出（審查阻擋，見 [D1 §8](./D1_port_hit_test.md)） |
| 合入序 | **不排換殼序**（WEEK：A0 送來就審）；toby #61 等著接 |
| 解鎖句 | **不發** |
| 後續 PR | [#65](https://github.com/dernoson/endfield-playground/pull/65)（`dev/aaaaa1004-hitTestPortAt`） |

---

## 3. 交接產物

| 產物 | 對象 | 一句話 |
|------|------|--------|
| `devicesOutsideBase(devices, baseRegion)` | toby T1 | 回傳 id 上 Error 樣；`null` 基地回 `[]`；不擋落子 |
| `hitTestPortAt(point, devices, ?, { prefer })` | 10/11 C1 L2 | 連續格座標；圓心＝埠視覺邊心；熱區 0.5；拖線 `prefer:'output'`、放開 `prefer:'input'` |

口頭節奏：[INTRO](../../collaborator_survey/dispatch_private/1004/INTRO_A0_devices_outside_and_port_hit.md)

---

## 4. 合入後回寫

- [x] todolist_v15 → ②③ 結案（2026-10-18）
- [x] AGENT_WEEK_1004／決策層（結算時已併入 W1004 週報）
- [x] ③ [#65](https://github.com/dernoson/endfield-playground/pull/65) MERGED 2026-10-12
- [ ] WEEK V10 勾選（主編／結算時；公開層可於下週結算補）

---

## 5. DoD

- [x] §1 驗收表通過（②③）
- [x] PR 已開並合入
- [x] 下游一句話寫進 PR body
- [x] ③ [#65](https://github.com/dernoson/endfield-playground/pull/65) MERGED

---

## 6. 開發日誌

### 2026-10-18｜結案收斂

- #60／#65 皆 MERGED；狀態改 `[x]`；後續 C5 → V16

### 2026-10-11｜③ 後續修正

- 熱區圓心改 `portPointOnMachine`；四向視覺點測試；待 push／開 PR

### 2026-10-11｜審查拆分

- 審查：② 可接受；③ 熱區圓心偏移阻擋
- #60 移出 `portHitTest.ts`／測試與宣告完成的勾選；改標題與 body

### 2026-10-10｜驗收＋開 PR

- 品質閘四項全綠；type-check 修一處漏 import
- 三 commit；PR 開至 master

### 2026-10-10

- 建檔
