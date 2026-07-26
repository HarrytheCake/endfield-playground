# A4 — History Replay 歷史記錄回放頁

**對應工項**：V5-A4

---

## 1. 工項目標

提供 Command Pattern (`historyStore`) 的可視化測試工具：

- 顯示 undoStack / redoStack 內容
- 可執行 Undo / Redo / Clear 操作
- 即時顯示當前狀態快照（nodes / edges）

**使用場景**：
- 驗證 `historyStore` Undo/Redo 正確性
- 調試 macro Command 執行流程
- Demo 歷史記錄功能給 L2 開發者

---

## 2. 技術規格

### 2.1 路由註冊

```typescript
{
  path: '/dev/history-replay',
  name: 'DevHistoryReplay',
  component: () => import('@/editor/dev/DevHistoryReplay.vue'),
  meta: { requiresDev: true },
}
```

---

## 3. 元件設計（`src/editor/dev/DevHistoryReplay.vue`）

### 3.1 頁面佈局

```
┌─────────────────────────────────────────────┐
│ 標題：History Replay                        │
├──────────────────────┬──────────────────────┤
│ 左側（30%）          │ 右側（70%）          │
│ ─────────────        │ ─────────────         │
│ [Undo] [Redo] [Clear]│ 狀態快照              │
│                      │                       │
│ Undo Stack (3)       │ Devices Count: 5      │
│  - AddDevice         │ Edges Count: 3        │
│  - MoveDevice        │                       │
│  - DeleteEdge        │ JSON:                 │
│                      │ { "devices": [...] }  │
│ Redo Stack (1)       │                       │
│  - DeleteDevice      │                       │
│                      │                       │
│ 當前 Pointer: 3      │                       │
└──────────────────────┴──────────────────────┘
```

---

## 4. 實作步驟

### 4.1 建立 Vue 元件

**檔案**：`src/editor/dev/DevHistoryReplay.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useHistoryStore } from '@/store/historyStore';
import { useEditorStore } from '@/store/editorStore';

const historyStore = useHistoryStore();
const editorStore = useEditorStore();

// Undo / Redo / Clear 操作
function undo() {
  historyStore.undo();
}

function redo() {
  historyStore.redo();
}

function clear() {
  historyStore.clear();
}

// 當前狀態快照
const currentState = computed(() => ({
  devicesCount: editorStore.nodes.length,
  edgesCount: editorStore.edges.length,
  json: JSON.stringify({
    devices: editorStore.nodes,
    edges: editorStore.edges,
  }, null, 2),
}));
</script>

<template>
  <div class="dev-history-replay">
    <h1>History Replay</h1>
    
    <div class="layout">
      <!-- 左側：控制區 -->
      <div class="left-panel">
        <div class="controls">
          <button @click="undo" :disabled="!historyStore.canUndo">
            Undo
          </button>
          <button @click="redo" :disabled="!historyStore.canRedo">
            Redo
          </button>
          <button @click="clear">
            Clear
          </button>
        </div>
        
        <section>
          <h2>Undo Stack ({{ historyStore.undoStack.length }})</h2>
          <ul>
            <li v-for="(cmd, i) in historyStore.undoStack" :key="i">
              {{ cmd.name || 'Command' }}
            </li>
          </ul>
        </section>
        
        <section>
          <h2>Redo Stack ({{ historyStore.redoStack.length }})</h2>
          <ul>
            <li v-for="(cmd, i) in historyStore.redoStack" :key="i">
              {{ cmd.name || 'Command' }}
            </li>
          </ul>
        </section>
        
        <p><strong>Current Pointer:</strong> {{ historyStore.undoStack.length }}</p>
      </div>
      
      <!-- 右側：狀態快照 -->
      <div class="right-panel">
        <section>
          <h2>狀態快照</h2>
          <p><strong>Devices Count:</strong> {{ currentState.devicesCount }}</p>
          <p><strong>Edges Count:</strong> {{ currentState.edgesCount }}</p>
        </section>
        
        <section>
          <h2>JSON</h2>
          <pre class="json-display">{{ currentState.json }}</pre>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dev-history-replay {
  padding: 2rem;
}

.layout {
  display: flex;
  gap: 2rem;
}

.left-panel {
  flex: 1;
}

.right-panel {
  flex: 2;
}

.controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.json-display {
  background: #f5f5f5;
  padding: 1rem;
  border: 1px solid #ddd;
  overflow: auto;
  max-height: 400px;
}
</style>
```

---

## 5. 驗證標準

| 項目 | 標準 |
|------|------|
| Undo/Redo 正確性 | 狀態正確還原 |
| Stack 顯示 | 即時更新 |
| Macro Command | 一次 undo 還原多個操作 |
| 清空操作 | Clear 後 stack 為空 |

---

*此文件對應 V5-A4 工項，實作後標記 [x] 於 todolist_v5.md。*
