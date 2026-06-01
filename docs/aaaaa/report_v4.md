# CR-04 V4 完成報告

**日期**：2026-05-27
**作者**：CR-04 FlowEngine Agent
**分支**：`dev/aaaaa`

---

## 1. 報告目的

本報告記錄 V4 版本（Machine 物件 `id` 欄位化）的完成狀態、品質驗證結果，以及仍需其他 CR 協同完成的待處理事項與明確需求，供各 CR 對齊。

---

## 2. V4 完成項目摘要

### 2.1 Commit 清單

| Commit | 工項 | 說明 |
|--------|------|------|
| `e4905e3` | V4-A | `src/types/flow.ts`：`RecipeDef` / `ProductDef` 新增 `id` 欄位，移除冗餘 re-export |
| `eeb5701` | V4-B | `src/types/machine.ts`：`Machine` 新增 `readonly id: string`；新增 `src/utils/portUtils.ts`；41 台機器補齊 snake_case `id` |
| `a427f85` | V4-C | `src/data/machines.ts`：重構為 `machineList` 陣列 + `machineMap`；移除 41 個中文具名 `export const`；新增 `getMachineById(id)` |
| `a47ea9f` | V4-D | `src/data/devices.ts`：`productList` 重命名，移除 `getMachineDef` / `getAllMachines` wrapper；更新 `useFlowEngine.ts` 匯入 |
| `b496386` | V4-E | `src/types/plan.ts`：拆分 Plan 相關介面；`src/data/plans.ts` 改為 `import type` + re-export |
| `a8cfd1c` + `815520b` | 文件 | `docs/aaaaa/dev/dev_v4.md`、`docs/aaaaa/dev/todolist_v4.md` |

### 2.2 品質驗證

| 項目 | 指令 | 結果 |
|------|------|------|
| Type-check | `node node_modules/typescript/bin/tsc --noEmit` | ✅ 零錯誤 |
| Unit Tests | `node_modules\.bin\vitest.cmd run` | ✅ 27 / 27 通過 |
| Lint | `pnpm lint-check` | ✅ 零警告 |
| Format（CR-04 主責檔案） | Prettier | ✅ 全部通過 |

---

## 3. 待處理事項

### 3.1 V4-F4：format-check 尚未全通過

**狀態**：🔶 封鎖中（等待 History 模組 CR）

history 模組下列 4 支檔案存在 pre-existing format 問題，並非 V4 引入：

| 檔案 | 說明 |
|------|------|
| `src/composables/useCurrentHistory.ts` | history 模組 composable |
| `src/lib/history/historyManager.ts` | history 核心邏輯 |
| `src/lib/history/index.ts` | history 匯出 |
| `src/types/history.ts` | history 型別 |

**所需行動**：History 模組負責 CR 執行 `pnpm format` 後 commit，format-check 即可全通過。

---

## 4. 跨 CR 需求清單

### 4.1 ⚠️ CR-01：`PlacedDevice.machineType` 遷移（最高優先）

**背景**：主編已於 2026-05-27 確認採用**方案 B**——`PlacedDevice.machineType` 由存中文 `Machine.name` 改為存英文 `Machine.id`（snake_case）。CR-04 已完成基礎設施（`getMachineById(id)` 函式、41 台機器 id 對照），**等待 CR-01 執行實際遷移**。

**問題描述**：

目前 `editorStore.ts` 的 `machineType` 仍存中文名稱（grep 驗證：19 處）：

```typescript
// 現狀（需修改）
data: { label: '精煉爐', machineType: '精煉爐', recipeIndex: 0, ... }

// 目標（遷移後）
data: { label: '精煉爐', machineType: 'refinery', recipeIndex: 0, ... }
```

**CR-01 需執行的工作**：

1. **`src/store/editorStore.ts`**：將所有 `machineType: '<中文名>'` 改為對應的 `Machine.id`
2. **`src/editor/canvas/FactoryCanvas.vue`**：將設備定義查找由 `getMachine(node.data.machineType)` 改為 `getMachineById(node.data.machineType)`
3. 確認 `getRecipesForMachine(machineType)` 呼叫端是否需同步調整

**id 對照表（供 CR-01 遷移使用）**：

| 中文名稱（舊值） | 英文 id（新值） |
|----------------|----------------|
| 物品輸出口 | `item_output_port` |
| 物品輸入口 | `item_input_port` |
| 精煉爐 | `refinery` |
| 配件機 | `parts_machine` |
| 粉碎機 | `crusher` |
| 反應池 | `reaction_pool` |
| 研磨機 | `grinder` |
| 塑型機 | `shaping_machine` |
| 組裝台 | `assembly_table` |
| 電弧爐 | `arc_furnace` |

> 完整 41 台機器對照表請查詢 `src/data/machines.ts` 中的 `machineList` 陣列（每筆均含 `id` 與 `name` 欄位）。

**影響範圍確認**：

- `getMachine(name)` 函式在遷移完成後可逐步 deprecated（CR-04 後續版本處理）
- 遷移後 CR-04 的 `useFlowEngine.ts` 若有 `getMachine(machineType)` 呼叫，需改為 `getMachineById(machineType)`

---

### 4.2 ℹ️ CR-04 自行追蹤：測試檔案 machineType 遷移

**狀態**：待 CR-01 完成 editorStore 遷移後，CR-04 跟進

`src/__tests__/flowEngine.test.ts` 目前使用中文 machineType 字串（約 15 處），在 CR-01 遷移後需同步更新為英文 id，以確保測試與正式 store 一致。

範例（待更新）：

```typescript
// 現狀
machineType: '粉碎機'

// 遷移後
machineType: 'crusher'
```

---

### 4.3 ℹ️ CR-02：管線 / 連接 store 確認

**狀態**：待 CR-02 確認，低風險

若連接 store 的資料結構中有任何欄位以 `Machine.name` 做設備類型識別，需確認是否需改為 `Machine.id`。

**確認問題**：
> CR-02，你的連接資料結構中是否有類似 `machineType` 的欄位？若無，不受影響。

---

### 4.4 ℹ️ CR-03：驗證邏輯確認

**狀態**：待 CR-03 確認，低風險

`validationStore.ts` 中若透過 `machineType` 查找設備定義（呼叫 `getMachine()`），在 CR-01 遷移後需改呼叫 `getMachineById()`。

**確認問題**：
> CR-03，你的驗證邏輯中是否有呼叫 `getMachine(node.data.machineType)`？若有，需在 CR-01 遷移完成後同步換為 `getMachineById`。

---

## 5. 文件更新需求

以下文件內容尚未反映方案 B 決策，待遷移完成後更新：

| 文件 | 需更新內容 |
|------|-----------|
| `docs/aaaaa/README.md` L504 | `machineType` 描述仍寫「對應 MachineDef.name」，需改為「對應 Machine.id」 |
| `docs/aaaaa/README.md` L509 | `getRecipesForMachine(machineType)` 呼叫說明，需確認函式 key 是否同步改為 id |
| `spec/01_canvas_and_devices.md` | 若有 machineType 相關規格，需對齊方案 B |

---

## 6. 行動項目摘要

| 優先序 | 負責 CR | 行動 | 前置條件 |
|--------|---------|------|---------|
| 🔴 高 | **CR-01** | `editorStore.ts` machineType 改存 `Machine.id` | 無 |
| 🔴 高 | **CR-01** | `FactoryCanvas.vue` 改呼叫 `getMachineById()` | 上一項完成 |
| 🟡 中 | **History CR** | 修正 4 支 history 檔案的 format 問題 | 無 |
| 🟡 中 | **CR-04** | `flowEngine.test.ts` machineType 改英文 id | CR-01 完成遷移 |
| 🟢 低 | **CR-02** | 確認連接 store 是否有 machineType 依賴 | 無 |
| 🟢 低 | **CR-03** | 確認 validationStore 的 getMachine 呼叫 | 無 |
| 🟢 低 | **CR-04** | `getMachine(name)` 標記 deprecated | CR-01 完成遷移 |

---

## 7. 附錄：V4 設計決策紀錄

| 決策時間 | 問題 | 決策 | 決策者 |
|---------|------|------|--------|
| 2026-05-27 | `PlacedDevice.machineType` 存 id 或 name | **方案 B：改存 `Machine.id`**（snake_case 英文） | 主編 |
| 2026-05-27 | id 命名規範 | **snake_case 英文**，例如 `shaping_machine`、`crusher` | 主編 |
| 2026-05-27 | 向後相容處理 | V4-C 後 `getMachine(name)` 仍保留，待 CR-01 遷移完成後 deprecated | CR-04 |
