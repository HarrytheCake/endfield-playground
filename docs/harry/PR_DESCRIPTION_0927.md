# PR Description 草稿：管線折線逐段幾何（W0921-H1）

對應 commit `fde16d0`。以下內容可直接複製進 GitHub PR 描述欄。

---

## Summary

- 新增 `buildPipelinePolyline`：把既有 `isAxisAlignedPath` 的「整條路徑一個布林」拆成逐段結果——每段方向分類、是否軸對齊、轉角位置與是否為直角
- 新增 `/dev/pipeline-polyline` 展示頁：預設範例＋左鍵點格新增 waypoint，違規段（斜線）即時標紅
- 純幾何＋純函式，不 import 任何 Pinia store，不動 `GridCanvas.vue`（本週 toby 的門檻檔）

## 1. 管線折線逐段幾何（`pipelinePolyline.ts`）

**新增檔案：** `src/utils/layout/pipelinePolyline.ts`、`src/__tests__/utils/layout/pipelinePolyline.test.ts`

- `buildPipelinePolyline(waypoints)` 回傳 `{ segments, corners, valid }`：
  - `segments`：每段的 `from`/`to`/`orientation`（`horizontal`/`vertical`/`diagonal`）/`axisAligned`
  - `corners`：相鄰兩段方向不同處的轉角點，`rightAngle` 標示是否為一橫一豎的 90 度轉彎（斜線參與的方向改變仍記一筆，但 `rightAngle: false`）
  - `valid`：任一段非軸對齊即為 `false`
- 判斷式與既有 `isAxisAlignedPath` 的 `prev.x !== curr.x && prev.y !== curr.y` 是同一條件的否命題，兩者不會分岔——測試裡對 9 組輸入直接比對 `buildPipelinePolyline(w).valid === isAxisAlignedPath(w)`
- 零長度段（相鄰重複點）視為 `horizontal`／合法，沿用 `isAxisAlignedPath` 對這種退化情況的既有語意
- 完全**唯讀**參照 `pipelineGeometry.ts`，未改動其既有簽章

## 2. `/dev/pipeline-polyline` 展示頁

**新增檔案：** `src/app/dev/PipelinePolylineDemo.vue`；**變更檔案：** `src/router/index.ts`、`src/app/dev/DevLayout.vue`

- 四組預設範例（直線／單一直角／多次轉折／含違規斜線）按鈕即可切換；也可左鍵點格自行加點、回退一點、清空
- 中鍵拖曳平移、滾輪縮放，沿用自己上週的 `useGridViewport`（同一種寫法，不重造輪子）
- 折線段依 `axisAligned` 上色（藍＝合法／紅＝違規），轉角依 `rightAngle` 畫實心／空心圓
- waypoints 全部畫面自己 mock，**不讀任何 store**
- 掛在既有 `/dev` children 底下（`DevLayout` 側欄可見），寫法與 `grid-viewport` 一致

## 明確不在本次範圍內

- 把折線接進 `GridCanvas.vue` 真的渲染出來（C3 渲染那一刀，10/11，owner 未定）
- 折線的自動產生／自動拉線（BFS 等路徑規劃，非目標）
- 把平移縮放接進主畫布（`useGridViewport` 已在 master，但本週不接，同檔衝突）

## 驗證

```
pnpm type-check   # 通過
pnpm lint-check   # 通過
pnpm format-check # 通過
pnpm test         # 44 個測試檔、847 個測試全通過（新增 20 項）
```

另外確認：全域搜尋未 import 任何 `@/store/*`；`git diff --stat` 不含 `src/editor/`；`/dev/pipeline-polyline` 手動點按各預設與點格新增皆正常，違規段紅色標記清楚可見。

## 對應文件

| 功能 | 計畫文件 |
|------|----------|
| 管線折線逐段幾何 | [docs/harry/PLAN_pipelinePolyline.md](PLAN_pipelinePolyline.md) |
| 原始工單 | [docs/work_dispatch/harry/0921/W0921-H1_pipeline_polyline.md](../work_dispatch/harry/0921/W0921-H1_pipeline_polyline.md) |

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
