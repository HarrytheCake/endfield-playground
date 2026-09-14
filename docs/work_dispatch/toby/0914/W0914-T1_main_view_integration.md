# W0914-T1｜toby｜把新畫布接上主畫面（L2 第二刀）

| meta | value |
|------|-------|
| 週次 | 2026-09-14 → 2026-09-20 |
| 等級 | **確定・本週主戲** |
| 擋門檻 | **是**（9/27 必要項已擴大為 B1＋B2＋B4；本項是 B2 的落腳處） |
| 前置 | [#46](https://github.com/dernoson/endfield-playground/pull/46) 已合入（你上週的 `GridCanvas`）；[#45](https://github.com/dernoson/endfield-playground/pull/45) `layoutStore` 本週第一順位合入 |
| 教學檔 | [GUIDE_main_view_integration.md](./GUIDE_main_view_integration.md)（含可照抄的骨架） |
| 你的檔 | `src/editor/layout/LayoutView.vue`（新）、`src/editor/layout/GridCanvas.vue`（你的）、`src/app/layouts/MainLayout.vue` |
| 配對窗口 | **有（本週名額給你）**；dernoson 或 aaaaa，Discord 約 |
    10|| 產能參考 | 自報 3–5h |

---

## 0. 白話目標

上週的工單把你的交付終點畫在 Storybook。**這週起不用了。**

主編 9/13 已裁定：**L2（你和 harry）的核心任務就是把 L1 的功能與 L3 的元件接進主畫面**——不是做展示台。所以本週驗收現場改成 `pnpm dev` 打開的那個首頁。

一句話：**首頁的佈局視角，畫的東西要換成你上週做的 `GridCanvas`。**

舊的 `FactoryCanvas`（Vue Flow 那個）**留在原地不刪**，但它不再是入口；你要留一顆切換按鈕，萬一新的畫不出來，主編能切回去看舊的。

**本週仍然只讀。** 不做點擊、不做拖曳、不做選取、不做擺放——那些是 9/21 的事（見 §6）。

---

## 1. 一句話驗收

**`pnpm dev` 開首頁 → 中間畫布區是新的 SVG 格點與設備方塊；點一顆按鈕能切回舊的 Vue Flow 畫布。**

---

## 2. 現在長怎樣

`src/app/layouts/MainLayout.vue` 目前是這樣掛的：

```vue
<div class="area-canvas">
    <FactoryCanvas />
</div>
```

你要把它換成一個**新的容器元件**，由容器去餵 `GridCanvas`：

```text
MainLayout.vue
  └─ LayoutView.vue（新，你寫）   ← 這一層負責「拿資料」
       └─ GridCanvas.vue（已存在）  ← 這一層只負責「畫」
```

**為什麼要多一層？** 因為 `GridCanvas` 現在是乾淨的——它只吃 props，檔案裡 `grep` 不到 `store`。這個性質要保住（dernoson 會檢查）。所以「去 store 拿資料」這件事寫在 `LayoutView.vue`，不要寫進 `GridCanvas.vue`。

具體怎麼寫看 [GUIDE](./GUIDE_main_view_integration.md) §2，有骨架可以照抄。

---

## 3. 資料從哪來

| 情況 | 怎麼做 |
|------|--------|
| #45 已合入（預期週前段） | `const layout = useLayoutStore()`，把 `layout.devices`／`layout.pipelines` 餵給 `GridCanvas` |
| #45 還沒合入 | 先用 `src/data/mockLayout.ts` 的 fixture 餵，**容器裡留一行註解標明是暫時的** |

**不要為了等 #45 而停工。** 先用 fixture 把接線做完，等 store 進 master 再換那一行資料來源——換的是同一支檔案的同一個地方，成本很低。

`layoutStore` 的讀取面是 `readonly` 的，你拿到的東西不能直接改。這是刻意的，本週你也不需要改。

---

## 4. 邊界

| 允許 | 不要 |
|------|------|
| 新建 `src/editor/layout/LayoutView.vue` | **刪除或改壞** `src/editor/canvas/FactoryCanvas.vue`（保留退路） |
| 改 `src/app/layouts/MainLayout.vue` 的 `area-canvas` 區塊（**本週該檔歸你**） | 往 `FactoryCanvas`／Vue Flow 加任何新功能 |
| 改自己的 `src/editor/layout/GridCanvas.vue`（例如接受 transform） | 在 `GridCanvas.vue` 裡 import 任何 store |
| 在 `LayoutView.vue` 裡 `useLayoutStore()` | 碰 `src/editor/layout/useGridViewport.ts`（**harry 的檔**） |
| 切換開關畫在 `LayoutView.vue` 內部（畫布角落一顆按鈕就好） | 為了那顆按鈕去改 `Navbar.vue` 或 `ToolbarPanel.vue`（後者本週歸 goodmorning） |
| 刪掉自己上週的 `GridCanvas.stories.ts`？**不要刪**，留著沒壞處 | 碰 `src/editor/inspector/*`（B4 接線排 9/21） |

---

## 5. 平移縮放怎麼辦

harry 本週在收 [#47](https://github.com/dernoson/endfield-playground/pull/47)（`useGridViewport`），那是**他的檔**。

- **他合入了**：你可以在 `LayoutView.vue` 裡 `import { useGridViewport }` 直接用。這是 import 別人的檔，不是改別人的檔，允許。
- **他還沒合入**：本週先不做平移縮放，畫布固定尺寸也算過關（V3 不擋 V2）。
- **需要 `GridCanvas` 支援 transform 才接得上**：那支檔是你的，你改。**請 harry 在 Discord 說明他要什麼**，不要讓他直接改。

---

## 6. 本週不做（明列，免得被問）

| 項 | 什麼時候 |
|----|----------|
| 點畫布放設備（擺放鏈 R-B2） | 9/21；本週互動仍鎖 |
| 點設備出資訊（選取 R-B4） | 9/21；shirone 本週只交面板元件，接線不是本週的事 |
| 設備方塊的正式視覺 | goodmorning 之後會做佈局視角的設備樣式，本週維持你現在的藍方塊 |
| 拔掉 `FactoryCanvas` | 等新殼站穩再排廢除工項 |

---

## 7. 交檔

分支 `dev/toby0914`，開 PR，標題帶 `W0914-T1`。**推到分支就算交付**，合入與否是主編的事。

---

## 8. DoD

- [ ] `src/editor/layout/LayoutView.vue` 存在，內含資料來源（store 或 fixture）
- [ ] `MainLayout.vue` 的 `area-canvas` 掛的是 `LayoutView`，不是 `FactoryCanvas`
- [ ] `pnpm dev` 開首頁：看得到格線＋設備方塊（＋管線，若 fixture／store 有資料）
- [ ] 切換開關可切回舊 `FactoryCanvas`，切過去不報錯
- [ ] `GridCanvas.vue` 內 `grep` 不到 `store`、`vue-flow`
- [ ] `pnpm type-check`、`pnpm lint-check` 綠
- [ ] diff 不含 `useGridViewport.ts`、`ToolbarPanel.vue`、`src/editor/inspector/*`
- [ ] PR body 一行：資料來源是 store 還是 fixture、切換開關在哪

---

## 9. 卡住找誰

| 狀況 | 找誰 |
|------|------|
| `layoutStore` 的讀取面怎麼用、型別對不上 | aaaaa |
| `MainLayout` 的排版格子、Vue 寫法、要不要拆 PR | dernoson |
| 覺得「只讀」讓你做不出東西 | **先回報一句再改做法**，不要自己擴大到擺放 |

> **超過一天沒進展就講一聲。** 本週只有這一塊，不會再加第二塊——你自述「工項太雜會被拆成多次而延宕」，所以主戲只給一件事。

---

## 10. 未交頂替

佈局視角維持舊 `FactoryCanvas`，演示不中斷。但**本項是 9/27 B2 的落腳處**：未交時 B2／B4 必要項須於 9/20 週日會依 [ROADMAP_OUTLINE](../../../roadmap/ROADMAP_OUTLINE.md) §11 重新降級，見 [WEEK_20260914](../../WEEK_20260914.md) §2.1。**不計你個人失敗**，但請在週三前回報一句進度。
