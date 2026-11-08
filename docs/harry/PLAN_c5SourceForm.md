# PLAN：正式頁源素材選擇（W1026-H1／C5 左面板 L2）

**工單：** [W1026-H1_c5_source_form.md](../work_dispatch/harry/1026/W1026-H1_c5_source_form.md)｜**週總表：** [WEEK_20261026.md](../work_dispatch/WEEK_20261026.md) v1.1｜**roadmap：** [C5_source_primary_output.md](../roadmap/detail/C5_source_primary_output.md)
**基準：** `dev/cake` ＝ `upstream/master` `d48ac99`（2026-10-31）

---

## 1. 範疇判定

| 檔案 | 層 | 動作 |
|------|----|------|
| `src/editor/sourceOutput/SourceOutputPanel.vue` | L2 | **新建**：收 `device` prop，判斷是否為源設備、列材料、呼叫 `setDevicePrimaryOutput` |
| `src/editor/sourceOutput/sourceMaterialOptions.ts` | L2 | **新建**：純函式，依機器定義＋型態算出可選材料（方便單元測試） |
| `src/__tests__/editor/sourceMaterialOptions.test.ts` | 測試 | **新建** |
| `src/app/layouts/MainLayout.vue` | L2 | 左槽 `MachineCard` 下方掛 `SourceOutputPanel`（週總表：MainLayout 本週歸 harry，只准為 C5 表單改） |

不碰：`LayoutView`／`GridCanvas`（toby #78 鎖）、`shapes/*`（MBD）、`src/app/MachineCard/*` 內部、`layoutStore` 簽名、右側 StatsPanel、WarningIcon／Storybook。

## 2. 既有介面盤點

| 用途 | 位置 | 備註 |
|------|------|------|
| 寫入 action | `src/store/layoutStore.ts:399` `setDevicePrimaryOutput(uid, itemId \| null, ratePerMin?)` | 省略速率＝30；`null`＝清除；未知或重複 uid 靜默 no-op 且不進歷史 |
| 材料清單 | `src/data/materials.ts:105` `getAllMaterials()` | 14 種：solid 10、liquid 2、gas 2。`primaryOutput` 存**中文名**（`MaterialDef.name`），不是 `id` |
| 材料媒質 | `src/data/materials.ts:124` `getMaterialPortMedia(name)` | solid→belt；liquid／gas→pipe |
| 輸出埠媒質 | `src/utils/layout/portMedia.ts:18` `getMachinePortMedia(type, mode, 'output', 0, getMachine?)` | 與引擎、`canConnect` 共用查表 |
| 源設備判斷 | `src/data/machines.ts` `getMachineById(id).is_source` | MainLayout 已 import `getMachineById` |
| 寫法示範 | `src/app/dev/L1ContractLab.vue:250-284` | `/dev/l1-contract-lab` |

**源設備（`is_source: true`）：**

| id | 名稱 | 輸出埠 |
|----|------|--------|
| `material_source` | 基礎材料輸出點 | 型態 `solid_belt`＝belt／`fluid_pipe`＝pipe |
| `item_source` | 物品輸出口 | belt |
| `warehouse_output` | 倉庫取貨口 | belt |

**限制：** 正式頁放置（`LayoutView.vue:309` `addDevice`）不帶 `machineMode`，`layoutStore` 也沒有切換型態的 action，所以正式頁的基礎材料輸出點一律是 `modes[0]`＝`solid_belt`。

## 3. 設計

### 3.1 使用者裁決（2026-10-31）

- **顯示範圍：** 所有 `is_source` 設備（不寫死 `material_source`），與引擎判斷一致
- **過濾：** 依輸出埠媒質過濾（belt 只列 solid；pipe 只列 liquid／gas）。正式頁目前只會看到 10 種固體，PR 註明並回報 aaaaa 缺切換型態的 action
- **掛載：** 另開 L2 控制元件，MainLayout 只負責掛

### 3.2 `sourceMaterialOptions(machine, machineMode)`

```
非 is_source → []
media = getMachinePortMedia(machine.id, machineMode, 'output', 0, () => machine)
media 為 null → 不過濾，回傳全部（PR 註明）
回傳 getAllMaterials().filter(m => getMaterialPortMedia(m.name) === media)
```

### 3.3 `SourceOutputPanel`

- props：`device: PlacedDevice`
- 機器不是源設備 → 整個元件不渲染（`v-if`），非源設備看不到下拉
- 用 Nuxt UI `USelect`，選項＝「無」＋過濾後材料；目前值＝`device.primaryOutput`，缺省顯示「無」
- 選材料 → `layoutStore.setDevicePrimaryOutput(device.id, name)`；選「無」→ `setDevicePrimaryOutput(device.id, null)`。不傳速率、不直接改 `device`
- 「無」用哨兵值（reka-ui 的 SelectItem 不接受空字串），實作時確認
- 值從 store 反查（MainLayout 已是 computed），Ctrl+Z 後下拉跟著回退

### 3.4 MainLayout

MainLayout 再加一個 computed `selectedDevice`（`PlacedDevice | null`），讓 `selectedMachineCard` 改從它取值，避免重複 `find`。`aside.area-device-panel` 內在 `MachineCard` 下方加 `<SourceOutputPanel :device="selectedDevice" />`。槽寬與捲動行為不變。

## 4. 明確排除

- 速率輸入、多產出、畫布上的產出圖示
- 新增切換 `machineMode` 的 action 或 UI（缺口回報 aaaaa）
- 右側 Stats／D1 接線
- 修改 `MachineCard` 內部；搜尋框

## 5. 驗證

- 四項：`pnpm type-check`／`lint-check`／`format-check`／`test`
- 單元測試：非源設備回 `[]`；`material_source` 預設型態只列 10 種固體；`fluid_pipe` 只列 4 種液體／氣體；`item_source` 只列固體
- 畫面實測（CLAUDE.md §7）：放基礎材料輸出點 → 點選 → 下拉選「源礦」→ 確認 store 寫入；選「無」清除；Ctrl+Z 回退；點非源設備不出現下拉；console 無錯誤

## 6. 待確認

1. ~~元件資料夾命名~~：使用者 10/31 裁採小寫 `sourceOutput/`，與 `src/editor/` 既有資料夾一致；檔名比照 `navbar/Navbar.vue` 用 PascalCase
2. 卡片 686px 加上下拉後，畫面較矮時會更早出現捲動，工具列遮擋問題（handoff §3.4-2）也會更明顯，等 paper 決定
