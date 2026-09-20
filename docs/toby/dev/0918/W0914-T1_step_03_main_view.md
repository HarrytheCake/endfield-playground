# 步驟 3：切換首頁畫布

## 目標

只修改正式主畫面的畫布掛載點，讓首頁中央區域顯示新的 `LayoutView`，並保留其他區域及
舊 `FactoryCanvas` 原始碼。

## 修改檔案

```text
src/app/layouts/MainLayout.vue
```

## 實作要求

1. 將 `FactoryCanvas` import 改成 `LayoutView` import。
2. 將 `area-canvas` 內的 `<FactoryCanvas />` 改成 `<LayoutView />`。
3. 不修改 `area-canvas` 以外的 template 結構。
4. 保留 `useValidation()` 先於 `useFlowEngine()` 的既有呼叫順序。
5. 不修改 Navbar、ProjectSidebar、ToolbarPanel、StatsPanel 或 InspectorSidebar。
6. 不刪除、不搬移、不修改 `FactoryCanvas.vue`。

## 刻意接受的過渡狀態

- Toolbar 與右側統計仍可能依賴舊 editorStore。
- 新畫布只讀，不回應既有設備放置或選取操作。
- 首頁沒有舊／新畫布切換器。
- 固定 12×8 SVG 畫布可作為本工單第一版結果。

上述現象不得用跨檔案整合、隱藏 Toolbar 或修改 store 的方式處理。

## 驗收條件

- `MainLayout.vue` 的 `area-canvas` 只掛 `LayoutView`。
- `FactoryCanvas.vue` 仍存在且 diff 為空。
- `useValidation()` 與 `useFlowEngine()` 未被改動或重排。
- diff 沒有觸及禁止檔案。

## 下一步

首頁掛載完成後，進入「步驟 4：手動驗收主畫面」。
