# W0914-T1 主畫面接入工作摘要

## 基本資料

- 日期：2026-09-18
- 分支：`dev/toby`
- 工單：`docs/work_dispatch/toby/0914/W0914-T1_main_view_integration.md`
- 教學檔：`docs/work_dispatch/toby/0914/GUIDE_main_view_integration.md`
- 分步文件：`docs/toby/dev/0918/W0914-T1_steps.md`
- 實作目標：以 `LayoutView` 將 `layoutStore` 的唯讀設備與管線接入正式首頁的
  `GridCanvas`，取代首頁原本掛載的 `FactoryCanvas`

## 執行前狀態

- PR #45 的 `layoutStore` 已存在於 master。
- `GridCanvas.vue` 已由前一階段完成。
- PR #47 的 `useGridViewport.ts` 已存在，但本工單固定尺寸即可通過，因此未接入。
- `mockLayout.ts` 已提供 `connected` 與 `broken` 場景。
- 原始 `MainLayout.vue` 的 `area-canvas` 仍掛載 `FactoryCanvas`。
- 工單分析與五個分步文件已先提交為 `2482e21`。

## 完成內容

### `src/editor/layout/LayoutView.vue`

- 新增主畫面的 L2 佈局容器。
- 以 `useLayoutStore()` 作為唯一資料來源。
- 在 `onMounted()` 時檢查 `layoutStore.devices.length`。
- store 沒有設備時，透過
  `loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')))` 載入初始內容。
- store 已有設備時不覆寫資料，元件重新掛載也不重複加入 fixture。
- 將 `layoutStore.devices` 與 `layoutStore.pipelines` 透過 props 傳入 `GridCanvas`。
- 沒有 emit、點擊、拖曳、選取、滾輪、鍵盤或 viewport 互動。

### `src/editor/layout/GridCanvas.vue`

- 保持無 store、無 Vue Flow 的純 props 元件。
- 將 `devices` 與 `pipelines` props 改為接受 `DeepReadonly` 陣列。
- 將 `pipelinePath()` 的 waypoints 參數改為接受深層唯讀資料。
- 沒有使用 `as any`、雙重斷言或複製陣列規避 readonly 契約。
- 渲染行為與既有 Story args 保持相容。

### `src/app/layouts/MainLayout.vue`

- 將 `FactoryCanvas` import 改為 `LayoutView`。
- 將 `area-canvas` 內的 `<FactoryCanvas />` 改為 `<LayoutView />`。
- `useValidation()` 仍先於 `useFlowEngine()` 啟動。
- Navbar、ProjectSidebar、ToolbarPanel、StatsPanel 與 InspectorSidebar 均未修改。
- `FactoryCanvas.vue` 保留在原位置，沒有刪除或修改。

## 分步驗證結果

### 步驟 1：範圍與前置依賴

- 確認工作樹起始狀態乾淨。
- 確認 layoutStore、GridCanvas、mockLayout 與 useGridViewport 均已存在。
- 確認允許及禁止修改的檔案。
- 實作期間曾依工單名稱建立 `dev/toby0914`，之後依使用者指示刪除，只保留
  `dev/toby`。

### 步驟 2：LayoutView 資料接線

- 新增 `LayoutView.vue` 並接上 `useLayoutStore()`。
- 首次 type-check 正確發現 store 深層 readonly 與原本可變 props 不相容。
- 僅調整 `GridCanvas` 輸入與路徑函式的 readonly 型別，未修改 store。
- 修正後 `pnpm type-check` 通過。
- `GridCanvas.vue` 搜尋不到 `store` 或 `vue-flow`。

### 步驟 3：首頁畫布切換

- `MainLayout.vue` 只有 import 與 `area-canvas` 掛載點兩處實質修改。
- Validation 與 FlowEngine 呼叫順序保持不變。
- `FactoryCanvas.vue`、`useGridViewport.ts`、Toolbar、Inspector 與 StatsPanel diff 均為空。

### 步驟 4：正式首頁驗收

- 啟動 `pnpm dev --host 127.0.0.1` 成功。
- 首頁 HTTP 回應為 200。
- 使用無介面瀏覽器對正式首頁進行截圖驗收，確認顯示：
  - 12×8 SVG 格線。
  - 兩台標示為「分流器」的設備。
  - 連接兩台設備的 belt 管線。
  - 原有 Navbar、Toolbar、StatsPanel 與 Inspector。
- 驗收截圖與瀏覽器暫存 profile 已在確認後刪除，未留在工作樹。
- 靜態檢查確認沒有新增互動事件或視角切換器。

### 步驟 5：完整品質門檻

- `pnpm type-check`：通過。
- `pnpm lint-check`：通過。
- `pnpm format-check`：通過。
- `pnpm test`：43 個測試檔、827 項測試全部通過。
- `git diff --check`：通過。
- 禁止修改檔案的 diff：空。

## Storybook 狀態

本工單沒有修改 Storybook：

- `.storybook/*` 無變更。
- `GridCanvas.stories.ts` 無變更，既有 `Connected` 與 `Broken` Story 保留。
- 未新增 `LayoutView` Story；`LayoutView` 是依賴 Pinia 的 L2 容器，而本工單指定驗收現場為
  `pnpm dev` 正式首頁。
- readonly props 調整已通過 TypeScript，既有 Story args 仍相容。

## 已知過渡限制

### 初始資料進入 history

`layoutStore.loadSnapshot()` 會建立 Command 並寫入共用 `historyStore`，因此初始場景可被 undo。
這是 GUIDE 明確允許的初始化方式，本工單未修改 store 或繞過高階 action。

### 新舊資料來源並存

新畫布讀取 `layoutStore`，但 Toolbar、Validation、FlowEngine、Stats 與 Inspector 仍可能依賴
舊 `editorStore`。正式首頁截圖中右側統計仍呈現舊資料，符合本週唯讀整合的已知過渡狀態。
本工單未擴大處理 store 遷移。

### 本週沒有視角切換器

首頁已直接改掛 `LayoutView`；沒有新增舊／新畫布切換器，也沒有接入平移縮放。舊
`FactoryCanvas.vue` 仍保留，待後續工單處理。

## 正式交付狀態

- 目前程式碼變更：
  - `src/editor/layout/LayoutView.vue`：新增。
  - `src/editor/layout/GridCanvas.vue`：readonly 型別調整。
  - `src/app/layouts/MainLayout.vue`：首頁掛載點切換。
- 工作摘要新增於 `docs/toby/work_summaries/`。
- 目前分支為 `dev/toby`。
- 上述程式碼與本工作摘要尚未 commit、push 或建立 PR。
