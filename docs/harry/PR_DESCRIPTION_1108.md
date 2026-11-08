# PR Description 草稿：水源供給的設備邏輯（W1102-H1）

以下內容可直接複製進 GitHub PR 描述欄。

---

## Summary

- 基礎材料輸出點選了**液體或氣體**（清水、沉積酸、惰氣、息壤氣），`setDevicePrimaryOutput` 會在**同一筆歷史**內把 `machineMode` 切成 `fluid_pipe`；選固體（如源礦）切成 `solid_belt`；清除產出則刪掉 `machineMode`，回到預設固體
- `setDevicePrimaryOutput(uid, itemId, ratePerMin?)` **參數不變**，也沒有新增 action
- 型態用「輸出埠媒質與材料物態相符」查表決定，不在 store 寫死型態 id
- 只動**有多個型態的源設備**（目前只有基礎材料輸出點）。物品輸出口、倉庫取貨口與非源設備的 `machineMode` 一律不動
- 左欄下拉改列出**該機任一型態送得出去**的材料：基礎材料輸出點從 10 種固體變成 14 種。不改的話，設備在固體型態下永遠選不到清水

## 變更檔案

| 檔案 | 變更 |
|------|------|
| `src/store/layoutStore.ts` | 新增模組內 helper `syncSourceMachineMode`，由 `setDevicePrimaryOutput` 在設定／清除時呼叫；更新 action 的 JSDoc（宣告處與 return 處） |
| `src/editor/sourceOutput/sourceMaterialOptions.ts` | 改為取所有型態主輸出埠媒質的聯集來過濾；拿掉不再使用的 `machineMode` 參數 |
| `src/editor/sourceOutput/SourceOutputPanel.vue` | 只改一行呼叫與註解，**版面未動** |
| `src/__tests__/store/layoutStore.primaryOutput.test.ts` | 新增 8 個案例：清水／惰氣→`fluid_pipe`、源礦→`solid_belt`、清水改回源礦、清除、Undo／Redo 同時還原兩欄、未知材料不動、單型態源設備不寫、非源設備清除不刪型態 |
| `src/__tests__/editor/sourceMaterialOptions.test.ts` | 改為聯集行為：基礎材料輸出點 14 種、單型態源設備 10 種固體 |

未改：右側產耗（toby）、`DeviceShape`（MBD）、`GridCanvas`／`LayoutView`／`connectionWaypoints`／`MainLayout`（凍結）、`flowStore`／`useFlowEngine`、`editorStore`。

## 範圍外

- 新增水泵或其他機種
- 左欄版面（paper P3）；畫布上 pipe 埠的畫法（`DeviceShape`，MBD／goodmorning）
- 液體／氣體的預設速率（仍沿用 30／min）
- `src/app/dev/l1ContractLab/contractCatalog.ts` 裡 `setDevicePrimaryOutput` 的說明文字還沒提到會寫 `machineMode`，請 aaaaa 視需要補

## 驗證

- `pnpm type-check`／`pnpm lint-check`／`pnpm format-check`／`pnpm test`：全過（58 個測試檔、1039 個測試）
- 與 #84 的相容性：把本 PR 的 diff 套到 `dev/toby`（#84 head `89e557a`）上可乾淨套用，`docs/toby/test/layoutFlowWiring.test.ts` 與本 PR 兩份測試共 36 個全過
- 用 Edge 在 `pnpm dev` 實測（1600×900）：
  - 放置基礎材料輸出點並點選 → 下拉為「無」＋14 種材料
  - 選「清水」→ store `primaryOutput: '清水'`、`machineMode: 'fluid_pipe'`
  - 選「源礦」→ `machineMode: 'solid_belt'`
  - Ctrl+Z → 回到 `清水`／`fluid_pipe`（兩欄一起還原）
  - 選「無」→ `primaryOutput`、`machineMode` 都被移除
  - console 無錯誤

## 已知風險

- **已接管線的源設備改選不同物態：** 埠會從 belt 變 pipe（或反過來），管線留在原地，由既有的連線判斷依媒質視為不相連並標示斷線。本 PR 不擋、也不自動刪管線
- 畫布上的埠目前看不出 belt／pipe 的差別，要等 `DeviceShape` 合入
- 既有問題，與本 PR 無關：1600×900 下左欄的下拉被底部工具列蓋住，要先收合工具列才點得到（工具列在左槽上層，待 paper 決定誰在上）

## 對應文件

| 文件 | 連結 |
|------|------|
| 工單 | [W1102-H1_water_supply.md](../work_dispatch/harry/1102/W1102-H1_water_supply.md) |
| 週總表 | [WEEK_20261102.md](../work_dispatch/WEEK_20261102.md) v1.2 |
| 計畫 | [PLAN_waterSupply.md](PLAN_waterSupply.md) |
| 前一張 | [PLAN_c5SourceForm.md](PLAN_c5SourceForm.md)、#81 |

🤖 Generated with [Claude Code](https://claude.com/claude-code)
