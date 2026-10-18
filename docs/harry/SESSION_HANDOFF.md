# Session Handoff —— 給下一個聊天用的接續筆記

**最後更新：** 2026-10-18（`dev/cake` `e1d35e4`＋docs commit；`upstream/master` `c5af7fc`）
**用途：** 開新聊天時貼給 Claude 看，快速還原這個 session 建立的角色定位、工作流程與現況，不用重新從頭摸索。
**身分：** L2 接線層（harry），負責 CR-01（畫布）+ CR-02（管線）+ CR-11（工具列）的互動與接線。詳細角色定位見 [README.md](README.md)，早期 editorStore action 缺口清單見 [MILESTONE_0726.md](MILESTONE_0726.md)（屬舊 Vue Flow 世界，參考用）。

---

## 1. 工作流程（下一輪請延用）

1. **每週工單是唯一任務來源**：`docs/work_dispatch/harry/<MMDD>/W<MMDD>-H*.md`，週總表 `docs/work_dispatch/WEEK_<YYYYMMDD>.md`。**動任何檔之前先查週總表的「檔案歸屬」表**——同週兩人改同一檔會退回後到者
2. **大改動前先寫 `PLAN_<功能>.md`**：範疇判定（哪些檔案屬於 L1/L2/L3）、既有介面盤點、設計、明確排除範圍、待確認問題。使用者確認決策後才動工
3. **實作完成前一定跑四項驗證**：`pnpm type-check` / `pnpm lint-check` / `pnpm format-check` / `pnpm test`，全過才算完成
4. **改到畫面的工作要實際跑起來看**：`pnpm dev` 後用無頭瀏覽器操作、截圖、確認 console 無錯誤（做法見 §4）
5. **一批功能做完後寫 `PR_DESCRIPTION_<日期>.md`**：整理變更檔案、範圍外項目、已知風險，附驗證結果與對應 PLAN／工單連結表，方便直接貼進 GitHub PR（最新範例：[PR_DESCRIPTION_1018.md](PR_DESCRIPTION_1018.md)）
6. **遇到不確定的產品/設計決策就用選項讓使用者選**，不擅自定案；對稿問題（白紙稿）請使用者去 Discord 問 paper，不要猜
7. **發現既有程式碼的問題（dead state、命名不一致等）先回報，不擅自順手修**，除非使用者明確要求
8. **commit 依性質拆開**（feat／fix／docs 分開），方便 review

## 2. 已完成、已合入 master 的功能

| 功能 | 工單／文件 | 變更檔案重點 | 狀態 |
|------|------------|---------------|------|
| addConnection / removeConnection / resetCanvas（舊 Vue Flow 畫布） | [PLAN_addConnection.md](PLAN_addConnection.md) / [PLAN_removeConnection.md](PLAN_removeConnection.md) / [PLAN_resetCanvas.md](PLAN_resetCanvas.md) | `FactoryCanvas.vue`、`selectionStore.ts`、`useShortcuts.ts` | 已合入；屬舊畫布世界，`FactoryCanvas` 已不在正式頁 |
| 快捷鍵可配置化 + WASD 平移 + Esc 設定介面 | [PLAN_configurableShortcuts.md](PLAN_configurableShortcuts.md) 等三份 | `src/store/keybindingStore.ts`、`useKeybinding.ts`、`ShortcutRow`、`ShortcutSettingsPanel.vue` | 已合入；09-14 補單元測試（`02e35b6`） |
| paper_fig 設計稿 Vue 轉換（v1→v2 疊層工具列） | [PR_DESCRIPTION_0823.md](PR_DESCRIPTION_0823.md) §4 | `src/app/dev/PaperFigMainField.vue`、`PaperFigBottomBar.vue`，dev-only 路由 `/dev/paper-fig-main-field` | 已合入（PR #30）；**沒再延續**，正式工具列視覺改由 goodmorning 的 #48 負責。本週鎖表列為凍結參考頁 |
| W0823-H1：P 鍵／Navbar 切換管線工具 | [PLAN_connectTool.md](PLAN_connectTool.md) | `657f5c4` | 已合入 |
| TableCfg 資料表抓取 script＋建築大圖示快取 | [PLAN_fetchFactoryMachineCraftTable.md](PLAN_fetchFactoryMachineCraftTable.md) | `2172542`、`054e696`、`016b205` | 已合入 |
| W0907-H1／W0914-H1：格點視窗平移／縮放／座標換算 | [PLAN_gridViewport.md](PLAN_gridViewport.md) | `src/editor/layout/useGridViewport.ts`、`/dev/grid-viewport` | PR #47，09-15 合入；主畫面接入由 toby 做（#50） |
| W0921-H1：管線折線逐段幾何 `buildPipelinePolyline` | [PLAN_pipelinePolyline.md](PLAN_pipelinePolyline.md) / [PR_DESCRIPTION_0927.md](PR_DESCRIPTION_0927.md) | `src/utils/layout/pipelinePolyline.ts`、`/dev/pipeline-polyline` | PR #56，10-04 合入（含 review 修正 `1ba53c7`：零長度段不參與轉角比對） |
| W1004-H1：正式畫面換殼 | [PLAN_chromeLand.md](PLAN_chromeLand.md) / [PR_DESCRIPTION_1011.md](PR_DESCRIPTION_1011.md) | `MainLayout.vue` 槽位、卸載 `InspectorSidebar`、Esc 修正 `useShortcuts.ts` | PR #63 已合入 |

**額外設計筆記（尚未實作）：** [DESIGN_clipboardAndEdgeSelectionState.md](DESIGN_clipboardAndEdgeSelectionState.md)——clipboard store 與管線選取狀態構想，寫於舊 Vue Flow 世界，若要用需先對照新 `layoutStore` 重新評估。

## 3. 本週任務：W1011-H2 刪舊左側面板、接上 `MachineCard`（**已 commit，未 push、未開 PR**）

工單：[W1011-H2_left_panel_swap.md](../work_dispatch/harry/1011/W1011-H2_left_panel_swap.md)｜週總表：[WEEK_20261011.md](../work_dispatch/WEEK_20261011.md) v1.2｜計畫：[PLAN_leftPanelSwap.md](PLAN_leftPanelSwap.md)｜PR 描述草稿：[PR_DESCRIPTION_1018.md](PR_DESCRIPTION_1018.md)

### 3.1 已 commit（`dev/cake`，**尚未 push**）

| commit | 內容 |
|--------|------|
| `a1da734` feat(layout) | 連檔刪除 `ProjectSidebar`；Navbar 拿掉 ☰ 與 `sidebarOpen` prop／`toggle-sidebar` emit；MainLayout local ref `selectedDeviceId` 接 `select-device`；computed 轉 `MachineCardProps`；左槽 451px 掛 `MachineCard` |
| `e1d35e4` fix(layout) | **工單外**：`LayoutView` 補回 WASD 平移（見 §6）。`LayoutView` 本週鎖在 toby，已與使用者確認、PR 描述請 toby review |
| （本 commit）docs(harry) | PLAN、PR 描述、本檔 |

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

1. **push＋開 PR**：使用者尚未指示。PR 描述已備好（[PR_DESCRIPTION_1018.md](PR_DESCRIPTION_1018.md)）
2. **畫面較矮時工具列蓋住卡片下緣**（1280×800：stage 744px、卡片 686px，toolbar z 20 ＞ 左槽 z 10）——待 paper 決定誰在上
3. **機器圖片是 `MachineCard` 預設占位圖**（未傳 `iconUrl`）
4. **`formulas` 轉接**：需配方資料＋物品圖示查表，下週或另派
5. **新建／匯入／匯出專案失去入口**：原本只在 `ProjectSidebar`（handler 皆 TODO），日後要另找入口（例如頂欄按鈕）
6. **C1 拉管線＝toby**（10/18 週）；harry 下週工單請看 `docs/work_dispatch/harry/1018/`

### 3.5 外部依賴現況（2026-10-18）

- **#48（工具列）、#62（StatsPanel）、#63（W1004-H1 換殼）、#61（無邊界）、#67（T2 設備拖曳，含 `select-device`）都已在 master**
- 上週「#48 合入後改 dock」已由他人完成（dock 已是不設高度＋`pointer-events: none`）
- shirone 的 git 作者名是 **`wVQ88Soi2Il9`**（不是 shirone）；其左側面板就是 `MachineCard`，各分支沒有其他未合入的側欄

## 4. 驗證與環境狀態

**2026-10-18 於 `dev/cake` `e1d35e4` 實測：** 四項全綠（52 個測試檔、950 個測試）。

**畫面實測做法（本 session 建立，下次可沿用）：** repo 沒有跑 app 的 project skill，也沒裝 `chromium-cli`。做法是在 scratchpad 裝 `playwright-core@1.48.2`（不下載瀏覽器），用 `chromium.launch({ channel: 'msedge' })` 驅動系統內建 Edge，對 `pnpm dev --port 5173 --strictPort` 截圖與操作。踩過的坑：

- 使用者自己常開著 `pnpm dev` 佔用 5173——先 `curl http://localhost:5173` 確認，有就直接用、不要再起一個
- 停 server 用 `Get-NetTCPConnection -LocalPort 5173` 找 PID 再 `taskkill /T /F`，背景任務會因此回報 failed，屬正常
- **Nuxt UI 元件（`UButton` 等）收不到父層 scoped style**（data-v 屬性傳不進根節點），要定位就外包一層 `div`

- 本 session 測試腳本範例：`check.mjs`（點工具列落子→點設備→量左槽）、`wasd.mjs`（按住鍵量設備標籤螢幕位移），皆在 scratchpad、不進版控

**Dev server：** 使用者自己的 `pnpm dev` 正佔用 5173。

## 5. Git 狀態

- 目前在 **`dev/cake`**；`origin/dev/cake` ＝ `9ec394f`（merge master `c5af7fc`）。其後 H2 的三個 commit（feat／fix／docs）**尚未 push**
- 本機 `master` 已過時，比較請用 `upstream/master`
- `origin` = `HarrytheCake/endfield-playground`（fork），`upstream` = `dernoson/endfield-playground`；本機沒有 `gh` CLI，PR 狀態只能用 `git ls-remote upstream 'refs/pull/<編號>/head'` 間接查（例：`refs/pull/63/head` 對到哪個 commit）

**保留的教訓（10-18 commit 事故）：** 已 `git rm` 過的檔案再 `git add <該路徑>` 會 pathspec 失敗，用 `&&` 串接時整個 commit 不會執行，但 staged 的刪除仍留在 index，被下一個 commit 帶走。拆 commit 前先 `git status --short` 確認 index；修正方式是未 push 時 `git reset --soft` 回上一個 commit 重來。

**保留的教訓（08-23 revert 事故）：** 當時 `git revert --abort` 把分支 reset 到比預期更早的 commit，一度讓多個檔案從工作目錄消失，靠 `git reflog` 找回。**在多次 revert／reapply 疊過的分支上，abort 前先用 `git reflog` 確認會落在哪個 commit。**

## 6. 已知問題清單（遇到先查這份，避免重複調查）

**本 session 已修：**

- ~~正式頁 WASD 無法平移~~（`e1d35e4`）：WASD 原本只實作在舊 `FactoryCanvas.vue`，09-20 正式頁改掛 `LayoutView` 後未移植，`keybindingStore` 的 `panUp`／`panDown`／`panLeft`／`panRight` 無人讀取。現於 `LayoutView` 以 `useComboHeld`＋`useRafFn` 每幀 `panBy`（600 px／秒）。#67 未涉及鍵盤
- ~~Esc 打不開快捷鍵設定~~（`6163114`）：舊五顆按鈕 `editorStore.armPlacement()` 設的 `placementArmed`，原本只有 `FactoryCanvas.vue` 會在 Esc 時解除；09-20 正式頁改掛 `LayoutView` 後沒人解除，`openSettings` 被永久擋下。現由 `useShortcuts.ts` 補固定 Escape 監聽解除，**必須註冊在 `openSettings` 之後**（同一次 keydown 依註冊順序執行，一次 Esc 只做一件事）。舊五顆在 #48／G1 後會消失，屆時這段可再檢討

**仍未修：**

- **真機器武裝（`usePlacementIntent`）時按 Esc 會開設定、不會取消落子**。spec 說拿起狀態 Esc＝取消，但這屬落子互動設計，留給 C1
- **#48 寫死 Z 鍵收合工具列**，繞過 `keybindingStore`（已合入，未確認是否改過）
- **`src/store/canvasStore.ts` 的 `offset`／`zoom` 是 dead state**：只有舊 `FactoryCanvas.vue` 與 `PaperFigMainField.vue` 引用。新畫布的平移縮放走 `useGridViewport`，不要再往 `canvasStore` 接
- **`ToolbarPanel` 舊五顆 `EquipmentType` 按鈕**（`smelter`/`crusher` 等佔位）只武裝舊 `editorStore`、新畫布不讀；#48 合入後由 G1 拿掉，**不是 harry 的事**
- **`.storybook/main.ts` 只收 `src/components/**` 與 `src/app/**` 的 story**：`src/editor/layout/GridCanvas.stories.ts` 存在但不會出現在 Storybook（#48 有改 `main.ts`，可能一併處理）。Storybook 教學在 `tutorial/storybook/developer.md`
- **`editorStore.resetCanvas()`（`src/store/editorStore.ts:276`）仍沒走 Command Pattern**，無法 `Ctrl+Z` 復原；`useShortcuts.ts` 的 `window.confirm()` 防呆還在
- **`src/app/dev/paperfigv2.css` 不是真正的 CSS**（扁平屬性清單），目前沒擋 `format-check`，但哪天要清 dev 頁時記得決定刪除或搬到 `docs/`

## 7. 專案基本規則提醒（來自 `docs/dernoson/claude/CLAUDE.md`，長期有效）

- 根目錄 `CLAUDE.md` 與 `.claude/` 都在 `.gitignore`，不進版控；長期規則以 `docs/dernoson/claude/CLAUDE.md` 為準，接續狀態以本檔為準
- 三層架構：L1（store／型別／引擎）不寫真實 UI；L2（`src/editor/`、composables、`src/app/layouts/`）互動邏輯與接線；L3（`src/components/`）純展示，**不得 import Pinia store**
- Store 目錄是 `src/store/`（不是 `src/stores/`）
- 元件命名：PascalCase 資料夾 + `Index.vue`
- 註解：繁中、JSDoc、禁 emoji、講「為什麼」不講「做了什麼」
- Store 操作：L2 一律呼叫 L1 高階 action，不自組 Command、不呼叫 `historyStore.execute()`、不直接 mutate `nodes`/`edges`
- Nuxt UI v3 元件優先、VueUse 工具函式優先（「自訂顏色寫 `tokens.css`」這條已於 `37333a2` 移除，該檔不存在）
- 不擅自 push／建 PR／合併 master；push 前四項驗證必須全過
- 本週退回清單重點：旋轉、Delete、改 `editorStore` 簽名、`GridCanvas` 內 import Pinia、刪 `InspectorSidebar.vue`／`FactoryCanvas.vue`、非 owner 改鎖區
