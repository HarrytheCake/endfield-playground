# GUIDE｜W1004-T1 無邊界格點

配 [W1004-T1](./W1004-T1_unbounded_canvas.md)。

## 1. 現況（不要再擴 12×8）

`GridCanvas.vue` 預設 `gridWidth: 12`、`gridHeight: 8`，點擊用「滑鼠在 SVG 寬高裡的比例 × 格數」。超出 viewBox 的設備直接消失。

`useGridViewport.ts`（harry，已合 #47）提供 `panBy`／`zoomAt`／`screenToCell`。以前禁止他改你的檔，所以主畫面從來沒接上。

## 2. 建議切法

- SVG 大小＝**容器像素**（視窗），不是世界格數。
- 格線只畫目前視窗覆蓋到的格子（多畫一圈也行）。
- `cell-click` 用 `screenToCell`，不要用比例映射。
- 基地框：選了 region 就把 `(0,0)→(w,h)` 畫成矩形 overlay。未選則不畫。
- 出界：對每個 device 的佔格，若任一格 `!isWithinBaseRegion`，在該 device 的 `<g>` 加上標記。列表函式若 aaaaa 次優還沒交，可在 LayoutView 暫時呼叫現有 `isDeviceWithinBaseRegion`（它吃舊 node 形狀的話就自己用 `getDeviceOccupiedCells`，**不要**改 store）。

## 3. 平移手勢

本週有平移即可；縮放有就加分。不要做框選。

## 4. 跟 harry 的邊界

他改 `MainLayout` 槽位，可能讓畫布容器變高變寬。你的 SVG 應 `width/height=100%` 吃容器，不要假設底欄永遠在。
