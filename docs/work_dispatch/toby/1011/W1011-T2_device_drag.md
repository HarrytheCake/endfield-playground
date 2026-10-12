# W1011-T2｜toby｜設備拖曳接進正式畫面

| meta | value |
|------|-------|
| 週次 | 2026-10-11 → 2026-10-18 |
| 等級 | **確定**（10/11 會議派工） |
| 擋門檻 | 否（C4 前置；C1 可能順延給你，見 §4） |
| 上游 | [WEEK_20261011](../../WEEK_20261011.md) v1.1 |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 正式頁畫布｜`src/editor/layout/LayoutView.vue`（必要時 `GridCanvas.vue` 加 emit）｜`layoutStore.ts`、`editorStore`、MainLayout｜aaaaa（`canMoveDevice`）、harry（`select-device` 介面）、dernoson（合入） |

---

## 0. 白話目標

正式畫面上已放好的設備，**按住可以拖到別格放開**。底層移動 action 已有（`layoutStore.moveDevice`，內部會跑 `canMoveDevice`），你只要把滑鼠事件接上去。

現況：`LayoutView` 的 pointer 事件只做**平移**（`drag` → `panBy`）。你要在按下時判斷「按在設備上還是空白」，分流成拖設備或平移。

---

## 1. 必做

1. **按下判斷：** 用游標格座標比對設備佔地（`getDeviceOccupiedCells` 已有），命中 → 進拖設備模式；沒命中 → 維持平移。
2. **拖曳中：** 預覽位置放 **local ref**（不寫 store）；GridCanvas 用 prop 畫出跟隨中的設備（可半透明）。
3. **放開：** 呼叫 `layoutStore.moveDevice(id, position)`；結果不 ok → 設備回原位，不彈窗。`moveDevice` 本身會推一筆歷史，所以**只在放開時呼叫一次**，拖曳途中不要呼叫。
4. **點選（沒拖動）：** emit `select-device(id)`；點空白 emit `select-device(null)`。harry 的 H2 靠這個顯示左側面板。

---

## 2. 不要做

- 改 `layoutStore`／`placementCheck`（aaaaa 鎖；只呼叫）
- Ctrl+Z 接鍵（正式頁目前沒有 Undo 入口，另計）、旋轉、Delete、多選
- 工具列拖曳落子（不是本單）
- 在 `GridCanvas` import Pinia
- 本週改 GridCanvas 樣式——G／S／avery 交 `shapes/` 子元件，**你合入 T2 後**有空再替換掛上（沒空就下週）

---

## 3. DoD

- [ ] `pnpm dev`：拖設備到空位成功；拖到重疊位置回原位
- [ ] 空白處拖曳仍是平移
- [ ] 點設備 emit `select-device`
- [ ] `GridCanvas` 無 Pinia；拖曳中不寫 store
- [ ] 開 PR

---

## 4. 預告

會議未派 C1（兩 port 拉管線）。C1 也是在 `LayoutView` 處理指標事件，和拖曳共用同一套「按下判斷」，主編可能在 10/18 週請你接手。本週拖曳的按下判斷請寫成之後能再加一個「命中埠」分支的形狀（`hitTestPortAt` 已在 master）。
