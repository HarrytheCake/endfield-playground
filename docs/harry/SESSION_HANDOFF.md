# Session Handoff —— 給下一個聊天用的接續筆記

**最後更新：** 2026-10-11（master `9d91f98`）
**用途：** 開新聊天時貼給 Claude 看，快速還原這個 session 建立的角色定位、工作流程與現況，不用重新從頭摸索。
**身分：** L2 接線層（harry），負責 CR-01（畫布）+ CR-02（管線）+ CR-11（工具列）的互動與接線。詳細角色定位見 [README.md](README.md)，早期 editorStore action 缺口清單見 [MILESTONE_0726.md](MILESTONE_0726.md)（屬舊 Vue Flow 世界，參考用）。

---

## 1. 工作流程（下一輪請延用）

1. **每週工單是唯一任務來源**：`docs/work_dispatch/harry/<MMDD>/W<MMDD>-H*.md`，週總表 `docs/work_dispatch/WEEK_<YYYYMMDD>.md`。**動任何檔之前先查週總表的「檔案歸屬」表**——同週兩人改同一檔會退回後到者
2. **大改動前先寫 `PLAN_<功能>.md`**：範疇判定（哪些檔案屬於 L1/L2/L3）、既有介面盤點、設計、明確排除範圍、待確認問題。使用者確認決策後才動工
3. **實作完成前一定跑四項驗證**：`pnpm type-check` / `pnpm lint-check` / `pnpm format-check` / `pnpm test`，全過才算完成
4. **一批功能做完後寫 `PR_DESCRIPTION_<日期>.md`**：整理變更檔案、範圍外項目、已知風險，附驗證結果與對應 PLAN／工單連結表，方便直接貼進 GitHub PR（最新範例：[PR_DESCRIPTION_0927.md](PR_DESCRIPTION_0927.md)）
5. **遇到不確定的產品/設計決策就用選項讓使用者選**，不擅自定案；對稿問題（白紙稿）請使用者去 Discord 問 paper，不要猜
6. **發現既有程式碼的問題（dead state、命名不一致等）先回報，不擅自順手修**，除非使用者明確要求

## 2. 已完成、已合入 master 的功能

| 功能 | 工單／文件 | 變更檔案重點 | 狀態 |
|------|------------|---------------|------|
| addConnection / removeConnection / resetCanvas（舊 Vue Flow 畫布） | [PLAN_addConnection.md](PLAN_addConnection.md) / [PLAN_removeConnection.md](PLAN_removeConnection.md) / [PLAN_resetCanvas.md](PLAN_resetCanvas.md) | `FactoryCanvas.vue`、`selectionStore.ts`、`useShortcuts.ts` | 已合入；屬舊畫布世界，`FactoryCanvas` 已不在正式頁 |
| 快捷鍵可配置化 + WASD 平移 + Esc 設定介面 | [PLAN_configurableShortcuts.md](PLAN_configurableShortcuts.md) 等三份 | `src/store/keybindingStore.ts`、`useKeybinding.ts`、`ShortcutRow`、`ShortcutSettingsPanel.vue` | 已合入；09-14 補單元測試（`02e35b6`） |
| paper_fig 設計稿 Vue 轉換（v1→v2 疊層工具列） | [PR_DESCRIPTION_0823.md](PR_DESCRIPTION_0823.md) §4 | `src/app/dev/PaperFigMainField.vue`、`PaperFigBottomBar.vue`，dev-only 路由 `/dev/paper-fig-main-field` | 已合入（PR #30）；**沒再延續**，正式工具列視覺改由 goodmorning 的 #48 負責。v2 從未目視比對過 |
| W0823-H1：P 鍵／Navbar 切換管線工具 | [PLAN_connectTool.md](PLAN_connectTool.md) | `657f5c4` | 已合入 |
| TableCfg 資料表抓取 script＋建築大圖示快取 | [PLAN_fetchFactoryMachineCraftTable.md](PLAN_fetchFactoryMachineCraftTable.md) | `2172542`、`054e696`、`016b205` | 已合入 |
| W0907-H1／W0914-H1：格點視窗平移／縮放／座標換算 | [PLAN_gridViewport.md](PLAN_gridViewport.md) | `src/editor/layout/useGridViewport.ts`、`/dev/grid-viewport` | PR #47，09-15 合入；主畫面接入由 toby 做（#50） |
| W0921-H1：管線折線逐段幾何 `buildPipelinePolyline` | [PLAN_pipelinePolyline.md](PLAN_pipelinePolyline.md) / [PR_DESCRIPTION_0927.md](PR_DESCRIPTION_0927.md) | `src/utils/layout/pipelinePolyline.ts`、`/dev/pipeline-polyline` | PR #56，10-04 合入（含 review 修正 `1ba53c7`：零長度段不參與轉角比對） |

**額外設計筆記（尚未實作）：** [DESIGN_clipboardAndEdgeSelectionState.md](DESIGN_clipboardAndEdgeSelectionState.md)——clipboard store 與管線選取狀態構想，寫於舊 Vue Flow 世界，若要用需先對照新 `layoutStore` 重新評估。

## 3. 本週任務：W1004-H1 正式畫面換殼（**尚未開工**）

工單：[W1004-H1_chrome_land.md](../work_dispatch/harry/1004/W1004-H1_chrome_land.md)，週次 10/04 → 10/11，**本週主戲**。週總表：[WEEK_20261004.md](../work_dispatch/WEEK_20261004.md)。

**現況（2026-10-11 確認）：** master 上的 `src/app/layouts/MainLayout.vue` 仍是舊結構，還沒有任何 H1 的 commit 或分支：

```
Navbar
└ area-workspace
   ├ ProjectSidebar（左）
   ├ workspace-main
   │   ├ area-canvas → LayoutView
   │   ├ area-toolbar → ToolbarPanel   ← 舊底欄，要拿掉
   │   └ area-stats → StatsPanel
   └ InspectorSidebar（最右）          ← 舊殼，要從正式頁卸載
```

**要做的（只動 `MainLayout.vue`，本週全檔歸 harry）：**

1. 對白紙稿標出工具列／左／右／畫布四塊在 DOM 的位置（class 只留一套；G／S 會從槽位 import 元件，定了就不要再改 class）
2. `ToolbarPanel` 從 `area-toolbar` 底欄移到稿上的位置——**不重做工具列**，新視覺在 #48
3. 右側只留 `src/app/StatsPanel`
4. 卸載 `InspectorSidebar`（連同 `inspectorOpen` ref 與 `v-model:open`）；左側若是「選取後才出現的設備資訊」，先做空槽＋`v-show`，沒有選取資料也要把槽位留對
5. `useValidation()`／`useFlowEngine()` 兩個呼叫保留不動

**不要碰：** `GridCanvas.vue`／`LayoutView.vue`／`useGridViewport.ts` 內部（toby；可 import 不可改）、StatsPanel 子檔（shirone）、旋轉／Delete／管線 draft、把舊 Inspector 搬到左邊充數。**不准刪** `InspectorSidebar.vue`、`FactoryCanvas.vue` 檔案。

**DoD：** 無 `area-toolbar` 底欄布局；正式頁 DOM 找不到 `InspectorSidebar`；兩個舊檔仍存在；工具列仍能 `arm`（落子鏈沒斷）。

**依賴與待確認：**

- **#48（goodmorning 工具列視覺）截至 2026-10-11 仍未合入 master**（PR head `e9b6116` 不在 master；10/06 週總表記為 OPEN＋CONFLICTING）。H1 不用等它：先改槽位、用現有 `ToolbarPanel` 掛到稿上位置，#48 合入後自然換新樣子
- **`ProjectSidebar` 去留未定**：若稿上左邊是設備面板、專案改走漢堡選單，以稿為準；不確定就請使用者 Discord 問 paper，**不要兩套都留**
- 配對：harry＋toby（MainLayout 槽位 vs GridCanvas 視窗尺寸）
- **下週（10/11 起）C1 拉管線互動的 L2 owner 還沒定（toby 或 harry）**；若換殼沒站穩，C1 無處可掛。開新聊天時先看有沒有 `docs/work_dispatch/harry/1011/`

## 4. 驗證與環境狀態（2026-10-11 於 master `9d91f98` 實測）

- `pnpm type-check` / `lint-check` / `format-check` / `test` **四項全綠**（47 個測試檔、888 個測試）
- 08-23 那輪記錄的「快捷鍵 4 個檔案 format-check 不過」**已不存在**，`prettier --check` 全過
- **Dev server 沒有在跑**（5173、5174 皆無回應）。要看畫面請先 `pnpm dev`，留意 port 可能不是預設 5173

## 5. Git 狀態

- 目前 checkout 在 **`master`**，工作目錄乾淨，與 `origin/master`、`upstream/master` 同步
- **`dev/cake` 已無分叉**：它是 master 的祖先（落後 65、領先 0），`origin/dev/cake` 同步。08-23 那輪記錄的「本地領先 3／origin 領先 56」已經解決
- 開工 H1 前：從最新 master 開新分支，或先把 `dev/cake` fast-forward 到 master 再做，不要在舊的 `dev/cake` 上直接改

**保留的教訓（08-23 revert 事故）：** 當時 `git revert --abort` 把分支 reset 到比預期更早的 commit，一度讓多個檔案從工作目錄消失，靠 `git reflog` 找回。**在多次 revert／reapply 疊過的分支上，abort 前先用 `git reflog` 確認會落在哪個 commit。**

## 6. 已知但未修的既有問題（遇到先查這份，避免重複調查）

- **`src/store/canvasStore.ts` 的 `offset`／`zoom` 是 dead state**：只有舊 `FactoryCanvas.vue` 與 `PaperFigMainField.vue` 引用。新畫布的平移縮放走 `useGridViewport`，不要再往 `canvasStore` 接
- **`FactoryCanvas.vue` 的 `equipmentLabelMap` 仍是 `smelter`/`crusher` 等佔位字串**（舊五顆 `EquipmentType` 按鈕）。只武裝舊 `editorStore`、新畫布不讀；#48 合入後由 G1 從正式工具列拿掉，**不是 H1 的事**
- **`editorStore.resetCanvas()`（`src/store/editorStore.ts:276`）仍沒走 Command Pattern**，無法 `Ctrl+Z` 復原；`useShortcuts.ts` 的 `window.confirm()` 防呆還在
- **`src/app/dev/paperfigv2.css` 不是真正的 CSS**（扁平屬性清單），目前沒擋 `format-check`，但哪天要清 dev 頁時記得決定刪除或搬到 `docs/`

## 7. 專案基本規則提醒（來自 `docs/dernoson/claude/CLAUDE.md`，長期有效）

- 三層架構：L1（store／型別／引擎）不寫真實 UI；L2（`src/editor/`、composables、`src/app/layouts/`）互動邏輯與接線；L3（`src/components/`）純展示，**不得 import Pinia store**
- Store 目錄是 `src/store/`（不是 `src/stores/`）
- 元件命名：PascalCase 資料夾 + `Index.vue`
- 註解：繁中、JSDoc、禁 emoji、講「為什麼」不講「做了什麼」
- Store 操作：L2 一律呼叫 L1 高階 action，不自組 Command、不呼叫 `historyStore.execute()`、不直接 mutate `nodes`/`edges`
- Nuxt UI v3 元件優先、VueUse 工具函式優先（「自訂顏色寫 `tokens.css`」這條已於 `37333a2` 移除，該檔不存在）
- 不擅自 push／建 PR／合併 master；push 前四項驗證必須全過
- 本週退回清單重點：旋轉、Delete、改 `editorStore` 簽名、`GridCanvas` 內 import Pinia、刪 `InspectorSidebar.vue`／`FactoryCanvas.vue`、非 owner 改鎖區
