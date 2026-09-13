# W0907-T1 GridCanvas 只讀渲染工作摘要

## 基本資料

- 日期：2026-09-10
- 分支：`dev/TOBY`
- 工單：`docs/work_dispatch/toby/0907/W0907-T1_gridcanvas_readonly.md`
- 教學檔：`docs/work_dispatch/toby/0907/GUIDE_gridcanvas_readonly.md`
- 分步文件：`docs/toby/dev/0910/W0907-T1_steps.md`
- 實作目標：建立不依賴 store 或 Vue Flow 的 GridCanvas，只透過 props 渲染格線、設備與管線

## 執行前裁定

### 1C：Storybook 可見性不列驗收

目前 `.storybook/main.ts` 只掃描 `src/components/**/*.stories.ts`，不會收錄指定位置
`src/editor/layout/GridCanvas.stories.ts`。

本次依使用者裁定：

- 保留指定 Story 檔案。
- 不修改 `.storybook/main.ts`。
- 不移動 Story 或元件。
- Storybook UI 可見性與肉眼渲染不列入本工單驗收。
- Story 仍須通過 TypeScript、ESLint 與 Prettier 靜態檢查。

### 2A：保留工單指定路徑

`src/editor/layout/GridCanvas.vue` 視為本工單的命名與分層特例，不改成
`src/components/GridCanvas/Index.vue`。

## 完成內容

### `src/editor/layout/GridCanvas.vue`

- 定義 `devices`、`pipelines`、`cellSize`、`gridWidth`、`gridHeight` props。
- `cellSize` 預設 28，畫布預設 12×8 格。
- 使用 `getMachineById()`、`deviceSizeFromMachine()`、`toDeviceFootprint()` 與
  `getDeviceOccupiedCells()` 取得設備佔格。
- 同一設備因不同 z 層產生的相同 xy 位置會先去重再渲染。
- 查不到 machine id 時安全跳過該設備的佔格，不拋出例外。
- 使用原生 SVG 渲染格線、設備佔格、設備標籤、管線折線及 waypoints。
- 所有 SVG 尺寸與座標皆依 props 計算，沒有沿用固定 `CELL` 常數。
- 提供 `role="img"`、繁體中文 `aria-label` 與 `<title>`。
- 沒有 store、Vue Flow、emit、點擊、拖曳、選取、平移或縮放。
- 沒有判斷管線連接狀態；所有管線使用固定顏色。

### `src/editor/layout/GridCanvas.stories.ts`

- 建立 `Connected` Story，使用 `getMockLayoutScenario('connected')`。
- 建立 `Broken` Story，使用 `getMockLayoutScenario('broken')`。
- Story title 為 `L2/Layout/GridCanvas`。
- 沒有自行複製或建立額外 fixture。

## 分步驗證結果

### 步驟 1：範圍與依賴

- 確認兩個目標檔案原先不存在。
- 確認 layout 型別、machine 查詢、mock layout 與幾何 utilities 均已存在。
- 確認 `getMachineById()` 可能回傳 `undefined`。
- 確認 Storybook 掃描限制，並依 1C 不修改設定。
- 記錄目前工作分支為 `dev/TOBY`，未自行切換分支。

### 步驟 2：唯讀資料轉換

- `pnpm type-check`：通過。
- `GridCanvas.vue` ESLint：通過。

### 步驟 3：SVG 格點渲染

- `pnpm type-check`：通過。
- `GridCanvas.vue` ESLint：通過。
- store、`FactoryCanvas`、Vue Flow、emit 與互動事件禁止內容檢查：通過。

### 步驟 4：Story 與靜態驗收

- `pnpm type-check`：通過。
- 兩個目標檔 ESLint：通過。
- 兩個目標檔 Prettier：通過。
- `Connected`、`Broken` 具名 export 與 fixture 引用檢查：通過。
- `.storybook/main.ts` 未修改。

### 步驟 5：完整品質門檻

- `pnpm type-check`：通過。
- `pnpm lint-check`：通過。
- `pnpm test`：39 個測試檔、742 項測試全部通過。
- 兩個目標檔 Prettier：通過。
- 最終禁止內容檢查：通過。
- 最終程式碼範圍檢查：只有兩個 GridCanvas 新檔。

全專案 `pnpm format-check` 未通過，原因是基準分支既有 63 個檔案不符合 Prettier；兩個
GridCanvas 新檔不在失敗清單，且已單獨通過 Prettier。本次依範圍限制未批次改寫其他檔案。

## 未驗收項目

- 依 1C，未執行 Storybook UI 肉眼驗收。
- `pnpm build-storybook` 同樣不會收錄 `src/editor/layout` 下的 Story，因此未將該指令視為
  GridCanvas Story 的有效驗證。
- 本切片未整合正式 layout、store 或 router。

## 正式交付狀態

- 程式碼新增檔案只有：
  - `src/editor/layout/GridCanvas.vue`
  - `src/editor/layout/GridCanvas.stories.ts`
- 未修改 `.storybook/main.ts`、router、store、fixture、layout utilities 或
  `LayoutL1Preview.vue`。
- 工作摘要已存入 `docs/toby/work_summaries/`。
- 尚未 commit、push 或建立 PR。
