# PR Description 草稿：正式畫面換殼（W1004-H1）

以下內容可直接複製進 GitHub PR 描述欄。

---

## Summary

- `MainLayout` 拿掉舊底欄 `area-toolbar` 與舊 grid `workspace-main`；工具列改為**疊在畫布區下緣**的槽位（對齊 #48 的 `absolute bottom-0` 浮層設計）
- **卸載 `InspectorSidebar`**（import、`inspectorOpen`、`v-model:open` 一併移除）；`InspectorSidebar.vue` 檔案保留
- 右側只剩 `StatsPanel`，獨立一欄、全高
- 新增左側設備資訊空槽 `area-device-panel`（`v-show`，本週預設隱藏，等 P1／C1 接選取）
- 右側產線總覽可收合：畫布右上角切換鈕，收合時欄寬歸零、畫布補滿；StatsPanel 不卸載（面板內輸入值保留）
- **修 Esc 快捷鍵設定開不起來**：點過舊五顆按鈕後 `editorStore.placementArmed` 無人解除（原本只有 `FactoryCanvas` 會解除，但它 09-20 起已不在正式頁），`openSettings` 被永久擋下。改由 `useShortcuts` 補一個固定 Escape 監聽解除拿起
- `.area-stage` 加 `isolation: isolate`，內部浮層的 z-index 不外溢——否則工具列會蓋過 `ProjectSidebar` hover 展開時的面板
- 版面 CSS 從全域 `src/style.css` 搬進 `MainLayout.vue` 的 `<style scoped>`（全專案只有 MainLayout 用這些 class）

## 槽位結構（class 定案，G／S／C1 請從這裡掛元件，不要改 class）

```
.editor-layout
├ header.area-navbar → Navbar
└ .area-workspace
   ├ ProjectSidebar（原樣保留，去留待 paper 回覆）
   ├ .area-stage（relative＋isolation；畫布＋浮層的定位容器）
   │   ├ .area-canvas（absolute inset-0）→ LayoutView
   │   ├ aside.area-device-panel（absolute 左緣 280px，v-show）← 左槽
   │   ├ section.area-toolbar-dock（absolute 貼底）→ ToolbarPanel ← 工具列槽
   │   └ .area-stats-toggle（右上角，收合／展開產線總覽）
   └ aside#area-stats.area-stats（320px ↔ 0）→ StatsPanel ← 右槽
```

## 變更檔案

| 檔案 | 變更 |
|------|------|
| `src/app/layouts/MainLayout.vue` | 槽位重排、卸載 Inspector、新增左槽、右側收合鈕、版面 scoped style |
| `src/composables/useShortcuts.ts` | 新增固定 Escape 監聽解除舊拿起狀態；註冊在 `openSettings` 之後，一次 Esc 只做一件事 |
| `src/style.css` | 刪除 7 條只有 MainLayout 使用的版面規則（`editor-layout`、`area-*`、`workspace-main`） |

未改：`ToolbarPanel.vue`、`LayoutView.vue`、`GridCanvas.vue`、`StatsPanel/*`、`InspectorSidebar.vue`、`FactoryCanvas.vue`、`Navbar.vue`、`ProjectSidebar.vue`。

## 已知跟進（#48 合入後，harry 一刀）

現行 `ToolbarPanel` 是 `height: 100%`，所以 `.area-toolbar-dock` 暫給固定 `148px`。#48 的根節點自帶 `absolute` 與收合，合入後要把 dock 改成**不設高度＋`pointer-events: none`**，否則工具列收合後 dock 仍會擋住畫布下緣 148px 的點擊。#48 不能代做（MainLayout 本週鎖在 harry）。

## 明確不在本次範圍內

- 工具列外觀、舊五顆按鈕移除（#48／G1）
- `ProjectSidebar` 去留——等 paper 回覆白紙稿左側是否改漢堡選單
- 左槽內容、點管線變藍、選取（P1 稿＋下週 C1）
- MBD 頂欄按鈕掛載（10/11 下週）
- `GridCanvas` 仍是 12×8 固定尺寸、畫布下緣會被工具列蓋住一部分——無邊界畫布與平移是 T1（toby）

## 驗證

```
pnpm type-check   # 通過
pnpm lint-check   # 通過
pnpm format-check # 通過
pnpm test         # 47 個測試檔、888 個測試全通過
```

`pnpm dev` 以無頭 Edge 實測首頁（1600×1000、1280×800）：

- 工具列位於畫布區內貼底（1600 寬下 dock 為 x=64 起、寬 1216、高 148），右側產線總覽 320px 全高
- DOM 無 `.area-toolbar`／`.workspace-main`、無右側 sidebar、頁面文字無「Inspector」
- `ProjectSidebar` icon rail 仍在左側
- **落子鏈：** 點工具列「塑型機 3×3」→ 點畫布空格 → 佔格由 2 格變 11 格（多 9 格），`arm` 正常
- 手動讓左槽顯示：疊在畫布左緣 280px、不推擠畫布寬度
- 右側收合：欄寬 320 → 0、畫布寬 1216 → 1536；再展開後倉庫容量輸入值仍在；`aria-expanded` 正確切換
- Esc：新頁面按 Esc 開設定 ✅；點真機器後按 Esc 開設定 ✅；**點舊五顆後第一次 Esc 取消拿起、第二次 Esc 開設定 ✅**（修正前兩次都打不開）
- `ProjectSidebar` hover 展開時蓋在工具列之上（修正前被工具列蓋住）
- console 無錯誤

DoD：

- [x] MainLayout 無下方舊 `area-toolbar` 布局
- [x] 正式頁 DOM 找不到 `InspectorSidebar`
- [x] `InspectorSidebar.vue`、`FactoryCanvas.vue` 仍存在
- [x] 落子鏈未被拆掉（工具列仍能 `arm`）

## 對應文件

| 項目 | 文件 |
|------|------|
| 計畫 | [docs/harry/PLAN_chromeLand.md](PLAN_chromeLand.md) |
| 原始工單 | [docs/work_dispatch/harry/1004/W1004-H1_chrome_land.md](../work_dispatch/harry/1004/W1004-H1_chrome_land.md) |

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
