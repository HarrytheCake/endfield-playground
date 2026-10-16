# W1011-M2｜MBD｜管線未連通警示 icon

| meta | value |
|------|-------|
| 週次 | 2026-10-11 → 2026-10-18 |
| 等級 | **確定**（10/11 會議派工） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261011](../../WEEK_20261011.md) v1.1 |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 畫布上的警示 icon｜新檔 `src/components/WarningIcon/Index.vue`＋`Index.stories.ts`｜`GridCanvas.vue`、store、`src/components/Button/*` 以外的既有元件｜paper（稿）、dernoson（合入） |

---

## 0. 白話目標

**只做一件：** 依 paper 的稿，做「管線沒接好」時顯示在畫布上的警示 icon。

---

## 1. 一步一步

1. 向 paper 拿未連通警示的稿（Figma 連結）。
2. 新建 `src/components/WarningIcon/Index.vue`，用 SVG 畫出 icon；根元素用 `<g>`，這樣能直接放進畫布。
3. props 只要：`size`（大小）。顏色先照稿寫死。
4. 新建 `Index.stories.ts`，Storybook 看得到 icon。
5. 開 PR。

---

## 2. 不要做

- import store
- 改 `GridCanvas`（toby 鎖）——掛上畫布是別人的事
- 動頂欄按鈕（`Button/*` 本週不催，有空另開 PR 即可）

---

## 3. DoD

- [ ] Storybook 看得到 icon
- [ ] 有 PR
