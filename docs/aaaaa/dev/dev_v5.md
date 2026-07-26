# dev_V5 — L1 完成後的開發者支援與測試基礎設施

**版本：** V5  
**建立日期：** 2026-06-06  
**負責人：** aaaaa  
**對應 TODO：** [todolist_v5.md](./todolist_v5.md)

---

## 1. 背景與動機

### 1.1 L1 完成狀態

根據 `docs/aaaaa/L1_PR.md`，L1 基礎建設層已於 2026-06 完成，包含：

| 模組 | 狀態 | 說明 |
|------|------|------|
| CR-04 FlowEngine | ✅ 完成 | 靜態流量分析引擎，含 buildGraph / topologicalSort / propagateFlows 等核心演算法 |
| CR-08 historyStore | ✅ 完成 | Command Pattern 實作，支援 undo / redo |
| CR-01 + CR-02 editorStore | ✅ 完成 | 8 個高階 actions（placeDevice / moveDevices / addConnection 等） |
| CR-01 canvasStore | ✅ 完成 | 視角狀態管理（zoom / offset / gridSize） |
| CR-03 validationStore | ✅ 骨架完成 | Detector 註冊機制與 alerts 收集，等 shirone 補 detector 邏輯 |
| useShortcuts | ✅ 重寫完成 | Ctrl+Z/Y 真接通 historyStore |
| selectionStore | ✅ 完成 | 選取狀態管理 |
| Tests | ✅ 197 個案例 | 含 FlowEngine H1–H6 整合測試與各 store 單元測試 |
| 三層架構文件 | ✅ 完成 | L1/L2/L3 職責定義與個人引導文件 |

### 1.2 V5 目標

L1 完成後，L2（harry / toby）、L3（goodmorning / avery / MBD）、CR-03（shirone）、CR-05（azure9572）等成員準備開始工作。

V5 版本目標：**為其他層級與 CR 提供開發者支援與測試基礎設施**，確保他們能夠：

1. **快速驗證 L1 功能**：透過 dev-only 測試頁面，無需啟動完整 UI 即可測試 FlowEngine / historyStore
2. **理解 L1 介面**：透過清晰的 API 文件，知道如何使用 stores 與 composables
3. **取得必要工具**：geometryUtils 等 helper 函式，支援 detector 開發
4. **避免常見錯誤**：透過文件與範例，了解「不可為」清單（如直接 mutate store、自己組 Command）

### 1.3 與前版本的關係

| 版本 | 主題 | 狀態 |
|------|------|------|
| V1 | Machine 物件動態化重構 | ✅ 完成 |
| V2 | 調度券兌換效率與倉庫填滿預估 | ✅ 完成 |
| V3 | 技術債修正 | ✅ 完成 |
| V4 | 主編 0526 介面設計建議修正 | ✅ 完成 |
| **V5** | **開發者支援與測試基礎設施** | 🚧 規劃中 |

---

## 2. 技術決策

### 2.1 dev-only 頁面實作方式

#### 問題

L1 成員需要獨立測試環境驗證算法正確性，但測試頁面不應進入 production bundle，也不該出現在正式 UI 的導航中。

#### 方案比較

| 方案 | 實作方式 | 優點 | 缺點 |
|------|---------|------|------|
| **方案 A（選擇）** | 使用 Vue Router + route guard（`import.meta.env.DEV`） | 可複用現有 Vue 元件生態、URL 可直接分享、易於整合 stores | 需額外建立路由設定 |
| 方案 B | 獨立 HTML 檔案（放在 `public/dev/`） | 完全獨立，不進 production bundle | 無法使用 Vue 元件、無法直接存取 Pinia stores |
| 方案 C | Vitest UI | 可直接執行測試案例 | 不適合互動式探索（如手動調整 JSON 輸入） |

**決策：採用方案 A**。理由：
- dev 頁面需要呼叫 `runFlowEngine()` 等 composables，方案 A 可直接 import
- 可複用 Nuxt UI 元件（按鈕、輸入框、表格），開發速度快
- route guard 確保 production build 時完全移除

#### Route guard 實作

```typescript
// src/router/index.ts
const routes = [
  // ... 正式路由
  {
    path: '/dev',
    component: () => import('@/app/dev/DevLayout.vue'),
    beforeEnter: (to, from, next) => {
      if (import.meta.env.DEV) {
        next()
      } else {
        next('/') // production 環境重定向至首頁
      }
    },
    children: [
      { path: 'flow-engine', component: () => import('@/app/dev/FlowEngineTest.vue') },
      { path: 'graph-viz', component: () => import('@/app/dev/GraphViz.vue') },
      { path: 'history-replay', component: () => import('@/app/dev/HistoryReplay.vue') },
    ]
  }
]
```

---

### 2.2 geometryUtils 介面設計

#### 問題

CR-03 detector 需要檢查設備重疊（E001）、佈線違法（E002）等幾何問題，需要計算設備佔據的格子、檢查重疊等功能。

#### 方案比較

| 方案 | 回傳格式 | 優點 | 缺點 |
|------|---------|------|------|
| **方案 A（選擇）** | `Set<string>`（格式 `"x,y"`） | 可直接用 Set 操作檢查重疊、記憶體效率高 | 需要 parse 字串取回座標 |
| 方案 B | `Array<{x: number, y: number}>` | 型別明確、易於理解 | 檢查重疊需手動迴圈比對，效能較差 |
| 方案 C | `Set<{x: number, y: number}>` | 型別明確且可用 Set | JS Set 無法正確比對物件（需自訂 hash） |

**決策：採用方案 A**。理由：
- `Set<string>` 的交集檢查可用 `[...set1].some(cell => set2.has(cell))`，效能最佳
- 字串格式簡單明確，debug 時易於閱讀
- 若未來需要座標，可用 `cell.split(',').map(Number)` 解析

#### API 設計

```typescript
// src/utils/geometryUtils.ts

/**
 * 計算設備佔據的所有格子座標（考慮旋轉與尺寸）
 * @returns Set<"x,y"> 格式的格子集合
 */
export function getOccupiedCells(
  device: FactoryNode,
  def: Machine
): Set<string> {
  const { x, y } = device.position
  const rotation = device.data.rotation ?? 0
  const { width, height } = def

  // 旋轉後的實際寬高
  const [w, h] = rotation % 2 === 0 ? [width, height] : [height, width]

  const cells = new Set<string>()
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      cells.add(`${x + dx},${y + dy}`)
    }
  }
  return cells
}

/**
 * 檢查兩個格子集合是否有重疊
 */
export function cellsOverlap(
  cells1: Set<string>,
  cells2: Set<string>
): boolean {
  // 優化：先檢查較小的集合
  const [smaller, larger] = cells1.size < cells2.size ? [cells1, cells2] : [cells2, cells1]
  return [...smaller].some(cell => larger.has(cell))
}

/**
 * 檢查座標是否在基地範圍內
 */
export function isWithinBaseRegion(
  x: number,
  y: number,
  baseRegion: BaseRegion
): boolean {
  return (
    x >= baseRegion.x &&
    x < baseRegion.x + baseRegion.width &&
    y >= baseRegion.y &&
    y < baseRegion.y + baseRegion.height
  )
}
```

---

### 2.3 ValidationContext 完整性確認

#### 問題

`src/lib/validation/detectors/E001_deviceOverlap.ts` 的 stub 中，`run(ctx: ValidationContext)` 需要存取設備列表、基地範圍等資訊。需確認 `ValidationContext` 是否已包含所有必要欄位。

#### 現狀檢查

根據 `src/types/validation.ts`（L1_PR 交付版本），`ValidationContext` 定義如下：

```typescript
export interface ValidationContext {
  devices: FactoryNode[]           // ✅ 已有
  connections: FactoryEdge[]       // ✅ 已有
  getDef: (machineId: string) => Machine | undefined  // ✅ 已有
  // baseRegion: BaseRegion?       // ❓ 待確認
}
```

**決策：新增 `baseRegion` 欄位**。理由：
- E001（設備重疊）需檢查設備是否在基地範圍內
- E002（佈線違法）可能需檢查管線是否跨越基地邊界
- `baseRegion` 可從 `canvasStore.baseRegion` 取得

#### 修改計畫

```typescript
// src/types/validation.ts
export interface BaseRegion {
  x: number
  y: number
  width: number
  height: number
}

export interface ValidationContext {
  devices: FactoryNode[]
  connections: FactoryEdge[]
  getDef: (machineId: string) => Machine | undefined
  baseRegion: BaseRegion  // ← 新增
}
```

```typescript
// src/composables/useValidation.ts
import { useCanvasStore } from '@/store/canvasStore'

const canvasStore = useCanvasStore()

const ctx: ValidationContext = {
  devices: editorStore.nodes,
  connections: editorStore.edges,
  getDef: (id) => getMachineById(id),
  baseRegion: canvasStore.baseRegion  // ← 新增
}
```

---

### 2.4 L1 API 文件結構設計

#### 問題

L2/L3 成員需要快速查找「某個功能應該呼叫哪個 store 的哪個 action」，單一巨大文件不易檢索。

#### 方案比較

| 方案 | 結構 | 優點 | 缺點 |
|------|------|------|------|
| **方案 A（選擇）** | 單一 `L1_API_REFERENCE.md`，按 store 分章節 | 可用 Ctrl+F 快速搜尋、易於維護 | 檔案較長（預估 500+ 行） |
| 方案 B | 每個 store 獨立一份文件（如 `editorStore_API.md`） | 檔案較短、職責明確 | 需在多個檔案間切換 |
| 方案 C | 使用 TypeDoc 自動生成 | 自動同步程式碼 | 需額外配置、輸出格式較死板 |

**決策：採用方案 A**。理由：
- L1 只有 6 個 stores，單一文件長度可接受
- 可用 Markdown 目錄（Table of Contents）快速跳轉
- 便於補充跨 store 的使用情境說明（如「擺設備後如何觸發 FlowEngine」）

#### 文件大綱

```markdown
# L1 API Reference

## 目錄
- [useEditorStore](#useeditorstore)
- [useCanvasStore](#usecanvasstore)
- [useFlowStore](#useflowstore)
- [useValidationStore](#usevalidationstore)
- [useSelectionStore](#useselectionstore)
- [useHistoryStore](#usehistorystore)
- [常見使用情境](#常見使用情境)

## useEditorStore

### State
- `nodes: FactoryNode[]` — 畫布上所有設備
- `edges: FactoryEdge[]` — 畫布上所有管線

### Actions

#### `placeDevice(device: FactoryNode): void`
**說明**：在畫布上擺放一台設備，自動推入 historyStore 的 undo stack。

**範例**：
```typescript
const editor = useEditorStore()
editor.placeDevice({
  id: 'device-1',
  type: 'factory-device',
  position: { x: 10, y: 10 },
  data: { label: '精煉爐', machineType: 'refinery', recipeIndex: 0, rotation: 0 }
})
```

**注意事項**：
- ⚠️ L2 不可直接 push 到 `nodes` 陣列，必須透過此 action
- ⚠️ L2 不需要也不該自己呼叫 `historyStore.execute()`，action 內部已處理

（以下依此格式列出其他 actions...）
```

---

## 3. 檔案結構設計

### 3.1 dev 頁面檔案組織

```
src/app/dev/
├── DevLayout.vue          ← 共用佈局（含導航列表）
├── FlowEngineTest.vue     ← /dev/flow-engine
├── GraphViz.vue           ← /dev/graph-viz
└── HistoryReplay.vue      ← /dev/history-replay
```

### 3.2 utils 模組

```
src/utils/
├── portUtils.ts           ← 已存在（V4 新增）
└── geometryUtils.ts       ← V5 新增
```

### 3.3 開發文件組織

```
docs/aaaaa/
├── dev/
│   ├── dev_v5.md          ← 本文件
│   ├── todolist_v5.md     ← 工項清單
│   └── dev_v5/            ← V5 各工項的詳細技術文件（子資料夾）
│       ├── A2_flow_engine_test.md
│       ├── A3_graph_viz.md
│       ├── A4_history_replay.md
│       ├── B1_geometry_utils.md
│       ├── B2_validation_context.md
│       ├── B3_e001_example.md
│       ├── C1_api_reference.md
│       ├── C2_flow_engine_guide.md
│       ├── C3_l2_readme_update.md
│       ├── D1_cr01_migration_tracking.md
│       ├── D2_history_format_tracking.md
│       ├── D3_detector_checklist.md
│       ├── E1_agent_context_update.md
│       ├── E2_agent_md_update.md
│       └── E3_readme_update.md
├── L1_API_REFERENCE.md    ← V5 新增（C1 工項）
├── FLOW_ENGINE_GUIDE.md   ← V5 新增（C2 工項）
└── report_v5.md           ← V5 完成後建立
```

---

## 4. 實作優先序

```
V5-A（dev 頁面）
  ↓
V5-B（geometryUtils）
  ↓
V5-C（文件）
  ∥
V5-D（跨 CR 協調）
  ↓
V5-E（Agent 更新）
  ↓
V5-F（驗證）
```

**並行規則**：
- V5-C 與 V5-D 可同時進行（互不依賴）
- V5-E 可在 A/B/C/D 任一完成後開始（因為是文件更新）

---

## 5. 品質標準

### 5.1 dev 頁面（V5-A）

- ✅ 可在開發環境正常訪問（`http://localhost:5173/dev/...`）
- ✅ production build 時完全移除（route guard 生效）
- ✅ 可正確呼叫 `runFlowEngine()` / `historyStore.undo()` 等 L1 功能
- ✅ UI 清晰易用（可用 Nuxt UI 元件，但不強求精美設計）

### 5.2 geometryUtils（V5-B）

- ✅ `pnpm type-check` 零錯誤
- ✅ 單元測試覆蓋率 > 80%（至少含以下案例）
  - `getOccupiedCells`：0° / 90° / 180° / 270° 旋轉測試
  - `cellsOverlap`：有重疊 / 無重疊 / 邊界接觸
  - `isWithinBaseRegion`：內部 / 外部 / 邊界
- ✅ JSDoc 完整（每個函式含 `@param` / `@returns` / `@example`）

### 5.3 文件（V5-C）

- ✅ 所有內部連結可正常訪問（無 404）
- ✅ 所有 code block 標註正確語言（```typescript）
- ✅ API 範例可編譯執行（不含語法錯誤）
- ✅ 「不可為」清單明確列出（如「禁止直接 mutate store.nodes」）

---

## 6. 遷移說明

### 6.1 現有 detector stub 遷移

`src/lib/validation/detectors/E001_deviceOverlap.ts` 目前為空 stub（僅有 `run()` 框架）。

V5-B3 將補充**範例實作**（非完整版），示範如何使用 `getOccupiedCells`：

```typescript
// V5-B3 範例（shirone 後續可依此擴充）
export const E001_deviceOverlap: Detector = {
  code: 'E001',
  level: 'error',
  run(ctx: ValidationContext): Alert[] {
    const alerts: Alert[] = []
    const devices = ctx.devices

    for (let i = 0; i < devices.length; i++) {
      const deviceA = devices[i]
      const defA = ctx.getDef(deviceA.data.machineType)
      if (!defA) continue

      const cellsA = getOccupiedCells(deviceA, defA)

      for (let j = i + 1; j < devices.length; j++) {
        const deviceB = devices[j]
        const defB = ctx.getDef(deviceB.data.machineType)
        if (!defB) continue

        const cellsB = getOccupiedCells(deviceB, defB)

        if (cellsOverlap(cellsA, cellsB)) {
          alerts.push({
            code: 'E001',
            level: 'error',
            message: `設備 ${deviceA.data.label} 與 ${deviceB.data.label} 重疊`,
            affectedUids: [deviceA.id, deviceB.id]
          })
        }
      }
    }

    return alerts
  }
}
```

> ⚠️ **注意**：此範例僅示範基本邏輯，實際 E001 還需檢查「設備是否超出基地範圍」等條件，由 shirone 補齊。

---

## 7. 開發日誌（日期倒序）

### 2026-06-06（V5 規劃）

- ✅ 建立 `dev_v5.md` 與 `todolist_v5.md`
- ✅ 確認技術決策：dev 頁面使用 Vue Router + route guard、geometryUtils 回傳 `Set<string>`
- ✅ 規劃 5 大工項群組（A~E）與 19 個子工項
- 🚧 待開始實作

---

*本文件持續更新，記錄 V5 版本的技術決策與實作進度。*
