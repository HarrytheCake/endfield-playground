# W1011-T2 步驟 01：範圍與介面確認

狀態：已完成並驗證（2026-10-16）；本步僅確認契約，尚未實作手勢。

## 目標與檔案

以讀取與記錄確認最新基準及事件契約。本步不修改產品程式；更新本分析與索引中的決策紀錄。

## 執行順序

1. 執行 `git status --short --branch`、`git rev-parse --short HEAD`，與分析基準比對，列出已有變更。
2. 重讀最新 T2／週派工及 H2 接口；若本機新增 G2 的 DeviceShape，核對是否有可用拖曳狀態，不因新檔存在就整套掛載。
3. 搜尋 GridCanvas／LayoutView 呼叫端。目前主要為 LayoutView → GridCanvas、GridCanvas Story、MainLayout → LayoutView；確認後續變更沒有增加新的消費端。
4. 固定 `LayoutView` 的 `select-device: [id: string | null]` 契約，H2 在 MainLayout 保存選取。T2 不保證面板已顯示。
5. 固定 GridCanvas 的唯讀預覽 prop：建議 `deviceDragPreview = null | { deviceId, position }`；省略時維持現有顯示與 Story 相容。保留 cell-click(Position)，不在 GridCanvas 加 Pinia。
6. 固定手勢優先序：中鍵／平移工具優先；一般左鍵再分設備／空白；武裝落子僅在空白未拖動的 click 生效。記錄像素拖曳門檻，例如 4 px，並驗證不依 zoom 改變手感。
7. 固定無位移語意：未超過門檻視為點選；超過門檻但回原格不提交也不當點選。空白拖曳不清選取，空白點擊 emit null。
8. 記錄出界文件落差：保留現有 Error 與 action 契約；如驗收方要求出界拒絕，屬需求／L1 待裁，不能在 L2 旁路阻擋。
9. 確認取消、失去捕捉、卸載與重入的清理策略，及未來 C1 可插入埠命中的位置。

## 限制與驗收

- 不改 store、全域快捷鍵或 MainLayout；不額外建立 selection store。
- 座標只使用同一套 useGridViewport，不混入 canvasStore 的另一套 offset／zoom。
- 驗收：事件／prop、手勢矩陣、門檻、文件落差與禁止檔案均有明確紀錄；沒有以「已分析」宣稱功能已完成。

下一步：[步驟 02](./W1011-T2_step_02_gestures.md)。

## 執行結果與定稿契約

### 基準與呼叫端

- 分支 `dev/toby`，commit `464086b`，開始時工作樹乾淨；與分析基準相比只有前次提交的七份分析／步驟文件。本輪未更新遠端。
- 重新搜尋確認 MainLayout 掛載 LayoutView；GridCanvas 的產品呼叫端只有 LayoutView，另有 GridCanvas.stories.ts。其他 dev 檔案只有說明文字提及，沒有新增消費端。
- 本機未找到 DeviceShape 或 shapes 目錄下的可用元件，故步驟 03 採 GridCanvas 必要拿起狀態；實作前若有新交付再核對，仍不整套替換。
- GridCanvas 現有 props 為唯讀資料，cell-click(Position) 由 SVG click 產生；六個既有 Story 不必傳新增 prop。

### 定稿介面

| 介面 | 契約 |
| --- | --- |
| LayoutView emit | `select-device: [id: string | null]`；id 為 PlacedDevice.id，不是 machineType |
| GridCanvas prop | `deviceDragPreview?: { readonly deviceId: string; readonly position: Readonly<Position> } | null`；預設 null |
| 原事件 | 保留 cell-click(Position)，不改名稱、payload 或單獨 Story 的換算 fallback |
| 選取保存 | H2 在 MainLayout local ref 保存，本單不建立持久選取狀態 |
| 預覽保存 | LayoutView local ref；GridCanvas 只讀 prop，不改 devices 或 position |
| 顯示方式 | 預覽只替換同 ID 的設備顯示位置，標籤同步移動；null／未知 ID 不影響原圖 |

### 手勢矩陣

拖曳門檻固定為螢幕座標歐氏距離 **大於或等於 4 CSS px**，即平方距離 ≥16；不乘 zoom，不以是否跨格判斷。超過門檻後保持拖曳身分，不因回起點轉回點選。此數值是本步選定的實作參數，實際手感待步驟 04 驗收。

| 按下條件 | 未達門檻正常放開 | 達門檻後 |
| --- | --- | --- |
| 中鍵，或平移工具左鍵 | 不選取、不落子 | 延續原平移操作；這條明確平移路徑不需等待普通左鍵門檻 |
| 一般左鍵命中設備 | emit 設備 ID；抑制落子；不新增歷史 | 只更新本地設備預覽，正常放開且異格才提交 |
| 一般左鍵空白、未武裝 | emit null | 平移，不清選取、不落子 |
| 一般左鍵空白、已武裝 | emit null，維持原有 click 預檢／連續落子 | 平移，抑制落子 |
| 右鍵／其他按鍵 | 不啟動本單手勢 | 不啟動本單手勢 |
| 已有手勢時的其他 pointer | 忽略 | 忽略，不搶 capture |

命中以旋轉後佔格的 xy 投影比對；投影相交時由 devices 列表尾端往前找，對應 SVG 後繪製的設備優先。screenToCell 固定回 z=0，因此拖曳自行保留原設備 z，不拿回傳 z 篩掉其他層設備。新位置以起始設備位置加游標格差，不以游標格直接當設備左上角。

### 捕捉、取消與 click

- 原程式在容器捕捉 pointer，但 SVG 才訂閱 click；一般左鍵若無條件沿用容器 capture，可能使 click 改送容器而漏掉 GridCanvas 落子。因此一般左鍵必須保留 SVG click 路徑。
- 步驟 02 優先讓一般左鍵以來源 SVG 作為捕捉目標，並把捕捉元素存在本地手勢中；既有明確平移可維持容器捕捉。處理器仍在 LayoutView 接收冒泡事件，不讓 GridCanvas 消費 store。實際原生 click 的到達仍須於步驟 04 瀏覽器驗證，不能只測 synthetic click。
- 若按下來源不是可辨識 SVG，普通左鍵不啟動畫布手勢；不使用不安全型別斷言假設任意 target 皆為 SVG。
- 一般空白點擊只有在有效畫布內正常放開才清選取／允許落子；設備拖曳在捕捉後可於容器外放開，沿既有無邊界世界換算。
- pointerup 先套用最後座標，再決定是否提交；同格不呼叫 moveDevice。完成後先清有效手勢，再釋放捕捉，後續 lostpointercapture 不重複執行。
- pointercancel、非預期 lostpointercapture、卸載只清預覽與游標、釋放捕捉，不提交、不選取、不落子。保留該次 click 抑制，下一次有效左鍵按下才重設；不使用延遲計時猜測 click 順序。
- 未來 C1 在明確平移分支之後、設備命中之前插入埠命中；其輸入為連續格座標，本單不 import hitTestPortAt。

### 文件落差與禁止範圍

重新核對 moveDevice：內部直接 assessInvolving，而非呼叫匯出的 canMoveDevice；成功自行 execute Command，原位置也會進 history，故同格略過由 L2 負責。

出界仍是顯示 Error，不是本機 action 的拒絕條件。週派工「出界禁區」與現況的落差保留，不以 L2 新增拒絕條件掩蓋。禁止修改 layoutStore、placementCheck、editorStore、MainLayout，不接選取面板或新快捷鍵。

## 本步驗證紀錄

- 已逐項對照 T2、週派工、H2 與 LayoutView、GridCanvas、Story、useGridViewport、usePlacementIntent、toFootprint、moveDevice／canMoveDevice、portHitTest。
- 已搜尋確認呼叫端、無可用 DeviceShape、GridCanvas 無 Pinia；現有 editor 測試搜尋未找到 pointer／click／capture 互動案例，不將缺少測試誤列為功能通過。
- 本步驗證僅為契約、文件連結與 diff 範圍；未執行產品功能、type-check 或 Vitest，因本輪不修改程式碼。
- 步驟 01 完成；步驟 02–05 維持待執行。尚未提交本輪文件更新。
