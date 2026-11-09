# 電力統計步驟 04：操作驗收與品質檢查

狀態：本輪驗收與紀錄完成（2026-11-05 至 2026-11-06，Asia/Taipei）。現行保留耗電／供電唯讀顯示，供電依設備負值 power 計算，沒有資料為 0，不提供手動輸入；最終驗證見文件最後一節。下列自訂設定與無限供電為先前版本的歷史證據，已取代。原生 Delete 未通過，依使用者指示列為已知問題、暫不修正。

## 正式頁操作驗收

1. 空畫布確認耗電 0，產能區仍顯示既有空狀態。
2. 放置未連線粉碎機與塑型機，等待既有排程後確認 5 → 15 kW；刪除塑型機回到 5 kW。
3. undo／redo 刪除操作，確認 15／5 kW；移動或旋轉設備不改變額定耗電。
4. 接上原有 source → 粉碎機 → sink 產線，確認產能仍更新；斷線、清除素材、改供料速率只影響產能，不影響同設備集合的耗電。
5. 載入另一份快照、清空及快速連續操作，確認使用最新集合且沒有殘留值或退回舊 mock。
6. 若供電已實作，依步驟 03 的正式資料驗證正常、短缺、過載及零供電；尚未實作就明確記錄未驗證範圍。

## 自動驗證與呈現檢查

- 相關 Vitest 測試先跑，再跑 `pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test`。
- Toby 新增測試位於 `docs/toby/test/`；另跑 `pnpm exec prettier --check docs/toby/test/`，因現有 format-check 不涵蓋此處。
- 修改 Story 或 L3 呈現後，執行 `pnpm build-storybook`，實際開啟相關 Story，檢查 Controls、零值／過載及 Accessibility；既有問題與本次問題分開記錄。
- 若環境提供 validate-changes skill，依其指示驗證；否則記錄手動執行結果。
- 不產生截圖或 JSON 報告，以文字或 Markdown 留下驗證證據。純快照注入的瀏覽器測試不得寫成已完成原生拖拉操作驗收。

## 交付紀錄

檢查 `git diff --check`、變更範圍及工作樹。更新本輪分析／步驟狀態，摘要實際修改、資料來源、測試結果及尚未完成事項。數字通過測試不表示原始發電規則已獲確認。

耗電與供電皆有正式資料及操作證據後，才能標註電力統計全部完成。提交、push、PR 依使用者後續指示，不因本步自動執行。

## 實際操作結果

使用本機無頭 Chromium，以瀏覽器滑鼠／鍵盤事件操作正式 `/` 頁；1920×1080 視窗，不產生截圖。測試工具位於忽略的 `node_modules/.cache/`，不加入產品變更。

| 案例 | 操作方式 | 結果 |
| --- | --- | --- |
| 空畫布 | 全新瀏覽器頁面 | 0 kW／無限供電；產能區顯示「尚未擺放設備」 |
| 放置粉碎機與塑型機 | 原生點擊工具列卡片，再點畫布格點 | 耗電依序 0 → 5 → 15 kW；設備未連線仍計入 |
| 設備移動與旋轉 | 原生拖曳塑型機，再按 R | 位置與 rotation 確實更新，耗電維持 15 kW |
| 原生刪除 | 點選塑型機後按 Delete | **未通過**：設備仍有 2 台，耗電仍為 15 kW，selectionStore.selectedNodeIds 為空 |
| 復原／重做放置 | 原生 Ctrl+Z 依序還原旋轉、移動、塑型機放置，再 Ctrl+Y | 設備位置／旋轉回復，耗電 15 → 5 → 15 kW |
| L1 刪除後復原／重做 | 測試呼叫 layoutStore.removeDevice，再按原生 Ctrl+Z／Ctrl+Y | 耗電 15 → 5 → 15 → 5 kW；此項不能替代原生 Delete 驗收 |
| 建立產線 | 以快照載入設備但不含管線，再原生拖曳 source→crusher 與 crusher→sink 的埠 | 實際新增 2 條管線，源石粉末 30/min，耗電 5 kW |
| 斷線與復原 | 測試呼叫 layoutStore.removePipeline，再原生 Ctrl+Z | 斷線後摘要清空，復原後 30/min，兩者耗電皆為 5 kW |
| 清除／恢復素材 | 原生選取源設備，使用素材下拉切換「無」與「源礦」 | 摘要清空／恢復 30/min，耗電維持 5 kW |
| 載入與清空設備 | 快照依序載入空集合、粉碎機、粉碎機＋塑型機、粉碎機、空集合 | 右欄與 flowStore 均為 0 → 5 → 15 → 5 → 0 kW，不退回 editorStore mock |
| 供電不足／充足／零供電／無限 | 5 kW 需求下，以原生鍵盤輸入 3、10、0、清空，離開輸入框提交 | 分別顯示不足、正常、不足、無限供電；輸入與 store 正確同步 |
| 產能與配方回歸 | 連線快照由 30 改為 15/min；切換素材與設備模式 | 產能更新，保留手動收合；正式配方卡與模式正確，無瀏覽器執行錯誤 |

原生連線案例的設備配置：source `(15,12)`、rotation 0；crusher `(19,12)`、rotation 3；sink `(25,12)`、rotation 2。使用 crusher 的輸入／輸出 index 1，其餘 index 0，使埠同高、可建立直線管線。設備由快照載入，**只有連線是原生拖曳建立**，不宣稱整條產線所有設備均手動擺放。

測試修正紀錄：起初誤用舊 canvasStore 的 20px 格距換算正式 SVG 座標，已改由 SVG 格線取得實際格距後通過；第一版連線配置被既有碰撞預檢拒絕，已改為上述對齊埠配置後通過。未為測試修改畫布、折線或機器資料。

## Delete 未通過的原因與處置

`src/app/layouts/MainLayout.vue` 保存正式畫布單選 selectedDeviceId，並透過 `src/editor/layout/LayoutView.vue` 的 select-device 事件更新。現有全域 Delete 在 `src/composables/useShortcuts.ts` 讀取 selectionStore.selectedNodeIds，且呼叫 **editorStore.removeDevices**；它沒有刪除正式 layoutStore 設備。因此本次選取後 Delete 為 no-op。

此缺口與供電設定及額定耗電加總分屬不同資料接線問題。L1 刪除與原生 undo/redo 已證明設備集合變化後電力結果正確，不能據此把原生 Delete 標為通過。本輪範圍不修改畫布選取／Delete／history 公開行為，保留缺口，後續需另行接線修正。

2026-11-06 使用者處置：「delete先不處理 紀錄為主」。本項只保留重現步驟、結果與資料來源差異，暫不排入本輪修正，也不要求立即處理；是否另開修正工作依後續指示。此為範圍調整，不代表 Delete 已修復。

## 品質檢查與證據範圍

- 本步重跑 `pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test` 全部通過；Vitest 為 59 檔／1,049 案。
- `pnpm exec prettier --check docs/toby/test/` 通過；docs 測試受既有 ESLint ignore 影響，不宣稱 lint-check 涵蓋該目錄，型別／格式／執行結果均有驗證。
- 快速連續變更合併、清空後移除舊結果、舊入口隔離、設定重算與 reset 保留設定，由 `docs/toby/test/layoutFlowWiring.test.ts` 的自動整合案例驗證；不把這些案例寫成原生操作。
- 本步沒有再修改 L3／Story，沿用步驟 03 的最新 Storybook 建置、16 個 Story／10 個 play、Controls 與 Accessibility 證據。自訂供電 Story 的 axe 零違規；既有產耗對比及 Tips 可聚焦問題仍在，詳見步驟 02、03。
- 當前環境沒有提供 validate-changes skill，手動執行四項品質檢查。`git diff --check` 通過；StatsPanel 無 Pinia／store import。
- 本步只更新驗收文件與索引，保留步驟 01–03 的未提交程式變更；未新增套件、測試截圖或 JSON 報告。

## 資料來源與交付結論

耗電設備集合來自 `src/store/layoutStore.ts`，設備額定 power 查詢 `src/data/machines.ts`，原始來源為 `docs/aaaaa/data/machines.json`。供電規則來源為 `spec/10_power_calculation.md` §2.2 與 `spec/00_top_spec.md`，實際上限來自使用者輸入，由 `src/store/flowStore.ts` 的 powerSupplyLimit 保存；引擎結果仍透過 flowStore → ProductionStats → StatsPanel → ResultPanel 呈現。

電力總量計算與設定已完成驗證，本輪電力工作與驗收紀錄完成。原生 Delete 保留未通過結果，依使用者指示暫不處理，不阻擋本輪結案；完整操作案例不宣稱全數通過。W004／W005 detector、供電覆蓋、警示導覽、各基地分別保存供電與設定持久化均未實作。本輪沒有 commit、push 或建立 PR。

## 2026-11-06 最終需求變更與驗證：只保留總耗電

使用者指示「不需要總供電量」。已撤回步驟 03 的供電設定及相關新增 API、監聽、事件、展示欄位、3 個供電 Story 與 5 個供電測試；正式總覽及舊 Inspector 均只顯示總耗電，PowerData 僅保留 used。既有 flowStore／FlowEngine 結果的 totalPowerSupply 為原始 0 占位，為相容既有其他入口而保留，不在本輪面板呈現，也不據此顯示不足。

- 正式頁驗證：依序載入空集合、粉碎機、粉碎機＋塑型機、粉碎機、空集合，畫面與 store 均為 0 → 5 → 15 → 5 → 0 kW。確認沒有總供電欄位、供電輸入或比例條。
- 連線產能 30 → 15/min 正常，維持手動收合；正式配方、素材切換與模式檢查通過，沒有瀏覽器執行錯誤。本輪快照測試不取代上方已記錄的原生操作與 Delete 未通過證據。
- `pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test` 通過；最新測試數為 59 檔／1,044 案，數量降低來自撤回 5 個供電測試，耗電測試仍保留。
- `pnpm exec prettier --check docs/toby/test/`、`pnpm build-storybook` 與 `git diff --check` 通過。
- 最新 13 個 Story／9 個 play 通過；高耗電驗證 350 kW，零耗電驗證 0 kW，確認沒有供電輸入／文案／比例條。Story export 名稱沿用既有識別，顯示名稱已改為「高耗電」「零耗電」。
- Controls 的 hasDevices 切換正常；ConnectedProduction 的 Accessibility 分頁 0 violations／11 passes。高耗電 Story 的 2 個對比違規來自既有產耗／Tips，零耗電為零違規；其餘 axe 已知限制與前述紀錄相同。

最終資料來源維持 layoutStore.devices 與 machines.ts 的額定 power（原始 machines.json），沒有新增供電原始數據。Delete 仍只記錄、不修改。尚未提交、push 或建立 PR。

## 2026-11-06 最新澄清：保留「總耗電量/供電量」，移除手動輸入

使用者指出「需要是總耗電量/供電量」，已更正先前移除整個供電顯示的解讀。標題與數字恢復為唯讀配對，例如「5 kW / 無限供電」；手動輸入、上限設定 action、設定監聽、比例條及不足提示不恢復。

供電結果由 flowStore.totalPowerSupply 經 L2 傳給展示層。沒有供電上限設定時依 `spec/10_power_calculation.md` §2.2 採 Infinity，顯示無限供電；不是推算熱能池產電，也不把 0 占位當作真實供電。PowerData 保留 used 與可選 total，不提供任何設定事件。

最新重跑四項品質檢查與 Storybook 建置通過，59 檔／1,044 案、13 個 Story／9 個 play 通過。高耗電 Story 驗證「350 kW / 180 kW」，未設定供電驗證「0 kW / 無限供電」，均沒有供電輸入。正式頁確認標題完整、耗電 0 → 5 → 15 → 5 → 0 kW 配對顯示無限供電；產能 30 → 15/min、手動收合與正式配方卡均正常。axe 限制維持既有紀錄。

此節取代上一節「只保留總耗電」的暫時解讀。Delete 僅記錄的決定維持，未修正；尚未提交、push 或建立 PR。

## 2026-11-06 最終供電規則與驗證：有資料計算、無資料為 0

最新依使用者「供電量也進行計算 如果沒資料顯示0」要求，已移除無限供電預設。供電來源與耗電相同，依 machines.ts 的 power 欄位及 types/machine.ts 的既有負值產電契約加總，排除 -1 未定義值；詳細實作與來源見步驟 03 最後一節。

- 四項品質檢查通過，59 檔／1,045 案；新增供電累加／刪除／清空案例，模擬產電數據不寫入正式資料。相關兩檔 34 案通過。
- Toby 測試格式、Storybook 建置及 git diff 檢查通過。13 個 Story／9 個 play 驗證耗電／供電唯讀數字，缺 total 顯示 0；既有 axe 對比及 Tips 限制保留。
- 正式頁空畫布顯示「0 kW / 0 kW」，設備切換耗電為 0 → 5 → 15 → 5 → 0 kW，現有正式供電全程 0 kW，沒有手動輸入或比例條。30 → 15/min 產能、保留收合、素材／配方模式回歸正常，無瀏覽器執行錯誤。
- 本輪 Storybook 首次服務程序異常結束，導致一次瀏覽器連線拒絕；重新啟動後再驗證，不將連線失敗列為功能通過證據。

此節取代前述無限供電規則，不代表已補齊正式發電設備額定資料或燃料模擬。Delete 仍只記錄，未修正。尚未提交、push 或建立 PR。
