# W1004-H1｜harry｜工具列與左右面板掛上正式頁；拆舊底欄與舊右側

| meta | value |
|------|-------|
| 週次 | 2026-10-04 → 2026-10-11 |
| 等級 | **確定・本週主戲** |
| 擋門檻 | 否 |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 正式畫面槽位對白紙稿；下方舊工具列區與右側舊面板殼消失｜`src/app/layouts/MainLayout.vue`（本週全檔）｜`GridCanvas` script、`layoutStore`、StatsPanel 內部｜paper（對稿）、G／S（元件）、toby（畫布容器尺寸） |

---

## 0. 白話目標

會議：把**工具列、左、右**接到正式畫面；**下面那條舊工具列、右邊那塊舊面板要拿掉**。

現況 `MainLayout.vue` 仍是：Navbar → 左 `ProjectSidebar` → 中 `LayoutView` → **底 `ToolbarPanel`** → 右 `StatsPanel` → **更右 `InspectorSidebar`**。底欄與 Inspector 就是要卸的舊殼。

新工具列視覺在 [#48](https://github.com/dernoson/endfield-playground/pull/48)，**你不要重做工具列。** #48 沒合之前，先改槽位、用現有 `ToolbarPanel` 掛到稿上的位置；合入後自然長新樣子。

---

## 1. 一句話驗收

**`pnpm dev` 首頁：工具列不在舊底欄位置（對稿）；左邊有設備／專案面板槽；右邊是產線總覽；`InspectorSidebar` 不再出現在正式頁。** `InspectorSidebar.vue` 檔案還在。

---

## 2. 你要做的

| # | 做什麼 |
|---|--------|
| 1 | 對白紙稿標出工具列／左／右／畫布四塊在 DOM 的位置（class 名可改，但只要一套） |
| 2 | `ToolbarPanel` 從 `area-toolbar` 舊底欄移到稿上的位置 |
| 3 | 右側只留 shirone 的 `StatsPanel`（路徑已是 `src/app/StatsPanel`） |
| 4 | **卸載** `InspectorSidebar`（`v-model:open` 一併刪）。左邊若稿上是「選取後才出現的設備資訊」，先做空槽＋`v-show`；點管線變藍／填內容可與 P1 平行，**本週沒有選取資料也要把槽位留對** |
| 5 | 不要刪 `FactoryCanvas.vue`；不要把它重新掛回正式頁 |

`ProjectSidebar` 若稿上左邊已是設備面板、專案改走漢堡，以稿為準；不確定就 Discord 問白紙一句，不要猜兩套都留。

---

## 3. 不要碰

- `GridCanvas.vue`／`LayoutView.vue` 內部（toby）
- StatsPanel 各子檔內容（shirone）
- 旋轉、Delete、管線 draft
- 把舊 Inspector 整顆搬到左邊充數（結構／資料都是舊藍圖世界）

---

## 4. DoD

- [ ] MainLayout 無下方舊 `area-toolbar` 布局
- [ ] 正式頁 DOM 找不到 `InspectorSidebar`
- [ ] `InspectorSidebar.vue`、`FactoryCanvas.vue` 仍存在
- [ ] 落子鏈未被你拆掉（工具列仍能 `arm`）
