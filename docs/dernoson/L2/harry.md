# harry — L2 Owner of CR-01 + CR-02

**角色：** L2 容器層 Owner（CR-01 畫布 + CR-02 管線 合併區塊）
**背景：** 對前端技術稍微了解的大學生；已先動 CR-02 一小部分
**配對：** 與 toby（Senior IC）共同負責 L2

---

## 1. 角色定位

harry 是 L2 的 PR Owner 與對外介面協調人。技術深度由 toby 補齊，但「整個 L2 對 L1 / L3 / spec 對齊」這件事掛在 harry 名下。

主要承擔：
- 把 spec 拆成可實作 task，分給自己與 toby
- 跟 L1（dernoson、aaaaa）對齊 store 介面
- 跟 L3 四人組對齊 props / events 介面
- 自己 own 基礎互動的實作 PR
- 整體 review PR 流程的順暢度

不需要自己扛的：
- 高難度路徑 / 拓樸演算法（toby）
- 跨 store 原子操作對應的 L1 action 釐清（toby 主導，但若 L1 沒提供對應 high-level action，由 toby 反映回 L1 補上）
- 框選複製含管線的歷史包裝（由 L1 提供的 high-level action 統一處理；toby 跟 L1 釐清介面）

---

## 2. 主要職責

### 2.1 對外協調（高優先）

| 對象 | 工作 |
|---|---|
| L1（dernoson / aaaaa）| 列出 L2 需要的 high-level action / selector 簽名，缺的請 L1 補；**注意：每個 L2 互動都應對應到一個會自動進歷史的 L1 action**，若沒有對應 action 請主動提 issue 給 L1 補（而不是在 L2 自己包 Command） |
| L3（四人組）| 為每個 L3 元件先寫好 `defineProps<P>()` / `defineEmits<E>()`，鎖定後通知 L3 開工；準備 mock data |
| spec | 每週對一次 `01_canvas_and_devices.md` 與 `02_pipeline.md` 有沒有更新，沒對齊到的 issue 馬上開 |
| toby | 至少每 2 天同步一次進度；遇到看不懂的技術問題立刻拉 toby review，不要硬扛 |

### 2.2 自己 own 的實作

下列項目由 harry 自己寫 PR，toby review：

> 目前 harry / toby 尚未實際動工，但 L1 上游已就緒。建議 harry 的第一個任務：把 `src/components/Canvas/Index.vue` 開出來，消費 `editorStore.nodes` / `edges` 透過 Vue Flow 渲染。

| 模組 | 工作內容 |
|---|---|
| **CR-01 工具列 → 畫布 拿起流程** | 點選工具列設備 → 呼叫 `editorStore.armPlacement(equipment)` → 滑鼠移動時於 L2 container 維護預覽座標與 snap → 單擊放置時呼叫 `editorStore.placeDevice(node: FactoryNode)`（該 action 內部自動產生 Command 進歷史）；Esc 呼叫 `editorStore.disarmPlacement()` |
| **CR-01 R 鍵旋轉 / Esc 取消** | 用 `useMagicKeys` 綁定，旋轉於拿起預覽中以 L2 local state 處理（`Rotation = 0 \| 1 \| 2 \| 3`），放置時帶入 `FactoryNodeData.rotation` |
| **CR-01 連續擺放** | 工具列拿起的設備放下後保持 armed 狀態（不呼叫 `disarmPlacement`），按 Esc 才結束 |
| **CR-01 配方變更** | 點選已擺放設備 → 左側面板顯示配方表（資料映射） → 切換時呼叫 `editorStore.setRecipe(uid, recipeIndex)`（action 自動進歷史） |
| **CR-01 左側面板資料映射** | 把 `Machine` 定義 + `FactoryNodeData.recipeIndex` 整理成 plain props 餵給 L3 的 `<InfoPanel>` |
| **CR-01 / CR-02 共用 keymap** | Ctrl+Z / Ctrl+Y / Delete / Space 等預設快捷鍵**已由 L1 的 `useShortcuts()` composable 於 MainLayout 統一處理**，harry 不需重複註冊；新增的 P 鍵、Ctrl+C 等才需自行綁定 |
| **CR-02 管線模式切換** | P 鍵 / 工具列按鈕呼叫 `editorStore.setActiveTool(tool: ToolMode)` 切到管線工具 |
| **CR-02 起點選取與 type 判斷** | 點選 port → 從 machine 定義取 `PortType` → L2 container 內維護 draft 狀態（**`DraftConnection` 型別並不存在於程式碼**，由 L2 自行用 local ref 表達） |
| **CR-02 手動彎折點新增** | 繪製中點選空格 → 推入 L2 local draft 的 waypoints 陣列；commit 時組成 `FactoryEdge` 呼叫 `editorStore.addConnection(edge)` |
| **CR-02 自動吸附** | 滑鼠靠近 port 1 格內時，把 cursorPos snap 到 port 中心；UI 切換為「綠色放大圓點」prop |
| **CR-02 管線刪除** | 選取管線後 Delete（已由 `useShortcuts()` 處理）→ `editorStore.removeConnection(uid)`（action 自動進歷史） |
| **CR-04 流量數值映射到 L3** | 把 `flowStore.edgeFlows` / `nodeEfficiencies` 整理成 prop |
| **CR-03 警示等級映射到 L3** | 用 `validationStore.alertsByDevice(uid)` / `alertsByConnection(uid)` 算出 `alertLevel: 'none' \| 'warning' \| 'error'` 餵 prop |

### 2.3 與 toby 的協作

harry → toby 的「請接手」清單：

| 項目 | 為什麼丟給 toby |
|---|---|
| 90 度路徑驗證即時偵測 | 邏輯細節多、要快、和 L2 local draft 反應性強耦合 |
| autoNode（分流 / 匯流 / 物流橋）的 L2 wiring | Phase 1 L1 的 `addConnection` 為簡化版尚未含 autoNode，toby 負責跟 L1 確認 high-level action 簽名與補上時程 |
| 設備移動時管線跟隨更新 | 需要對應的 L1 high-level action（`moveDevices` 完成自動處理跟隨與 auto-connect 並進單一歷史；Phase 1 尚未補齊）；toby 跟 L1 對齊介面 |
| 框選複製含管線 | `pasteSelection(devices, connections, offset)` 已存在；新舊 uid 對照表由 L1 處理 |
| Edge Scrolling 平滑捲動 | requestAnimationFrame 寫起來細節多 |

協作節奏：

- harry 開 PR → toby review；toby 開 PR → harry review（互相走 review）
- harry 的 PR 不需要 toby 改架構，但要採納技術建議
- 卡住超過半天請直接喊 toby pair；不要拖

---

## 3. 對 L1 的依賴清單

L1 上游已就緒可用的 stores 與 API 如下（位置：`src/store/`）。所有列在「高階 actions」區段的呼叫一次就會自動產生 Command 並推入歷史，L2 不需要也不應該自己包 Command。

> 注意：原規劃的 `usePlacedDeviceStore` 與 `usePipelineStore` 已合併為單一 `useEditorStore`；`PlacedDevice` / `Connection` / `DraftConnection` / `Port` / `HeldDevice` 等型別**並不存在於程式碼**，Plan B 改採 Vue Flow 的 `FactoryNode` / `FactoryEdge` 為主資料結構。

### 3.1 editorStore 高階 actions（自動進歷史）

```typescript
import { useEditorStore } from '@/store/editorStore'

placeDevice(node: FactoryNode): void
moveDevices(uids: string[], delta: { x: number; y: number }): void  // 內部處理管線跟隨（CR-02 階段補）
rotateDevice(uid: string, rotation: Rotation): void                 // Rotation = 0|1|2|3
removeDevices(uids: string[]): void                                 // 含關聯邊
setRecipe(uid: string, recipeIndex: number): void
pasteSelection(devices: FactoryNode[], connections: FactoryEdge[], offset: { x: number; y: number }): void
addConnection(edge: FactoryEdge): void                              // Phase 1 簡化版；autoNode 自動生成未實作
removeConnection(uid: string): void
```

### 3.2 editorStore UI 狀態 actions（不進歷史）

```typescript
setMapSize(width: number, height: number): void
setSnapToGrid(enabled: boolean): void
setActiveTool(tool: ToolMode): void
setSelectedEquipment(equipment: EquipmentType): void
armPlacement(equipment: EquipmentType): void
disarmPlacement(): void
resetCanvas(): void
```

### 3.3 historyStore（L2 只用下列 API）

```typescript
import { useHistoryStore } from '@/store/historyStore'

canUndo / canRedo            // computed
undoDepth / redoDepth        // computed
undo(): Command | null
redo(): Command | null
clear(): void
// ※ L2 不呼叫 execute()
```

### 3.4 其他可消費 store

```typescript
useCanvasStore()
// gridSize / offset / zoom / baseRegion / showGrid / canvasSize
// setZoom(0.1~4 clamp) / setOffset / setBaseRegion / toggleGrid / setGridSize

useValidationStore()
// alerts / errorCount / warningCount / hasAnyError
// hasBlockingError(uid) / alertsByDevice(uid) / alertsByConnection(uid)

useFlowStore()
// edgeFlows / nodeEfficiencies / itemSummary / sinkDeliveries / congestedEdges
// powerBalance / hasPowerShortage / ticketOutput / warehouseEstimates
// setTicketRate / setWarehouseCapacity 可用於設定面板

useSelectionStore()
// selectedNodeIds / hasSelection / isMultiSelect
// setSelection(ids) / clearSelection()
```

### 3.5 L1 已掛載的 composable（MainLayout 內）

```typescript
useValidation()  // sync watch editorStore，run validation
useFlowEngine()  // debounce 150ms watch editor + alerts，run FlowEngine
useShortcuts()   // Ctrl+Z/Y → historyStore，Delete → removeDevices，Space → setActiveTool
```

harry **不需要也不應該**重複呼叫這些 composable。

> 若發現某個 L2 互動沒有對應的 high-level action（例如某個跨 store 操作、autoNode 自動生成尚未由 `addConnection` 內部處理），**主動向 L1 反映補上**，不要在 L2 自己組 Command 或寫 macros。

---

## 4. 對 L3 四人組要交付的元件介面清單

下列元件由 harry 出 props / emits 介面 spec（rough draft 由 harry 寫，toby review），L3 接手實作純展示：

下列元件遵循新慣例：**每個元件一個 PascalCase 資料夾，主元件命名為 `Index.vue`，子元件用 PascalCase 平鋪在同一資料夾下**。

| L3 元件 | 用途 | 介面定義位置 |
|---|---|---|
| `<Canvas>`（主） | 主畫布容器（格線、縮放、平移、互動接線）— **L2 自己寫** | `src/components/Canvas/Index.vue` |
| ─ `DevicePreview` | 拿起狀態的半透明預覽（goodmorning） | `src/components/Canvas/DevicePreview.vue` |
| ─ `DirectionPicker` | 長按朝向選擇菱形框（goodmorning） | `src/components/Canvas/DirectionPicker.vue` |
| ─ `PlacedDeviceSprite` | 已擺放設備視覺（goodmorning） | `src/components/Canvas/PlacedDeviceSprite.vue` |
| ─ `GridBackground` | 格線背景（goodmorning） | `src/components/Canvas/GridBackground.vue` |
| ─ `BaseRegionOverlay` | 武陵液體輸入方位標示（goodmorning） | `src/components/Canvas/BaseRegionOverlay.vue` |
| ─ `PortDot` | 設備接口圓點（avery） | `src/components/Canvas/PortDot.vue` |
| ─ `PipelineEdge` | 管線本體視覺（avery） | `src/components/Canvas/PipelineEdge.vue` |
| ─ `PipelineDraft` | 繪製中管線預覽（avery） | `src/components/Canvas/PipelineDraft.vue` |
| ─ `AutoNodeBadge` | 分流/匯流/物流橋圖示與切換按鈕（avery） | `src/components/Canvas/AutoNodeBadge.vue` |
| `<DeviceNode>` | 單一已擺放設備視覺 | `src/components/FlowChart/DeviceNode.vue` |
| `<MaterialNode>` | 原料節點 | `src/components/FlowChart/MaterialNode.vue` |
| `<ProductNode>` | 產品節點 | `src/components/FlowChart/ProductNode.vue` |
| `<WarehouseNode>` | 倉儲節點 | `src/components/FlowChart/WarehouseNode.vue` |
| `<PendingImportNode>` | 待匯入節點 | `src/components/FlowChart/PendingImportNode.vue` |
| `<FlowEdge>` | 單條管線視覺（含彎折） | `src/components/FlowChart/FlowEdge.vue` |
| `<FlowChart>` | FlowChart 主畫布（節點 + 邊集合） | `src/components/FlowChart/Index.vue` |
| `<InfoPanel>` | 左側設備資訊面板（三個 Tab：配方表 / 設備形狀 / 耗電資訊） | `src/components/InfoPanel/Index.vue` |
| ─ `RecipeListTab` | 配方表 Tab | `src/components/InfoPanel/RecipeListTab.vue` |
| ─ `DeviceShapeTab` | 設備形狀 Tab | `src/components/InfoPanel/DeviceShapeTab.vue` |
| ─ `PowerInfoTab` | 耗電資訊 Tab | `src/components/InfoPanel/PowerInfoTab.vue` |
| ─ `DeviceShapeDiagram` | 設備形狀示意圖 | `src/components/InfoPanel/DeviceShapeDiagram.vue` |
| `<DeviceToolbar>` | 下方設備工具列 | `src/components/DeviceToolbar/Index.vue` |
| ─ `CategoryTabs` | 分類 Tab | `src/components/DeviceToolbar/CategoryTabs.vue` |
| ─ `DeviceCard` | 工具列中的單一設備卡片 | `src/components/DeviceToolbar/DeviceCard.vue` |
| ─ `ToolbarSearch` | 搜尋列 | `src/components/DeviceToolbar/ToolbarSearch.vue` |
| `<AlertList>` | 警示列表（CR-03） | `src/components/AlertList/Index.vue` |
| ─ `AlertItem` | 單一警示項目 | `src/components/AlertList/AlertItem.vue` |
| `<ViewSwitcher>` | 左下角視角切換控項（CR-05） | `src/components/ViewSwitcher/Index.vue` |
| `<SplitLayout>` | 並列視角分隔容器（CR-05） | `src/components/SplitLayout/Index.vue` |
| `<SplitOrientationToggle>` | 分隔方向切換（CR-05） | `src/components/SplitOrientationToggle/Index.vue` |
| `<StatsPanel>` | 統計面板（CR-04 / 整體耗電與物料） | `src/components/StatsPanel/Index.vue` |
| ─ `PowerSummary` | 耗電統計 | `src/components/StatsPanel/PowerSummary.vue` |
| ─ `ItemSummaryTable` | 物料統計表 | `src/components/StatsPanel/ItemSummaryTable.vue` |
| ─ `TicketEstimate` | 工票估算 | `src/components/StatsPanel/TicketEstimate.vue` |
| ─ `WarehouseEstimate` | 倉儲估算 | `src/components/StatsPanel/WarehouseEstimate.vue` |

每個元件的 props / emits 草案範例見 `L2.md` §5.2。

---

## 5. 工作節奏建議

| 週期 | 動作 |
|---|---|
| 每天 | 自己 PR 推進 / 確認 toby 有沒有被 block |
| 隔天 | 與 toby 30 分鐘同步 |
| 每週 | 對 spec diff、對 L1 / L3 介面是否還有缺口 |
| 里程碑前 | 走過 spec 第 7 節驗證表，補洞 |

---

*本文件為 harry 的 L2 個人職責定義，總體分層原則見 `L2.md`。*
