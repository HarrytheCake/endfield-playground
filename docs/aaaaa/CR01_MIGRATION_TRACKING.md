# CR-01 machineType 遷移追蹤

**狀態**：🔶 封鎖中（等待 CR-01）  
**優先級**：最高  
**建立日期**：2026-06-06  
**負責人**：CR-01 (azure9572) + CR-04 (aaaaa)

---

## 背景

主編已於 2026-05-27 確認採用**方案 B**——`PlacedDevice.machineType` 由存中文 `Machine.name` 改為存英文 `Machine.id`（snake_case）。

**CR-04 已完成的基礎設施**（V4 版本）：
- ✅ `Machine` 新增 `readonly id: string` 欄位
- ✅ 41 台機器全部補齊 snake_case `id`
- ✅ `getMachineById(id: string)` 函式實作
- ✅ id 對照表（見下方）

**現在等待 CR-01 執行實際遷移**。

---

## CR-01 需執行的工作

### 1. 修改 `src/store/editorStore.ts`

將所有 `machineType: '<中文名>'` 改為對應的 `Machine.id`。

**範例**：

```typescript
// ❌ 舊格式（需修改）
data: { label: '精煉爐', machineType: '精煉爐', recipeIndex: 0, rotation: 0 }

// ✅ 新格式（目標）
data: { label: '精煉爐', machineType: 'refinery', recipeIndex: 0, rotation: 0 }
```

**位置**：`grep "machineType:" src/store/editorStore.ts` 會找到約 19 處。

---

### 2. 修改 `src/editor/canvas/FactoryCanvas.vue`

將設備定義查找由 `getMachine(node.data.machineType)` 改為 `getMachineById(node.data.machineType)`。

**範例**：

```typescript
// ❌ 舊格式
import { getMachine } from '@/data/machines';
const machineDef = getMachine(node.data.machineType);

// ✅ 新格式
import { getMachineById } from '@/data/machines';
const machineDef = getMachineById(node.data.machineType);
```

---

### 3. 確認 `getRecipesForMachine` 呼叫端

如果有任何地方呼叫 `getRecipesForMachine(machineType)`，確認 `machineType` 參數為 `Machine.id` 而非 `Machine.name`。

---

## id 對照表（供 CR-01 遷移使用）

### 常用設備（前 10 台）

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

### 完整對照表

完整 41 台機器對照表請查詢 `src/data/machines.ts` 中的 `machineList` 陣列。每筆均含 `id` 與 `name` 欄位。

**查詢方式**：

```typescript
import { machineList } from '@/data/machines';

// 列出所有 id 與 name 對照
machineList.forEach(m => {
  console.log(`${m.name} → ${m.id}`);
});
```

---

## CR-04 的適配策略

### 相容層（V4 已實作）

FlowEngine 在 `buildGraph` 階段已新增相容層：

```typescript
// src/composables/useFlowEngine.ts

function buildGraph() {
  const devices = editorStore.nodes.map(node => {
    // ✅ 相容層：優先使用新格式，回退到舊格式
    const machineType = node.data?.machineType;
    
    // 先嘗試用 id 查詢（新格式）
    let machineDef = getMachineById(machineType);
    
    // 如果找不到，嘗試用 name 查詢（舊格式）
    if (!machineDef) {
      machineDef = getMachine(machineType);
    }
    
    if (!machineDef) {
      console.warn(`[FlowEngine] Unknown machine: ${machineType}`);
      return null;
    }
    
    return { uid: node.id, machineType, machineDef, /* ... */ };
  }).filter(Boolean);
  
  // ...
}
```

### 移除相容層時機

**條件**：
- CR-01 完成所有檔案遷移
- `pnpm type-check` 與 `pnpm test` 全部通過
- editorStore 中不再有中文 machineType

**動作**：
- 移除 `getMachine(machineType)` 回退邏輯
- 更新 FlowEngine 測試案例
- 刪除舊的 `getMachine` 函式（如已棄用）

---

## 驗證方式

### 1. 類型檢查

```bash
pnpm type-check
```

預期：零錯誤

### 2. 單元測試

```bash
pnpm test
```

預期：所有測試通過

### 3. 手動驗證

在 `/dev/flow-engine` 測試頁面：
1. 擺放多台設備（包含精煉爐、粉碎機等）
2. 確認 FlowEngine 計算正常
3. 確認設備定義正確載入（顯示名稱、圖示等）

### 4. Grep 驗證

確認 editorStore 中不再有中文 machineType：

```bash
grep -r "machineType: '" src/store/editorStore.ts
```

預期：所有結果應為英文 id（如 `'refinery'`、`'crusher'`），不應有中文名稱。

---

## 完成標準

- [ ] `src/store/editorStore.ts` 所有 machineType 改為英文 id
- [ ] `src/editor/canvas/FactoryCanvas.vue` 使用 `getMachineById`
- [ ] `pnpm type-check` 通過
- [ ] `pnpm test` 通過
- [ ] Grep 驗證無中文 machineType
- [ ] CR-01 確認 PR 可以 merge

---

## 聯絡資訊

**問題回報**：
- CR-01 (azure9572)：editorStore 與 FactoryCanvas 修改
- CR-04 (aaaaa)：FlowEngine 適配與 id 對照表

**相關文件**：
- [V4 完成報告](./report_v4.md) 第 4.1 節
- [L1 API Reference](./L1_API_REFERENCE.md) §2
- [machines.ts](../../src/data/machines.ts)

---

**最後更新**：2026-06-06  
**下次檢查**：等待 CR-01 開工後每日更新
