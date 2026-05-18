# CR-04 開發 Todo List

**負責人：** aaaaa  
**最後更新：** 2026-05-18（P1-A、P1-B、P1-C、P1-D 完成，技術細節已更新）

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

- [x] **A1** 建立 `src/types/flow.ts`
  - **常數**：`BELT_RATE_LIMIT = 30`（傳送帶每條上限 30/min）
  - **設備 / 配方型別**：`PortSide`、`PortDef`、`MachineDef`、`RecipeItem`、`RecipeDef`、`ProductDef`
  - **圖結構型別**：`EdgeMeta`、`FlowNode`（含 `recipeIndex`、`outputRates: Map`、`inputRates: Map`）、`FlowGraph`（含 `edgeMeta`、`invalidSubgraphUids`）
  - **計算結果型別**：`EdgeFlow`（含 `isCongested`）、`ItemSummary`
  - **Store 參照型別**：`FlowStoreState`（完整狀態結構）

- [x] **A2** 建立 `src/data/devices.ts`（stub，CR-01 接管前暫由 CR-04 維護）
  - **14 台設備**（全對齊 machines.json）：塑型機、灌裝機、精煉爐、粉碎機、配件機、裝備原件機、封裝機、研磨機、反應池、天有洪爐、提純機、拆解機、物品輸出口（isSource）、物品輸入口（isSink）
  - **20 個品項配方**（涵蓋 H1–H6 所有測試情境）：
    - 粉碎機系列：源石粉末、藍鐵粉末（×2 輸出）、紫晶粉末、赤銅粉末
    - 研磨機：研製合成粉末方塊（H2/H3 配頻測試用假想品項）
    - 精煉爐：藍鐵塊、紫晶纖維、赤銅塊＋汙水（多輸出，H5）、穩定碳塊
    - 反應池：赤銅溶液、赫銅塊＋汙水（多輸出）
    - 提純機：赫銅溶液＋沉積酸（多輸出，H6 武陵鏈路）
    - 配件機：赤銅零件、赫銅零件
    - 塑型機：紫晶質瓶、藍鐵瓶
    - 封裝機：低 / 中 / 高容量谷地電池
  - **查詢 API**：`getMachineDef()`、`getRecipesByProduct()`、`getRecipe()`、`getRecipesForMachine()`、`getAllMachines()`、`getAllProducts()`、`getAllRecipes()`

### P1-B｜Pinia Store（依賴 A1）

- [x] **B1** 建立 `src/store/flowStore.ts`（Pinia Composition API 風格）
  - **State（ref）**：`edgeFlows`、`nodeEfficiencies`、`itemSummary`、`congestedEdges`、`invalidChainUids`、`totalPowerDemand`、`totalPowerSupply`、`isCalculating`、`lastCalculatedAt`
  - **Computed**：`powerBalance`（盈缺 kW）、`hasPowerShortage`、`edgeFlowCount`、`congestedEdgeCount`、`invalidChainCount`、`hasResults`（是否有合法鏈路計算結果）
  - **`reset()`**：清空所有計算結果，保留 `lastCalculatedAt` 歷史
  - **`applyResult(payload)`**：批次寫入所有計算結果（一次性更新，避免多次觸發響應式），完成後自動設定 `lastCalculatedAt = Date.now()` 並關閉 `isCalculating`

### P1-C｜鏈路合法性驗證（依賴 A1、A2）

> **本群組為新增工項**，在建圖後、傳播前執行，排除非合法鏈路。

- [x] **C1** 實作 `validateChains(graph)` — 合法鏈路過濾
  - **Step 1**：收集所有 `isSink && isValid` 的節點加入 BFS 佇列（`reachableSinks`）
  - **Step 2**：反向 BFS（走 `inEdges`），從 sink 往上游遞迴標記所有可達到 sink 的節點
  - **Step 3**：未被標記的節點 → `node.isValid = false`、加入 `invalidSubgraphUids`
  - **Step 4**：對合法且非 source 節點呼叫 `validateRecipeMatch`；填入上游 `outputRates`（或 fallback 配方 outputs）來推斷品項種類
  - **Step 5**：呼叫 `_propagateInvalidDownstream(graph)`，正向 BFS 將配方不符節點的下游連帶標記非法（sink 節點不繼續傳播）
  - **直接 mutate graph**，不回傳新物件

- [x] **C2** 實作 `validateRecipeMatch(machineType, recipeIndex, incomingItemIds)` — 配方品項符合性檢查
  - 查詢 `getRecipe(machineType, recipeIndex)`；找不到配方 → `false`
  - 配方 inputs 為空（source 節點）→ `true`
  - `recipe.inputs.every((input) => incomingItemIds.has(input.itemId))`
  - 回傳 `matched: boolean`（不符則整台設備效率 = 0）

### P1-D｜FlowEngine 核心演算法（依賴 A1、A2、C1、C2）

- [x] **D1** 建立 `src/composables/useFlowEngine.ts`（P1-C 階段已建立，含 `validateChains`、`validateRecipeMatch`、`useFlowEngine` stub）

- [x] **D2** 實作 `buildGraph(devices, connections)` — 建立有向圖
  - 過濾 `useValidationStore.hasBlockingError(uid)` 為 true 的節點（CR-03 不存在時 try-catch 降級）
  - 建立 `outEdges` / `inEdges` adjacency map；跳過兩端不存在的孤立邊
  - 每個節點初始化理論 `inputRates` / `outputRates`（由 `calcDeviceRate` 計算）
  - `machineType` 取自 `node.data.machineType ?? node.data.label ?? node.id`

- [x] **D3** 實作 `topologicalSort(graph)` — Kahn's Algorithm
  - 計算入度時只計算兩端均 `isValid` 的邊
  - 入度 0 → 加入佇列，依序處理，更新下游入度
  - 排序數 < 節點總數 → `hasCycle = true`，環路節點加入 `invalidSubgraphUids`

- [x] **D4** 實作 `calcDeviceRate(recipe)` — 計算單機速率
  ```
  inputRatePerMin[itemId]  = input.quantity  × (60 / recipe.timeSeconds)
  outputRatePerMin[itemId] = output.quantity × (60 / recipe.timeSeconds)
  ```

- [x] **D5** 實作 `calcDeviceOutput` — 單設備效率與多輸出計算（整合於 D6 propagateFlows）
  - `efficiency = Math.min(1, ...ratios)`（supplied / required per input item）
  - 所有輸出品項等比縮放：`actual = recipe_rate × efficiency`
  - 套用傳送帶上限：`edge_rate = Math.min(actual, BELT_RATE_LIMIT)`

- [x] **D6** 實作 `propagateFlows(sortedNodes, graph)` — 正向傳播主迴圈
  - 依拓撲排序依序處理每個節點；isValid=false 的節點跳過
  - source：直接輸出理論速率（BELT_RATE_LIMIT 截斷）
  - 一般設備：呼叫 D5 邏輯計算效率與輸出
  - 出邊品項配對：優先比對下游配方 inputs，fallback 取第一個有餘量的輸出品項
  - 回傳 `Map<connectionUid, EdgeFlow>`

- [x] **D7** 實作 `detectCongestion(graph, edgeFlows)` — 堵塞反向傳播
  - 比對每條邊 supply vs `targetNode.inputRates`（需求）
  - 若 supply > demand + 1e-6 → `isCongested = true`，rate 截斷至 demand
  - 上游節點效率與 outputRates / inputRates 按 `demand/supply` 比例縮減
  - 同步縮減上游其他出邊的 rate；檢查更上游入邊是否也需標記堵塞

- [x] **D8** 實作 `calcItemSummary(graph)` — 品項統計
  - `produced`：所有合法節點 outputRates 加總
  - `consumed`：所有合法節點 inputRates 加總
  - `net = produced - consumed`
  - `efficiency`：產出該品項的所有設備效率最小值
  - 結果依 net 降序排列

- [x] **D9** 實作 `runFlowEngine()` — 主入口（async），串接 D2→C1→D3→D6→D7→D8，寫入 `useFlowStore`
  - 開始時 `flowStore.$patch({ isCalculating: true })`
  - 電力統計：`Σ machineDef.power`（power > 0 的有效設備）
  - `totalPowerSupply = 0`（CR-01 供電定義待補）
  - 完成後呼叫 `flowStore.applyResult(...)` 批次寫入；錯誤時關閉 isCalculating

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
