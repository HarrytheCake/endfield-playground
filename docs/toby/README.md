# toby 工作筆記 — L2 容器層 Senior IC

**角色：** L2 容器層 Senior IC（CR-01 + CR-02 合併區塊 技術後盾）  
**配對：** harry（Owner）的技術後盾與 PR reviewer  
**技術棧：** Vue 3 Composition API + Pinia + Vue Flow

---

## 目錄

1. [角色定位](#角色定位)
2. [L1 API 參考文件](#l1-api-參考文件)
3. [L2「不可為」清單](#l2不可為清單)
4. [高風險實作清單](#高風險實作清單)
5. [Code Review Checklist](#code-review-checklist)
6. [技術決策原則](#技術決策原則)

---

## 角色定位

toby 不負責 L2 的對外協調與整體進度，那是 harry 的事。toby 把技術風險最高的幾塊吃下來，並當 harry PR 的最後一道把關。

**主要承擔：**
- 技術深度高、容易踩坑的實作
- harry PR 的 code review，重點放在 store 寫入路徑、Vue 響應性陷阱
- 跟 L1（dernoson + aaaaa）對齊每個跨 store 操作對應的 high-level action 介面
- 在 harry 卡住時 pair 一陣子帶過去

**不需要承擔：**
- spec 對齊與優先序判斷（harry）
- 對 L1 / L3 的介面協商（harry 主導，toby 在技術選擇上提意見）
- 上下層全部介面文件的維運（harry）

---

## L1 API 參考文件

**必讀文件（Code Review 前務必熟悉）：**

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

**理由：** 所有 editorStore 的 8 個 actions 已內建 Command Pattern。若發現某個操作沒有對應 action，應請 L1 補上，而非在 L2 自己包 Command。

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

**Review 時特別注意：** L3 元件檔案內不應出現 `import { use*Store } from '@/store/*'`。

---

### ❌ 6. 禁止把 reactive ref 直接傳給 L3

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
  }
})

<DeviceNode :device="deviceData" />
```

---

## 高風險實作清單

以下項目由 toby 完整 own（harry review）：

### 1. 90 度路徑驗證即時偵測

**對應 spec：** `02_pipeline.md` §2.3、§4、§6.3

**技術要點：**
- `DraftConnection` 型別**不存在於程式碼**，draft 狀態由 L2 container 自行用 local ref（含 waypoints 陣列）維護
- waypoints 變動時即時跑 `validateAllSegments()`
- 違規線段索引由 L2 computed 算出 `invalidSegmentIndices` 並餵給 `<PipelineDraft>` 的 prop
- 滑鼠移動是高頻事件，要保證不會因為每次 mousemove 跑 O(n) 驗證導致掉幀
- 違規時封鎖「確認放置」：在 L2 commit handler 入口檢查 `hasInvalidSegment`

**實作範例骨架：**
```typescript
const draftWaypoints = ref<{ x: number; y: number }[]>([])

const invalidSegmentIndices = computed(() => {
  const indices: number[] = []
  for (let i = 0; i < draftWaypoints.value.length - 1; i++) {
    const p1 = draftWaypoints.value[i]
    const p2 = draftWaypoints.value[i + 1]
    const isVertical = p1.x === p2.x
    const isHorizontal = p1.y === p2.y
    if (!isVertical && !isHorizontal) {
      indices.push(i)
    }
  }
  return indices
})

const hasInvalidSegment = computed(() => 
  invalidSegmentIndices.value.length > 0
)

function commitDraft() {
  if (hasInvalidSegment.value) {
    // 封鎖放置，顯示錯誤提示
    return
  }
  
  // 呼叫 L1 action
  editorStore.addConnection({
    id: crypto.randomUUID(),
    source: draftSource.value,
    target: draftTarget.value,
    // ...
  })
}
```

---

### 2. autoNode 的 L2 接線（分流器 / 匯流器 / 物流橋）

**對應 spec：** `02_pipeline.md` §2.5、`08_history.md`

**技術要點：**
- 生成邏輯與歷史記錄由 L1 負責，L2 只負責呼叫 `editorStore.addConnection(edge)`
- **目前 Phase 1 的 `addConnection` 為簡化版，autoNode 自動生成尚未實作**
- toby 要跟 dernoson / aaaaa 對齊補上時程與簽名
- 截斷模式切換：點選 `<AutoNodeBadge>` 後呼叫 L1 提供的對應 action（目前 `editorStore` 尚未暴露 `toggleSplitterMode`，需請 L1 補）

**跟 L1 對齊的事項：**
```typescript
// 目前缺少的 action（需請 L1 補）
editorStore.toggleSplitterMode(autoNodeUid: string): void

// Phase 1 的 addConnection 需擴充為：
editorStore.addConnection(edge: FactoryEdge): void
// 內部自動處理：
// 1. 判斷是否需要 autoNode（type mismatch / 方向不合）
// 2. 生成對應的 splitter / merger / bridge
// 3. 調整 edge 拓樸（source → autoNode → target）
// 4. 整組包成單一 Command 進歷史
```

---

### 3. 設備移動時管線跟隨更新

**對應 spec：** `01_canvas_and_devices.md` §2.4、§6.3

**技術要點：**
- 設備 move 完成後的「管線端點重算」、「90 度重驗」、「auto-connect」全部由 L1 的 `editorStore.moveDevices(uids, delta)` 內部負責
- L2 只負責：收集 move 的 uids + delta，呼叫一次 `moveDevices(...)`
- **目前 Phase 1 的 `moveDevices` 內部管線跟隨尚未完整實作**（L1 已留好 hook，待 CR-02 階段補上）

**實作範例：**
```typescript
function commitMove(uids: string[], delta: { x: number; y: number }) {
  // 一次呼叫；L1 內部處理管線跟隨、重驗、auto-connect 並產生單一歷史項目
  editorStore.moveDevices(uids, delta)
}
```

---

### 4. 框選複製含管線

**對應 spec：** `01_canvas_and_devices.md` §2.5、`08_history.md`

**技術要點：**
- 框選範圍判定、管線納入規則、新舊 uid 對照表、整組進歷史 — 全部由 L1 的 `editorStore.pasteSelection(...)` 內部處理
- L2 只負責：把框選範圍內的 nodes + edges 與貼上的偏移量丟給該 action

**實作範例：**
```typescript
function pasteClipboard(offset: { x: number; y: number }) {
  const selectedNodes = editorStore.nodes.filter(n => 
    selection.selectedNodeIds.includes(n.id)
  )
  const selectedEdges = editorStore.edges.filter(e =>
    selection.selectedNodeIds.includes(e.source) &&
    selection.selectedNodeIds.includes(e.target)
  )
  
  // L1 action 內部處理新舊 uid 對照表與歷史記錄
  editorStore.pasteSelection(selectedNodes, selectedEdges, offset)
}
```

---

### 5. 跟 L1 對齊跨 store 操作介面

**原則：**
- 凡是「同時動到 nodes + edges」的操作，**不在 L2 寫 macro**
- toby 的工作是列出所有 L2 需要的跨資料操作，跟 L1 對齊簽名
- 若 L1 還沒提供，請 L1 補上（由 L1 在 action 內部組合成單一歷史項目）

**跟 L1 對齊的檢查清單：**

| 操作 | 對應 editorStore action | Phase 1 狀態 |
|------|-------------------------|-------------|
| 放置設備時自動連接 | `placeDevice(node)` | ⚠️ auto-connect 未實作 |
| 移動設備時管線跟隨 | `moveDevices(uids, delta)` | ⚠️ 跟隨邏輯未實作 |
| autoNode 生成 | `addConnection(edge)` | ⚠️ autoNode 未實作 |
| 框選複製 | `pasteSelection(...)` | ✅ 已完成 |
| 配方變更 | `setRecipe(uid, index)` | ✅ 已完成 |
| 旋轉設備 | `rotateDevice(uid, rotation)` | ✅ 已完成 |

---

## Code Review Checklist

### Review harry PR 時的檢查重點

#### ✅ Store 寫入路徑

- [ ] 有沒有「直接改 store state 而非走 action」的 mutation
- [ ] 有沒有人在 L2 自己呼叫 `historyStore.execute()` 或 import `createMacroCommand`
- [ ] 是否所有 editorStore 變更都走 8 個 high-level actions

**範例違規：**
```typescript
// ❌ 直接 mutate
editorStore.nodes[0].position.x += 10

// ✅ 應改為
editorStore.moveDevices([uid], { x: 10, y: 0 })
```

---

#### ✅ L3 邊界隔離

- [ ] L3 元件內是否 import store（應該沒有）
- [ ] props 是不是 plain object 而非 reactive ref
- [ ] emits 的 payload 是否為 plain data（不含 ref / store instance）

**範例違規：**
```vue
<!-- ❌ L3 內 import store -->
<script setup lang="ts">
import { useEditorStore } from '@/store/editorStore'
</script>
```

---

#### ✅ Vue 響應性陷阱

- [ ] computed 內是否正確 `.value` unwrap
- [ ] watch 的 deep / immediate 選項是否合理
- [ ] 是否有 mutate props 的行為（L3 元件內）

---

#### ✅ 記憶體洩漏

- [ ] 滑鼠 / 鍵盤事件有沒有清掉 listener（onUnmounted）
- [ ] watch / computed 有沒有手動停止（若非 setup scope）

---

#### ✅ 快捷鍵 Scope

- [ ] Ctrl+Z / Ctrl+Y 有沒有正確綁到 `historyStore.undo() / redo()`
- [ ] input focus 時不該觸發 Delete / Space 等快捷鍵
- [ ] `useMagicKeys` 綁的快捷鍵有沒有 scope 衝突

---

#### ✅ 效能考量

- [ ] 高頻事件（mousemove / scroll）有沒有 throttle / debounce
- [ ] 大陣列遍歷有沒有優化（避免 O(n²)）
- [ ] computed 依賴是否最小化（避免不必要的重算）

---

## 技術決策原則

### 1. 優先使用 L1 提供的 high-level action

遇到需要跨 store 操作時，第一反應應該是：

```
「L1 有沒有對應的 action？」
  ├─ 有 → 直接呼叫
  └─ 沒有 → 請 L1 補上（不在 L2 自己組 Command）
```

### 2. L2 local state 的界定

**應該用 L2 local state 的情境：**
- Draft 狀態（管線繪製中、設備拿起預覽）
- UI 暫態（hover / focus / dropdown open）
- 即時計算結果（90 度驗證、吸附座標）

**不應該用 L2 local state 的情境：**
- 已 commit 的設備 / 管線資料（應存於 editorStore）
- 選取狀態（應存於 selectionStore）
- 計算結果（應從 flowStore / validationStore 讀取）

### 3. 效能 vs. 可維護性

**原則：** 先保證正確性與可維護性，效能問題等實測後再優化。

**例外：** 高頻事件（mousemove / scroll）必須一開始就考慮效能。

---

## 相關資源

### 文件

- 📘 [L1 API Reference](../aaaaa/L1_API_REFERENCE.md) — L1 完整 API 文件
- 📗 [FlowEngine Guide](../aaaaa/FLOW_ENGINE_GUIDE.md) — FlowEngine 使用指南
- 📄 [Spec: Canvas & Devices](../../spec/01_canvas_and_devices.md) — CR-01 規格
- 📄 [Spec: Pipeline](../../spec/02_pipeline.md) — CR-02 規格
- 📋 [角色定位](../dernoson/L2/toby.md) — 完整職責定義

### 開發工具

- 🔧 `/dev/flow-engine` — FlowEngine 測試頁（H1–H6 preset）
- 🔧 `/dev/graph-viz` — 圖結構可視化（環路偵測）
- 🔧 `/dev/history-replay` — 歷史記錄回放（undo/redo 測試）

僅在 `import.meta.env.DEV` 時可訪問。

---

**文件版本：** V5  
**最後更新：** 2026-06-06  
**維護者：** aaaaa (CR-04)  
**問題回報：** 直接找 harry 或在 L2 channel 提問
