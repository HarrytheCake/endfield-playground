# harry 工作筆記 — L2 容器層 Owner (CR-01 + CR-02)

**角色：** L2 容器層 Owner（CR-01 畫布 + CR-02 管線 合併區塊）  
**配對：** 與 toby（Senior IC）共同負責 L2  
**技術棧：** Vue 3 Composition API + Pinia + Vue Flow

---

## 目錄

1. [角色定位](#角色定位)
2. [L1 API 參考文件](#l1-api-參考文件)
3. [L2「不可為」清單](#l2不可為清單)
4. [快速上手範例](#快速上手範例)
5. [主要職責](#主要職責)
6. [與 toby 的協作](#與-toby-的協作)

---

## 角色定位

harry 是 L2 的 PR Owner 與對外介面協調人。技術深度由 toby 補齊，但「整個 L2 對 L1 / L3 / spec 對齊」這件事掛在 harry 名下。

**主要承擔：**
- 把 spec 拆成可實作 task，分給自己與 toby
- 跟 L1（dernoson、aaaaa）對齊 store 介面
- 跟 L3 四人組對齊 props / events 介面
- 自己 own 基礎互動的實作 PR
- 整體 review PR 流程的順暢度

**不需要自己扛的：**
- 高難度路徑 / 拓樸演算法（toby）
- 跨 store 原子操作對應的 L1 action 釐清（toby 主導）
- 框選複製含管線的歷史包裝（由 L1 提供的 high-level action 統一處理）

---

## L1 API 參考文件

**必讀文件（開發前務必閱讀）：**

- 📘 [L1 API Reference](../aaaaa/L1_API_REFERENCE.md) — 完整 API 簽名、State / Actions / Getters
- 📗 [FlowEngine Guide](../aaaaa/FLOW_ENGINE_GUIDE.md) — 流量計算引擎使用指南

### 快速索引

| Store | 用途 | 可修改 | 文件連結 |
|-------|------|--------|----------|
| `useEditorStore` | 藍圖狀態（設備、管線） | ✅ 透過 8 個 actions | [§2](../aaaaa/L1_API_REFERENCE.md#useeditorstore) |
| `useCanvasStore` | 畫布視角（縮放、平移） | ✅ | [§3](../aaaaa/L1_API_REFERENCE.md#usecanvasstore) |
| `useFlowStore` | FlowEngine 計算結果 | ⛔ 唯讀 | [§4](../aaaaa/L1_API_REFERENCE.md#useflowstore) |
| `useValidationStore` | Detector 警示結果 | ⛔ 唯讀 | [§5](../aaaaa/L1_API_REFERENCE.md#usevalidationstore) |
| `useSelectionStore` | 畫布選取狀態 | ✅ | [§6](../aaaaa/L1_API_REFERENCE.md#useselectionstore) |
| `useHistoryStore` | Undo / Redo 堆疊 | 🔸 僅可呼叫 undo/redo | [§7](../aaaaa/L1_API_REFERENCE.md#usehistorystore) |

---

## L2「不可為」清單

### ❌ 1. 禁止直接 mutate editorStore.nodes / edges

**錯誤範例：**
```typescript
// ❌ 禁止！不會進歷史
editorStore.nodes.push(newNode)
editorStore.nodes = editorStore.nodes.filter(n => n.id !== 'uid1')
```

**正確範例：**
```typescript
// ✅ 正確！使用高階 action
editorStore.placeDevice(newNode)
editorStore.removeDevices(['uid1'])
```

---

### ❌ 2. 禁止自己組 Command

**錯誤範例：**
```typescript
// ❌ 禁止！L2 不應該自己組 Command
const historyStore = useHistoryStore()
historyStore.execute({
  id: crypto.randomUUID(),
  type: 'custom',
  execute() { /* ... */ },
  undo() { /* ... */ },
})
```

**正確範例：**
```typescript
// ✅ 正確！高階 action 內部會自動產生 Command
editorStore.moveDevices(['uid1', 'uid2'], { x: 40, y: 0 })
```

**理由：** 所有 editorStore 的 8 個 actions 已內建 Command Pattern，會自動進歷史。L2 直接呼叫即可。

---

### ❌ 3. 禁止修改 flowStore / validationStore

`flowStore` 與 `validationStore` 為**唯讀 store**，L2 僅消費其數據，不可修改。

**錯誤範例：**
```typescript
// ❌ 禁止！
flowStore.edgeFlows.set('uid', { ... })
validationStore.alerts.push({ ... })
```

**正確範例：**
```typescript
// ✅ 正確！唯讀消費
const flow = flowStore.edgeFlows.get(connectionUid)
const hasError = validationStore.hasBlockingError(deviceUid)
```

---

### ❌ 4. 禁止在 L2 自己跑 FlowEngine

FlowEngine 由 L1 的 `useFlowEngine()` composable 自動觸發（150ms debounce）。

**錯誤範例：**
```typescript
// ❌ 禁止！手動觸發
import { runFlowEngine } from '@/composables/useFlowEngine'
runFlowEngine()
```

**正確範例：**
```typescript
// ✅ 正確！修改 editorStore 後自動觸發
editorStore.placeDevice(node)
// （150ms 後 FlowEngine 自動執行）
```

---

### ❌ 5. 禁止在 L3 元件內 import store

這是硬規則。L3 元件只透過 props / emits 與 L2 溝通。

**錯誤範例：**
```vue
<!-- ❌ 禁止！L3 元件內 import store -->
<script setup lang="ts">
import { useEditorStore } from '@/store/editorStore'
const editorStore = useEditorStore()
</script>
```

**正確範例：**
```vue
<!-- ✅ 正確！L3 透過 props 接收資料 -->
<script setup lang="ts">
const props = defineProps<{ devices: Device[] }>()
</script>
```

---

### ❌ 6. 禁止直接 mutate props 傳給 L3

傳給 L3 的 props 必須是 **plain object**，不能是 reactive ref。

**錯誤範例：**
```typescript
// ❌ 禁止！傳 reactive ref
<DeviceNode :device="editorStore.nodes[0]" />
```

**正確範例：**
```typescript
// ✅ 正確！解構為 plain object
const deviceData = computed(() => {
  const node = editorStore.nodes.find(n => n.id === props.deviceUid)
  return {
    id: node.id,
    label: node.data?.label ?? '',
    machineType: node.data?.machineType ?? '',
    // ...
  }
})

<DeviceNode :device="deviceData" />
```

---

## 快速上手範例

### 範例 1：擺放設備

```typescript
import { useEditorStore } from '@/store/editorStore'

const editorStore = useEditorStore()

function placeNewDevice(x: number, y: number) {
  editorStore.placeDevice({
    id: crypto.randomUUID(),
    type: 'default',
    position: { x, y },
    data: {
      label: '精煉爐',
      machineType: 'furnace',  // 使用 Machine.id
      recipeIndex: 0,
      rotation: 0,
    },
  })
}
```

---

### 範例 2：批次移動設備

```typescript
import { useEditorStore } from '@/store/editorStore'
import { useSelectionStore } from '@/store/selectionStore'

const editorStore = useEditorStore()
const selection = useSelectionStore()

function moveSelectedDevices(delta: { x: number; y: number }) {
  if (!selection.hasSelection) return
  
  // 一次呼叫，整組進歷史
  editorStore.moveDevices(selection.selectedNodeIds, delta)
}
```

---

### 範例 3：刪除選取設備

```typescript
import { useEditorStore } from '@/store/editorStore'
import { useSelectionStore } from '@/store/selectionStore'

const editorStore = useEditorStore()
const selection = useSelectionStore()

function deleteSelected() {
  if (!selection.hasSelection) return
  
  editorStore.removeDevices(selection.selectedNodeIds)
  selection.clearSelection()  // 刪除後清空選取
}
```

---

### 範例 4：取得管線流量顯示

```typescript
import { computed } from 'vue'
import { useFlowStore } from '@/store/flowStore'

const flowStore = useFlowStore()
const props = defineProps<{ connectionUid: string }>()

const edgeFlow = computed(() => 
  flowStore.edgeFlows.get(props.connectionUid)
)

const isCongested = computed(() => 
  flowStore.congestedEdges.has(props.connectionUid)
)

const flowDisplay = computed(() => {
  if (!edgeFlow.value) return null
  return {
    itemId: edgeFlow.value.itemId,
    rate: `${edgeFlow.value.rate.toFixed(1)} / min`,
    isCongested: isCongested.value,
  }
})
```

---

### 範例 5：檢查設備是否有驗證錯誤

```typescript
import { computed } from 'vue'
import { useValidationStore } from '@/store/validationStore'

const validationStore = useValidationStore()
const props = defineProps<{ deviceUid: string }>()

const hasError = computed(() => 
  validationStore.hasBlockingError(props.deviceUid)
)

const alerts = computed(() => 
  validationStore.alertsByDevice(props.deviceUid)
)

const alertLevel = computed(() => {
  if (alerts.value.some(a => a.level === 'error')) return 'error'
  if (alerts.value.length > 0) return 'warning'
  return 'none'
})
```

---

## 主要職責

### 對外協調（高優先）

| 對象 | 工作 |
|------|------|
| **L1**（dernoson / aaaaa）| 列出 L2 需要的 high-level action / selector 簽名，缺的請 L1 補 |
| **L3**（四人組）| 為每個 L3 元件先寫好 `defineProps<P>()` / `defineEmits<E>()`，鎖定後通知 L3 開工 |
| **spec** | 每週對一次 `01_canvas_and_devices.md` 與 `02_pipeline.md` 有沒有更新 |
| **toby** | 至少每 2 天同步一次進度；遇到看不懂的技術問題立刻拉 toby review |

---

### 自己 own 的實作

下列項目由 harry 自己寫 PR，toby review：

| 模組 | 工作內容 |
|------|----------|
| **CR-01 工具列 → 畫布 拿起流程** | 點選工具列設備 → 呼叫 `editorStore.armPlacement(equipment)` → 滑鼠移動時維護預覽座標 → 單擊放置時呼叫 `editorStore.placeDevice(node)` |
| **CR-01 R 鍵旋轉 / Esc 取消** | 用 `useMagicKeys` 綁定，旋轉於拿起預覽中以 L2 local state 處理 |
| **CR-01 連續擺放** | 工具列拿起的設備放下後保持 armed 狀態，按 Esc 才結束 |
| **CR-01 配方變更** | 點選已部署設備 → 左側面板顯示配方表 → 切換時呼叫 `editorStore.setRecipe(uid, recipeIndex)` |
| **CR-02 管線模式切換** | P 鍵 / 工具列按鈕呼叫 `editorStore.setActiveTool(tool)` 切到管線工具 |
| **CR-02 起點選取與 type 判斷** | 點選 port → 從 machine 定義取 `PortType` → L2 container 內維護 draft 狀態 |
| **CR-02 手動彎折點新增** | 繪製中點選空格 → 推入 L2 local draft 的 waypoints 陣列 |
| **CR-02 自動吸附** | 滑鼠靠近 port 1 格內時，把 cursorPos snap 到 port 中心 |

完整職責說明見 [docs/dernoson/L2/harry.md](../dernoson/L2/harry.md)

---

## 與 toby 的協作

### harry → toby 的「請接手」清單

| 項目 | 為什麼丟給 toby |
|------|----------------|
| 90 度路徑驗證即時偵測 | 邏輯細節多、要快、和 L2 local draft 反應性強耦合 |
| autoNode（分流 / 匯流 / 物流橋）的 L2 wiring | Phase 1 L1 的 `addConnection` 為簡化版尚未含 autoNode |
| 設備移動時管線跟隨更新 | 需要對應的 L1 high-level action |
| 框選複製含管線 | `pasteSelection` 已存在；新舊 uid 對照表由 L1 處理 |
| Edge Scrolling 平滑捲動 | requestAnimationFrame 寫起來細節多 |

### 協作節奏

- harry 開 PR → toby review；toby 開 PR → harry review（互相走 review）
- harry 的 PR 不需要 toby 改架構，但要採納技術建議
- 卡住超過半天請直接喊 toby pair；不要拖

---

## 相關資源

### 文件

- 📘 [L1 API Reference](../aaaaa/L1_API_REFERENCE.md) — L1 完整 API 文件
- 📗 [FlowEngine Guide](../aaaaa/FLOW_ENGINE_GUIDE.md) — FlowEngine 使用指南
- 📄 [Spec: Canvas & Devices](../../spec/01_canvas_and_devices.md) — CR-01 規格
- 📄 [Spec: Pipeline](../../spec/02_pipeline.md) — CR-02 規格
- 📋 [角色定位](../dernoson/L2/harry.md) — 完整職責定義

### 開發工具

- 🔧 `/dev/flow-engine` — FlowEngine 測試頁（H1–H6 preset）
- 🔧 `/dev/graph-viz` — 圖結構可視化（環路偵測）
- 🔧 `/dev/history-replay` — 歷史記錄回放（undo/redo 測試）

僅在 `import.meta.env.DEV` 時可訪問。

---

**文件版本：** V5  
**最後更新：** 2026-06-06  
**維護者：** aaaaa (CR-04)  
**問題回報：** 找 toby 或在 L2 channel 提問
