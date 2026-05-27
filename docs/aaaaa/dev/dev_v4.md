# dev_V4 — 主編 0526 介面設計建議修正

**版本：** V4  
**建立日期：** 2026-05-27  
**負責人：** aaaaa  
**對應 TODO：** [todolist_v4.md](./todolist_v4.md)

---

## 1. 背景與動機

主編於 2026-05-27 提交 `docs/aaaaa/COMMENT_0526.md`，針對以下六個面向提出介面設計建議：

| # | 問題類型 | 涉及檔案 | 問題摘要 |
|---|---------|---------|---------|
| 1 | 命名慣例 | `src/data/devices.ts #22` | SCREAMING_SNAKE_CASE 常數應改為 camelCase |
| 2 | 冗餘 export | `src/data/devices.ts #353, #383` | wrapper 函式與來源功能名稱重複，呼叫者應直接 import 來源 |
| 3 | 中文變數 + 設計 | `src/data/machines.ts` | 中文常數名稱、個別 export，應改為 `machineList` 陣列 + `ReadonlyMap` |
| 4 | interface 位置 | `src/data/plans.ts #1~#23` | 資料型別定義不應放在 data 層，應移至 `src/types/plan.ts` |
| 5 | 冗餘 re-export | `src/types/flow.ts #21` | 橋接 re-export 導致 debug 時來源模糊，應移除 |
| 6 | 缺乏 id 欄位 | `src/types/flow.ts #38, #51`<br>`src/types/machine.ts #81` | `RecipeDef`、`ProductDef`、`Machine` 均缺乏唯一 id，以 name 查找不可靠 |
| 7 | 工具函數位置 | `src/types/machine.ts #105~#156` | `rotatePortSide`、`rotatePortOffset` 不應放在 types 層 |

---

## 2. 技術決策

### 2.1 PRODUCT_DEFS → productList 命名慣例

| 方案 | 命名風格 | 說明 |
|------|---------|------|
| 方案 A（現狀） | `PRODUCT_DEFS`（SCREAMING_SNAKE_CASE） | JS 模組常數慣例；但與專案其餘 camelCase 風格不一致 |
| **方案 B（選擇）** | `productList`（camelCase） | 統一 camelCase，遵循主編建議；`const` 不可重新賦值的保護仍在 |

選擇方案 B。理由：本專案其他模組常數（如 `plans`、`MACHINES`）命名不一，統一以 camelCase 為標準。

---

### 2.2 machines.ts 中文變數重構

| 方案 | 做法 | 優缺點 |
|------|------|--------|
| 方案 A（現狀） | 每台機器獨立 `export const 塑型機` | 可直接以名稱查找原始碼；但中文變數不符合 TS/JS 慣例，且新增設備時須手動更新兩處（常數 + MACHINES map） |
| **方案 B（選擇）** | `const machineList: Machine[]` 陣列 + `export const machineMap: ReadonlyMap<string, Machine>` | 遵循主編建議；新增設備只修改陣列；移除所有中文具名 export；與 `machineNameMap` 命名對齊 |

選擇方案 B。命名為 `machineMap`（因為 lookup 目標是整台 Machine 物件）。

---

### 2.3 id 欄位設計

主編說明：「`name` 無法保證唯一性、不變性（可能機器名修改、甚至修改語言）」。

| 型別 | 目前唯一鍵 | 修改後 | id 格式 |
|------|-----------|--------|--------|
| `Machine` | `name`（中文） | `id: string` 新增 | 英文 snake_case，例如 `shaping_machine` |
| `ProductDef` | `name`（中文） | `id: string` 新增 | 英文 snake_case，例如 `jing_cao_solution` |
| `RecipeDef` | 無 | `id: string` 新增 | `${machineId}_${productId}_${index}`，例如 `reactor_jing_cao_solution_0` |

**Phase 1 策略（本版本）：**
- 介面加入 `id: string` 欄位
- machines.ts 中每台機器手動賦予英文 id
- ProductDef / RecipeDef 的 id 以名稱 slug 化後填入（暫用工具輔助生成）
- JSON 來源檔（machines.json / products.json）不在本版本修改範圍內（靜態資料來源）

---

### 2.4 rotatePortSide / rotatePortOffset 位置遷移

| 方案 | 目標位置 | 優缺點 |
|------|---------|--------|
| 方案 A（現狀） | `src/types/machine.ts` | 型別與業務邏輯混合；types 檔不應含執行時函式 |
| **方案 B（選擇）** | 新建 `src/utils/portUtils.ts` | 明確分離；純函數不需要 composable 的響應式包裝 |
| 方案 C | `src/composables/usePortUtils.ts` | composable 語意過重（這只是純數學轉換） |

選擇方案 B。新建 `src/utils/portUtils.ts`，`machine.ts` 改為 re-import 後 re-export（保持向後相容），下游逐步遷移到直接 import `@/utils/portUtils`。

---

### 2.5 plans.ts interface 拆分

| 方案 | 做法 | 優缺點 |
|------|------|--------|
| 方案 A（現狀） | interface + data 共存於 `src/data/plans.ts` | 便於快速開發；但 data 層混入型別定義 |
| **方案 B（選擇）** | interface 移至 `src/types/plan.ts`，data 改為 `import type` | 符合分層慣例；其他 store / composable 可直接 import 型別而不引入資料依賴 |

選擇方案 B。

---

### 2.6 flow.ts 冗餘 re-export 移除

現狀：`src/types/flow.ts #21` 將 `Machine`（以 `MachineDef` alias）、`PortDef`、`PortSide`、`PortType` 從 `@/types/machine` re-export，導致同一型別在兩個模組中都可找到，debug 時難以確認來源。

修正策略：移除 re-export。呼叫方改為直接從正確來源 import：

| 呼叫方 | 修改前 | 修改後 |
|--------|-------|-------|
| `src/data/devices.ts` | `import type { ... } from '@/types/flow'` | `import type { ... } from '@/types/machine'` |
| `src/composables/useFlowEngine.ts` | 若有 `MachineDef` 用法 | 改 `import type { Machine } from '@/types/machine'` |

---

## 2.7 跨 CR 協調說明 — Machine.id 新增（V4-B3 封鎖中）

### 背景

主編建議在 `Machine` interface 新增 `id: string`，理由是以 `name`（中文字串）作為唯一查找鍵存在以下風險：
- 名稱未來可能隨語系調整而變更
- 中文字串在 key 比對時較不穩定（大小寫、空白、全形字符）
- 無法在 URL / JSON key / log 中安全使用

### 影響範圍

`Machine.id` 是共用型別，新增此欄位將強制所有使用 `Machine` 的模組做出對應修改：

| CR | 受影響檔案 | 必要修改 |
|----|----------|---------|
| **CR-04**（本 CR） | `src/types/machine.ts` | 新增 `readonly id: string` |
| **CR-04**（本 CR） | `src/data/machines.ts` | 39 台機器各自新增英文 `id` 值 |
| **CR-01** | `src/store/editorStore.ts` | `PlacedDevice.machineType` 目前存 `Machine.name`；若未來改存 `Machine.id`，editorStore 需對齊 |
| **CR-01** | `src/editor/canvas/FactoryCanvas.vue` | 畫布節點以 machineType 查找設備定義，查找邏輯需同步更新 |
| **CR-02** | 連接 / 管線 store | 若連接資料中有機器類型欄位，需確認用 id 或 name 查找 |
| **CR-03** | `src/store/validationStore.ts` | 驗證邏輯若透過 machineType 做設備查找，需確認影響範圍 |

### 關鍵設計問題（需各 CR 確認）

**問題 1：`PlacedDevice.machineType` 改用 id 還是保留 name？**

目前 `PlacedDevice.machineType: string` 存的是 Machine.name（中文），這是最核心的設計決策：

- **方案 A（保守）**：`machineType` 繼續存 name，`Machine.id` 僅作為補充欄位，查找邏輯不變
- **方案 B（徹底）**：`machineType` 改存 `Machine.id`，所有查找改用 id，name 僅用於顯示

> ✅ **主編確認（2026-05-27）：採用方案 B**，`machineType` 改存 `Machine.id`，需全員配合。

**問題 2：id 命名規範**

CR-04 目前提案 `snake_case` 英文（如 `shaping_machine`），需各 CR 確認接受此格式，或有其他規範（如 UUID、縮寫）。

> ✅ **主編確認（2026-05-27）：直接使用 `snake_case`**。

### 決策摘要（主編 2026-05-27 確認）

| 問題 | 決策 |
|------|------|
| `PlacedDevice.machineType` 存 id 或 name | **改存 `Machine.id`（方案 B）**，name 僅供顯示 |
| id 命名規範 | **`snake_case` 英文**，例如 `shaping_machine`、`crusher` |

### 暫行處理 → 正式決策後行動計畫

主編已確認方案 B，CR-04 執行計畫如下：
- `Machine` interface 新增 `readonly id: string`（V4-B3）
- `machines.ts` 39 台機器各補 `id`，`getMachine()` 仍以 name 為 key，另新增 `getMachineById(id)` 函式（V4-C）
- `PlacedDevice.machineType` 的查找邏輯遷移需 CR-01 同步更新 `editorStore.ts`；CR-04 提供 id 對照表與遷移說明
- 後續 `getMachine(name)` 可視情況 deprecated，改由 `getMachineById(id)` 取代

---

### 3.1 Machine interface 新增 id 欄位（`src/types/machine.ts`）

```typescript
export interface Machine {
    readonly id: string;       // ← 新增：英文唯一識別碼，例如 'shaping_machine'
    readonly name: string;
    readonly width: number;
    // ... 其餘欄位不變
}
```

### 3.2 RecipeDef 新增 id 欄位（`src/types/flow.ts`）

```typescript
export interface RecipeDef {
    id: string;               // ← 新增：格式 '<machineId>_<productId>_<recipeIndex>'
    inputs: RecipeItem[];
    outputs: RecipeItem[];
    machine: string;          // 保留（依據 MachineDef.name 查找，短期內不改）
    timeSeconds: number;
}
```

### 3.3 ProductDef 新增 id 欄位（`src/types/flow.ts`）

```typescript
export interface ProductDef {
    id: string;               // ← 新增：英文 slug，例如 'jing_cao_solution'
    name: string;
    recipes: RecipeDef[];
}
```

### 3.4 新增 `src/types/plan.ts`

```typescript
export interface MaterialRate {
    name: string;
    rate: number | null;  // null = 無限制
}

export interface MachineLimit {
    name: string;
    limit: number | null; // null = 無限制
}

export interface ProductValue {
    name: string;
    price: number;
}

export interface Plan {
    id: string;
    name: string;
    material_rates: MaterialRate[];
    machine_limits: MachineLimit[];
    product_values: ProductValue[];
    priority_products: { name: string; max_rate: number | null }[];
}
```

### 3.5 新增 `src/utils/portUtils.ts`

```typescript
import type { PortSide } from '@/types/machine';

const SIDE_ORDER: PortSide[] = ['top', 'right', 'bottom', 'left'];

export function rotatePortSide(side: PortSide, rotation: 0 | 1 | 2 | 3): PortSide { ... }

export function rotatePortOffset(
    side: PortSide,
    offset: number,
    machineWidth: number,
    machineHeight: number,
    rotation: 0 | 1 | 2 | 3,
): number { ... }
```

---

## 4. 檔案修改計畫

| 檔案 | 狀態 | 說明 |
|------|------|------|
| `src/types/flow.ts` | **修改** | 移除 re-export #21；`RecipeDef` + `ProductDef` 新增 `id` |
| `src/types/machine.ts` | **修改** | `Machine` 新增 `id`；工具函數移出（改為 re-export 向後相容） |
| `src/types/plan.ts` | **新建** | plans interface 定義 |
| `src/utils/portUtils.ts` | **新建** | 旋轉工具函式 |
| `src/data/machines.ts` | **修改** | 中文常數 → `machineList` + `machineMap`；每台新增 `id` |
| `src/data/devices.ts` | **修改** | `PRODUCT_DEFS` → `productList`；移除冗餘 wrapper；ProductDef/RecipeDef 補 `id` |
| `src/data/plans.ts` | **修改** | interface 移至 types/plan.ts，改為 import type |
| `src/composables/useFlowEngine.ts` | **可能修改** | 依 flow.ts re-export 移除後更新 import 路徑 |
| `src/editor/stats/ProductionStats.vue` | **可能修改** | 依 plan.ts 型別 import 路徑更新 |
| `src/__tests__/flowEngine.test.ts` | **可能修改** | 依型別 import 路徑更新 |

> ⚠️ **跨 CR 協調說明**
> - `src/types/machine.ts`：`Machine.id` 新增與工具函式移出影響全體 CR。修改前需通知 CR-01（editorStore 使用 Machine）、CR-02（連線邏輯）、CR-03（驗證邏輯）。
> - `src/data/devices.ts`：依 AGENT_CONTEXT 目前仍由 CR-04 暫行維護，但正式範疇屬 CR-01；修改後需通知 CR-01 確認。

---

## 5. 遷移說明

### 5.1 MachineDef alias 移除

舊：
```typescript
// src/types/flow.ts 中有 re-export
import type { MachineDef } from '@/types/flow';
```

新：
```typescript
// 直接從來源 import
import type { Machine } from '@/types/machine';
// MachineDef 類型用法全數改為 Machine
```

### 5.2 machines.ts 中文常數移除

舊：
```typescript
import { 塑型機 } from '@/data/machines';
```

新：
```typescript
import { machineMap } from '@/data/machines';
const 塑型機 = machineMap.get('shaping_machine');
```

> 目前已知無外部直接 import 中文常數，故影響範圍限於 machines.ts 內部及 MACHINES map 的初始化。

### 5.3 rotatePortSide / rotatePortOffset import 路徑

舊：
```typescript
import { rotatePortSide, rotatePortOffset } from '@/types/machine';
```

新：
```typescript
import { rotatePortSide, rotatePortOffset } from '@/utils/portUtils';
```

machine.ts 在工具函式移出後保留 re-export，確保舊路徑短期內不斷裂，後續版本再移除 re-export。

---

## 6. 開發日誌

| 日期 | 紀錄 |
|------|------|
| 2026-05-27 | 建立 dev_v4.md，依 COMMENT_0526.md 主編建議制定工項清單 |
| 2026-05-27 | V4-A 完成：flow.ts 移除 re-export、RecipeDef / ProductDef 新增 id 欄位；devices.ts 全面補齊 id；type-check 零錯誤 |
| 2026-05-27 | V4-E 完成：新建 src/types/plan.ts；plans.ts 改為 import type + re-export；type-check 零錯誤 |
| 2026-05-27 | V4-B1 完成：新建 src/utils/portUtils.ts，機能從 machine.ts 遷移 |
| 2026-05-27 | V4-B2 完成：machine.ts 工具函式改為 re-export + deprecated 標註；type-check 零錯誤 |
| 2026-05-27 | V4-B3 標記封鎖：Machine.id 新增需跽 CR-01 / CR-02 / CR-03 確認 PlacedDevice.machineType 設計方案，詳見橫 CR 協調說明節 |
| 2026-05-27 | V4-F 品質驗證：type-check ✅ 零錯誤；test --run ✅ 27/27 通過；lint-check ✅ 零警告；format-check ⚠️ 部分通過 — CR-04 主責 5 個檔案全數格式化完成，剩餘 4 個 history 模組預存問題（`useCurrentHistory.ts`、`historyManager.ts`、`lib/history/index.ts`、`types/history.ts`）屬其他 CR 主責，待協調修正 |
| 2026-05-27 | V4-D4 補記：id 欄位補齊已於 V4-A 作業中同步完成（25 筆 ProductDef + RecipeDef 全部補齊 id），todolist 更新標記為 [x] |
| 2026-05-27 | V4-D1 完成：`PRODUCT_DEFS` → `productList` 重命名，共 5 處（宣告、`_productMap`、`getRecipesForMachine`、`getAllProducts`、`getAllRecipes`）；type-check 零錯誤 |
| 2026-05-27 | V4-D2 完成：刪除 `getMachineDef` wrapper；`useFlowEngine.ts` 改直接 `import { getMachine } from '@/data/machines'`，2 處呼叫點同步更新；移除 devices.ts 中已無用的 `getMachine` import；type-check 零錯誤 |
| 2026-05-27 | V4-D3 完成：確認 `getAllMachines` 在 src/ 內無外部呼叫者後刪除 wrapper；移除 `getAllMachinesFromStore` import；type-check 零錯誤 |
| 2026-05-27 | V4-D 全組完成後最終驗證：type-check ✅ 零錯誤；test --run ✅ 27/27 通過；lint-check ✅ 零警告 |
| 2026-05-27 | 主編回復跨 CR 協調問題：問題 1 確認方案 B（machineType 改存 Machine.id）；問題 2 確認使用 snake_case。V4-B3 和 V4-C 解封 |
| 2026-05-27 | V4-B3 完成：`Machine` interface 新增 `readonly id: string`；`machines.ts` 41 台機器全部補齊 id（snake_case）；type-check 零錯誤 |
