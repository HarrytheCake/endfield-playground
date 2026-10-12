# W1011-G2｜goodmorning｜#48 解 conflict 合入＋畫布設備樣式

| meta | value |
|------|-------|
| 週次 | 2026-10-11 → 2026-10-18 |
| 等級 | **確定**（10/11 會議派工） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261011](../../WEEK_20261011.md) v1.2（A-2 已裁：shapes 子元件） |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 下方工具列＋畫布設備｜#48 既有檔；新檔 `src/editor/layout/shapes/DeviceShape.vue`＋`.stories.ts`｜`GridCanvas.vue`、`LayoutView.vue`、MainLayout｜paper（設備稿）、toby（之後掛上）、dernoson（合入） |

---

## 0. 白話目標

兩件，**先①後②**：

| # | 件 | 會議原話 |
|---|----|----------|
| ① | [#48](https://github.com/dernoson/endfield-playground/pull/48) 解 conflict | 「解決完 conflict 即可合入」 |
| ② | paper 設計的**設備在畫布上的樣式** | 「本週完成白紙設計的設備於畫布上的樣式」 |

---

## 1. ① #48

- rebase 到最新 master，解 conflict；`listToolbarMachines` 保留；**`arm` 不准刪**
- 解完在 PR 留言「已 rebase」，dernoson 即合
- 卡在 conflict 超過 1h → Discord 貼錯誤畫面，不要自己硬改別人檔

---

## 2. ② 設備樣式子元件

現在畫布上的設備是 `GridCanvas` 裡直接畫的藍色方塊。本週**不改 GridCanvas**，而是做一個可以塞進去的子元件：

```text
src/editor/layout/shapes/DeviceShape.vue
  根元素 <g>；只吃 props，例如：
  width / height（格數或 px，與 toby 對齊一種）、name、狀態（一般／出界／**拖曳中＝淺藍色**）
```

- 依 paper 稿做；**拖曳中狀態＝淺藍色**（白紙已有稿；主編點名此 UX）。其他狀態稿上沒有的先用暫代色，PR 寫明
- 附 `DeviceShape.stories.ts`，至少三種狀態
- **不 import store、不讀 `src/data`**
- 掛進 GridCanvas 由 toby 在拖曳合入後做

---

## 3. 不要做

- 改 `GridCanvas.vue`／`LayoutView.vue`（toby 鎖）
- 管線、供電樁樣式（shirone／avery）
- #48 夾帶設備樣式——**分兩則 PR**

---

## 4. DoD

- [ ] #48 進 master
- [ ] `DeviceShape` 新 PR；Storybook 可看三種狀態
- [ ] 無 Pinia；未改 GridCanvas
