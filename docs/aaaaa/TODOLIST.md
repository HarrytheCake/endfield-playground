# CR-04 開發 Todo List

**負責人：** aaaaa  
**最後更新：** 2026-05-19（P1-A~P1-H 全部完成；Bug Fix × 4；建造計畫資訊面板；detectCongestion 多遍迭代修正；sinkDeliveries + 總產出面板）

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

### 堵塞（Congestion）反向傳播（多遍迭代）
當下游消耗速率 < 上游供給速率時截斷並回推：
```
MAX_PASSES = nodes.size + 2
for pass in range(MAX_PASSES):
    changed = false
    for each edge in edgeFlows:
        if supply > demand:
            isCongested = true; rate = demand
            if sourceNode.isSource:
                outputRates ×= demand/supply  // source 只縮 outputRates
            else:
                efficiency ×= ratio; outputRates ×= ratio; inputRates ×= ratio
    if not changed: break  // 提前收斂
```
多遍原因：source 節點的縮減需等到下游節點 inputRates 先被縮減後（pass 1），下一遍（pass 2）才能正確偵測 src→機器 這條邊的堵塞。

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
  - **State（ref）**：`edgeFlows`、`nodeEfficiencies`、`itemSummary`、`sinkDeliveries`（2026-05-19 新增）、`congestedEdges`、`invalidChainUids`、`totalPowerDemand`、`totalPowerSupply`、`isCalculating`、`lastCalculatedAt`
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

- [x] **D7** 實作 `detectCongestion(graph, edgeFlows)` — 堵塞反向傳播（**多遍迭代，2026-05-19 修正**）
  - 比對每條邊 supply vs `targetNode.inputRates`（需求）
  - 若 supply > demand + 1e-6 → `isCongested = true`，rate 截斷至 demand
  - **source 節點特殊處理**：只縮減 `outputRates`（無 `inputRates`），不設 efficiency
  - 一般節點：按 `demand/supply` 比例縮減 efficiency / outputRates / inputRates
  - 同步縮減上游其他出邊的 rate；檢查更上游入邊是否也需標記堵塞
  - **外層迴圈 `MAX_PASSES = nodes.size + 2`**：直到一遍內 `changed = false` 才提前退出
  - Bug：舊版單遍迭代，source.outputRates 未被修正（net 偏高）→ 多遍修正後 net=0（正確）

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
  - **sinkDeliveries 計算**（2026-05-19 新增）：`calcItemSummary` 後掃描所有 `isSink && isValid` 節點的 `inputRates`，統計每個品項從物品輸入口流出的實際速率
  - 完成後呼叫 `flowStore.applyResult({ ..., sinkDeliveries })` 批次寫入；錯誤時關閉 isCalculating

### P1-E｜Watch 觸發（依賴 B1、D9）

- [x] **E1** 在 `useFlowEngine.ts` 內加入 `watch` + `useDebounceFn(runFlowEngine, 150)`
  - 監聽 `[() => editorStore.nodes, () => editorStore.edges]`（getter 形式，相容 `shallowRef`）
  - `{ deep: true, immediate: true }`：掛載即執行首次全量計算
  - `useDebounceFn` 來自 `@vueuse/core`（已安裝 v14.2.1）

- [x] **E2** 在 `MainLayout.vue` `<script setup>` 中直接呼叫 `useFlowEngine()`，掛載時自動啟動監聽

### P1-F｜畫布 Overlay 顯示（依賴 B1、E1）

- [x] **F1** 在 `FactoryCanvas.vue` 中讀取 `useFlowStore`
- [x] **F2** 管線上顯示流量速率（個/min），堵塞管線顯示橘色警示
- [x] **F3** 設備上顯示效率 %，套用顏色規則（綠 100% / 黃 50–99% / 橘 1–49% / 灰 0%）
- [x] **F4** 非合法鏈路節點顯示灰色虛線外框（`invalidChainUids` 中的節點）

### P1-G｜右側統計面板（依賴 B1）

- [x] **G1** 更新 `ProductionStats.vue` 讀取 `useFlowStore`
- [x] **G2** 實作「整體電力統計」區塊（耗電 / 供電 / 盈缺 / 設備數 / 管線數）
- [x] **G3** 實作「產出摘要表」區塊
  - 依品項列出：生產 / 消耗 / 淨產量 / 效率
  - 淨產量正綠、負紅、零灰
- [x] **G4** 空白狀態處理（畫布無合法鏈路時顯示提示）

### P1-H｜整合測試（依賴 F1–F4、G1–G4）

以下測試情境基於 `docs/aaaaa/data/` 的真實資料：

#### H1 — 基礎單鏈路（四號谷地 / 源礦→藍鐵礦鏈路）
- [x] 建置計畫：四號谷地（源礦 560/min、藍鐵礦 480/min）
- [x] 反向追蹤：`高容量谷地電池` → `藍鐵瓶` + `中容量谷地電池` → ... → `藍鐵礦` / `源礦`
- [x] 配置單台粉碎機（藍鐵礦 → 藍鐵粉末）確認：
  - 輸入 30/min，輸出 60/min（quantity=2）→ 傳送帶上限截斷為 30/min
  - 效率 100%，管線顯示 30/min

#### H2 — 未配頻堵塞情境
- [x] 配置：粉碎機A（源礦→源石粉末）+ 粉碎機B（藍礦→藍礦粉末×2）→ 研磨機
- [x] 預期：研磨機效率 50%，藍礦粉末管線標記 `isCongested`
- [x] 驗證地區剩餘：源礦 530/min（-30）、藍礦 465/min（-15，因堵塞縮減）

#### H3 — 配頻情境
- [x] 配置：粉碎機A×2（源礦×2）+ 粉碎機B×1（藍礦→藍礦粉末×2）→ 研磨機
- [x] 預期：研磨機效率 100%，輸出 60/min
- [x] 驗證地區剩餘：源礦 500/min（-60）、藍礦 450/min（-30）

#### H4 — 非法鏈路不計入
- [x] 配置懸空粉碎機（無連接輸入口）
- [x] 預期：不影響地區產值，節點顯示灰色虛線
- [x] 配置配方不符鏈路（源石粉末接入本應接藍礦粉末的研磨機）
- [x] 預期：研磨機效率 0%，不計入產值

#### H5 — 多輸出配方
- [x] 建置：精煉爐（赤銅礦+清水 → 赤銅塊+汙水）
- [x] 驗證：兩個輸出管線均顯示正確速率，效率同步縮放
- [x] 若汙水下游堵塞，整台效率受限，赤銅塊輸出同步縮減

#### H6 — 武陵建造計畫端對端
- [x] 建置計畫：武陵（源礦 540/min、赤銅礦 240/min、清水 unlimited）
- [x] 反向追蹤：`赫銅零件` → `赫銅塊` → `赫銅溶液` → `赤銅溶液` → `赤銅粉末` / `沉積酸`
- [x] 完整鏈路配頻驗算，確認各段速率與地區剩餘值正確

---

## Phase 1 後記（2026-05-19 補充完成工項）

### BF-01 — Bug Fix：validateChains sink 跳過 + buildGraph recipeIndex 讀取

- [x] **BF-01a** `validateChains` 中 sink 節點在 Step 5 正向 BFS 時不繼續傳播（修正前：sink 的下游也會被連帶標記非法）
- [x] **BF-01b** `buildGraph` 中 `recipeIndex` 讀取改為 `node.data.recipeIndex ?? 0`，不再依賴不存在的 `data.recipe`

### BF-02 — Bug Fix：devices.ts 配方數值修正

- [x] **BF-02a** 反應池 → 赫銅塊：`赫銅溶液 quantity 1 → 2`（影響效率計算由 0.25 → 0.125）
- [x] **BF-02b** 配件機 → 赫銅零件：`quantity 1 → 5`，`timeSeconds 2 → 10`（赫銅零件產率由 7.5 → 0.75/min）

### BF-03 — Bug Fix：detectCongestion 多遍迭代（source 節點回推）

- [x] **BF-03a** 改為外層迴圈 `MAX_PASSES = nodes.size + 2`，每遍 `changed = false` 時提早退出
- [x] **BF-03b** source 節點特殊處理：偵測到堵塞時只縮減 `outputRates`（無 `inputRates` 可縮）
- [x] **BF-03c** 驗證：武陵鏈路 B — 藍鐵礦 produced 從 30 修正為 3.75（net = 0，正確）

### P1-X1 — 建造計畫資訊面板

- [x] **X1-a** 建立 `src/data/plans.ts`：`MaterialRate / MachineLimit / ProductValue / Plan` 型別，定義四號谷地 + 武陵兩個計畫
- [x] **X1-b** `editorStore` 新增：`currentPlanId`、`currentPlan` computed、`machineUsedCounts` computed
- [x] **X1-c** `ProductionStats.vue` 新增「原料供給」區塊（計畫配額 vs 實際消耗，顏色警示：超量紅 / 接近上限黃 / 正常綠 / 無限灰）
- [x] **X1-d** `ProductionStats.vue` 新增「計畫產物」區塊（計畫 product_values 中 net > 0 的品項）
- [x] **X1-e** `ProductionStats.vue` 新增「機器用量」區塊（計畫 machine_limits vs 畫布已用台數）

### P1-X2 — 總產出面板

- [x] **X2-a** `flowStore` 新增 `sinkDeliveries: Map<string, number>` state 與 `applyResult` / `reset` 更新
- [x] **X2-b** `useFlowEngine.ts` 在 `calcItemSummary` 後計算 `sinkDeliveriesMap`（掃描所有 `isSink && isValid` 節點 inputRates）
- [x] **X2-c** `ProductionStats.vue` 新增 `totalOutput` computed（原料剩餘灰點 + 機器交付藍點，排除計畫原料名稱重複）
- [x] **X2-d** `ProductionStats.vue` 新增「總產出」section 顯示，位於原料供給之前

### 測試驗收

- [x] **T1** `pnpm type-check` 零錯誤
- [x] **T2** `pnpm test --run`：27 條單元測試全數通過
  - 含 H6 更新測試：`reactionB.efficiency ≈ 0.125`，`赫銅零件 ≈ 0.75/min`

---

## 跨 CR 需求清單（協作者請閱讀）

> CR-04 對其他分工的**強依賴**，若有異動請主動通知 aaaaa。詳細說明見 [README.md](README.md) 第十一節。

### 對 CR-01 的需求

| ID | 需求 | 說明 |
|----|------|------|
| N1-01 | `FactoryNode.data.machineType` | 設備類型名稱，與 `devices.ts MachineDef.name` 完全一致 |
| N1-02 | `FactoryNode.data.recipeIndex` | 使用者選定配方索引（0-based），UI 需提供切換介面 |
| N1-03 | `FactoryEdge.id` = connectionUid | CR-04 以此作為 `edgeFlows` Map 的 key |
| N1-04 | `FactoryEdge.source → target` = 物質流向 | source 為輸出端，target 為輸入端 |
| N1-05 | `getMachineDef(name).power` | 每台設備耗電 kW（-1 表示未知），用於 `totalPowerDemand` |
| N1-06 | `getMachineDef(name).power_output` | 供電設備的產電 kW，待 CR-01 定義後 CR-04 可計算 `totalPowerSupply` |
| N1-07 | `getMachineDef(name).isSource / isSink` | 識別物品輸出口 / 物品輸入口 |

### 對 CR-02 的需求

| ID | 需求 | 說明 |
|----|------|------|
| N2-01 | `edge.id` 穩定唯一 | 不因重新排列或撤銷重做而改變，否則 `edgeFlows` 快取失效 |
| N2-02 | 分流器識別方式 | 協商中，目前 CR-04 以 `machineType === 'Splitter'` 或 `tags.includes('splitter')` 偵測 |
| N2-03 | 匯流器識別方式 | 同上，`'Merger'` / `'merger'` |

### 對 CR-03 的需求

| ID | 需求 | 說明 |
|----|------|------|
| N3-01 | `useValidationStore().hasBlockingError(uid)` | uid = `FactoryNode.id`，回傳 true 時 CR-04 將節點排除在計算外 |
| N3-02 | uid 一致性 | CR-03 Error 紀錄的 uid 必須與 `editorStore.nodes[].id` 完全一致 |

### 對前端 / FactoryCanvas 維護者的消費指南

```typescript
// 管線 overlay（每條 edge）
const flow = useFlowStore().edgeFlows.get(edge.id)
// flow.rate        → X.X /min
// flow.isCongested → 橘色警示
// flow.itemId      → 品項名稱

// 設備 overlay（每個 node）
const eff = useFlowStore().nodeEfficiencies.get(node.id)
// eff >= 1 → green-500 / >= 0.5 → yellow-400 / > 0 → orange-400 / 0 → zinc-500

// 非法節點（灰色虛線外框）
const isInvalid = useFlowStore().invalidChainUids.has(node.id)

// 計畫切換（下拉選單 v-model）
useEditorStore().currentPlanId = '<plan.id>'
```

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
