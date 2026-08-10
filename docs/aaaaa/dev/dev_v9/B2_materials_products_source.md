# V9-B2 — 產品／材料分離與基礎材料輸出點

**對應工項：** V9-B2  
**狀態：** ✅ 完成  
**依賴：** A1；建議與 B1 同批資料變更  
**最後更新：** 2026-08-02

---

## 1. 目標

1. **產品頁**只列 `products.json` 品項  
2. **材料頁**只列 `materials.json` 品項  
3. **停止** codegen `buildSourceProducts`（勿再把「物品輸出口→源礦」等假配方併入 `products.ts`）  
4. **新建**機器「基礎材料輸出點」：  
   - `is_source: true`  
   - 依選定材料之 `form`：solid→belt、liquid／gas→pipe  
   - 專用於基礎材料產出（反向鏈葉節點）  
5. **物品輸出口**保留：僅固體；引擎測試改以「基礎材料輸出點」供應 materials  
6. 總產值仍只統計回送 **物品輸入口**（sink）的交付

---

## 2. 現況問題（已解決）

- ~~`generate-src-data.mjs` → `buildSourceProducts(materials)` 注入假產品~~  
- ~~`ProductCatalogPanel` 同時列 materials＋products，源礦被當產品演示~~  
- 既有 H1–H11 等 preset：演示頁已改接基礎材料輸出點；單元測試仍可手動設 `outputRates`／保留物品輸出口做媒質錯接案例

---

## 3. 實作摘要

| 檔案／區域 | 變更 |
|-----------|------|
| `docs/aaaaa/data/machines.json`（＋ data_1） | 新增「基礎材料輸出點」`solid_belt`／`fluid_pipe`；`id=material_source` |
| `generate-src-data.mjs` | 刪除 `buildSourceProducts`；products＝僅 `products.json`（H1-3 已移除 `TEST_STUB`） |
| `useFlowEngine.buildGraph` | `is_source`＋`primaryOutput` → 合成 `outputRates`（預設 30／半速 15） |
| `FactoryNodeData` | `primaryOutput?`／`sourceRatePerMin?` |
| `ProductCatalogPanel.vue` | 分頁：產品／基礎材料 |
| `FlowEngineTest.vue` | 多數 preset 改基礎材料輸出點；G3 保留物品輸出口做 belt→pipe |

### 基礎材料輸出點行為

- 節點資料帶 `primaryOutput`（材料名）與可選 `sourceRatePerMin`
- mode：solid→`solid_belt`、liquid／gas→`fluid_pipe`
- 速率預設滿速 30／min；`recipeIndex===1` 或顯式 `sourceRatePerMin: 15`＝半速
- **總產值**仍只計 **物品輸入口** 交付（不變）

---

## 4. 非目標

- 不把 layouts／blueprints 併進 products  
- 不刪除物品輸出口（固體用途仍在）

---

## 5. DoD

- [x] `src/data/products.ts` 無 materials 假配方注入  
- [x] 產品預覽無「源礦＝產品」誤列
- [x] （H1-3）產品預覽無「研製合成粉末方塊」等 codegen-only stub  
- [x] 基礎材料輸出點出現在 machines 與機器預覽  
- [x] 文件註明：總產值＝物品輸入口交付  
- [x] `pnpm type-check` + `pnpm test`（254）通過

---

## 6. 開發日誌

### 2026-08-02

- 建立細項
- 完成：機器 JSON、codegen 停假產品、catalog 分離、buildGraph primaryOutput、preset／測試、本檔標完成
