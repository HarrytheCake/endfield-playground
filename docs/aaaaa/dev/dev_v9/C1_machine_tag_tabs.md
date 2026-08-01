# V9-C1 — 機器預覽 tag 分頁

**對應工項：** V9-C1  
**狀態：** 未開始  
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

（與 `docs/aaaaa/data/machine_tags.json` 一致；可加「全部」）

每頁列出該 tag 下機器；JSON＋埠預覽行為沿用 V8，並銜接 C2 格點。

---

## 2. 實作要點

- 以 `machine.tags` 歸類；無 tag 機器歸「未分類」或僅出現在「全部」
- 一機多 tag：可出現在多個分頁，或主 tag 優先（建議：**多頁皆可出現**）
- UI：分頁 tabs，勿新開路由

---

## 3. DoD

- [ ] 可依上述 tag 切換列表  
- [ ] 基礎生產／合成製造等可分別瀏覽  
- [ ] 與選定機器的 mode／JSON 預覽仍可用

---

## 4. 開發日誌

### 2026-08-02

- 建立細項
