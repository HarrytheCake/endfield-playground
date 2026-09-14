# 步驟 3：完成 SVG 格點渲染

## 目標

在 `GridCanvas.vue` 使用原生 SVG 呈現格線、設備佔格、設備標籤與管線，不加入任何互動。

## 修改檔案

只修改：

```text
src/editor/layout/GridCanvas.vue
```

## 渲染順序

SVG 內依序渲染：

1. 格線。
2. 設備佔格與標籤。
3. 管線折線與 waypoint 標記。

管線最後渲染，避免被設備方塊完全遮住。

## SVG 尺寸

```text
width  = gridWidth × cellSize
height = gridHeight × cellSize
```

外層容器可以使用 Tailwind 提供捲動、邊框和背景。不得為此切片新增 CSS 檔。

## 格線

- 垂直線數量為 `gridWidth + 1`。
- 水平線數量為 `gridHeight + 1`。
- 座標必須使用 props，而不是固定 `CELL`、`GRID_W`、`GRID_H` 常數。

## 設備

- 每個去重後的 xy 格渲染一個 `<rect>`。
- key 至少包含 device id 與 xy，確保穩定且不碰撞。
- 標籤優先使用 `device.label`，缺省時可使用 `machine.name` 或 `machineType`。
- 本切片只顯示佔格，不繪製 ports、旋轉圖示、效率或選取框。

## 管線

- 每條管線使用 `<path>` 連接 `waypoints`。
- 顏色固定，不呼叫 `resolveConnections()` 判斷已連接或斷線。
- 可以顯示 waypoint `<circle>`，但不得加入 click handler。
- `connected` 與 `broken` 的差異來自 fixture 的路徑位置，不來自狀態分色。

## 可及性

- SVG 加上 `role="img"`。
- 提供繁體中文 `aria-label`，描述這是只讀格點佈局。
- 不使用按鈕或可聚焦控制元件。

## 禁止項目檢查

元件內不得出現：

```text
useXxxStore
FactoryCanvas
@vue-flow/
defineEmits
@click
@mousedown
@pointerdown
draggable
```

## 驗收條件

- 不同格數與 cellSize 能改變 SVG 尺寸及所有座標。
- 設備方塊與管線都落在相同格點座標系。
- 模板沒有互動事件或資料寫入。
- 樣式使用 Tailwind class 與必要的 SVG attributes，沒有新增散落的 inline CSS。

## 下一步

SVG 完成後，進入「步驟 4：建立 Story 與靜態驗收」。

