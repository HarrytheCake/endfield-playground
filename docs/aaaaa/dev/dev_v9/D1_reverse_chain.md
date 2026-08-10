# V9-D1 — 反向鏈路推演

**對應工項：** V9-D1  
**狀態：** ✅ 完成  
**依賴：** B2（產品／材料分離清楚）  
**最後更新：** 2026-08-02

---

## 1. 目標

建立可重用模組 `src/utils/reverseChain.ts`：

1. 輸入：目標**產品**名稱（須存在於 products）  
2. 輸出：一棵**最短、無循環**的生產樹，葉節點皆為 **materials**（且非 products）  
3. 每步附帶機器、`machineMode`、配方效率（個／分）

---

## 2. 效率公式

```text
ratePerMin = quantity * 60 / timeSeconds
```

例：`timeSeconds: 2`、`quantity: 1` → **30／分**；`timeSeconds: 10`、`quantity: 2` → **12／分**。

---

## 3. 最短路徑定義

- 從目標產品**往回**展開：找「以該品為 outputs 之一」的配方  
- 葉節點：`materials` 且**不在** `products`（息壤氣等雙重列舉者視為產品，繼續回推）  
- **成本**＝樹上配方節點數最少  
- **禁止循環**：搜尋路徑上已出現的產品不可再展開  
- 同成本：取較高 `ratePerMin`，再取資料順序先者  

### 息壤驗收

- 選「芽針→碳塊；碳塊＋清水→息壤」短鏈（2 步）  
- 不選緻密碳長鏈；不因息壤氣捷徑循環／誤選  

---

## 4. API

```ts
findShortestReverseChain(productName: string): ChainNode | null
recipeOutputRatePerMin(recipe, outputItemId): number
countRecipeSteps(node): number
collectLeafMaterials(node): string[]
isReverseChainLeaf(itemId): boolean
```

---

## 5. UI

- `ProductCatalogPanel`：選產品 → 顯示鏈路樹＋步數＋葉材料＋各步效率  

---

## 6. DoD

- [x] 單元測試：效率公式；息壤選短鏈；瓶裝↔拆解不循環  
- [x] 葉節點皆 materials（非產品）  
- [x] Dev 產品頁可預覽鏈路
- [x] `pnpm type-check` + `pnpm test` 通過
- [x] （H1-2）「產生演示圖」含副產物長鏈（如赫銅零件）可合法匹配

---

## 7. 已知限制（驗收）

- 副產物仍**未自動接 Sink**（未建模副產流向）；匹配已不因副產污染失敗  
- 演示圖多用 `makeEdgeLoose`（略過媒質／多埠 handle）  
- 主畫布手動連線若未設 `primaryOutput`，仍依邊候選回朔匹配

---

## 8. 開發日誌

### 2026-08-02

- 建立細項
- 完成：`reverseChain.ts`、測試、ProductCatalogPanel 預覽、本檔標完成
- 驗收：赫銅零件套用非法 → 記入 H1  
- H1-2：邊候選匹配＋演示 primaryOutput；赫銅零件可合法
