# W0921-H1｜harry｜管線折線的幾何純函式（C3 提前量）

| meta | value |
|------|-------|
| 週次 | 2026-09-21 → 2026-09-27 |
| 等級 | **確定・完整一塊**（**不綁時間點**；週日會缺席不視為未交付） |
| 擋門檻 | 否（[R-C3](../../../roadmap/detail/C3_pipeline_polyline_render.md) 原排 10/11） |
| 前置 | 無。你的 viewport [#47](https://github.com/dernoson/endfield-playground/pull/47) 已在 master |
| 產能參考 | 自報 3–5h。本項是純幾何＋測試＋一個 dev 頁，形狀與你上次的 `useGridViewport` 相同 |
| 上游 | [WEEK_20260921](../../WEEK_20260921.md)、[ROADMAP detail/C3](../../../roadmap/detail/C3_pipeline_polyline_render.md) |

---

## 0. 白話目標

十月要做的事是：**管線畫成正交折線（只走直角），違規的線段給紅色。**

畫面那一層還沒排人，但底下的幾何可以先算出來——而且那正好是你上次做得最順的東西（`useGridViewport` 的座標換算，13 個測試，一次過）。

**一句話：給一串 waypoints，回傳「要畫哪幾段、每段是不是合法的」。**

---

## 1. 為什麼派給你、以及為什麼是這一塊

你上週 git 是 0，但**那不是零產出**——你的投入落在 9/12–9/14，#47 在 9/14 合入。這是規則 24 要防的誤判，不會記成未交。

本週給你一塊**完全獨立**的東西，理由很實際：新畫布上所有互動位置（容器、`GridCanvas`、工具列）本週都在 toby 的落子鏈上，那是 9/27 門檻線。兩個人進同一個檔會有人被退回，而門檻週不該有人被退回。

所以這塊刻意選在 `src/utils/layout/` ＋ `src/app/dev/`：**跟任何人都不重疊，你可以一口氣做完。**

---

## 2. 一句話驗收

**`/dev/pipeline-polyline` 上餵一組 waypoints，看得到折線與轉角，非正交的那一段是紅的。**

---

## 3. 現況（先讀這三個檔）

| 檔 | 現在有什麼 |
|----|-----------|
| `src/utils/layout/pipelineGeometry.ts` | `isAxisAlignedPath(waypoints): boolean` —— **整條路徑一個布林**，不知道是哪一段壞 |
| `src/editor/layout/GridCanvas.vue` | 已經會畫管線，但是直接 `M/L` 連點，沒有轉角概念、沒有違規標記 |
| `src/types/layout.ts` | `Pipeline`（`id`／`media`／`waypoints`） |

**缺口就是「逐段」：** 現在只能說「這條路徑有問題」，說不出「第 3 段是斜的」。渲染要紅色標記就得知道是哪一段。

---

## 4. 交哪個檔

| 動作 | 檔案 |
|------|------|
| 新建 | `src/utils/layout/pipelinePolyline.ts` |
| 新建 | `src/__tests__/utils/layout/pipelinePolyline.test.ts` |
| 新建 | `src/app/dev/PipelinePolylineDemo.vue` ＋ 掛上 `/dev` 路由 |
| 唯讀參考 | `src/utils/layout/pipelineGeometry.ts`（**沿用 `isAxisAlignedPath`，不要改它**） |

### 建議的形狀（可調整，先講再改）

```ts
/** 折線的單一線段 */
export interface PolylineSegment {
    from: Position;
    to: Position;
    /** 這一段是否軸對齊（水平或垂直）；false ＝ 該段畫紅色 */
    axisAligned: boolean;
    /** 'horizontal' | 'vertical' | 'diagonal' */
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

**`valid` 必須與既有的 `isAxisAlignedPath` 對同一組輸入給出同樣答案。** 測試裡直接比對兩者，不要讓它們慢慢分岔——這是專案這兩週反覆踩到的那類錯誤。

---

## 5. 邊界

| 允許 | 不要 |
|------|------|
| 新建上面三個檔 | 改 `src/editor/layout/GridCanvas.vue`（**toby 的鎖，門檻線上**） |
| 讀 `pipelineGeometry.ts` | 改 `pipelineGeometry.ts` 的既有簽章 |
| 在 dev 頁用 `useGridViewport`（你自己的） | 改 `LayoutView.vue`、`MainLayout.vue`、`ToolbarPanel.vue` |
| 自己造 mock waypoints | 讀任何 store（純函式不碰 store，dev 頁也不要） |
| — | 做自動路徑規劃／自動拉線（[§1.3 非目標](../../../roadmap/ROADMAP_OUTLINE.md)） |
| — | 落子、選取、旋轉（本週 toby 與其他人的範圍） |

---

## 6. 本週不做

| 項 | 什麼時候 |
|----|----------|
| 把折線接進 `GridCanvas` 真的畫出來 | C3 渲染那一刀，10/11，owner 未定 |
| 平移縮放接進主畫布 | 未派；你的 viewport 在 master 但本週不接（同檔衝突） |
| 折線的自動產生（BFS 路徑） | 非目標 |

---

## 7. DoD

- [ ] `buildPipelinePolyline` 存在，回傳 segments／corners／valid
- [ ] 測試涵蓋：直線（0 轉角）／單一直角／多次轉折／含斜線段（`valid: false` 且指得出是第幾段）／少於 2 點／重複點
- [ ] 有一條測試直接比對 `valid === isAxisAlignedPath(waypoints)`
- [ ] `/dev/pipeline-polyline` 可開，紅色標記看得出來
- [ ] 全域搜尋確認未 import 任何 store
- [ ] `git diff --stat` 不含 `src/editor/`
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 綠

---

## 8. 交檔

分支 `dev/harry0921`，標題帶 `W0921-H1`。**推到分支就算交付，不綁日期。**

**一個提醒：** 上次 PR 夾帶了 TableCfg／icons 的資料快取（落在 `docs/harry/dev/`），主編選擇不拆就合了。這次請把**與本工單無關的資料快取另開分支**——不是因為上次有問題，是因為第三次出現就會變成慣例。

---

## 9. 卡住找誰

| 狀況 | 找誰 |
|------|------|
| `valid` 與 `isAxisAlignedPath` 對不起來 | aaaaa |
| dev 路由怎麼掛 | 看你自己的 `GridViewportDemo.vue`，作法一樣 |
| 想順手把折線接進 `GridCanvas` | **先回報**。那個檔這週是門檻線 |

---

## 10. 未交頂替

C3 回到原排程 10/11，零影響。本項是提前量，**不擋任何門檻**，也不會出現在 9/27 的驗收表上。
