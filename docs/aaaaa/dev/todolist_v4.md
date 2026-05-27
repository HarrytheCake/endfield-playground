# V4 TODOLIST — 主編 0526 介面設計建議修正

**版本：** V4  
**建立日期：** 2026-05-27  
**負責人：** aaaaa  
**對應開發文件：** [dev_v4.md](./dev_v4.md)

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## V4-A｜`src/types/flow.ts` 清理（無外部依賴）

> 主編指定：移除冗餘 re-export (#21)；RecipeDef、ProductDef 新增 id 欄位 (#38, #51)

- [x] **V4-A1** 移除 `#21` 冗餘 re-export
  - 刪除 `export type { Machine as MachineDef, PortDef, PortSide, PortType } from '@/types/machine'`
  - 同步移除上方說明 comment block（#15~#21）
  - 若 flow.ts 內部有使用 `MachineDef`，改為 `Machine`（此時須加 `import type { Machine } from '@/types/machine'`）

- [x] **V4-A2** `RecipeDef` 新增 `id: string` 欄位（#38）
  - 在 `inputs` 欄位之前插入 `id: string`
  - 更新 JSDoc 說明 id 格式：`<machineId>_<productId>_<recipeIndex>`

- [x] **V4-A3** `ProductDef` 新增 `id: string` 欄位（#51）
  - 在 `name` 欄位之前插入 `id: string`
  - 更新 JSDoc 說明 id 格式：英文 slug（例如 `jing_cao_solution`）

---

## V4-B｜`src/types/machine.ts` 整理（跨 CR 協調）

> 主編指定：Machine 缺乏 id 欄位 (#81)；工具函數不應在 types/ (#105~#156)

> ⚠️ **跨 CR 通知**：修改 Machine interface 影響 CR-01 / CR-02 / CR-03，實作前先通知其他負責人

- [x] **V4-B1** 新建 `src/utils/portUtils.ts`
  - 從 `machine.ts` 搬移 `SIDE_ORDER` 常數
  - 搬移 `rotatePortSide(side, rotation)` 函式
  - 搬移 `rotatePortOffset(side, offset, machineWidth, machineHeight, rotation)` 函式
  - 加入 `import type { PortSide } from '@/types/machine'`

- [x] **V4-B2** `machine.ts` 工具函式改為 re-export（向後相容）
  - 將原函式實作改為 `export { rotatePortSide, rotatePortOffset } from '@/utils/portUtils'`
  - 保留 `SIDE_ORDER` 為 portUtils.ts 內部私有（不 export）
  - JSDoc 標注 `@deprecated 請從 @/utils/portUtils 直接 import`

- [x] **V4-B3** `Machine` interface 新增 `id: string` 欄位（#81）
  - 在 `name` 欄位之前插入 `readonly id: string`
  - 更新 JSDoc 說明 id 為英文唯一識別碼（snake_case）
  - 新增 `id` 後補齊 `machines.ts` 全部 41 台機器的對應英文 id
  - **解封：2026-05-27 主編確認方案 B + snake_case**

---

## V4-C｜`src/data/machines.ts` 重構（依賴 V4-B3，已解封）

> 主編指定：中文變數名稱、建議改用 machineList + ReadonlyMap

- [x] **V4-C1** 將所有中文具名常數收攏為 `machineList: Machine[]` 陣列
  - 移除所有 `export const 塑型機 = { ... }` 等個別中文 export（共 41 個常數）
  - 改以物件字面值直接寫入 `machineList` 陣列，順序與 machines.json 一致
  - id 欄位已在 V4-B3 補齊（41 台），對照表詳見下方
  - **附加：新增 `getMachineById(id: string)` 函式**（方案 B 對法）
  - 確認影響範圍：grep 確認無外部直接 import 中文常數；`MACHINES` export 亦僅內部使用

- [x] **V4-C2** 將 `MACHINES: Map<string, Machine>` 改為 `machineMap: ReadonlyMap<string, Machine>`
  - 從 `machineList.map(m => [m.name, m])` 自動建立（key 仍為中文 name，向後相容）
  - 同步新增 `machineByIdMap`（key 為英文 id），供 `getMachineById` 查詢
  - 移除原本逐條 `[塑型機.name, 塑型機]` 的硬編碼 map 初始化
  - `machineByIdMap` 為模組私有（不 export），僅供 `getMachineById` 使用

- [x] **V4-C3** 更新匯出 API
  - `getMachine(name)` 改為查詢 `machineMap`（路徑不變，向後相容；供 editorStore 中文 machineType 繼續正常查找）
  - **新增 `getMachineById(id: string)` 函式**，查詢 `machineByIdMap`
  - `getAllMachines()` 改為回傳 `[...machineList]`（路徑不變，向後相容）
  - 移除所有中文常數的個別 export
  - 更新檔案頭部 JSDoc，反映新 API（`machineList`、`machineMap`、`getMachineById`）

#### 機器 id 對照表（41 台，已全部填入 ✅）

| 中文名稱 | id | 分類 |
|---------|-----|------|
| 塑型機 | `shaping_machine` | 基礎生產 |
| 精煉爐 | `refinery` | 基礎生產 |
| 粉碎機 | `crusher` | 基礎生產 |
| 配件機 | `parts_machine` | 基礎生產 |
| 採種機 | `seed_harvester` | 基礎生產 |
| 種植機 | `planter` | 基礎生產 |
| 廢水處理機 | `wastewater_processor` | 基礎生產 |
| 灌裝機 | `filling_machine` | 合成製造 |
| 裝備原件機 | `equipment_parts_machine` | 合成製造 |
| 封裝機 | `packaging_machine` | 合成製造 |
| 研磨機 | `grinder` | 合成製造 |
| 反應池 | `reactor` | 合成製造 |
| 天有洪爐 | `blast_furnace` | 合成製造 |
| 提純機 | `purifier` | 合成製造 |
| 拆解機 | `disassembler` | 合成製造 |
| 擴容反應池 | `large_reactor` | 合成製造 |
| 物品准入口 | `item_access_port` | 物流設備 |
| 分流器 | `splitter` | 物流設備 |
| 物流橋 | `logistics_bridge` | 物流設備 |
| 匯流器 | `merger` | 物流設備 |
| 管道准入口 | `pipe_access_port` | 物流設備 |
| 管道分流器 | `pipe_splitter` | 物流設備 |
| 管道橋 | `pipe_bridge` | 物流設備 |
| 管道匯流器 | `pipe_merger` | 物流設備 |
| 協議儲存箱 | `protocol_storage_box` | 倉庫存取 |
| 倉庫存貨口 | `warehouse_input` | 倉庫存取 |
| 倉庫取貨口 | `warehouse_output` | 倉庫存取 |
| 儲液罐 | `liquid_tank` | 倉庫存取 |
| 倉庫存取線基段 | `warehouse_line_base` | 倉庫存取 |
| 倉庫存取線源樁 | `warehouse_line_source` | 倉庫存取 |
| 暗管入口 | `conduit_inlet` | 倉庫存取 |
| 暗管出口 | `conduit_outlet` | 倉庫存取 |
| 多口暗管入口 | `multi_conduit_inlet` | 倉庫存取 |
| 多口暗管出口 | `multi_conduit_outlet` | 倉庫存取 |
| 供電樁 | `power_pole` | 電力 |
| 息壤供電樁 | `xi_rang_power_pole` | 電力 |
| 中繼器 | `relay` | 電力 |
| 息壤中繼器 | `xi_rang_relay` | 電力 |
| 熱能池 | `thermal_pool` | 電力 |
| 物品輸出口 | `item_source` | FlowEngine 專用 |
| 物品輸入口 | `item_sink` | FlowEngine 專用 |

---

## V4-D｜`src/data/devices.ts` 清理（依賴 V4-A、V4-C）

> 主編指定：命名慣例 (#22)；移除冗餘 export 複名 (#353, #383)

> ⚠️ 本檔案為 CR-04 暫行維護，修改後通知 CR-01 確認

- [x] **V4-D1** 命名慣例修正
  - `PRODUCT_DEFS` → `productList`（符合 camelCase）
  - 同步更新所有內部引用（`_productMap` 初始化、`getRecipesForMachine`、`getAllProducts`、`getAllRecipes`）

- [x] **V4-D2** 移除冗餘 wrapper `getMachineDef`（#353）
  - 刪除 `export function getMachineDef(machineName: string) { return getMachine(machineName); }`
  - 更新 `src/composables/useFlowEngine.ts`：`import { getMachine } from '@/data/machines'`，`getMachineDef(x)` 改為 `getMachine(x)`
  - 更新 devices.ts 頂部 JSDoc 中提到的 `getMachineDef` 示範
  - 同步移除 devices.ts import 中已不再使用的 `getMachine`

- [x] **V4-D3** 移除冗餘 wrapper `getAllMachines`（#383）
  - 刪除 `export function getAllMachines() { return getAllMachinesFromStore(); }`
  - 確認無外部呼叫者（grep 確認後標記）
  - 同步移除 devices.ts import 中已不再使用的 `getAllMachines as getAllMachinesFromStore`

- [x] **V4-D4** 補充 `productList` 中各 `ProductDef` 的 `id` 欄位
  - 每個 ProductDef 加入 `id`（英文 slug 格式）
  - 每個 RecipeDef 加入 `id`（格式：`<machineId>_<productId>_<recipeIndex>`）
  - **注意**：此項已於 V4-A 作業中同步完成（新增 id 欄位後即補齊所有 25 筆資料）

---

## V4-E｜`src/data/plans.ts` interface 拆分（無外部依賴）

> 主編指定：interface 定義應移至 `src/types/plan.ts` (#1~#23)

- [x] **V4-E1** 新建 `src/types/plan.ts`
  - 搬入 `MaterialRate`、`MachineLimit`、`ProductValue`、`Plan` 四個 interface
  - 確認 `Plan.id: string` 已存在（V3 已新增）

- [x] **V4-E2** `src/data/plans.ts` 改為 `import type`
  - 刪除原有 interface 定義
  - 加入 `import type { MaterialRate, MachineLimit, ProductValue, Plan } from '@/types/plan'`

- [x] **V4-E3** 下游消費者更新 import
  - `src/store/editorStore.ts`（CR-01 主責）目前從 `@/data/plans` import `Plan`，已透過 re-export 維持相容，不需修改
  - `src/editor/stats/ProductionStats.vue`：未直接 import plans 型別，無需變更

---

## V4-F｜品質驗證（依賴 V4-A ~ V4-E）

- [x] **V4-F1** `pnpm type-check` 零錯誤（V4-D 完成後重驗 ✅）
- [x] **V4-F2** `pnpm test --run` 全數通過（27/27，V4-D 完成後重驗 ✅）
- [x] **V4-F3** `pnpm lint-check` 零警告（V4-D 完成後重驗 ✅）
- [~] **V4-F4** `pnpm format-check` 部分通過
  - ✅ CR-04 主責檔案全部格式化（`plans.ts`、`plan.ts`、`portUtils.ts`、`flowStore.ts`、`ProductionStats.vue`）
  - ⚠️ 仍有 4 個 **非 CR-04** 檔案存在預存格式問題：`useCurrentHistory.ts`、`historyManager.ts`、`lib/history/index.ts`、`types/history.ts`
  - 此 4 檔案屬 history 模組，待負責 CR 修正後方可全數通過

---

## 封鎖項目追蹤

| 工項 | 封鎖原因 | 等待對象 | 暫行處理 |
|------|---------|---------|---------|
| ~~V4-B3~~ | ~~Machine.id 新增影響全體 CR，需協調一致~~ | **已解封**：2026-05-27 主編確認方案 B + snake_case | V4-B3 可立即執行 |
| ~~V4-C1（id 對照表）~~ | ~~39 台機器的英文 id 需與 CR-01 最終規格對齊~~ | **已解封**：snake_case 確認 | V4-C 可立即執行 |
| V4-F4（部分失敗） | `useCurrentHistory.ts`、`historyManager.ts`、`lib/history/index.ts`、`types/history.ts` 屬 history 模組，有預存格式問題 | 負責 history 模組的 CR 修正後即可全數通過 | CR-04 主責檔案已全部格式化，其餘等待協調 |
