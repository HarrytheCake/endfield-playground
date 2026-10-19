# W1018-T1｜toby｜C1：埠命中＋draft 連線（M3 主戲）

| meta | value |
|------|-------|
| 週次 | 2026-10-18 → 2026-10-25 |
| 等級 | **確定・門檻必要** |
| 擋門檻 | **是（R-C1）** |
| 上游 | [WEEK_20261018](../../WEEK_20261018.md) v1.0、[C1](../../../roadmap/detail/C1_port_hit_and_draft.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 正式頁畫布拉管線｜`LayoutView.vue`（必要時 `GridCanvas.vue`）｜`layoutStore` 簽名、`editorStore`、`MainLayout`、他人 `shapes/*`｜aaaaa（`hitTestPortAt`／`canConnect`）、dernoson（合入） |

---

## 0. 白話目標

正式畫面上：**按住一個埠拖到另一個埠放開，能留下一條管線**。命中函式與連線規則都已在 master，你接指標事件與 draft 預覽。

上週拖曳（#67）已合——按下判斷請在「設備體／空白」之外，再加「命中埠 → 拉線」分支。

**趕不上：** 啟用備案——只保證「相鄰兩台直線連線」可演示（主編 B-2）；彎折與樣式可延。

---

## 1. 必做

1. **按下：** `hitTestPortAt`（格點座標）命中埠 → 進入 draft；命中設備體 → 維持拖設備；否則平移。
2. **拖曳中：** draft 折線／直線放 **local ref**（不寫 store、不進歷史）；目標埠可 highlight。
3. **放開：**  
   - 命中合法埠 → `canConnect` → ok 則 `addPipeline`（或專案既有高階連線 action；以 master 為準）  
   - 非法 → draft 消失；可給紅色提示，**不彈窗**  
   - 未命中 → draft 消失
4. **開 PR。**

---

## 2. 加分（有餘力再做；不擋 M3）

- `GridCanvas` 畫已確認管線時改走 `buildPipelinePolyline`
- 掛上已合的 `PipelineShape`（傳送帶／水管）
- 若 MBD 交了 `DeviceShape`，替換暫代方塊（**你掛，他不改 GridCanvas**）

---

## 3. 不要做

- 改 `layoutStore`／`canConnect`／`hitTestPortAt` 本體（只呼叫）
- draft 寫進 store 或歷史
- 旋轉、Delete、多選、Ctrl+Z 入口
- `GridCanvas` import Pinia

---

## 4. DoD

- [ ] 兩台設備 port→port 拉線成功（`pnpm dev`）
- [ ] 非法／未命中不寫入
- [ ] 與拖曳／平移不互搶（按埠＝拉線）
- [ ] draft 僅 local ref
- [ ] GridCanvas 無 Pinia
- [ ] 開 PR
