# V9-H1 — 驗收回饋與後續處置

**對應工項：** V9-H1  
**狀態：** 📋 已整理（待實作）  
**日期：** 2026-08-02  
**來源：** FlowEngine 測試頁／圖結構視覺化／歷史回放驗收

本檔只做**根因分析、決策建議與工項拆解**；不在此檔關閉 V9 A–G。實作另開勾選項。

---

## 1. 總覽

| # | 區域 | 現象 | 建議處置 | 優先 |
|---|------|------|----------|------|
| H1-1 | `/dev/flow-engine` H7 | 期望「入邊堵塞（橘）／堵塞邊非空」與視覺化不符 | ✅ **方案 B**：一般機同品多入亦分攤；H7≈15／15（見 §2） | P0 |
| H1-2 | D1「產生演示圖」→赫銅零件 | 出現大量非法鏈路 | ✅ **方案 A**：邊候選匹配＋primaryOutput（見 §3） | P0 |
| H1-3 | 產品目錄 | 出現「研製合成粉末方塊」 | ✅ **已自 codegen 移除**；測試改緻密藍鐵粉末（見 §4） | P0 |
| H1-4 | `/dev/graph-viz` | preset／演示與 FlowEngineTest、V9 演算法脫節 | ✅ **退役＋轉址** `/dev/flow-engine`（見 §5） | P1 |
| H1-5 | `/dev/history-replay` V6 區 | checklist 難懂；部分按鈕無反應 | ✅ 文案分層＋對照表＋disabled／busy 提示（見 §6） | P1 |

---

## 2. H7：堵塞期望與引擎語意不符

### 現況

- Preset：雙「基礎材料輸出點」(源礦) → 粉碎機 `in-0`／`in-1` → Sink  
- 文案／expected：至少一條入邊堵塞（橘）；摘要「堵塞邊」非空  
- F2 遷移已修正「單埠雙線」問題，但**仍可能看不到堵塞**

### 根因

`detectCongestion` 對一般加工機：每條入邊的 `edgeDemand`＝該品項**整機** `inputRates`（需求 30），**不做同品多邊分攤**。

- 雙源各供給約 30 → 各邊 `supply ≤ demand(30)` → **兩邊皆不標堵塞**  
- 同品多邊按比例分攤需求，僅對 **匯流器**（`edgeDemandForCongestion` → `isMergerMachine`）生效  
- 真正的「供過於求 → 入邊橘＋摘要非空」演示應看 **H8**（雙鏈→匯流→Sink）

### 建議（擇一或並行）

| 方案 | 內容 | 取捨 |
|------|------|------|
| **A（建議預設）** | H7 改定位：雙埠同品灌入／滿速效率；**expected 去掉堵塞**；堵塞示範改指向 H8 | 改動小、語意誠實 |
| B | 擴充堵塞：非匯流器同品多入邊亦按供給比例分攤 demand | 引擎行為變更，需補單測與 H7／H8 對照 |
| C | H7 改造成「瓶頸下游」結構（類似 H8 簡化版）以穩定出橘邊 | 與 H8 重疊，需改圖 |

**決策建議：** 初版曾採 A；驗收更正後改採 **B**（見下）。

### 已落地（2026-08-02）— 方案 B（驗收更正）

語意：源石粉末出邊受機速／belt≈30／min；雙源礦入各 30 合計超需求 → **入邊平分堵塞約 15／15**；出邊通常不堵；粉碎機效率仍可≈100%。

- `edgeDemandForCongestion`：取消「僅匯流器分攤」；**所有目標**同品多入邊按供給比例分攤 demand  
- `FlowEngineTest.vue` H7 expected 還原為入邊橘邊約 15／15  
- 單測：`flowEngine.v9.h7Congestion.test.ts`；H8 回歸仍通過  

---

## 3. D1 最短鏈套用 → 赫銅零件：非法鏈路

### 現況

- UI：`applyReverseChainDemo`（`FlowEngineTest.vue`）依 `findShortestReverseChain` 建節點＋`makeEdgeLoose`  
- 息壤短鏈多可合法；**赫銅零件**（約 8 步）常整圖／多節點 `isValid=false`

### 推得最短鏈（資料現況，供對照）

```text
赫銅零件 ←配件機← 赫銅塊 ←反應池← 赫銅溶液 ←提純機← 赤銅溶液 ←…
                              └─────── 藍鐵粉末 ←粉碎← 藍鐵塊 ←精煉← 藍鐵礦
葉材料：赤銅礦、清水、藍鐵礦
```

多步含**副產物**：精煉（赤銅塊+汙水）、提純（赫銅溶液+沉積酸）、反應池（赫銅塊+汙水）等。

### 根因（主）

`_collectIncomingItemIds` 會把上游節點 **全部** `outputRates`／配方 outputs 併入下游「實際輸入集合」。  
V9-E1 `matchRecipeByInputs` 要求**輸入種類集合完全吻合**。

例：反應池需要 `{赫銅溶液, 藍鐵粉末}`，但提純機上游同時輸出沉積酸 → 集合變成 `{赫銅溶液, 沉積酸, 藍鐵粉末}` → **匹配失敗 → 非法**。  
同理配件機收到 `{赫銅塊, 汙水}` 亦失敗。

次要因素：

- 演示圖**未接副產物 Sink**（副產物流向未建模）  
- `makeEdgeLoose` 略過媒質／多埠 handle；單埠機器仍受 `__sole__` 基數約束  
- D1 演算法本身可回傳合法「配方樹」，但**樹 → 可跑通 FlowGraph** 尚未保證

### 建議

| 方案 | 內容 | 取捨 |
|------|------|------|
| **A（建議）** | 入邊品項改為「邊承載品」／僅計目標產出品；副產物另邊或忽略於匹配 | 對齊「一條邊一種物流」；需改引擎＋測試 |
| B | 演示建圖：為每個副產物加 Sink；或只演示「全單產出」產品（息壤）並對多副產物產品禁用／警告 | UI 層緩解，根因仍在 |
| C | 套用前預檢：若鏈上有多輸出配方則提示「無法自動合法化」 | 防呆，不修復 |

**決策建議：** 引擎優先做 **A**（已落地）。

### 已落地（2026-08-02）— 方案 A

- 新增 `matchRecipeByEdgeCandidates`：各入邊從上游候選選一品，集合須吻合配方 inputs（副產可不選）  
- `_resolveRecipesByInputs`／validateChains Step 4 改走邊候選匹配  
- 上游若有 `primaryOutput` 且在產出中 → 該邊候選僅主產  
- D1 `applyReverseChainDemo`：加工機寫入 `primaryOutput`；`propagateFlows` 出邊優先主產  
- 單測：`flowEngine.v9.h12ByproductMatch.test.ts`（含赫銅零件鏈端到端）

---

## 4. 「研製合成粉末方塊」不應出現在產品目錄

### 事實

| 來源 | 有無 |
|------|------|
| `docs/aaaaa/data/products.json` | **無** |
| `generate-src-data.mjs` → `TEST_STUB_PRODUCTS` | **有**（註明 FlowEngine H2/H3 舊測試用） |
| `src/data/products.ts`／`getAllProducts()` | **有** |
| `ProductCatalogPanel` | 直接 `getAllProducts()` → **會列出** |

與 V9-B2 DoD「產品目錄＝products.json；無假產品」**曾部分衝突**：已停 `buildSourceProducts`，且 **H1-3 已移除 `TEST_STUB_PRODUCTS`**。

### 已落地（2026-08-02）

1. `generate-src-data.mjs`：刪除 `TEST_STUB_PRODUCTS` 與合併邏輯  
2. `getAllProducts`／`getProduct`：不再含「研製合成粉末方塊」  
3. `flowEngine.test.ts` H2／H3／環路：改用正式產品「緻密藍鐵粉末」  
4. `products.test.ts`：斷言 stub 不存在

---

## 5. `/dev/graph-viz`：修改或移除？

### 現況問題

- Preset 仍大量使用「物品輸出口／輸入口」、舊 H 布局  
- 與 `/dev/flow-engine`（V9 preset、基礎材料輸出點、E1、D1、格點埠）**不同步**  
- 非 V9 演算法（反向鏈／輸入匹配）的演示面；維護成本≈第二套 FlowEngineTest

### 決策建議：**退役為主，必要時薄轉址**

| 選項 | 說明 | 建議 |
|------|------|------|
| **退役** | 路由改導向 `/dev/flow-engine`；README／skills 刪除獨立驗收條 | **採納** |
| 瘦身保留 | 只留「貼 JSON → Mermaid／環路」通用檢視，刪除過時 H preset | 若仍需離線看環路再考慮 |
| 全面對齊 V9 | 同步全部 preset＋拓樸元件 | **不建議**（重複維護） |

落地時更新：`todolist_v5` 註記過時、`flow-engine-test` skill、README Dev 列表。

### 已落地（2026-08-02）

- `router`：`/dev/graph-viz` → `redirect` `dev-flow-engine`  
- 刪除 `src/app/dev/GraphViz.vue`  
- `DevLayout` 導覽移除「圖結構視覺化」  
- skill／V9 文件標註退役  

---

## 6. `/dev/history-replay` V6 拖曳驗收 UX

### 文案／結構問題

- 琥珀色「V6 拖曳驗收」與下方 Undo／Redo／Clear **並列**，checklist（M1–M7）易被當成另一套歷史操作  
- 說明偏 API（`commitDeviceMove`／`moveDevices`），驗收者不易對應「先做什麼、再按哪個」

### 建議文案分層（實作時）

1. **本區目的**：驗證「拖曳結束寫入歷史」；與下方 Undo／Redo／Clear **同一套** `historyStore`  
2. **建議路徑**：`一鍵 M1→M4`（自動擺設備）→ 看結果勾選；或手動「擺放設備」後再按模擬拖曳  
3. **按鈕對照表**：M1＝模擬拖曳（單）+ Undo；M2＝Redo；…；M7＝請到主畫布  
4. Checklist 標題改「驗收勾選（通過後勾）」；與 Undo 堆疊面板加一句「腳本會操作同一 Undo Stack」

### 按鈕「沒反應／無法點」排查

| 按鈕 | `:disabled` 條件 | 使用者感受 |
|------|------------------|------------|
| 模擬拖曳（單）／零位移／M6 | `v6Busy` 或 `nodes.length === 0` | 空畫布＝灰掉，像壞掉 |
| 模擬拖曳（多） | `nodes.length < 2` | 只有一台時無法點 |
| 一鍵 M1→M4／M5 | 僅 `v6Busy` | 正常；會自清畫布再擺 |
| Undo／Redo | `!canUndo`／`!canRedo` | 無歷史時灰掉（預期） |

**非死碼機率高**：多為 **disabled + 無提示**。建議：

- disabled 時旁註「需先擺放 N 台設備」或自動呼叫既有 `testPlaceDevice`  
- `v6Busy` 時顯示「腳本執行中…」  
- 確認腳本中 `removeDevices`／`clear` 後 UI 有刷新（若仍有真·點了無訊息，再查 handler 早退未寫 `v6Message`）

V6 本體已關閉；本項屬 **Dev 驗收頁可維護性**，不重開 V6 功能範圍。

### 已落地（2026-08-02）

- 目的句：與下方 Undo／Redo／Clear **同一** `historyStore`  
- 建議路徑強調「一鍵 M1→M4（推薦）」；M1–M7 對照表  
- 空畫布／不足 2 台常駐提示；`title`＋早退訊息；`v6Busy` 橫幅  
- Checklist 標題改「驗收勾選」；Undo Stack 註明 V6 也寫入此處  

---

## 7. 建議實作工項（後續勾選）

- [x] **H1-1** H7：採方案 B（引擎分攤＋expected）並更新 F1／F2  


- [x] **H1-2a** D1 套用：加工機 `primaryOutput`；赫銅零件鏈可合法  
- [x] **H1-2b** 引擎：`matchRecipeByEdgeCandidates`＋單測  

- [x] **H1-3** 移除或隔離 `研製合成粉末方塊`；catalog＝純 `products.json`；測安 stub 
- [x] **H1-4** GraphViz：退役或轉址；清文件連結  

- [x] **H1-5** HistoryReplay：V6 區文案分層＋disabled 提示；點擊無訊息路徑補齊  


### DoD（本整理檔）

- [x] 三頁問題皆有根因或決策建議  
- [x] 與 `products.json`／堵塞／E1 行為對得起來  
- [x] 回寫 [todolist_v9.md](../todolist_v9.md) H 區  

---

## 8. 開發日誌

### 2026-08-02

- 驗收回饋整理：H7 堵塞分攤僅匯流器；赫銅零件非法主因多輸出污染 E1 集合；stub 產品殘留；GraphViz 建議退役；HistoryReplay disabled／文案
- **H1-3 完成**：移除 codegen `TEST_STUB_PRODUCTS`；H2／H3 改緻密藍鐵粉末；products 測試斷言
- **H1-1 完成（更正）**：方案 B — 一般機同品多入邊分攤；H7 入邊約 15／15；單測＋H8 回歸
- **H1-2 完成**：邊候選配方匹配＋D1 primaryOutput；赫銅零件演示可合法
- **H1-4 完成**：GraphViz 退役；`/dev/graph-viz` 轉址 flow-engine；刪除元件
- **H1-5 完成**：HistoryReplay V6 UX（對照表／disabled 提示／busy／同一 historyStore 說明）
