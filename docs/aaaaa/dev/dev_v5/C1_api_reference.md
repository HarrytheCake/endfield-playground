# C1 — L1 API Reference

**對應工項**：V5-C1

---

## 1. 工項目標

建立 **L1 層 API 參考文件**，為 L2 / L3 開發者提供：

- 6 個 stores 的完整 API 簽名
- State 欄位說明
- Actions / Getters 使用範例
- 「不可為」清單（禁止直接 mutate 、禁止自己組 Command）

**文件位置**：`docs/L1_API_REFERENCE.md`

---

## 2. 文件結構

本文件應包含以下主要章節：

### 2.1 editorStore API

**State 欄位**：
- `nodes`: FactoryNode[]
- `edges`: FactoryEdge[]
- `activeTool`: Tool
- `selectedEquipment`: EquipmentType | null
- `placementArmed`: boolean

**高階 Actions**（自動進歷史）：
- `placeDevice(node: FactoryNode): void`
- `moveDevices(uids: string[], delta: { x, y }): void`
- `rotateDevice(uid: string, rotation: Rotation): void`
- `removeDevices(uids: string[]): void`
- `setRecipe(uid: string, recipeIndex: number): void`
- `pasteSelection(devices, connections, offset): void`
- `addConnection(edge: FactoryEdge): void`
- `removeConnection(uid: string): void`

**低階 Actions**（不進歷史）：
- `setActiveTool(tool: Tool): void`
- `setSelectedEquipment(equipment: EquipmentType | null): void`
- `armPlacement(equipment: EquipmentType): void`
- `disarmPlacement(): void`
- `resetCanvas(): void`

---

### 2.2 historyStore API

**State 欄位**：
- `undoStack`: Command[]
- `redoStack`: Command[]

**Getters**：
- `canUndo`: boolean
- `canRedo`: boolean
- `undoDepth`: number

**Actions**：
- `execute(command: Command): void` — 內部使用，L2 不直接呼叫
- `undo(): void`
- `redo(): void`
- `clear(): void`

---

### 2.3 flowStore API

**State 欄位**：
- `edgeFlows`: Map<string, EdgeFlow>
- `nodeEfficiencies`: Map<string, number>
- `itemSummary`: ItemSummary[]
- `sinkDeliveries`: Map<string, number>
- `congestedEdges`: Set<string>
- `invalidChainUids`: Set<string>
- `powerBalance`: { demand: number; supply: number }
- `isCalculating`: boolean

**Actions**：
- `applyResult(result: FlowEngineResult): void` — 內部使用

**使用方式**：L2/L3 僅唯讀消費 flowStore 數據。

---

### 2.4 validationStore API

**State 欄位**：
- `alerts`: Alert[]
- `detectors`: Map<string, Detector>

**Getters**：
- `errorCount`: number
- `hasAnyError`: boolean

**Actions**：
- `registerDetector(detector: Detector): void`
- `unregisterDetector(code: string): boolean`
- `run(ctx: ValidationContext): void`
- `hasBlockingError(deviceUid: string): boolean`
- `alertsByDevice(deviceUid: string): Alert[]`
- `alertsByConnection(connectionUid: string): Alert[]`
- `reset(): void`

---

### 2.5 canvasStore API

**State 欄位**：
- `zoom`: number
- `offset`: { x: number; y: number }
- `baseRegion`: BaseRegion
- `showGrid`: boolean

**Getters**：
- `canvasSize`: { w: number; h: number } | null

**Actions**：
- `setZoom(value: number): void`
- `setOffset(o: { x, y }): void`
- `setBaseRegion(region: BaseRegion): void`
- `toggleGrid(): void`

---

### 2.6 selectionStore API

**State 欄位**：
- `selectedNodeIds`: string[]
- `selectedEdgeIds`: string[]

**Getters**：
- `hasSelection`: boolean

**Actions**：
- `addNodeSelection(uid: string): void`
- `removeNodeSelection(uid: string): void`
- `clearSelection(): void`
- `selectAll(): void`

---

## 3. 「不可為」清單

### 3.1 禁止直接 mutate State

❌ **錯誤範例**：

```typescript
// 禁止！
editorStore.nodes.push(newNode);  // 不進歷史，破壞 undo/redo
editorStore.nodes = editorStore.nodes.filter(n => n.id !== 'uid1');
flowStore.edgeFlows.set('uid', { ... });  // flowStore 為唯讀
```

✅ **正確範例**：

```typescript
// 正確！使用高階 action
editorStore.placeDevice(newNode);
editorStore.removeDevices(['uid1']);

// flowStore 為唯讀，僅消費
const flow = flowStore.edgeFlows.get('uid');
```

---

### 3.2 禁止自己組 Command

❌ **錯誤範例**：

```typescript
// 禁止！L2 不應該自己組 Command
const historyStore = useHistoryStore();
historyStore.execute({
  id: crypto.randomUUID(),
  type: 'custom',
  execute() { /* ... */ },
  undo() { /* ... */ },
});
```

✅ **正確範例**：

```typescript
// 正確！使用 editorStore 的高階 action
editorStore.moveDevices(['uid1', 'uid2'], { x: 40, y: 0 });
// 高階 action 內部會自動產生 Command
```

---

## 4. 常見使用範例

### 4.1 擺放設備

```typescript
import { useEditorStore } from '@/store/editorStore';

const editorStore = useEditorStore();

editorStore.placeDevice({
  id: crypto.randomUUID(),
  type: 'default',
  position: { x: 200, y: 300 },
  data: {
    label: '精煉爐',
    machineType: '精煉爐',
    recipeIndex: 0,
    rotation: 0,
  },
});
```

### 4.2 判斷設備是否有 Error

```typescript
import { useValidationStore } from '@/store/validationStore';

const validationStore = useValidationStore();

if (validationStore.hasBlockingError(deviceUid)) {
  // 不計算流量
}
```

### 4.3 查詢管線流量

```vue
<script setup lang="ts">
import { useFlowStore } from '@/store/flowStore';

const flowStore = useFlowStore();
const edgeFlow = flowStore.edgeFlows.get(connectionUid);
</script>

<template>
  <div v-if="edgeFlow">
    {{ edgeFlow.itemId }} @ {{ edgeFlow.rate.toFixed(2) }}/min
  </div>
</template>
```

---

## 5. 實作步驟

1. 建立 `docs/L1_API_REFERENCE.md`
2. 複製完整內容（包含所有 6 個 stores 的 API）
3. 更新連結到 `docs/dernoson/L1/L1.md`

---

*此文件對應 V5-C1 工項，實作後標記 [x] 於 todolist_v5.md。*
