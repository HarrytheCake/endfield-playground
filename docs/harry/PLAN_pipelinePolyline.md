# 待實作：管線折線的幾何純函式（C3 提前量）— W0921-H1

**狀態：** 規劃完成，即將實作
**對應工單：** [docs/work_dispatch/harry/0921/W0921-H1_pipeline_polyline.md](../work_dispatch/harry/0921/W0921-H1_pipeline_polyline.md)
**相關檔案：** `src/utils/layout/pipelinePolyline.ts`（新，純函式）、`src/app/dev/PipelinePolylineDemo.vue`（新）、`src/router/index.ts`、`src/__tests__/utils/layout/pipelinePolyline.test.ts`（新）
**唯讀參考（不改）：** `src/utils/layout/pipelineGeometry.ts` 的 `isAxisAlignedPath`

---

## 1. 範疇判定

純幾何＋純函式，**不 import 任何 Pinia store**、**不碰** `GridCanvas.vue`（toby 本週的門檻檔）。跟 `useGridViewport` 是同一種形狀的交付：一個 `src/utils/layout/` 純函式 + 測試 + 一個獨立的 `/dev` demo 頁，彼此互不 import、互不衝突。

目標只有一個：把現有 `isAxisAlignedPath` 的「整條路徑一個布林」，拆成「逐段告訴你哪一段合法、轉角在哪」，給之後 C3 渲染那一刀（10/11，owner 未定）直接消費。

## 2. 既有介面盤點

- `src/utils/layout/pipelineGeometry.ts` 的 `isAxisAlignedPath(waypoints): boolean`：逐點比較 `prev.x !== curr.x && prev.y !== curr.y` 判斷是否有斜線段。**本次沿用其判斷邏輯，不改動這個檔案**，只是把「整條」的結論拆成「逐段」。
- `src/types/euclideanSpace.ts` 的 `Position { x, y, z }`：沿用，管線 waypoints 本就是 `Position[]`（見 `src/types/layout.ts` 的 `Pipeline.waypoints`）。z 由媒質層固定，本函式的軸向判斷只看 x/y，不處理 z。
- `src/app/dev/GridViewportDemo.vue`：既有的獨立 dev 頁範例（純展示、自己畫 SVG、不掛 store），本次 demo 頁沿用同一種寫法與掛路由方式。

## 3. 設計

### 3.1 型別與函式簽章

```ts
export type SegmentOrientation = 'horizontal' | 'vertical' | 'diagonal';

/** 折線的單一線段 */
export interface PolylineSegment {
    from: Position;
    to: Position;
    /** 這一段是否軸對齊（水平或垂直）；false = 該段畫紅色 */
    axisAligned: boolean;
    orientation: SegmentOrientation;
}

/** 轉角：前後兩段方向不同的那個點 */
export interface PolylineCorner {
    at: Position;
    /** 轉角是否為 90 度（前後兩段一橫一豎） */
    rightAngle: boolean;
}

export function buildPipelinePolyline(waypoints: readonly Position[]): {
    segments: PolylineSegment[];
    corners: PolylineCorner[];
    /** 任一段非軸對齊即為 false；語意須與 isAxisAlignedPath 完全一致 */
    valid: boolean;
};
```

### 3.2 判斷規則

- **單一線段的 `orientation`／`axisAligned`**：設 `dx = to.x - from.x`、`dy = to.y - from.y`。
    - `dx === 0 && dy === 0`（重複點／零長度段）→ 視為 `horizontal`（沿用「至少一軸相同即合法」的既有語意，`isAxisAlignedPath` 對這種情況也判合法），`axisAligned: true`
    - `dx === 0`（且 `dy !== 0`）→ `vertical`，`axisAligned: true`
    - `dy === 0`（且 `dx !== 0`）→ `horizontal`，`axisAligned: true`
    - 其餘（`dx !== 0 && dy !== 0`）→ `diagonal`，`axisAligned: false`

  這個判斷式跟 `isAxisAlignedPath` 的 `prev.x !== curr.x && prev.y !== curr.y` 是同一條件的否命題，兩者不會分岔。

- **`valid`**：`segments.every(s => s.axisAligned)`。少於 2 點時 `segments` 為空陣列，`every` 對空陣列恆真 → `valid: true`，與 `isAxisAlignedPath([...])`（迴圈不執行、直接回傳 `true`）一致。

- **`corners`**：走訪相鄰兩段（`segments[i-1]` 與 `segments[i]`），僅當兩段 `orientation` 不同才產生一個 corner，`at` 為兩段共用的那個 waypoint；`rightAngle` 為真 iff 前後兩段分別是 `horizontal`／`vertical`（不含 `diagonal` 參與的方向變化，那種情況 `rightAngle: false`，因為斜線本來就不構成直角轉彎，但仍標記為「方向不同」以利渲染定位問題段）。相鄰兩段 `orientation` 相同（含都是 `diagonal`）視為直行，不算轉角。

### 3.3 demo 頁（`PipelinePolylineDemo.vue`）

- 頁面內建幾組寫死的 waypoints 範例（直線、單一直角、多次轉折、含一段斜線），也提供一個簡單輸入介面（例如逐點加座標的按鈕/表單）讓使用者自組路徑——**不讀任何 store，waypoints 全部自己 mock**。
- 用 `useGridViewport`（自己上週做的東西）處理座標→螢幕的換算與可能的縮放平移展示，SVG 畫出各段：`axisAligned: true` 用一般顏色，`false` 用紅色；轉角處畫一個小圓點標記 `rightAngle`。
- 掛路由：`src/router/index.ts` 在既有 `/dev` children 裡新增 `pipeline-polyline`，並在 `DevLayout.vue` 的 `devPages` 補一筆條目（跟 `grid-viewport` 那筆同樣寫法）。

## 4. 驗證計畫

單元測試（`pipelinePolyline.test.ts`）涵蓋 DoD 列出的情境：

- 純直線（水平或垂直），0 個轉角，`valid: true`
- 單一直角轉彎，1 個轉角且 `rightAngle: true`
- 多次轉折（3 段以上），轉角數與位置正確
- 含一段斜線：`valid: false`，且能從 `segments[i].axisAligned === false` 指出是第幾段
- 少於 2 個點（0 或 1 點）：`segments`/`corners` 皆空，`valid: true`
- 相鄰重複點（零長度段）：不視為非法，`axisAligned: true`
- **交叉驗證**：任取幾組 waypoints，`result.valid === isAxisAlignedPath(waypoints)` 逐一比對，鎖住兩者語意一致

`pnpm type-check`／`lint-check`／`format-check`／`test` 全綠；另外人工檢查 `/dev/pipeline-polyline` 能開、紅色段看得出來；`grep` 確認新檔未 import 任何 `@/store/*`；`git diff --stat` 確認不含 `src/editor/`。

## 5. 明確不做（本工單邊界）

- 不碰 `GridCanvas.vue`／`LayoutView.vue`／`MainLayout.vue`／`ToolbarPanel.vue`（toby 與其他人的門檻週檔案）
- 不改 `pipelineGeometry.ts` 既有簽章
- 不做自動路徑規劃／自動拉線（BFS 等，非目標）
- 不把折線接進 `GridCanvas` 真的渲染出來（C3 渲染那一刀，10/11，owner 未定）
- 不把平移縮放接進主畫布（同檔衝突，未派）
