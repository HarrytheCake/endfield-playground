# 0001_20260810_merge-verification-sweep

- **prev:** —
- **skill:** plan-history v3
- **status:** draft

## 主題簡述

`dev/dernoson` 目前已合入 mbd（PR #22，L3 元件）、aaaaa（PR #21，L1 引擎與資料 v3）、
shirone（驗證重疊偵測）三方的變更，但三者從未在同一棵樹上被人實際操作過一次。本計畫
把這次合流做一輪人工實測，產出兩樣東西：一份可對照的驗收結果，以及一份整合缺口清單。

三方的「可實測程度」差異極大（見 O2、O3、O4），所以本計畫不追求一致的驗收深度：aaaaa
是照 preset 自帶的 expected 逐條驗收，mbd 與 shirone 多半只能盤點缺口。

**本計畫的約束**

- 實測只走跑得起來的介面：主畫面 `/` 與 `/dev/*` 既有路由。**不建臨時 dev 頁、不動
  router、不寫新測試**。
- **發現問題只記錄，不修**。所有缺陷寫成觀察，收斂後由使用者決定哪些開成待辦。
- aaaaa 的 22 個 preset 採抽樣 12 個；抽樣外的不列為必做。
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

## 待辦

### 1 實測基準線：現有驗證套件的紅綠現況

- **state:** 待實作
- **basis:** → O1

在動任何實測之前跑一次 `validate-changes`（format → lint → type-check → test），把結果
完整記進觀察。目的不是修任何東西，是切開「合流前就存在的紅燈」與「這次實測發現的問題」——
沒有這條線，後面每一個異常都會爭論是不是本來就壞的。

若出現失敗，照記不修，並在觀察中標明失敗屬於哪一方的檔案範圍。

**子格衍生指引**：本格是「自動化驗證現況」的傘格。若跑出來的紅燈需要個別追查或修復，
每一項另開新格承載，本格加 `needs` 指向它們，本格只保留基準線本身的結論。

**沿革**

- H1 · 2026-08-10 決斷 —— 實測前先取基準線，避免既有紅燈被誤記為實測發現（使用者）

### 2 主畫面實測：StatsPanel 渲染與 V6 拖曳錄製

- **state:** 待實作
- **needs:** 0001#1
- **basis:** → O2

在 `/` 上驗三件事：頁面開得起來且 console 無 error；StatsPanel 四個子區塊
（PowerSummary／ItemSummaryTable／TicketEstimate／WarehouseEstimate）在 0 與空陣列輸入下的
渲染與版面是否可接受；放置設備後拖曳能否經 aaaaa 的 `commitDeviceMove` 進歷史，Ctrl+Z／
Ctrl+Y 能否正確回退與重做。

**數值正確性明確不在本格範圍**：props 是常值，沒有輸入可測（O2）。本格只回答「空資料下
會不會壞」與「拖曳有沒有進歷史」。

**子格衍生指引**：本格是「主畫面互動面」的傘格。StatsPanel 接線、拖曳歷史語意、鍵盤
快捷等若要各自往下追，另開新格，本格加 `needs` 指向它們。

**沿革**

- H1 · 2026-08-10 決斷 —— 只測渲染與歷史，不測數值（使用者）

### 3 引擎 preset 抽樣驗收：12 組對照 expected

- **state:** 待實作
- **needs:** 0001#1
- **basis:** → O4

在 `/dev/flow-engine` 逐一跑 12 個 preset，對照每個 preset 自帶的 `expected` 條列逐條判
通過或不通過，不通過的記下實際觀測值：

- basic 全跑：H1 H2 H3 H4 H5 H6（滿速／瓶頸 50%／分流均分／環路標非法／懸空設備／多級串聯）
- advanced：H7 H8（入埠分接堵塞、匯流器反向堵塞）
- v7：G1 G3（氣態 pipe 合法鏈、belt↔pipe 媒質不符標非法）
- v9：swap-ore、swap-sand、xi-rang（E1 依輸入換配方、D1 最短鏈走 stable environment）

抽樣外的 10 組（H9–H11、G2、L1、v9-no-sink、v9-missing-water）時間有餘再補，不列必做。

**子格衍生指引**：本格是「FlowEngine 規則正確性」的傘格。任一 preset 不通過而需要追根因
時，該根因另開新格（一個根因一格，不是一個 preset 一格），本格加 `needs` 指向它們。

**沿革**

- H1 · 2026-08-10 決斷 —— 採抽樣 12 組而非全部 22 組（使用者）

### 4 catalog 分頁與拓撲互動實測

- **state:** 待實作
- **needs:** 0001#1
- **basis:** → O4

同頁另兩個分頁與拓撲視覺化：「機器」分頁（MachineCatalogPanel）的 mode／port／tag 呈現是否
與 `src/data/machines.ts` 一致；「產品／材料」分頁（ProductCatalogPanel）的反向最短鏈、葉材料
清單、配方步數是否合理；拓撲 SVG 的節點效率上色、堵塞邊橘線、以及點選節點切換 mode 後
是否觸發重算。

判準比 0001#3 弱：這幾項沒有作者寫好的 expected，只能對照資料檔與常識判斷，記錄時要寫清楚
判準是自訂的。

**子格衍生指引**：本格是「dev 視覺化工具可信度」的傘格。catalog 與拓撲若各自有值得深追的
問題，分別開新格，本格加 `needs` 指向它們。

### 5 歷史回放頁實測：V6 拖曳錄製

- **state:** 待實作
- **needs:** 0001#1
- **basis:** → O4

在 `/dev/history-replay` 驗 V6 的拖曳錄製與回放：拖曳是否被錄成 command、回放順序是否與
操作順序一致、undo／redo 與回放的互動是否自洽。與 0001#2 的差別是那邊測主畫面的真實操作
路徑，這邊測 dev 頁提供的錄製與檢視工具本身。

**子格衍生指引**：本格是「history 機制」的傘格。command 粒度、macro 合併、回放語意等子題
另開新格，本格加 `needs` 指向它們。

### 6 驗證頁現況確認：確認 alerts 恆 0 屬預期

- **state:** 待實作
- **needs:** 0001#1
- **basis:** → O3

在 `/dev/validation-test` 依頁面自附流程操作（新增設備 A → 新增重疊的 B → 新增不重疊的 C →
清空），確認 alerts 全程維持 0、errorCount／warningCount 維持 0、Editor Nodes 清單同步更新。

**這是符合現況的預期行為，不得記為 bug**（O3）。本格的產出是「確認空轉符合預期」以及頁面
說明文字與實際行為是否一致；真正的缺口交給 0001#7。

**子格衍生指引**：本格是「驗證管線現況」的傘格。detector 補齊、型別接線等後續工作不在本格
展開，屬 0001#7 與 0001#8 的裁決結果。

### 7 整合缺口清單（靜態盤點，不跑 UI）

- **state:** 待實作
- **basis:** → O2、O3

不跑 UI、不改任何程式碼，把三方交界處的未接線項目盤成一份清單，每項寫明：現況、缺什麼、
接上去會動到哪些檔案、屬於哪一層的職責。已知四項：

1. FlowChart 六元件零引用、無路由（O2）
2. StatsPanel 四個子元件 props 全為常值（O2）
3. `detectOverlaps` 未註冊成 Detector，且 `shironesMachine` 與主線 `FactoryNode` 型別不相容（O3）
4. `rewritePipelineStructure` 產品程式碼零引用（O3）

實測過程若發現新缺口，追加進本清單。**本格只描述缺口，不提議修法** —— 修法屬 0001#8 的裁決。

**子格衍生指引**：本格是「整合缺口」的傘格。清單收斂後，使用者挑出要動手的缺口時，一個
缺口開一格，本格加 `needs` 指向它們，本格保留清單本身。

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
