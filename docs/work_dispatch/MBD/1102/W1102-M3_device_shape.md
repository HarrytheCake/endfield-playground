# W1102-M3｜MBD｜DeviceShape 本體（與 goodmorning 分檔）

| meta | value |
|------|-------|
| 週次 | 2026-11-02 → 2026-11-08 |
| 等級 | **確定**（你這週仍做 Device；自報 **3–5h**） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261102](../../WEEK_20261102.md) v1.2 |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 設備外形本體｜`src/editor/layout/shapes/DeviceShape.vue`｜`.stories.ts`（goodmorning）、`GridCanvas`、右側產耗｜goodmorning（故事）、paper（審樣式）、dernoson（合入） |

---

## 0. 白話目標

會議原要 goodmorning 收尾。你這週還有心力，所以 **Device 一起做，但分檔。**

你繼續 `dev/MBD` 上的 `DeviceShape.vue`。goodmorning 只加 Storybook，並負責開那張 PR、請 paper 看。

---

## 1. 一步一步

1. 元件根節點維持 `<g>`。把你已有的外形收到可看。
2. 推上 `dev/MBD`，跟 goodmorning 說一聲。
3. 不要自己另開一張 DeviceShape PR。故事與請 paper 審由他做。

他若缺一個 prop 才畫得出故事，你加在 vue 上，他不改你的檔。

---

## 2. 不要做

- 改 `DeviceShape.stories.ts`
- 改 `GridCanvas`／`LayoutView`
- 改右側產耗、`setDevicePrimaryOutput`
- import store、讀 `src/data`

---

## 3. DoD

- [ ] `DeviceShape.vue` 在 `dev/MBD` 上，根節點是 `<g>`
- [ ] 沒有第二張 Device 的 PR
