# V9-D1 — 反向鏈路推演

**對應工項：** V9-D1  
**狀態：** 未開始  
**依賴：** B2（產品／材料分離清楚）  
**最後更新：** 2026-08-02

---

## 1. 目標

建立可重用模組（建議 `src/utils/reverseChain.ts` 或 `src/composables/useReverseChain.ts`）：

1. 輸入：目標**產品**名稱（須存在於 products）  
2. 輸出：一棵（或一條）**最短、無循環**的生產樹，葉節點皆為 **materials**  
3. 每步附帶機器、`machine_mode`、配方效率（個／分）

---

## 2. 效率公式

對配方任一輸出列：

```text
ratePerMin = quantity * 60 / timeSeconds
```

例：`timeSeconds: 2`、`quantity: 1` → **30／分**；`timeSeconds: 10`、`quantity: 2` → **12／分**。

---

## 3. 最短路徑定義

- 從目標產品**往回**展開：找「以該品為 outputs 之一」的配方  
- 每個輸入若屬 materials → 葉節點；若屬 products → 繼續回推  
- **成本**＝生產樹上配方步數（recipe 邊數）最少  
- **禁止循環**：搜尋路徑上已出現的產品不可再展開（例：藍鐵瓶-錦草溶液 ↔ 拆解／灌裝互推）  
- 多輸入：展開整棵 AND 樹；總成本＝樹上配方節點數（或邊數）——以「息壤選路徑 2」為驗收基準  
- 同成本多解：取穩定次序（配方在資料中的先後）

### 息壤驗收

- 必須選「芽針→碳塊；碳塊＋清水→息壤」短鏈，而非緻密碳長鏈

---

## 4. API 草案

```ts
type ChainNode = {
  itemId: string;
  kind: 'material' | 'product';
  recipe?: RecipeRef; // 產出此物所選配方
  ratePerMin?: number; // 該產出列效率
  inputs?: ChainNode[];
};

function findShortestReverseChain(productName: string): ChainNode | null;
```

---

## 5. UI 銜接（可同項或 F2）

- 產品目錄：選產品 → 顯示鏈路樹＋各步效率  
- 引擎測試：可「套用鏈路」生成演示圖（完整自動化屬 F2）

---

## 6. DoD

- [ ] 單元測試：效率公式；息壤選短鏈；瓶裝↔拆解不循環  
- [ ] 葉節點皆 materials  
- [ ] Dev 產品頁可預覽鏈路（最小：文字／樹狀）

---

## 7. 開發日誌

### 2026-08-02

- 建立細項
