# W1011-S2｜shirone｜#62 合入＋管線（傳送帶／水管）畫布樣式

| meta | value |
|------|-------|
| 週次 | 2026-10-11 → 2026-10-18 |
| 等級 | **確定**（10/11 會議派工）；**本月學 Python，照最小可交做** |
| 擋門檻 | **C3 視覺**（M3 要看到管線） |
| 上游 | [WEEK_20261011](../../WEEK_20261011.md) v1.1 |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 右側面板＋畫布管線｜#62 既有檔；新檔 `src/editor/layout/shapes/PipelineShape.vue`＋`.stories.ts`｜`GridCanvas.vue`、`LayoutView.vue`、MainLayout｜paper（approve／管線稿）、toby（之後掛上）、dernoson（合入） |

---

## 0. 白話目標

| # | 件 | 會議原話 | 你要做的 |
|---|----|----------|----------|
| ① | [#62](https://github.com/dernoson/endfield-playground/pull/62) | 「等待白紙 approve 即可合入」 | **等**；paper 有意見才改 |
| ② | 管線畫布樣式 | 「本週完成白紙設計的管線（傳送帶／水管）於畫布上的樣式」 | 做一個子元件 |

**最小可交：** 傳送帶一種樣式＋Storybook。水管做不完可延下週，PR 寫明即可。

---

## 1. ② 管線樣式子元件

現在畫布上的管線是 `GridCanvas` 裡的綠線。本週**不改 GridCanvas**，做一個能塞進去的子元件：

```text
src/editor/layout/shapes/PipelineShape.vue
  根元素 <g>；只吃 props：
  points（折線點，畫布座標）、kind（'belt' | 'pipe'）、狀態（一般／未連通／選取中，後兩者可先暫代）
```

- 折線點由 `buildPipelinePolyline`（已在 master）算好傳入；你**只負責畫**，不要自己算路徑
- 附 `PipelineShape.stories.ts`：直線、一個轉角、兩個轉角
- **不 import store、不讀 `src/data`**
- 掛進 GridCanvas 由 toby 做

---

## 2. 不要做

- 改 `GridCanvas.vue`／`LayoutView.vue`（toby 鎖）
- 改 `MachineCard`（harry 本週會 import 它；**只准改 props 以外的樣式**，要加／改 props 先在 Discord 說）
- 自己寫第二套折線算法
- 卡住超過 1h 不問——Discord 直接問 aaaaa（折線）或 paper（樣式）

---

## 3. DoD

- [ ] #62 進 master（paper approve 後）
- [ ] `PipelineShape` 新 PR；傳送帶可看（水管可延）
- [ ] 無 Pinia；未改 GridCanvas
