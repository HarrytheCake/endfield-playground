# 電力統計步驟 01：全設備額定耗電

狀態：完成（2026-11-05）；依使用者「開始執行」指示實作。

## 目標與修改範圍

在 `src/composables/useFlowEngine.ts` 將總耗電改為統計本次完整輸入 nodes，移除耗電與 `isValid` 的耦合。設備額定數值仍使用 `src/data/machines.ts` 的既有查詢 API，不另造數據表。

可同步修正 `src/store/flowStore.ts`、`src/types/flow.ts` 中受影響的電力註解；測試放在 `docs/toby/test/`，優先擴充 `layoutFlowWiring.test.ts`。不修改 store 公開簽名與流量演算法。

## 執行順序

1. 確認分支、工作樹與最新程式，保留其他既有變更。
2. 使用傳入的全部 nodes 查詢額定 power，逐台加總正值；0、-1、其他負值及未知設備不增加需求。
3. 保持供電既有行為，明確保留供電待辦；電力不阻擋產能計算。
4. 沿用 applyResult 與 150ms 排程，不在 L2 加總，不新增 watcher。
5. 更新相關註解，說明額定耗電不依連線、素材、效率或鏈路有效性折算。
6. 補核心與整合驗證，檢查正式拓撲及舊無參數入口，記錄結果。

## 驗收條件

| 案例 | 預期 |
| --- | --- |
| 空設備集合 | 耗電 0 kW |
| 未連線粉碎機 | 5 kW |
| 未連線粉碎機＋塑型機 | 15 kW |
| 兩台粉碎機 | 10 kW |
| 同設備集合連線／斷線、清除素材、供料速率變更 | 耗電不變 |
| 零耗電設備、-1 未定義值、未知 machineType | 不增加需求、不產生 NaN |
| 清空正式 layout | 不退回 editorStore mock，耗電歸零 |
| 舊無參數引擎入口 | 使用舊入口的全部節點，仍能正常回傳結果 |

額定數值以實作時正式資料為準；若新增資料導致案例數值改變，應查明來源再更新預期，不為測試手改生成檔。

完成後記錄實際 diff 與測試；下一步為右欄接線。

## 實際變更與驗證結果

- `src/composables/useFlowEngine.ts`：耗電改為遍歷完整輸入 nodes，查詢 `resolveMachineDef` 並加總正值 power；包含未連線及因 blocking error 未進入 graph 的設備。保留 machineType → label → node.id 的既有查詢相容性。
- `src/store/flowStore.ts`、`src/types/flow.ts`：更新需求欄位註解，沒有改公開簽名。
- `docs/toby/test/layoutFlowWiring.test.ts`：新增 4 案，涵蓋未連線多台設備 20 kW、被驗證排除仍計入、0／-1／未知設備不增加需求、低供料及清除素材後維持 5 kW、舊入口中文 label 與 id 查詢；原清空／斷線案例加上耗電斷言。
- 額定數據仍來自 `src/data/machines.ts`（原始來源為 `docs/aaaaa/data/machines.json`）；未修改資料或生成器，供電仍是既有占位 0。

驗證：`pnpm lint-check`、`pnpm format-check`、`pnpm test` 通過，全套 59 檔／1,044 案。首次 type-check 揭露新增測試用 `data: {}` 缺少必要 label，已改成合法的省略 data 節點以驗證 id fallback；修正後 `pnpm type-check` 與該整合測試 12 案重跑通過。`pnpm exec prettier --check docs/toby/test/` 通過。額外直接呼叫 ESLint 檢查 docs 測試時回報該檔被既有 ignore 規則略過，因此不宣稱 docs 測試已受 ESLint 檢查；其型別、格式及執行結果均已驗證。`git diff --check` 通過。

當前環境沒有提供 validate-changes skill，已手動執行四項品質指令。本步未修改 L3 或 Story，未執行 Storybook／瀏覽器操作驗收；刪除與 undo/redo 等原生操作留在步驟 04。本次測試沒有新增發電負值假資料，供電完整規則仍待步驟 03 確認。

目前完成耗電計算；右欄 power 尚未接入，因此介面仍可能顯示 `-`。下一步為步驟 02；未提交或 push。
