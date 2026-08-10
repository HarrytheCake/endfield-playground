# V7-E1 — FlowEngine 最小支援（mode／媒質）

**對應工項：** V7-E1  
**狀態：** 完成  
**依賴：** V7-D2  
**定案：** machineMode + belt/pipe；**loss 不計算**

---

## 1. 最小支援範圍（凍結）

### 必做

1. **讀取 `machineMode`**  
   - 自 `FactoryNode.data.machineMode`；缺省 `getMachine(...).modes[0].id`
2. **配方解析**  
   - `getRecipeForNode(machineType, recipeIndex, machineMode)`  
   - 先用 `getRecipesForMachine(machineType, machineMode)` 再取 index
3. **媒質檢查**  
   - `validateChains`：兩端 `sourceHandle`／`targetHandle` 皆有時，比對埠 `media`；belt↔pipe 則標記兩端非法  
   - handle 缺省（抽象測試邊）時略過  
   - 氣體品項走 pipe 埠（資料面已由 mode ports 表達）
4. **反向鏈路 `validateRecipeMatch`**  
   - 使用「mode 過濾後」的配方 inputs（含氣態品項名）

### 明確不做（本版）

- `loss` 納入 itemSummary／消耗
- pipe 專用速率上限（沿用 `BELT_RATE_LIMIT`；註解 TODO）
- UI 完整切換 mode 體驗（資料欄位先就位即可）

---

## 2. 檔案修改計畫

| 檔案 | 動作 | 結果 |
|------|------|------|
| `src/composables/useFlowEngine.ts` | mode 配方、媒質檢查、`resolveMachineMode` | 完成 |
| `src/types/flow.ts` | `EdgeMeta` handle 欄位 | 完成 |
| `src/__tests__/composables/useFlowEngine.test.ts` | mode／媒質案例 | 完成 |
| `src/__tests__/flowEngine.test.ts` | mode 過濾後 index；liquid_mode | 完成 |
| `src/app/dev/FlowEngineTest.vue` | primaryOutput 解析 index；對齊正式配方 | 完成 |

---

## 3. 驗證標準

- [x] 舊情境在預設 mode 下行為回歸通過（221 tests）
- [x] mode 正確時可取對應配方（liquid_mode 赤銅塊）
- [x] belt↔pipe 錯接被標記非法（有 handle 時）
- [x] loss 不影響 summary 數字（未實作 loss 計算）

---

## 4. 開發日誌

### 2026-08-01

- 凍結最小支援；loss 計算排除
- 實作 machineMode 配方解析與 belt/pipe 媒質檢查
- `/dev/flow-engine` preset 改以 `primaryOutput` 動態解析 recipeIndex
