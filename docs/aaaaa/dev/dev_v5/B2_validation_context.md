# B2 — ValidationContext 完整性檢查

**對應工項**：V5-B2

---

## 1. 工項目標

確保 `ValidationContext` 介面完整，供 E001–E006 detector 使用：

- 檢查現有欄位是否滿足需求
- 確認是否需要新增 `baseRegion` 欄位
- 更新 `useValidation.ts` 中 context 組裝邏輯

**背景**：
E006（供電範圍偵測）需要知道當前在哪個基地，以決定是否允許中繼器。

---

## 2. 現狀檢查

### 2.1 當前定義（`src/types/validation.ts`）

```typescript
export interface ValidationContext {
  devices: FactoryNode[];
  connections: FactoryEdge[];
  getDef: (machineType: string) => Machine | undefined;
}
```

**缺失**：
- ❌ 無 `baseRegion` 欄位
- ❌ 無 `geometryUtils` helper（已由 B1 獨立實作，不需加入 ctx）

---

## 3. 技術決策

### 3.1 是否新增 `baseRegion`？

| 方案 | 優點 | 缺點 | 決策 |
|------|------|------|------|
| 新增到 `ValidationContext` | detector 直接取用，語意清晰 | 增加 ctx 複雜度 | ✅ **採用** |
| detector 自己 import canvasStore | 減少 ctx 欄位 | 破壞純函式性質 | ❌ 不採用 |
| 透過 `getDef()` 擴充 | 不改 ctx 介面 | 語意不清，濫用 getDef | ❌ 不採用 |

**結論**：新增 `baseRegion` 欄位到 `ValidationContext`。

---

## 4. 實作步驟

### 4.1 更新型別定義

**檔案**：`src/types/validation.ts`

```typescript
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import type { Machine } from '@/types/machine';
import type { BaseRegion } from '@/store/canvasStore';

export interface ValidationContext {
  devices: FactoryNode[];
  connections: FactoryEdge[];
  getDef: (machineType: string) => Machine | undefined;
  
  /** 當前基地（'wuling' / 'valley4' / null = 自由畫布） */
  baseRegion: BaseRegion;
}
```

---

### 4.2 更新 `useValidation.ts` 組裝邏輯

**檔案**：`src/composables/useValidation.ts`

找到 `run()` 內組裝 ctx 的地方：

```typescript
// 修改前
const ctx: ValidationContext = {
  devices: editorStore.nodes,
  connections: editorStore.edges,
  getDef: (machineType) => getMachine(machineType),
};

// 修改後
import { useCanvasStore } from '@/store/canvasStore';

const ctx: ValidationContext = {
  devices: editorStore.nodes,
  connections: editorStore.edges,
  getDef: (machineType) => getMachine(machineType),
  baseRegion: useCanvasStore().baseRegion, // 新增
};
```

---

### 4.3 更新 E006 detector 使用方式

**檔案**：`src/lib/validation/detectors/E006_powerCoverage.ts`（範例）

```typescript
export const E006_powerCoverage: Detector = {
  code: 'E006',
  level: 'error',
  run(ctx: ValidationContext): Alert[] {
    const alerts: Alert[] = [];
    
    // 排除中繼器（僅基地模式）
    const powerSupplies = ctx.devices.filter(d => {
      const def = ctx.getDef(d.data.machineType);
      if (!def || def.category !== '電力') return false;
      
      // 基地模式排除中繼器
      if (ctx.baseRegion !== null && def.id === 'relay') return false;
      
      return true;
    });
    
    // ... 供電範圍計算
    
    return alerts;
  },
};
```

---

## 5. 測試更新

### 5.1 更新測試 helper

**檔案**：`src/__tests__/helpers/makeValidationCtx.ts`（若存在）

```typescript
import type { ValidationContext } from '@/types/validation';
import type { BaseRegion } from '@/store/canvasStore';

export function makeValidationCtx(
  opts: {
    devices?: FactoryNode[];
    connections?: FactoryEdge[];
    baseRegion?: BaseRegion;
  } = {},
): ValidationContext {
  return {
    devices: opts.devices || [],
    connections: opts.connections || [],
    getDef: (machineType) => getMachine(machineType),
    baseRegion: opts.baseRegion ?? null, // 預設自由畫布
  };
}
```

---

### 5.2 測試案例

**檔案**：`src/__tests__/composables/useValidation.test.ts`

新增測試：

```typescript
it('ctx.baseRegion 正確傳遞當前基地', async () => {
  const canvasStore = useCanvasStore();
  const validationStore = useValidationStore();
  
  canvasStore.setBaseRegion('wuling');
  
  // 註冊一個檢查 ctx 的 detector
  const mockDetector: Detector = {
    code: 'TEST',
    level: 'error',
    run(ctx) {
      expect(ctx.baseRegion).toBe('wuling');
      return [];
    },
  };
  
  validationStore.registerDetector(mockDetector);
  validationStore.run(/* ctx 由 useValidation 組裝 */);
});
```

---

## 6. 向後相容性

**影響範圍**：
- `ValidationContext` 介面改動 → 所有 detector 型別簽名需重新編譯
- 已註冊的 E001–E006 detector stub → 不需修改（不使用 baseRegion）

**遷移計畫**：
- 先更新 `validation.ts` 型別
- 然後更新 `useValidation.ts` 組裝邏輯
- 最後更新 E006 使用方式
- 執行 `pnpm type-check` 確認無錯誤

---

## 7. 驗證標準

| 項目 | 標準 |
|------|------|
| 型別檢查 | `pnpm type-check` 通過 |
| 測試通過 | 所有 validation 相關測試不 break |
| E006 正確 | 基地模式排除中繼器，自由畫布允許 |

---

*此文件對應 V5-B2 工項，實作後標記 [x] 於 todolist_v5.md。*
