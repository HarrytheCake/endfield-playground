# 電力統計步驟 03：正式供電規則與計算

狀態：**設備供電計算完成（2026-11-06），不提供手動輸入**。使用者最新要求「供電量也進行計算 如果沒資料顯示0」；依 Machine.power 的負值產電契約加總，排除 -1，缺資料為 0，取代先前 Infinity／無限供電預設。下列自訂輸入內容為歷史，現行供電計算規則與證據見本文件最後一節。

## 目標與前置資訊

將引擎固定的 `totalPowerSupply: 0` 替換為有正式來源的設定。執行時擴查 `spec/`，發現前輪分析漏讀 `spec/10_power_calculation.md` §2.2 與 `spec/00_top_spec.md`：**總供電量由使用者自訂；未設定時視為無限供電**。`docs/dernoson/plan-history/0013_20260811_cr10-power-calculation.md` 的「總供電量設定」亦有相同決議。

因此撤回先前「必須取得發電設備額定 kW／燃料規則才可完成總供電量」的前提；本步採現有正式規格，不新增熱能池發電公式。耗電範圍與規格中的覆蓋範圍條件有差異，依使用者較新的明確指示，仍計算畫布上全部設備的額定耗電，不實作覆蓋範圍篩選。

## 實際修改與資料責任

| 檔案 | 實作結果 |
| --- | --- |
| `src/store/flowStore.ts` | 新增 powerSupplyLimit 與 setPowerSupplyLimit；null 代表未設定，0 是明確零供電。totalPowerSupply 初始及結果重置採設定值或 Infinity；reset 不清設定 |
| `src/composables/useFlowEngine.ts` | 引擎輸出設定值或 Infinity，設定變更加入原有單一 150ms 排程，不新增 watcher，不讓不足阻擋流量 |
| `src/types/flow.ts` | 更新供電欄位語義；既有 number 結果契約保留，以 Infinity 表示無限 |
| `src/editor/stats/ProductionStats.vue` | 映射引擎結果及設定原值，接收 set-power-supply 事件呼叫 L1 action；正式頁取消 supplyPending；舊 Inspector 同步將 Infinity 顯示為無限供電 |
| `src/app/StatsPanel/types.ts` | 增加可選 editableSupply 與 supplyLimit 展示欄位，註明 Infinity 契約；保留待確認展示案例的相容欄位 |
| `src/app/StatsPanel/Index.vue` | 純轉送供電設定事件 |
| `src/app/StatsPanel/ResultPanel.vue` | Nuxt UI 數字輸入框，失焦或 Enter 提交；空白為無限、負值／非法值還原。無限供電顯示文案且比例為 0，不顯示 Infinity／NaN 或不足 |
| `src/app/StatsPanel/Index.stories.ts` | 新增 EditableSupplyPower，透過 props／事件模擬 L2，驗證 10／20／0／清空與不足狀態 |
| `docs/toby/test/layoutFlowWiring.test.ts` | 新增 5 案，含設定觸發重算、0 與 null 區別、reset／清空保留設定、非法值防護及不足仍保有 30/min 產能 |
| `src/__tests__/store/flowStore.test.ts` | 僅更新既有初始供電與盈餘預期為 Infinity，新增測試仍放 docs/toby/test |

供電設定目前為本產線在目前 session 的共用設定，與既有調度券／倉庫偏好一樣不寫入 layout history、不持久化；切換基地選擇或清空／載入設備不會自動刪除設定。沒有新增各基地獨立供電表。Infinity 僅為記憶體內的衍生結果，設定原值使用 null；未新增供電設定匯出功能。

## 實際驗證

- `pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test` 通過；59 檔／1,049 案。相關兩檔 38 案亦通過。`pnpm exec prettier --check docs/toby/test/` 通過。
- 首輪瀏覽器測試發現 Nuxt UI type=number 會回傳 number，對模型直接 trim 會失敗；已明確接受 string／number，提交前轉為字串。修正後重新執行該元件格式／lint、type-check、Storybook 建置與瀏覽器驗證通過。
- `pnpm build-storybook` 通過，既有重名元件、Browserslist／chunk／plugin timing 警告未在本步處理。
- 16 個 Story／10 個 play 通過，包含供電輸入從無限 → 10 → 20 → 0 → 無限。新增 EditableSupplyPower 的 axe 為零違規；既有產耗配色與 Tips 限制與步驟 02 相同。
- 實際開啟 Storybook manager，Controls 的 hasDevices true → false → true 正常；ConnectedProduction 的 Accessibility 分頁顯示 0 violations／11 passes。
- 正式頁透過 layout 快照載入確認耗電 0 → 5 → 15 → 5 → 0；再以真實瀏覽器鍵盤輸入 3、10、0、清空，5 kW 需求分別顯示不足、正常、不足、無限供電。沒有瀏覽器執行錯誤。
- 正式連線仍產出 30/min，改成 15/min 後保留手動收合；配方卡與機器模式驗證通過。設備操作使用快照注入，不宣稱已完成原生放置／刪除及 undo/redo 驗收。

## 完成範圍與下一步

總供電量來自使用者輸入，語義來自 CR-10 正式規格；耗電數值仍來自 `src/data/machines.ts`，原始來源為 `docs/aaaaa/data/machines.json`。未修改 machines 原始資料、型別或生成器，也未把 -1 當發電。刪除設備改變耗電，不移除使用者設定的供電上限。

總量設定與比較已完成；W004／W005 detector、覆蓋幾何、畫布高亮及警示導覽仍未實作。下一步為步驟 04 的原生操作驗收與交付。本輪尚未提交、push 或建立 PR；未產生截圖或 JSON 報告。

## 2026-11-06 最新實作：依設備計算供電，沒有資料顯示 0

使用者最新指示優先於舊 CR-10 的無限供電預設。本輪不恢復手動上限輸入，改用 `src/types/machine.ts` 的既有 power 契約：正值耗電、負值產電、-1 資料未定義。

`src/composables/useFlowEngine.ts` 遍歷全部輸入 nodes，同時獨立加總 totalPowerDemand 與 totalPowerSupply：有限正值加到耗電，有限負值且不等於 -1 時取絕對值加到供電。未知設備、0、-1 與非有限數值不增加供電；不依鏈路有效性或效率篩選，不用負值抵扣需求。

資料來自 `src/data/machines.ts`，原始 `docs/aaaaa/data/machines.json`，沒有手改生成檔。現有唯一負值為氣體散布機的 power=-1；供電樁與熱能池目前皆 0，因此現有正式設備供電結果為 0。未自行填入發電量或燃料換算。

`src/store/flowStore.ts` 初始及 reset 的供電為 0；`src/types/flow.ts` 同步欄位語義。ProductionStats 繼續映射引擎結果；ResultPanel 的 total 缺省、負值或非有限值以 0 展示，不再顯示無限供電。完整 power 未提供的獨立元件預覽仍保留既有 `-`。

新增 `docs/toby/test/layoutFlowWiring.test.ts` 案例，僅以測試替身把熱能池 power 模擬為 -125.5，驗證兩台 251 kW、刪除一台 125.5 kW、清空 0 kW；同時確保需求仍獨立為 5 kW、驗證排除設備仍計入、-1 不被誤算。這些數字是測試資料，不是正式熱能池數據。

相關兩檔 34 案、完整 59 檔／1,045 案及四項品質指令通過；Toby 測試格式與 Storybook 建置通過。最新正式頁驗證 0 kW / 0 kW、5 kW / 0 kW，沒有輸入欄位，30 → 15/min 與配方回歸正常。完整呈現證據見步驟 04 最後一節。
