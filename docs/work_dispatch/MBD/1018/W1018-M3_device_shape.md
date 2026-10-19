# W1018-M3｜MBD｜畫布設備樣式 DeviceShape

| meta | value |
|------|-------|
| 週次 | 2026-10-18 → 2026-10-25 |
| 等級 | **加分**（補上週 G2 欠帳；不擋 M3） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261018](../../WEEK_20261018.md) v1.0 |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 畫布上的設備外觀｜新檔 `src/editor/layout/shapes/DeviceShape.vue`＋`.stories.ts`｜`GridCanvas.vue`、`LayoutView.vue`、任何 store、`src/data`、他人 shapes｜paper（稿）、toby（日後掛上）、dernoson（合入） |

---

## 0. 白話目標

依 paper 的設備稿，做**畫布上設備長什麼樣**的 SVG 子元件。只交元件＋Storybook；**不要改 GridCanvas**（toby 本週鎖著做 C1）。

上週 goodmorning 的 DeviceShape 未交；本週改由你做（獨立新檔）。

**神經內科／時數不夠：** 交一個靜態方塊＋名稱文字也行；拖曳中淺藍狀態可延。

---

## 1. 一步一步

1. 向 paper 要設備稿連結（沒有就先用簡單矩形＋機名）。
2. 新建 `DeviceShape.vue`，根元素 `<g>`。
3. props 建議：`width`／`height`（px）、`label`（可選）、`dragging`（可選；true 時淺藍）。
4. 新建 `.stories.ts`。
5. 開 PR。

---

## 2. 不要做

- import store、讀 `src/data`
- 改 `GridCanvas`／`LayoutView`
- 改 `WarningIcon` 或頂欄 `Button/*`（本週不催）
- 與人共檔

---

## 3. DoD

- [ ] Storybook 看得到設備樣式
- [ ] 根 `<g>`；無 Pinia
- [ ] 有 PR
