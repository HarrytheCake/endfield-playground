# 電力統計分析：總耗電量／供電量（唯讀）

日期：2026-11-05；需求與驗收更新至 2026-11-06。狀態：使用者澄清「需要是總耗電量/供電量」，本輪保留耗電／供電唯讀顯示，不提供手動上限輸入。最新指示「供電量也進行計算 如果沒資料顯示0」，已改為依設備 power 負值計算供電，沒有資料為 0，取代先前的無限供電預設。Delete 依「delete先不處理 紀錄為主」指示保留已知問題，不納入修正。

## 最終需求

- 總耗電量統計畫布上所有已擺放設備的額定 power，包含未連線、未設定素材、缺料與鏈路無效的設備，不依產能效率折算。
- 相同設備逐台累加；僅計正值 power，0、-1 未定義值及未知機型不增加耗電。
- 供電以全部已擺放設備的有限負值 power 取絕對值加總，排除 -1 未定義值。正值只計耗電、負值只計供電，兩者不互相抵扣；沒有資料顯示 0。
- 正式右欄顯示「總耗電量/供電量」，例如「5 kW / 0 kW」。未傳入整份 power 的獨立預覽保留 `-`；已有 power 但缺 total 時供電為 0。
- 移除手動總供電輸入、負載比例條及供電不足提示；供電仍保留唯讀顯示，不填造發電設備額定數據或實作燃料換算。
- 產能摘要、配方與展開／收合維持既有行為，L3 仍只接 props。

## 資料來源與架構

| 檔案 | 用途 |
| --- | --- |
| `src/store/layoutStore.ts` | 正式畫布全部已擺放設備 |
| `src/data/machines.ts` | 設備額定 power，粉碎機 5 kW、塑型機 10 kW |
| `docs/aaaaa/data/machines.json` | 額定設備資料的原始來源 |
| `docs/aaaaa/scripts/generate-src-data.mjs` | 產生正式資料；本輪未改設備資料或生成器 |
| `src/types/machine.ts` | power 的正式契約：正值耗電、負值產電、-1 未定義 |
| `src/utils/layout/toTopology.ts` | 全部 devices 轉成引擎 nodes，不依鏈路先篩選 |
| `src/composables/useFlowEngine.ts` | 遍歷完整輸入 nodes，正值加總耗電、負值絕對值加總供電（排除 -1），保留 150ms 排程 |
| `src/store/flowStore.ts`、`src/types/flow.ts` | 保存 totalPowerDemand 與結果契約；totalPowerSupply 為設備額定產電加總，初始／重置為 0 |
| `src/editor/stats/ProductionStats.vue` | 映射 totalPowerDemand／totalPowerSupply 為 PowerData.used／total，總覽及舊 Inspector 均以唯讀呈現 |
| `src/app/StatsPanel/types.ts` | PowerData 保留 used 與可選 total；設定輸入欄位與事件已移除 |
| `src/app/StatsPanel/Index.vue`、`ResultPanel.vue` | 透過 props 呈現耗電／供電，不讀取 store |
| `src/app/StatsPanel/Index.stories.ts` | 13 個 Story，包含高耗電、零耗電與產能回歸 |
| `docs/toby/test/layoutFlowWiring.test.ts` | 正式來源、額定耗電／產電、斷線／清空與舊入口相容測試 |

資料流：`layoutStore → toTopology → useFlowEngine → flowStore（totalPowerDemand／totalPowerSupply）→ ProductionStats → StatsPanel → ResultPanel`。

引擎不以 graph 的 isValid 決定是否計入耗電或供電，包含 blocking error 排除於 graph 外的設備。沒有新增計算 watcher、雙寫 editorStore 或改變產能演算法。

## 需求演進與已撤回範圍

原始分析與步驟 02、03 曾包含總供電量。步驟 03 補讀 `spec/10_power_calculation.md` §2.2 與 `spec/00_top_spec.md`，依規格實作使用者自訂供電、未設定為無限。使用者於 2026-11-06 先表示不需要總供電量，隨後澄清「需要是總耗電量/供電量」。已撤回手動上限設定實作，但保留供電唯讀顯示；先前只保留耗電的解讀已更正，舊步驟紀錄保存演進。

已移除 powerSupplyLimit／setPowerSupplyLimit、相關引擎監聽來源、展示欄位與事件、3 個供電 Story 及 5 個供電測試。總耗電接線及額定設備統計保留。既有 flowStore 供電結果欄位保留並傳到面板；最新依使用者指示以設備產電數據計算，缺資料顯示 0，不再採 Infinity。

## 最終驗證與限制

四項品質檢查通過：type-check、lint-check、format-check、test；Vitest 為 59 檔／1,045 案。Toby 測試格式檢查及 Storybook 建置通過。13 個 Story／9 個 play 通過，Controls 與 Accessibility 分頁已檢查；既有產耗配色與 Tips 的 axe 限制仍在，不宣稱全介面無障礙完成。

正式頁確認耗電依設備集合變更為 0 → 5 → 15 → 5 → 0 kW，有耗電／供電唯讀標題與數字，沒有手動輸入或比例條，現有正式資料供電皆為 0；30 → 15/min 產能刷新保留手動收合，正式配方卡與模式檢查通過。

供電測試僅用測試替身模擬兩台 power=-125.5 的設備，驗證 251 → 125.5 → 0 kW，不修改正式設備定義。現有 machines.ts 的唯一負值是氣體散布機的 -1 未定義值，因此正式供電為 0，不把測試數值當正式資料。

原生放置、移動、旋轉、連線、素材清除／恢復與復原重做證據見步驟 04。Delete 仍走舊 editorStore，測試未通過，但依使用者指示只記錄、暫不處理。W004／W005、供電覆蓋、供電設定及持久化不在最終需求範圍。

[分步索引](./W1105_power_steps.md) 與步驟文件保存執行演進。本輪基準為 `dev/toby` 的 `c5584d7`；本次交付依使用者指示提交並推送至 origin/dev/toby，不建立 PR，實際結果以 Git 紀錄為準。各步驟的未提交敘述保留為當時執行歷史。
