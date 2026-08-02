# L1 API Reference — L2/L3 開發者使用手冊

**版本：** V5  
**建立日期：** 2026-06-06  
**負責人：** aaaaa (CR-04)  
**適用對象：** L2 容器層（harry, toby）、L3 元件層（avery, goodmorning, MBD）

---

## 目錄

1. [總覽](#總覽)
2. [useEditorStore](#useeditorstore)
3. [useCanvasStore](#usecanvasstore)
4. [useFlowStore](#useflowstore)
5. [useValidationStore](#usevalidationstore)
6. [useSelectionStore](#useselectionstore)
7. [useHistoryStore](#usehistorystore)
8. [通用注意事項](#通用注意事項)

---

## 總覽

L1 基礎建設層提供 **6 個 Pinia stores**，負責管理：

| Store | 職責 | 可變性 | 歷史記錄 |
|-------|------|--------|----------|
| `useEditorStore` | 藍圖狀態（設備、管線） | ✅ L2 可修改（透過 8 個 actions） | ✅ 進歷史 |
| `useCanvasStore` | 畫布視角（縮放、平移、格線） | ✅ L2 可修改 | ❌ 不進歷史 |
| `useFlowStore` | FlowEngine 計算結果 | ⛔ 唯讀（L1 寫入） | ❌ 不進歷史 |
| `useValidationStore` | Detector 警示結果 | ⛔ 唯讀（L1 寫入） | ❌ 不進歷史 |
| `useSelectionStore` | 畫布選取狀態 | ✅ L2 可修改 | ❌ 不進歷史 |
| `useHistoryStore` | Undo / Redo 堆疊 | 🔸 L2 僅可呼叫 undo/redo | - |

### 核心設計原則

1. **單一資料流（Unidirectional Data Flow）**
   - 藍圖變動 → editorStore actions → historyStore.execute()
   - editorStore 變動 → watch 觸發 → useValidation / useFlowEngine 自動重算
   - L2/L3 只需呼叫 editorStore actions，無需手動觸發計算

2. **Command Pattern 歷史記錄**
   - 所有 editorStore 的 8 個 actions 內部自動組裝 Command
   - L2 **不應直接呼叫 `historyStore.execute()`**
   - L2 **不應自己組裝 Command**
   - L2 只應呼叫 `historyStore.undo()` / `redo()`（響應快捷鍵）

3. **唯讀衍生狀態**
   - `flowStore` / `validationStore` 為唯讀，L2/L3 僅消費數據
   - 計算由 L1 的 composables 自動完成，L2 無需手動觸發

---

## useEditorStore

**檔案位置：** `src/store/editorStore.ts`  
**主責：** CR-01 (azure9572) + CR-02 (管線邏輯)  
**用途：** 管理藍圖資料（設備節點、管線連接），提供 8 個高階 actions 供 L2 呼叫

### State（唯讀，透過 actions 修改）

| 欄位 | 類型 | 說明 |
|------|------|------|
| `nodes` | `FactoryNode[]` | 所有已擺放設備 |
| `edges` | `FactoryEdge[]` | 所有管線連接 |
| `currentPlan` | `Plan \| null` | 目前載入的藍圖方案 |
| `activeTool` | `ToolMode` | 目前工具模式（'select' / 'place' / 'connect' / 'delete'） |
| `selectedEquipment` | `EquipmentType \| null` | 準備擺放的設備類型 |

### Actions（L2 呼叫這些）

#### 1. placeDevice(node)

新增設備到畫布。

```typescript
placeDevice(node: FactoryNode): void
```

**說明：** 將設備加入 `nodes` 陣列，並自動建立 Command 進歷史。

**範例：**
```typescript
const editorStore = useEditorStore()
editorStore.placeDevice({
  id: crypto.randomUUID(),
  type: 'default',
  position: { x: 200, y: 300 },
  data: { 
    label: '精煉爐', 
    machineType: 'furnace',  // 使用 Machine.id
    recipeIndex: 0, 
    rotation: 0 
  },
})
```

**注意事項：**
- `id` 必須唯一（建議用 `crypto.randomUUID()`）
- `machineType` 應使用 `Machine.id`（非中文名，V5-D1 遷移中）
- 自動進歷史，Ctrl+Z 可復原

---

#### 2. moveDevices(uids, delta)

批次移動設備（**主動套用位移**，例如快捷鍵微調、Dev 測試頁）。

```typescript
moveDevices(uids: string[], delta: { x: number; y: number }): void
```

**說明：** 依 `delta` 向量移動指定設備，整組視為單一歷史項目。

**範例：**
```typescript
editorStore.moveDevices(['dev-a', 'dev-b'], { x: 40, y: -20 })
```

**注意事項：**
- 傳入空陣列會靜默返回（無操作）
- 一次 undo 可還原整組移動
- `delta` 為像素單位（非格子）
- **不要**在 Vue Flow 拖曳結束時呼叫本 API（會造成位移套用兩次）；拖曳請用下方 `commitDeviceMove`

---

#### 2b. commitDeviceMove(uids, before)（V6）

確認「畫面上已是最終位置」的移動並寫入歷史（供拖曳）。

```typescript
import type { DevicePositionSnapshot } from '@/types/editor'

commitDeviceMove(uids: string[], before: DevicePositionSnapshot): void
// DevicePositionSnapshot = Record<string, { x: number; y: number }>
```

**說明：** Vue Flow `v-model:nodes` 拖曳期間已改寫 `position`。拖曳結束時呼叫本 action：不再套用位移，只把 before→after 記成單一歷史項目。零位移不進歷史。管線跟隨留待 CR-02。

**範例：**
```typescript
// node-drag-start 記錄 before；node-drag-stop：
editorStore.commitDeviceMove(['dev-a'], { 'dev-a': { x: 0, y: 0 } })
```

**注意事項：**
- L2 不得自行 `historyStore.execute` 組移動 Command
- before 與目前座標相同 → 靜默不進歷史
- undo / redo 使用絕對座標快照，避免漂移

---

#### 3. rotateDevice(uid, rotation)

旋轉單一設備。

```typescript
rotateDevice(uid: string, rotation: Rotation): void
```

**說明：** 設定設備旋轉次數（0/1/2/3 對應 0°/90°/180°/270°）。

**範例：**
```typescript
editorStore.rotateDevice('dev-uuid', 1)  // 順時針轉 90°
```

**注意事項：**
- `Rotation` 類型為 `0 | 1 | 2 | 3`
- 若 uid 不存在或 rotation 與目前相同，靜默返回
- 旋轉會影響設備佔據格子與 port 方位（CR-03 detector 會檢查）

---

#### 4. removeDevices(uids)

批次刪除設備（連帶刪除相關管線）。

```typescript
removeDevices(uids: string[]): void
```

**說明：** 刪除指定設備及其所有連接的管線，整組視為單一歷史項目。

**範例：**
```typescript
const selection = useSelectionStore()
editorStore.removeDevices(selection.selectedNodeIds)
selection.clearSelection()
```

**注意事項：**
- 自動刪除 source 或 target 為這些 uid 的管線
- 刪除後建議呼叫 `selectionStore.clearSelection()`
- 一次 undo 可還原整組刪除（含管線）

---

#### 5. setRecipe(uid, recipeIndex)

變更設備配方。

```typescript
setRecipe(uid: string, recipeIndex: number): void
```

**說明：** 修改設備的配方索引，對應 `getRecipesForMachine(machineType)[recipeIndex]`。

**範例：**
```typescript
editorStore.setRecipe('dev-uuid', 2)  // 切換到第 3 個配方
```

**注意事項：**
- 若 uid 不存在或 recipeIndex 與目前相同，靜默返回
- 配方變更會觸發 FlowEngine 重算（150ms debounce）
- 配方索引超出範圍不會報錯（由 CR-03 detector 偵測）

---

#### 6. pasteSelection(copiedNodes, copiedEdges, offset)

框選複製貼上（含管線）。

```typescript
pasteSelection(
  copiedNodes: FactoryNode[],
  copiedEdges: FactoryEdge[],
  offset: { x: number; y: number }
): void
```

**說明：** 複製設備與管線，產生新 uid 並位移，整組視為單一歷史項目。

**範例：**
```typescript
const selectedNodes = editorStore.nodes.filter(n => 
  selection.selectedNodeIds.includes(n.id)
)
const selectedEdges = editorStore.edges.filter(e =>
  selection.selectedNodeIds.includes(e.source) &&
  selection.selectedNodeIds.includes(e.target)
)
editorStore.pasteSelection(selectedNodes, selectedEdges, { x: 60, y: 0 })
```

**注意事項：**
- 只有兩端設備都在 `copiedNodes` 內的管線會被複製
- 所有 uid 會重新生成（`crypto.randomUUID()`）
- 傳入空陣列會靜默返回

---

#### 7. addConnection(edge)

新增管線。

```typescript
addConnection(edge: FactoryEdge): void
```

**說明：** 新增單條管線連接，Phase 1 不處理 autoNode（分流/匯流）自動生成。

**範例：**
```typescript
editorStore.addConnection({
  id: crypto.randomUUID(),
  source: 'dev-a',
  target: 'dev-b',
  sourceHandle: 'port-0-out',
  targetHandle: 'port-0-in',
})
```

**注意事項：**
- `id` 必須唯一
- `sourceHandle` / `targetHandle` 格式由 CR-02 規範（目前 Phase 1 可省略）
- CR-02 將在後續版本補上分流 / 匯流 macro 邏輯

---

#### 8. removeConnection(uid)

刪除單一管線。

```typescript
removeConnection(uid: string): void
```

**說明：** 刪除指定管線連接。

**範例：**
```typescript
editorStore.removeConnection('edge-uuid')
```

**注意事項：**
- 若 uid 不存在，靜默返回
- 管線刪除不會自動刪除設備

---

### Getters（唯讀）

| Getter | 類型 | 說明 |
|--------|------|------|
| `deviceCount` | `number` | 設備總數 |
| `connectionCount` | `number` | 管線總數 |

### ⚠️ 禁止事項

- ❌ 不要直接 mutate `editorStore.nodes` 或 `editorStore.edges`
- ❌ 不要繞過 actions 直接修改 store state
- ❌ 不要自己組裝 Command 呼叫 `historyStore.execute()`

---

## useCanvasStore

**檔案位置：** `src/store/canvasStore.ts`  
**主責：** CR-01 (azure9572)  
**用途：** 管理畫布視角狀態（縮放、平移、格線），**不進歷史**

### State

| 欄位 | 類型 | 說明 |
|------|------|------|
| `gridSize` | `number` | 單格像素大小（隨縮放變化） |
| `offset` | `{ x: number; y: number }` | 畫布平移偏移（像素） |
| `zoom` | `number` | 縮放倍率（1 = 100%） |
| `baseRegion` | `BaseRegion` | 目前選定的基地（'wuling' / 'valley4' / null） |
| `showGrid` | `boolean` | 是否顯示格線 |

### Getters

| Getter | 類型 | 說明 |
|--------|------|------|
| `canvasSize` | `{ w: number; h: number } \| null` | 目前基地的格子尺寸（null = 自由畫布） |

### Actions

```typescript
setZoom(value: number): void            // 設定縮放倍率（clamp 至 [0.1, 4]）
setOffset(o: { x: number; y: number }): void  // 設定平移偏移
setBaseRegion(region: BaseRegion): void       // 切換基地
toggleGrid(): void                            // 切換格線顯示
setGridSize(size: number): void               // 設定格線大小（最小 8px）
```

**範例：**
```typescript
const canvasStore = useCanvasStore()
canvasStore.setZoom(1.5)
canvasStore.toggleGrid()
canvasStore.setBaseRegion('wuling')
```

**注意事項：**
- 視角狀態不進歷史（Ctrl+Z 不會還原縮放/平移）
- 切換基地時不自動調整視角，由 L2 決定是否 reset

---

## useFlowStore

**檔案位置：** `src/store/flowStore.ts`  
**主責：** CR-04 (aaaaa)  
**用途：** 儲存 FlowEngine 計算結果，**L2/L3 唯讀**

### State（唯讀，由 useFlowEngine 寫入）

| 欄位 | 類型 | 說明 |
|------|------|------|
| `edgeFlows` | `Map<string, EdgeFlow>` | connectionUid → 管線流量 |
| `nodeEfficiencies` | `Map<string, number>` | deviceUid → 效率 0~1 |
| `itemSummary` | `ItemSummary[]` | 品項統計摘要（產量/消耗/淨值） |
| `sinkDeliveries` | `Map<string, number>` | itemId → 物品輸入口交付量（個/min） |
| `congestedEdges` | `Set<string>` | 堵塞管線 uid 集合 |
| `invalidChainUids` | `Set<string>` | 非合法鏈路設備 uid 集合（灰色顯示） |
| `totalPowerDemand` | `number` | 總耗電量（kW） |
| `totalPowerSupply` | `number` | 總供電量（kW） |
| `isCalculating` | `boolean` | FlowEngine 計算中 flag |
| `lastCalculatedAt` | `number` | 最後計算完成的 timestamp（ms） |

### Getters

| Getter | 類型 | 說明 |
|--------|------|------|
| `powerBalance` | `number` | 電力盈餘（kW），正 = 盈餘，負 = 不足 |
| `hasPowerShortage` | `boolean` | 是否有電力不足 |
| `edgeFlowCount` | `number` | 有效管線數量 |
| `congestedEdgeCount` | `number` | 堵塞管線數量 |
| `invalidChainCount` | `number` | 非合法鏈路節點數量 |
| `hasResults` | `boolean` | 是否有任何計算結果 |

### 型別定義

```typescript
interface EdgeFlow {
  connectionUid: string
  itemId: string
  rate: number          // 個/min
  isCongested: boolean  // 是否堵塞（下游滿載）
}

interface ItemSummary {
  itemId: string
  name: string
  produced: number      // 總產量（個/min）
  consumed: number      // 總消耗（個/min）
  net: number           // 淨值（produced - consumed）
  efficiency: number    // 平均效率 0~1
}
```

### 使用範例

```typescript
const flowStore = useFlowStore()

// 取得管線流量（在 FactoryCanvas overlay 顯示）
const flow = flowStore.edgeFlows.get(edge.id)
if (flow) {
  console.log(`${flow.itemId}: ${flow.rate.toFixed(1)} 個/min`)
}

// 取得設備效率（顯示效率顏色）
const efficiency = flowStore.nodeEfficiencies.get(device.id) ?? 0
const colorClass = efficiency >= 1 ? 'text-green-500'
  : efficiency >= 0.5 ? 'text-yellow-400'
  : efficiency > 0 ? 'text-orange-400'
  : 'text-gray-400'

// 電力統計（統計面板顯示）
if (flowStore.hasPowerShortage) {
  console.log(`⚠️ 電力不足 ${Math.abs(flowStore.powerBalance)} kW`)
} else {
  console.log(`✅ 電力盈餘 ${flowStore.powerBalance} kW`)
}
```

**注意事項：**
- ⛔ **L2/L3 不應修改 flowStore 任何欄位**
- FlowEngine 會在 editorStore 變動後 **150ms debounce** 自動觸發
- `invalidChainUids` 包含環路、孤立節點、非法鏈路的設備，畫布應顯示灰色

---

## useValidationStore

**檔案位置：** `src/store/validationStore.ts`  
**主責：** CR-03 (shirone)  
**用途：** 收集 detector 警示結果，供 FlowEngine 過濾與統計面板顯示

### State（唯讀，由 useValidation 寫入）

| 欄位 | 類型 | 說明 |
|------|------|------|
| `alerts` | `Alert[]` | 所有目前有效的警示 |
| `detectors` | `Detector[]` | 已註冊的 detector 列表 |

### Getters

| Getter | 類型 | 說明 |
|--------|------|------|
| `errorCount` | `number` | Error 等級警示數量 |
| `warningCount` | `number` | Warning 等級警示數量 |
| `hasAnyError` | `boolean` | 是否存在任何 Error 警示 |

### Methods（L2 可用）

```typescript
hasBlockingError(deviceUid: string): boolean
// 查詢指定設備是否有 blocking error（FlowEngine 用以略過該節點）

alertsByDevice(deviceUid: string): Alert[]
// 取得指定設備的所有警示

alertsByConnection(connectionUid: string): Alert[]
// 取得指定管線的所有警示
```

### 型別定義

```typescript
interface Alert {
  uid: string
  level: 'error' | 'warning'
  code: string                  // 例如 'E001', 'W003'
  message: string               // 人類可讀說明
  relatedDeviceUids: string[]   // 相關設備 uid
  relatedConnectionUids: string[]  // 相關管線 uid
}
```

### 使用範例

```typescript
const validationStore = useValidationStore()

// 檢查設備是否有錯誤（畫布紅框顯示）
const hasError = validationStore.hasBlockingError(device.id)

// 取得設備警示列表（Inspector 面板顯示）
const deviceAlerts = validationStore.alertsByDevice(device.id)
deviceAlerts.forEach(alert => {
  console.log(`[${alert.code}] ${alert.message}`)
})

// 統計面板顯示警示摘要
if (validationStore.hasAnyError) {
  console.log(`⚠️ ${validationStore.errorCount} 個錯誤`)
}
```

**注意事項：**
- ⛔ **L2/L3 不應修改 validationStore 任何欄位**
- ⛔ **L2/L3 不應直接呼叫 `registerDetector`**（由 L1 初始化時註冊）
- useValidation composable 會在 editorStore 變動後**立即**觸發（無 debounce）
- FlowEngine 依賴 `hasBlockingError()` 過濾掉有錯誤的設備

---

## useSelectionStore

**檔案位置：** `src/store/selectionStore.ts`  
**主責：** CR-01 (azure9572)  
**用途：** 追蹤畫布選取狀態，**不進歷史**

### State

| 欄位 | 類型 | 說明 |
|------|------|------|
| `selectedNodeIds` | `string[]` | 目前選取的節點 uid 清單 |

### Getters

| Getter | 類型 | 說明 |
|--------|------|------|
| `hasSelection` | `boolean` | 是否存在任何選取 |
| `isMultiSelect` | `boolean` | 是否為多重選取（≥2） |

### Actions

```typescript
setSelection(ids: string[]): void  // 整批覆寫選取清單
clearSelection(): void             // 清空選取
```

**範例：**
```typescript
const selection = useSelectionStore()

// Vue Flow selection-change 事件處理
onSelectionChange((nodes) => {
  selection.setSelection(nodes.map(n => n.id))
})

// Delete 鍵處理
if (selection.hasSelection) {
  editorStore.removeDevices(selection.selectedNodeIds)
  selection.clearSelection()
}
```

**注意事項：**
- 選取狀態不進歷史（Ctrl+Z 不會還原選取）
- 刪除設備後建議主動呼叫 `clearSelection()`

---

## useHistoryStore

**檔案位置：** `src/store/historyStore.ts`  
**主責：** CR-08 (azure9572)  
**用途：** Command Pattern 歷史堆疊，提供 undo / redo

### State（唯讀）

| 欄位 | 類型 | 說明 |
|------|------|------|
| `undoStack` | `Command[]` | 已執行的 Command 堆疊 |
| `redoStack` | `Command[]` | 已 undo 的 Command 堆疊 |

### Getters

| Getter | 類型 | 說明 |
|--------|------|------|
| `canUndo` | `boolean` | 是否可以 undo |
| `canRedo` | `boolean` | 是否可以 redo |
| `undoDepth` | `number` | undo 堆疊深度 |
| `redoDepth` | `number` | redo 堆疊深度 |

### Actions（L2 僅可用這兩個）

```typescript
undo(): Command | null  // 復原上一個 Command
redo(): Command | null  // 取消復原上一個 undo 的 Command
```

**範例：**
```typescript
const historyStore = useHistoryStore()

// Ctrl+Z 快捷鍵處理
onKeyDown('z', { ctrl: true }, () => {
  if (historyStore.canUndo) {
    historyStore.undo()
  }
})

// Ctrl+Y 快捷鍵處理
onKeyDown('y', { ctrl: true }, () => {
  if (historyStore.canRedo) {
    historyStore.redo()
  }
})

// UI 按鈕 disabled 狀態
<button :disabled="!historyStore.canUndo">Undo</button>
```

### ⚠️ 禁止事項

- ❌ **L2 不應直接呼叫 `historyStore.execute()`**（由 editorStore actions 內部呼叫）
- ❌ **L2 不應自己組裝 Command**
- ❌ **L2 不應直接 mutate `undoStack` / `redoStack`**
- ✅ L2 只應呼叫 `undo()` / `redo()` 與讀取 `canUndo` / `canRedo`

---

## 通用注意事項

### 1. 資料流向

```
使用者操作（L2/L3）
  ↓
editorStore.action()
  ↓
historyStore.execute(Command)
  ↓
editorStore state 變更
  ↓
watch 觸發（useValidation / useFlowEngine）
  ↓
validationStore / flowStore 更新
  ↓
L3 元件自動響應（顯示警示 / 流量 overlay）
```

### 2. 不要繞過 L1 API

```typescript
// ❌ 錯誤：直接修改 store state
editorStore.nodes.push(newNode)

// ✅ 正確：使用 action
editorStore.placeDevice(newNode)
```

### 3. 不要自己觸發計算

```typescript
// ❌ 錯誤：手動呼叫 FlowEngine
runFlowEngine()

// ✅ 正確：editorStore 變動後自動觸發
editorStore.placeDevice(node)
// （150ms 後 FlowEngine 自動執行）
```

### 4. 不要自己組裝 Command

```typescript
// ❌ 錯誤：L2 自己組 Command
historyStore.execute({
  execute: () => { ... },
  undo: () => { ... },
})

// ✅ 正確：使用 editorStore action
editorStore.placeDevice(node)
// （action 內部會自動組 Command）
```

### 5. 效率顏色規則

FlowEngine 計算的效率值（0~1）對應 Tailwind class：

```typescript
function getEfficiencyClass(efficiency: number): string {
  if (efficiency >= 1) return 'text-green-500'      // 100%
  if (efficiency >= 0.5) return 'text-yellow-400'   // 50~99%
  if (efficiency > 0) return 'text-orange-400'      // 1~49%
  return 'text-gray-400'                            // 0%（無輸入或有錯誤）
}
```

### 6. 測試與驗證

開發時可使用 `/dev/*` 測試頁面：

- `/dev/flow-engine` — FlowEngine 手動測試（preset／拓樸／環路；含原 graph-viz 能力）
- `/dev/graph-viz` — **已退役**（轉址至 `/dev/flow-engine`，V9-H1-4）
- `/dev/history-replay` — 歷史記錄回放（undo/redo 測試）

僅在 `import.meta.env.DEV` 時可訪問，production build 不包含。

---

## 常見問題 FAQ

### Q1：如何新增一台設備？

```typescript
const editorStore = useEditorStore()
editorStore.placeDevice({
  id: crypto.randomUUID(),
  type: 'default',
  position: { x: 200, y: 300 },
  data: { label: '精煉爐', machineType: 'furnace', recipeIndex: 0 },
})
```

### Q2：如何刪除選取的設備？

```typescript
const editorStore = useEditorStore()
const selection = useSelectionStore()
editorStore.removeDevices(selection.selectedNodeIds)
selection.clearSelection()
```

### Q3：如何取得管線流量？

```typescript
const flowStore = useFlowStore()
const flow = flowStore.edgeFlows.get(edge.id)
if (flow) {
  console.log(`流量：${flow.rate.toFixed(1)} 個/min`)
}
```

### Q4：如何判斷設備有錯誤？

```typescript
const validationStore = useValidationStore()
const hasError = validationStore.hasBlockingError(device.id)
```

### Q5：如何實作 Ctrl+Z？

```typescript
const historyStore = useHistoryStore()
onKeyDown('z', { ctrl: true }, () => {
  if (historyStore.canUndo) historyStore.undo()
})
```

---

## 進階主題

### 自訂 Detector（CR-03 shirone）

L2/L3 不需要自己寫 detector，由 shirone 負責。  
若需新增 detector，參考 `docs/shirone/README.md`。

### FlowEngine 計算流程

詳細說明見 `docs/aaaaa/FLOW_ENGINE_GUIDE.md`（V5-C2）。

### 跨 CR 協調

- CR-01 遷移 `machineType` 為 `Machine.id`（V5-D1）
- CR-03 補齊 E001–E003 detector（shirone）
- CR-02 補上分流 / 匯流 macro 邏輯

---

**文件版本：** V5  
**最後更新：** 2026-06-06  
**維護者：** aaaaa (CR-04)  
**問題回報：** 見 `docs/aaaaa/TODOLIST.md` 封鎖項目追蹤
