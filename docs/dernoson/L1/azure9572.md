# azure9572 — L1 Algorithm Contributor

**角色：** L1 Algorithm Contributor（演算法貢獻者）
**所屬層：** L1（基礎建設層）
**主責範疇：** CR-05 Phase 1 的純演算法（衍生計算 + 自動佈局）

---

## 1. 角色定位

azure9572 是學生，偏好數理與演算法。在 L1 中扮演「演算法貢獻者」：**只負責 CR-05 Phase 1 的純函式演算法**，**完全不碰 Vue / Pinia / store 結構 / UI**。

這個分工的好處：
- 純函式可單獨單元測試，不需要跑整個 Pinia / Vue 環境
- 演算法輸入輸出有明確型別合約，跟上下游解耦
- store / 響應式整合由 dernoson + aaaaa 包裝，azure9572 不會被 store API 設計變動影響

跟 shirone 的角色完全平行：

| 人 | 純函式主軸 |
|---|---|
| shirone | CR-03 各個 detector（規則類） |
| azure9572 | CR-05 衍生計算與 Flow Chart 自動佈局（演算法類） |

兩人都不寫 store、不寫 Vue 元件、不寫 composable。store 與響應式由 dernoson + aaaaa 處理。

---

## 2. 寫程式時看到的世界

azure9572 只看到「**輸入資料 → 輸出資料**」的純函式：

```typescript
// 例：從藍圖衍生 Flow Chart 結構
export function buildFlowChartGraph(
  devices: ReadonlyArray<FactoryNode>,
  edges: ReadonlyArray<FactoryEdge>,
  flowResults: FlowEngineSnapshot,   // 純資料 snapshot，非 ref 非 computed
): FlowChartGraph {
  // ... 純邏輯
}

// 例：自動佈局
export function computeFlowChartLayout(
  graph: FlowChartGraph,
): Map<string, { x: number; y: number }> {
  // ... 純演算法
}
```

不會出現 `ref` / `computed` / `defineStore` / `useXxxStore` / `import 'vue'`。如果寫到某一步覺得「需要拿 store 的東西」或「需要 Vue 反應性」，那是介面設計問題，回頭找 dernoson 或 aaaaa 補資料合約。

---

## 3. CR-05 Phase 1 的具體交付

對應 `spec/05_recipe_flow.md` 的 Phase 1 部分。

### 3.1 Flow Chart 衍生計算

**目標**：從藍圖狀態（`FactoryNode[]` + `FactoryEdge[]`）加上 FlowEngine 計算結果（`FlowEngineSnapshot`），推導出 Flow Chart 的節點與邊。

```typescript
// src/lib/flowChart/buildGraph.ts（純函式檔案）

export interface FlowChartNode {
  uid: string
  type: 'source' | 'device' | 'product' | 'warehouse'
  label: string
  deviceUid: string | null      // 對應藍圖中的設備 uid（若有）
  itemId: string | null
  rate: number | null
  efficiency: number | null     // 0~1
  // 注意：position 不在這層，由 layout 演算法另外算
}

export interface FlowChartEdge {
  uid: string
  fromNodeUid: string
  toNodeUid: string
  itemId: string
  rate: number
}

export interface FlowChartGraph {
  nodes: FlowChartNode[]
  edges: FlowChartEdge[]
}

export function buildFlowChartGraph(
  devices: ReadonlyArray<FactoryNode>,
  edges: ReadonlyArray<FactoryEdge>,
  snapshot: FlowEngineSnapshot,
): FlowChartGraph
```

`FlowEngineSnapshot` 是 dernoson + aaaaa 凍結的純資料型別（從 `flowStore` 的狀態抽出 plain DTO 餵進來），azure9572 不需要碰 flowStore 本身。

### 3.2 Flow Chart 自動佈局演算法

CR-05 spec 明確要求「節點佈局位置由 L1 算好」（spec §3.1）。azure9572 主責：

```typescript
// src/lib/flowChart/layout.ts（純函式檔案）

export interface NodePosition {
  x: number
  y: number
}

export function computeFlowChartLayout(
  graph: FlowChartGraph,
): Map<string, NodePosition>
```

演算法選擇：
- 可以套 `dagre`（成熟 DAG 排版套件，本專案可加 dep）
- 也可自製簡化版（從 source 逐層往右排）
- 規範：自左向右排列、最終產物在最右側、無重疊

azure9572 決定演算法選擇，dernoson review。

### 3.3 不需要碰的東西（由 dernoson + aaaaa 負責）

| 不要動 | 誰負責 |
|---|---|
| `src/store/viewStore.ts`（Pinia store：currentView / splitDirection / splitRatio） | dernoson 或 aaaaa |
| `src/store/flowChartStore.ts`（Pinia store：把 `buildFlowChartGraph` + `computeFlowChartLayout` 的結果包成 computed 給 UI） | dernoson 或 aaaaa |
| watch / reactive / debounce 等響應式整合 | dernoson 或 aaaaa |
| `useFlowChart` composable（若有） | dernoson 或 aaaaa |
| 任何 `.vue` / UI 元件 | L2 / L3 |
| L1 既有 stores（editorStore / flowStore / validationStore 等）內部結構 | dernoson + aaaaa |

azure9572 只負責「**演算法 + 純資料型別**」。store 把演算法結果包成響應式給 UI 用的工作，**完全由 dernoson + aaaaa 處理**。

---

## 4. 單元測試建議

純函式最適合單元測試。每個演算法至少要涵蓋：

1. **空輸入**：`devices: [], edges: []` → 不該 throw、回傳空圖
2. **線性鏈路**：source → device → sink，確認衍生出對應的 FlowChart 節點與邊
3. **多源 / 多匯**：兩個 source 匯流到一個 device，確認 edge 數量與品項 id 正確
4. **佈局**：相同輸入跑兩次，回傳的座標應該 deterministic（純函式特性）
5. **邊界**：孤立節點、環路（FlowEngine 已標記為 invalid 的）應該被合理排除或標示

測試檔位置：
- `src/__tests__/lib/flowChart/buildGraph.test.ts`
- `src/__tests__/lib/flowChart/layout.test.ts`

可以用既有 `src/__tests__/flowEngine.test.ts` 的 `makeGraph` 風格，輸入直接構造資料、不需要 Pinia。

---

## 5. 工作流程

### 5.1 跟 dernoson + aaaaa 對齊資料合約

開工第一件事：跟 dernoson + aaaaa 對齊以下型別（由 dernoson 或 aaaaa 凍結於 `src/types/`）：

- `FlowEngineSnapshot`：給 `buildFlowChartGraph` 的輸入快照（包含 edgeFlows / nodeEfficiencies / itemSummary 等所需欄位）
- `FlowChartNode` / `FlowChartEdge` / `FlowChartGraph`：azure9572 提建議形狀，dernoson 凍結
- `NodePosition`：簡單 `{ x, y }`

凍結後 azure9572 在 `src/lib/flowChart/` 寫純函式，dernoson / aaaaa 在 `src/store/` 寫對應 store 與 composable。

### 5.2 一個演算法一個 PR

- `buildFlowChartGraph` 一個 PR（含單元測試）
- `computeFlowChartLayout` 一個 PR（含單元測試）
- 兩個可以同時開發、互不阻塞
- PR review 由 dernoson 主審，aaaaa 視情況加入

### 5.3 Phase 2 / Phase 3 暫不處理

- Phase 2 的「新增流程配方」「中間產物倉庫直取」等編輯互動 → 等 Phase 2 啟動再討論
- 未來如果有 CR-06 migrate（Zod）/ CR-07 LP 等算法工作，會再找你；但 phase 1 階段不在範圍內

---

## 6. 與其他人的協作介面

| 對象 | 介面 | 形式 |
|---|---|---|
| dernoson | 資料型別 review、PR 把關 | dernoson 凍結 `FlowEngineSnapshot` / `FlowChartGraph` 等型別 |
| aaaaa | 提供 `FlowEngineSnapshot` 從 flowStore 的對映方式 | aaaaa 在 store 端把 flowStore 攤平為 snapshot |
| shirone | 不直接協作（兩人主軸不同） | 可互相參考測試風格 |
| L2 / L3 | 不直接協作 | UI 看到的是 store 包裝過的結果，跟 azure9572 隔了一層 |

---

## 7. 工作節奏建議

| 順序 | 工項 | 依賴 | 狀態 |
|---|---|---|---|
| 1 | 跟 dernoson + aaaaa 對齊 `FlowEngineSnapshot` / `FlowChartGraph` 型別 | dernoson | 未開始 |
| 2 | `buildFlowChartGraph` 純函式 + 單元測試 | 第 1 項完成 | 未開始 |
| 3 | `computeFlowChartLayout` 純函式 + 單元測試 | 型別凍結後 | 未開始 |
| 4 | dernoson + aaaaa 用 azure9572 的純函式包成 `flowChartStore` Pinia store | azure9572 交付 | 未開始（由 dernoson / aaaaa 做） |
| 5 | Phase 2 啟動時再討論「新增流程配方」等編輯邏輯 | Phase 2 | 未開始 |

---

*本文件為 azure9572 個人職責定義。CR-05 的 store / 響應式整合由 dernoson + aaaaa 負責；azure9572 只寫 `src/lib/flowChart/` 下的純函式。*
