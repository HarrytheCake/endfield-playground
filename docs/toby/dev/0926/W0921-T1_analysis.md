# W0921-T1 工單分析摘要

分析日期：2026-09-26

來源：[派工單](../../../work_dispatch/toby/0921/W0921-T1_placement_chain.md)、[教學檔](../../../work_dispatch/toby/0921/GUIDE_placement_chain.md)、[A0 前置](../../../work_dispatch/aaaaa/0921/W0921-A0_placement_precheck.md)。教學檔自述不是規格；有差異時以派工單及使用者裁定為準。

## 結論與基準

本工單只接通「真機器卡片點選 → 新畫布點格 → `layoutStore.addDevice` → 顯示正確佔格與中文名」。開始執行時位於 `dev/toby`，工作樹只有本工單前一輪建立的文件；使用者已指示直接在 `dev/toby` 執行，不建立 `dev/toby0921`。

開工前程式現況：

- `ToolbarPanel.vue` 真機器按鈕只更新本地 `selectedRealMachineId` 並輸出 `console.info`；舊五顆按鈕仍走 `editorStore`。
- `LayoutView.vue` 在空 store 時載入 `connected` mock 快照，並將 `layoutStore.devices`／`pipelines` 傳給唯讀 `GridCanvas.vue`。
- `layoutStore.addDevice` 已有 `PlacementResult`、重疊拒絕與 history Command；載入初始快照也會進 history，此限制已由前一工單接受。
- 本分支尚無 `src/utils/layout/placementCheck.ts` 或 `canPlaceDevice`。A0 的交期是文件計畫，不能當作目前已可 import 的證據。
- 首頁同時掛 `LayoutView`、`ToolbarPanel`；全域快捷鍵的 Esc 預設開啟設定面板，現有取消判斷只看舊 `editorStore.placementArmed`。

## 目標資料流

```text
ToolbarPanel 真機器卡片
    → usePlacementIntent.arm(machine id)（模組層共享 ref，不進 store）
GridCanvas SVG 點擊
    → 格點座標事件
LayoutView
    → 讀 armedMachineId
    → canPlaceDevice（本分支自建的共用純函式，落子前必經）
    → getMachineById(machine id) 取得中文名
    → layoutStore.addDevice(PlacedDevice)
    → GridCanvas 從 props 重繪
```

`PlacedDevice` 欄位：`id = crypto.randomUUID()`、`machineType = 真機器 id`、`position = { x, y, z: 0 }`、`rotation = 0`、`label = machine.name`；省略 `machineMode`。成功放置後保持武裝，以符合連放三台的驗收案例。

## 允許與禁止範圍

| 可修改                                              | 限制                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| 新增 `src/editor/toolbar/usePlacementIntent.ts`     | 只保存暫態機器 id，不 import store                                    |
| `src/editor/toolbar/ToolbarPanel.vue`               | 只改 `<script>`，不碰 template／style；與 goodmorning 的 #48 分工重疊 |
| `src/editor/layout/LayoutView.vue`                  | 處理事件、預檢、組裝設備、呼叫高階 action                             |
| `src/editor/layout/GridCanvas.vue`                  | 必要的格點事件／props；維持無 store、無 Vue Flow                      |
| `src/utils/layout/placementCheck.ts`                | 使用者後續授權自建預檢；與 store 共用原有判定邏輯                     |
| `src/store/layoutStore.ts`                          | 僅將原有判定搬到共用純函式並呼叫它，不改高階 action 對外簽章          |
| `src/__tests__/utils/layout/placementCheck.test.ts` | 驗證預檢與真正新增一致、無副作用                                      |

不擴充 `EquipmentType`，不改 `editorStore` 簽名，不在 L2 直接操作 history 或手算重疊；不修改 `MainLayout.vue`、StatsPanel、Inspector、`FactoryCanvas.vue`。拖曳、即時預覽、選取、旋轉、刪除、平移縮放與視角切換器不屬本次必要驗收。

## 驗收條件

1. 首頁真機器卡片可將正確 id 傳到畫布側；未武裝時點格不放置。
2. 點空格後出現機器，佔格取自機器資料，標籤為中文 `machine.name`；可連續放三台。
3. 落子前先呼叫 `canPlaceDevice`；點到既有佔格時不新增、不增加 history。
4. 點到 SVG 子元素或格線附近時，格座標仍以 SVG 畫布為基準；畫布外側 padding 不觸發落子。
5. `GridCanvas.vue` 沒有 store／Vue Flow import；diff 未觸及禁止檔案，工具列 diff 只在 script。
6. 手動驗收後執行 `pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test`。

## 使用者裁定（2026-09-26）

1. **Esc 維持既有行為**：不新增「Esc 取消新落子且阻止開設定」的接線，不修改 `useShortcuts.ts`。目前全域 Esc 預設開啟快捷鍵設定；新意圖不因 Esc 自動解除。這項裁定取代 GUIDE 所述的 Esc 取消方式。
2. **工具列狀態同步**：切換真機器分類或點舊五顆按鈕時，同步解除新落子意圖。GUIDE 的同機再點取消也須讓本地高亮反映未武裝狀態，避免畫面與可落子狀態相反；修改維持在工具列 script。
3. **原裁定為等待 A0**：當時不交「直接 `addDevice`、待補預檢」的版本。使用者後續另行授權在 `dev/toby` 自行建立 `canPlaceDevice` 並計算，故本分支已完成預檢；前兩項裁定維持。

## 文件落差與實作風險

- GUIDE 的 `disarm()` 註解寫「落子成功後解除」，同檔 §4 卻明定成功後不解除並驗收連放三台；執行時依 §4 的可觀察行為。
- GUIDE 建議 `event.offsetX/Y`；SVG 內含 `<line>`、`<rect>`、`<text>` 等可成為事件 target 的元素，直接讀 offset 有座標基準風險。實作時應以 SVG 本身的矩形與滑鼠 client 座標換算，再檢查邊界。
- 目前畫布 `role="img"`、標題含「只讀」；加入互動後應檢查標示是否仍準確，不擴大成完整鍵盤操作工單。
- 舊版 roadmap detail/B2 的 `FactoryCanvas`、`editorStore.placeDevice` 規劃已被該文件 2026-09-23 的裁決與本派工取代；本工單使用 `LayoutView` 與 `layoutStore.addDevice`。
- 本分支自建 `placementCheck.ts` 與 A0 原訂檔案路徑相同，日後整合 A0 時需以實際 diff 檢查衝突；目前版本接受 Pinia 的深唯讀資料，不使用 `any` 或強制斷言。

## 執行進度（2026-09-26）

- 步驟 01：已確認 `dev/toby`、允許範圍與 A0 尚未合入。
- 步驟 02：已新增 `usePlacementIntent.ts`，並僅修改 `ToolbarPanel.vue` 的 script。切分類、點舊按鈕或拖曳舊按鈕會解除新意圖；同機再點會取消並清除高亮。
- 驗證：`pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test` 通過（43 個檔案、827 項測試）；另以 Vite 載入 composable 檢查兩個呼叫端共享狀態、同機切換與解除武裝。
- 使用者後續授權自建預檢後，步驟 03 已完成：`canPlaceDevice` 與 `layoutStore` 共用原有判定、`GridCanvas` emit 格座標、`LayoutView` 預檢後新增設備。
- 步驟 04 已以 Chrome 無頭模式打開 `pnpm dev` 首頁驗證「塑型機」3×3 佔格、中文名、重疊拒絕、連放三台、同機再點取消、切分類取消、舊按鈕取消、SVG 子元素座標與畫布外點擊。此驗證以瀏覽器內派發點擊事件執行；未使用實體滑鼠或做鍵盤無障礙測試。
- 步驟 05 已完成：`pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test`、`pnpm build` 及本目錄文件的 Prettier 檢查均通過。完整測試共 44 個檔案、831 項；`git diff --check` 通過。`GridCanvas.vue` 搜尋不到 store 或 Vue Flow 依賴；未 push 或建立 PR。
