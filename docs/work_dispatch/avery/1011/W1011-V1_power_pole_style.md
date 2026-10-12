# W1011-V1｜avery｜供電樁畫布樣式

| meta | value |
|------|-------|
| 週次 | 2026-10-11 → 2026-10-18 |
| 等級 | **確定**（10/11 會議派工）；段考週，照最小可交做 |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261011](../../WEEK_20261011.md) v1.1 |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 畫布上的供電樁｜新檔 `src/editor/layout/shapes/PowerPoleShape.vue`＋`.stories.ts`｜`GridCanvas.vue`、`LayoutView.vue`、任何 store、`src/data`｜paper（稿）、goodmorning（`DeviceShape` 寫法可參考）、dernoson（合入） |

---

## 0. 白話目標

依 paper 的稿，做**供電樁在畫布上長什麼樣**。只畫外觀，不做供電邏輯。

注意：專案的設備資料（`src/data/machines.ts`）**目前沒有供電樁**，所以這個元件不會馬上出現在正式畫面上，先在 Storybook 看得到就算完成。

**最小可交：** 一個靜態樣式＋Storybook。供電範圍圈可延。

---

## 1. 一步一步

1. 向 paper 拿供電樁稿。
2. 新建 `src/editor/layout/shapes/PowerPoleShape.vue`，根元素 `<g>`。
3. props 只要：`size`（px）；有餘力再加 `showRange`（是否畫供電範圍）。
4. 新建 `PowerPoleShape.stories.ts`。
5. 開 PR。

---

## 2. 不要做

- import store、讀 `src/data`
- 改 `GridCanvas`（toby 鎖）
- 新增供電樁資料或供電計算

---

## 3. DoD

- [ ] Storybook 看得到供電樁
- [ ] 無 Pinia
- [ ] 有 PR
