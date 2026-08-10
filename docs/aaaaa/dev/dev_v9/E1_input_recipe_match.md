# V9-E1 — 引擎依輸入匹配配方

**對應工項：** V9-E1  
**狀態：** ✅ 完成  
**依賴：** B1／B2；建議 D1 可並行  
**最後更新：** 2026-08-02

---

## 1. 目標

FlowEngine 核心行為變更：

- 機器節點**可不預選**有效配方  
- 依**實際接入輸入**（品項種類／是否齊全）匹配配方  
- 輸入不齊 → **不顯示／不計算產出**（例：精煉爐僅赤銅礦、無清水 → 無赤銅塊／汙水）  
- 輸入齊全且吻合 → 套用該配方輸出（例：粉碎機接源礦→源石粉末；接砂葉→砂葉粉末）

---

## 2. 匹配規則（已實作）

1. 限定：當前 `machineType`＋`machineMode`（缺省 modes[0]）下的配方子集  
2. **輸入不齊**：配方所需任一種輸入未接到（或流量為 0）→ 不匹配  
3. **完全吻合**：接入品項種類集合＝配方 inputs 名稱集合 → 候選  
4. 多候選：依 `products.json` 出現順序（`getRecipesForMachine`）取**第一條**  
5. UI `recipeIndex`：提示／除錯；引擎以匹配結果覆寫  
6. `environment`：配方與節點（缺省 `"none"`）須一致  

API：`matchRecipeByInputs(machineType, incomingItemIds, machineMode?, environment?)`

---

## 3. 與既有欄位

| 欄位 | V9 語意 |
|------|---------|
| `recipeIndex` | 可選；匹配成功後由引擎寫回 |
| `environment` | 節點環境；影響可匹配配方 |
| `primaryOutput` | Source 類仍用之 |
| `buildGraph` | 一般機器不再預填 rates；匹配後填入 |

---

## 4. 影響範圍

- `useFlowEngine.ts`：`validateChains`／`propagateFlows`  
- H6 等：同輸入集合取第一配方後速率預期已更新  
- FLOW_ENGINE_GUIDE 計算流程（G1 補文件）

---

## 5. DoD

- [x] 單元測試：粉碎機換料換產；精煉爐缺清水無產出；齊全後有產出  
- [x] 多配方同輸入集合時取資料順序第一  
- [x] type-check；核心回歸測試更新（282）

---

## 6. 開發日誌

### 2026-08-02

- 建立細項
- 完成：matchRecipeByInputs、引擎串接、測試、本檔標完成
