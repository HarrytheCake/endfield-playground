# PLAN：水源供給的設備邏輯（W1102-H1）

**工單：** [W1102-H1_water_supply.md](../work_dispatch/harry/1102/W1102-H1_water_supply.md)｜**週總表：** [WEEK_20261102.md](../work_dispatch/WEEK_20261102.md) v1.2｜**前一張：** [PLAN_c5SourceForm.md](./PLAN_c5SourceForm.md)（W1026-H1，PR #81 已合）
**基準：** `dev/cake` 快轉到 `upstream/master` `3b368b1`（2026-11-08；`dev/cake` 是其祖先，可直接快轉）

---

## 1. 範疇判定

| 檔案 | 層 | 動作 |
|------|----|------|
| `src/store/layoutStore.ts` | L1 | **改 `setDevicePrimaryOutput` 內部**：依材料物態一併寫入／清除 `machineMode`。參數不變。工單明確把這個函式派給 harry |
| `src/editor/sourceOutput/sourceMaterialOptions.ts` | L2 | **改**：可選材料改為「該機所有型態的輸出埠媒質」聯集，不再只看目前型態（見 §3.2，不改的話選不到清水） |
| `src/editor/sourceOutput/SourceOutputPanel.vue` | L2 | 只在 §6 Q2 選「拿掉參數」時改一行呼叫；**不動版面** |
| `src/__tests__/store/layoutStore.primaryOutput.test.ts` | 測試 | 補型態切換案例 |
| `src/__tests__/editor/sourceMaterialOptions.test.ts` | 測試 | 改既有兩條斷言（belt 只列固體、fluid_pipe 只列液氣）為聯集行為 |

**不碰（週總表 §2.2／工單 §2）：** 右側產耗三檔（toby）、`DeviceShape`（MBD）、`GridCanvas`／`LayoutView`／`connectionWaypoints`／`MainLayout`（凍結）、`flowStore`／`useFlowEngine`（唯讀）、`editorStore` 簽名、`SourceOutputPanel` 版面。不併 `dev/cake_toolbar`／`_machinecard`／`_prodstats`。

## 2. 既有介面盤點

| 用途 | 位置 | 備註 |
|------|------|------|
| 寫入 action | `src/store/layoutStore.ts:399` `setDevicePrimaryOutput(uid, itemId \| null, ratePerMin?)` | 現在只寫 `primaryOutput`／`sourceRatePerMin`；整份 `devices` 前後快照進同一筆 Command，所以多寫 `machineMode` 自動可復原 |
| 型態欄位 | `src/types/layout.ts:55` `PlacedDevice.machineMode?` | 缺省時以 `modes[0]` 解釋 |
| 材料媒質 | `src/data/materials.ts:124` `getMaterialPortMedia(name)` | solid→belt、liquid／gas→pipe；未知材料回 `null` |
| 型態查表 | `src/types/machine.ts` `getMachineMode(machine, modeId)`、`Machine.modes[]` | 埠的權威來源 |
| 下游讀 `machineMode` | `toTopology.ts:51`（引擎）、`connectRules.ts:119`（連線判斷）、`portAnchorIndex.ts:45`（埠位置） | 都已讀，不需改 |

**源設備型態：**

| id | 型態 | 輸出埠 |
|----|------|--------|
| `material_source` 基礎材料輸出點 | `solid_belt`（`modes[0]`）／`fluid_pipe` | 兩型態都是 `right` offset 1，只差 belt／pipe |
| `item_source` 物品輸出口 | `default` | belt |
| `warehouse_output` 倉庫取貨口 | `default` | belt |

**卡點：** 目前 `SourceOutputPanel` 用 `sourceMaterialOptions(machine, device.machineMode)` 依**目前**型態過濾。正式頁放下的設備是 `solid_belt`，下拉只有 10 種固體，**清水根本選不到**；只改 store 達不到 DoD 第一條。

## 3. 設計

### 3.1 `setDevicePrimaryOutput` 內部

型態用「找輸出埠媒質相符的型態」查表決定，不在 store 寫死 `'fluid_pipe'`／`'solid_belt'` 字串：

```
machine = getMachineById(device.machineType)
itemId === null：
    刪 primaryOutput、sourceRatePerMin
    若 machine 是多型態源設備 → 也刪 machineMode（回到 modes[0]＝固體）
itemId 有值：
    寫 primaryOutput、sourceRatePerMin（不變）
    media = getMaterialPortMedia(itemId)
    mode = machine.modes.find(m => m.output_ports[0]?.media === media)
    若 machine 是多型態源設備且找得到 mode → machineMode = mode.id
    找不到（未知材料／機器沒有對應型態）→ machineMode 不動
```

- 對 `material_source`：清水／沉積酸／惰氣／息壤氣 → `fluid_pipe`；源礦等固體 → `solid_belt`；清除 → 刪除（＝`solid_belt`）。符合工單 §1.2
- 仍是**一筆**歷史；Undo 同時還原 `primaryOutput` 與 `machineMode`
- 「多型態源設備」的範圍見 §6 Q1

### 3.2 `sourceMaterialOptions`

```
非 is_source → []
medias = machine.modes 每個型態的 output_ports[0].media 集合（去 null）
medias 為空 → 不過濾，回傳全部（與現行一致）
回傳 getAllMaterials().filter(m => medias 含 getMaterialPortMedia(m.name))
```

- `material_source` 會列出 14 種（10 固體＋4 液氣）；`item_source`／`warehouse_output` 仍只有 10 種固體
- 下拉順序沿用 `getAllMaterials()`（固體在前）

### 3.3 已接管線的副作用（不擋）

已有 belt 管線接在源設備上時改選清水，埠變成 pipe：管線留在原地，`resolveConnections`／`canConnect` 依媒質判為不相連，驗證標示斷線。**不在本工單擋或自動刪管線**，PR 註明。畫面實測時確認不會報錯。

## 4. 明確排除

- 不新增 action、不改 `setDevicePrimaryOutput` 參數、不新增水泵或機種
- 不改左欄版面（paper P3 負責稿）；不改 DeviceShape 對 pipe 埠的畫法
- 不處理液體／氣體的預設速率（仍是 30／min）
- 不更新 `src/app/dev/l1ContractLab/contractCatalog.ts` 的說明文字（L1 debug 頁，不屬本週）；PR 註明請 aaaaa 視需要補「會寫 `machineMode`」

## 5. 驗證

1. 單元測試
   - store：清水 → `fluid_pipe`；源礦 → `solid_belt`；清水後改源礦 → `solid_belt`；清除 → `machineMode` undefined；清水後 Undo → `primaryOutput` 與 `machineMode` 一起還原；未知材料 → `machineMode` 不動；單型態源設備不受影響（依 Q1）
   - options：`material_source` 14 種且含清水；其他源設備 10 種固體；非源設備 `[]`
   - 既有 `splitter` 案例照舊通過（非源設備不寫型態）
2. 四項：`pnpm type-check`／`lint-check`／`format-check`／`test`
3. 畫面實測（CLAUDE.md §7）：放基礎材料輸出點 → 下拉選清水 → 讀 store `machineMode === 'fluid_pipe'` → 改源礦 → `solid_belt` → Ctrl+Z → console 無錯
4. 衝突檢查：toby #84 沒改 `layoutStore`／`sourceOutput/*`；其測試 `layoutFlowWiring.test.ts:607` 清除時快照帶 `machineMode: 'solid_belt'`，清除後變 undefined＝同樣 `solid_belt`，斷言只看 `itemSummary`，預期不受影響（開 PR 前把該檔拉進來跑一次確認）

## 6. 使用者裁決（2026-11-08，皆採建議）

- **Q1 寫型態的範圍：** 只對「有多個型態的源設備」寫（目前只有 `material_source`）；單型態源設備與非源設備的 `machineMode` 一律不動
- **Q2 `sourceMaterialOptions` 簽名：** 拿掉不再用的 `machineMode` 參數，`SourceOutputPanel.vue` 只改一行呼叫與其註解，不動版面
- **Q3 分支：** `dev/cake` 快轉到 `upstream/master` `3b368b1` 後在上面做
