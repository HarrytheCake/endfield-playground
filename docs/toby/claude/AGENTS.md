# Endfield Playground Agent 開發守則與架構導覽

本文件整合 `docs/toby/claude/CLAUDE.md` 的強制開發守則，以及
`endfield-playground` 的程式架構、主要資料流和主要檔案用途。
架構內容以 2026-08-28 的實際程式碼為準。

## A. 強制開發守則

關於專案使用的 tech stack 與資料夾架構，請參考根目錄 `README.md`。
關於三層架構與每個人的職責分配，請參考 `docs/dernoson/` 下對應層級的文件：

- `docs/dernoson/L1/L1.md`
- `docs/dernoson/L2/L2.md`
- `docs/dernoson/L3/L3.md`

關於專案專有名詞與核心概念，請參考 `docs/dernoson/claude/CONTEXT.md`。

### A.1 三層架構

所有新增程式碼都必須能明確歸屬於以下其中一層：

| 層級 | 範疇 | 嚴禁事項 |
| --- | --- | --- |
| **L1 基礎層** | Pinia stores、型別、FlowEngine、history、graph utility、validation detectors | 不寫真實 UI；僅允許 `src/app/dev/` 下的 debug 測試頁 |
| **L2 容器層** | 主畫面 layout、拖拉／快捷鍵／框選等互動、消費 store、向 L3 傳 props／接收 events | 不做屬於 L3 的純視覺樣式 |
| **L3 UI 元件層** | 純展示元件，透過 props 渲染、透過 emits 通知上層 | 嚴格禁止 import 任何 Pinia store |

三條硬規則：

1. L3 元件不得 import `useXxxStore`；資料只能由 props 傳入，事件只能由 emits 傳出。
2. L1 不寫真實 UI；需要 debug 時放在 `src/app/dev/`，並加上 dev-only route guard。
3. L2 只處理事件路由與資料映射，不負責屬於 L3 的純視覺樣式調整。

### A.2 Vue 元件命名

- 每個 Vue 元件對應一個 PascalCase 資料夾。
- 主元件命名為 `Index.vue`。
- 子元件以 PascalCase 平鋪在相同資料夾，不再建立 `nodes/` 等次層。

範例：

- `src/components/InfoPanel/Index.vue`
- `src/components/InfoPanel/RecipeListTab.vue`
- `src/components/InfoPanel/DeviceShapeDiagram.vue`

### A.3 程式碼註解

通則：

- 一律使用繁體中文；專有名詞和 API 名稱除外。
- 嚴格禁止表情符號。
- 使用 JSDoc 格式 `/** ... */`；單行註解也不使用 `//`。
- 註解應解釋原因與設計意圖，不要只重複程式碼的字面行為。

以下項目必須註解：

- 函數：用途、參數、回傳值及非平凡副作用。
- class、interface、type alias：用途及每一個成員。
- 全域變數：用途和生命週期。
- Pinia store：每個 `ref`、`computed`、`reactive`、內部函數及 return 成員；return 註解需與宣告處一致。
- 大型頁面區段：以區塊註解標示用途。
- Vue SFC：`<script setup>` 內的變數和函數、每個 prop／emit，以及 `onMounted`、`watch` 等副作用 hook。

### A.4 程式碼設計

- 元件優先使用 Nuxt UI v3，不重複實作 Button、Modal、Table、Tooltip、Tabs 等通用元件。
- 工具函式優先使用 VueUse，例如 `useMagicKeys`、`useLocalStorage`、`useDebounceFn`、`useElementSize`。
- 樣式優先使用 Tailwind CSS class；自訂顏色集中於 `src/assets/styles/tokens.css`，避免散落的 inline CSS。
- TypeScript 避免 `any`；確實需要時必須註解原因。
- 遵守 SOLID，尤其是單一職責與依賴反轉。
- 不過度設計，不實作使用者未要求的功能，也不為未確定需求預先抽象；出現三個相似案例後再考慮共用抽象。

### A.5 Store 與 Command Pattern

- L1 high-level store action 必須自行產生 Command 並推入 `historyStore`。
- L2 不得自行呼叫 `historyStore.execute()`。
- L2 不得 import `createMacroCommand`。
- L2 對 `historyStore` 的合法使用限於：
  - `historyStore.undo()`／`historyStore.redo()`。
  - `historyStore.canUndo`／`historyStore.canRedo`。
- 如果 L1 沒有需要的 high-level action，應回報並在 L1 補上，不得由 L2 自行組 mutation。

### A.6 提交流程

- 分支命名和 PR 流程以根目錄 `README.md` 的「開發者守則」為準。
- push 前必須通過：
  - `pnpm type-check`
  - `pnpm lint-check`
  - `pnpm format-check`
  - `pnpm test`
- 若目前環境提供 `validate-changes` skill，程式修改完成、回報完成前應使用它執行完整驗證。
- Commit 訊息應簡潔、以繁體中文為主，不加表情符號或 AI 生成字樣。
- 未經使用者明確指示，不得自行 push、建立 PR 或合併 master。

### A.7 互動與變更範圍

- 大量或跨多檔案變更應先與使用者討論並分割步驟，一次執行一個步驟。
- 除非使用者明確要求，不得自行建立 README、CHANGELOG 或 planning 文件。
- 不確定且會實質影響結果的決策應交由使用者選擇。
- 修 bug 時聚焦根因，不順便重構周邊。
- 重構時不順便改變既有邏輯。

### A.8 安全與隱私

- 嚴格禁止讀取 `.env`、`.env.*`、`.secrets` 或任何 credentials 檔案。
- 不得在程式碼、commit 或 PR 中留下金鑰、token 或密碼。
- 外部 API 的 request body 和 response 一律視為不可信資料，應以 Zod 等方式做 schema 驗證。

### A.9 專案 Skills 與 Agents

專案特定的 Claude skills／agents 位於 `docs/dernoson/claude/`，並透過根目錄
`.claude/` symlink 生效；設定方式參考 `docs/dernoson/README.md`。
只有在目前執行環境確實提供相應能力時才能使用。

Skills：

- `add-jsdoc`：依本文件的註解規則為 TS／Vue 補齊 JSDoc。
- `validate-changes`：依序執行 format、lint、type-check 和 test；修改程式碼後、回報完成前必須執行。

Agents：

- `dependency-grapher`：只讀分析相依關係並輸出 Mermaid markdown，不修改原始碼。
- `test-writer`：建立或更新 Vitest 測試，測試檔鏡射至 `src/__tests__/`。

### A.10 Storybook 開發守則

完整操作方式參考 `tutorial/storybook/developer.md`。使用 `pnpm storybook` 啟動元件開發環境，
預設網址為 `http://localhost:6006`；它可與 `pnpm dev` 同時執行。交付前可用
`pnpm build-storybook` 驗證靜態建置。

- Story 與元件放在同一資料夾，命名為 `<元件檔名>.stories.ts`。
- `title` 統一使用 `L3/<資料夾>/<元件>`。
- Story 的 export 名稱使用英文，介面顯示名稱透過 `name` 使用繁體中文。
- 每個元件至少提供一個預設狀態及一個邊界狀態，例如空資料、極端值、`null` 或超長文字。
- Nuxt UI 已在 `.storybook/preview.ts` 註冊，Story 不需要自行安裝或包裝。
- Vue Flow 節點與連線必須使用 `.storybook/vueFlowHarness.ts` 的 `nodeHarness` 或
  `edgeHarness`；此類 Story 的 meta 不設定 `component`，只暴露元件真正需要的資料。
- 嚴禁在 `.storybook/preview.ts` 註冊 Pinia，避免掩蓋 L3 元件直接依賴 store 的違規。
- 修改 `.storybook/preview.ts` 的 import 後必須重啟 Storybook；Tailwind 任意尺寸必須帶單位，
  例如 `h-[600px]`。

提交前應實際開啟 Story，檢查 Controls、各邊界狀態與 Accessibility 分頁。axe-core 的
`Violations` 應逐項確認，但零違規不代表完整無障礙；鍵盤流程、焦點順序與螢幕閱讀器仍需人工測試，
且目前 Accessibility 結果不會阻擋 CI。

### A.11 工單分析與分步方式

`docs/toby/dev/` 用於保存工單分析、執行切片、驗收案例與交付證據。開始實作前，應先依
下列順序分析；不要只根據工單標題推測需求：

1. **確認來源與基準**：閱讀最新工單、相關規格及既有交接文件；確認目前分支並執行
   `git status --short --branch`，區分既有變更與本次工作。
2. **界定範圍**：列出允許修改、禁止修改及刻意不處理的檔案與行為，並將需求改寫成
   可觀察的驗收條件。文件互相矛盾時，記錄落差，不自行擴大範圍。
3. **追蹤資料流**：從使用者事件沿著元件、store、domain data、computed 與輸出 UI 逐段追查；
   核對 ID、名稱、型別、單位及空值契約，並閱讀直接相關測試確認既有行為。
4. **分類問題**：分開記錄本工單缺陷、上游接線／資料契約問題、既有基準問題及文件落差。
   若修正必須觸及禁止檔案，保留證據並停止，不以旁路修改掩蓋根因。
5. **拆分步驟**：依「範圍確認 → 資料接線 → UI／核心實作 → 手動驗收 → 品質門檻」切成
   可獨立執行與驗收的小步驟；每一步都寫明目標、修改檔案、限制、驗收條件及下一步。
6. **驗證與交付**：涵蓋正常、空值、多選／多筆、極端值及已知上游失敗案例；最後檢查 diff、
   執行品質指令，並摘要修改檔案、操作方式、驗證結果與尚未解決的上游問題。

分析文件命名為 `<工單>_analysis.md`，分步索引為 `<工單>_steps.md`，各步驟使用
`<工單>_step_NN_<主題>.md`。除非使用者要求留下分析紀錄，否則先在對話中完成分析，
不得因套用此流程而自行建立 planning 文件。

## B. 專案架構導覽

## 1. 專案定位與技術棧

本專案是以 Vue 3、TypeScript、Pinia 與 Vue Flow 建立的「終末地工廠產線規劃器」。
主要能力包含：

- 在 Vue Flow 畫布上放置、移動、旋轉及連接設備。
- 透過 Command Pattern 支援 undo/redo。
- 驗證設備與管線配置。
- 建立產線有向圖並模擬配方、流量、效率、堵塞和耗電。
- 顯示品項、材料額度、建造計畫、倉庫及調度券統計。
- 提供 `/dev` 開發測試頁驗證演算法及資料。

主要套件：

- Vue 3 + Vite + TypeScript
- Pinia
- Vue Router
- Vue Flow
- Nuxt UI
- VueUse
- Tailwind CSS
- Vitest
- Storybook

## 2. 整體資料流

```text
Vue UI / Vue Flow 畫布
        │
        ▼
editorStore ── Command ──► historyStore
        │
        ├──► validationStore
        │       執行已註冊 Detector
        │
        └──► FlowEngine
                建圖 → 驗證鏈路 → 拓撲排序
                → 傳播流量 → 偵測堵塞 → 統計
                         │
                         ▼
                     flowStore
                         │
                         ▼
              畫布標示與統計面板
```

正式主畫面由 `src/app/layouts/MainLayout.vue` 組合，並依序啟動：

1. `useValidation()`：同步監聽藍圖變更並執行驗證。
2. `useFlowEngine()`：以 150ms debounce 重新計算產線。

這個呼叫順序很重要，FlowEngine 需要讀取最新的 validation alerts。

## 3. 專案入口與設定

### `package.json`

定義 Vue、Pinia、Vue Flow、Nuxt UI 等依賴，以及 `dev`、`build`、`test`、
`type-check`、`lint-check`、`format-check` 和資料生成指令。

### `index.html`

Vite HTML 入口，提供 Vue 掛載點。

### `src/main.ts`

建立 Vue App，安裝 Pinia、Router、Nuxt UI，載入全域樣式與 Vue Flow 樣式。

### `src/router/index.ts`

定義正式編輯器 `/`，以及僅開發模式可使用的 `/dev/*` 路由。

### `src/app/App.vue`

最上層應用程式殼層。啟動全域快捷鍵，渲染 `RouterView` 與快捷鍵設定面板。

### `src/app/layouts/MainLayout.vue`

正式主畫面布局。組合 Navbar、ProjectSidebar、FactoryCanvas、ToolbarPanel、
StatsPanel 和 InspectorSidebar，並啟動 validation 與 FlowEngine watcher。

### `src/style.css`

載入 Tailwind 和 Nuxt UI，定義正式編輯器布局、面板和 Vue Flow 全域樣式。

### `vite.config.ts`

啟用 Vue、Nuxt UI Vite plugin，並建立 `@` 對應 `src` 的 alias。

### `vitest.config.ts`

設定 Vitest Node 測試環境及 `@` alias。

### `.storybook/`

設定 Vue 3 + Vite 的元件開發環境。`preview.ts` 提供 Nuxt UI 與全域樣式；
`vueFlowHarness.ts` 讓 Vue Flow 節點和連線在真實畫布環境中渲染。Story 檔案與元件共置於
`src/components/`，並以 `*.stories.ts` 命名。

### `tsconfig.app.json`

前端 TypeScript 設定，包含未使用變數、未使用參數與 switch fallthrough 檢查。

### `eslint.config.ts`

ESLint 規則。

### `tailwind.config.ts` / `postcss.config.js`

Tailwind 與 PostCSS 設定。

## 4. 核心 Pinia Stores

### `src/store/editorStore.ts`

最核心的藍圖 store，兼任設備與管線的領域資料來源。

保存：

- Vue Flow `nodes` 與 `edges`
- 地圖寬高及 snap-to-grid
- 目前工具模式
- 設備選擇與 placement armed 狀態
- 目前建造計畫
- 機器使用數量

高階操作包括：

- `placeDevice`
- `moveDevices`
- `commitDeviceMove`
- `rotateDevice`
- `removeDevices`
- `setRecipe`
- `pasteSelection`
- `addConnection`
- `removeConnection`

這些操作會建立 Command 並交給 `historyStore`，使藍圖變更可以 undo/redo。
檔案目前也內嵌一組大型 mock 產線作為初始資料。

### `src/store/historyStore.ts`

Command Pattern 的歷史紀錄中心。管理 undo/redo stack，提供：

- `execute()`
- `undo()`
- `redo()`
- `clear()`

歷史只保留在目前 session，不做持久化。

### `src/store/canvasStore.ts`

保存純視圖狀態：格線大小、縮放、平移、基地區域及格線顯示。
視圖操作不進入 history。

### `src/store/selectionStore.ts`

保存目前選取的節點與管線 ID，供畫布、刪除快捷鍵和 Inspector 使用。

### `src/store/flowStore.ts`

保存 FlowEngine 的衍生結果：

- 管線流量
- 設備效率
- 品項摘要
- sink 實際交付量
- 堵塞管線
- 非法鏈路節點
- 電力需求與供應
- 調度券換算設定
- 倉庫容量及填滿預估

UI 原則上只讀取此 store；計算結果由 `useFlowEngine.ts` 寫入。

### `src/store/validationStore.ts`

Detector 註冊與執行中心。保存 alerts，統計 error/warning，並提供：

- `registerDetector()`
- `unregisterDetector()`
- `run()`
- `hasBlockingError()`
- `alertsByDevice()`
- `alertsByConnection()`

### `src/store/keybindingStore.ts`

定義所有可配置快捷鍵。使用 `localStorage` 保存自訂鍵位，並處理衝突檢查、
恢復預設及設定面板開關。

## 5. Composables 與 FlowEngine

### `src/composables/useFlowEngine.ts`

專案最大的核心演算法檔。主要階段如下：

1. `buildGraph()`：把 FactoryNode/FactoryEdge 轉成 FlowGraph。
2. `validateChains()`：檢查合法 source-to-sink 鏈路、配方、媒質與 port cardinality。
3. `topologicalSort()`：使用 Kahn's Algorithm 排序並偵測環路。
4. `propagateFlows()`：依拓撲順序傳播品項流量並計算設備效率。
5. `detectCongestion()`：判斷並反向傳播堵塞。
6. `calcItemSummary()`：統計品項 produced、consumed、net 和 efficiency。
7. `runFlowEngine()`：組合完整結果並寫入 `flowStore`。

其他重要能力：

- 依實際輸入集合匹配配方。
- 處理多輸出與副產品。
- 檢查 belt/pipe 媒質及固體／液體／氣體物態。
- 套用 belt 30/min、pipe 60/min 的速率上限。
- 讀取 ValidationStore 的 blocking errors。
- 計算有效設備總耗電。

`useFlowEngine()` 會監聽 editorStore nodes/edges 及 validation alerts，並以 150ms
debounce 執行完整重算。

### `src/composables/useValidation.ts`

監聽 editorStore 的 nodes/edges，建立 `ValidationContext`，同步執行所有已註冊
detector。刻意不 debounce，以確保 FlowEngine 讀到最新 alerts。

### `src/composables/useShortcuts.ts`

將 undo、redo、刪除選取、Space 平移、重置畫布及開啟快捷鍵設定等動作接到 stores。

### `src/composables/useKeybinding.ts`

原生鍵盤事件層。負責按鍵名稱正規化、持續按住狀態、單次觸發以及重新錄製鍵位。

## 6. 正式編輯器 UI

### `src/editor/canvas/FactoryCanvas.vue`

正式畫布互動中心。整合 Vue Flow、背景、Controls 和 MiniMap，處理：

- 點擊或拖曳放置設備
- 節點與管線選取
- 拖曳移動及歷史提交
- 設備旋轉
- 建立管線
- 管線右鍵刪除
- WASD 平移
- 格線吸附與基地邊界
- 顯示流量標籤、效率和堵塞狀態

### `src/editor/canvas/FlowNodeOverlay.vue`

正式設備節點外觀。依機器模式建立 input/output handles，並顯示旋轉、效率和非法鏈路狀態。

### `src/editor/canvas/PipelineEdge.vue`

自訂 Vue Flow 管線，依 bend points 產生折線路徑。

### `src/editor/navbar/Navbar.vue`

頂部列。切換左側欄、選取／平移工具、基地區域，並顯示暫定檔名。

### `src/editor/sidebar/ProjectSidebar.vue`

左側專案選單及 hover 展開行為。新建、匯入和匯出目前仍為 TODO。

### `src/editor/toolbar/ToolbarPanel.vue`

底部設備工具列，支援點擊後放置及拖曳至畫布放置。

### `src/editor/inspector/InspectorSidebar.vue`

右側可收合 Inspector 容器。

### `src/editor/inspector/InspectorPanel.vue`

編輯地圖寬高、snap-to-grid，並嵌入 `ProductionStats.vue`。

### `src/editor/stats/ProductionStats.vue`

真正接上 FlowStore 與 EditorStore 的完整產能面板。顯示：

- 電力供需
- 建造計畫材料額度
- 機器數量限制
- sink 實際產出
- 品項生產／消耗／效率
- 調度券估算
- 倉庫填滿預估

### `src/editor/settings/ShortcutSettingsPanel.vue`

快捷鍵設定 Modal，負責重新錄製、衝突提示和恢復預設。

## 7. 共用元件

### `src/components/BaseRegionSelector/Index.vue`

基地區域下拉選擇器。

### `src/components/ShortcutRow/Index.vue`

快捷鍵設定中的單列顯示及錄製元件。

### `src/components/MachineShape.vue`

依機器尺寸、模式和 ports 繪製 SVG 機器形狀。目前未被正式主路徑引用。

### `src/components/StatsPanel/Index.vue`

MainLayout 中央工作區右側的統計組合元件。目前傳給所有子元件的仍是固定零值或空陣列，
尚未接上 FlowStore。

### `src/components/StatsPanel/PowerSummary.vue`

顯示電力供需、設備數、錯誤數和管線數。

### `src/components/StatsPanel/ItemSummaryTable.vue`

顯示品項產出、消耗、淨值與效率。

### `src/components/StatsPanel/TicketEstimate.vue`

顯示調度券換算結果。

### `src/components/StatsPanel/WarehouseEstimate.vue`

顯示倉庫容量與填滿時間預估。

### `src/components/FlowChart/`

一套獨立、資料寫死的 Vue Flow 流程圖 PoC。包含材料、設備、產品、倉庫、待匯入節點
與自訂 FlowEdge，目前未接 editorStore，也不是正式主畫面。

## 8. 靜態領域資料

### `src/data/machines.ts`

機器主資料：尺寸、耗電、分類、source/sink、模式及 input/output ports。
提供名稱、ID 與分類查詢 API。

### `src/data/products.ts`

產品與配方主資料。提供依機器、模式、產品查配方，以及品項物態和傳輸媒質查詢。

### `src/data/materials.ts`

基礎材料主資料及物態查詢。

### `src/data/plans.ts`

建造計畫資料，包含材料額度、機器上限和產品價值。

### `src/data/environments.ts`

配方環境定義。目前正式 UI 尚未使用。

## 9. 主要型別

### `src/types/graph.ts`

包裝 Vue Flow 的 `FactoryNode`、`FactoryEdge` 及其領域資料。

### `src/types/flow.ts`

定義配方、物態、FlowGraph、流量、品項統計和 FlowEngine 結果，也包含 belt/pipe 速率上限。

### `src/types/machine.ts`

定義 Machine、MachineMode、PortDef、PortMedia、機器分類與未來行為函式契約。

### `src/types/editor.ts`

定義工具模式、設備工具列類型、旋轉、地圖設定和移動位置快照。

### `src/types/history.ts`

定義 Command 介面及歷史操作種類。

### `src/types/validation.ts`

定義 Alert、ValidationContext 和 Detector 契約。

### `src/types/plan.ts`

定義建造計畫、材料額度、設備限制、產品價值等資料。

### `src/types/environment.ts`

定義配方環境。

### `src/types/euclideanSpace.ts`

定義 N 維座標與軸向移動。

### `src/types/shironesinterface.ts`

舊版／獨立重疊偵測器使用的機器與管線簡化介面。

## 10. Utils 與 Lib

### `src/utils/geometryUtils.ts`

計算旋轉後設備佔格、格子重疊及基地邊界合法性。

### `src/utils/portUtils.ts`

計算機器旋轉後 port 的方位與 offset。

### `src/utils/reverseChain.ts`

從目標產品反向搜尋最短配方鏈，統計步數和所需基礎材料。主要供 dev 頁使用。

### `src/utils/flowHelpers.ts`

將效率值轉換成 UI 背景色 class。

### `src/utils/shirone/*`

舊版幾何工具，負責機器／管線佔格及管線絕對座標轉相對路徑。

### `src/lib/history/createMacroCommand.ts`

將多個子 Command 組成一次可復原的原子操作。正式 editorStore 目前尚未使用。

### `src/lib/history/index.ts`

History helper 的 barrel export。

### `src/lib/validation/detectors/overlapDetector.ts`

以稀疏格點表偵測設備和管線的佔格重疊。目前使用舊 `shironesMachine`／
`shironesPipeline` 介面，尚未接進正式 ValidationStore。

## 11. Dev 頁面

### `src/app/dev/DevLayout.vue`

`/dev` 測試工具的共用導航 Layout。

### `src/app/dev/FlowEngineTest.vue`

FlowEngine 綜合實驗台，包含大量 preset、JSON 輸入、拓撲圖和反向配方鏈測試。

### `src/app/dev/DevTopologySvg.vue`

以 SVG 顯示測試拓撲和 ports。

### `src/app/dev/topologyPortUtils.ts`

Dev SVG 的尺寸、旋轉、port 座標及顯示格計算。

### `src/app/dev/HistoryReplay.vue`

手動驗證 Command、拖曳 commit 及 undo/redo 場景。

### `src/app/dev/ValidationTest.vue`

手動驗證 detector 註冊和警示結果。

### `src/app/dev/PlacementDemo.vue`

測試真實機器尺寸、放置和 port 旋轉。

### `src/app/dev/MachineCatalogPanel.vue`

瀏覽機器分類、模式、ports 和原始資料。

### `src/app/dev/ProductCatalogPanel.vue`

瀏覽材料／產品及反向配方鏈。

### `PaperFigMainField.vue` / `PaperFigBottomBar.vue` / `paperfigv2.css`

另一套 Paper/Figma 視覺稿實驗頁，不是目前 `/` 的正式布局。

## 12. 測試、規格與文件

### `src/__tests__/`

覆蓋 FlowEngine 各版本行為、stores、composables、ports、幾何、資料一致性、歷史和驗證。

### `spec/`

產品需求規格，依畫布、管線、驗證、流量模擬、歷史、匯入匯出、電力等主題拆分。

### `docs/`

開發紀錄、資料來源、roadmap、工作分派和個人交接文件。

`docs/toby/dev/` 保存 Toby 工單的分析摘要與分步執行文件。內容應呈現範圍、資料流、已知阻礙、
驗收案例與品質門檻；它是決策和交付證據，不是原始碼需求的替代品。若內容與最新工單或程式碼
不一致，應標明日期與差異，並以使用者確認後的範圍為準。

### `dist/`

Vite 建置輸出，不應作為原始碼修改來源。

### `auto-imports.d.ts` / `components.d.ts`

工具自動產生的型別宣告，不應手動維護。

## 13. 目前架構上的重要現況

1. 正式畫布已接上 editor、history、flow、canvas 和 selection stores。
2. `MainLayout` 右側的 `StatsPanel/Index.vue` 仍顯示固定空資料；真正接上 stores 的統計位於 Inspector 的 `ProductionStats.vue`。
3. `useValidation()` 會執行已註冊 detector，但正式程式目前沒有註冊任何 detector，因此預設 alerts 為空。
4. `overlapDetector.ts` 使用舊版 `shirones*` 型別，尚未轉接 `FactoryNode`／`FactoryEdge`。
5. `editorStore.ts` 初始內容是一組大型 mock 產線，不是空白專案或持久化內容。
6. `FlowChart/`、`MachineShape.vue`、PaperFig 頁面及多數 dev 元件屬於 PoC／展示支線。
7. 新建、匯入、匯出、正式供電來源及物流自動節點仍有 TODO。
8. `createMacroCommand()` 已完成並有測試，但正式 editorStore 尚未使用。

## 14. 修改時的依賴原則

- 藍圖領域資料應由 `editorStore` 的高階 action 修改，避免 UI 直接改陣列而繞過 history。
- 會改變藍圖的使用者操作應使用 Command Pattern；純視角狀態不進 history。
- FlowEngine 結果只寫入 `flowStore`，不要回寫到 FactoryNode/FactoryEdge。
- Validation alerts 只寫入 `validationStore`，detector 應保持可獨立測試。
- 機器、產品、材料與計畫資料應透過 `src/data` 提供的查詢 API 使用。
- 跨模組資料形狀應先定義於 `src/types`，避免在 UI 重複宣告領域型別。
- `useValidation()` 必須先於 `useFlowEngine()` 啟動。
- `src/app/dev` 與 `src/components/FlowChart` 的 PoC 不應被誤認為正式主路徑。
- 修改 FlowEngine、port、幾何或 stores 時，應同步執行相應的 Vitest 測試。
