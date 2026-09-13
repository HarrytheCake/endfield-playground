# W0907-T1 分步執行索引

本索引將 `W0907-T1 GridCanvas 只讀渲染` 拆成五個可依序執行與驗收的步驟。
原始工單與教學檔位於：

- `docs/work_dispatch/toby/0907/W0907-T1_gridcanvas_readonly.md`
- `docs/work_dispatch/toby/0907/GUIDE_gridcanvas_readonly.md`

## 已裁定事項

1. 採用決策 **1C**：保留指定 Story 檔，但不修改 `.storybook/main.ts`；Story 是否出現在
   Storybook 不列入本工單驗收。
2. 採用決策 **2A**：`src/editor/layout/GridCanvas.vue` 視為本工單的命名與分層特例，不改成
   `src/components/GridCanvas/Index.vue`。
3. Story 仍需包含 `Connected`、`Broken`，並通過 TypeScript、ESLint 與 Prettier 檢查。
4. 程式碼只新增以下兩個檔案：
   - `src/editor/layout/GridCanvas.vue`
   - `src/editor/layout/GridCanvas.stories.ts`
5. 本目錄中的分步文件是使用者明確要求的規劃文件，不計入上述程式碼變更限制。

## 執行順序

1. [步驟 1：確認範圍與依賴](./W0907-T1_step_01_scope.md)
2. [步驟 2：建立唯讀資料轉換](./W0907-T1_step_02_readonly_data.md)
3. [步驟 3：完成 SVG 格點渲染](./W0907-T1_step_03_svg_rendering.md)
4. [步驟 4：建立 Story 與靜態驗收](./W0907-T1_step_04_stories.md)
5. [步驟 5：品質檢查與交付](./W0907-T1_step_05_quality_gate.md)

## 固定邊界

- 不修改 `.storybook/main.ts`、router、store、`LayoutL1Preview.vue` 或既有 Vue Flow 畫布。
- 不 import Pinia store、`FactoryCanvas` 或 `@vue-flow/*`。
- 不加入 emit、點擊、拖曳、選取、平移或縮放。
- 不判斷管線連接狀態；管線使用固定顏色。
- 不複製 `PlacedDevice`、`Pipeline` 等領域型別。
- 不自行 push、建立 PR 或合併分支；必須等待使用者明確指示。

## 停止條件

遇到以下情況時停止擴大修改範圍，保留證據並回報：

- 完成元件必須修改兩個目標程式檔以外的程式碼或設定。
- 既有 `PlacedDevice`、`Pipeline` 或 layout utility 契約已改變，GUIDE 無法直接套用。
- 品質檢查失敗源自基準分支既有問題。
- 需求開始涉及互動、store、連接狀態或 viewport。
