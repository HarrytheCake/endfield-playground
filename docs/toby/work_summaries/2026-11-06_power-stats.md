# 總耗電量／供電量統計工作摘要

## 完成狀態

- 工作日期：2026-11-05 至 2026-11-06，Asia/Taipei。
- 狀態：**總耗電量／供電量統計完成**；右欄為唯讀顯示，沒有手動供電輸入。
- 最終需求：耗電統計所有已擺放設備；供電同樣依設備資料計算，沒有資料顯示 0。
- 相關文件：[分析](../dev/1105/W1105_power_analysis.md)、[步驟索引](../dev/1105/W1105_power_steps.md)、[操作驗收與已知問題](../dev/1105/W1105_power_step_04_verification.md)。
- 前輪工作：[產能估算與正式配方摘要](./2026-11-05_W1102-T1_stats-panel.md)，已提交於 `c5584d7`；本摘要記錄其後的電力統計變更。

## 最終行為

畫布上的設備逐台計入額定電力，不依連線、素材設定、供料速率、產能效率或鏈路有效性篩選。即使設備因驗證錯誤未進入有效流量圖，仍計入電力統計。

| 設備 power | 計算方式 |
| --- | --- |
| 有限正值 | 加入總耗電量 |
| 有限負值，且不等於 -1 | 取絕對值加入總供電量 |
| 0、-1 未定義值、非有限數值或查不到設備 | 不增加耗電或供電 |

耗電與供電獨立加總，不以產電抵扣耗電。單位為 kW；例如粉碎機 5 kW 加塑型機 10 kW，總耗電為 15 kW。

正式右欄保留「總耗電量/供電量」，顯示如「5 kW / 0 kW」；空畫布為「0 kW / 0 kW」。展示元件收到 power 但缺少 total 時供電顯示 0；整份 power 未傳入的獨立預覽仍保留既有 `-`。

目前正式設備資料沒有有效產電數值：唯一負值是氣體散布機的 -1 未定義值，供電樁與熱能池的 power 都為 0，因此正式供電結果目前為 0。未填造發電量或修改設備主資料。

## 資料來源

下表列出執行時來源與原始定義；列為來源不代表該檔案有修改。

| 資料 | 來源檔案 | 用途或產生方式 |
| --- | --- | --- |
| 已擺放設備集合與 machineType | [layoutStore.ts](../../../src/store/layoutStore.ts) | 正式畫布 devices，透過既有高階 action 更新 |
| 引擎完整輸入節點 | [toTopology.ts](../../../src/utils/layout/toTopology.ts) | 將全部 devices 映射為 nodes，不先依有效鏈路篩選 |
| 設備額定 power | [machines.ts](../../../src/data/machines.ts) | 引擎使用 resolveMachineDef 查詢設備定義 |
| 設備原始資料 | [machines.json](../../aaaaa/data/machines.json) | 額定 power 的原始來源；本輪未修改 |
| 設備資料生成器 | [generate-src-data.mjs](../../aaaaa/scripts/generate-src-data.mjs) | 由原始 JSON 產生正式資料，指令為 pnpm generate:src-data；本輪未改生成器 |
| power 正負值與 -1 的意義 | [machine.ts](../../../src/types/machine.ts) | 既有契約：正值耗電、負值產電、-1 未定義；本輪未修改此型別 |
| 耗電與供電加總 | [useFlowEngine.ts](../../../src/composables/useFlowEngine.ts) | 遍歷完整 nodes，分別計算 demand／supply |
| 電力結果與初始狀態 | [flowStore.ts](../../../src/store/flowStore.ts)、[flow.ts](../../../src/types/flow.ts) | totalPowerDemand／totalPowerSupply，初始及 reset 為 0 |
| 右欄展示資料 | [ProductionStats.vue](../../../src/editor/stats/ProductionStats.vue) | 將結果映射為 PowerData.used／total |

先前曾依 [CR-10 規格](../../../spec/10_power_calculation.md) 實作自訂供電、未設定為無限。使用者後續要求唯讀顯示，並明確指定「供電量也進行計算 如果沒資料顯示0」，因此最終採上述設備計算規則，取代手動上限與無限供電預設；舊步驟中的相關內容只保留歷史紀錄。

## 修改檔案與結果

| 檔案 | 最終變更 |
| --- | --- |
| [useFlowEngine.ts](../../../src/composables/useFlowEngine.ts) | 電力統計改讀全部輸入 nodes；正值耗電、負值產電，排除 -1 與非有限值。沿用既有 150ms 排程與 applyResult，不改配方、流量或效率演算法 |
| [flowStore.ts](../../../src/store/flowStore.ts) | 更新電力欄位註解；供電初始與重置為 0，沒有新增供電設定 API |
| [flow.ts](../../../src/types/flow.ts) | 更新結果欄位語義，保留既有 number 契約 |
| [ProductionStats.vue](../../../src/editor/stats/ProductionStats.vue) | 將引擎耗電／供電結果傳入 overview；舊 Inspector 亦以唯讀配對呈現，不在 L2 重算設備電力 |
| [StatsPanel/types.ts](../../../src/app/StatsPanel/types.ts) | PowerData 保留 used 與可選 total，移除設定輸入及比例欄位 |
| [ResultPanel.vue](../../../src/app/StatsPanel/ResultPanel.vue) | 顯示耗電／供電數字，缺供電資料為 0；移除手動輸入、比例條、無限供電文案及不足提示，維持 props-only |
| [Index.stories.ts](../../../src/app/StatsPanel/Index.stories.ts) | 調整高耗電與零耗電案例及斷言，驗證唯讀數字與無輸入欄位；最終 13 個 Story |
| [layoutFlowWiring.test.ts](../test/layoutFlowWiring.test.ts) | 在前輪 8 案整合測試上增加 4 案耗電與 1 案產電，最終本檔 13 案；既有清空／斷線案例補上電力斷言 |
| [分析及執行文件](../dev/1105/W1105_power_steps.md) | 保存步驟 01–04、需求澄清、驗證證據及 Delete 暫不處理的決定 |

供電測試僅以測試替身模擬兩台 power=-125.5 的設備，驗證供電 251 → 125.5 → 0 kW，並確認耗電獨立為 5 kW、驗證排除的設備仍計入、-1 不被誤算。模擬值不是正式熱能池數據，未寫入 machines.ts 或原始 JSON。

## 驗證結果

| 項目 | 結果與範圍 |
| --- | --- |
| pnpm type-check／lint-check／format-check | 全部通過 |
| pnpm test | 59 個測試檔、1,045 案通過 |
| 相關引擎接線及 store 測試 | 2 檔、34 案通過 |
| pnpm exec prettier --check docs/toby/test/ | 通過，補足既有格式指令未涵蓋的目錄 |
| pnpm build-storybook | 通過；既有重名元件、Browserslist、chunk 大小與 plugin timing 警告保留 |
| Storybook 瀏覽器檢查 | 13 個 Story／9 個 play 通過；高耗電 350 kW / 180 kW、缺供電資料 0 kW / 0 kW，均無手動輸入 |
| Controls／Accessibility | hasDevices 切換正常；ConnectedProduction 分頁顯示 0 violations／11 passes，其他既有產耗配色與 Tips 問題見步驟 04，不宣稱全介面零違規 |
| 正式頁回歸 | 快照切換後耗電 0 → 5 → 15 → 5 → 0 kW，正式供電皆為 0；30 → 15/min 產能更新與手動收合、配方及模式正常 |
| 原生操作 | 工具列放置、設備拖曳／旋轉、埠拖曳連線、素材清除／恢復、復原／重做通過；設備快照、L1 刪除與原生操作證據分別記錄，不混為同一驗收 |
| git diff --check | 通過 |

目前環境沒有提供 validate-changes skill，四項品質檢查以指令手動執行。docs 測試被既有 ESLint ignore 略過，不宣稱 lint-check 涵蓋該目錄；型別、格式及執行結果均已驗證。未產生截圖或 JSON 報告。

## 已知問題與範圍

Delete 依使用者指示**只記錄、暫不處理**：正式畫布的單選由 MainLayout.selectedDeviceId 保存，但 [useShortcuts.ts](../../../src/composables/useShortcuts.ts) 的 Delete 讀取 selectionStore 並呼叫舊 editorStore.removeDevices。實測選取塑型機後按 Delete，設備未被移除。呼叫 layoutStore.removeDevice 後耗電及原生 undo/redo 正常，不能據此把原生 Delete 標為通過。

此已知問題不阻擋本輪電力工作結案。W004／W005 detector、供電覆蓋、燃料發電模擬與警示導覽未實作；沒有手動供電上限、設定持久化或各基地獨立供電設定。

## 提交狀態

本次交付包含電力統計、相關測試、分析／驗收文件及本摘要。依使用者指示，提交分支為 dev/toby，推送目標為 origin/dev/toby；前輪基準為 c5584d7。本次不建立 PR，實際提交與推送結果以 Git 紀錄為準。
