# D1 — CR-01 machineType 遷移追蹤

**對應工項**：V5-D1

---

## 1. 工項目標

追蹤 CR-01（azure9572）正在進行的 **machineType 資料結構遷移**，確保：

- CR-04 FlowEngine 相容新舊格式
- 遷移完成後移除相容層
- 雙方介面契約清晰

**負責人**：
- **CR-01**：azure9572（執行遷移）
- **CR-04**：aaaaa（監聽並適配）

---

## 2. 遷移內容摘要

### 2.1 變更前（舊格式）

```typescript
// src/data/devices.ts
interface PlacedDevice {
  uid: string;
  deviceId: string;  // 直接字串，如 'mining_rig'
  // ...
}
```

### 2.2 變更後（新格式）

```typescript
// src/data/devices.ts
interface PlacedDevice {
  uid: string;
  machineType: string;  // 改用 machineType，對應 machines.json
  recipeIndex?: number; // 新增配方索引
  // ...
}
```

---

## 3. CR-04 適配策略

### 3.1 相容層設計

在 FlowEngine 的 `buildGraph` 階段，新增相容層：

```typescript
function buildGraph() {
  const devices = editorStore.nodes.map(node => {
    // 相容層：優先使用 machineType，回退到 deviceId
    const machineType = node.data?.machineType ?? node.data?.deviceId;
    
    const machineDef = getMachineDef(machineType);
    if (!machineDef) {
      console.warn(`[FlowEngine] Unknown machine: ${machineType}`);
      return null;
    }
    
    return {
      uid: node.id,
      machineType,
      machineDef,
      recipeIndex: node.data?.recipeIndex ?? 0,
      // ...
    };
  }).filter(Boolean);
  
  // ...
}
```

### 3.2 移除相容層時機

**條件**：
- CR-01 完成所有檔案遷移
- `editorStore.nodes` 中不再有 `deviceId` 欄位
- 所有測試通過

**動作**：
- 移除 `node.data?.deviceId` 回退邏輯
- 更新 FlowEngine 測試案例

---

## 4. 介面契約

### 4.1 CR-01 需提供

| 項目 | 格式 | 說明 |
|------|------|------|
| `PlacedDevice.machineType` | `string` | 對應 `machines.json` 中的 `id` |
| `PlacedDevice.recipeIndex` | `number?` | 配方索引，預設 0 |
| `getMachineDef(machineType)` | `MachineDef \| undefined` | 查詢機器定義函式 |

### 4.2 CR-04 消費方式

```typescript
import { getMachineDef } from '@/data/machines';

const device = editorStore.nodes[0];
const machineType = device.data?.machineType;
const machineDef = getMachineDef(machineType);

if (!machineDef) {
  // 處理錯誤
}

const recipeIndex = device.data?.recipeIndex ?? 0;
const recipe = machineDef.recipes?.[recipeIndex];
```

---

## 5. 測試覆蓋

### 5.1 新增測試案例

```typescript
// src/__tests__/composables/useFlowEngine.test.ts

describe('machineType 相容層', () => {
  it('應正確讀取 machineType', () => {
    const device = {
      id: 'device-1',
      data: { machineType: '精煉爐', recipeIndex: 0 },
    };
    // ...
  });
  
  it('應回退到 deviceId（相容層）', () => {
    const device = {
      id: 'device-1',
      data: { deviceId: 'refinery' },  // 舊格式
    };
    // ...
  });
  
  it('machineType 優先於 deviceId', () => {
    const device = {
      id: 'device-1',
      data: {
        machineType: '精煉爐',
        deviceId: 'old_refinery',
      },
    };
    // 應使用 machineType
  });
});
```

---

## 6. 封鎖項目追蹤

| 封鎖項目 | 等待對象 | 預計解除時間 | 狀態 |
|----------|----------|--------------|------|
| 移除相容層 | CR-01 完成遷移 | 2026-06-15 | ⚠️ 進行中 |
| 更新測試案例 | CR-01 確認新格式 | 2026-06-15 | ⚠️ 進行中 |

---

## 7. 溝通記錄

### 2026-06-01

- **aaaaa → azure9572**：詢問遷移時程
- **azure9572 回覆**：預計 2026-06-15 完成所有檔案遷移

### 2026-06-03

- **aaaaa**：在 FlowEngine 新增相容層
- **測試結果**：舊格式與新格式皆正常運作

### 2026-06-15（預計）

- **azure9572**：通知遷移完成
- **aaaaa**：移除相容層，更新測試

---

## 8. 遷移完成檢查清單

- [ ] CR-01 完成所有 `deviceId` → `machineType` 遷移
- [ ] 所有測試案例更新為新格式
- [ ] FlowEngine 移除 `deviceId` 回退邏輯
- [ ] `pnpm type-check` 無錯誤
- [ ] `pnpm test` 全部通過
- [ ] 更新 `AGENT_CONTEXT.md` 記錄遷移完成

---

*此文件對應 V5-D1 工項，持續更新直到遷移完成。*
