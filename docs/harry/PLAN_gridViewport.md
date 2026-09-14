# 待實作：格點視窗（平移、縮放、座標換算）— W0907-H1

**狀態：** 規劃完成，即將實作
**對應工單：** [docs/work_dispatch/harry/0907/W0907-H1_grid_viewport.md](../work_dispatch/harry/0907/W0907-H1_grid_viewport.md)
**相關檔案：** `src/editor/layout/useGridViewport.ts`（新，composable）、`src/app/dev/GridViewportDemo.vue`（新）、`src/router/index.ts`、`src/app/dev/DevLayout.vue`、`src/__tests__/editor/useGridViewport.test.ts`（新）

> **Review 後更新（0914）：** 原本設計的 `Cell { x, y }` 已改用既有的 `@/types/euclideanSpace` `Position { x, y, z }`——review 指出佈局相關型別（`PlacedDevice`／`Pipeline`／`GridCanvas`）都用 `Position`，另立型別會讓 9/14 整合時兩邊互轉。`z` 在換算裡不參與計算：`cellToScreen` 忽略輸入的 `z`；`screenToCell` 固定回傳 `z: 0`（地面層），呼叫端要處理其他層需自行覆寫。另外補上 `zoomAt`／`zoomBy`／`panBy` 對非有限數（`NaN`／`Infinity`）輸入的防呆（整次呼叫視為無效並忽略），避免視窗狀態壞死。下面第 3 節保留原始設計紀錄，實作已依此更新。

---

## 1. 範疇判定

純狀態＋純數學的 composable，**不 import 任何 Pinia store**、**不碰** `GridCanvas.vue`（toby 本週的檔）、**不加深** `FactoryCanvas`/Vue Flow（已定案要拔）。這是這批新格點佈局視角的一塊獨立薄片，介於 L1（純函式）與 L2（互動）之間——不寫真實 UI，只提供給之後 L2 互動元件（含 toby 的 `GridCanvas.vue` 未來要不要接）呼叫的座標轉換與視角狀態。

## 2. 既有介面盤點

- `src/types/euclideanSpace.ts` 的 `Position { x, y, z }`：全專案格子座標的權威型別，但含 z（佔用層），跟視窗平移/縮放無關。**本次不直接用 `Position`**，另定義 2D 的 `Cell { x, y }`，避免混淆「畫布視角座標」與「設備 3D 佔格座標」兩個不同概念
- `src/app/dev/LayoutL1Preview.vue`（aaaaa 的 L1 除錯頁）目前用固定 `CELL=28`／`GRID_W=12`／`GRID_H=8` 常數畫格線，無平移縮放——本次的 demo 頁面**不引用**這個檔案（工單明確禁止），但沿用相同的 `cellSize=28` 預設值以視覺一致
- toby 的 `GridCanvas.vue`（[T1 GUIDE](../work_dispatch/toby/0907/GUIDE_gridcanvas_readonly.md)）props 預設 `cellSize=28`，兩邊各自獨立但預設值刻意對齊，之後 9/14 整合週要接起來時不會產生尺寸落差

## 3. 設計

### `useGridViewport.ts`

```ts
export interface Cell { x: number; y: number }
export interface ScreenPoint { x: number; y: number }

export function useGridViewport(options?: {
    cellSize?: number;  // 預設 28，對齊 GridCanvas 預設值
    minZoom?: number;   // 預設 0.25
    maxZoom?: number;   // 預設 4
}) {
    const offset = ref<ScreenPoint>({ x: 0, y: 0 });  // px，視角平移量
    const zoom = ref(1);

    function cellToScreen(cell: Cell): ScreenPoint;
    function screenToCell(point: ScreenPoint): Cell;
    function panBy(dx: number, dy: number): void;
    function zoomAt(anchor: ScreenPoint, nextZoom: number): void;  // 以 anchor（游標螢幕座標）為錨點縮放
    function zoomBy(anchor: ScreenPoint, factor: number): void;    // 相對縮放，滾輪事件用
    function reset(): void;  // 回到 offset=(0,0)、zoom=1

    return { offset, zoom, cellSize, minZoom, maxZoom, cellToScreen, screenToCell, panBy, zoomAt, zoomBy, reset };
}
```

- **座標換算契約**：`cellToScreen(cell)` 回傳該格**左上角**像素座標（`cell.x * cellSize * zoom + offset.x`）；`screenToCell(point)` 用 `Math.floor` 反推格子索引，並加一個極小 epsilon（`1e-9`）修正浮點誤差導致的邊界誤判（例如 `cellToScreen` 算出的像素值因浮點運算略小於理論值，`floor` 直接砍成上一格）。這樣 `screenToCell(cellToScreen(c))` 在任意 `zoom`/`offset` 下都會精確等於 `c`
- **縮放以游標為錨點**：`zoomAt(anchor, nextZoom)` 內部算出縮放前 `anchor` 對應的格子空間座標，縮放後重新計算 `offset`，讓同一個格子空間點在縮放後仍落在 `anchor` 這個螢幕位置——避免放大時畫面「飄走」
- **縮放上下限**：`minZoom=0.25`／`maxZoom=4`，`zoomAt`/`zoomBy` 內部 clamp
- **平移鍵位（本次决定）**：畫布上**中鍵拖曳**平移（不佔用左鍵，避免未來跟選取/點擊衝突），滾輪縮放。鍵位寫死在 `GridViewportDemo.vue` 的事件處理裡，**不註冊進 `keybindingStore`**（工單明講本週不改註冊表）

### `GridViewportDemo.vue`

- 純展示頁：自己畫一個簡單的虛擬格線（例如 40×40 格），包在 `<g :transform="...">` 內，`transform` 讀 `useGridViewport` 的 `offset`/`zoom` 組字串
- 監聽 `pointerdown`（中鍵）/`pointermove`/`pointerup` 呼叫 `panBy()`；監聽 `wheel` 呼叫 `zoomBy(cursorPoint, factor)`
- 畫面下方顯示目前 `offset`/`zoom` 數值與滑鼠所在格子座標（`screenToCell` 即時運算），方便肉眼驗證換算正確
- **不 import** `GridCanvas.vue`、不 import 任何 store

### 路由

- `src/router/index.ts`：在既有 `/dev` 底下的 `children` 加一條 `path: 'grid-viewport'`（跟 `flow-engine`/`placement-demo` 等現有 dev 頁同一種掛法，走 `DevLayout` 側欄，不特別隱藏——沒有理由比照 `paper-fig-main-field` 藏起來）
- `DevLayout.vue`：`devPages` 加一筆對應項目

## 4. 明確不在本次範圍內

- 鍵盤平移（WASD/方向鍵）與 `Ctrl +`/`-`/`0` 縮放快捷鍵——工單列為「有餘力再做」的加碼項，且需要額外鍵盤事件處理與測試，先把必要項做穩
- 接 toby 的 `GridCanvas.vue`、接任何 store——9/14 整合週的事
- 觸控/多點縮放手勢

## 5. 驗證方式

- `pnpm test src/__tests__/editor/useGridViewport.test.ts`：涵蓋 §3 座標換算來回一致（多組 cell／zoom／offset 組合）、`zoomAt` 錨點不變性、縮放 clamp、`panBy` 累加正確
- `pnpm type-check` / `pnpm lint-check`
- `pnpm dev` → `/dev/grid-viewport` 手動測試：中鍵拖曳平移、滾輪縮放有上下限、畫面不會因縮放飄走
- `grep -nE "store|FactoryCanvas|vue-flow" src/editor/layout/useGridViewport.ts` 應無輸出（比照 toby 工單的自查方式）
