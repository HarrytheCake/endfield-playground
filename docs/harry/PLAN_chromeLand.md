# 待實作：正式畫面換殼（工具列／左／右槽位對稿，卸舊底欄與舊 Inspector）— W1004-H1

**狀態：** 已實作並驗證（2026-10-11），未 commit；PR 描述草稿見 [PR_DESCRIPTION_1011.md](PR_DESCRIPTION_1011.md)
**實作後追加（使用者指示）：** 右側產線總覽收合鈕；`useShortcuts.ts` 修 Esc 被舊 `placementArmed` 永久擋下；`.area-stage` 加 `isolation: isolate` 修工具列蓋過左側選單
**對應工單：** [docs/work_dispatch/harry/1004/W1004-H1_chrome_land.md](../work_dispatch/harry/1004/W1004-H1_chrome_land.md)
**週總表：** [WEEK_20261004.md](../work_dispatch/WEEK_20261004.md) §2.2 檔案鎖、§2.1 合入序
**要改的檔案：** `src/app/layouts/MainLayout.vue`（本週全檔歸 harry）；`src/style.css` 的版面規則（見 §6 問題 3）
**唯讀參考（不改）：** `ToolbarPanel.vue`（goodmorning）、`LayoutView.vue`／`GridCanvas.vue`（toby）、`src/app/StatsPanel/*`（shirone）、`InspectorSidebar.vue`（凍結）、`ProjectSidebar.vue`、`Navbar.vue`、`spec/assets/mockup_main_screen.svg`、PR #48 的 `ToolbarPanel.vue`（`e9b6116`）

---

## 1. 範疇判定

純 L2 接線：只決定**哪個元件掛在哪個槽**，不改任何元件內部。

| 動作 | 檔案 | 歸屬 | 允許？ |
|------|------|------|--------|
| 改槽位結構、卸載 `InspectorSidebar`、新增左側空槽 | `MainLayout.vue` | harry 本週全檔 | 是 |
| 改版面 grid 規則（目前寫在全域 CSS） | `src/style.css` | 鎖表未列 | 待確認（§6-3） |
| 工具列外觀 | `ToolbarPanel.vue` | goodmorning | **否**——等 #48 |
| 畫布容器內部、視窗數學 | `LayoutView.vue`／`GridCanvas.vue` | toby | **否**——只提供尺寸正確的容器 |
| 右側內容 | `StatsPanel/*` | shirone | **否** |
| 刪檔 | `InspectorSidebar.vue`／`FactoryCanvas.vue` | 凍結 | **否**——只卸載 |

---

## 2. 既有介面盤點

### 2.1 現在的 `MainLayout.vue`

```
.editor-layout（flex 直排）
├ header.area-navbar → Navbar（:sidebar-open／@toggle-sidebar）
└ .area-workspace（flex 橫排）
   ├ ProjectSidebar v-model:open="sidebarOpen"     ← USidebar，icon rail，absolute 疊在 header 下方
   ├ .workspace-main（CSS grid：1fr 320px × minmax(0,1fr) 148px）
   │   ├ .area-canvas  → LayoutView               grid-area: canvas
   │   ├ .area-toolbar → ToolbarPanel             grid-area: toolbar  ← 舊底欄
   │   └ .area-stats   → StatsPanel               grid-area: stats（跨兩列）
   └ InspectorSidebar v-model:open="inspectorOpen" ← 舊右側殼
```

script 另有 `useValidation()` → `useFlowEngine()`，順序有依賴，**保留不動**。

### 2.2 版面 CSS 在哪

`.editor-layout`／`.area-navbar`／`.area-workspace`／`.workspace-main`／`.area-canvas`／`.area-toolbar`／`.area-stats` 全寫在 `src/style.css:22-71`。全專案 grep 確認**只有 `MainLayout.vue` 用到這些 class**。

### 2.3 各元件對容器的期待

| 元件 | 根節點 | 對父層的要求 |
|------|--------|--------------|
| `LayoutView` | `relative h-full w-full overflow-auto` | 父層要有明確高寬（`min-h-0`／`min-w-0`） |
| `ToolbarPanel`（master 現行） | `.toolbar-panel { height: 100% }` | 父層要給明確高度（現在靠 grid 列 148px） |
| `ToolbarPanel`（#48 `e9b6116`） | `pointer-events-none absolute bottom-0 left-0 z-50 w-full`，可收合 | **父層要是 `relative` 的畫布區**，工具列疊在畫布下緣，不再佔獨立一列 |
| `StatsPanel` | `div.stats-panel pt-4` | 父層給寬度與可捲動高度 |
| `ProjectSidebar`／`InspectorSidebar` | `USidebar`，container `absolute top-(--ui-header-height)` | 放在 `.area-workspace` flex 內，靠 `gap` 元素佔寬 |

**關鍵發現：** #48 的工具列是**疊在畫布下緣的浮層**，不是獨立的底欄。這就是工單說的「工具列不在舊底欄位置（對稿）」——槽位要做成「畫布區內、貼底的浮層」，#48 合入後才不用再改 MainLayout。

### 2.4 對稿依據

我看不到 paper 的 Figma 原檔，只能用 repo 內的三個轉譯來源：

| 來源 | 工具列 | 左側 | 右側 |
|------|--------|------|------|
| `spec/assets/mockup_main_screen.svg` | 全寬底欄（跨畫布＋右側） | 物件資訊面板 280px，**從畫布左緣滑入、疊在畫布上**，點空白收回 | 產線總覽 310px |
| PR #48 `ToolbarPanel`（goodmorning 依白紙稿） | 畫布區內貼底浮層，可收合 | — | — |
| `PaperFigMainField.vue`（凍結參考頁） | 頂部浮層＝標題＋頂欄按鈕（MBD 下週）；底部設備列 | — | — |

spec SVG 是早期示意，#48 是本週依白紙稿實作的版本，**兩者衝突時以 #48 為準**。

---

## 3. 設計

### 3.1 目標結構

```
.editor-layout（flex 直排，h-full）
├ header.area-navbar → Navbar
└ .area-workspace（flex 橫排，flex-1 min-h-0）
   ├ ProjectSidebar（暫留，見 §6-2）
   ├ .area-stage（relative，flex-1 min-w-0 min-h-0，overflow-hidden）     ← 畫布＋兩個浮層
   │   ├ .area-canvas（absolute inset-0）→ LayoutView
   │   ├ aside.area-device-panel（absolute left-0，w-[280px]，v-show）    ← 左槽，本週空
   │   └ .area-toolbar-dock（absolute inset-x-0 bottom-0）→ ToolbarPanel  ← 工具列槽
   └ aside.area-stats（w-[320px] shrink-0，overflow-y-auto）→ StatsPanel  ← 右槽
```

- **工具列：** 從 grid 底列移進 `.area-stage` 貼底。畫布不再被底欄擠矮；工具列疊在畫布下緣
- **左槽：** `.area-device-panel` 疊在畫布左緣，`v-show="devicePanelVisible"`。本週 `devicePanelVisible` 是 `ref(false)`，**沒有任何東西會打開它**；下週 P1／C1 接選取時才接上。DOM 裡一直存在，G／S 或 C1 可以直接往裡面掛元件
- **右槽：** 只剩 `StatsPanel`，獨立一欄、全高
- **卸載：** 移除 `InspectorSidebar` 的 import、`inspectorOpen` ref、`<InspectorSidebar v-model:open>`
- **`.workspace-main` grid 拿掉**，改成上面的 flex＋absolute 疊層

### 3.2 master 現行 `ToolbarPanel` 的過渡處理

現行 `ToolbarPanel` 是 `height: 100%`，放進沒有高度的 dock 會塌掉。過渡期：

- `.area-toolbar-dock` 先給 `h-[148px]`（沿用舊底欄高度），讓現行工具列能完整顯示、可點、可 `arm`
- **#48 合入後要跟進一刀（harry，一行等級）：** 拿掉 dock 的固定高度，改 `pointer-events-none`，讓 #48 自己的 `pointer-events-auto` 與收合接手；不然收合後 dock 仍會擋住畫布下緣 148px 的點擊

這一刀 #48 不能代做（`MainLayout` 本週鎖在 harry），寫進 PR body 的「已知跟進」。

### 3.3 class 名稱（定了就不改）

工單要求「只要一套」，G／S 會從槽位 import 元件，所以命名一次到位：

| class | 角色 | 備註 |
|-------|------|------|
| `editor-layout` | 根 | 沿用 |
| `area-navbar` | 頂欄 | 沿用 |
| `area-workspace` | 頂欄以下整塊 | 沿用 |
| `area-stage` | 畫布＋浮層的定位容器 | 新 |
| `area-canvas` | 畫布 | 沿用名稱，改為填滿 stage |
| `area-device-panel` | 左槽（設備資訊） | 新 |
| `area-toolbar-dock` | 工具列槽 | 新；**刻意不叫 `area-toolbar`**，DoD 要 grep 得到「舊 `area-toolbar` 已消失」 |
| `area-stats` | 右槽 | 沿用 |

`workspace-main`、`area-toolbar` 移除。

### 3.4 不變的部分

- `useValidation()` → `useFlowEngine()` 呼叫與順序
- `Navbar` 的 props／emit 與 `sidebarOpen` 狀態（除非 §6-2 決定拿掉 `ProjectSidebar`）
- `usePlacementIntent` 是模組層級 `ref`，工具列換位置不影響武裝狀態；`LayoutView` 讀同一份

---

## 4. 驗證計畫

1. 四項檢查：`pnpm type-check` / `lint-check` / `format-check` / `test`
2. grep：`src/app/layouts/MainLayout.vue` 內無 `InspectorSidebar`、無 `area-toolbar"`、無 `workspace-main`；`InspectorSidebar.vue`、`FactoryCanvas.vue` 檔案仍在
3. `pnpm dev` 首頁手動：
   - 工具列貼在畫布下緣，不再是獨立底欄；右側只有產線總覽，最右邊沒有 Inspector
   - DevTools `document.querySelector('[class*="Inspector"]')`、搜 "Inspector" 文字皆無
   - **落子鏈：** 工具列點一台真機器 → 點畫布空格 → 設備出現（`arm` 仍通）
   - 暫時把 `devicePanelVisible` 改 `true`：左槽疊在畫布左緣、不推擠畫布；確認後改回 `false`
   - 視窗寬 1280／1600 各看一次：畫布有高寬、可平移縮放，右側不被擠掉
4. `git diff --stat` 只含 `MainLayout.vue`（＋若 §6-3 同意則 `style.css`）

---

## 5. 明確不做（本工單邊界）

- 不改 `ToolbarPanel.vue` 外觀（#48）、不刪舊五顆按鈕（G1）
- 不改 `LayoutView.vue`／`GridCanvas.vue`、不動 `useGridViewport`
- 不刪 `InspectorSidebar.vue`／`FactoryCanvas.vue`，不把 `FactoryCanvas` 掛回正式頁
- 不把舊 Inspector 內容搬進左槽充數
- 不做選取、點管線變藍、左槽內容（P1 稿＋下週 C1）
- 不掛 MBD 的頂欄按鈕（工單寫 10/11 下週才掛）
- 不新增快捷鍵（例如 #48／paper 參考頁的 Z 鍵收合，那是 `ToolbarPanel` 內部的事）
- 不修 `LayoutView` 空畫布自動載入 fixture 的已知債

---

## 6. 待確認問題（2026-10-11 已裁）

| # | 題目 | 裁決 |
|---|------|------|
| 1 | 工具列浮層寬度 | **只蓋畫布**——dock 放在 `.area-stage` 內 |
| 2 | `ProjectSidebar` 去留 | **先問 paper**——本 PR 不動 `ProjectSidebar`（原樣保留掛載與 `sidebarOpen`），其餘照做；paper 回覆後再決定是否另開一刀 |
| 3 | 版面 CSS 位置 | **搬進 `MainLayout.vue`**——刪除 `style.css` 中只有 MainLayout 使用的版面規則 |

以下為裁決前的原始選項，保留備查。

1. **工具列浮層寬度：只蓋畫布，還是橫跨畫布＋右側？**
   - 建議：**只蓋畫布**（dock 放在 `.area-stage` 內）。#48 的根節點是 `absolute … w-full`，跟著最近的定位祖先走；放在 stage 內就是畫布寬，右側產線總覽保持全高
   - 替代：dock 放在 `.area-workspace` 層，工具列橫跨到右側底下（spec SVG 的畫法），但右側會被蓋住下緣
   - 這一點白紙稿應該看得出來，不確定請問 paper
2. **`ProjectSidebar` 去留：**
   - 建議：**本週保留**。它是專案導覽的 icon rail，跟「選取後才出現的設備資訊」不是同一塊；左槽設計成疊在畫布上，兩者不會搶同一個位置
   - 若白紙稿把專案改走漢堡選單、左邊只剩設備面板 → 拿掉 `ProjectSidebar`，但 `Navbar` 的漢堡按鈕要誰改？`Navbar.vue` 不在 H1 範圍，需要另外協調
   - 工單原話：不確定就 Discord 問白紙一句，**不要猜兩套都留**
3. **版面 CSS 放哪：**
   - 建議：把版面規則從 `src/style.css` **搬進 `MainLayout.vue`**（Tailwind class 或 `<style scoped>`），刪掉 `style.css` 裡只有 MainLayout 在用的 7 條規則。好處是版面只有一個出處，下週再調不用碰全域檔
   - 替代：留在 `style.css` 原地改。`style.css` 不在鎖表內，但屬全域共用檔，動它要在 PR body 交代
