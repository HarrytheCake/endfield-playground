# 0001_20260810_merge-verification-sweep

- **prev:** —
- **skill:** plan-history v3
- **status:** in-progress

## 主題簡述

`dev/dernoson` 目前已合入 mbd（PR #22，L3 元件）、aaaaa（PR #21，L1 引擎與資料 v3）、
shirone（驗證重疊偵測）三方的變更，但三者從未在同一棵樹上被人實際操作過一次。本計畫
把這次合流做一輪人工實測，產出兩樣東西：一份可對照的驗收結果，以及一份整合缺口清單。

三方的「可實測程度」差異極大（見 O2、O3、O15），所以本計畫不追求一致的驗收深度：aaaaa
是照 preset 自帶的 expected 逐條驗收，mbd 與 shirone 多半只能盤點缺口。

**本計畫的約束**

- 實測只走跑得起來的介面：主畫面 `/` 與 `/dev/*` 既有路由。**不建臨時 dev 頁、不動
  router、不寫新測試**。
- **發現問題只記錄，不修**。所有缺陷寫成觀察，收斂後由使用者決定哪些開成待辦。
- 每一格都是大主題的傘格，子題另開新格（見各格末段的衍生指引）。

## 規劃描述

依介面切格，一格一個可獨立進行的實測面：

- **0001#1 基準線**先跑，把既有紅燈與實測發現分開，其餘實測格都 `needs` 它。
- **0001#2 ～ 0001#6** 是四個實測面：主畫面、引擎 preset、catalog 與拓撲、歷史回放、
  驗證頁現況。每格的產出是觀察，不是結論。
- **0001#7** 是純靜態盤點，不跑 UI，可與其他格並行。
- **0001#8** 是架構人工對答，題目已在正文列出，由使用者逐題裁決。

實測過程中的新發現一律進 `## 觀察與推論`，不當場開新待辦；一輪跑完再由使用者決定。

## 觀察與推論

### O1 · 2026-08-10 05:36:10+08:00 — 合流內容的檔案面貌

`git diff --stat` 對三個合併點取得：PR #22（mbd）動 15 檔 614 行，全數落在
`src/components/FlowChart/`、`src/components/StatsPanel/`、`src/app/layouts/MainLayout.vue`、
`src/utils/flowHelpers.ts`；PR #21（aaaaa）動 148 檔 32064 行，涵蓋 `src/data/` 全量重生、
`src/composables/useFlowEngine.ts`（+788）、`src/app/dev/` 五個頁面與 `src/types/` 六個型別檔；
本分支相對 master 的 27 檔 3249 行中，屬 shirone 的是 `src/lib/validation/detectors/overlapDetector.ts`、
`src/utils/shirone/` 三支、`src/types/shironesinterface.ts` 與 `euclideanSpace.ts`。

三方的落點幾乎不重疊：mbd 在 L3，aaaaa 在 L1 加 dev 頁，shirone 在驗證層。合併衝突風險
低，但也意味著三者之間沒有任何整合路徑被實作出來 —— 缺口會出現在交界處，不在各自內部。

### O2 · 2026-08-10 05:37:40+08:00 — mbd 的 L3 元件半數未接線

`grep -rn "FlowChart"` 在 `src/` 內只命中 `src/components/FlowChart/` 自身，六個元件
（Material／Device／Product／Warehouse／PendingImport／FlowEdge）沒有任何外部 import，
`src/router/index.ts` 也沒有對應路由。`src/components/FlowChart/Index.vue:29-78` 自帶硬編
demo 資料（鐵礦砂 → 電弧爐 → 鐵錠）並自行持有 `ref` 狀態與 `useVueFlow()` 高亮邏輯。

`src/components/StatsPanel/Index.vue:4-13` 已被 `MainLayout.vue:43` 掛載，但四個子元件的
props 全是常值：`:total-demand-kw="0"`、`:rows="[]"`、`:capacity-cells="0"`。

因此 mbd 這批的實測上限是「渲染不壞版」：FlowChart 在既有路由下根本進不去，StatsPanel
的數值正確性沒有輸入可測。

### O3 · 2026-08-10 05:39:05+08:00 — shirone 的重疊偵測未接進驗證管線

`src/lib/validation/detectors/overlapDetector.ts:17` 匯出的是純函式 `detectOverlaps(machineList,
pipelineList)`，不是 `Detector` 介面，`src/` 內無任何 `registerDetector` 呼叫點。它的入參型別
`shironesMachine` / `shironesPipeline`（`src/types/shironesinterface.ts`）與主線
`FactoryNode` / `FactoryEdge` 是兩套不相通的形狀。`src/utils/shirone/rewritePipelineStructure.ts`
僅被 `src/__tests__/utils/absToRelPath.test.ts` 引用，產品程式碼零引用。

`src/app/dev/ValidationTest.vue:19-21` 的頁面說明也已寫明「目前沒有任何 detector 註冊到
validationStore，所以警示恆為空」。

即 `/dev/validation-test` 上 alerts 恆為 0 是**符合現況的預期行為**，實測時不得記為 bug；
真正的缺口是這條偵測邏輯與主線型別、與 detector 註冊機制都尚未接上。

### O4 · 2026-08-10 05:40:30+08:00 — aaaaa 的 dev 頁帶有自附驗收條件

`src/app/dev/FlowEngineTest.vue:615-793` 定義 22 個 preset，分四組（basic H1–H6、advanced
H7–H11、v7 G1–G3 與 L1、v9 五個），**每個 preset 都帶 `expected` 條列**，內容是可觀測的
數值與狀態（效率百分比、出邊流量、堵塞邊是否非空、節點是否標非法）。同頁另有
`pageTabs` 三分頁（引擎測試／機器／產品／材料）與拓撲 SVG 的 mode 切換。
`src/router/index.ts:26-45` 提供三條 dev 路由，`graph-viz` 已退役重導至 `flow-engine`。

這批是三方中唯一可以做「照表驗收」的：判準是作者自己寫下的，不是實測時現編的，對照
結果具有可爭論性。

### O5 · 2026-08-10 05:41:50+08:00 — 兩處架構約定只靠註解維持

`src/composables/useValidation.ts:13` 要求「請在 MainLayout setup 時先呼叫本 composable，
再呼叫 useFlowEngine()」，`MainLayout.vue:21-24` 照做了，但這個順序在型別上毫無保證，寫反
只會靜默讓 FlowEngine 讀到上一輪的 alerts。

`src/store/validationStore.ts:11-12` 的註解同時記載兩種註冊策略（「由各 detector 模組自行
呼叫 registerDetector()」與「也可由初始化階段集中註冊」），而實際註冊數為 0。

兩者都是「文件說了算」的約定：一個沒有機制擋住誤用，一個沒有選定唯一做法。這類約定在
三方各自開發、互不知情的情況下最容易破，屬於架構層要先定調的項目。

### O6 · 2026-08-10 06:12:30+08:00 — 基準線四步全綠，auto-fix 零改動

在 `dev/dernoson`（HEAD `3cab044`）跑完 `validate-changes` 全套：`pnpm format` 全數
`(unchanged)`；`pnpm lint`（`eslint . --fix`）無輸出；`pnpm type-check`（`vue-tsc --build`）
無輸出；`pnpm test` 28 個測試檔、301 個案例全數通過，耗時 2.14s。跑前跑後 `git status
--porcelain` 一致，只有 plan-history 的兩個 md 為 modified。

合流前不存在既有紅燈，且兩支 auto-fix 工具一個字都沒改。因此後續任何實測異常都不能歸因於
「本來就壞的」—— 這條基準線是乾淨的，實測發現與既有債務之間沒有灰色地帶。

### O7 · 2026-08-10 06:14:53+08:00 — 自動化覆蓋在三方之間極度不均

清點 `src/__tests__/` 的 28 個測試檔落點，對照 O1 的三方檔案範圍：

- aaaaa：`flowEngine` 系列 8 檔、`composables/useFlowEngine`、`matchRecipeByInputs`、
  `data/` 四檔、`utils/reverseChain`、`topologyPortUtils` —— 301 個案例絕大多數在此。
- shirone：`lib/validation/detectors/overlapDetector.test.ts`（294 行）直接測 `detectOverlaps`，
  並間接運行 `getMachineOccupiedGrids` 與 `getPipelineOccupiedGrids`；
  `utils/absToRelPath.test.ts` 測 `rewritePipelineStructure`，而該模組只導出 `absToRelPath`
  這一個函式，等於全覆蓋。無專屬測試檔的只有前述兩支 grid utils 與 `types/euclideanSpace.ts`。
- mbd：`src/components/` 底下**零測試檔**，其動過的 `src/utils/flowHelpers.ts` 亦無。
  15 檔 614 行的變更，自動化驗證只保證「型別編得過」。

O6 的綠燈因此不是均勻的背書：aaaaa 的引擎行為有測試撐著，shirone 大致有，mbd 完全沒有。
`0001#2` 是 mbd 那批變更的第一道也是唯一一道檢驗，沒有既有測試會先攔下任何東西 —— 那格的
驗收要做得比其他格細，觀察也要記得更具體。

### O8 · 2026-08-10 06:22:05+08:00 — 主畫面 console 無 error 但被噪音塞滿

`pnpm dev` 冷載入 `/`：零 `[error]`，但有 18 筆 `[Vue warn] Vue received a Component that was
made a reactive object`（每個節點一筆，指名 `FlowNodeOverlay`）、約 30 筆 `[validateChains]`
debug log、1 筆 `[Validation] runValidation complete`。

兩個成因都已在原始碼確認：`src/editor/canvas/FactoryCanvas.vue:20` 寫
`const nodeTypes = { default: FlowNodeOverlay }`，元件被放進會被 Vue 轉成 reactive 的容器而
未經 `markRaw`；`src/composables/useFlowEngine.ts` 的 455／461／470／477／489／496／504 七處
`console.log` 留在正式路徑上，每次驗證重跑就整批再印一次。

功能不受影響，但 `0001#3`～`0001#6` 都要靠 console 判讀，噪音會把真正的錯誤埋掉，且噪音量
隨節點數與重算次數放大。

### O9 · 2026-08-10 06:24:40+08:00 — 兩套統計面板同時掛載且互相矛盾

冷啟動的預設藍圖有 18 nodes / 15 edges（非空畫布）。同一畫面上：mbd 的 `StatsPanel`
（`MainLayout.vue:43`）顯示設備數量 **0 台**、管線 0 條、總耗電 0 kW；aaaaa 的
`ProductionStats`（`src/editor/stats/ProductionStats.vue`，掛在 `InspectorPanel.vue:56`，已查證）
顯示設備數量 **18**、非法節點 9，並附完整原料供給表與機器用量。桌面寬度下兩者左右並排。

這超出 O2 所說的「props 是常值所以沒東西可測」：使用者在同一個畫面上會直接看到 0 台與 18 台
兩個數字。問題不在任一元件的正確性，而在**同一職責有兩套實作同時上線**，屬 mbd 與 aaaaa 的
交界，是本輪實測目前最該由使用者裁決的一項。

### O10 · 2026-08-10 06:26:15+08:00 — 預設藍圖下 FlowEngine 產不出任何結果

直接讀 store：`itemSummary` 長度 0、`ticketRates` `[]`、`totalPowerDemand`／`totalPowerSupply`
／`warehouseCapacity` 皆 0；`invalidChainUids` 有 9 筆（`orphan-1`、`furnace-A`、`parts-A`、
`crusher-B1`、`react-A`、`purifier`、`crusher-B2`、`react-B`、`parts-B`）；`nodeEfficiencies`
中來源與輸入口為 1、8 台機器全為 0。畫布上每台機器節點底下都印著「非法」。
`validationStore.alerts` 同時為 0。

兩個推論。其一：**把 StatsPanel 接上 flowStore 也不會有數字** —— 接線不是缺數字的唯一原因，
這會影響「接線」該不該被當成一件獨立的工作來開。其二：目前無法分辨這是引擎缺陷、還是預設
藍圖本來就沒接成合法鏈路（`ProductionStats` 的提示語正是「請連接物品輸出口至輸入口」）。
`0001#3` 的 preset 驗收會直接判定這件事 —— preset 全過則引擎無罪，問題在預設藍圖。

另外 `alerts` 恆 0 與「非法節點 9」並存**不構成矛盾**：非法判定來自 FlowEngine 自己的鏈路
驗證，alerts 來自 validationStore 的 detector 註冊表，是兩套獨立機制。這反而佐證了 O3。

### O11 · 2026-08-10 06:27:30+08:00 — WarehouseEstimate 的容量輸入框是死控制項

`src/components/StatsPanel/WarehouseEstimate.vue:18-29,39-44` 定義了
`emit('update:capacityCells')` 並綁在 `@input`，但 `StatsPanel/Index.vue:13` 寫的是
`:capacity-cells="0" :rows="[]"`，**沒有任何 listener**（已查證原始碼）。實測輸入 250：DOM
值變成 250 並停住，`flow.warehouseCapacity` 仍為 0，表格仍 0 列。

使用者會以為設定成功了 —— 這比「顯示 0」嚴重，因為它偽裝成可用。對照組是
`ProductionStats.vue` 的同名欄位，接了 `setWarehouseCapacity`、會真的寫進 store。同一個功能
在同一畫面上一個能用一個不能用，與 O9 是同一個交界問題的兩個面向。

### O12 · 2026-08-10 06:28:20+08:00 — StatsPanel 四個子區塊的渲染現況與三個原始碼瑕疵

空資料下四塊都不壞版：`PowerSummary` 五行文字正常但**是唯一沒有卡片外框的區塊**（裸
`<section class="p-3">`，另三塊皆 `rounded-lg border border-zinc-700`），視覺不成一套；
`ItemSummaryTable` 與 `TicketEstimate` 只剩表頭浮著，**無空狀態提示**；`WarehouseEstimate`
見 O11。

三個瑕疵本格的空陣列輸入看不到，但我已逐一在原始碼確認存在：
`ItemSummaryTable.vue:50` 用 `text-gray-900` 而容器是 `bg-zinc-950`（第 28 行），有資料時
整列近黑字配近黑底；`ItemSummaryTable.vue:69` 的 `min-w-[12.5]` 缺單位，產出無效 CSS 會被
瀏覽器丟棄；`ItemSummaryTable.vue:80` 在 `</template>` 之後有一個孤立字元 `S`。

第三項最值得注意：format／lint／type-check／test 四關全部沒攔下一個落在 SFC 頂層的雜字元。
這是 O7「mbd 零覆蓋」的具體代價 —— 靜態工具鏈對這批變更的保護比想像中更薄。

### O13 · 2026-08-10 06:29:12+08:00 — V6 拖曳錄製與 undo／redo 完全正常

真實滑鼠拖曳 `furnace-A`：`{x:380,y:200}` → `{x:480,y:260}`，DOM `translate` 同步，位移
+100/+60 符合 `snapToGrid:true` / `gridSize:20`；undoStack 0→1，label 為「移動 1 台設備」；
Ctrl+Z 回到原位（undo 1→0、redo 0→1），Ctrl+Y 復原（redo 1→0、undo 0→1）。

`commitDeviceMove` 進歷史、label 正確、undo／redo 雙向皆對。**這條路徑沒有發現任何問題** ——
在 mbd／aaaaa 交界處問題成堆的這一格裡，V6 這條是乾淨的，值得單獨記下來，免得日後把整格
的印象一併當成壞的。

附帶一個未追的現象：拖曳結束後 `selectedNodeIds` 仍為 `[]`，拖曳本身不產生選取，是否為預期
未定。

### O14 · 2026-08-10 06:29:12+08:00 — 瀏覽器 pane 尺寸固定，寬螢幕版面無截圖證據

瀏覽器 pane 實體尺寸固定 714×790；`resize_window` 改得動 `innerWidth`（DOM 量測確認 layout
確實重排到 1440×900），但截圖合成仍停在原生尺寸。

因此 O9 的「兩套面板並排」是靠 innerText 與各元件 rect 確認的，**不是靠看圖**。事實本身可信，
但凡是需要「看起來如何」才能下判斷的結論，本輪實測都不具備證據；`0001#4` 的拓撲 SVG 上色
判讀要留意同一限制。

### O15 · 2026-08-10 06:35:40+08:00 — preset 是 20 個，不是 O4 說的 22 個

- **更正:** O4

程式化計數 `presets.length === 20`，我另以 `grep -oE "id: '[^']+'"` 取出全部 id 覆核：
h1–h11（11）、g1 g2 g3 l1（4）、v9-no-sink／missing-water／swap-ore／swap-sand／xi-rang（5）。
分組為 basic 6／advanced 5／v7 4／v9 5。

O4 的「22 個」是我目測分組時多算的，事實錯誤，故用 `更正` 而非 `更新`。O4 的其餘內容仍然
成立：每個 preset 都自帶可觀測的 `expected` 條列、同頁三分頁、`graph-viz` 已退役重導。凡引用
O4 的地方一律改引本則。

### O16 · 2026-08-10 06:37:10+08:00 — 20 組 preset 全數通過，零失敗

抽樣 13 組（`0001#3` 正文列的那批）全過，另補跑其餘 7 組亦全過。判讀方式是直接驅動
`loadPreset(id)` 並讀 `result` 的 `edgeFlows`／`nodeEfficiencies`／`sinkDeliveries`／
`congestedEdges`／`invalidChainUids`，完全不依賴 console —— 這繞開了 O8 的噪音問題。

關鍵數字：H1 `crusher=1`、兩邊皆 30；H2 `crusher=0.5`、兩邊皆 15；H3／H11 分流均分
（15/15、7.5/7.5）；H4／H5 非法集合正確且 flows 空；H7 埠實測落在 `in-0`／`in-1`、出邊 30
不堵而兩入邊各 15 標堵塞；H8 匯流器出邊 30、兩入邊各 15 堵塞；G1 `converter=1`、息壤 30；
G2／H10／V9-缺清水 皆正確標非法且無交付；L1 實測 `solid_mode.loss` 存在而 `息壤氣
consumed=30`（非 36），確認 V7 不扣 loss；V9-息壤鏈節點實測 `environment:"stable"`。

引擎在 v7／v8／v9 三代規則上的行為與作者自訂的驗收條件一致。這是本輪實測唯一大面積為綠的
區塊，且判準不是實測時現編的。

### O17 · 2026-08-10 06:39:05+08:00 — O10 結案：引擎無罪，根因是預設藍圖停在舊資料模型

O10 懸著「引擎缺陷還是預設藍圖沒接好」一問，O16 的 20 組零失敗已排除引擎缺陷。進一步用 dev
頁的 JSON 輸入做對照實驗（該頁本就設計成可改 JSON 執行，不永久改動主畫布），把預設藍圖原封
不動貼進去分三輪加欄位：原樣 → `edgeFlows` 0 條；只補 `furnace-A` 的 `machineMode` → 毫無
變化；再補兩個來源的 `primaryOutput` + `sourceRatePerMin:30` + `machineMode` → **鏈路 A 整條
活過來**（赤銅礦 30、清水 30 → 赤銅塊 30、汙水 30 → 赤銅零件 30，兩節點離開非法集合）。

根因已在原始碼確認：`src/store/editorStore.ts:10` 起的 `mockNodes`，節點 data 只有
`{ label, machineType, recipeIndex }`；`:135` 起的 `mockEdges` 只有
`{ id, source, target, animated }`。而引擎要的是 preset 那種形狀 —— 機器要 `machineMode`，
來源要 `primaryOutput` 與 `sourceRatePerMin`，邊要 `sourceHandle`／`targetHandle`。缺
`primaryOutput` 時來源不知道自己吐什麼，第一條邊就沒有流量，下游整條連帶非法。

這反過來改寫 O9／O2 的解讀：**把 StatsPanel 接上 flowStore 也仍然全是 0** —— 接線是必要
條件不是充分條件，種子資料得先跟上 v7／v9 模型。這是 aaaaa 改資料模型而 editorStore 的種子
沒跟上，屬三方交界的接線缺口，已補進 `0001#7` 的清單。

### O18 · 2026-08-10 06:40:15+08:00 — 產出率超過出邊上限時，既不降效率也不標堵塞

| preset | 配方 | produced | 出邊實際 | Sink | 效率 | 堵塞 |
|---|---|---|---|---|---|---|
| V9-換料砂葉 | 1 砂葉 → 3 砂葉粉末／2 秒 | 90/min | 30/min | 30 | 100% | 無 |
| V9-息壤鏈 | 1 芽針 → 2 碳塊／2 秒 | 碳塊 60/min | 30/min | — | 100% | 無 |

配方數量我開 `src/data/products.ts` 覆核過：`crusher_p_7eec6b9218_0` 的 `砂葉粉末` quantity 3、
`refinery_p_81e181b9f1_2` 的 `碳塊` quantity 2，兩者 `timeSeconds: 2`，所以 90／60 的算術正確。

每分鐘 60／30 的產出憑空消失，效率仍報 100%，`congestedEdges` 為空。引擎在別處是會做背壓的
—— H8 的 c1／c2 就因下游匯流器出口限 30 被壓到 50% 且入邊正確標橘（O16）。同一套機制在
「機器自身產出率 > 出邊媒質上限」這個情境沒有生效。究竟是缺陷，還是 `produced` 本就定義成
機器名目產能而非實際吞吐，需要由規格擁有者認定，不由實測裁決。

### O19 · 2026-08-10 06:41:26+08:00 — 另四項 expected 未涵蓋的行為與一項措辭問題

四項數字上站得住、但沒有任何 expected 涵蓋到的行為：

1. **pass-through 節點的 consumed 重複計算** —— H3 `源礦 produced 30 / consumed 60`（分流器
   算一次、兩個 Sink 再算一次），H11 同型 `p15/c30`；H1 無 pass-through 則乾淨的 `p30/c30`。
2. **收不到料的 Sink 仍報 100% 且不列非法** —— H10／G2／V9-缺清水 三組，上游已標非法、Sink
   一無所獲，但 `sink=1` 且不在 `invalidChainUids`。
3. **G3 標記範圍比 expected 寬** —— expected 說「兩端」，實際 `inv` 三個（含下游 sink）。連帶
   非法說得通，但與字面不符。
4. **拓撲 SVG 的匯流器節點擠成一團** —— 1×1 格畫得極小，埠標籤與節點名重疊到看不清；其他
   3×3 機器正常。純視覺，不影響數值，且受 O14 的截圖限制。

另有一項不是行為問題而是驗收條件本身的問題：**H6 的第一條 expected 不可證偽** ——「鏈上設備
效率多數接近 100%」，實際 `c1=1`、`c2=0.5` 剛好一半一半，談不上「多數」；括號註明「（受
belt 限制）」顯示作者預期到會被壓低。此條未判不過，但也不能算真的驗到了。

### O20 · 2026-08-10 06:48:10+08:00 — catalog 資料一致性與拓撲上色三項皆過

**機器分頁（判準自訂，程式化掃描 46 台 × 全 mode 的每個埠）**：offset 超界 0 筆、同 side 同
offset 重疊 0 筆、未分類機器 0 台、`config_signed_off === false` 0 台；5 個 tag 各
10／11／7／13／5，加總 46、聯集 46，恰好分割。無埠機器 6 台（供電樁、中繼器、倉庫存取線等）
本來就沒埠。逐座標比對精煉爐 3×3：`drawnPorts` 算出 in-0/1/2 在 (50,36)(78,36)(106,36)、
out 在 y=120、liquid_mode 多的 in-3 (36,78)／out-0 (120,78)，以 cell 28、pad 36 換算完全正確，
切 mode 後即時更新。**渲染與資料零落差。**

**產品分頁（判準自訂）**：94 產品 / 14 材料全部解得出鏈，無 0 步數，所有葉節點都是真材料，
最深鏈 10 步（灼銅裝備原件）。

**拓撲上色（判準為頁面自帶圖例，本格唯一照表驗收的部分）**：H8 讀 attribute 實測
`src1/src2/merger/sink` 效率 1 → `fill:#22c55e`，`c1/c2` 效率 0.5 → `fill:#eab308`，邊線
`#f97316` 恰 4 條對應 `congestedEdges`、`#71717a` 1 條為未堵的 e5；H4 非法節點
`fill:#71717a stroke:#a1a1aa stroke-dasharray:"4 3"`。全部與圖例一致。

三項結論皆未依賴截圖，繞開了 O14 的限制。資料層與視覺對映這一塊是可信的，本格的問題全部
集中在互動時序與版面（O21～O24）。

### O21 · 2026-08-10 06:50:25+08:00 — findShortestReverseChain 對 4/94 產品回傳非最短鏈

`findShortestReverseChain('赫銅塊')` 回傳 7 步，實際最短為 6 步。不需要相信任何外部模型即可
確認：實作自己算出 `findShortestReverseChain('氣態赫銅')` 為 5 步；`赫銅塊` 有一條配方
`solid_gas_converter_hue_copper_ingot_1`（已覆核 `src/data/products.ts:565-572`）輸入**只有**
`氣態赫銅`；故經此路徑為 1+5=6，且該樹六個品項互不重複、完全無環。另三個（赫銅瓶 8→7、
赫銅零件 8→7、赫銅裝備零件 17→16）都是自赫銅塊 +1 繼承，**根只有一個**。

根因在 `src/utils/reverseChain.ts:125-135`（已覆核）：memo 命中的重用條件是
`cached.productsUsed ∩ stack === ∅`。追 `赫銅塊` 的展開順序 —— 先試 recipe 0 遞迴進
`赫銅溶液`，此時在 stack = {赫銅塊, 赫銅溶液} 之下評估 `氣態赫銅`，它的兩條便宜路徑分別要經
`赫銅溶液` 與 `赫銅塊`，雙雙被擋，只剩經 `分離芯` 的昂貴路徑，算出 8 寫進 memo；回到 recipe 1
時 stack 只剩 {赫銅塊}，`氣態赫銅` 本可走 `赫銅溶液` 拿到 5，但 memo 命中那筆 8，而它的
`productsUsed` 走分離芯路線、不含赫銅塊，守衛檢查不出衝突而直接重用。

守衛檢查的是「這棵快取樹**用到**哪些產品」，真正該檢查的是「算這棵樹時**哪些路徑被擋住**」。
兩者不等價，這就是漏洞 —— 快取了一個在受限 stack 下才成立的成本，卻在限制解除後重用。
`src/__tests__/utils/reverseChain.test.ts` 存在但未涵蓋此情形，是 O7 覆蓋議題的又一個實例。

嚴重性請照「**1 個根因、4 個產品輸出錯誤**」讀：修一處即可全部歸位，但使用者可見的錯誤結果
是四筆。

### O22 · 2026-08-10 06:51:40+08:00 — 埠標籤寬度未隨格寬縮放，兩個畫面都中

- **推翻:** O19

標籤 `{{ p.label }}·{{ p.media }}`（如 `in-0·belt`）在 font-size 8 下約 40px 寬，格寬只有
28px。機器分頁的 3×3 機器單邊三埠時，三個標籤疊成 `n-0·beltin-1·beltin-2·belt` 無法閱讀，
中央的「液體模式 · 3×3」也被埠方塊蓋住；拓撲 SVG 的匯流器則是 1×1 卻有 in3/out1 四個埠，
標題（font 10）與尺寸標籤（font 8）畫在 `y+min(14, rectH*0.28)` 與 `y+min(28, rectH*0.5)`，
小 rect 上間距不足而重疊。

O19 第 4 項把它記成匯流器的 1×1 特例，那個歸因不成立：同一成因在 3×3 機器上照樣發作。事實
（匯流器擠成一團）仍然為真，但它是通病的一個樣本，不是特例。屬純視覺，不影響數值。

### O23 · 2026-08-10 06:53:00+08:00 — 拓撲切 mode 不觸發重算，中間態是混合畫面

`setTopoNodeMode`（`FlowEngineTest.vue:1141-1150`，已覆核）只把 `machineMode` 寫回
`jsonInput`，**沒有呼叫 `runCalculation()`**。g1 實測切 `solid_mode → gas_mode`：`jsonInput`
更新、埠示意跟著換，但 `result` 完全沒變，仍是 solid_mode 的 `converter=1、息壤=30、無非法`；
手動按執行計算後才變成 `src,converter,sink` 全非法、零流量（媒質不符，與 G3 同型）。

UI 提示只承諾「埠示意會更新」，所以不算食言。但中間態是**新的埠配置疊在舊的效率配色上**，
看的人無從分辨畫面哪一半是舊的 —— 而這正是 `0001#4` 正文問的「切 mode 後是否重算」，答案
是否。對後續任何依賴此頁判讀的工作，這是一個會靜默誤導的狀態。

### O24 · 2026-08-10 06:54:33+08:00 — 兩處呈現與敘述瑕疵

`MachineCatalogPanel.vue:175` 的說明寫「依 machine.tags 分頁；一機多 tag 可出現多頁」，但實測
`tags.length > 1` 的機器是 **0 台**。功能或許支援，資料從未觸發，這句敘述目前描述不到任何
現象。

`DevTopologySvg.vue:346`（已覆核）以 `v-if="node.rectH >= 48"` 關掉帶著 `id · 效率%` 的第三行
副標。匯流器、分流器、物流橋這類正好都是 1×1，因此**恰恰是最需要看堵塞狀況的節點看不到
效率** —— H8 實測 `merger` 效率為 1，SVG 上只有「匯流器 ¶ 1×1 · 預設 · in3/out1」。

兩者都不影響數值，但都會讓讀畫面的人得到比實際少的資訊。

### O25 · 2026-08-10 13:02:10+08:00 — history-replay 六項驗收：M1–M4、M6 過，M5 紅

在 `/dev/history-replay` 以真實點擊跑該頁自帶的一鍵腳本。「一鍵 M1→M4」全綠（Undo 還原、
Redo、多機一次還原、零位移不進歷史），「一鍵 M6（moveDevices）」全綠（X+50、Undo 還原）。
checklist 對應項自動勾起。

「一鍵 M5（交錯）」紅：`✓ Undo 刪除／旋轉後仍在移動後座標`，但 `✗ 移動 undo 未回原點`。

M7（主畫布跟手）此頁無法代替，已由 O13 在 0001#2 涵蓋，本格不重測。

除了 M5 那一項，V6 的錄製與回放工具本身可用。

### O26 · 2026-08-10 13:04:05+08:00 — M5 紅燈的根因在 dev 頁腳本，不在 historyStore

`HistoryReplay.vue:870-884` 的 `runV6ScriptM5` 只呼叫三次 `historyStore.undo()`，註解寫
「還原 other → 還原 rotation → 還原移動」。但腳本清場後實際堆疊有五筆：place(uid)、
move、rotate、place(other)、remove(other)。三次 undo 只退到 rotate，移動那筆還在堆疊上，
於是斷言 `backToOrigin` 必然為 false。**少算的是 `testPlaceDevice()` 自己也進歷史那一筆。**

實測覆核：M5 跑完後 Undo Stack 剩 `machine_placement`、`machine_movement` 兩筆，Redo Stack
三筆；手動再按一次 Undo，節點 x 由 125.15059202489715 → 65.15059202489715，正好 −60，即
腳本寫入的位移量，回到原點。

所以引擎行為正確，錯的是這格驗收腳本的 undo 次數。M5 的紅燈是假警報，但它會讓每個跑這頁
的人以為 commitDeviceMove 的 undo 壞掉 —— 這比沒有這項驗收更糟。

### O27 · 2026-08-10 13:05:20+08:00 — 回放順序與 undo／redo 往返完全自洽

跑「場景 2：擺放 → 移動 → 刪除」後讀 Undo Stack：`#1..#4 machine_placement`、
`#5 machine_movement`、`#6 machine_deletion`，與操作發生順序逐項對應，無合併、無亂序、
無漏錄。該場景執行前 Redo Stack 有一筆，執行後歸零，分支點清空規則成立。

連按 6 次 Undo：Undo Stack 6→0、Redo Stack 0→6，Redo Stack 內容為 Undo Stack 的精確逆序，
畫布清空，Undo 鈕 disabled。再連按 5 次 Redo：四個節點的 id、清單順序、座標全部還原成
undo 前的值，且座標是完整浮點位元相同（如 `115.15059202489715`、`437.9264772296248`）。

「拖曳被錄成 command」「回放順序與操作順序一致」「undo／redo 互動自洽」三問皆為是。

### O28 · 2026-08-10 13:05:55+08:00 — editorStore 跨重整持久化，historyStore 不持久化

進頁時畫布顯示「18 台設備」而 Depth 為 0 —— 前幾格實測留下的節點被保存並在重整後復原，
歷史堆疊則沒有。兩個 store 的持久化策略不一致，效果是使用者重開頁面後看得到自己的藍圖，
卻一步也 undo 不回去。

附帶一個破壞性行為：「一鍵 M1→M4」與「一鍵 M5」開頭都會 `removeDevices` 清空整個畫布
（按鈕文案有寫「會自動清場」）。在 dev 頁這無妨，但它清掉的是與主畫面共用、且會被持久化
的同一份 `editorStore`。這次實測就把那 18 台清掉了。

是否要讓 historyStore 一併持久化、以及清場是否該只清腳本自己擺的節點，都未定。

### O29 · 2026-08-10 13:09:51+08:00 — M5 的另一項斷言是空過的，修法不只是多按一次 undo

- **推翻:** O26

覆核 `HistoryReplay.vue:843-893` 全段。堆疊確為五筆（`:846-849` 清場並 `historyStore.clear()`、
`:852` place(uid)、`:858` commitDeviceMove、`:861` rotateDevice、`:865` place(other)、
`:868` remove(other)），O26 的計數正確。但三次 undo 依序退掉的是 remove(other) → place(other)
→ rotate，而 `stillMoved` 的量測寫在 `:873`，**只按了兩次 undo 之後** —— 此刻 rotate 還沒被
還原。它的文案「✓ Undo 刪除／旋轉後仍在移動後座標」聲稱旋轉已還原，實際沒有；而 place／
remove 都不動 uid 的座標，所以這項斷言無論引擎對錯都會過。

O26 的實測數字反過來佐證這件事：跑完剩 undo 2 筆 + redo 3 筆＝5 筆，底下兩筆是 place(uid)
與 move，被退掉的三筆只能是 rotate／place(other)／remove(other)。

O26 的判決本身不動：紅燈是假警報，引擎無罪。**倒的是「錯的只是 undo 次數」這個推論** ——
M5 的兩項斷言都與堆疊對不上，一項假紅、一項空過。所以修法不是多呼叫一次 `undo()`：undo
次數要改成四次，且 `stillMoved` 的量測點要移到 rotate 被還原之後，否則紅燈消失而空過的那項
依舊空過，帳面全綠但旋轉從頭到尾沒被驗過。這比 O26 描述的「一行」要大，也讓 O26 那句
「比沒有這項驗收更糟」更成立。

### O30 · 2026-08-10 13:12:05+08:00 — validation-test 四步流程照跑，空轉完全符合預期

在 `/dev/validation-test` 依 `ValidationTest.vue:34-39` 自附流程逐步真實點擊，每步後讀畫面：

| 步驟 | Editor Nodes | 目前警示 | Error | Warning |
| --- | --- | --- | --- | --- |
| 進頁 | 18 | 0 | 0 | 0 |
| 新增 A | 19 | 0 | 0 | 0 |
| 新增重疊的 B | 20 | 0 | 0 | 0 |
| 新增不重疊的 C | 21 | 0 | 0 | 0 |
| 清空所有設備 | 0 | 0 | 0 | 0 |

A／B／C 確實以宣稱的座標進入清單（`@(10, 10)`、`@(11, 11)`、`@(50, 50)`），清空後顯示
「(無節點)」且按鈕轉 disabled，全程 console 零 error。

判準來自 O3 與頁面自附說明，**不是自訂的**：alerts 恆 0 是註冊表為空的必然結果，本格照表
確認它確實如此，不記為缺陷。這格的價值在於把「空轉」與「壞掉」分開 —— 監聽鏈路
（`useValidation()` → `editorStore.nodes` 變動）本身是活的，Editor Nodes 每一步都即時更新，
所以 alerts 為 0 是因為沒有 detector 可跑，不是因為監聽沒接上。

### O31 · 2026-08-10 13:13:20+08:00 — editorStore 完全不持久化，那 18 台是硬編種子

- **更正:** O28

`grep -n "useLocalStorage|persist|localStorage|sessionStorage" src/store/` 零命中。實際讀瀏覽器
儲存：`localStorage` 只有 `vueuse-color-scheme` 與 `aaaaa-v6-d2-checklist`（V6 勾選狀態），
`sessionStorage` 為空，兩者都沒有藍圖。`editorStore.ts:183-186` 寫的是
`shallowRef<FactoryNode[]>(mockNodes)` / `shallowRef<FactoryEdge[]>(mockEdges)`，即
`:20-133` 的硬編種子。

決定性覆核：history-replay 那輪結束時畫布只剩 4 個 `crypto.randomUUID()` 節點；整頁載入
`/dev/validation-test` 後 Editor Nodes 回到 18，且 id 是 `src-Cu-A`、`src-H2O-…`、`furnace-A`
—— 種子的名字，不是那 4 個 UUID。清空後再 reload，主畫面回到 18 nodes／15 edges。

所以 O28 說的「跨重整持久化」是事實錯誤：什麼都沒存，每次載入都從 `mockNodes` 重新開始，
看起來像復原其實是重新播種。`historyStore` 不持久化這半句仍然成立，但「使用者重開頁面後
看得到自己的藍圖卻 undo 不回去」這個推論整個不存在 —— 真實情況更糟也更單純：**重開頁面
會丟掉使用者做過的一切，換回一份 demo 資料**。O28 的破壞性清場那段改由 O32 承接。

### O32 · 2026-08-10 13:13:55+08:00 — dev 頁與主畫面共用同一份 editorStore，是通病不是個案

`ValidationTest.vue:153` 與 `HistoryReplay.vue:554` 都是 `useEditorStore()`，`MainLayout` 那條
路徑也是同一個 Pinia store id（`defineStore('editor', …)`，`editorStore.ts:181`）—— 沒有任何
scoping，右側「Editor Nodes」就是主畫面藍圖本身。

實測確認效果會即時傳導：在 `/dev/validation-test` 按「清空所有設備」把 21 台清成 0，接著點
頁首 RouterLink「← 返回主編輯器」（SPA 導覽，不重載），主畫布是空的，統計面板顯示
設備數量 0 台／管線 0 條。反向亦然：這頁按三次新增，主畫面就多三台。

因此這不是 history-replay 一頁的個案 —— **`/dev/*` 三頁的每一個「新增」「清空」「一鍵腳本」
按鈕都在改主畫面藍圖**，而頁面上沒有任何一句話提到這件事。有 O31 墊底，影響範圍是一個
session 內：重載會換回種子，不會永久損毀使用者資料。但在同一 session 裡切回主畫面，看到的
是被 dev 頁改過的藍圖。

### O33 · 2026-08-10 13:14:30+08:00 — 頁面文字與實際行為四處對不上

本格要求的第二項產出。四處都已對照原始碼確認：

**一、座標系。** 按鈕與 JSDoc（`ValidationTest.vue:160`、`:174`、`:188`）都寫「格子座標」，
但 `types/graph.ts:15` 明言「Vue Flow 的 Node.position 仍為像素座標」，`canvasStore.ts:26`
`gridSize = 20`。精煉爐是 3×3 格（`machines.ts:146-148`）＝ 60×60 px，所以 A@(10,10) 佔
10–70 px、C@(50,50) 佔 50–110 px —— **在 store 實際使用的像素語意下，「不重疊的設備 C」與 A
是重疊的**。它只在 shirone 那套 `getOccupiedCells`（`getMachineOccupiedGrids.ts:18-24`，以 1 為
步長逐格展開）的整數格語意下才不重疊。同一頁的按鈕文案採 A 方的座標系，寫入的卻是 B 方的
store —— 這正是 O3 說的兩套型別不相通，在 UI 文案上留下的痕跡。

**二、副標題超賣。** `:6` 寫「測試 validationStore 的 detector 註冊與 E001 設備重疊偵測」，
但註冊數為 0、E001 從未被執行過。頁面測得到的只有「註冊表是空的」。

**三、步驟 4 是空句。** `:38`「點擊『清空所有設備』，警示應歸零」—— 警示從第 1 步就是 0，
無零可歸。這項斷言在目前狀態下不可能失敗（與 O29 的 `stillMoved` 同一種毛病：讀起來像驗收，
實際上恆真）。

**四、沒交代畫布不是空的。** 流程從「新增設備 A」開始，讀者會以為 A 是第一台；實際進頁就有
18 台種子（O31），A／B／C 是疊在既有藍圖上，且清空會一併清掉那 18 台（O32）。

四項都不影響 alerts 恆 0 的結論，但每一項都會讓照著這頁操作的人得到錯誤的心智模型。

### O34 · 2026-08-10 13:18:37+08:00 — 座標系錯配的後果：這頁的 fixture 會替一個壞掉的 E001 背書

O33 第 1 項的事實與推論都成立，本則是把它往下推一步。三個數字已覆核：
`getMachineOccupiedGrids.ts:18-24` 的 `getOccupiedCells` 以 `dx/dy/dz` **各步進 1** 展開佔用格，
即純整數格語意；`canvasStore.ts:26` `gridSize = ref(20)`；`graph.ts:14-15` 明言 position 是像素。

在格子語意下重算這頁的三台 3×3 精煉爐：A(10,10) 佔 10–12、B(11,11) 佔 11–13（重疊）、
C(50,50) 佔 50–52（不重疊）。**這組 fixture 完全照文案行為** —— 它剛好是少數在兩種語意下
標籤都說得通的座標。但真實藍圖不是這樣：畫布 20px 吸附，兩台並排的 3×3 機器相距 60px，
餵進 `getOccupiedCells` 就成了相距 60 格而 `size` 只有 3，永遠不重疊；要讓它判定重疊，兩個
節點得靠近到 3 像素以內。

所以一旦有人照 `0001#7`／`0001#8` 的結論把 `detectOverlaps` 註冊進 validationStore 並餵
`editorStore.nodes`，**這頁會全綠，而主畫布上的重疊偵測實質失效**。O33 把它記成文案瑕疵，
真正的後果是這頁是專門用來驗這件事的頁面，卻會替壞掉的整合出具通過證明。

連帶一項給 `0001#8` 第 3 題的成本估算：adapter 不只是換形狀。`FactoryNodeData`（`graph.ts:18-49`）
根本沒有 `size` 欄，而 `shironesMachine` 要 `size: [w,h,d]`，得回查 `machines.ts`；`position`
還要除以 `gridSize` 取整。「保留 adapter」不是純風格選擇，它要自己承擔單位換算與尺寸查表，
而這正是目前錯得無聲無息的那一段。

### O35 · 2026-08-10 13:22:40+08:00 — 整合缺口清單：九項，全數靜態查證

本格的交付物。純讀原始碼，未跑 UI。每項為「現況 → 缺什麼 → 動到哪些檔案 → 哪一層」。

**G1 · FlowChart 六元件零引用、無路由**（承 O2）
`grep -rn "FlowChart"` 在 `src/` 只命中資料夾自身；`router/index.ts` 全文四條路由（`/`、
`/dev/flow-engine`、`/dev/history-replay`、`/dev/validation-test`），無任何一條指向 FlowChart。
`Index.vue:29-78` 自持 `ref` 狀態與 `useVueFlow()` 高亮邏輯，並硬編 demo 資料。
缺：資料來源與掛載點。動：`FlowChart/Index.vue`、掛載它的容器。層級：**L2／L3 邊界未定**，
正是 0001#8 第 1 題。

**G2 · StatsPanel 的常值不在 MainLayout 而在元件自己**（修正 O2 的落點）
`MainLayout.vue:44` 寫的是 `<StatsPanel />`，**一個 prop 都沒傳**；常值硬編在
`StatsPanel/Index.vue:5-13`（`:total-demand-kw="0"`、`:rows="[]"`、`:capacity-cells="0"`）。
所以缺的不是「MainLayout 沒傳」，是 `Index.vue` 根本沒宣告 props、沒接 `flowStore`。
缺：`Index.vue` 的 props 或 store 讀取。動：`StatsPanel/Index.vue`、可能加上 `MainLayout.vue`。
層級：0001#8 第 2 題。**注意 O17：接上去也仍是 0，G5 不解則此項無可觀測效果。**

**G3 · `detectOverlaps` 不是 `Detector`，且四個維度都不相容**（承 O3，細節見 O36）
`overlapDetector.ts:17` 是 `(shironesMachine[], shironesPipeline[]) => string[]`；
`types/validation.ts:71-78` 要的是 `{ code, level, run(ctx): Alert[] }`。`src/` 內零
`registerDetector` 呼叫點（`validationStore.ts:47` 有實作，無呼叫者）。
缺：一個 adapter 或一次型別收斂。動：`overlapDetector.ts`、`types/shironesinterface.ts`、
新的註冊點。層級：0001#8 第 3 題與第 4 題。

**G4 · 座標單位不相通 —— 與 G3 是兩件事**（承 O34）
`graph.ts:14-15` position 為像素、`canvasStore.ts:26` `gridSize=20`；
`getMachineOccupiedGrids.ts:18-24` 以步進 1 展開，是整數格。**形狀對上了單位也不會對**，
且不會報錯、不會型別失敗，只會永遠判不出重疊（O34）。
缺：一次 `position / gridSize` 的換算，以及它該放在 adapter 還是收斂進主線型別的決定。
動：與 G3 同一批檔案。層級：0001#8 第 3 題的成本項。

**G5 · `mockNodes`／`mockEdges` 停在舊資料模型**（承 O17）
`editorStore.ts:14-133` 的節點 data 只有 `{ label, machineType, recipeIndex }`，`:135` 起的邊
只有 `{ id, source, target, animated }`。引擎要 `machineMode`、來源要 `primaryOutput` 與
`sourceRatePerMin`、邊要 `sourceHandle`／`targetHandle`（`graph.ts:18-49` 已定義這些欄位）。
缺：種子資料補齊到 v7／v9 模型。動：`editorStore.ts` 單檔。層級：L1。
**這是清單裡唯一單檔可解、且解了會讓 G2 產生可觀測效果的一項。**

**G6 · `rewritePipelineStructure` 產品程式碼零引用**（承 O3）
`grep` 顯示它只被 `__tests__/utils/absToRelPath.test.ts` 與 `getPipelineOccupiedGrids.ts`
引用，後者本身也只被 `overlapDetector.ts` 引用，而該檔零產品引用 —— 整條 shirone 管線鏈是
懸空的。缺：隨 G3 一併接上，或明確標為未使用。動：`src/utils/shirone/` 三支。層級：L1。

**G7 · `FactoryEdge` 沒有 waypoints，管線側無法轉換**（新增）
`shironesPipeline` 要 `waypoints: Position[]`（明確折線），但 `graph.ts:56-68` 的
`FactoryEdgeData` 只有選用的 `bendPoints?: {x,y}[]`，**且沒有起訖座標** —— 端點是渲染時由
source／target 的 handle 位置導出的，資料模型裡不存在。
缺：從 node handle 反推端點座標的能力。動：`graph.ts`、adapter、可能要 `FactoryCanvas`
暴露 handle 幾何。層級：L1。**這項比 G3／G4 更硬：前兩者是換算，這項是資料根本不存在。**

**G8 · 兩處架構約定只靠註解維持**（承 O5）
`useValidation.ts:13` 的呼叫順序要求、`validationStore.ts:11-12` 同時記載兩種註冊策略。
缺：機制或定案。動：`useValidation.ts`、`validationStore.ts`、`MainLayout.vue`。
層級：0001#8 第 4、5 題。

**G9 · dev 三頁與主畫面共用同一份 `editorStore`**（承 O32、O31）
`ValidationTest.vue:153`、`HistoryReplay.vue:554` 與 `MainLayout` 走的都是
`defineStore('editor')`，無 scoping，dev 頁的每個「新增」「清空」「一鍵腳本」都在改主畫面
藍圖，且頁面沒有一句話提到。**實際傷害範圍限一個 session** —— 有 O31 墊底，store 零持久化，
重載即換回種子，**不會造成資料損毀**。
缺：一句警語，或 dev 頁改用獨立 store 實例。動：`src/app/dev/` 三頁。層級：L1 的 dev 頁職責。

**不列入本清單的**：測試覆蓋缺口（O7，本格正文已排除）；`0001#3`／`0001#4` 找到的引擎與
視覺化瑕疵（O18、O21、O22、O23、O24）——那些是既有功能的缺陷，不是「三方交界沒接起來」。

### O36 · 2026-08-10 13:23:30+08:00 — 「保留 adapter」要跨的是四層，不是一層

O34 已指出單位換算與尺寸查表。逐行讀完 `overlapDetector.ts:40-80` 後，完整落差是四層，
其中兩層 O34 未涵蓋：

1. **形狀**：`FactoryNode`（`{id, position:{x,y}, data}`）→ `shironesMachine`
   （`{id, position:number[], rotation, size:number[]}`）。`FactoryNodeData` 無 `size`，得回查
   `machines.ts`；`Machine` 只有 `width`／`height`，**沒有深度**，`size[2]` 得自行合成。
2. **單位**：像素 → 格（G4／O34）。
3. **維度會在執行期爆炸**：`overlapDetector.ts:41-49` 以第一個點的維度為基準，不一致就
   `throw new Error('Dimension mismatch!')`。機器若合成成 3-tuple 而管線由 2D `bendPoints`
   轉出 2-tuple，**第一條管線就會拋例外**。`validationStore.ts:82-93` 的 try／catch 會把它吞成
   一行 `console.error`，alerts 靜靜地少一批 —— 又是一個不會紅的失敗。
4. **輸出**：`detectOverlaps` 回 `string[]`，而 `Detector.run` 要 `Alert[]`（要 `uid`、`code`、
   `message`、`relatedDeviceUids`、`relatedConnectionUids`）。且回傳的 id 是**設備與管線混在
   同一個陣列**（該函式 JSDoc 自陳），adapter 拿不到型別標記，得自己回查才能分流到兩個欄位。

另有一項語意假設：`absToRelPath`（`rewritePipelineStructure.ts:31-40`）對每個維度各推一筆
`AxisMove`，等於把斜線段拆成先走 x 再走 y 的 L 形。管線若非軸對齊，佔用格會與畫面上的線
不一致。目前 `bendPoints` 無編輯 UI（`graph.ts:66` 註明 Phase 1 建立後不可編輯），這項還沒
機會發作。

結論：0001#8 第 3 題的「保留 adapter」不是風格選擇。四層裡有兩層（3、4）是**寫得出來但會在
執行期靜默失敗**的類型，與 O34 的單位問題同一族 —— 這一整族的共同點是型別檢查與現有測試
都攔不住。

### O37 · 2026-08-10 13:24:10+08:00 — 七題中兩題的前提已被本輪改寫，並缺第八題

回答 0001#8 的可問性，避免使用者被問到已有答案的題目。

**第 2 題（StatsPanel 誰餵資料）題目仍要問，但必須附 O17 的但書。** 兩個選項（MainLayout
往下傳／StatsPanel 升格容器）都還開著，可是 O17 已證實**任一選法接上去畫面都仍是 0**，
除非 G5 先解。不附這句，使用者會以為選完就有數字。另外題幹說「MainLayout 讀 store 往下傳」
隱含 MainLayout 目前有傳 —— 依 G2，它一個 prop 都沒傳。

**第 3 題（型別邊界）的兩個選項已不對等。** 題目把「收斂成主線型別」與「保留 adapter」並列
成風格選擇，但 O34 加 O36 顯示 adapter 要跨四層、其中兩層會靜默失敗。這題該問的仍是同一個
問題，選項描述要換成帶成本的版本。

**第 6 題（preset 抽共用 fixture）強度變了。** O16 的 20 組全過使它看起來只是整理工作，但
O34 給了它一個具體理由：`ValidationTest.vue` 那組 A／B／C 座標剛好在兩種語意下都說得通，
是**手寫 fixture 恰好遮住錯誤**的實例。這題現在有證據支撐，不再只是風格偏好。

**其餘四題（1、4、5、7）前提完好**，本輪沒有觀察觸及。

**建議補第八題：dev 頁與主畫面共用 `editorStore` 是否可接受（G9／O32）。** 它同時牽涉 L1
職責與 dev 頁定位，兩個選項（加警語／dev 頁獨立 store 實例）成本差很多，且不屬既有七題任何
一題。有 O31 墊底，它不是資料安全問題，所以是可以緩的一題 —— 但它是本輪唯一橫跨三個 dev
頁的結構性發現，漏掉它，`0001#7` 的清單就有一項永遠不會被裁決。

**沒有任何一題因本輪觀察而不必問了。** 第 2、3、6 題是前提被改寫，不是被回答。

### O38 · 2026-08-10 13:25:56+08:00 — FlowChart 是第二套畫布實作，不只是「未接線的元件」

開第一題之前覆核 FlowChart 的實際形狀。`src/components/FlowChart/Index.vue:1-26` 自己
`import { VueFlow, useVueFlow }`，自己註冊 `nodeTypes`（material／device／product／warehouse／
pendingImport 五種）與 `edgeTypes`（customEdge），`:28` 起自持 `ref` 節點資料。資料夾內共
七檔：`Index.vue` 與六個節點／邊元件。

對照主線：`src/editor/canvas/` 已有 `FactoryCanvas.vue`＋`FlowNodeOverlay.vue`＋
`PipelineEdge.vue`，是實際掛在 `/` 上運行的那一套（O8 的 18 筆 reactive 警告就出自它的
`nodeTypes`）。兩者都是完整的 `<VueFlow>` 宿主，各有一套節點型別註冊表。

所以 G1 的描述「零引用、無路由」是對的但不夠：**它不是一批等著被接線的展示元件，它是同一
職責的第二套實作**，與 O9 的兩套統計面板是同一個模式，只是這一套還沒被掛上去所以在畫面上
看不到衝突。`0001#8` 第 1 題若照原題幹問「是 L3 主元件還是誤置的 L2 容器」，會預設了「它要
被接上去」這個前提；真正要先答的是保留哪一套的節點視覺，答完才輪得到層級歸屬。

## 待辦

### 1 實測基準線：現有驗證套件的紅綠現況

- **state:** 完成
- **basis:** → O1

在動任何實測之前跑一次 `validate-changes`（format → lint → type-check → test），把結果
完整記進觀察。目的不是修任何東西，是切開「合流前就存在的紅燈」與「這次實測發現的問題」——
沒有這條線，後面每一個異常都會爭論是不是本來就壞的。

若出現失敗，照記不修，並在觀察中標明失敗屬於哪一方的檔案範圍。

**子格衍生指引**：本格是「自動化驗證現況」的傘格。若跑出來的紅燈需要個別追查或修復，
每一項另開新格承載，本格加 `needs` 指向它們，本格只保留基準線本身的結論。

**沿革**

- H1 · 2026-08-10 決斷 —— 實測前先取基準線，避免既有紅燈被誤記為實測發現（使用者）
- H2 · 2026-08-10 落地 —— 四步全綠、auto-fix 零改動，無既有紅燈 → O6
- H3 · 2026-08-10 決斷 —— 不開子格：無紅燈可追，覆蓋偏差屬觀察 → O7

### 2 主畫面實測：StatsPanel 渲染與 V6 拖曳錄製

- **state:** 完成
- **needs:** 0001#1
- **basis:** → O2、O7

在 `/` 上驗三件事：頁面開得起來且 console 無 error；StatsPanel 四個子區塊
（PowerSummary／ItemSummaryTable／TicketEstimate／WarehouseEstimate）在 0 與空陣列輸入下的
渲染與版面是否可接受；放置設備後拖曳能否經 aaaaa 的 `commitDeviceMove` 進歷史，Ctrl+Z／
Ctrl+Y 能否正確回退與重做。

**數值正確性明確不在本格範圍**：props 是常值，沒有輸入可測（O2）。本格只回答「空資料下
會不會壞」與「拖曳有沒有進歷史」。

本格是 mbd 那批變更唯一的檢驗，沒有任何既有測試會先攔下問題（O7），所以觀察要記到「哪個
子區塊、什麼輸入、什麼現象」的粒度，不能只寫「渲染正常」。

**子格衍生指引**：本格是「主畫面互動面」的傘格。StatsPanel 接線、拖曳歷史語意、鍵盤
快捷等若要各自往下追，另開新格，本格加 `needs` 指向它們。

**沿革**

- H1 · 2026-08-10 決斷 —— 只測渲染與歷史，不測數值（使用者）
- H2 · 2026-08-10 落地 —— V6 拖曳與 undo／redo 路徑乾淨，無任何問題 → O13
- H3 · 2026-08-10 落地 —— 兩套統計面板職責重疊為本格最大發現 → O9
- H4 · 2026-08-10 決斷 —— 標完成而非部分完成：寬螢幕版面判斷本就不在本格範圍 → O14

### 3 引擎 preset 驗收：20 組全數對照 expected

- **state:** 完成
- **needs:** 0001#1
- **basis:** → O15

在 `/dev/flow-engine` 逐一跑 preset，對照每個 preset 自帶的 `expected` 條列逐條判通過或不
通過，不通過的記下實際觀測值。原訂抽樣 13 組：

- basic 全跑：H1 H2 H3 H4 H5 H6（滿速／瓶頸 50%／分流均分／環路標非法／懸空設備／多級串聯）
- advanced：H7 H8（入埠分接堵塞、匯流器反向堵塞）
- v7：G1 G3（氣態 pipe 合法鏈、belt↔pipe 媒質不符標非法）
- v9：swap-ore、swap-sand、xi-rang（E1 依輸入換配方、D1 最短鏈走 stable environment）

實際執行時因為判讀方式改成直接驅動 `loadPreset(id)` 讀 `result`、單組成本趨近於零，抽樣外
的 7 組一併補完，**20 組全跑且全過**（O16）。

**子格衍生指引**：本格是「FlowEngine 規則正確性」的傘格。任一 preset 不通過而需要追根因
時，該根因另開新格（一個根因一格，不是一個 preset 一格），本格加 `needs` 指向它們。

**沿革**

- H1 · 2026-08-10 決斷 —— 採抽樣而非全跑（使用者）
- H2 · 2026-08-10 修正 —— 原寫抽樣 12 組但實列 13 組、母體 20 非 22，正文改寫 → O15（取代 H1）
- H3 · 2026-08-10 落地 —— 20 組全跑全過，零失敗 → O16
- H4 · 2026-08-10 落地 —— 判定 O10：引擎無罪，根因在 editorStore 種子資料 → O17
- H5 · 2026-08-10 改題 —— 原題「引擎 preset 抽樣驗收：12 組對照 expected」，實際 20 組全跑，標題與事實不符

### 4 catalog 分頁與拓撲互動實測

- **state:** 完成
- **needs:** 0001#1
- **basis:** → O15、O14

同頁另兩個分頁與拓撲視覺化：「機器」分頁（MachineCatalogPanel）的 mode／port／tag 呈現是否
與 `src/data/machines.ts` 一致；「產品／材料」分頁（ProductCatalogPanel）的反向最短鏈、葉材料
清單、配方步數是否合理；拓撲 SVG 的節點效率上色、堵塞邊橘線、以及點選節點切換 mode 後
是否觸發重算。

判準比 0001#3 弱：這幾項沒有作者寫好的 expected，只能對照資料檔與常識判斷，記錄時要寫清楚
判準是自訂的。

**子格衍生指引**：本格是「dev 視覺化工具可信度」的傘格。catalog 與拓撲若各自有值得深追的
問題，分別開新格，本格加 `needs` 指向它們。

**沿革**

- H1 · 2026-08-10 落地 —— 資料一致性與拓撲上色三項皆過，未依賴截圖 → O20
- H2 · 2026-08-10 落地 —— 找到本輪唯一有根因的真缺陷，反向鏈 memo 守衛條件不足 → O21
- H3 · 2026-08-10 決斷 —— 不開子格：O21 已追到根因，剩下只有修不修，屬使用者決定 → O21

### 5 歷史回放頁實測：V6 拖曳錄製

- **state:** 完成
- **needs:** 0001#1
- **basis:** → O25、O27、O29

在 `/dev/history-replay` 驗 V6 的拖曳錄製與回放：拖曳是否被錄成 command、回放順序是否與
操作順序一致、undo／redo 與回放的互動是否自洽。與 0001#2 的差別是那邊測主畫面的真實操作
路徑，這邊測 dev 頁提供的錄製與檢視工具本身。

三問皆為是（O27）。該頁自帶的 M1–M4、M6 一鍵驗收全綠；M5 紅，但根因在驗收腳本本身而非
historyStore，引擎無罪（O26）。M5 兩項斷言都與堆疊對不上 —— 一項假紅、一項在旋轉未還原時
量測而恆過（O29）；此頁的 M5 結果目前不可作為 V6 行為的證據。M7 屬主畫布跟手，此頁無法
代替，由 O13 在 0001#2 涵蓋。

**子格衍生指引**：本格是「history 機制」的傘格。command 粒度、macro 合併、回放語意等子題
另開新格，本格加 `needs` 指向它們。

**沿革**

- H1 · 2026-08-10 落地 —— M1–M4、M6 全綠，M5 紅 → O25
- H2 · 2026-08-10 落地 —— 判定 M5 紅燈為假警報，根因在腳本 undo 次數少一 → O26
- H3 · 2026-08-10 落地 —— 回放順序與 undo／redo 往返位元相同，本格三問皆為是 → O27
- H4 · 2026-08-10 決斷 —— 不開子格：O26 已追到根因，O28 屬持久化策略非 history 語意，皆待使用者裁決 → O28
- H5 · 2026-08-10 修正 —— 核可時覆核 M5 全段，發現另一項斷言空過，正文改寫並移出 O26 → O29（取代 H2）

### 6 驗證頁現況確認：確認 alerts 恆 0 屬預期

- **state:** 完成
- **needs:** 0001#1
- **basis:** → O30、O33

在 `/dev/validation-test` 依頁面自附流程操作（新增設備 A → 新增重疊的 B → 新增不重疊的 C →
清空），確認 alerts 全程維持 0、errorCount／warningCount 維持 0、Editor Nodes 清單同步更新。

**這是符合現況的預期行為，不得記為 bug**（O3）。本格的產出是「確認空轉符合預期」以及頁面
說明文字與實際行為是否一致；真正的缺口交給 0001#7。

四步全數照表通過，空轉確實符合預期，且監聽鏈路本身是活的（O30）。第二項產出找到四處文字與
行為對不上，其中座標系那項與 O3 的兩套型別是同一件事在 UI 文案上的痕跡（O33）。順帶判定
dev 頁共用主畫面 store 是三頁通病而非個案（O32），並更正了 O28 的持久化認定（O31）。

**子格衍生指引**：本格是「驗證管線現況」的傘格。detector 補齊、型別接線等後續工作不在本格
展開，屬 0001#7 與 0001#8 的裁決結果。

**沿革**

- H1 · 2026-08-10 落地 —— 四步照表全過，alerts／error／warning 全程 0，監聽鏈路活著 → O30
- H2 · 2026-08-10 落地 —— 頁面文字與行為四處不一致，含座標系錯配 → O33
- H3 · 2026-08-10 落地 —— 判定 dev 頁共用 editorStore 為三頁通病，另記不併入 O28 → O32
- H4 · 2026-08-10 修正 —— 查證 store 無任何持久化，18 台是硬編種子，更正 O28 → O31

### 7 整合缺口清單（靜態盤點，不跑 UI）

- **state:** 完成
- **basis:** → O35、O36

不跑 UI、不改任何程式碼，把三方交界處的未接線項目盤成一份清單，每項寫明：現況、缺什麼、
接上去會動到哪些檔案、屬於哪一層的職責。

清單為 G1–G9 共九項，全數靜態查證，完整內容見 O35。原訂五項全部成立，其中 G2 的落點修正
（常值在 `StatsPanel/Index.vue` 而非 `MainLayout`）；新增四項：G4 座標單位不相通（獨立於 G3
的形狀不通，見 O34）、G7 `FactoryEdge` 沒有 waypoints、G8 註解型架構約定、G9 dev 頁共用
`editorStore`。adapter 要跨的四層落差與其中兩層的靜默失敗風險見 O36。

**本格只描述缺口，不提議修法** —— 修法屬 0001#8 的裁決。七題的可問性已在 O37 逐題判過。

**測試覆蓋缺口（O7）不併入本清單**：本格盤的是「三方交界處沒接起來」，覆蓋缺口是驗證強度
問題，兩者的判準與收斂方式都不同。O7 已完整記錄，需要時由使用者另開格承載。

**子格衍生指引**：本格是「整合缺口」的傘格。清單收斂後，使用者挑出要動手的缺口時，一個
缺口開一格，本格加 `needs` 指向它們，本格保留清單本身。

**沿革**

- H1 · 2026-08-10 決斷 —— 測試覆蓋缺口不併入本清單，維持「整合缺口」單一判準 → O7
- H2 · 2026-08-10 落地 —— 清單收斂為 G1–G9，原五項成立、G2 落點修正、新增四項 → O35
- H3 · 2026-08-10 決斷 —— G4 座標單位獨立於 G3 形狀不通，不併項（使用者）
- H4 · 2026-08-10 落地 —— adapter 四層落差查證，兩層會在執行期靜默失敗 → O36
- H5 · 2026-08-10 落地 —— 逐題判過 0001#8 七題的可問性，並提議補第八題 → O37

### 8 架構人工對答：七題逐題裁決

- **state:** 待決斷
- **needs:** 0001#7
- **basis:** → O2、O3、O5

一次丟一題，附程式碼證據與可選方案，由使用者決定或推翻；每題收斂後把結論寫成本計畫的
觀察，再問下一題。**不預設要改任何程式碼**。題目清單：

1. FlowChart 的層級歸屬：`Index.vue` 自持狀態與 `useVueFlow()`，是 L3 主元件還是誤置的 L2 容器
2. StatsPanel 誰餵資料：MainLayout 讀 store 往下傳，還是 StatsPanel 升格為容器層
3. 驗證層型別邊界：`shironesMachine` 收斂成主線型別，還是保留 adapter
4. detector 註冊點：模組自註冊與集中註冊，挑一種定案（O5）
5. `useValidation` → `useFlowEngine` 的順序耦合要不要用機制擋住，而非靠註解（O5）
6. dev 頁 preset 要不要抽成共用 fixture，讓手動實測與單元測試對同一份案例
7. `src/data` 是產物還是原始碼：生成腳本的權責，以及可不可以手改

**子格衍生指引**：本格是「架構定調」的傘格，也是本計畫最會長子格的一格。每一題收斂出的
決議若要落地成程式碼變更，該題另開新格承載（一題一格），本格加 `needs` 指向它，本格只
保留題目清單與各題的裁決結論。

**沿革**

- H1 · 2026-08-10 決斷 —— 加開本格，架構設計改由人工對答逐題確認（使用者）
