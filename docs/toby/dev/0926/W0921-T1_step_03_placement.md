# 步驟 03：畫布格點事件與落子

## 目標

點擊新畫布格點時，由 L2 容器以真機器資料完成合法性檢查及高階新增操作。

## 修改檔案

- `src/editor/layout/GridCanvas.vue`：必要的畫布格點事件與語意標示；不 import store 或 Vue Flow。
- `src/editor/layout/LayoutView.vue`：讀意圖、預檢、組設備、呼叫 `layoutStore.addDevice`。
- `src/utils/layout/placementCheck.ts`：使用者後續授權自行建立的共用預檢。
- `src/store/layoutStore.ts`：將既有檢查搬到共用純函式，保留 action 對外行為。
- `src/__tests__/utils/layout/placementCheck.test.ts`：預檢與新增結果、無副作用驗證。

`src/composables/useShortcuts.ts` 不在修改範圍；Esc 保持現有快捷鍵行為。

## 實作資料流

1. 畫布將點擊轉成 `{ x, y, z: 0 }`。以 SVG 本身矩形及 `clientX/Y` 為座標基準，依 `cellSize` 向下取整；確認點在格線範圍內。不要直接假設子元素的 `offsetX/Y` 永遠相對 SVG。
2. `GridCanvas` 以 emit 傳出格座標，不取得 store，也不自行決定可否放置。
3. `LayoutView` 在 `armedMachineId` 為 `null` 時忽略；有 id 時先透過 `getMachineById` 取得機器。查無機器不得組成錯誤標籤或呼叫新增。
4. 依使用者後續授權，在 L1 共用純函式中建立 `canPlaceDevice`，將 store 原有合法性計算移出並由 store 呼叫。以 `{ machineType, position, rotation: 0 }` 和唯讀 devices／pipelines 預檢；`ok: false` 時不呼叫 `addDevice`。L2 不另外計算重疊。
5. 合法時組 `PlacedDevice`：新 UUID、真機器 id、格點、`rotation: 0`、`label: machine.name`，省略 `machineMode`；呼叫 `layoutStore.addDevice`，檢查結果。成功後保留武裝，以支援連放。
6. 不新增 Esc 取消監聽；新意圖的取消入口為同機再點、切換分類或點舊按鈕。既有 Esc 開啟快捷鍵設定的行為維持。

## 驗收條件

- 點空格能放置正確機器，中文標籤及佔格正確；點佔用格不新增。
- 點到 SVG 的線、設備圖形、文字時，格點換算不漂移；點外層 padding 不落子。
- `GridCanvas.vue` 無 store／Vue Flow import；沒有直接 mutation、`historyStore.execute` 或第二套重疊算法。
- 新增操作由 `layoutStore.addDevice` 進 history；初始 mock 快照進 history 的既有行為不在本步修正。

## 下一步

進入 [步驟 04](./W0921-T1_step_04_manual_verification.md)。

## 目前狀態（2026-09-26）

使用者後續授權自建預檢，本步已完成。`pnpm type-check` 通過；`placementCheck.test.ts` 與未修改的 `layoutStore.test.ts` 共 40 項通過，涵蓋設備與管線重疊。首頁的落子結果由步驟 04 驗收。
