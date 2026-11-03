# W1102-G1｜goodmorning｜DeviceShape 的 Storybook，並請 paper 審

| meta | value |
|------|-------|
| 週次 | 2026-11-02 → 2026-11-08 |
| 等級 | **確定**（11/01 會議；自報 **3–5h**） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261102](../../WEEK_20261102.md) v1.2、[W1102-M3](../../MBD/1102/W1102-M3_device_shape.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 故事裡看得到設備｜`DeviceShape.stories.ts`｜`DeviceShape.vue`（MBD）、`GridCanvas`、右側產耗｜MBD（元件）、paper（審）、dernoson（合入） |

---

## 0. 白話目標

設備樣式本週要做完，並提給 paper 審。MBD 這週一起做**元件本體**。你做 Storybook，並把**同一支** `dev/MBD` 開成一張 PR。

不要另開一支分支重寫他的 vue。

---

## 1. 一步一步

1. 等他推上 `DeviceShape.vue`，拉下 `dev/MBD`。
2. 只加或改 `DeviceShape.stories.ts`，Storybook 看得到。
3. 缺 prop 時問他改 vue，你不要自己改那個檔。
4. **開一張 PR**，@ paper 看樣式。本週不掛進 `GridCanvas`。

---

## 2. 不要做

- 改 `DeviceShape.vue`
- 改 `GridCanvas`／`LayoutView`
- 改右側產耗、左欄、`setDevicePrimaryOutput`
- import store、讀 `src/data`

---

## 3. DoD

- [ ] gh 上只有一張 Device PR，來自 `dev/MBD`
- [ ] Storybook 看得到設備
- [ ] PR 裡請了 paper
- [ ] 你的 diff 沒有 `DeviceShape.vue`、沒有 `GridCanvas`

未交：畫布仍是暫代方塊。
