# CR-04 開發 Todo List

**負責人：** aaaaa  
**最後更新：** 2026-05-18

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## 演算法核心邏輯速記

### 速率計算公式
```
單機輸出速率（個/min） = output.quantity × (60 / recipe.time_seconds)
單機輸入需求（個/min） = input.quantity  × (60 / recipe.time_seconds)
傳送帶上限             = 30 個/min（每條連接線）
```

### 合法鏈路條件
鏈路合法需同時滿足：
1. **完整路徑**：從「物品輸出口（is_source=true）」出發，經設備處理，最終抵達「物品輸入口（is_sink=true）」
2. **配方相符**：每台設備的輸入品項必須與所選配方的 inputs 完全對應
3. **無懸空端點**：每條管線的 source/target 均已接至有效節點
不符合以上任一條件的子圖不計入產值計算。

### 效率（配頻）計算
```
設備效率 = min( 各輸入品項的 actual_rate / required_rate )
輸出速率 = recipe_output_rate × 效率

-- 範例（未配頻）--
粉碎機A: 源礦 30/min → 源石粉末 30/min（1:1）
粉碎機B: 藍礦 30/min → 藍礦粉末 60/min（1:2）
研磨機:  需求 源石粉末 60/min + 藍礦粉末 60/min
         實際 30/min + 60/min
         效率 = min(30/60, 60/60) = 0.5
         輸出 = 60/min × 0.5 = 30/min 研製合成粉末方塊
         藍礦粉末剩餘 30/min → 堵塞，上游藍礦消耗縮減為 15/min

-- 範例（配頻）--
粉碎機A×2: 源礦 60/min → 源石粉末 60/min
粉碎機B×1: 藍礦 30/min → 藍礦粉末 60/min
研磨機:    效率 = min(60/60, 60/60) = 1.0
           輸出 = 60/min 研製合成粉末方塊
```

### 堵塞（Congestion）反向傳播
當下游消耗速率 < 上游供給速率時：
```
actual_consumed = downstream_demand
upstream_efficiency = actual_consumed / upstream_supply
```
堵塞從下游往上游逐層回推，直到 source 節點或找到緩衝點。

### 多輸出配方處理
同一配方同一次加工同時產出多種品項（如精煉赤銅礦同時產赤銅塊+汙水）。
所有輸出品項以相同效率等比縮放：
```
outputs.forEach(o => o.actual_rate = o.recipe_rate × efficiency)
```
若其中一輸出的下游被堵塞，整台設備效率受限。

---

## Phase 1 — MVP

### P1-A｜型別與資料基礎（前置，無依賴）

- [x] **A1** 建立 `src/types/flow.ts`，定義以下型別：
  ```typescript
  interface EdgeFlow {
    connectionUid: string
    itemId: string        // 品項名稱（對應 products.json name）
    rate: number          // 個/min（已套用傳送帶上限 min(rate, 30)）
    isCongested: boolean  // 上游供給 > 下游需求
  }
  interface ItemSummary {
    itemId: string
    name: string
    produced: number      // 個/min（所有 source / 設備輸出加總）
    consumed: number      // 個/min（所有 sink / 設備輸入加總）
    net: number           // produced - consumed
    efficiency: number    // 0~1（上游瓶頸決定）
  }
  interface FlowNode {
    deviceUid: string
    isSource: boolean     // 物品輸出口
    isSink: boolean       // 物品輸入口
    isValid: boolean      // false = 略過（Error 節點 or 孤立節點）
    efficiency: number    // 0~1
    // 多輸出配方支援
    outputRates: Map<string, number>  // itemId → 個/min
    inputRates: Map<string, number>   // itemId → 個/min
  }
  interface FlowGraph {
    nodes: Map<string, FlowNode>
    // adjacency: deviceUid → 出邊 connectionUid[]
    outEdges: Map<string, string[]>
    inEdges: Map<string, string[]>
    hasCycle: boolean
    invalidSubgraphUids: Set<string>  // 孤立 / 非合法鏈路的節點
  }
  ```

- [x] **A2** 確認 `src/data/devices.ts`（對應 `docs/aaaaa/data/machines.json`）結構：
  ```typescript
  interface MachineDef {
    name: string
    width: number; height: number
    inputPorts: Port[]
    outputPorts: Port[]
    power: number         // kW，-1 = 待補
    tags: string[]
    isSource?: boolean    // 物品輸出口
    isSink?: boolean      // 物品輸入口
  }
  interface RecipeDef {
    inputs:  { itemId: string; quantity: number }[]
    outputs: { itemId: string; quantity: number }[]
    machine: string       // 對應 MachineDef.name
    timeSeconds: number
    // 衍生欄位（由 FlowEngine 計算，不存在 JSON 中）
    // inputRatePerMin  = quantity × (60 / timeSeconds)
    // outputRatePerMin = quantity × (60 / timeSeconds)
  }
  ```
  若 CR-01 尚未建立，以 stub 資料先行（對齊 `docs/aaaaa/data/machines.json`）。

### P1-B｜Pinia Store（依賴 A1）

- [x] **B1** 建立 `src/store/flowStore.ts`
  - `edgeFlows: Map<string, EdgeFlow>`
  - `nodeEfficiencies: Map<string, number>`
  - `itemSummary: ItemSummary[]`
  - `congestedEdges: Set<string>`（堵塞的 connectionUid）
  - `invalidChainUids: Set<string>`（非合法鏈路節點 uid）
  - `totalPowerDemand: number` / `totalPowerSupply: number`
  - `isCalculating: boolean` / `lastCalculatedAt: number`
  - `reset()` action

### P1-C｜鏈路合法性驗證（依賴 A1、A2）

> **本群組為新增工項**，在建圖後、傳播前執行，排除非合法鏈路。

- [ ] **C1** 實作 `validateChains(graph)` — 合法鏈路過濾
  - 演算法：從所有 sink（物品輸入口）出發做**反向 BFS/DFS**，標記可達節點
  - 未被標記的節點（無法到達任一 sink）→ 加入 `invalidChainUids`，不參與流量計算
  - 同時驗證每條路徑上所有節點的配方輸入品項是否與上游輸出品項相符
  - 配方不符的節點 → 標記為 `isValid = false`

- [ ] **C2** 實作 `validateRecipeMatch(device, incomingItemIds)` — 配方品項符合性檢查
  - 檢查輸入品項集合是否為所選配方 inputs 的子集
  - 回傳 `matched: boolean`（不符合則整台設備效率 = 0）

### P1-D｜FlowEngine 核心演算法（依賴 A1、A2、C1、C2）

- [ ] **D1** 建立 `src/composables/useFlowEngine.ts`

- [ ] **D2** 實作 `buildGraph(devices, connections)` — 建立有向圖
  - 過濾 `useValidationStore.hasBlockingError(uid)` 為 true 的節點
  - 建立 `outEdges` / `inEdges` adjacency map
  - 標記 `isSource`（物品輸出口）和 `isSink`（物品輸入口）

- [ ] **D3** 實作 `topologicalSort(graph)` — Kahn's Algorithm
  - 計算入度（inDegree）
  - 入度 0 的節點加入佇列，依序處理
  - 最終排序數 < 節點總數 → `hasCycle = true`，將環路節點加入 `invalidChainUids`

- [ ] **D4** 實作 `calcDeviceRate(device, recipe)` — 計算單機速率
  ```
  inputRatePerMin[itemId]  = input.quantity  × (60 / recipe.timeSeconds)
  outputRatePerMin[itemId] = output.quantity × (60 / recipe.timeSeconds)
  ```

- [ ] **D5** 實作 `calcDeviceOutput(node, inputFlows)` — 單設備效率與多輸出計算
  - 計算各輸入品項的 `supplied / required` 比值
  - `efficiency = Math.min(1, ...ratios)`（上游最差瓶頸決定）
  - 所有輸出品項同步等比縮放：`actual = recipe_rate × efficiency`
  - 套用傳送帶上限：`edge_rate = Math.min(actual, 30)`

- [ ] **D6** 實作 `propagateFlows(sortedNodes, graph)` — 正向傳播主迴圈
  - 依拓撲排序依序處理每個節點
  - source 節點（物品輸出口）：直接以地區資源速率初始化（30/min 上限）
  - 一般設備：調用 `calcDeviceOutput`
  - 傳遞各出邊 `EdgeFlow`

- [ ] **D7** 實作 `detectCongestion(graph, edgeFlows)` — 堵塞反向傳播
  - 比對每條邊：上游輸出速率 vs 下游需求速率
  - 若 `upstream_rate > downstream_demand` → 標記該邊 `isCongested = true`
  - 反向更新上游節點的實際輸出速率（`actual = downstream_demand`）
  - 遞迴向更上游傳播縮減效果

- [ ] **D8** 實作 `calcItemSummary(graph, edgeFlows)` — 品項統計
  - `produced`：所有 source 節點與設備的 outputRates 加總
  - `consumed`：所有 sink 節點與設備的 inputRates 加總
  - `net = produced - consumed`
  - 更新地區剩餘資源：`region_rate - consumed_from_source`

- [ ] **D9** 實作 `runFlowEngine()` — 主入口，串接 D2→C1→D3→D6→D7→D8，寫入 `useFlowStore`

### P1-E｜Watch 觸發（依賴 B1、D9）

- [ ] **E1** 在 `useFlowEngine.ts` 內加入 `watch` + `useDebounceFn(runFlowEngine, 150)`
  - 監聽 `editorStore.nodes`（設備）與 `editorStore.edges`（管線）
  - `{ deep: true }`

- [ ] **E2** 在主 App 或 Editor layout 掛載 `useFlowEngine()` 啟動監聽

### P1-F｜畫布 Overlay 顯示（依賴 B1、E1）

- [ ] **F1** 在 `FactoryCanvas.vue` 中讀取 `useFlowStore`
- [ ] **F2** 管線上顯示流量速率（個/min），堵塞管線顯示橘色警示
- [ ] **F3** 設備上顯示效率 %，套用顏色規則（綠 100% / 黃 50–99% / 橘 1–49% / 灰 0%）
- [ ] **F4** 非合法鏈路節點顯示灰色虛線外框（`invalidChainUids` 中的節點）

### P1-G｜右側統計面板（依賴 B1）

- [ ] **G1** 更新 `ProductionStats.vue` 讀取 `useFlowStore`
- [ ] **G2** 實作「整體電力統計」區塊（耗電 / 供電 / 盈缺 / 設備數 / 管線數）
- [ ] **G3** 實作「產出摘要表」區塊
  - 依品項列出：生產 / 消耗 / 淨產量 / 效率
  - 淨產量正綠、負紅、零灰
- [ ] **G4** 空白狀態處理（畫布無合法鏈路時顯示提示）

### P1-H｜整合測試（依賴 F1–F4、G1–G4）

以下測試情境基於 `docs/aaaaa/data/` 的真實資料：

#### H1 — 基礎單鏈路（四號谷地 / 源礦→藍鐵礦鏈路）
- [ ] 建置計畫：四號谷地（源礦 560/min、藍鐵礦 480/min）
- [ ] 反向追蹤：`高容量谷地電池` → `藍鐵瓶` + `中容量谷地電池` → ... → `藍鐵礦` / `源礦`
- [ ] 配置單台粉碎機（藍鐵礦 → 藍鐵粉末）確認：
  - 輸入 30/min，輸出 60/min（quantity=2）→ 傳送帶上限截斷為 30/min
  - 效率 100%，管線顯示 30/min

#### H2 — 未配頻堵塞情境
- [ ] 配置：粉碎機A（源礦→源石粉末）+ 粉碎機B（藍礦→藍礦粉末×2）→ 研磨機
- [ ] 預期：研磨機效率 50%，藍礦粉末管線標記 `isCongested`
- [ ] 驗證地區剩餘：源礦 530/min（-30）、藍礦 465/min（-15，因堵塞縮減）

#### H3 — 配頻情境
- [ ] 配置：粉碎機A×2（源礦×2）+ 粉碎機B×1（藍礦→藍礦粉末×2）→ 研磨機
- [ ] 預期：研磨機效率 100%，輸出 60/min
- [ ] 驗證地區剩餘：源礦 500/min（-60）、藍礦 450/min（-30）

#### H4 — 非法鏈路不計入
- [ ] 配置懸空粉碎機（無連接輸入口）
- [ ] 預期：不影響地區產值，節點顯示灰色虛線
- [ ] 配置配方不符鏈路（源石粉末接入本應接藍礦粉末的研磨機）
- [ ] 預期：研磨機效率 0%，不計入產值

#### H5 — 多輸出配方
- [ ] 建置：精煉爐（赤銅礦+清水 → 赤銅塊+汙水）
- [ ] 驗證：兩個輸出管線均顯示正確速率，效率同步縮放
- [ ] 若汙水下游堵塞，整台效率受限，赤銅塊輸出同步縮減

#### H6 — 武陵建造計畫端對端
- [ ] 建置計畫：武陵（源礦 540/min、赤銅礦 240/min、清水 unlimited）
- [ ] 反向追蹤：`赫銅零件` → `赫銅塊` → `赫銅溶液` → `赤銅溶液` → `赤銅粉末` / `沉積酸`
- [ ] 完整鏈路配頻驗算，確認各段速率與地區剩餘值正確

---

## Phase 2 — 完整模擬體驗

> Phase 2 在 Phase 1 完全穩定後開始。

- [ ] **I1** `useFlowStore` 新增 `ticketRates: Map<string, number>`（itemId → 券/hr）
- [ ] **I2** 實作調度券總產出計算（`ticketTotal = Σ net × ticketRate`）
- [ ] **I3** `ProductionStats.vue` 新增調度券兌換率設定 UI
- [ ] **I4** 顯示「調度券預估產出」明細展開區塊
- [ ] **I5** `useFlowStore` 新增 `warehouseCapacity: number`
- [ ] **I6** 實作倉庫填滿預估（`fillTime = capacity / net`）
- [ ] **I7** 顯示「倉庫預估」區塊

---

## 封鎖項目追蹤

| 工項 | 封鎖原因 | 等待對象 | 暫行方案 |
|------|----------|----------|----------|
| A2（devices.ts 結構） | 設備資料由 CR-01 主責定義 | CR-01 負責人 | 以 `docs/aaaaa/data/machines.json` 為 stub 先行開發 |
| F2（管線 overlay） | 需確認 CR-02 管線 edge id 對應方式 | CR-02 負責人 | 先用 `edgeFlows` Map key 直接比對 Vue Flow edge.id |
| 分流器 / 匯流器節點型別 | 需確認 CR-02 的 Splitter/Merger 結構 | CR-02 負責人 | 以 `tags: ['splitter'/'merger']` stub 先行 |

---

## 完成定義（Definition of Done）

Phase 1 完成條件：
1. `pnpm type-check` 無錯誤
2. `pnpm lint-check` 無錯誤
3. `pnpm format-check` 通過
4. H1–H6 所有手動驗證情境通過
5. PR 建立並通過 admin review
