# W1018-T1：連線路徑幾何移出 LayoutView 分析

日期：2026-10-28。原分析及介面草案如下；後續已依使用者授權完成修改，結果見 [驗證紀錄](./W1018-T1_connection_waypoints_verification.md)。

## 需求與依據

將 LayoutView.connectionCandidate 的單轉角與空隙雙轉角計算抽至 `src/utils/layout/` 的純函式。輸入兩端錨點及設備範圍，回傳 waypoints，LayoutView 僅映射資料、呼叫函式、串接既有語意與碰撞預檢。新增對應單元測試，不在元件內保留選軸、空隙中線或折點座標公式。

依據 [C3 §4.3](../../../roadmap/detail/C3_pipeline_polyline_render.md#43-幾何計算放哪裡)：

> 純函式，不在元件內：

C3 的 `buildPipelinePath(from, to) → Point[]` 是架構方向；本次依使用者指定放在 `src/utils/layout/`，並加入現有空隙路徑需要的設備範圍。不改舊 Vue Flow 元件、不掛載 PipelineShape，也不引入自動避障。

## 工作基準與既有變更

目前為 dev/toby，rebase 後 HEAD 為 a9e3209。工作目錄已有上一項 L1 旋轉修正及文件，尚未提交；本分析不覆寫或撤銷它們。

本次抽離由使用者明確指定，允許新增純幾何 utility 與對應測試；這不是補寫 store action。仍遵守 [CLAUDE.md §5](../../claude/CLAUDE.md)：不修改 layoutStore／historyStore，不在 L2 建立 Command。缺少 store action 時仍先回報維護者。

## 現行資料流與抽離範圍

1. LayoutView 透過來源 PortRef 與命中目標取得 collectPortAnchors 的外側整數格錨點；視覺埠邊心不作為儲存端點。
2. 依媒質映射固定 z：belt 為 0，pipe 為 1。
3. connectionCandidate 內直接組路徑：同 x 或同 y 時兩點直連；其餘情況依來源 side 決定先走水平或垂直，產生一個轉角。
4. 呼叫 canConnect，確認方向、媒質、佔用、自連與完整 PortRef 身分，再呼叫 assessInvolving 預檢碰撞。
5. 僅當衝突全部限於候選線與來源／目標設備時，才嘗試空隙雙轉角；其他設備或既有管線造成的衝突不觸發改道。
6. 兩端為 top／bottom 時使用設備之間的水平空隙，固定取中央整數格 laneX；兩端為 left／right 時使用垂直空隙的 laneY。空隙至少一格，無空隙則沒有替代路徑。
7. 替代路徑仍由 assessInvolving 檢查；成功才取代原路徑，否則保留原候選及原失敗結果。

應移出：第 3、6 點的選軸、間距、取整與折點生成。應保留於 L2 的協調：端點查詢、媒質層映射、設備資料映射、候選 id／media、預檢呼叫、選用已通過預檢的候選與 UI 回饋。預檢規則本身沿用既有 L1 工具，不在 L2 重寫。

`connectionDeviceBounds` 可保留為 store／機型到純資料的映射：透過既有 resolveDisplayGrid 取得旋轉後尺寸，輸出含邊界的 left／right／top／bottom。不得在此加入空隙選擇或繞路計算。

## 建議純函式介面

新增 `src/utils/layout/connectionWaypoints.ts`，使用具名匯出，分別回傳 waypoints，不把碰撞結果或 UI 提示混入幾何回傳值：

```ts
type ConnectionAnchor = {
    readonly position: Readonly<Position>;
    readonly side: PortSide;
};

type ConnectionDeviceBounds = {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
};

buildConnectionWaypoints(
    source: ConnectionAnchor,
    target: ConnectionAnchor,
): Position[];

buildGapConnectionWaypoints(
    source: ConnectionAnchor,
    target: ConnectionAnchor,
    sourceBounds: ConnectionDeviceBounds,
    targetBounds: ConnectionDeviceBounds,
): Position[] | null;
```

以上為介面草案，尚非實作。兩個函式分別涵蓋既有兩階段路徑生成，避免為維持碰撞後才嘗試空隙的順序，反而讓 utility 接收 store、碰撞 callback 或 UI 狀態。

介面契約：

- 使用既有 Position 與 PortSide 型別；目前 collectPortAnchors 輸出只有 x／y 與 ref，L2 須將其與命中資料的 side、固定 z 映射為純輸入，不修改共享錨點索引型別。
- 前提是既有流程提供有效的整數格座標、旋轉後設備範圍及同一 z。utility 不負責媒質層推導、設備查詢或語意驗證。
- 第一函式保留同格兩端與既有零長度段行為，不順便簡化或去重。
- 第二函式僅生成對應方向的固定空隙路徑；不支援的 side 組合或沒有至少一格空隙時回 null。
- 固定以 Math.floor 取中線，包含負座標，不改為四捨五入。
- 每次回傳新陣列及新 Position 物件，不修改或保留可寫的輸入參考。
- 不 import Vue、Pinia、store、機型資料庫、DOM 或隨機／時間來源；相同輸入產生相同輸出。
- 設備範圍只有來源與目標，不包含第三台設備、其他線或全域障礙圖，因此回傳路徑不代表一定可提交。

## 與既有工具的關係

`buildPipelinePolyline` 接收已存在的 waypoints，輸出 segments／corners／valid，沒有由兩端產生路徑的能力；不應為本次需求改寫該工具。可在測試中搭配它或 isAxisAlignedPath 檢查生成結果。

C3 §4.2 的完整方向矩陣要求兩端方向共同決定 L／Z 形；目前一般單轉角主要依來源 side 決定，只有空隙路徑才同時使用兩端 side。本次採保留既有行為的抽離，不宣稱已完成整份 C3。若要改為完整方向矩陣，應另列行為變更與驗收，避免抽離時改變目前可連線的路徑。

## 預計檔案

| 動作 | 檔案 | 範圍 |
| --- | --- | --- |
| 新增 | src/utils/layout/connectionWaypoints.ts | 純型別與單轉角／空隙雙轉角生成函式 |
| 新增 | src/__tests__/utils/layout/connectionWaypoints.test.ts | 幾何結果、邊界、純度與相容行為 |
| 修改 | src/editor/layout/LayoutView.vue | 改為呼叫函式，刪除元件內的路徑計算公式 |
| 更新 | docs/toby/dev/1028 下的執行／驗證文件 | 實際結果；目前僅有本分析 |

不修改 layoutStore.ts、layoutStore.rotation.test.ts、共享埠定位與連線規則、GridCanvas.stories.ts 或 WarningIcon 本體。

## 單元測試規劃

新增測試應直接餵純資料，不啟動 Vue 或 Pinia，不使用圖片或 JSON fixture。

| 類別 | 案例與主要斷言 |
| --- | --- |
| 直線 | 同 x／同 y、正向／反向、同格；端點順序正確，同格保留兩端 |
| 單轉角 | left／right 先水平，top／bottom 先垂直；四象限座標；預期折點符合既有公式 |
| 水平空隙 | top／bottom 同軸組合、來源在左／右；折點落於相同中央 laneX |
| 垂直空隙 | left／right 同軸組合、來源在上／下；折點落於相同中央 laneY |
| 間距邊界 | 一格空隙可用；設備緊鄰、範圍交疊或包含時回 null |
| 中線取整 | 奇偶空隙、負座標；確認 Math.floor，交換來源目標仍選同一通道 |
| 不支援方向 | 一端水平、一端垂直時，不生成空隙雙轉角 |
| z 與端點 | z=0／1 全線固定；輸出起訖與輸入一致，不混入視覺半格座標 |
| 退化路徑 | 相同錨點或折點重複保持原行為，不擅自去重 |
| 純度 | 凍結輸入仍能執行；呼叫前後輸入不變；更改輸出不影響輸入或其他次輸出 |
| 路徑不變量 | 各有效案例至少兩點，逐段軸對齊，所有點同層，座標為整數 |

不讓純函式測試斷言 canConnect 或障礙碰撞規則；它們有各自測試。仍需對 L2 串接驗證：撞第三台設備／既有線不觸發空隙替代、替代路徑撞障礙仍拒絕、無可用空隙保留原失敗候選。

## 建議執行與驗證順序

1. 再次確認工作目錄與既有旋轉修正，紀錄本次基準，整理現有路徑的代表性座標作為相容驗收。
2. 新增純函式與有意義的單元測試，繁體中文 JSDoc 涵蓋參數、回傳值、範圍成員、前提與範例；先跑針對性的幾何測試。
3. LayoutView 改呼叫兩個函式，保留原有語意預檢、PortRef 比對、碰撞 gating 與提交順序；檢視元件中已無折點或 laneX／laneY 計算。
4. 驗證直線、單轉角、水平／垂直空隙、相反方位、無空隙、第三台設備／既有線障礙，以及預覽與實際提交 waypoints 一致；旋轉後範圍映射與 pipe 固定層維持正確。
5. 依 validate-changes 順序執行 format、lint、type-check、test，前項失敗即停；記錄實際結果，不沿用上一項旋轉任務的測試數量宣稱本次完成。
6. 檢查最終差異、文件連結、L1 store 零差異及既有旋轉修正未被覆蓋。清理暫時驗證腳本，不建立演示頁或圖片／JSON 報告；提交與推送依後續指示。

## 本次結果

分析階段僅新增本文件；後續修改已完成，純函式及 51 項單元測試已交付，LayoutView 改為呼叫純函式，11 組正式頁驗證及完整品質檢查通過。既有旋轉變更保留，尚未提交或推送；詳細證據見上述驗證紀錄。
