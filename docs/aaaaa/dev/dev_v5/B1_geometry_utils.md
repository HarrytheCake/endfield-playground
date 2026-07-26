# B1 — geometryUtils 幾何工具函式

**對應工項**：V5-B1

---

## 1. 工項目標

為 CR-03（shirone）與 CR-04 提供**設備幾何計算**的 utility helper，解決：

- 設備在格子座標系中佔據哪些格子（考慮旋轉）
- 兩台設備是否有格子重疊
- 座標是否在基地邊界內

**使用場景**：
- E001 detector（設備重疊偵測）
- E006 detector（供電範圍計算）
- 拖曳擺放時的碰撞預檢

---

## 2. API 設計

### 2.1 getOccupiedCells

```typescript
/**
 * 計算設備佔據的所有格子座標（Set 格式）。
 *
 * @param device FactoryNode 物件
 * @param def Machine 定義（包含 width / height）
 * @returns Set<string>，每個元素為 "x,y" 格式
 *
 * @example
 * const cells = getOccupiedCells(device, machineDef)
 * // rotation=0, pos=(2,3), size=3x2 → ["2,3", "3,3", "4,3", "2,4", "3,4", "4,4"]
 */
export function getOccupiedCells(
  device: FactoryNode,
  def: Machine,
): Set<string>
```

**實作邏輯**：

```typescript
function getOccupiedCells(
  device: FactoryNode,
  def: Machine,
): Set<string> {
  const cells = new Set<string>();
  const { x, y } = device.position; // Vue Flow 的 pixel 座標
  const rotation = device.data?.rotation ?? 0;
  
  // 1. 取得機器尺寸（考慮旋轉）
  let { width, height } = def;
  if (rotation === 1 || rotation === 3) {
    [width, height] = [height, width]; // 90° / 270° 時 W ↔ H
  }
  
  // 2. pixel 座標 → 格子座標
  const gridX = Math.floor(x / GRID_SIZE);
  const gridY = Math.floor(y / GRID_SIZE);
  
  // 3. 填充所有格子
  for (let dx = 0; dx < width; dx++) {
    for (let dy = 0; dy < height; dy++) {
      cells.add(`${gridX + dx},${gridY + dy}`);
    }
  }
  
  return cells;
}
```

---

### 2.2 cellsOverlap

```typescript
/**
 * 檢查兩組格子是否有交集。
 *
 * @param cells1 第一台設備的格子 Set
 * @param cells2 第二台設備的格子 Set
 * @returns 是否有重疊
 *
 * @example
 * if (cellsOverlap(cells1, cells2)) {
 *   console.warn('設備重疊！')
 * }
 */
export function cellsOverlap(
  cells1: Set<string>,
  cells2: Set<string>,
): boolean
```

**實作**：

```typescript
function cellsOverlap(
  cells1: Set<string>,
  cells2: Set<string>,
): boolean {
  for (const cell of cells1) {
    if (cells2.has(cell)) return true;
  }
  return false;
}
```

---

### 2.3 isWithinBaseRegion

```typescript
/**
 * 檢查座標是否在基地邊界內。
 *
 * @param x 格子座標 X
 * @param y 格子座標 Y
 * @param baseRegion 基地類型（'wuling' / 'valley4' / null）
 * @returns 是否在範圍內；null baseRegion 視為無限制
 *
 * @example
 * isWithinBaseRegion(100, 100, 'wuling')  // false（武陵只有 256x256）
 * isWithinBaseRegion(10, 10, null)        // true（自由畫布無限制）
 */
export function isWithinBaseRegion(
  x: number,
  y: number,
  baseRegion: BaseRegion,
): boolean
```

**實作**：

```typescript
const BASE_SIZES = {
  wuling: { w: 256, h: 256 },
  valley4: { w: 192, h: 192 },
};

function isWithinBaseRegion(
  x: number,
  y: number,
  baseRegion: BaseRegion,
): boolean {
  if (baseRegion === null) return true; // 自由畫布無限制
  const size = BASE_SIZES[baseRegion];
  return x >= 0 && x < size.w && y >= 0 && y < size.h;
}
```

---

## 3. 檔案結構

**檔案位置**：`src/utils/geometryUtils.ts`

```typescript
import type { FactoryNode } from '@/types/graph';
import type { Machine } from '@/types/machine';
import type { BaseRegion } from '@/store/canvasStore';

const GRID_SIZE = 40; // 每格 40px（與 canvasStore 一致）

const BASE_SIZES = {
  wuling: { w: 256, h: 256 },
  valley4: { w: 192, h: 192 },
};

export function getOccupiedCells(
  device: FactoryNode,
  def: Machine,
): Set<string> {
  // ... 如上
}

export function cellsOverlap(
  cells1: Set<string>,
  cells2: Set<string>,
): boolean {
  // ... 如上
}

export function isWithinBaseRegion(
  x: number,
  y: number,
  baseRegion: BaseRegion,
): boolean {
  // ... 如上
}
```

---

## 4. 單元測試

**檔案位置**：`src/__tests__/utils/geometryUtils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getOccupiedCells, cellsOverlap, isWithinBaseRegion } from '@/utils/geometryUtils';
import type { FactoryNode } from '@/types/graph';
import type { Machine } from '@/types/machine';

describe('getOccupiedCells', () => {
  it('1x1 設備佔用 1 格', () => {
    const device: FactoryNode = {
      id: 'n1',
      position: { x: 80, y: 120 }, // (2, 3) in grid
      data: { machineType: 'test', rotation: 0 },
    };
    const def: Machine = { width: 1, height: 1, /* ... */ };
    
    const cells = getOccupiedCells(device, def);
    expect(cells.size).toBe(1);
    expect(cells.has('2,3')).toBe(true);
  });
  
  it('3x2 設備 rotation=0 佔用 6 格', () => {
    const device: FactoryNode = {
      position: { x: 80, y: 120 },
      data: { rotation: 0 },
    };
    const def: Machine = { width: 3, height: 2 };
    
    const cells = getOccupiedCells(device, def);
    expect(cells.size).toBe(6);
    expect(cells.has('2,3')).toBe(true);
    expect(cells.has('4,4')).toBe(true);
  });
  
  it('3x2 設備 rotation=1 變 2x3', () => {
    const device: FactoryNode = {
      position: { x: 80, y: 120 },
      data: { rotation: 1 },
    };
    const def: Machine = { width: 3, height: 2 };
    
    const cells = getOccupiedCells(device, def);
    expect(cells.size).toBe(6); // 仍是 6 格，但排列改變
  });
});

describe('cellsOverlap', () => {
  it('兩組不重疊回傳 false', () => {
    const cells1 = new Set(['0,0', '1,0']);
    const cells2 = new Set(['2,0', '3,0']);
    expect(cellsOverlap(cells1, cells2)).toBe(false);
  });
  
  it('有共同格子回傳 true', () => {
    const cells1 = new Set(['0,0', '1,0']);
    const cells2 = new Set(['1,0', '2,0']);
    expect(cellsOverlap(cells1, cells2)).toBe(true);
  });
});

describe('isWithinBaseRegion', () => {
  it('自由畫布永遠回傳 true', () => {
    expect(isWithinBaseRegion(1000, 1000, null)).toBe(true);
  });
  
  it('武陵邊界檢查', () => {
    expect(isWithinBaseRegion(100, 100, 'wuling')).toBe(true);
    expect(isWithinBaseRegion(256, 0, 'wuling')).toBe(false);
  });
});
```

---

## 5. 驗證標準

| 項目 | 標準 |
|------|------|
| 單元測試覆蓋率 | > 80% |
| 型別檢查 | `pnpm type-check` 通過 |
| 旋轉處理 | rotation 0/1/2/3 均正確 |
| JSDoc 註解 | 每個函式有完整說明與範例 |

---

*此文件對應 V5-B1 工項，實作後標記 [x] 於 todolist_v5.md。*
