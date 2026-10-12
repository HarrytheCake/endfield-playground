# W1011-H2｜harry｜刪舊左側面板，接上 `MachineCard`

| meta | value |
|------|-------|
| 週次 | 2026-10-11 → 2026-10-18 |
| 等級 | **確定**（10/11 會議派工） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261011](../../WEEK_20261011.md) v1.1 |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 正式頁左側｜`src/app/layouts/MainLayout.vue`（＋必要時一個 L2 轉接檔）｜`src/app/MachineCard/*` 內部、`LayoutView`／`GridCanvas`、`StatsPanel`、`ToolbarPanel`｜shirone（`MachineCard` props）、toby（`select-device`）、dernoson（合入） |

---

## 0. 白話目標

會議決議：**先刪舊左側面板，接上 shirone 做的左側物件資訊面板。** 右側面板（shirone #62）與下方面板（goodmorning #48）**等它們合入後再接**，本週不碰。

| 舊 | 新 |
|----|----|
| `ProjectSidebar`（MainLayout 第 44 行） | `MachineCard`（`src/app/MachineCard/Index.vue`，已在 master，尚未掛上正式頁） |

MainLayout 已有空的 `area-device-panel` 槽位（`devicePanelVisible`），可直接用。

---

## 1. 必做

1. **卸載 `ProjectSidebar`：** 從 MainLayout 拿掉 import 與使用處；`sidebarOpen` 等連帶狀態一併清掉。檔案本身是否刪除寫在 PR 說明，由 dernoson 審查時決定。
2. **掛上 `MachineCard`：** 放在左側（`area-device-panel` 或新槽位，PR 說明理由）。
3. **選中狀態：** MainLayout 放一個 local ref `selectedDeviceId`（**不進 store**），接 `LayoutView` 的 `select-device(id | null)`；`null` 時隱藏面板。
4. **轉接：** 把 `PlacedDevice` ＋ `getMachineById` 轉成 `MachineCardProps`（`id`／`name`／`sizeText` 必填；`power`／`formulas` 有就給）。轉接邏輯放 L2（MainLayout 內或一個小 composable），**不要**讓 `MachineCard` 自己讀 store。

toby 的 `select-device` 還沒合之前，可先寫死「選第一台設備」確認面板能顯示，合入前改掉。

---

## 2. 不要做

- 改 `MachineCard` 內部（shirone 鎖；缺 prop 就在 Discord 問 shirone）
- 接右側面板／下方面板（等 #62／#48）
- 頂欄按鈕（本週暫緩）
- 改 `LayoutView`／`GridCanvas`（toby 鎖）
- 把選中狀態放進 `layoutStore`／`editorStore`

---

## 3. DoD

- [ ] `pnpm dev`：正式頁看不到舊側欄
- [ ] 選中設備（或暫時假選）時左側顯示 `MachineCard`，名稱／尺寸正確
- [ ] `MachineCard` 檔案未改
- [ ] 開 PR；說明 `ProjectSidebar` 檔案要不要刪
