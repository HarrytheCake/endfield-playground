# W1102-T0｜toby｜折線核對（不開新功能）

| meta | value |
|------|-------|
| 週次 | 2026-11-02 → 2026-11-08 |
| 等級 | **加分**（自報 **3–5h**） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261102](../../WEEK_20261102.md)、[C3](../../../roadmap/detail/C3_pipeline_polyline_render.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 兩台設備之間的管線｜`src/utils/layout/connectionWaypoints.ts`（及其測試）；必要時 `GridCanvas.vue`｜`LayoutView` 互動、右側產耗、`DeviceShape`、store 簽名｜dernoson |

---

## 0. 白話目標

#78 已合。本週**不派新功能**。

只核對一件事：兩台錯開的設備，中間是直角折線，不是斜線。兩台對齊時是直線。

已經是這樣，就停。附兩張截圖即可，不必為了交差改碼。

---

## 1. 一步一步

1. 正式頁擺兩台錯開的設備，看管線。再擺兩台對齊的，看是不是直線。
2. 已是直角／直線：Discord 貼截圖，寫「不用改」。
3. 仍是斜線：只改 `connectionWaypoints` 或 `GridCanvas` 怎麼用它，補測試，開 PR。

---

## 2. 不要做

- 旋轉、Delete
- 改 `LayoutView` 的拖曳／平移
- 改右側產耗、`DeviceShape`
- 改 store 簽名
- 另開一塊新功能

---

## 3. DoD

- [ ] 看得到「錯開＝直角、對齊＝直線」（截圖或 PR）
- [ ] 沒有旋轉、沒有 Delete

未交：折線維持現況，不擋 H1。
