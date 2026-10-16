# 步驟 2：建立 LayoutView 資料接線

## 目標

新增 L2 容器 `LayoutView.vue`，從 `useLayoutStore()` 取得設備與管線，並傳給純展示的
`GridCanvas.vue`。

## 修改檔案

```text
src/editor/layout/LayoutView.vue
src/editor/layout/GridCanvas.vue    僅在 readonly 型別不相容時修改
```

## 實作資料流

```text
onMounted
    → layout.devices.length === 0
    → getMockLayoutScenario('connected')
    → toLayoutSnapshot(...)
    → layout.loadSnapshot(...)

template
    → GridCanvas
         :devices="layout.devices"
         :pipelines="layout.pipelines"
```

## 實作要求

1. `LayoutView.vue` 可 import：
   - `onMounted`
   - `GridCanvas`
   - `useLayoutStore`
   - `getMockLayoutScenario`
   - `toLayoutSnapshot`
2. 只有在 `layout.devices.length === 0` 時載入初始內容，避免覆寫既有設備資料。
3. fixture 必須先經 `layout.loadSnapshot()`，不得直接成為 `GridCanvas` props。
4. 容器使用 `relative h-full w-full overflow-auto`，保持在 `area-canvas` 內。
5. 所有變數、副作用 hook 與設計理由依專案規範補繁體中文 JSDoc。
6. 不宣告 emits，不加入點擊、拖曳、選取、滾輪或鍵盤事件。

## readonly 處理

先直接傳入 store 的唯讀資料並執行 `pnpm type-check`。若型別不相容：

- 將 `GridCanvas` 的 `devices`、`pipelines` props 改為 readonly 陣列契約。
- 若 `pipelinePath()` 仍拒絕唯讀 waypoints，同步將函式參數改為 readonly 序列。
- 不得使用 `as any`、`as unknown as` 或 `[...layout.devices]` 規避型別。
- 不得修改 layoutStore 的 readonly 封裝。

## 驗收條件

- `LayoutView.vue` 存在且唯一資料來源為 `useLayoutStore()`。
- 空 store 會透過高階 action 載入 `connected` 場景。
- 已有設備時不覆寫資料。
- `GridCanvas.vue` 仍無 store 與 Vue Flow import。
- `pnpm type-check` 通過。

## 下一步

資料接線完成後，進入「步驟 3：切換首頁畫布」。
