# W0914-T1 工單分析摘要

分析日期：2026-09-18

原始工單：`docs/work_dispatch/toby/0914/W0914-T1_main_view_integration.md`

教學文件：`docs/work_dispatch/toby/0914/GUIDE_main_view_integration.md`

## 結論

本工單是新佈局畫布的 L2 第二階段接線：新增 `LayoutView.vue` 作為容器，從
`useLayoutStore()` 取得唯讀設備與管線，再以 props 傳入既有 `GridCanvas.vue`；首頁的
`area-canvas` 則由 `FactoryCanvas` 改掛 `LayoutView`。

目前 master 已具備所有前置依賴：

- PR #45 的 `layoutStore` 已合入。
- `GridCanvas.vue` 已存在。
- PR #47 的 `useGridViewport.ts` 已合入，但本工單可不接。
- `mockLayout.ts` 已提供 `connected` 初始場景。
- 分析時 `master` 與 `origin/master` 同步，工作樹乾淨。

因此工單可以開工；實作前應先建立指定分支 `dev/toby0914`。

## 目標資料流

```text
MainLayout.vue
    └─ LayoutView.vue
         ├─ useLayoutStore()
         ├─ 空資料時 loadSnapshot(connected)
         └─ GridCanvas.vue
              ├─ devices prop
              └─ pipelines prop
```

`GridCanvas.vue` 必須維持純 props 渲染，不得 import Pinia store 或 Vue Flow。

## 允許修改

- 新增 `src/editor/layout/LayoutView.vue`。
- 修改 `src/app/layouts/MainLayout.vue` 的 `FactoryCanvas` import 與 `area-canvas` 內容。
- 僅在 readonly 型別或容器接線確有需要時修改 `src/editor/layout/GridCanvas.vue`。
- 新增或更新本目錄中的工單分析與分步文件。

## 禁止修改

- `src/editor/canvas/FactoryCanvas.vue`。
- `src/editor/layout/useGridViewport.ts`。
- `src/editor/toolbar/ToolbarPanel.vue`。
- `src/editor/inspector/*`。
- `src/components/StatsPanel/*`。
- 擺放、選取、拖曳、設備正式視覺與視角切換器。
- 不得用直接傳 fixture 給 `GridCanvas` 的方式繞過 `layoutStore`。

## 已知風險與文件落差

### 1. readonly 型別契約

`layoutStore` 對外暴露 `readonly(devices)` 與 `readonly(pipelines)`，但目前 `GridCanvas`
props 宣告為可變陣列。正式接線若發生 TypeScript 錯誤，應將元件輸入及管線路徑函式調整成
接受 readonly 資料，不得使用 `as any`、雙重斷言或複製陣列掩蓋契約問題。

### 2. 初始資料會進入 history

`layoutStore.loadSnapshot()` 是高階 action，會建立 Command 並寫入共用 `historyStore`。
依 GUIDE 載入初始場景後，undo 可能清空新畫布。這是工單明確允許的初始化方式，本切片不得
修改 store 或繞過 action；若產品不接受此 undo 行為，應停止並請 aaaaa／dernoson 裁定。

### 3. 新舊資料來源暫時並存

新畫布讀取 `layoutStore`，但 Toolbar、Validation、FlowEngine、Stats 與 Inspector 仍可能依賴
舊 `editorStore`。因此工具列操作與右側統計暫時不保證反映到新畫布。這是本週唯讀整合的已知
過渡狀態，不得在本工單順便整合或重構。

### 4. 元件命名規範特例

專案通則要求 PascalCase 資料夾搭配 `Index.vue`，但較新且具體的工單明定新增
`src/editor/layout/LayoutView.vue`。本切片依工單指定路徑執行，視為命名特例，不另行搬移
`GridCanvas.vue` 或建立新資料夾。

### 5. 品質門檻差異

工單 DoD 只明列 type-check 與 lint-check，但專案守則要求修改完成後同時通過 format-check
與 test。因此交付以前應執行四項完整品質檢查。

## 基準驗證

分析階段已完成：

- `pnpm type-check`：通過。
- `layoutStore`、`mockLayout`、`useGridViewport` 相關測試：3 個測試檔、59 項測試全部通過。

上述結果只代表修改前基準；實作後仍須重新執行完整品質門檻。

## 建議驗收案例

1. layoutStore 初始為空時，首頁顯示 `connected` 場景的格線、兩台設備與一條管線。
2. layoutStore 已有資料時，不得被初始 fixture 覆寫。
3. 重新掛載 `LayoutView` 時，不重複載入 snapshot。
4. `GridCanvas.vue` 內不存在 store 或 Vue Flow import。
5. 首頁沒有新增擺放、選取、拖曳或視角切換器。
6. `FactoryCanvas.vue` 保留且沒有修改。
7. diff 不包含 Toolbar、Inspector、StatsPanel 或 `useGridViewport.ts`。
8. 確認並記錄初始化 snapshot 的 undo 行為。
