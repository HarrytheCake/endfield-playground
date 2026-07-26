# aaaaa — L1 Architect

**角色：** L1 Architect（在業工程師）
**所屬層：** L1（基礎建設層）
**主責範疇：** 全域型別、FlowEngine、graph utility、共用 store 骨架

---

## 1. 角色定位

aaaaa 是 L1 的「資料與計算」主責 Architect。目前對專案貢獻最多，CR-04 的型別定義與資料層已經完成。接下來主導 FlowEngine 主流程、graph utility、以及各個 store 的骨架建立。

與 dernoson 的分工原則：
- **aaaaa 負責「資料怎麼算」**：型別、stores、計算引擎、共用 utility
- **dernoson 負責「操作怎麼記錄、規範怎麼守」**：historyStore、Command Pattern 守門、PR review

---

## 2. 已完成的工作

### 2.1 CR-04 型別定義（V4-A / V4-B / V4-E）

- `src/types/flow.ts`：`RecipeDef` / `ProductDef` 新增 `id` 欄位
- `src/types/machine.ts`：`Machine` 新增 `readonly id: string`
- `src/types/plan.ts`：Plan 相關介面拆分
- `src/utils/portUtils.ts`：Port 工具函式

### 2.2 CR-04 資料層（V4-C / V4-D）

- `src/data/machines.ts`：重構為 `machineList` 陣列 + `machineMap`，移除中文具名 export
- `src/data/devices.ts`：`productList` 重命名，整理 wrapper
- `src/data/plans.ts`：改為 `import type` + re-export
- 41 台機器補齊 snake_case `id`，並提供 `getMachineById(id)`

### 2.3 對應介面（V4 完成版）

```typescript
// 已凍結
export interface Machine {
  readonly id: string
  // ... 其他欄位
}

export function getMachineById(id: string): Machine | undefined
```

> 細節見 `docs/aaaaa/report_v4.md`。

### 2.4 graph utility + FlowEngine 核心演算法

實作位置與原 doc 計劃不同 —— **全部住在 `src/composables/useFlowEngine.ts`**，未單獨抽到 `src/lib/graph/`。經評估後維持現狀（見 §3.2）。

已交付的 exports：

- `buildGraph(nodes: FactoryNode[], edges: FactoryEdge[]): FlowGraph`
- `topologicalSort(graph: FlowGraph): string[]`
- `validateChains(graph: FlowGraph): void`
- `validateRecipeMatch(machineType, recipeIndex, incomingItemIds): boolean`
- `propagateFlows(sortedNodes, graph): Map<string, EdgeFlow>`
- `detectCongestion(graph, edgeFlows): void`
- `calcItemSummary(graph): ItemSummary[]`
- `runFlowEngine(): Promise<void>`
- `useFlowEngine()` composable（watch + debounce 150ms）

對應測試：`src/__tests__/flowEngine.test.ts`（H1–H6 + cycle detection + topologicalSort 獨立驗證）。

---

## 3. 接下來主導的部分

### 3.1 FlowEngine 主流程（CR-04 Phase 1）— ✅ 已完成

對應 `spec/04_flow_simulation.md` 第 2.3、4.1、4.2 節。實際交付：

```typescript
// src/composables/useFlowEngine.ts
export async function runFlowEngine(): Promise<void>
// ↑ 直接從 editorStore 讀 nodes/edges、validationStore 讀 hasBlockingError，
//   並把結果寫回 flowStore.applyResult()
```

執行步驟（已實作）：
1. 過濾有 `hasBlockingError` 的節點 / 邊
2. 建立有向圖（呼叫 `buildGraph`）
3. 拓撲排序（呼叫 `topologicalSort`，遇環略過該子圖）
4. 從 source 正向傳播（`propagateFlows`），記錄 `edgeFlows` 與 `nodeEfficiencies`
5. 偵測壅塞（`detectCongestion`）、統計 `itemSummary`（`calcItemSummary`）
6. 寫回 `flowStore.applyResult(result)`

`useFlowEngine()` composable 以 `watch + debounce 150ms` 串接 editorStore，於 MainLayout 啟用。

### 3.2 graph utility（已完成；維持現狀不抽出）

**現況**：`buildGraph` 與 `topologicalSort` 已實作於 `src/composables/useFlowEngine.ts`，使用 `FlowGraph` 作為共同抽象（含 `FlowNode` 與 `EdgeMeta`），輸入採 Vue Flow 的 `FactoryNode[]` / `FactoryEdge[]`。

**為什麼不抽出純粹的 `DirectedGraph`**：原本 doc 計劃為 CR-03 detector 與 CR-04 FlowEngine 抽出更純的 `DirectedGraph` 共用，但實際評估 CR-03、CR-09、CR-10 的 detector（E001~E005、W001~W005）後發現多數只需要 (z, h) 佔用層與 port / 配方定義，不需要 topological 結構：

- E001 設備重疊、E003 超出基地框線、W004 設備未供電、W005 總耗電量超過供電量 → 只需 `devices[]`
- E002 佈線違法 → 只需 `connections[]` 與已佔用格子的佔用層資訊
- E004 輸入缺失、E005 輸出缺失、W001 材料組合無法處理 → 只需 `connections[]` 與 port / 配方定義
- W002 輸入不足、W003 輸出阻塞 → 需要 FlowEngine 算出的 `edgeFlows`，而非 graph topology 本身

因此 detector 直接接 `(devices, connections)`、FlowGraph 或 FlowEngine 結果即可，不需要中間抽象層。後續若有新 detector 真的需要 graph topology，再回頭重構不遲。

**對齊規則**：未來新增 graph 演算法（cycle、DFS、reachability）若有需要，新增到 `src/composables/useFlowEngine.ts` 旁邊（或同資料夾下的新檔），不再強制搬到 `src/lib/graph/`。

### 3.3 共用 store 骨架（現況）

| Store | 主要狀態 | 狀態 |
|---|---|---|
| `useEditorStore`（兼任 placedDevice + pipeline） | `nodes` / `edges` + 8 個高階 actions | ✅ 已完成。每個 action 內部自動產生 Command 並推入 historyStore |
| `useCanvasStore` | `gridSize` / `offset` / `zoom` / `baseRegion` / `showGrid` / `canvasSize` | ✅ 已完成（不進 history） |
| `useFlowStore` | `edgeFlows` / `nodeEfficiencies` / `itemSummary` / `ticketRate` / `warehouseCapacity` | ✅ 已完成（不進 history，watch 自動重算） |
| `useValidationStore` | `alerts` / `detectors` + `hasBlockingError(uid)` + `registerDetector` / `run(ctx)` | ✅ 骨架完成，等 shirone 接 detector |
| `useSelectionStore` | `selectedNodeIds` / `hasSelection` / `isMultiSelect` | ✅ 已完成 |
| `useHistoryStore` | `undoStack` / `redoStack` + `execute` / `undo` / `redo` / `clear` | ✅ 已完成（dernoson 主責） |

### 3.4 CR-02 autoNode 自動產生邏輯（CR-02 階段補）

**Phase 1 現況**：`editorStore.addConnection(edge: FactoryEdge): void` 為簡化版，**尚未包含** autoNode（分流器 / 匯流器 / 物流橋）自動產生邏輯。Phase 1 只處理「直接連線」，autoNode 留待 CR-02 階段補上。

補上時的形式（規劃，未實作）：

```typescript
// useEditorStore 內
addConnection(edge: FactoryEdge): void
// CR-02 階段擴充內部行為：
//  1. 偵測是否為「拉到管線中途」→ 需要 splitter / merger
//  2. 偵測路徑是否跨越現有管線 → 需要 bridge
//  3. 把 (placeDevice × N) + (addConnection × N) + (updateConnection × N)
//     用 createMacroCommand（L1 內部 helper）組成單一 Command
//  4. 自動把該 Command 推入 historyStore 的 undo stack
//     —— L2 完全不需要也不該自己呼叫 historyStore.execute()
```

無論是否含 autoNode，`addConnection` 都是 L2 拉管線完成時呼叫的唯一入口；Command 的產生與入棧由本 action 內部負責。

---

## 4. 對其他人的支援

### 4.1 給 shirone

shirone 寫 detector 需要的東西：

- `ValidationContext` 結構（已凍結於 `src/types/validation.ts`）—— 不含 graph，直接帶 `devices: FactoryNode[]` / `connections: FactoryEdge[]` / `getDef`
- 若有 detector 真的需要 graph topology，由 aaaaa 從 `useFlowEngine.ts` 暴露對應 helper（目前評估不需要）
- `getOccupiedCells(device, def)` 之類的幾何 helper（aaaaa 視 detector 需求補上）
- E001 骨架已遷移至 `src/lib/validation/detectors/E001_deviceOverlap.ts`（stub），shirone 可直接補 `run()` 邏輯

aaaaa 不需要審 detector 的「規則邏輯」（那是 shirone 主責），但要確保 detector 用到的 utility 是穩定的。

### 4.2 給未來 L2 主責人（harry / toby）

aaaaa 必須交付：

- 每個 store 的對外 actions 簽名清單
- FlowEngine 觸發時機說明（debounce 150ms、watch 哪些 store）
- 一份 dev-only 測試頁，可單獨驗 FlowEngine 計算結果

### 4.3 給 dernoson

- 任何「store action 內部需要組合 macro Command」的場景先和 dernoson 對齊（包含 Command 的 label / 反向順序）
- 型別變更前先在 PR 描述標 Breaking
- 新增 store 時，actions 命名與 spec 對齊（spec 寫 `placeDevice`，store 不要叫 `addDevice`）

---

## 5. dev-only 測試頁

L1 允許寫測試頁，路徑建議放在 `src/app/dev/` 之下並用 dev-only route guard。Phase 1 至少需要：

| 測試頁 | 目的 |
|---|---|
| `/dev/flow-engine` | 手動塞 devices / connections JSON，跑 FlowEngine 看結果 |
| `/dev/graph-viz` | 把 buildGraph 結果以最簡單的 list 印出來，驗環路偵測 |
| `/dev/history-replay` | 看 undo/redo 是否正確還原 store |

這些頁面只供 L1 內部驗證，**不進 production bundle**。

---

## 6. 工作節奏建議

| 順序 | 工項 | 解鎖對象 | 狀態 |
|---|---|---|---|
| 1 | graph utility（buildGraph / topologicalSort）完成並寫單測 | 同時解鎖 shirone 與 FlowEngine | ✅ 已完成（住在 `useFlowEngine.ts`） |
| 2 | editorStore（兼任 placedDevice + pipeline）高階 actions + historyStore Command Pattern | L2 拉管線 / 擺設備 + Ctrl+Z/Y | ✅ 已完成（plan B 維持單一 editorStore） |
| 3 | FlowEngine 主流程 + useFlowStore | CR-04 統計面板 L2 | ✅ 已完成（FlowEngine 主流程 + flowStore 完整） |
| 4 | useValidationStore 骨架 + detector 註冊機制 | shirone 可以提 PR | ✅ 骨架完成（detector 註冊 + alerts 收集），等 shirone 接 detector |
| 5 | 串通完整資料流：擺設備 → 重算驗證 → 重算流量 | 整個 Phase 1 | ✅ 已完成（`useValidation()` + `useFlowEngine()` 串接於 MainLayout） |

---

*本文件為 aaaaa 個人職責定義，與 dernoson / shirone 的協作介面見 `L1.md`。*
