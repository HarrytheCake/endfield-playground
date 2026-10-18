# PR Description 草稿：刪舊左側面板，接上 MachineCard（W1011-H2）＋補回 WASD 平移

以下內容可直接複製進 GitHub PR 描述欄。

---

## Summary

- **連檔刪除 `ProjectSidebar`**（主編裁 A-4）：`src/editor/sidebar/ProjectSidebar.vue` 刪除，該目錄無其他檔一併消失；MainLayout 的 import、`sidebarOpen` 一併清掉
- **Navbar 拿掉 ☰ 按鈕**：側欄刪除後它已無控制對象，`sidebarOpen` prop 與 `toggle-sidebar` emit 一併移除
- **左槽掛上 `MachineCard`**：`area-device-panel` 由空槽改為承載 shirone 的 `MachineCard`
- **選中狀態（主編裁 A-3）**：MainLayout local ref `selectedDeviceId`，接 `LayoutView` 的 `select-device(id | null)`；**不進 store**
- **轉接放 L2**：MainLayout 內 computed 以 `layoutStore.devices` ＋ `getMachineById` 組出 `MachineCardProps`；`MachineCard` 不讀 store
- 左槽寬度 280px → **451px**（＝`MachineCard` 設計寬），不鋪底色、高度隨卡片，卡片以外的區域仍可點畫布
- **補回 WASD 畫面平移（工單外，見下節）**：正式畫布 `LayoutView` 接上 `keybindingStore` 的 `panUp`／`panDown`／`panLeft`／`panRight`

## 補回 WASD 平移（工單外）

**問題：** 正式頁按 WASD 畫面不會動。WASD 平移原本只實作在舊 Vue Flow 畫布 `FactoryCanvas.vue`（`useComboHeld` ＋ `useRafFn` 每幀 `setViewport`）；09-20 正式頁改掛 `LayoutView`／`GridCanvas` 後沒有移植，新畫布只有滑鼠拖曳平移。`keybindingStore` 仍登記這四個動作、快捷鍵設定介面也照常顯示，但正式頁無人讀取。#67（T2 設備拖曳）未涉及鍵盤。

**做法：** 在 `LayoutView.vue` 照搬 `FactoryCanvas` 的模式，只把平移目標換成新畫布的 `useGridViewport().panBy()`：

- 四個方向各以 `useComboHeld(actionId)` 讀按住狀態——鍵位走 `keybindingStore`，使用者改鍵後自動生效；`useComboHeld` 內建「文字輸入框 focus 時不觸發」，工具列搜尋框打字不會移動畫面
- `useRafFn` 每幀依 delta time 位移 600 px／秒（與舊畫布同速），速度與幀率無關；只在任一方向鍵按住時 `resume`，全放開即 `pause`，平時不空轉
- 方向語意同舊畫布：W／A＝視角往上／左（內容往下／右移，`offset` 增加）

**鎖區說明：** `LayoutView.vue` 本週鎖在 toby。本段只**新增**一個獨立區塊與 3 個 import，不改既有指標手勢、拖曳、落子邏輯；已與使用者確認，請 toby review 這段。

## 轉接規則

| `MachineCardProps` | 來源 |
|--------------------|------|
| `id` | `PlacedDevice.id` |
| `name` | `Machine.name` |
| `sizeText` | `` `${width}×${height}` ``（0° 靜態尺寸；旋轉本週仍凍結） |
| `power` | `Machine.power >= 0` 時 `` `${power}kW` ``；`-1`（資料未定義）不給，卡片顯示「—」 |
| `formulas`／`selectedRecipe`／`iconUrl` | **本次不給**，走 `MachineCard` 內建 fallback |

面板顯示條件＝轉接結果非 `null`。每次從 store 反查而非保存快照，因此設備被 Ctrl+Z 移除後面板自動收起。

## 變更檔案

| 檔案 | 變更 |
|------|------|
| `src/app/layouts/MainLayout.vue` | 移除 `ProjectSidebar`；新增 `selectedDeviceId`、`selectedMachineCard`；左槽掛 `MachineCard`；左槽尺寸；`isolation` 註解改寫（原理由是 `ProjectSidebar`） |
| `src/editor/navbar/Navbar.vue` | 移除 ☰ 按鈕、`sidebarOpen` prop、`toggle-sidebar` emit |
| `src/editor/sidebar/ProjectSidebar.vue` | 刪除 |
| `src/editor/layout/LayoutView.vue` | **只新增** WASD 平移區塊（`useComboHeld` ×4 ＋ `useRafFn` ＋ 啟停 `watch`）；既有邏輯未動 |

未改：`src/app/MachineCard/*`、`GridCanvas.vue`、`StatsPanel/*`、`ToolbarPanel.vue`、`keybindingStore.ts`、`useKeybinding.ts`。

## 明確不在本次範圍內

- `formulas` 轉接（需配方資料＋物品圖示查表）——下週或另派
- 選中設備在畫布上的高亮、Esc 取消選取、多重選取（未來再開 store，不在 POC）
- 右側（#62）／下方（#48）面板接線、頂欄按鈕
- `MachineCard` 的 `pick` 事件目前無人接
- **新建專案／匯入設計檔／匯出設計檔失去入口**：這三項原本只在 `ProjectSidebar` 裡，且 handler 皆為 `TODO`，刪除不損失任何實際功能；日後實作時需另找入口（例如本週暫緩的頂欄按鈕）

## 已知觀察（待 paper／shirone 決定，本 PR 不處理）

- **畫面較矮時卡片下緣被工具列蓋住**：1280×800 下 stage 高 744px，卡片 686px，工具列（z 20）疊在左槽（z 10）之上。要讓卡片在上、或卡片縮到工具列以上，請 paper 確認
- **機器圖片是 `MachineCard` 的預設占位圖**，非該機器實際圖示（未傳 `iconUrl`）

## 驗證

```
pnpm type-check   # 通過
pnpm lint-check   # 通過
pnpm format-check # 通過
pnpm test         # 52 個測試檔、950 個測試全通過
```

`pnpm dev` 以無頭 Edge 實測首頁（1600×1000、1280×800）：

- 正式頁無舊側欄、Navbar 無 ☰、頁面只剩右側一個 `aside`
- 初始未選取：左槽不存在
- 工具列選「塑型機」→ 點畫布落子 → 解除拿起 → 點該設備：左槽出現於 (0, 56)、451×686，顯示「已選取：塑型機」「尺寸 3×3」「耗電量 10kW」
- 點畫布空白：左槽消失
- **WASD（各按住 400ms，以設備標籤螢幕位置量測）：** W 內容下移 238px、S 上移 246px、A 右移 250px、D 左移 250px（≈600px／秒）；W＋A 同按斜向 (246, 246)
- **搜尋框 focus 時按住 D：** 畫面不動
- console 無錯誤

DoD：

- [x] `pnpm dev`：正式頁看不到舊側欄
- [x] 選中設備時左側顯示 `MachineCard`，名稱／尺寸正確
- [x] `MachineCard` 檔案未改
- [x] `ProjectSidebar` 檔案已刪
- [x] （工單外）正式頁 WASD 可平移畫面（改鍵經 `keybindingStore` 生效屬設計推論，未在瀏覽器實測改鍵）

## 對應文件

| 項目 | 文件 |
|------|------|
| 計畫 | [docs/harry/PLAN_leftPanelSwap.md](PLAN_leftPanelSwap.md) |
| 原始工單 | [docs/work_dispatch/harry/1011/W1011-H2_left_panel_swap.md](../work_dispatch/harry/1011/W1011-H2_left_panel_swap.md) |

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
