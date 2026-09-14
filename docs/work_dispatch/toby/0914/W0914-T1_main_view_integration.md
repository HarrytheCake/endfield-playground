# W0914-T1｜toby｜把新畫布接上主畫面（L2 第二刀）

| meta | value |
|------|-------|
| 週次 | 2026-09-14 → 2026-09-20 |
| 等級 | **確定・本週主戲** |
| 擋門檻 | 否（佈局殼接入；**9/27 硬綁仍只押 B1**。擺放／選取等底層接完再開） |
| 前置 | [#46](https://github.com/dernoson/endfield-playground/pull/46) 已合入；**[#45](https://github.com/dernoson/endfield-playground/pull/45) 合入後再開工**（主編 09/15 裁：勿用 fixture 頂替） |
| 教學檔 | [GUIDE_main_view_integration.md](./GUIDE_main_view_integration.md) |
| 你的檔 | `src/editor/layout/LayoutView.vue`（新）、`src/editor/layout/GridCanvas.vue`、`src/app/layouts/MainLayout.vue`（僅 `area-canvas`） |
| 配對窗口 | **有（本週名額給你）**；dernoson 或 aaaaa，Discord 約 |
| 產能參考 | 自報 3–5h；你較晚才有空——與等 #45 合入的時程對得上 |

---

## 0. 白話目標

上週交付終點在 Storybook。**這週起不用了。**

主編 9/13：**L2 的核心是把 L1 與 L3 接進主畫面。** 驗收現場＝`pnpm dev` 首頁。

一句話：**#45 合入後，首頁佈局視角改畫你的 `GridCanvas`，資料來自 `useLayoutStore()`。**

舊的 `FactoryCanvas` **留在原地不刪、不加深**。照稿件的視角切換器**本週不做**（Avery 跟不上稿；下週另派人）——你不必自己發明角落按鈕。

**本週仍然只讀。** 不做點擊、拖曳、選取、擺放。

---

## 1. 一句話驗收

**#45 已在 master 之後：`pnpm dev` 開首頁 → 中間畫布是新的 SVG 格點與設備方塊，資料來自 layoutStore。**

---

## 2. 現在長怎樣

`MainLayout.vue` 目前：

```vue
<div class="area-canvas">
    <FactoryCanvas />
</div>
```

換成容器餵 `GridCanvas`：

```text
MainLayout.vue
  └─ LayoutView.vue（新）   ← 拿資料（useLayoutStore）
       └─ GridCanvas.vue    ← 只負責畫（保持無 store import）
```

細節與骨架見 [GUIDE](./GUIDE_main_view_integration.md)。

---

## 3. 資料從哪來（已定案）

| 條件 | 作法 |
|------|------|
| **#45 已合入** | `useLayoutStore()` → `devices`／`pipelines` 餵給 `GridCanvas`；可 `loadSnapshot` 載一組初始內容 |
| **#45 未合入** | **先不要開工接線**（主編裁：合併後再行開工）。可先讀 GUIDE、對好檔案計畫 |

讀取面是 `readonly` 的——本週你也不需要寫入（除了可選的一次 `loadSnapshot` 塞初始資料）。

---

## 4. 邊界

| 允許 | 不要 |
|------|------|
| 新建 `LayoutView.vue` | 刪／改壞 `FactoryCanvas.vue` |
| 改 `MainLayout.vue` 的 `area-canvas` | 加深 Vue Flow；做擺放／選取 |
| 改自己的 `GridCanvas.vue`（例如接受 transform） | 在 `GridCanvas.vue` 裡 import store |
| `LayoutView` 裡 `useLayoutStore()` | 碰 `useGridViewport.ts`（harry） |
| import harry 的 composable（他合入後） | 本週做「照稿」的視角切換器 UI（下週另派） |
| — | 碰 `ToolbarPanel.vue`、`src/editor/inspector/*`、`StatsPanel`（shirone） |

---

## 5. 平移縮放

harry 收 [#47](https://github.com/dernoson/endfield-playground/pull/47)。他合入後你可在 `LayoutView` **import**（不改他的檔）。他還沒合入：固定尺寸也算過關。

---

## 6. 本週不做

| 項 | 什麼時候 |
|----|----------|
| 擺放／選取 | 底層接完後再開（主編：勿搶跑） |
| 照稿的視角切換器 | **下週另派人**（非 Avery） |
| 設備方塊正式視覺 | goodmorning 工具列合入後另排 |
| 拔掉 `FactoryCanvas` | 新殼站穩＋切換器到位後再排廢除 |

---

## 7. 交檔

分支 `dev/toby0914`，標題帶 `W0914-T1`。**推到分支就算交付。**

---

## 8. DoD

- [ ] **#45 已合入 master** 之後才開的 PR（或 PR 描述寫明基於已含 store 的 master）
- [ ] `LayoutView.vue` 存在，資料來源為 `useLayoutStore()`
- [ ] `MainLayout.vue` 的 `area-canvas` 掛 `LayoutView`
- [ ] `pnpm dev`：格線＋設備方塊（＋管線）
- [ ] `GridCanvas.vue` 內 `grep` 不到 `store`、`vue-flow`
- [ ] `pnpm type-check`、`pnpm lint-check` 綠
- [ ] diff 不含 `useGridViewport.ts`、`ToolbarPanel.vue`、inspector、StatsPanel
- [ ] PR body 一行：資料如何載入初始內容；**本週無切換器**

---

## 9. 卡住找誰

| 狀況 | 找誰 |
|------|------|
| layoutStore 讀取面 | aaaaa |
| MainLayout／Vue／拆 PR | dernoson |
| 想擴大到擺放 | **先回報**，不要自己開 |

> 超過一天沒進展講一聲。本週只有這一塊。

---

## 10. 未交頂替

佈局視角維持舊殼，演示不中斷。不計個人失敗；週三前回報一句進度即可。
