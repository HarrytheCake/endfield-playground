# W0921-A0｜aaaaa｜落子前預檢：把 store 的私有檢查提成純函式

| meta | value |
|------|-------|
| 週次 | 2026-09-21 → 2026-09-27（**M2 門檻週**） |
| 等級 | **確定・最優** |
| 擋門檻 | **是**（9/27 硬綁 B1；B1 → B2 落子鏈 → 本項） |
| 交期 | **9/24（三）**，讓 T1 有三天可接 |
| 前置 | 全部已在 master：`layoutStore` [#45](https://github.com/dernoson/endfield-playground/pull/45)、容器 [#50](https://github.com/dernoson/endfield-playground/pull/50) |
| 設計稿 | [V13-D1 §3 簽章草案](../../../aaaaa/dev/dev_v13/D1_placement_precheck_gap.md)（你自己 9/19 寫的，本週照它做） |
| 上游 | [ROADMAP detail/B2](../../../roadmap/detail/B2_placement_chain.md)、[WEEK_20260921](../../WEEK_20260921.md) |
| 產能參考 | 自報 3–5h；本項是提共用＋兩支簽章＋測試，不含新演算法 |

---

## 0. 白話目標

`layoutStore` 現在只有「做了才知道」的入口：要知道一台機器放不放得下，只能真的呼叫 `addDevice`。

B2 的互動是「游標在格點上移動，每一格都要即時顯示能不能放」。用現有 API 做這件事，L2 得為每一格 mousemove 生一個用完就丟的 uid，而且拿到的 `conflicts` 裡認不出哪一邊是自己。

**一句話：把 `collectLayoutIssues`／`assessInvolving` 這兩支模組私有函式搬出來，包成 `canPlaceDevice`／`canMoveDevice`。**

**這是搬家共用，不是另寫一份。** 另寫一份的症狀是「預覽說綠的、放下去卻失敗」，而且極難查——與 [C2 §4.4](../../../roadmap/detail/C2_add_connection_contract.md) 要避免的是同一類錯誤。

---

## 1. 一句話驗收

**`canPlaceDevice(draft, layout)` 不寫 store、不生 uid、不進 history，回傳的 `PlacementResult` 與事後真的 `addDevice` 一致；`layoutStore.test.ts` 原樣綠。**

---

## 2. 交哪個檔

| 動作 | 檔案 |
|------|------|
| 新建 | `src/utils/layout/placementCheck.ts` |
| 新建 | `src/__tests__/utils/layout/placementCheck.test.ts` |
| 重構 | `src/store/layoutStore.ts`（把兩支私有函式移出，`addDevice`／`moveDevice` 改呼叫） |

簽章照 [V13-D1 §3](../../../aaaaa/dev/dev_v13/D1_placement_precheck_gap.md) 原文，本工單不重述，避免兩份漂移。三個要點：

1. **回傳沿用既有 `PlacementResult`**，不新增型別——L2 對 `addDevice` 與 `canPlaceDevice` 才能用同一套 narrowing
2. **`DeviceDraft` 不含 `id`**，型別本身擋掉「拿預檢當落子用」
3. **`conflicts` 裡的 draft 用 `DRAFT_ID = '__draft__'` 代稱**，這個值要在測試裡釘住

---

## 3. 不要碰

| 不要 | 為什麼 |
|------|--------|
| `src/editor/layout/LayoutView.vue`、`GridCanvas.vue` | toby 本週的鎖；預檢的呼叫端是他 |
| `src/editor/toolbar/*` | 同上（落子意圖） |
| `editorStore` 任何簽名 | 舊藍圖世界；本項不經該路徑 |
| 順手把 `rotateDevice` 一起做了 | B3 排序未定（[V13-D1 §6](../../../aaaaa/dev/dev_v13/D1_placement_precheck_gap.md) 缺口 2），本週不開 |
| 再寫一份派工長文 | 上期 45 條路徑幾乎全是文件；本週產出以 `src/` 為準 |

---

## 4. 效能：要寫進 JSDoc 的一句話

`collectLayoutIssues` 是全量的——所有 devices 與 pipelines 展開佔格再跑 `detectOverlaps`。拖曳時每格呼叫一次等於每格跑一次全量。

幾十台設備沒問題，但**不要讓 toby 以為它免費**。在 `canPlaceDevice` 的 JSDoc 寫明：

> 設備數超過約 200 時，呼叫端應自行 debounce 或改增量判定；在此之前不做最佳化。

---

## 5. DoD

- [ ] `placementCheck.ts` 匯出 `canPlaceDevice`／`canMoveDevice`／`DRAFT_ID`／`DeviceDraft`／`LayoutView`
- [ ] `layoutStore` 的 `collectLayoutIssues`／`assessInvolving` 已**移出**（不是複製），`addDevice`／`moveDevice` 改呼叫共用版
- [ ] **`src/__tests__/store/layoutStore.test.ts` 未修改且全綠**（store 對外行為不變的證據）
- [ ] 新測試涵蓋：空地可放／重疊拒絕且 `conflicts` 含 `__draft__`／未知機型 invalid／非有限座標 invalid／移動到自己原位可放
- [ ] `canPlaceDevice` 的 JSDoc 含 §4 的效能門檻句
- [ ] 全域搜尋確認未 import `editorStore`、未改 `src/editor/*`
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 綠
- [ ] PR body 一行：`DRAFT_ID` 的值與 toby 該怎麼從 `conflicts` 認出自己

---

## 6. 交檔

分支 `dev/aaaaa0921`，標題帶 `W0921-A0`。**9/24 前開 PR**——不是因為你慢，是 toby 要接。

---

## 7. 卡住找誰

| 狀況 | 找誰 |
|------|------|
| 提共用後 store 測試紅 | 先貼失敗案例到 Discord，不要改測試去配合實作 |
| toby 問簽章 | 直接指 [V13-D1 §3](../../../aaaaa/dev/dev_v13/D1_placement_precheck_gap.md)，不要在 Discord 重寫一遍 |
| 想順手補 `createPlacedDevice` 工廠 | 見 [A1 §3](./W0921-A1_connect_rules.md)；本週由 toby 在落子端自己組，工廠延後 |

---

## 8. 未交頂替

T1 改用「放下去才知道」的作法：直接 `addDevice`，失敗就不落子、沒有即時預覽。**9/27 的 B1 門檻仍可成立**（門檻句是「拉真機器放到畫布」，不是「拖曳時有綠框」），但拖曳體驗降級，且 L2 有動機自己 import `detectOverlaps` 重算——那才是真正要防的事，所以本項寧可早交也不要拖到週末。
