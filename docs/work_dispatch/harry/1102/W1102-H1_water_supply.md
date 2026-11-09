# W1102-H1｜harry｜水源供給的設備邏輯

| meta | value |
|------|-------|
| 週次 | 2026-11-02 → 2026-11-08 |
| 等級 | **確定**（11/01 會議；自報 **3–5h**） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261102](../../WEEK_20261102.md) v1.1、已合 [#81](https://github.com/dernoson/endfield-playground/pull/81) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 選了清水，設備改走管道｜`layoutStore.setDevicePrimaryOutput`、必要時 `sourceMaterialOptions.ts` 與其測試｜右側產耗、`DeviceShape`、`GridCanvas`、左欄視覺｜dernoson（合入） |

---

## 0. 白話目標

會議要的是水源供給相關設備的**邏輯**。repo 裡沒有獨立的「水泵」。現有的供水設備是「基礎材料輸出點」：只有液氣管道（`fluid_pipe`）才出得了清水。

[#81](https://github.com/dernoson/endfield-playground/pull/81) 的下拉只寫 `primaryOutput`，不改 `machineMode`。沒設型態時預設是固體輸送帶，清水走不出去。

---

## 1. 一步一步

1. 仍只呼叫現有的 `setDevicePrimaryOutput(uid, itemId, rate?)`。**不要新開 action，不要改參數。**
2. 在這個函式裡一併寫 `machineMode`：
   - 液體或氣體（含清水）→ `fluid_pipe`
   - 固體（如源礦）→ `solid_belt`
   - 清除產出 → 拿掉 `machineMode`，回到預設固體
3. 補測試：清水得到 `fluid_pipe`；源礦得到 `solid_belt`。
4. 開 PR。

左欄現在的下拉可以繼續用。長相交給 paper，你不要改版面。

---

## 2. 不要做

- 新增水泵或別的機種
- 改 `SourceOutputPanel.vue` 的版面
- 做右側產耗（toby）
- 改 `GridCanvas`／`DeviceShape`
- 把 `dev/cake_toolbar`、`dev/cake_machinecard`、`dev/cake_prodstats` 併進來
- 重寫 flow 引擎

---

## 3. DoD

- [ ] 正式頁把基礎材料輸出點的產出設成清水後，該設備 `machineMode` 為 `fluid_pipe`
- [ ] 設成源礦後為 `solid_belt`
- [ ] `setDevicePrimaryOutput` 的參數沒有變
- [ ] gh 上看得到 PR

未交：清水仍走預設固體埠。
