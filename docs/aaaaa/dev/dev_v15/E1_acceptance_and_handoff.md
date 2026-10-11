# V15-E1 — 驗收、PR、交接

**對應工項：** V15-E1
**狀態：** `[~]` #60＝②；後續 PR＝③（`dev/aaaaa1004-hitTestPortAt`）
**日期：** 2026-10-10（2026-10-11 拆分／修正）
**依賴：** [C1](./C1_devices_outside_base.md) `[x]`、[D1](./D1_port_hit_test.md) `[~]`
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
| 7 | 公開 V10 | ②③ 皆有測試 | **一半**：② 審查通過；③ 退回待後續 PR |

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
| 後續 PR | `dev/aaaaa1004-hitTestPortAt`：`hitTestPortAt` 熱區圓心＝埠視覺邊心 |

---

## 3. 交接產物

| 產物 | 對象 | 一句話 |
|------|------|--------|
| `devicesOutsideBase(devices, baseRegion)` | toby T1 | 回傳 id 上 Error 樣；`null` 基地回 `[]`；不擋落子 |
| `hitTestPortAt(point, devices)` | 10/11 C1 L2 | 連續格座標（原點＝格左上角）；圓心＝埠視覺邊心；熱區 0.5；回傳 PortRef＋side＋media |

口頭節奏：[INTRO](../../collaborator_survey/dispatch_private/1004/INTRO_A0_devices_outside_and_port_hit.md)

---

## 4. 合入後回寫

- [ ] todolist_v15 → ② 結案；③ 指向後續 PR
- [ ] AGENT_WEEK_1004 §0／§4
- [ ] 決策層 REVIEW／PENDING 日誌一行
- [ ] WEEK V10 勾選（主編／結算時；③ 合入後才滿）

---

## 5. DoD

- [x] §1 驗收表通過（② 範圍）
- [x] PR 已開
- [x] 下游一句話寫進 PR body
- [~] ③ 後續 PR 分支已備（開 PR 時勾）

---

## 6. 開發日誌

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
