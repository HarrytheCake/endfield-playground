# CONTEXT（CR-04 / FlowEngine）

本文件統整 **CR-04 流量估算模組**相關專有名詞與核心概念，僅提供簡述與定位。
專案通用名詞見 `docs/dernoson/claude/CONTEXT.md`；詳細規格見 `spec/04_flow_simulation.md` 與 `docs/aaaaa/` 內技術文件。

---

## 1. 模組與角色

- **FlowEngine**：靜態流量分析引擎。監聽畫布設備與管線變更，以 debounce 重算整條產線穩態產能。主檔：`src/composables/useFlowEngine.ts`。
- **flowStore**：FlowEngine 計算結果的唯一寫入點（Pinia）。對外提供 `edgeFlows`、`nodeEfficiencies`、`itemSummary` 等狀態供畫布與面板消費。主檔：`src/store/flowStore.ts`。
- **CR-04**：本模組的 Feature / 負責人代號；文件區為 `docs/aaaaa/`；分支慣例 `dev/aaaaa`。
- **ProductionStats**：右側「產線總覽面板」實作，消費 flowStore 與 editorStore，顯示電力、產出摘要、總產出、建造計畫相關區塊。

---

## 2. 圖與節點概念

- **FlowGraph**：FlowEngine 內部有向圖，含 `nodes`、`inEdges` / `outEdges`、`edgeMeta`、環路與非法子圖標記。
- **FlowNode**：圖上的一台設備節點，含 `machineType`、`recipeIndex`、`isSource` / `isSink`、`isValid`、`efficiency`、`inputRates` / `outputRates`。
- **Source 節點**：產線起點（如物品輸出口），無配方輸入、直接依配方輸出速率供料。
- **Sink 節點**：產線終點（如物品輸入口 / 取貨口），接收下游交付量；用於 `sinkDeliveries` 與「總產出」。
- **合法鏈路**：能反向連到有效 Sink，且配方與上游品項匹配的子圖。否則進入 `invalidChainUids` / `invalidSubgraphUids`，畫布以灰色虛線表示且不參與流量計算。
- **環路（Cycle）**：拓撲排序無法消化的有向環；該子圖略過計算，其餘子圖仍可算。

---

## 3. 演算法步驟名詞

執行入口為 `runFlowEngine()`，典型管線：

| 步驟 | 函式 | 意義 |
|------|------|------|
| 建圖 | `buildGraph` | 自 editor 節點/邊建立 FlowGraph；過濾 CR-03 Error |
| 合法鏈驗證 | `validateChains` | 反向 BFS + 配方匹配 + 下游非法傳播 |
| 拓撲排序 | `topologicalSort` | Kahn's Algorithm；偵測環路 |
| 正向傳播 | `propagateFlows` | 依拓撲序算效率與邊流量 |
| 堵塞偵測 | `detectCongestion` | 多遍反向修正上游速率與 `isCongested` |
| 品項彙總 | `calcItemSummary` | produced / consumed / net / efficiency |
| 交付量 | `sinkDeliveries` | Sink 實際接收速率（個/min） |

- **效率（efficiency）**：0~1。一般設備為各輸入 `supplied / required` 的最小值，並可能被堵塞反向修正。
- **堵塞（congestion）**：上游供給大於下游需求；邊標記 `isCongested`，速率截斷至需求並向上游回推。
- **BELT_RATE_LIMIT**：單條傳送帶連線速率上限（30 個/min）。
- **PIPE_RATE_LIMIT**：單條管道連線速率上限（60 個/min）。判定：埠媒質優先，否則依品項 `form`；皆未知則保守用 30。
- **Debounce 重算**：畫布變更後延遲約 150ms 觸發，避免拖曳等高頻事件導致過載。

---

## 4. 結果與顯示名詞

- **EdgeFlow**：單條管線的流量結果（`connectionUid`、`itemId`、`rate`、`isCongested`）。
- **ItemSummary**：品項層級彙總（produced / consumed / net / efficiency）。
- **管線 Overlay**：在畫布管線上顯示品項與速率；堵塞以橘色標示。
- **設備 Overlay**：在設備上顯示效率百分比；顏色規則見下節。
- **電力盈缺**：`totalPowerDemand` / `totalPowerSupply` / `powerBalance`；不足時對應警示語意（與 CR-10 / W005 相關）。

### 效率顏色

| 效率 | 語意色 |
|------|--------|
| 100% | 綠 |
| 50%–99% | 黃 |
| 1%–49% | 橘 |
| 0% 或略過 | 灰 |

---

## 5. 設備與資料名詞

- **Machine**：設備定義物件；含 `id`（snake_case 英文）、`name`（中文顯示名）、`modes`、power 等。
- **Machine.id**：設備穩定識別鍵（如 `refinery`、`crusher`）。**方案 B（已定案）**：`PlacedDevice.machineType` / 節點 `data.machineType` 應存此 id。
- **Machine.name**：中文顯示名稱（如「精煉爐」）；不得再作為 `machineType` 查詢鍵（遷移完成後）。
- **MachineMode**：機器運作型態（如固體／氣態）；含該 mode 下的 `ports` 與可選 `loss`。
- **machineMode**：節點 `data.machineMode`；缺省該機器 `modes[0].id`。配方以 `machine` + `machineMode` 過濾後再取 `recipeIndex`。
- **PortMedia**：埠口媒質，`'belt'`｜`'pipe'`（固體傳送帶／液體氣體管線）。belt↔pipe 錯接視為非法鏈。
- **單埠單線（V8）**：同一機器埠（handle）最多一條邊；多線進單口必經匯流器。複數出入口＝`modes[].ports` 多筆，非單埠多線。無 handle 且該方向僅一埠時，多條抽象邊亦非法（引擎側先行）。
- **form（ItemForm）**：品項物態 `'solid' | 'liquid' | 'gas'`（JSON 欄位名 `form`）。solid→belt，liquid／gas→pipe。已進 materials／products 與 `src/data`。
- **loss**：mode 層級損耗定義（資料面）；FlowEngine **不**計入 summary（V7 刻意延後）。
- **environment**：配方可選環境標籤；定義於 `src/data/environments.ts`。
- **getMachineById(id)**：以英文 id 查設備定義（V4 起推薦）。
- **getMachine(name)**：以中文名查詢的舊 API；遷移完成後應 deprecated。
- **getRecipesForMachine(type, mode)**：依機器與 mode 取配方列表。
- **RecipeDef**：配方定義；含 inputs / outputs、`timeSeconds`、`machineMode`、`environment?` 等。速率公式：`quantity × (60 / timeSeconds)` → 個/min。
- **recipeIndex**：節點上選定的配方索引（對 **mode 過濾後**列表），決定計算使用哪一組配方。
- **氣態產線**：使用 `pipe` 媒質與對應 mode（例如含氣態配方的機器）；驗證見 `/dev/flow-engine` V7-G1。

---

## 6. 建造計畫與 Phase 2 名詞

- **Plan**：地區建造計畫（原料配額、機器台數上限、產物調度券單價等），資料於 `src/data/plans.ts`。
- **調度券兌換效率**：使用者設定各品項兌換率後，由 flowStore computed（如 `ticketOutput` / `ticketTotal`）估算券收益。→ V2
- **倉庫填滿預估**：依 `warehouseCapacity` 與淨產出估算填滿所需時間。→ V2
- **總產出**：原料剩餘配額 + Sink 交付的非原料產物，供下一段產線規劃。

---

## 7. 驗證與跨 CR 介面名詞

- **hasBlockingError(uid)**：CR-03 API；回傳 true 的節點/邊不進入流量計算。
- **ValidationContext**：Detector 執行時上下文（devices、connections、getDef、baseRegion 等）。V5 補齊 `baseRegion`。
- **Detector**：CR-03 驗證器（如 E001 設備重疊）；CR-04 可提供範例與 geometry helper，但不擁有 detector 主責。
- **geometryUtils**：格子佔據、重疊、基地範圍判斷等工具，支援 validation。→ V5-B

---

## 8. 開發文件名詞

- **todolist_vN.md**：版本工項大綱與細項文件索引（狀態核查清單）。
- **dev_vN/**：該版本各工項技術細項 md 資料夾（V5 起標準結構）。
- **report_vN.md**：版本完成報告（跨 CR 需求、待辦、決策紀錄）。
- **AGENT_CONTEXT.md**：給 AI Agent 的快速上下文（非人類主讀的長篇 README 替代品）。
- **L1 API Reference / FlowEngine Guide**：給 L2/L3 與其他 CR 的消費端文件。

工項狀態標記：`[ ]` 未開始、`[~]` 進行中、`[x]` 完成、`[!]` 封鎖中。

---

## 9. 與通用 CONTEXT 的對照

| 通用名詞（dernoson CONTEXT） | 在 CR-04 中的關係 |
|------------------------------|-------------------|
| 產線總覽面板 | 主要由 ProductionStats + flowStore 實現 |
| 流程視角（CR-05） | 消費流量/效率概念，但不屬 CR-04 主責 |
| 警示系統（CR-03 / CR-09 / CR-10） | FlowEngine 只消費 Error 略過與電力數字，不實作警示判定 |
| 管線（CR-01 / CR-02） | 作為圖的邊；CR-04 寫入 EdgeFlow 供 overlay |

---

## 10. 待補充

- Splitter / Merger 正式識別方式（tags vs machineType）與 CR-02 定案後補齊
- 供電樁與 power_output 完整接入後的電力計算細節（CR-10）
- loss 納入流量／summary 計算（刻意延後）
- 動態模擬（若未來 Phase 擴充）與現行靜態分析的差異說明
- CR-02／CR-03 對齊埠一對一與媒質拒絕（V8 引擎側已完成；UI／Detector 後續）
- V6 手動 M1–M7 畫布驗收（程式已鎖定；見 `todolist_v6.md`）
- 可選：`report_v8.md` 正式關閉報告
- V9 規劃中：modes-only 埠、基礎材料輸出點、反向最短鏈路、輸入匹配配方（見 `todolist_v9.md`）
