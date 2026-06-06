# A2 — FlowEngine 手動測試頁

**對應工項**：V5-A2

---

## 1. 工項目標

為 L1 成員（aaaaa / azure9572 / dernoson / shirone）提供直觀的 FlowEngine 測試環境，可：

- 直接輸入 JSON 格式的 `FactoryNode[]` + `FactoryEdge[]`
- 選擇 Preset 測試情境（H1–H6）
- 單鍵觸發計算，即時查看 `flowStore` 結果
- 驗證 `runFlowEngine` 在不同情境下的正確性

**使用場景**：
- 調試 FlowEngine 演算法
- 驗證 H1–H6 測試情境
- Demo 流量計算功能給 L2 開發者

---

## 2. 技術規格

### 2.1 路由註冊

在 `src/router/index.ts` 新增：

```typescript
{
  path: '/dev/flow-engine',
  name: 'DevFlowEngine',
  component: () => import('@/editor/dev/DevFlowEngine.vue'),
  meta: {
    requiresDev: true, // 開發模式限定
  },
}
```

### 2.2 路由守衛

```typescript
router.beforeEach((to) => {
  if (to.meta.requiresDev && import.meta.env.PROD) {
    return { name: 'Home' } // 生產模式重新導向
  }
})
```

---

## 3. 元件設計（`src/editor/dev/DevFlowEngine.vue`）

### 3.1 頁面佈局

```
┌────────────────────────────────────────────┐
│ 標題：FlowEngine Manual Test              │
├──────────────────┬─────────────────────────┤
│ 左側（50%）      │ 右側（50%）             │
│ ─────────────    │ ─────────────            │
│ Preset 選單      │ 結果顯示區               │
│ [H1] [H2] ...    │                          │
│                  │ 1. edgeFlows              │
│ JSON 輸入框      │    (connectionUid → flow) │
│ devices: []      │                          │
│ connections: []  │ 2. nodeEfficiencies       │
│                  │    (deviceUid → 0~1)      │
│ [執行計算] 按鈕  │                          │
│                  │ 3. itemSummary            │
│                  │    (表格)                 │
│                  │                          │
│                  │ 4. powerBalance           │
│                  │    (demand / supply)      │
└──────────────────┴─────────────────────────┘
```

---

## 4. Preset 範例

### 4.1 H1 — 基礎單鏈路（藍鐵礦 → 粉碎機）

```json
{
  "devices": [
    {
      "uid": "src",
      "machineType": "物品輸出口",
      "x": 0,
      "y": 0,
      "recipeIndex": 0,
      "rotation": 0
    },
    {
      "uid": "crusher",
      "machineType": "粉碎機",
      "x": 2,
      "y": 0,
      "recipeIndex": 0,
      "rotation": 0
    },
    {
      "uid": "sink",
      "machineType": "物品輸入口",
      "x": 4,
      "y": 0,
      "recipeIndex": 0,
      "rotation": 0
    }
  ],
  "connections": [
    {
      "uid": "e_src_crusher",
      "sourceDeviceUid": "src",
      "targetDeviceUid": "crusher",
      "sourcePortId": "output_0",
      "targetPortId": "input_0"
    },
    {
      "uid": "e_crusher_sink",
      "sourceDeviceUid": "crusher",
      "targetDeviceUid": "sink",
      "sourcePortId": "output_0",
      "targetPortId": "input_0"
    }
  ]
}
```

**預期結果**：
- `nodeEfficiencies.get('crusher')` = 1.0（供料足夠）
- `edgeFlows.get('e_src_crusher').rate` ≈ 30（個/min）
- `itemSummary` 中「藍鐵礦」net < 0，「藍鐵粉」net > 0

---

### 4.2 H2 — 瓶頸情境（礦機速率不足）

（類似 H1，但 source 輸出速率設為 15，粉碎機需求 30）

**預期結果**：
- `nodeEfficiencies.get('crusher')` = 0.5
- 下游設備同樣受影響

---

### 4.3 H3 — 分流器均分

```json
{
  "devices": [
    { "uid": "src", "machineType": "物品輸出口", ... },
    { "uid": "splitter", "machineType": "分流器", ... },
    { "uid": "sink_A", "machineType": "物品輸入口", ... },
    { "uid": "sink_B", "machineType": "物品輸入口", ... }
  ],
  "connections": [
    { "uid": "e1", "sourceDeviceUid": "src", "targetDeviceUid": "splitter", ... },
    { "uid": "e2", "sourceDeviceUid": "splitter", "targetDeviceUid": "sink_A", ... },
    { "uid": "e3", "sourceDeviceUid": "splitter", "targetDeviceUid": "sink_B", ... }
  ]
}
```

**預期結果**：
- 兩條出邊流量各為 `輸入速率 ÷ 2`

---

### 4.4 H4 — 環路偵測

（A → B → A 環路）

**預期結果**：
- `graph.hasCycle` = true
- `invalidChainUids` 包含 A、B
- `nodeEfficiencies` 對 A、B 均為 0

---

### 4.5 H5 — 懸空設備

（設備無上游連線）

**預期結果**：
- 懸空設備的輸出不計入 `itemSummary`
- `nodeEfficiencies` = 0

---

### 4.6 H6 — 多級串聯

（Source → 粉碎機 → 熔爐 → Sink）

**預期結果**：
- 若上游瓶頸，下游效率同步降低
- 各階段流量符合配方比例

---

## 5. 實作步驟

### 5.1 建立 Vue 元件

**檔案**：`src/editor/dev/DevFlowEngine.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { runFlowEngine } from '@/composables/useFlowEngine';
import { useFlowStore } from '@/store/flowStore';
import { useEditorStore } from '@/store/editorStore';
import type { FactoryNode, FactoryEdge } from '@/types/graph';

const editorStore = useEditorStore();
const flowStore = useFlowStore();

// JSON 輸入內容
const jsonInput = ref('{}');

// Preset 按鈕事件
function loadPreset(name: string) {
  switch (name) {
    case 'H1':
      jsonInput.value = JSON.stringify({
        devices: [/* H1 data */],
        connections: [/* H1 data */],
      }, null, 2);
      break;
    // ... H2–H6
  }
}

// 執行計算
async function executeCalculation() {
  try {
    const data = JSON.parse(jsonInput.value);
    editorStore.$patch({
      nodes: data.devices,
      edges: data.connections,
    });
    await runFlowEngine();
  } catch (err) {
    console.error('[DevFlowEngine] 計算失敗', err);
  }
}
</script>

<template>
  <div class="dev-flow-engine">
    <h1>FlowEngine Manual Test</h1>
    
    <div class="layout">
      <!-- 左側：輸入區 -->
      <div class="left-panel">
        <div class="preset-buttons">
          <button @click="loadPreset('H1')">H1</button>
          <button @click="loadPreset('H2')">H2</button>
          <button @click="loadPreset('H3')">H3</button>
          <button @click="loadPreset('H4')">H4</button>
          <button @click="loadPreset('H5')">H5</button>
          <button @click="loadPreset('H6')">H6</button>
        </div>
        
        <textarea
          v-model="jsonInput"
          class="json-input"
          rows="25"
        />
        
        <button @click="executeCalculation" class="run-btn">
          執行計算
        </button>
      </div>
      
      <!-- 右側：結果區 -->
      <div class="right-panel">
        <section>
          <h2>1. Edge Flows</h2>
          <ul>
            <li v-for="[uid, flow] in flowStore.edgeFlows" :key="uid">
              {{ uid }}: {{ flow.itemId }} @ {{ flow.rate.toFixed(2) }}/min
            </li>
          </ul>
        </section>
        
        <section>
          <h2>2. Node Efficiencies</h2>
          <ul>
            <li v-for="[uid, eff] in flowStore.nodeEfficiencies" :key="uid">
              {{ uid }}: {{ (eff * 100).toFixed(1) }}%
            </li>
          </ul>
        </section>
        
        <section>
          <h2>3. Item Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Produced</th>
                <th>Consumed</th>
                <th>Net</th>
                <th>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in flowStore.itemSummary" :key="item.itemId">
                <td>{{ item.name }}</td>
                <td>{{ item.produced.toFixed(2) }}</td>
                <td>{{ item.consumed.toFixed(2) }}</td>
                <td>{{ item.net.toFixed(2) }}</td>
                <td>{{ (item.efficiency * 100).toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </section>
        
        <section>
          <h2>4. Power Balance</h2>
          <p>Demand: {{ flowStore.powerBalance.demand }} kW</p>
          <p>Supply: {{ flowStore.powerBalance.supply }} kW</p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dev-flow-engine {
  padding: 2rem;
}

.layout {
  display: flex;
  gap: 2rem;
}

.left-panel, .right-panel {
  flex: 1;
}

.preset-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.json-input {
  width: 100%;
  font-family: monospace;
  border: 1px solid #ccc;
  padding: 0.5rem;
}

.run-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
}
</style>
```

---

## 6. 驗證標準

| 項目 | 標準 |
|------|------|
| 計算時間 | < 200ms（H1–H6 情境） |
| 結果正確性 | 與 `flowEngine.test.ts` 預期一致 |
| UI 響應 | 無卡頓，結果即時更新 |
| 錯誤處理 | JSON 格式錯誤時顯示提示 |

---

## 7. 測試流程

1. 開啟 `/dev/flow-engine` 頁面
2. 點選 H1 Preset
3. 點擊「執行計算」
4. 檢查右側結果是否符合預期
5. 重複 H2–H6

---

*此文件對應 V5-A2 工項，實作後標記 [x] 於 todolist_v5.md。*
