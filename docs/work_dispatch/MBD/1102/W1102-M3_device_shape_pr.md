# W1102-M3｜MBD｜DeviceShape 開 PR

| meta | value |
|------|-------|
| 週次 | 2026-11-02 → 2026-11-08 |
| 等級 | **確定**（上週有碼未交；自報 **3–5h**） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261102](../../WEEK_20261102.md)、上週 [W1026-M3](../1026/W1026-M3_device_shape.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 畫布設備外觀｜`src/editor/layout/shapes/DeviceShape.vue`＋`.stories.ts`｜`GridCanvas`／`LayoutView`、右側產耗、store｜paper（稿）、dernoson（合入） |

---

## 0. 白話目標

`dev/MBD` 上已經有設備外形。本週只做一件：**開 PR。**

gh 目前沒有這支分支的開放 PR。有碼無 PR，不算交。

---

## 1. 一步一步

1. 確認 `DeviceShape.vue` 根節點是 `<g>`，Storybook 看得到。
2. 以 `dev/MBD` 現況開 PR，對 `master`。分支上已有的陰影調整可以留在同一張 PR，不必拆。
3. PR 說明寫：這週不掛上 `GridCanvas`。

---

## 2. 不要做

- 改 `GridCanvas`／`LayoutView`
- 改右側產耗（harry）
- import store、讀 `src/data`
- 加新設備種類

---

## 3. DoD

- [ ] gh 上看得到 PR
- [ ] Storybook 看得到這顆元件
- [ ] diff 沒有 `GridCanvas`／`LayoutView`
