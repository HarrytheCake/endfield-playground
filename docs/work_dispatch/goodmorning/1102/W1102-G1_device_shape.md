# W1102-G1｜goodmorning｜接手設備在畫布上的樣式

| meta | value |
|------|-------|
| 週次 | 2026-11-02 → 2026-11-08 |
| 等級 | **確定**（11/01 會議；自報 **3–5h**） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261102](../../WEEK_20261102.md) v1.1、上週 [W1026-M3](../../MBD/1026/W1026-M3_device_shape.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 畫布上的設備外形｜`src/editor/layout/shapes/DeviceShape.vue`＋`.stories.ts`｜`GridCanvas`／右側產耗／store｜起點問 MBD（`dev/MBD`）、樣式問 paper、合入問 dernoson |

---

## 0. 白話目標

會議要你接手 MBD 做了一半的設備樣式，**本週做完，並提給 paper 審。**

碼在 `dev/MBD`，還沒有 PR。不要兩人一起改同一支分支：從那支開你自己的分支。

---

## 1. 一步一步

1. 以 `origin/dev/MBD` 現況為起點。根節點維持 `<g>`。
2. Storybook 看得到這顆設備。
3. **開 PR。** 在 PR 裡 @ paper，請他看樣式。
4. 本週不把元件掛進 `GridCanvas`。紙審的是樣式本身。

---

## 2. 不要做

- 改 `GridCanvas`／`LayoutView`
- 改右側產耗、左欄、`setDevicePrimaryOutput`
- import store、讀 `src/data`
- 加新設備種類

---

## 3. DoD

- [ ] gh 上看得到 PR
- [ ] Storybook 看得到設備
- [ ] PR 裡請了 paper 審樣式
- [ ] diff 沒有 `GridCanvas`

未交：畫布仍是暫代方塊。
