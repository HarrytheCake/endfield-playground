# V9-C1 — 機器預覽 tag 分頁

**對應工項：** V9-C1  
**狀態：** ✅ 完成  
**依賴：** B2（機器清單穩定）；tag 來源 [`machine_tags.json`](../../data/machine_tags.json)  
**最後更新：** 2026-08-02

---

## 1. 目標

在 `/dev/flow-engine` **機器**分頁（`MachineCatalogPanel`）以 **tag** 分頁／篩選：

- 物流設備  
- 倉庫存取  
- 基礎生產  
- 合成製造  
- 電力  

（與 `docs/aaaaa/data/machine_tags.json` 一致；另加「全部」；有未分類時顯示「未分類」）

每頁列出該 tag 下機器；JSON＋埠預覽行為沿用 V8，並銜接 C2 格點。

---

## 2. 實作摘要

| 區域 | 變更 |
|------|------|
| `generate-src-data.mjs` | 讀 `machine_tags.json` → 匯出 `MACHINE_TAGS`、`getMachinesByTag` |
| `src/data/machines.ts` | 上述 API（codegen） |
| `MachineCatalogPanel.vue` | tag tabs＋搜尋；切 tab 時若選中項不在列表則選第一筆 |
| `machines.test.ts` | tag／分頁契約測試 |

- 以 `machine.tags` 歸類；無已知 tag →「未分類」（僅在有資料時顯示）
- 一機多 tag：**多頁皆可出現**
- UI：分頁 tabs，不新開路由

---

## 3. DoD

- [x] 可依上述 tag 切換列表  
- [x] 基礎生產／合成製造等可分別瀏覽  
- [x] 與選定機器的 mode／JSON 預覽仍可用  
- [x] `pnpm type-check` + `pnpm test` 通過

---

## 4. 開發日誌

### 2026-08-02

- 建立細項
- 完成：codegen MACHINE_TAGS、MachineCatalogPanel tabs、測試、本檔標完成
