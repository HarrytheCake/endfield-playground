# Session Handoff —— 給下一個聊天用的接續筆記

**最後更新：** 2026-11-08（W1102-H1 供水邏輯已在 `dev/cake` commit，未 push、未開 PR；W1026-H1 已以 #81 合入；工單外的 `dev/cake_toolbar`、`dev/cake_prodstats`、`dev/cake_machinecard` 本週不動）
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

| W1026-H1：正式頁源素材選擇（C5 左面板） | [PLAN_c5SourceForm.md](../PLAN_c5SourceForm.md) / [PR_DESCRIPTION_1031.md](../PR_DESCRIPTION_1031.md) | `src/editor/sourceOutput/SourceOutputPanel.vue`、`sourceMaterialOptions.ts`、`MainLayout.vue` 掛面板 | PR #81，10-31 合入 |

**額外設計筆記（尚未實作）：** [DESIGN_clipboardAndEdgeSelectionState.md](../DESIGN_clipboardAndEdgeSelectionState.md)——clipboard store 與管線選取狀態構想，寫於舊 Vue Flow 世界，若要用需先對照新 `layoutStore` 重新評估。

## 3. 本週（W1102，11/02→11/08）：W1102-H1 水源供給的設備邏輯

工單：[W1102-H1_water_supply.md](../../work_dispatch/harry/1102/W1102-H1_water_supply.md)｜週總表：[WEEK_20261102.md](../../work_dispatch/WEEK_20261102.md) v1.2｜計畫：[PLAN_waterSupply.md](../PLAN_waterSupply.md)｜PR 描述：[PR_DESCRIPTION_1108.md](../PR_DESCRIPTION_1108.md)

**狀態：** 已在 `dev/cake`（快轉到 `upstream/master` `3b368b1` 後）commit，**未 push、未開 PR**（等使用者指示）。四項全綠（58 檔、1039 測試）；Edge 實測過。

**本週分工提醒：** 11/01 會議把右側產耗（W1102-T1）改派 **toby**，harry 不做右側面板。週總表 §2.2 把 `ProductionStats.vue`、`StatsPanel/Index.vue`、`ItemSummaryTable.vue` 鎖給 toby。toby 已交 **PR #84**（`upstream/dev/toby`，含 `layoutStore` 拓撲接引擎、電力、調度券），`dev/cake_prodstats` 不再作底。

**使用者裁決（2026-11-08）：** 只對多型態源設備（目前只有 `material_source`）寫型態；`sourceMaterialOptions` 拿掉 `machineMode` 參數；在 `dev/cake` 上做。

**變更：**

- `layoutStore.ts`：模組內 helper `syncSourceMachineMode`，依 `getMaterialPortMedia` 找輸出埠媒質相符的型態；清除時刪 `machineMode`。仍是一筆歷史
- `sourceMaterialOptions.ts`：改看所有型態主輸出埠媒質的聯集（基礎材料輸出點 14 種）；`SourceOutputPanel.vue` 只改呼叫一行與註解
- 兩份測試各補／改案例

**待跟進：**

1. push＋開 PR——等使用者指示（PR 描述：[PR_DESCRIPTION_1108.md](../PR_DESCRIPTION_1108.md)，貼上前刪掉最後一行 Claude Code 標記）
2. 告知 aaaaa：`contractCatalog.ts` 的 `setDevicePrimaryOutput` 說明可補「會寫 `machineMode`」
3. 與 #84 相容：已把本 diff 套到 `dev/toby` 跑過 toby 的 `layoutFlowWiring.test.ts`，全過；兩邊沒碰同一檔

---

以下為 W1026 的舊紀錄，保留作背景。

## 3-1026. W1026（10/26→11/01）：W1026-H1 正式頁源素材選擇（C5 左面板 L2）——已以 #81 合入

工單：[W1026-H1_c5_source_form.md](../../work_dispatch/harry/1026/W1026-H1_c5_source_form.md)｜週總表：[WEEK_20261026.md](../../work_dispatch/WEEK_20261026.md) v1.1｜計畫：[PLAN_c5SourceForm.md](../PLAN_c5SourceForm.md)｜PR 描述：[PR_DESCRIPTION_1031.md](../PR_DESCRIPTION_1031.md)

**狀態：** 已 commit 並 push 到 `origin/dev/cake`（`76c69a9` feat、`6123024` docs、`f17e9bb` chore），**尚未開 PR**（等使用者指示）。

**使用者裁決（2026-10-31）：** 所有 `is_source` 設備都顯示下拉；依輸出埠媒質過濾；另開 L2 元件，資料夾用小寫 `src/editor/sourceOutput/`（與 `src/editor/` 既有慣例一致）。

**變更：**

- 新建 `src/editor/sourceOutput/SourceOutputPanel.vue`：`USelect`，「無」用哨兵值 `__none__`（reka-ui SelectItem 不接受空字串）；寫入只呼叫 `layoutStore.setDevicePrimaryOutput`
- 新建 `src/editor/sourceOutput/sourceMaterialOptions.ts`＋`src/__tests__/editor/sourceMaterialOptions.test.ts`
- `MainLayout.vue`：抽出 `selectedDevice` computed，`MachineCard` 下方掛面板

**待跟進：**

1. 開 PR——等使用者指示（PR 描述：[PR_DESCRIPTION_1031.md](../PR_DESCRIPTION_1031.md)，貼上前刪掉最後一行 Claude Code 標記）
2. **回報 aaaaa：** `layoutStore` 沒有切換 `machineMode` 的 action，正式頁放下的基礎材料輸出點固定是 `solid_belt`，液體／氣體（清水、沉積酸、惰氣、息壤氣）在正式頁選不到
3. 面板視覺（白色 `USelect` 疊在深色卡片下）屬 L3 範疇，若要對稿請找 paper／shirone

### 3.1 工單外：工具列對齊設計稿（`dev/cake_toolbar`）

使用者 10/31 指示。自 `upstream/master` 切出，已 push（`60f0739` feat、`845ab02` chore、`8cf8b48` docs），**尚未開 PR**。計畫：[PLAN_toolbarFigmaAlign.md](../PLAN_toolbarFigmaAlign.md)。

- 版面依 Figma `Tools Selection`（`2302:176`）調整；分類改顯示兩字短名；35 台機器接上 `src/assets/machines/*.webp`（無圖 11 台留空）；工具列指定 HarmonyOS 字型
- 抓圖腳本新增 WebP 輸出與 `--webp-only`；`docs/harry/dev/icons/*.webp`（92 張）依使用者決定**不進版控**，本機以 `.git/info/exclude` 排除
- `ToolbarPanel.vue` 是 goodmorning #48 的檔案，開 PR 前先在 Discord 告知 dernoson
- 設計稿來源：`docs/harry/figma_full.json`（Figma REST API 匯出，10/26 版，不進版控）。token 只設在使用者自己的 PowerShell 環境變數

### 3.2 工單外：右側產線總覽（`dev/cake_prodstats`）

使用者 10/31 指示，自 `dev/cake` 切出，進行中。盤點結論（已向使用者報告，使用者決定照做）：

- `src/editor/stats/ProductionStats.vue` 只被已卸載的舊 `InspectorPanel.vue` 引用，**不在正式頁**
- 設計稿 `Production Overview`（`2302:81`）已由 shirone 做成 `src/app/StatsPanel/`（#62，元件標 `data-figma-id="2302:81"`），但 `MainLayout` 掛 `<StatsPanel />` 沒傳 props，正式頁只顯示占位
- shirone W1004-S1 明寫「保留 props／空狀態，D1 十一月接 `flowStore`」「不要接 `flowStore`（引擎還在舊 `editorStore`）」；shirone 長假至 11 月中下旬
- 接資料屬 roadmap D1（aaaaa 主責、M4 11/29），開 PR 前要先告知 dernoson／aaaaa
- **使用者裁決：** 做法 A（`ProductionStats.vue` 改成 L2 容器，轉接 `toStatsPanelProps` 後渲染 StatsPanel；`MainLayout` 右側改掛 `ProductionStats`）；設計稿沒有的區塊（畫布概況、原料供給、計畫產物、機器用量、兌換率輸入、倉庫容量）先拿掉
- 已 commit 並 push（`262f440` feat、`7b468df` 黃色三角形開合＋移除左側黑邊）。正式頁目前仍是占位（引擎沒讀 `layoutStore`）；在瀏覽器手動寫入 store 驗證過電力、產能、Tips 都會顯示
- **MachineCard／InspectorSidebar 盤點（W1018、W1026）：** 兩週工單都沒人被派到這兩處；只有 H1 與 D0 寫「不改 `MachineCard` 內部」。shirone（`MachineCard` owner）兩週暫停。`InspectorSidebar.vue` 不在正式頁，但 W1018 退回清單禁止刪除
- **與 #78 的衝突風險：** toby 的 #78 改了 `MainLayout.vue` 的 `selectedMachineCard`（`sizeText` 改用旋轉後尺寸 `resolveDisplayGrid`，並把 `selectedDeviceId` 傳給 `LayoutView`），與 H1 在同一段抽出 `selectedDevice` 的重構重疊；後合的一方要手動合併

### 3.3 工單外：左側物件資訊卡片（`dev/cake_machinecard`）

使用者 10/31 指示，自 `dev/cake` 切出，再 merge `dev/cake_toolbar`（取得 `getMachineIconUrl` 與 35 張機器圖）。

- 確認過：`src/app/MachineCard/`、`src/app/StatsPanel/` 都在 `upstream/master`，且都已掛在正式頁。設計稿 `Equipment Information`（`2465:87`，451×686）就是 `MachineCard`，版面已對稿；`src/editor/inspector/` 是未掛載的舊碼
- **使用者裁決：** 轉接留在 `MainLayout`，`src/editor/inspector/` 不動
- `MainLayout` 的 `selectedMachineCard` 補上 `iconUrl`（`getMachineIconUrl`）與 `formulas`（新檔 `src/app/layouts/toMachineCardFormulas.ts`：`getRecipesForMachine(機器名, 型態)` 轉 `{ duration, input, output }`）。`selectedRecipe` 不給（正式頁沒有指定配方）
- 物品沒有圖示資料，配方列表的物品圖用 FormulaItem 預設圖
- 使用者 10/31 追加：
    - 右緣黃色三角形可點擊收起卡片：`MachineCard/Index.vue` 新增 `collapse` emit（`Button` 以 `@click.stop` 掛上，避免觸發 `pick`）；`MainLayout` 用 `devicePanelHidden` 只隱藏卡片、不清選取，再點設備即重新顯示
    - `MachineCard/Machine.vue` 的圖片固定 153×153（原本沒設尺寸，200px 的 WebP 會蓋到資訊文字）
    - 左側槽寬 461px（451＋三角形凸出 10），捲軸隱藏，新增 `src/composables/useDragScroll.ts` 按住左鍵拖曳捲動；子元素已 `preventDefault` 的拖曳（配方列橫向拖曳）不接手
    - **以上兩處改到 shirone 的 L3 元件（`Index.vue`、`Machine.vue`），開 PR 時要註明並知會 shirone**

### 3.4 分層對照（使用者 10/31 詢問後確認）

分層以「有沒有 import store」判斷，不以資料夾判斷（`docs/dernoson/L3/L3.md:196`）。README 原意：L2 的畫面在 `src/app`、L3 元件在 `src/components`；實際上 `src/app/MachineCard`、`src/app/StatsPanel` 是 L3（不讀 store），`src/app/layouts` 與 `src/editor/*` 是 L2，`src/app/dev` 是 L1 debug 頁

---

以下為 W1018（H0 暫停）與 W1011-H2 的舊紀錄，保留作背景。

## 3-old. W1018（10/18→10/25＝M3 週）：**H0 暫停（期中考，0h）**

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

**2026-10-31 於 `dev/cake`（`d48ac99`＋W1026-H1 未 commit 改動）實測：** 四項全綠（57 個測試檔、981 個測試）。

**畫面實測做法：** 見 [CLAUDE.md](CLAUDE.md) §7。本次腳本 `c5.mjs`（落子→點源設備→選材料→查 store→Ctrl+Z→點非源設備）在 scratchpad，不進版控。讀 store 可用 `document.querySelector('#app').__vue_app__.config.globalProperties.$pinia.state.value`。Git Bash 裡沒有 `powershell`，停 server 改用 `netstat -ano | grep :5173` 找 PID 再 `taskkill //T //F //PID <pid>`。

**Dev server：** 本 session 自己起的，已停。

## 5. Git 狀態

- **`dev/cake`**：11-08 快轉到 `upstream/master` `3b368b1`（W1026-H1 已以 #81 合入），其上為 W1102-H1 的 commit，未 push
- **`dev/cake_toolbar`**：自 `upstream/master` 切出，工具列對齊設計稿，已 push（`8cf8b48`），未開 PR
- **`dev/cake_prodstats`**：自 `dev/cake` 切出，右側產線總覽，已 push 主要 commit
- **`dev/cake_machinecard`**：自 `dev/cake` 切出並 merge `dev/cake_toolbar`，左側卡片接機器圖與配方（目前所在分支）
- 10/31 四個分支都各加了兩個 commit：刪除 `docs/harry/dev/icons/*.png`（92 張，約 24MB）、`.gitignore` 加 `docs/harry/dev/icons/*.png`。刪 PNG 後 `--webp-only` 無法重產 WebP，要重跑完整腳本（會連網）
- `cv/cake`（`573ed22`）的內容已併入 `dev/cake`，之後可不再使用
- `.git/info/exclude`（本機）排除了 `docs/harry/claude/CLAUDE.md`、`docs/harry/figma_full.json`、`docs/harry/dev/icons/*.webp`：從 `upstream/master` 切出的分支沒有 `dev/cake` 加的 `.gitignore` 規則，靠這裡補
- remote、PR 查詢方式與 git 事故教訓見 [CLAUDE.md](CLAUDE.md) §8

## 6. 已知問題清單（遇到先查這份，避免重複調查）

**本 session 已修：**

- ~~正式頁 WASD 無法平移~~（`e1d35e4`，隨 PR #75 合入）：WASD 原本只實作在舊 `FactoryCanvas.vue`，09-20 正式頁改掛 `LayoutView` 後未移植，`keybindingStore` 的 `panUp`／`panDown`／`panLeft`／`panRight` 無人讀取。現於 `LayoutView` 以 `useComboHeld`＋`useRafFn` 每幀 `panBy`（600 px／秒）。#67 未涉及鍵盤
- ~~Esc 打不開快捷鍵設定~~（`6163114`）：舊五顆按鈕 `editorStore.armPlacement()` 設的 `placementArmed`，原本只有 `FactoryCanvas.vue` 會在 Esc 時解除；09-20 正式頁改掛 `LayoutView` 後沒人解除，`openSettings` 被永久擋下。現由 `useShortcuts.ts` 補固定 Escape 監聽解除，**必須註冊在 `openSettings` 之後**（同一次 keydown 依註冊順序執行，一次 Esc 只做一件事）。舊五顆在 #48／G1 後會消失，屆時這段可再檢討

**仍未修：**

- **Ctrl+Z 會同時觸發瀏覽器原生文字復原**（2026-10-31 發現，已在原始 `d48ac99` 重現）：`onComboTriggered`（`src/composables/useKeybinding.ts:137`）註冊 undo／redo 時沒有 `preventDefault`，按 Ctrl+Z 時瀏覽器也會復原工具列搜尋框的輸入，焦點跳進 `<input>`，之後 `isTypingTarget()` 會擋掉 Ctrl+Y，看起來就像重做失效。只要搜尋框打過兩次字就會發生。尚未回報，不在 W1026-H1 範圍
- ~~**`layoutStore` 沒有切換 `machineMode` 的 action**~~：W1102-H1 改由 `setDevicePrimaryOutput` 依素材物態一併切換（基礎材料輸出點），不新增 action
- **`setDevicePrimaryOutput` 的 JSDoc 寫 `@param itemId 基礎材料 id`**，實際存的是中文名（`MaterialDef.name`），既有說法不精確，未修
- **正式頁 FlowEngine 沒有讀 `layoutStore`**（2026-10-31 發現；toby 的 #84 已處理，未合入）：`useFlowEngine()`（`src/composables/useFlowEngine.ts:1409`）仍只 watch `editorStore.nodes`／`edges`；`toTopology` 只有 dev 頁（`L1ContractLab`、`LayoutL1Preview`）在呼叫。因此正式頁擺的設備、W1026-H1 寫入的 `primaryOutput` 都不會進引擎，`flowStore` 在正式頁永遠是空結果。C5 文件寫「引擎讀 #74 合入」應只指 adapter 本身。尚未回報 dernoson／aaaaa
- **`src/editor/stats/ProductionStats.vue` 的「總產出」區塊重複兩次**（第 340–367 行與 369–396 行內容完全相同）。該元件目前不在正式頁（見 §3.2）
- **`src/style.css` 的全域字型註解與實際不符**：註解寫「全域字型 HarmonyOS Sans TC」，但 `:root` 的 `font-family` 是 Inter；`MachineCard`、StatsPanel、工具列（`dev/cake_toolbar`）各自在元件內指定 HarmonyOS
- **`src/components/BaseRegionSelector` 讀 store，違反 L3 規則**（L3 不得 import Pinia store；2026-10-31 以 grep 盤點發現）。尚未回報

- **真機器武裝（`usePlacementIntent`）時按 Esc 會開設定、不會取消落子**。spec 說拿起狀態 Esc＝取消，但這屬落子互動設計，留給 C1
- **#48 寫死 Z 鍵收合工具列**，繞過 `keybindingStore`（已合入，未確認是否改過）
- **`src/store/canvasStore.ts` 的 `offset`／`zoom` 是 dead state**：只有舊 `FactoryCanvas.vue` 與 `PaperFigMainField.vue` 引用。新畫布的平移縮放走 `useGridViewport`，不要再往 `canvasStore` 接
- **`ToolbarPanel` 舊五顆 `EquipmentType` 按鈕**（`smelter`/`crusher` 等佔位）只武裝舊 `editorStore`、新畫布不讀；#48 合入後由 G1 拿掉，**不是 harry 的事**
- **`.storybook/main.ts` 只收 `src/components/**` 與 `src/app/**` 的 story**：`src/editor/layout/GridCanvas.stories.ts` 存在但不會出現在 Storybook（#48 有改 `main.ts`，可能一併處理）。Storybook 教學在 `tutorial/storybook/developer.md`
- **`editorStore.resetCanvas()`（`src/store/editorStore.ts:276`）仍沒走 Command Pattern**，無法 `Ctrl+Z` 復原；`useShortcuts.ts` 的 `window.confirm()` 防呆還在
- **`src/app/dev/paperfigv2.css` 不是真正的 CSS**（扁平屬性清單），目前沒擋 `format-check`，但哪天要清 dev 頁時記得決定刪除或搬到 `docs/`

## 7. 專案規則

長期規則（三層架構、註解、Store 操作、提交流程、退回清單等）統一寫在同資料夾的 [CLAUDE.md](CLAUDE.md)，本檔只記接續狀態。
