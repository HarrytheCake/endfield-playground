# W0914-T1 分步執行索引

本索引將 `W0914-T1 把新畫布接上主畫面（L2 第二刀）` 拆成五個可依序執行與驗收的步驟。

原始文件：

- `docs/work_dispatch/toby/0914/W0914-T1_main_view_integration.md`
- `docs/work_dispatch/toby/0914/GUIDE_main_view_integration.md`
- [工單分析摘要](./W0914-T1_analysis.md)

## 執行順序

1. [步驟 1：確認範圍與前置依賴](./W0914-T1_step_01_scope.md)
2. [步驟 2：建立 LayoutView 資料接線](./W0914-T1_step_02_data_wiring.md)
3. [步驟 3：切換首頁畫布](./W0914-T1_step_03_main_view.md)
4. [步驟 4：手動驗收主畫面](./W0914-T1_step_04_manual_verification.md)
5. [步驟 5：品質檢查與交付](./W0914-T1_step_05_quality_gate.md)

## 固定決策

1. 使用 `useLayoutStore()` 作為唯一新畫布資料來源。
2. layoutStore 為空時，可透過 `loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')))`
   載入一次初始內容；不得把 fixture 直接傳給 `GridCanvas`。
3. `GridCanvas.vue` 維持無 store、無 Vue Flow 的純 props 元件。
4. 第一版不接 `useGridViewport`；固定尺寸已符合本工單 DoD。
5. 保留 `FactoryCanvas.vue`，只從正式首頁卸下，不刪除也不修改。
6. 不處理新舊 store 並存造成的 Toolbar／Stats 暫時不同步。
7. `LayoutView.vue` 依工單指定路徑建立，視為元件命名特例。

## 允許的程式碼 diff

```text
src/editor/layout/LayoutView.vue                 新增
src/app/layouts/MainLayout.vue                  修改
src/editor/layout/GridCanvas.vue                僅 readonly 型別確有需要時修改
```

## 停止條件

遇到以下情況時停止擴大修改，保留錯誤輸出並回報：

- 完成接線必須修改 `layoutStore.ts`、`historyStore.ts` 或其他 L1 契約。
- readonly 問題無法只靠修正 `GridCanvas` 輸入契約解決。
- 必須修改 Toolbar、Inspector、StatsPanel、`useGridViewport.ts` 或 `FactoryCanvas.vue` 才能驗收。
- 初始 `loadSnapshot` 的 history 行為被確認為不可接受。
- 品質檢查失敗源自基準分支既有問題。
- 需求開始涉及擺放、選取、拖曳或視角切換器。
