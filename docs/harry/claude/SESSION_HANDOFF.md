# Session Handoff —— 給下一個聊天用的接續筆記

**最後更新：** 2026-10-21（`master`／`upstream/master` ＝ `ae5b5d0`；W1011-H2 已以 PR #75 合入）
**用途：** 開新聊天時給 Claude 看，快速還原現況與待跟進項目。長期規則在同資料夾的 [CLAUDE.md](CLAUDE.md)。
**身分：** L2 接線層（harry），負責 CR-01（畫布）+ CR-02（管線）+ CR-11（工具列）的互動與接線。詳細角色定位見 [README.md](../README.md)，早期 editorStore action 缺口清單見 [MILESTONE_0726.md](../MILESTONE_0726.md)（屬舊 Vue Flow 世界，參考用）。

---

## 1. 工作流程

見 [CLAUDE.md](CLAUDE.md) §6（工單、PLAN、四項驗證、畫面實測、PR 描述、commit 拆分）。最新 PR 描述範例：[PR_DESCRIPTION_1018.md](../PR_DESCRIPTION_1018.md)。

## 2. 已完成、已合入 master 的功能

| 功能 | 工單／文件 | 變更檔案重點 | 狀態 |
|------|------------|---------------|------|
| addConnection / removeConnection / resetCanvas（舊 Vue Flow 畫布） | [PLAN_addConnection.md](../PLAN_addConnection.md) / [PLAN_removeConnection.md](../PLAN_removeConnection.md) / [PLAN_resetCanvas.md](../PLAN_resetCanvas.md) | `FactoryCanvas.vue`、`selectionStore.ts`、`useShortcuts.ts` | 已合入；屬舊畫布世界，`FactoryCanvas` 已不在正式頁 |
| 快捷鍵可配置化 + WASD 平移 + Esc 設定介面 | [PLAN_configurableShortcuts.md](../PLAN_configurableShortcuts.md) 等三份 | `src/store/keybindingStore.ts`、`useKeybinding.ts`、`ShortcutRow`、`ShortcutSettingsPanel.vue` | 已合入；09-14 補單元測試（`02e35b6`） |
| paper_fig 設計稿 Vue 轉換（v1→v2 疊層工具列） | [PR_DESCRIPTION_0823.md](../PR_DESCRIPTION_0823.md) §4 | `src/app/dev/PaperFigMainField.vue`、`PaperFigBottomBar.vue`，dev-only 路由 `/dev/paper-fig-main-field` | 已合入（PR #30）；**沒再延續**，正式工具列視覺改由 goodmorning 的 #48 負責。本週鎖表列為凍結參考頁 |
| W0823-H1：P 鍵／Navbar 切換管線工具 | [PLAN_connectTool.md](../PLAN_connectTool.md) | `657f5c4` | 已合入 |
| TableCfg 資料表抓取 script＋建築大圖示快取 | [PLAN_fetchFactoryMachineCraftTable.md](../PLAN_fetchFactoryMachineCraftTable.md) | `2172542`、`054e696`、`016b205` | 已合入 |
| W0907-H1／W0914-H1：格點視窗平移／縮放／座標換算 | [PLAN_gridViewport.md](../PLAN_gridViewport.md) | `src/editor/layout/useGridViewport.ts`、`/dev/grid-viewport` | PR #47，09-15 合入；主畫面接入由 toby 做（#50） |
| W0921-H1：管線折線逐段幾何 `buildPipelinePolyline` | [PLAN_pipelinePolyline.md](../PLAN_pipelinePolyline.md) / [PR_DESCRIPTION_0927.md](../PR_DESCRIPTION_0927.md) | `src/utils/layout/pipelinePolyline.ts`、`/dev/pipeline-polyline` | PR #56，10-04 合入（含 review 修正 `1ba53c7`：零長度段不參與轉角比對） |
| W1004-H1：正式畫面換殼 | [PLAN_chromeLand.md](../PLAN_chromeLand.md) / [PR_DESCRIPTION_1011.md](../PR_DESCRIPTION_1011.md) | `MainLayout.vue` 槽位、卸載 `InspectorSidebar`、Esc 修正 `useShortcuts.ts` | PR #63 已合入 |
| W1011-H2：刪舊左側面板、接上 `MachineCard`＋WASD 補回 | [PLAN_leftPanelSwap.md](../PLAN_leftPanelSwap.md) / [PR_DESCRIPTION_1018.md](../PR_DESCRIPTION_1018.md) | 刪 `ProjectSidebar`、Navbar 拿掉 ☰、`MainLayout.vue` 左槽 451px 掛 `MachineCard`、`LayoutView` WASD（`a1da734`／`e1d35e4`／`6a73be5`） | PR #75，10-19 合入（`59aac12`）；與 #76 的 `LayoutView` import 衝突由 dernoson 在 `5de3c04` 解（拿掉 `onMounted`、保留 WASD 用的 `watch`／`useRafFn`） |

**額外設計筆記（尚未實作）：** [DESIGN_clipboardAndEdgeSelectionState.md](../DESIGN_clipboardAndEdgeSelectionState.md)——clipboard store 與管線選取狀態構想，寫於舊 Vue Flow 世界，若要用需先對照新 `layoutStore` 重新評估。

## 3. 本週（W1018，10/18→10/25＝M3 週）：**H0 暫停（期中考，0h）**

工單：[W1018-H0_pause.md](../../work_dispatch/harry/1018/W1018-H0_pause.md)｜週總表：[WEEK_20261018.md](../../work_dispatch/WEEK_20261018.md)。本週不派功能、不必交 PR；回來後第一件另派。**本週別碰：** `LayoutView.vue`、`GridCanvas.vue`（toby C1）、`MainLayout.vue`（凍結）、`src/utils/layout/*`、`layoutStore`。

以下 §3.1–3.4 為上週 W1011-H2 的紀錄（已以 PR #75 合入），保留作為下次接手時的背景。

工單：[W1011-H2_left_panel_swap.md](../../work_dispatch/harry/1011/W1011-H2_left_panel_swap.md)｜週總表：[WEEK_20261011.md](../../work_dispatch/WEEK_20261011.md) v1.2｜計畫：[PLAN_leftPanelSwap.md](../PLAN_leftPanelSwap.md)｜PR 描述：[PR_DESCRIPTION_1018.md](../PR_DESCRIPTION_1018.md)

### 3.1 W1011-H2 commit（PR #75，10-19 合入 master `59aac12`）

| commit | 內容 |
|--------|------|
| `a1da734` feat(layout) | 連檔刪除 `ProjectSidebar`；Navbar 拿掉 ☰ 與 `sidebarOpen` prop／`toggle-sidebar` emit；MainLayout local ref `selectedDeviceId` 接 `select-device`；computed 轉 `MachineCardProps`；左槽 451px 掛 `MachineCard` |
| `e1d35e4` fix(layout) | **工單外**：`LayoutView` 補回 WASD 平移（見 §6）。`LayoutView` 當週鎖在 toby，已與使用者確認、PR 描述請 toby review |
| `6a73be5` docs(harry) | PLAN、PR 描述、本檔 |
| `5de3c04`（dernoson） | merge master 進 `dev/cake`，解 #76 造成的 `LayoutView` import 衝突 |

### 3.2 使用者裁決（2026-10-18）

- Navbar ☰：**一併移除**（不只是斷線）
- 左槽尺寸：**加寬到 451px**（＝`MachineCard` 設計寬）；實作上不鋪底色、高度隨卡片（`max-height: 100%` 捲動），卡片以外不擋畫布點擊
- `formulas`：**本週只給必填＋power**；`formulas`／`selectedRecipe`／`iconUrl` 不給
- WASD：使用者要求修，並寫進 PR 描述

### 3.3 目前槽位結構（class 契約不變）

```
.editor-layout
├ header.area-navbar → Navbar（無 ☰）
└ .area-workspace
   ├ .area-stage（relative＋isolation）
   │   ├ .area-canvas（absolute inset-0）→ LayoutView（@select-device）
   │   ├ aside.area-device-panel（左上 451px，v-if="selectedMachineCard"）→ MachineCard
   │   ├ section.area-toolbar-dock（absolute 貼底、不設高度、pointer-events: none）→ ToolbarPanel
   │   └ .area-stats-toggle（右上角）
   └ aside#area-stats.area-stats（334px ↔ 0）→ StatsPanel
```

### 3.4 待跟進

1. ~~push＋開 PR~~：已完成，PR #75 於 10-19 合入
2. **畫面較矮時工具列蓋住卡片下緣**（1280×800：stage 744px、卡片 686px，toolbar z 20 ＞ 左槽 z 10）——待 paper 決定誰在上
3. **機器圖片是 `MachineCard` 預設占位圖**（未傳 `iconUrl`）
4. **`formulas` 轉接**：需配方資料＋物品圖示查表，下週或另派
5. **新建／匯入／匯出專案失去入口**：原本只在 `ProjectSidebar`（handler 皆 TODO），日後要另找入口（例如頂欄按鈕）
6. **C1 拉管線＝toby**（10/18 週，M3 關鍵路徑）；harry 10/18 週為 H0 暫停

### 3.5 外部依賴現況（2026-10-21，依 roadmap v1.20 W1011 結算）

- **W1011 結算 OPEN＝0**，以下 PR 都已在 master：#48（工具列）、#61（無邊界）、#62（StatsPanel）、#63（W1004-H1 換殼）、#64（Z1）、#67（T2 設備拖曳，含 `select-device`）、#68（`PipelineShape`）、#70／#71（WarningIcon／管線未連通警示）、#72（C5 `setDevicePrimaryOutput`）、#74（機型查表英文 id＋`toTopology` 引擎讀）、#75（本人 W1011-H2）、#76（正式頁停載示範快照＋切換正式／dev 路由清空 undo 堆疊）、#77（W1018 派工＋roadmap v1.20）
- **#76 影響 `LayoutView`**：已移除示範快照自動載入與 `onMounted`，正式頁開啟時畫布為空；之後改 `LayoutView` 前先看新版
- **仍欠（他人）：** DeviceShape（MBD，W1018）、PowerPoleShape、P2 點選稿、C1 draft UI（toby）、C3 幾何套用（`buildPipelinePolyline`＋掛 `PipelineShape`）
- 上週「#48 合入後改 dock」已由他人完成（dock 已是不設高度＋`pointer-events: none`）
- shirone 的 git 作者名是 **`wVQ88Soi2Il9`**（不是 shirone）；其左側面板就是 `MachineCard`，各分支沒有其他未合入的側欄

## 4. 驗證與環境狀態

**2026-10-18 於 `dev/cake` `e1d35e4` 實測：** 四項全綠（52 個測試檔、950 個測試）。合入後的 master `ae5b5d0` 本機尚未重跑四項驗證。

**畫面實測做法：** 見 [CLAUDE.md](CLAUDE.md) §7。上次用過的腳本 `check.mjs`（點工具列落子→點設備→量左槽）、`wasd.mjs`（按住鍵量設備標籤螢幕位移）在舊 session 的 scratchpad，不進版控。

**Dev server：** 使用者自己的 `pnpm dev` 正佔用 5173。

## 5. Git 狀態

- 目前在 **`cv/cake`**，與本機 `master`、`origin/master`、`upstream/master` 同為 `ae5b5d0`（已同步，工作目錄乾淨）。下次開工從這裡切新分支
- `dev/cake`（`6a73be5`）已 push 並以 PR #75 合入，可視為收尾分支
- remote、PR 查詢方式與 git 事故教訓見 [CLAUDE.md](CLAUDE.md) §8

## 6. 已知問題清單（遇到先查這份，避免重複調查）

**本 session 已修：**

- ~~正式頁 WASD 無法平移~~（`e1d35e4`，隨 PR #75 合入）：WASD 原本只實作在舊 `FactoryCanvas.vue`，09-20 正式頁改掛 `LayoutView` 後未移植，`keybindingStore` 的 `panUp`／`panDown`／`panLeft`／`panRight` 無人讀取。現於 `LayoutView` 以 `useComboHeld`＋`useRafFn` 每幀 `panBy`（600 px／秒）。#67 未涉及鍵盤
- ~~Esc 打不開快捷鍵設定~~（`6163114`）：舊五顆按鈕 `editorStore.armPlacement()` 設的 `placementArmed`，原本只有 `FactoryCanvas.vue` 會在 Esc 時解除；09-20 正式頁改掛 `LayoutView` 後沒人解除，`openSettings` 被永久擋下。現由 `useShortcuts.ts` 補固定 Escape 監聽解除，**必須註冊在 `openSettings` 之後**（同一次 keydown 依註冊順序執行，一次 Esc 只做一件事）。舊五顆在 #48／G1 後會消失，屆時這段可再檢討

**仍未修：**

- **真機器武裝（`usePlacementIntent`）時按 Esc 會開設定、不會取消落子**。spec 說拿起狀態 Esc＝取消，但這屬落子互動設計，留給 C1
- **#48 寫死 Z 鍵收合工具列**，繞過 `keybindingStore`（已合入，未確認是否改過）
- **`src/store/canvasStore.ts` 的 `offset`／`zoom` 是 dead state**：只有舊 `FactoryCanvas.vue` 與 `PaperFigMainField.vue` 引用。新畫布的平移縮放走 `useGridViewport`，不要再往 `canvasStore` 接
- **`ToolbarPanel` 舊五顆 `EquipmentType` 按鈕**（`smelter`/`crusher` 等佔位）只武裝舊 `editorStore`、新畫布不讀；#48 合入後由 G1 拿掉，**不是 harry 的事**
- **`.storybook/main.ts` 只收 `src/components/**` 與 `src/app/**` 的 story**：`src/editor/layout/GridCanvas.stories.ts` 存在但不會出現在 Storybook（#48 有改 `main.ts`，可能一併處理）。Storybook 教學在 `tutorial/storybook/developer.md`
- **`editorStore.resetCanvas()`（`src/store/editorStore.ts:276`）仍沒走 Command Pattern**，無法 `Ctrl+Z` 復原；`useShortcuts.ts` 的 `window.confirm()` 防呆還在
- **`src/app/dev/paperfigv2.css` 不是真正的 CSS**（扁平屬性清單），目前沒擋 `format-check`，但哪天要清 dev 頁時記得決定刪除或搬到 `docs/`

## 7. 專案規則

長期規則（三層架構、註解、Store 操作、提交流程、退回清單等）統一寫在同資料夾的 [CLAUDE.md](CLAUDE.md)，本檔只記接續狀態。
