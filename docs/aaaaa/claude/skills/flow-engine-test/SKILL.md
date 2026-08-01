---
name: flow-engine-test
description: 針對 CR-04 FlowEngine 跑單元測試與手動驗證清單（H1–H6 preset、堵塞、環路、Error 略過、效率顏色）。在修改 useFlowEngine / flowStore / flow 型別 / ProductionStats 後、或使用者要求「測 FlowEngine」、「跑流量測試」、「驗證 H1–H6」、「檢查堵塞偵測」時使用。可與 validate-changes 搭配：先全套驗證，再跑本 skill 的針對性案例。
---

# FlowEngine 測試（CR-04）

本 skill 專注 **FlowEngine 正確性驗證**。可改測試、可跑指令；**預設不改演算法源碼**（除非使用者明確要求修 bug）。

參考文件：

- `docs/aaaaa/FLOW_ENGINE_GUIDE.md`
- `docs/aaaaa/claude/CONTEXT.md`
- `docs/aaaaa/dev/dev_v5/A2_flow_engine_test.md`
- `spec/04_flow_simulation.md`

## 何時觸發

1. 修改了 `useFlowEngine.ts`、`flowStore.ts`、`types/flow.ts`、`ProductionStats.vue`
2. 使用者要求測流量引擎、H1–H6、堵塞、環路、效率
3. `validate-changes` 全套通過後，需要更細的 FlowEngine 回歸

## 自動化測試（必跑）

```bash
pnpm test -- src/__tests__/flowEngine.test.ts
```

若有鏡射結構的新測試，一併跑：

```bash
pnpm test -- src/__tests__/composables/useFlowEngine.test.ts
pnpm test -- src/__tests__/store/flowStore.test.ts
```

（檔案不存在則跳過，不要新建除非使用者要求。）

### 通過標準

- 既有 FlowEngine 案例全數通過
- 浮點比較使用 `toBeCloseTo`
- `machineType` 若已遷移為英文 id，測試字串必須用 `Machine.id`（見 `report_v4.md`）；若仍為中文，在回報中註明「等待 CR-01 遷移，測試仍用舊值」

## 手動驗證情境速查（`/dev/flow-engine` Preset）

| ID | 情境 | 預期 |
|----|------|------|
| H1 | 基礎單鏈路 | 效率 100%，管線受 belt 上限 |
| H2 | 半速供料瓶頸 | 效率 ≈ 50%（黃） |
| H3 | 分流器 | 兩出邊流量大致相等 |
| H4 | 環路 | 子圖非法／略過 |
| H5 | 懸空設備 | 無有效流量 |
| H6 | 多級串聯 | 鏈上高效率、有 sink 交付 |
| H7 | 雙 Source 灌同一機 | 至少一條入邊堵塞（橘） |
| H8 | 雙鏈 → 匯流器 → Sink | 出口 ≈30；入邊堵塞回推約各 15 |
| H9 | 兩條獨立產線 | 互不影響 |
| H10 | 配方不符 | 節點標非法 |
| H11 | 半速 + 分流 | 各出邊約 7.5/min |

Dev 頁面（僅 `import.meta.env.DEV`）：

| 路由 | 用途 |
|------|------|
| `/dev/flow-engine` | JSON preset + 手動觸發計算 |
| `/dev/graph-viz` | 拓撲 / 環路 / invalid 子圖視覺化 |
| `/dev/history-replay` | undo/redo（非 FlowEngine 核心，但常一起驗證） |

手動頁驗證步驟細節見 `docs/aaaaa/dev/dev_v5/A2_flow_engine_test.md`。

## 演算法回歸檢查清單

修改演算法後，對照確認未破壞：

1. `buildGraph` 仍過濾 `hasBlockingError`
2. `validateChains` 仍做反向 BFS + 配方匹配 + 下游非法傳播
3. `topologicalSort` 仍用 Kahn，環路進 `invalidSubgraphUids`
4. `propagateFlows` 仍套用媒質速率上限（belt 30／pipe 60）；匯流器 Σ 入後再截斷
5. `detectCongestion` 仍為**多遍**迭代；匯流器同品項多入邊按比例分攤需求
6. 結果只經 `flowStore.applyResult` 批次寫入

## 工作流程

1. 確認變更範圍（哪些檔、是否動到演算法）
2. 跑自動化 FlowEngine 測試
3. 若演算法有改：逐項勾「演算法回歸檢查清單」
4. 若使用者要求手動：列出需在 `/dev/flow-engine` 執行的 preset，或代為檢查測試檔是否覆蓋同等情境
5. 回報結果；失敗時先判斷測試 vs 源碼，不擅自放寬斷言

## 回報格式

```
FlowEngine 測試結果：
- flowEngine.test.ts: 通過 / 失敗（NN 案例）
- 其他相關測試: <路徑或略過>
- 回歸清單: 全部確認 / 有疑慮 <列出>
- 手動 / Dev 頁: 已建議使用者驗證 H? / 已覆蓋於單元測試
- machineType 狀態: 英文 id / 仍為中文（等待 CR-01）
```

## 不該做的事

- 不要為了讓測試過而改壞演算法語意
- 不要修改其他 CR 主責檔案來「配合」測試
- 不要跳過 `detectCongestion` 多遍相關案例就宣稱堵塞 OK
- 不要在未跑測試時回報「應該沒問題」
