# W1102-T1 分析摘要

日期：2026-11-05。狀態：步驟 01–03 完成。使用者已允許最小接線方案；資料接線、空狀態、一位小數與 Story 完成，四項品質檢查、1,040 案測試及 Storybook 建置通過。13 個 Story 瀏覽器驗證完成；配色與 Tips 的 axe 限制已記錄，正式主畫面操作驗收留在步驟 04。

## 依據與基準

- [開發守則](../../claude/AGENTS.md)，尤其 A.1、A.6、A.11。
- [本週工單](../../../work_dispatch/toby/1102/W1102-T1_stats_panel.md)。
- [週派工 v1.2](../../../work_dispatch/WEEK_20261102.md)，包含 MainLayout 凍結與引擎唯讀限制。
- [D1 規格](../../../roadmap/detail/D1_stats_item_summary.md)。本週只取「沒有設備」空狀態與產耗接線，不擴為整項 D1。

初次分析時分支為 `dev/toby`；HEAD 與本機 `origin/master` 同為 `3b368b1796ebaac59356de2ea095664a9e337a8c`，當時未 fetch。初次分析看到的 CLAUDE.md 刪除未納入文件提交。

步驟 01 執行時已成功 fetch，遠端 master 仍為同一提交；目前 HEAD `aad10bc` 僅多七份工單文件。開始本輪時工作樹乾淨，CLAUDE.md 刪除已不在工作樹，本輪未還原或處理該檔案。

## 需求與邊界

本週驗收：無設備顯示「尚未擺放設備」；有效產線的產出、消耗、淨值隨畫布變動；展示元件只接 props；最終交付以 GitHub PR 為準。

不做其他空狀態完整設計、供水型態、設備樣式、左欄、旋轉、Delete、折線核對、調度券或倉庫擴充。電力不作本次驗收門檻。不改 store 簽名，不重寫引擎。

## 程式現況與文件落差

下表記錄初次分析時的缺口。步驟 02 已補正式來源、引擎入口與右欄 props 接線；步驟 03 已補無設備文案、格式與 Story。實際修改及驗證見 [步驟 02](./W1102-T1_step_02_data_wiring.md)、[步驟 03](./W1102-T1_step_03_panel.md)。

| 對象 | 實際現況 | 影響 |
| --- | --- | --- |
| 正式右欄 | `src/app/layouts/MainLayout.vue` 直接渲染無 props 的 `src/app/StatsPanel/Index.vue` | 尚未接實際統計 |
| 舊表格 | `src/components/StatsPanel/ItemSummaryTable.vue` 不存在 | 工單檔名需更新，不直接重建舊版 |
| 舊容器 | `src/editor/stats/ProductionStats.vue` 讀 flowStore，但僅由舊 Inspector 引用 | 修改它本身不會改變正式右欄 |
| 現行展示契約 | `src/app/StatsPanel/types.ts` 的 `products` 傳至 `ResultPanel.vue` | 需沿用現有元件接線 |
| 空資料 | ResultPanel 以空陣列渲染零筆項目 | 沒有「尚未擺放設備」文案 |
| 正式畫布 | LayoutView 使用 layoutStore 的 devices／pipelines／connections | 與引擎入口來源不同 |
| 引擎入口 | runFlowEngine 與 useFlowEngine 讀取、監聽 editorStore.nodes／edges | 僅接 flowStore 仍不能保證畫布連動 |

AGENTS 架構導覽以 2026-08-28 為準；D1 也保留舊目錄描述，以上以目前程式比對結果為依據。

## 資料流與介面

初次分析時，正式畫布到引擎缺少 production 接線；以下原缺口已於步驟 02 接通：

```text
LayoutView → layoutStore.devices／pipelines／connections
                        ↓ 待接：既有 toTopology
                    nodes／edges
                        ↓ 待定：正式引擎整合入口
                    flowStore.itemSummary
                        ↓ 待接：L2 computed 映射
                StatsPanel → ResultPanel
```

已有 `src/utils/layout/toTopology.ts`。`src/__tests__/flowEngine.topology.layout.test.ts` 定義源 → 粉碎機 → 輸入口各 30/min 的純函式案例。步驟 01 已重跑該檔與 `src/__tests__/utils/layout/toTopology.test.ts`，共 2 檔 6 案通過；這不是正式頁自動更新已完成的證據。

| ItemSummary | SingleProductDetail | 契約 |
| --- | --- | --- |
| itemId | id | 穩定品項識別 |
| name | name | 顯示名稱 |
| produced | produce | 個/min |
| consumed | consume | 個/min |
| net | profit | 沿用引擎淨值，不重算流量 |

保留中間物與淨值為零的品項。無設備以 `layoutStore.devices.length === 0` 判斷，不能用 summary 空陣列推定。現有 DTO 沒有 efficiency；本週不自行新增整套效率展示。

## 問題分類與開工前條件

- 本工單缺陷：右欄沒有 props 資料、沒有無設備文案。
- 上游整合缺口：正式 layout 資料未接到目前引擎入口。
- 文件落差：舊表格不存在、ProductionStats 不在主路徑、週工單仍引用 v1.1。
- 範圍衝突：MainLayout 凍結、useFlowEngine 唯讀，但目前掛載點與引擎入口位於這些檔案；現行 ResultPanel 與 types 也未列入工單檔案鎖。

最小方案已在步驟 01 列出，使用者已明確授權並完成步驟 02。不在 L3 import store、雙寫 editorStore、複製整套引擎或另掛重複 watcher。itemSummary 契約找 aaaaa，合入與其他檔案範圍協調找 dernoson。

後續執行見 [分步索引](./W1102-T1_steps.md)。
