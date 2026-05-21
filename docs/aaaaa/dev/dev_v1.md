# V1 — Machine 物件動態化重構

**版本：** V1  
**建立日期：** 2026-05-22  
**狀態：** 規劃中  
**負責人：** aaaaa  
**對應 Todolist：** [todolist_v1.md](./todolist_v1.md)

---

## 1. 背景與動機

目前 `src/data/devices.ts` 將機器定義為純資料物件（對齊 `docs/aaaaa/data/machines.json`），  
所有流量計算邏輯均集中在 FlowEngine 中以「效率 × 速率」公式統一處理。

隨著模擬需求增加，部分機器（如反應池、天有洪爐、提純機）具有特殊的內部運作邏輯  
（多輸出比例、狀態累積、條件觸發等），無法再以統一公式涵蓋。

因此本版本（V1）目標：

1. 建立獨立型別模組 `src/types/machine.ts`，定義 `Machine` 介面
2. 建立動態機器定義檔 `src/data/machines.ts`（每台機器為具名 export，未來可掛行為函式）
3. 所有行為函式在 Phase 1 均以 `null` 佔位，不破壞現有 FlowEngine 邏輯
4. 以相容橋接方式保留 `flow.ts` 中的 `MachineDef`，FlowEngine 無需改動

---

## 2. Port 表示方式決策分析

### 問題

未來需支援機器旋轉（0° / 90° / 180° / 270°），port 定義方式將影響旋轉計算的複雜度與資料可讀性。

### 方案比較

| 方案 | 格式範例 | 旋轉處理方式 | 可讀性 | 與現有格式相容 |
|------|---------|------------|--------|---------------|
| **A — 絕對方位 + offset（現行）** | `{ side: 'left', offset: 1 }` | 需 `rotatePortSide()` + `rotatePortOffset()` | ★★★ 直觀 | ✅ 完全相容 |
| B — 格子座標（相對機器左上角） | `{ gridX: 0, gridY: 1 }` | 矩陣旋轉 `(x,y)→(h-y,x)` | ★★ 較抽象 | ❌ 需完整重寫 |
| C — 機體相對面（front / back / left / right） | `{ face: 'front', offset: 0 }` | 只需 `(face + rotation) % 4` | ★★ 需先定義「front」方向 | ❌ 需部分重寫 |

### ✅ 決策：採用方案 A（絕對方位）+ 旋轉工具函式

**理由：**

1. **與現有格式完全相容**：`machines.json` 已採用此格式，遷移成本最低
2. **可讀性最佳**：定義時可直接對照機器示意圖理解 port 位置，無需轉換
3. **旋轉邏輯可隔離**：靜態機器定義完全不包含旋轉資訊，旋轉計算集中於工具函式
4. **`PlacedDevice` 的 `rotation` 是執行期屬性**，與靜態機器定義分離，符合「資料 vs 狀態」分離原則

### 旋轉轉換規則

`PlacedDevice.rotation: 0 | 1 | 2 | 3`，定義為順時針步數（0=0°、1=90°CW、2=180°、3=270°CW）。

**方位旋轉（每步 90°CW，循環順序）：**
```
top → right → bottom → left → top
```

**Offset 轉換規則（考慮機器尺寸，避免非方形機器旋轉後錯位）：**

`offset` 的語意：沿該方位邊緣的格子偏移，從**頂端（left/right 側）或左端（top/bottom 側）**起算，0-indexed。

| 原方位 | 旋轉 90°CW 後方位 | offset 轉換公式 |
|--------|----------------|----------------|
| `left`（offset = 從頂端往下的列） | `top`（offset = 從左端往右的欄） | `offset → (height - 1 - offset)` |
| `top`（offset = 從左端往右的欄） | `right`（offset = 從頂端往下的列） | `offset → offset`（不變） |
| `right`（offset = 從頂端往下的列） | `bottom`（offset = 從左端往右的欄） | `offset → (width - 1 - offset)` |
| `bottom`（offset = 從左端往右的欄） | `left`（offset = 從頂端往下的列） | `offset → offset`（不變） |

> 說明：left/right 側的 offset 沿垂直軸，top/bottom 側的 offset 沿水平軸。
> 當垂直側旋轉為水平側時（left→top、right→bottom），需翻轉 offset 以對齊正確格子。

---

## 3. 型別設計

### 3.1 `src/types/machine.ts`（新建）

```typescript
// ─── 基礎型別 ──────────────────────────────────────────────────────────────

/** Port 所在方位（機器正面朝上、0° 旋轉時的絕對方位） */
export type PortSide = 'top' | 'right' | 'bottom' | 'left'

/** 機器分類標籤（對齊 machine_tags.json） */
export type MachineCategory =
  | '物流設備'
  | '倉庫存取'
  | '基礎生產'
  | '合成製造'
  | '電力'

/**
 * Port 傳輸介質類型
 * - `'item'`   — 固體物品（由輸送帶連接）
 * - `'liquid'` — 液體 / 氣體（由管道連接）
 *
 * FlowEngine 與管線連接驗證應拒絕跨類型連接（item ↔ liquid）。
 */
export type PortType = 'item' | 'liquid'

/** 連接埠定義（正面朝上的靜態座標，不含旋轉） */
export interface PortDef {
  /** 0° 旋轉時的方位 */
  side: PortSide
  /** 沿該方位邊緣的格子偏移（從頂端或左端起算，0-indexed） */
  offset: number
  /** 傳輸介質類型：固體物品或液體 */
  type: PortType
}

// ─── 行為函式型別（Phase 1 全為 null 佔位）────────────────────────────────

/**
 * 機器執行期上下文（Phase 2 正式定義，Phase 1 暫設 unknown）
 * 預計包含：currentRecipe、inputBuffer、outputBuffer、efficiency 等
 */
export type MachineContext = unknown

/** 每 tick 執行（用於有狀態機器，例如緩衝池、儲液罐） */
export type MachineTickFn = null | ((context: MachineContext) => void)

/** 輸入品項時呼叫（可覆寫預設輸入接收邏輯） */
export type MachineInputFn = null | ((itemId: string, amount: number, portIndex: number) => boolean)

/** 輸出品項時呼叫（可覆寫預設輸出供給邏輯） */
export type MachineOutputFn = null | ((portIndex: number) => { itemId: string; amount: number } | null)

/**
 * 效率計算覆寫（null = 使用 FlowEngine 預設計算）
 * 適用於非線性效率的特殊機器
 */
export type MachineEfficiencyFn = null | ((inputs: Map<string, number>) => number)

// ─── Machine 介面 ──────────────────────────────────────────────────────────

/**
 * 機器定義物件
 *
 * 靜態屬性（readonly）描述機器的固有物理特性。
 * 行為函式（可為 null）在 Phase 1 均為 null，Phase 2+ 依需逐台覆寫。
 */
export interface Machine {
  // ── 靜態屬性 ──────────────────────────────────────────
  readonly name: string
  readonly width: number
  readonly height: number
  readonly input_ports: readonly PortDef[]
  readonly output_ports: readonly PortDef[]
  /** 耗電量 kW。負值 = 產電，0 = 無電力需求，-1 = 尚未定義 */
  readonly power: number
  readonly tags: readonly MachineCategory[]
  readonly is_source: boolean
  readonly is_sink: boolean
  // ── 行為函式佔位（Phase 1 全為 null）─────────────────
  onTick: MachineTickFn
  onInput: MachineInputFn
  onOutput: MachineOutputFn
  calcEfficiency: MachineEfficiencyFn
}
```

### 3.2 `src/data/machines.ts`（新建）

每台機器以**具名常數**形式 export，方便 tree-shaking 與靜態分析，  
並彙整為 `MACHINES` map 供查詢。

```typescript
import type { Machine } from '@/types/machine'

export const 塑型機: Machine = {
  name: '塑型機',
  width: 3,
  height: 3,
  input_ports: [
    { side: 'left', offset: 0 },
    { side: 'left', offset: 1 },
    { side: 'left', offset: 2 },
  ],
  output_ports: [
    { side: 'right', offset: 0 },
    { side: 'right', offset: 1 },
    { side: 'right', offset: 2 },
  ],
  power: 10,
  tags: ['基礎生產'],
  is_source: false,
  is_sink: false,
  onTick: null,
  onInput: null,
  onOutput: null,
  calcEfficiency: null,
}

// ... 其餘機器 ...

/** 所有機器 lookup map（key = machine.name） */
export const MACHINES = new Map<string, Machine>([
  [塑型機.name, 塑型機],
  // ...
])

export function getMachine(name: string): Machine | undefined {
  return MACHINES.get(name)
}
```

### 3.3 Port 旋轉工具函式

置於 `src/types/machine.ts` 末尾（或抽至 `src/utils/portRotation.ts`）：

```typescript
const SIDE_ORDER: PortSide[] = ['top', 'right', 'bottom', 'left']

/**
 * 將方位按指定旋轉步數（順時針）轉換
 * @param side   原始方位（0° 時）
 * @param rotation  旋轉步數（0~3，每步 90°CW）
 */
export function rotatePortSide(side: PortSide, rotation: 0 | 1 | 2 | 3): PortSide {
  const idx = SIDE_ORDER.indexOf(side)
  return SIDE_ORDER[(idx + rotation) % 4]
}

/**
 * 將 offset 按旋轉步數轉換（考慮機器尺寸）
 * @param side    原始方位
 * @param offset  原始 offset
 * @param machineWidth  機器寬度（格）
 * @param machineHeight 機器高度（格）
 * @param rotation  旋轉步數（0~3）
 */
export function rotatePortOffset(
  side: PortSide,
  offset: number,
  machineWidth: number,
  machineHeight: number,
  rotation: 0 | 1 | 2 | 3,
): number {
  if (rotation === 0) return offset
  // 逐步轉換，每步 90°CW
  const transforms: Record<PortSide, (o: number) => number> = {
    left:   (o) => machineHeight - 1 - o,  // left→top：垂直翻轉
    top:    (o) => o,                       // top→right：不變
    right:  (o) => machineWidth - 1 - o,   // right→bottom：水平翻轉
    bottom: (o) => o,                       // bottom→left：不變
  }
  let currentSide: PortSide = side
  let currentOffset = offset
  for (let i = 0; i < rotation; i++) {
    currentOffset = transforms[currentSide](currentOffset)
    currentSide = rotatePortSide(currentSide, 1)
  }
  return currentOffset
}
```

---

## 4. 檔案修改計畫

| 操作 | 檔案 | 說明 |
|------|------|------|
| **新建** | `src/types/machine.ts` | `Machine` 介面、`PortDef`、行為函式型別、旋轉工具函式 |
| **新建** | `src/data/machines.ts` | 全部機器具名 export + `MACHINES` map + `getMachine()` |
| **修改** | `src/types/flow.ts` | 以 re-export 橋接：`export type { Machine as MachineDef } from '@/types/machine'` |
| **修改** | `src/data/devices.ts` | `getMachineDef()` 委託至 `getMachine()`（保留函式簽名，FlowEngine 無感） |
| **不動** | `src/composables/useFlowEngine.ts` | 透過 `MachineDef` 介面存取，介面相容則無需改動 |
| **不動** | `src/store/flowStore.ts` | 不依賴機器型別 |

### 相容橋接策略

`flow.ts` 中的 `MachineDef` 是 FlowEngine 內部使用的介面。  
`machine.ts` 中的 `Machine` 是機器定義物件的正式型別。  
兩者在 Phase 1 通過 re-export 橋接，避免 FlowEngine 改動：

```typescript
// src/types/flow.ts（修改，加入橋接）
export type { Machine as MachineDef, PortDef, PortSide } from '@/types/machine'
// 同時移除 flow.ts 中原有的 PortSide、PortDef、MachineDef 定義（避免重複）
```

---

## 5. 遷移說明

### machines.json → machines.ts

對照 `docs/aaaaa/data/machines.json` 逐台轉換：
- `input_ports` / `output_ports` 中的 `side` 值直接對應（JSON 中為小寫英文，已相容）
- 所有行為函式初始值為 `null`
- 確認 `power`：JSON 中 `0.0` 轉為 `0`；目前 `devices.ts` stub 中填 `-1` 的待補值，以 JSON 實際數值為準

### Port 資料完整性

現有 `devices.ts` stub 中多台機器的 port 定義為空陣列（`inputPorts: []`），原因是資料尚未補齊。  
本次遷移應以 `machines.json` 中的完整 port 資料為準補齊。

### 尚未定義的 port 機器

以下機器在 `machines.json` 中 `input_ports` 或 `output_ports` 為空陣列（功能面暫不接管管線）：
- 倉庫存取類：協議儲存箱、倉庫存貨口、倉庫取貨口、儲液罐、倉庫存取線基段 / 源樁、暗管入口 / 出口、多口暗管入口 / 出口
- 農業類：採種機、種植機、廢水處理機
- 電力類：供電樁、息壤供電樁、中繼器、息壤中繼器、熱能池

這些機器在 `machines.ts` 中照實轉換（空陣列），行為函式全為 `null`。

---

## 6. 開發日誌

### 2026-05-22 — V1-C1 + V1-D1 完成（型別橋接與 devices.ts 委託）

- `src/types/flow.ts`：移除舊版 `PortSide`、`PortDef`、`MachineDef` 定義（camelCase 版本）
- 以 re-export bridge 取代：`export type { Machine as MachineDef, PortDef, PortSide, PortType } from '@/types/machine'`
- `src/data/devices.ts`：移除 `MACHINE_DEFS` 靜態陣列（14 台），`getMachineDef()` 改委託 `getMachine()`
- `getAllMachines()` 同步委託至 `getAllMachinesFromStore`（來自 machines.ts）
- `useFlowEngine.ts`：2 個屬性名對齊（`isSource/isSink` → `is_source/is_sink`）
- `pnpm type-check` 零錯誤，`pnpm test --run` 27/27 通過
- V1-E1 + V1-E2 同步完成

### 2026-05-22 — V1-B3 完成（液體 Port 人工標記）

- `PortDef` 新增 `type: PortType` 欄位（`'item' | 'liquid'`）
- 決策理由：固體輸送帶與液體管道屬不同連接介質，連線驗證與 FlowEngine 流量計算需要區分
- 型別定義已更新至 `src/types/machine.ts`
- 開發者手動確認 `src/data/machines.ts` 中所有 21 個 liquid port（精煉爐汙水、反應池液體進出、灌裝機液體進料、提純機、天有洪爐液體入口等）
- `pnpm type-check` 零錯誤（V1-B3 完成後消除型別錯誤）

### 2026-05-22 — V1-B 完成（機器資料轉換）

- 建立 `src/data/machines.ts`，完整轉換 machines.json 全部 39 台機器（JSON 實際數量為 39，非 35）
- 補齊所有 port 定義（灌裝機、研磨機、反應池、天有洪爐、提純機、拆解機、裝備原件機、封裝機等）
- 額外補充 FlowEngine 專用節點：物品輸出口（is_source=true）、物品輸入口（is_sink=true）
- `MACHINES` map 共 41 筆（39 + 2 個 FlowEngine 專用），提供 `getMachine()` / `getAllMachines()` 查詢函式
- `pnpm type-check` 零錯誤，`pnpm test --run` 27 條全數通過
- 備註：todolist 原記載「35 台」為估算值，實際以 JSON 資料為準

### 2026-05-22 — V1-A 完成（型別模組）

- 建立 `src/types/machine.ts`，包含完整型別定義與旋轉工具函式
- `pnpm type-check` 零錯誤，`pnpm test --run` 27 條全數通過
- V1-A1 與 V1-A2 標記完成

### 2026-05-22 — 初版規劃

- 確立方案 A（絕對方位 + offset）作為 port 靜態表示方式，旋轉交由工具函式處理
- 定義 `Machine` 介面，含四個 null 佔位行為函式：`onTick`、`onInput`、`onOutput`、`calcEfficiency`
- 規劃 `src/types/machine.ts` + `src/data/machines.ts` 作為新模組
- 決定以相容橋接（re-export）保留 `MachineDef`，FlowEngine 無需改動
- 記錄 offset 旋轉轉換規則（4 種方位各自的翻轉邏輯）
