# V9-B2 — 產品／材料分離與基礎材料輸出點

**對應工項：** V9-B2  
**狀態：** 未開始  
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

## 2. 現況問題

- `generate-src-data.mjs` → `buildSourceProducts(materials)` 注入假產品  
- `ProductCatalogPanel` 同時列 materials＋products，源礦被當產品演示  
- 既有 H1–H11 等 preset 以「物品輸出口」出源礦（F2 遷移時改接）

---

## 3. 實作要點

| 檔案／區域 | 變更 |
|-----------|------|
| `docs/aaaaa/data/machines.json` | 新增「基礎材料輸出點」modes／ports（依 form 可能需多 mode 或動態 media——實作時定：建議 modes 分 solid_belt／fluid_pipe 或單一可配 media） |
| `generate-src-data.mjs` | 刪除／停用 `buildSourceProducts`；stub 機器含基礎材料輸出點 |
| `ProductCatalogPanel.vue` | 產品列表＝products only |
| 材料預覽（同頁或分區） | materials only；顯示 form |
| FlowEngine 測試／preset | 源材料節點改機器類型（F1／F2 追蹤） |

### 基礎材料輸出點（建議行為）

- 節點資料帶 `primaryOutput`／選定 material name  
- 輸出埠 media＝`formToPortMedia(form)`  
- 速率受 belt 30／pipe 60 約束（與 V8 一致）

---

## 4. 非目標

- 不把 layouts／blueprints 併進 products  
- 不刪除物品輸出口（固體用途仍在）

---

## 5. DoD

- [ ] `src/data/products.ts` 無 materials 假配方注入  
- [ ] 產品預覽無「源礦＝產品」誤列  
- [ ] 基礎材料輸出點出現在 machines 與機器預覽  
- [ ] 文件註明：總產值＝物品輸入口交付

---

## 6. 開發日誌

### 2026-08-02

- 建立細項
