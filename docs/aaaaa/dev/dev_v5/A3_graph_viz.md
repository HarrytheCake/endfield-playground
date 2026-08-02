# A3 — Graph Structure 可視化頁

**對應工項**：V5-A3  
> **V9-H1-4（2026-08-02）：已退役。** `/dev/graph-viz` 轉址 `/dev/flow-engine`；`GraphViz.vue` 已刪。本檔僅作歷史規格。

---

## 1. 工項目標

提供圖論結構的可視化工具，幫助開發者理解：

- `buildGraph` 建立的 Adjacency List（鄰接表）
- `topologicalSort` 的排序結果
- 環路偵測的標記

**使用場景**：
- 調試 `buildGraph` 邏輯
- 驗證拓撲排序正確性
- 快速定位環路節點

---

## 2. 技術規格

### 2.1 路由註冊

```typescript
{
  path: '/dev/graph-viz',
  name: 'DevGraphViz',
  component: () => import('@/editor/dev/DevGraphViz.vue'),
  meta: { requiresDev: true },
}
```

---

## 3. 元件設計（`src/editor/dev/DevGraphViz.vue`）

### 3.1 頁面佈局

```
┌───────────────────────────────────────────┐
│ 標題：Graph Structure Visualizer         │
├───────────────────┬───────────────────────┤
│ 左側（40%）       │ 右側（60%）           │
│ ─────────────     │ ─────────────          │
│ JSON 輸入框       │ 1. Adjacency List      │
│ devices: []       │    Node A → [B, C]     │
│ connections: []   │    Node B → [D]        │
│                   │                        │
│ [建立圖結構] 按鈕 │ 2. Topological Sort    │
│                   │    Sorted: [A, B, C, D]│
│                   │    Has Cycle: false    │
│                   │                        │
│                   │ 3. Cycle Nodes         │
│                   │    (列出環路節點)      │
│                   │                        │
│                   │ 4. Mermaid Flowchart   │
│                   │    （流程圖代碼）       │
└───────────────────┴───────────────────────┘
```

---

## 4. 實作步驟

### 4.1 建立 Vue 元件

**檔案**：`src/editor/dev/DevGraphViz.vue`

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { buildGraph, topologicalSort } from '@/composables/useFlowEngine';
import type { FlowGraph } from '@/types/flow';
import type { FactoryNode, FactoryEdge } from '@/types/graph';

const jsonInput = ref('{}');
const graph = ref<FlowGraph | null>(null);

// 建立圖結構
function buildGraphFromInput() {
  try {
    const data = JSON.parse(jsonInput.value);
    const nodes: FactoryNode[] = data.devices || [];
    const edges: FactoryEdge[] = data.connections || [];
    graph.value = buildGraph(nodes, edges);
    topologicalSort(graph.value);
  } catch (err) {
    console.error('[DevGraphViz] 建立圖失敗', err);
  }
}

// 鄰接表
const adjacencyList = computed(() => {
  if (!graph.value) return [];
  const list: Array<{ uid: string; neighbors: string[] }> = [];
  for (const [uid, edges] of graph.value.outEdges) {
    const neighbors = edges.map(connUid => {
      const meta = graph.value!.edgeMeta.get(connUid);
      return meta?.targetDeviceUid || '?';
    });
    list.push({ uid, neighbors });
  }
  return list;
});

// 拓撲排序結果
const topologicalResult = computed(() => {
  if (!graph.value) return null;
  return {
    sorted: topologicalSort(graph.value),
    hasCycle: graph.value.hasCycle,
  };
});

// 環路節點
const cycleNodes = computed(() => {
  if (!graph.value) return [];
  return Array.from(graph.value.invalidSubgraphUids);
});

// Mermaid 流程圖
const mermaidCode = computed(() => {
  if (!graph.value) return '';
  let code = 'graph TD\n';
  for (const [uid, connUids] of graph.value.outEdges) {
    for (const connUid of connUids) {
      const meta = graph.value.edgeMeta.get(connUid);
      if (meta) {
        code += `  ${uid} --> ${meta.targetDeviceUid}\n`;
      }
    }
  }
  return code;
});
</script>

<template>
  <div class="dev-graph-viz">
    <h1>Graph Structure Visualizer</h1>
    
    <div class="layout">
      <!-- 左側：輸入區 -->
      <div class="left-panel">
        <textarea
          v-model="jsonInput"
          class="json-input"
          rows="25"
          placeholder='{"devices": [], "connections": []}'
        />
        
        <button @click="buildGraphFromInput" class="build-btn">
          建立圖結構
        </button>
      </div>
      
      <!-- 右側：結果區 -->
      <div class="right-panel">
        <section>
          <h2>1. Adjacency List</h2>
          <ul>
            <li v-for="item in adjacencyList" :key="item.uid">
              {{ item.uid }} → {{ item.neighbors.join(', ') }}
            </li>
          </ul>
        </section>
        
        <section>
          <h2>2. Topological Sort</h2>
          <p><strong>Sorted:</strong> {{ topologicalResult?.sorted.join(' → ') || 'N/A' }}</p>
          <p><strong>Has Cycle:</strong> {{ topologicalResult?.hasCycle ? 'YES' : 'NO' }}</p>
        </section>
        
        <section>
          <h2>3. Cycle Nodes</h2>
          <ul v-if="cycleNodes.length > 0">
            <li v-for="uid in cycleNodes" :key="uid" class="cycle-node">
              {{ uid }}
            </li>
          </ul>
          <p v-else class="no-cycles">無環路</p>
        </section>
        
        <section>
          <h2>4. Mermaid Flowchart</h2>
          <pre class="mermaid-code">{{ mermaidCode }}</pre>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dev-graph-viz {
  padding: 2rem;
}

.layout {
  display: flex;
  gap: 2rem;
}

.left-panel {
  flex: 2;
}

.right-panel {
  flex: 3;
}

.json-input {
  width: 100%;
  font-family: monospace;
  border: 1px solid #ccc;
  padding: 0.5rem;
}

.build-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #2196F3;
  color: white;
  border: none;
  cursor: pointer;
}

.cycle-node {
  color: red;
  font-weight: bold;
}

.no-cycles {
  color: green;
}

.mermaid-code {
  background: #f5f5f5;
  padding: 1rem;
  border: 1px solid #ddd;
  overflow: auto;
  max-height: 200px;
}
</style>
```

---

## 5. 驗證標準

| 項目 | 標準 |
|------|------|
| 鄰接表正確性 | 與 `buildGraph` 輸出一致 |
| 拓撲排序正確性 | 與 `topologicalSort` 測試案例一致 |
| 環路偵測 | 正確標記環路節點 |
| Mermaid 生成 | 可複製到 Mermaid Live Editor 渲染 |

---

*此文件對應 V5-A3 工項，實作後標記 [x] 於 todolist_v5.md。*
