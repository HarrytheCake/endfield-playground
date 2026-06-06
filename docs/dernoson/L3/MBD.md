# MBD — 右側統計面板 + Flow Chart 元件

**所屬層次：** L3 UI 元件層
**負責區塊：** 右側統計面板（CR-04 spec 2.5）+ Flow Chart 元件（CR-05 spec 5.3）
**背景：** 學徒，剛加入
**文件版本：** v0.2（azure9572 轉任 L1 後接手 Flow Chart 元件；AlertList 移至 avery）

---

## 1. 角色定位

MBD 負責「**Phase 1 MVP 不卡這個**」的兩個區塊 —— 右側統計面板與 Flow Chart 元件。共同特點：

- **純展示**：資料給我、我畫出來，沒有複雜互動
- **不擋路**：即使 MBD 完全沒交付，藍圖編輯、管線拉線、流量計算、警示列表都能跑（avery 負責 AlertList）
- **可慢慢做**：不像 InfoPanel / DeviceToolbar 是 user 全程在用的核心，StatsPanel 是「看數字」、FlowChart Phase 1 是「browse 用」

對剛加入的成員來說，這是一個非常適合慢節奏入門的範圍：
- 你會學到怎麼寫 Vue 3 `<script setup>` 與 TypeScript Props
- 你會練到 Tailwind 的表格與排版
- 你會了解 L3 怎麼跟 L2 溝通（emit event）

不用緊張。寫不出來可以問 dernoson、avery（也是入門）、或在 PR 留 comment。

### 目前狀態

- **L1 上游已就緒**：flowStore 已完成（含 ItemSummary / EdgeFlow 等）；CR-05 的 viewStore / flowChartStore 由 **dernoson + aaaaa 在 L1 包裝**，內部用 azure9572 寫的純函式（buildFlowChartGraph / computeFlowChartLayout）計算 —— **節點座標已算好餵給你，你不用算座標**。
- **L2 容器層尚未開工**：`StatsPanel/Index.vue`、`FlowChart/Index.vue` 的容器接線、harry / toby 都還沒動工。
- 因此你**不會被卡住**：可以先做純靜態元件 + Storybook（用 mock fixture），等 L2 開規格時再對齊正式的 props / emits。這份文件中的介面範例屬於「建議稿」。
- **AlertList 已移交 avery**：精簡 MBD 的工作範圍，讓你專注做 StatsPanel + FlowChart。
- **Vue Flow 已選定**：FlowChart 節點與邊都會用 Vue Flow 的 custom node / custom edge 寫法，不需要評估其他套件。

---

## 2. 元件清單

> **元件資料夾命名慣例**：每個元件對應一個 PascalCase 資料夾，主元件用 `Index.vue` 命名，該元件的子元件以 PascalCase 平鋪在同一資料夾下。範例：`src/components/StatsPanel/Index.vue`（主）、`src/components/StatsPanel/PowerSummary.vue`（子）。

### 2.1 StatsPanel（右側統計面板，CR-04 spec 2.5）

| 元件 | 路徑 | 複雜度 |
|---|---|---|
| `StatsPanel`（主） | `src/components/StatsPanel/Index.vue` | 簡單（容器） |
| `PowerSummary` | `src/components/StatsPanel/PowerSummary.vue` | 很簡單 |
| `ItemSummaryTable` | `src/components/StatsPanel/ItemSummaryTable.vue` | 簡單 |
| `TicketEstimate` | `src/components/StatsPanel/TicketEstimate.vue` | 簡單（Phase 2） |
| `WarehouseEstimate` | `src/components/StatsPanel/WarehouseEstimate.vue` | 簡單 |

### 2.2 Flow Chart 元件（CR-05 spec 5.3）

| 元件 | 路徑 | 複雜度 |
|---|---|---|
| `FlowChart`（主） | `src/components/FlowChart/Index.vue` | 中（Vue Flow `<VueFlow>` 容器組合節點與邊） |
| `MaterialNode` | `src/components/FlowChart/MaterialNode.vue` | 簡單 |
| `DeviceNode` | `src/components/FlowChart/DeviceNode.vue` | 中 |
| `ProductNode` | `src/components/FlowChart/ProductNode.vue` | 簡單 |
| `WarehouseNode` | `src/components/FlowChart/WarehouseNode.vue` | 簡單 |
| `PendingImportNode` | `src/components/FlowChart/PendingImportNode.vue` | 簡單（Phase 2） |
| `FlowEdge` | `src/components/FlowChart/FlowEdge.vue` | 中 |

> Flow Chart 節點與邊都以 Vue Flow 的 custom node / custom edge 寫法實作。`@vue-flow/core` 已安裝在專案內。L3 主要負責「節點與邊的視覺呈現」，Vue Flow 容器（畫布、平移縮放、選取互動）由 L2 處理。  \
> **節點佈局座標由 L1 算好餵進來**（azure9572 在 `src/lib/flowChart/layout.ts` 寫純函式演算法，dernoson / aaaaa 在 store 端串接），你只負責畫節點。

---

## 3. 介面範例

### 3.1 `StatsPanel/PowerSummary.vue`

最簡單，先做這個熟悉節奏。

```vue
<script setup lang="ts">
interface Props {
  totalDemandKw: number      // 總耗電
  totalSupplyKw: number      // 總供電
  deviceCount: number
  deviceErrorCount: number
  connectionCount: number
}

const props = defineProps<Props>()

const surplus = computed(() => props.totalSupplyKw - props.totalDemandKw)
</script>

<template>
  <section class="p-3 space-y-1 text-sm">
    <div>總耗電量：{{ totalDemandKw }} kW</div>
    <div>總供電量：{{ totalSupplyKw }} kW</div>
    <div :class="surplus >= 0 ? 'text-green-600' : 'text-red-600'">
      電力狀態：
      <span v-if="surplus >= 0">盈餘 {{ surplus }} kW</span>
      <span v-else>不足 {{ -surplus }} kW</span>
    </div>
    <div>設備數量：{{ deviceCount }} 台（含 {{ deviceErrorCount }} 台有 Error）</div>
    <div>管線數量：{{ connectionCount }} 條</div>
  </section>
</template>
```

純展示，**沒有 emit**。

### 3.2 `StatsPanel/ItemSummaryTable.vue`

```ts
interface ItemSummaryRow {
  itemId: string
  name: string
  iconUrl: string
  produced: number            // /min
  consumed: number            // /min
  net: number                 // produced - consumed
  efficiency: number          // 0~1
}

interface Props {
  rows: ItemSummaryRow[]
}
```

需要根據 net 的正負給不同顏色：

- `net > 0` → 綠色（盈餘）
- `net < 0` → 紅色（不足）
- `net === 0` → 預設色

效率顏色與 L3.md 共用的對照表一致。

### 3.3 `StatsPanel/TicketEstimate.vue`（Phase 2，可先放著）

```ts
interface TicketRow {
  itemId: string
  name: string
  ratePerMin: number
  ticketPerHour: number
}

interface Props {
  rows: TicketRow[]
  totalTicketPerHour: number
}
```

### 3.4 `StatsPanel/WarehouseEstimate.vue`

```ts
interface WarehouseRow {
  itemId: string
  name: string
  hoursToFull: number | null    // null = 此品項淨產量 <= 0
}

interface Props {
  capacityCells: number
  rows: WarehouseRow[]
}

interface Emits {
  (e: 'update:capacityCells', v: number): void
}
```

容量是使用者輸入的，所以這裡有 v-model。

### 3.5 `StatsPanel/Index.vue`（把上面組起來）

把 PowerSummary / ItemSummaryTable / TicketEstimate / WarehouseEstimate 依序排在右側欄即可。每塊的 props 由 L2 傳進來。

> AlertList 已由 avery 負責（同樣放在右側區），不在你這。L2 會把兩個面板組合在右側欄。

### 3.6 Flow Chart 節點通用 props

每個 node 元件接的東西大同小異：

```ts
interface NodeProps {
  id: string
  label: string
  /** 節點佈局座標（由 L1 layout 演算法算好；azure9572 寫純函式，store 由 dernoson / aaaaa 包裝） */
  position: { x: number; y: number }
  /** 節點是否被選取／高亮 */
  selected?: boolean
  highlighted?: boolean
}

// DeviceNode 多一個效率
interface DeviceNodeProps extends NodeProps {
  efficiency: number | null    // 0~1；null = 未計算（灰）
  iconUrl: string
  recipeName: string | null
}

// ProductNode 多速率
interface ProductNodeProps extends NodeProps {
  itemId: string
  iconUrl: string
  ratePerMin: number
}
```

每個節點的 emit 統一是：

```ts
interface NodeEmits {
  (e: 'select', id: string): void
}
```

### 3.7 `FlowChart/FlowEdge.vue`

```ts
interface Props {
  id: string
  source: { x: number; y: number }
  target: { x: number; y: number }
  itemName: string
  ratePerMin: number
  /** 是否被選取（聯動高亮用） */
  highlighted?: boolean
}
```

### 3.8 Flow Chart 視覺規格

| 節點類型 | 形狀 | 邊框／背景 | 文字 |
|---|---|---|---|
| 原料節點 (`MaterialNode`) | 圓角矩形 | 深灰底、白字 | 名稱 + 供給速率 |
| 設備節點 (`DeviceNode`) | 矩形 | 背景色依效率 | 設備圖示 + 名稱 + 配方 + 效率 % |
| 產物節點 (`ProductNode`) | 橢圓 | 白底，淡邊框 | 品項圖示 + 名稱 + 速率 |
| 倉庫節點 (`WarehouseNode`) | 橢圓 | 虛線邊框 | 倉庫圖示 + 品項 |
| 待導入節點 (`PendingImportNode`) | 矩形 | 虛線、半透明 | 設備名 + 「待導入」標記（Phase 2） |

效率顏色與 L3.md 共用對照表一致。

### 3.9 `FlowChart/Index.vue`（容器）

用 Vue Flow 的 `<VueFlow>` 元件包，傳入 nodes / edges 陣列，並透過 `nodeTypes` 對映到上面定義的五種 custom node：

```ts
import { VueFlow } from '@vue-flow/core'
import MaterialNode from './MaterialNode.vue'
// ... 其他節點

const nodeTypes = {
  material: MaterialNode,
  device: DeviceNode,
  product: ProductNode,
  warehouse: WarehouseNode,
  pendingImport: PendingImportNode,
}
```

具體 props 由 L2 開規格時定稿。

---

## 4. 學習路徑（建議順序）

剛開始接觸前端，建議拆很小步：

### 階段 A：StatsPanel（先熟悉 Vue 3 + TypeScript 基本）

1. **先讀懂 props** —— 把上面的 interface 抄一遍，理解每個欄位什麼意思；不會的問 dernoson 或對應 spec 章節
2. **靜態 PowerSummary** —— 寫死數字，先把畫面排出來，先看到東西在螢幕上
3. **PowerSummary 接 mock props** —— 把寫死的數字改成從 props 來，在 Storybook 給不同 props 看效果（盈餘 vs 不足）
4. **ItemSummaryTable** —— 練 `v-for` 與條件 class，留意正負值的顏色
5. **WarehouseEstimate** —— 練 v-model
6. **整合 StatsPanel** —— 把上面組起來

### 階段 B：Flow Chart 元件（先熟悉 Vue Flow 的 custom node）

7. **MaterialNode / ProductNode / WarehouseNode**（最簡單三個節點）—— 練 Vue Flow custom node 怎麼寫
8. **DeviceNode** —— 加效率顏色
9. **FlowEdge** —— 路徑與文字定位
10. **FlowChart/Index.vue** —— 用 `<VueFlow>` 容器組合節點與邊

### Phase 2 才做

- `TicketEstimate`（StatsPanel 內）
- `PendingImportNode`（FlowChart 內）

每一小步都交一個 PR，回饋會更快。**不要憋一個月再交一個大 PR。**

> **沒時間壓力**：StatsPanel 與 FlowChart 都屬於「Phase 1 MVP 不卡這個」的元件。你可以慢慢來，先把單一元件做好再下一個。

---

## 5. 與 L2 的對齊節點

| 節點 | 內容 | 對接對象 |
|---|---|---|
| K1 | 確認 `ItemSummaryRow` DTO 形狀（L1 那邊型別叫 `ItemSummary`，已存在；L2 會攤平成 plain DTO 餵給你） | L2（harry） |
| K2 | 倉庫容量 v-model 寫到哪個 store（你不用知道，但介面要對齊） | L2（harry） |
| K3 | Flow Chart 節點 DTO 形狀（L1 凍結的 `FlowChartNode` / `FlowChartEdge` 型別 → L2 攤平 → props；型別由 dernoson 凍結，內容形狀由 azure9572 提建議） | L2（harry） + L1（dernoson / aaaaa） |
| K4 | 節點 select 與藍圖側的聯動高亮，event 簽名 | L2（harry） |
| K5 | Phase 2 調度券要不要先預留 slot | L2（harry） |
| K6 | Storybook mock data 共用一份 fixture（與 goodmorning / avery 對齊） | goodmorning / avery |

---

## 6. 提醒

- **不要 `import { useXxxStore }`**——這是最重要的一條規則。如果寫到某一步覺得「我需要去 store 拿資料」，那是 props 沒給夠，先停下來問。
- 不會寫 TypeScript 沒關係，先把 interface 抄下來，照著用就會了。看不懂的 `?:` 是「optional 屬性」、`|` 是「或」、`<>` 後面接的是泛型。
- Tailwind class 不確定就先寫個能跑的版本，dernoson review 時會幫你調。
- **節點佈局座標不是你算的** —— L1 的 layout 演算法（azure9572 寫的純函式 + Architect 包的 store）會把每個節點的 `position: { x, y }` 算好。如果你想自己用 dagre 之類的，先停下來找 dernoson 對齊。
- 寫不出來就問。早問早寫完。

---

*StatsPanel 的資料來源是 `flowStore`（已就緒，計算結果由 FlowEngine 寫入）。Flow Chart 的資料來源是 L1 的 `flowChartStore`（dernoson / aaaaa 負責 store 本體，內部使用 azure9572 寫的純函式從 editorStore / flowStore 衍生）。兩者都不會由你直接 import，而是 L2 攤平後以 props 餵進來。*
