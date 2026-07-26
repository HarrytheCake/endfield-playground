# B3 — E001 Detector 開發範例

**對應工項**：V5-B3

---

## 1. 工項目標

為 shirone 提供 **E001 設備重疊偵測** 的完整開發範例，包括：

- 使用 `geometryUtils` 的範例程式碼
- 單元測試骨架
- 註冊與驗證流程

**注意**：此為**示範性質**，實際 E001 邏輯仍需 shirone 根據需求補齊。

---

## 2. E001 Detector 實作範例

### 2.1 檔案位置

`src/lib/validation/detectors/E001_deviceOverlap.ts`

---

### 2.2 完整程式碼

```typescript
/**
 * E001 設備重疊偵測
 *
 * 使用 geometryUtils 計算每台設備佔據的格子，
 * 若兩台設備有共同格子則產生 Alert。
 */

import type { Alert, Detector, ValidationContext } from '@/types/validation';
import { getOccupiedCells, cellsOverlap } from '@/utils/geometryUtils';
import { generateUid } from '@/utils/idGenerator';

export const E001_deviceOverlap: Detector = {
  code: 'E001',
  level: 'error',
  run(ctx: ValidationContext): Alert[] {
    const alerts: Alert[] = [];
    const { devices, getDef } = ctx;
    
    // 計算所有設備的佔用格子
    const deviceCells = new Map<string, Set<string>>();
    for (const device of devices) {
      const def = getDef(device.data.machineType);
      if (!def) continue; // 機器定義不存在，略過
      
      const cells = getOccupiedCells(device, def);
      deviceCells.set(device.id, cells);
    }
    
    // 兩兩檢查重疊（避免重複比對 A-B 與 B-A）
    const deviceIds = Array.from(deviceCells.keys());
    for (let i = 0; i < deviceIds.length; i++) {
      for (let j = i + 1; j < deviceIds.length; j++) {
        const uid1 = deviceIds[i];
        const uid2 = deviceIds[j];
        
        if (cellsOverlap(deviceCells.get(uid1)!, deviceCells.get(uid2)!)) {
          alerts.push({
            uid: generateUid(),
            level: 'error',
            code: 'E001',
            message: `設備重疊：${uid1} 與 ${uid2}`,
            relatedDeviceUids: [uid1, uid2],
            relatedConnectionUids: [],
          });
        }
      }
    }
    
    return alerts;
  },
};
```

---

## 3. 單元測試範例

### 3.1 檔案位置

`src/__tests__/lib/validation/detectors/E001_deviceOverlap.test.ts`

---

### 3.2 測試骨架

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { E001_deviceOverlap } from '@/lib/validation/detectors/E001_deviceOverlap';
import type { ValidationContext } from '@/types/validation';
import type { FactoryNode } from '@/types/graph';
import type { Machine } from '@/types/machine';

// 輔助函式：建立測試用 FactoryNode
function makeDevice(
  uid: string,
  x: number,
  y: number,
  machineType: string,
  rotation: 0 | 1 | 2 | 3 = 0,
): FactoryNode {
  return {
    id: uid,
    position: { x: x * 40, y: y * 40 }, // 格子座標 → pixel
    data: { machineType, rotation },
    type: 'custom',
  };
}

// 輔助函式：建立測試用 Machine 定義
const mockMachines: Record<string, Machine> = {
  'refinery': { id: 'refinery', width: 3, height: 3, /* ... */ },
  'crusher': { id: 'crusher', width: 2, height: 2, /* ... */ },
};

function makeCtx(devices: FactoryNode[]): ValidationContext {
  return {
    devices,
    connections: [],
    getDef: (machineType) => mockMachines[machineType],
    baseRegion: null,
  };
}

describe('E001 設備重疊偵測', () => {
  it('完全不重疊時回傳空陣列', () => {
    const ctx = makeCtx([
      makeDevice('a', 0, 0, 'refinery'),
      makeDevice('b', 5, 0, 'refinery'),
    ]);
    
    const alerts = E001_deviceOverlap.run(ctx);
    expect(alerts).toEqual([]);
  });
  
  it('兩台 3x3 完全重疊回傳一筆 Alert', () => {
    const ctx = makeCtx([
      makeDevice('a', 0, 0, 'refinery'),
      makeDevice('b', 0, 0, 'refinery'),
    ]);
    
    const alerts = E001_deviceOverlap.run(ctx);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].code).toBe('E001');
    expect(alerts[0].relatedDeviceUids).toContain('a');
    expect(alerts[0].relatedDeviceUids).toContain('b');
  });
  
  it('部分重疊仍視為重疊', () => {
    const ctx = makeCtx([
      makeDevice('a', 0, 0, 'crusher'), // 2x2
      makeDevice('b', 1, 1, 'crusher'), // 重疊 1 格
    ]);
    
    const alerts = E001_deviceOverlap.run(ctx);
    expect(alerts).toHaveLength(1);
  });
  
  it('三台設備 A-B 重疊、B-C 重疊，應產生 2 筆 Alert', () => {
    const ctx = makeCtx([
      makeDevice('a', 0, 0, 'crusher'),
      makeDevice('b', 1, 0, 'crusher'), // A-B 重疊
      makeDevice('c', 2, 0, 'crusher'), // B-C 重疊
    ]);
    
    const alerts = E001_deviceOverlap.run(ctx);
    expect(alerts).toHaveLength(2);
  });
});
```

---

## 4. 註冊與驗證流程

### 4.1 註冊 Detector

**檔案**：`src/main.ts` 或 `src/app/App.vue`（L1 初始化處）

```typescript
import { useValidationStore } from '@/store/validationStore';
import { E001_deviceOverlap } from '@/lib/validation/detectors/E001_deviceOverlap';

// 在 app setup 時註冊
const validationStore = useValidationStore();
validationStore.registerDetector(E001_deviceOverlap);
```

---

### 4.2 觸發驗證

`useValidation.ts` 會自動 watch editorStore 變化，無需手動觸發。

**驗證流程**：
```
畫布操作（placeDevice / moveDevice / ...）
  → editorStore.nodes / edges 變更
    → useValidation watch 觸發
      → validationStore.run(ctx)
        → 執行所有已註冊 detector（含 E001）
          → 更新 validationStore.alerts
```

---

### 4.3 查詢結果

```typescript
import { useValidationStore } from '@/store/validationStore';

const validationStore = useValidationStore();

// 取得所有警示
console.log(validationStore.alerts);

// 查詢特定設備的錯誤
const deviceAlerts = validationStore.alertsByDevice('device-uid');

// 檢查是否有 blocking error（CR-04 用）
const hasError = validationStore.hasBlockingError('device-uid');
```

---

## 5. 更新 shirone 文件

### 5.1 更新 `docs/shirone/README.md`

新增章節：

```markdown
## 使用 geometryUtils 範例

### 設備重疊偵測（E001）

參考完整範例：[B3_e001_example.md](../aaaaa/dev/dev_v5/B3_e001_example.md)

關鍵步驟：
1. Import `getOccupiedCells` 與 `cellsOverlap`
2. 計算每台設備的格子 Set
3. 兩兩比對是否有交集
4. 產生 Alert

**注意事項**：
- `getOccupiedCells` 已處理旋轉，直接使用
- 避免 A-B 與 B-A 重複比對（用 nested loop i < j）
- 機器定義從 `ctx.getDef()` 取得
```

---

## 6. 驗證標準

| 項目 | 標準 |
|------|------|
| 測試通過 | E001 測試至少 3 個案例全過 |
| 無重複 Alert | A-B 重疊只產生 1 筆，不重複 |
| 旋轉正確 | rotation 0/1/2/3 均正確偵測 |
| 註冊成功 | validationStore 能正常執行 E001 |

---

*此文件對應 V5-B3 工項，實作後標記 [x] 於 todolist_v5.md。*
