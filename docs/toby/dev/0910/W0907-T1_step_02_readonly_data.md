# 步驟 2：建立唯讀資料轉換

## 目標

建立 `GridCanvas.vue` 的 props、預設值及純衍生資料，將設備轉成可供 SVG 使用的 xy 佔格，
但暫不加入互動或外部狀態。

## 修改檔案

只新增或修改：

```text
src/editor/layout/GridCanvas.vue
```

## Props 契約

使用既有型別，不在元件內重複宣告領域模型：

```ts
import type { PlacedDevice, Pipeline } from '@/types/layout';

/** GridCanvas 的唯讀輸入資料 */
interface Props {
    /** 要顯示的已放置設備 */
    devices: PlacedDevice[];
    /** 要顯示的管線 */
    pipelines: Pipeline[];
    /** 每一格的像素尺寸，預設 28 */
    cellSize?: number;
    /** 畫布橫向格數，預設 12 */
    gridWidth?: number;
    /** 畫布縱向格數，預設 8 */
    gridHeight?: number;
}
```

以 `withDefaults(defineProps<Props>(), ...)` 設定預設值。不得宣告 `defineEmits()`。

## 設備佔格資料流

```text
props.devices
    → getMachineById(device.machineType)
    → deviceSizeFromMachine(machine)
    → toDeviceFootprint(device, size)
    → getDeviceOccupiedCells(...)
    → 依每台設備的 xy 去重
    → SVG rect 資料
```

實作要求：

1. 使用 `computed()` 產生設備佔格。
2. `getMachineById()` 查無機器時跳過該設備，不拋出例外。
3. 同一設備不同 z 層產生的相同 xy 只渲染一次。
4. 不自行重算旋轉尺寸；交由既有 layout utilities 處理。
5. 不改動 props 內的陣列或物件。
6. `<script setup>` 中的 props、變數、computed 與函式均依專案規範補上繁體中文 JSDoc。

## 管線路徑函式

建立純函式，把 waypoint 格子中心轉成 SVG path：

```text
(x, y)
    → ((x + 0.5) × cellSize, (y + 0.5) × cellSize)
    → 第一點使用 M，其餘點使用 L
```

函式必須使用 `props.cellSize`，不可直接照抄 `LayoutL1Preview.vue` 的固定 `CELL` 常數。
空 waypoints 應回傳空字串。

## 限制

- 不 import store。
- 不 import `FactoryCanvas` 或 `@vue-flow/*`。
- 不呼叫 `resolveConnections()` 或 `toTopology()`。
- 不加入 emit、watch 或副作用 hook。
- 不修改 `LayoutL1Preview.vue`。

## 驗收條件

- Props 型別與預設值完整。
- 不存在 `defineEmits()`。
- 未知 machine id 不會造成 runtime error。
- 設備 xy 佔格正確去重。
- 管線座標依 `cellSize` 計算。

## 下一步

資料轉換完成後，進入「步驟 3：完成 SVG 格點渲染」。

