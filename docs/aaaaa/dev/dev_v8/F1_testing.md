# V8-F1 — 測試

**對應工項：** V8-F1  
**狀態：** 完成  
**依賴：** C1–C4、E1  
**最後更新：** 2026-08-02

---

## 1. 案例矩陣

| ID | 情境 | 預期 | 覆蓋 |
|----|------|------|------|
| P1 | 單埠雙線直連 | 非法／不參與有效流量 | `flowEngine.v8.portCardinality.test.ts` |
| P2 | 多埠各一線 | 合法 | 同上 |
| R1 | belt 邊 >30 | 截斷 30 | `flowEngine.v8.rateLimits.test.ts` |
| R2 | pipe 邊 >60 | 截斷 60；且可 >30 | 同上 |
| H8 | 雙鏈→匯流→Sink，雙入滿 30 belt | 出口 30；上游堵塞回推約 15／15 | `flowEngine.v8.h8Merger.test.ts` |
| M1 | solid 走 pipe | 非法 | `flowEngine.v8.formMedia.test.ts` |
| M2 | gas 走 belt | 非法 | 同上 |
| M3 | gas／liquid 走 pipe | 合法並套 60 | 同上＋`itemForm.test.ts` |

手動（非失敗條件）：`/dev/flow-engine` 機器／產品分頁、H8、拓樸切 mode。

相關：`topologyPortUtils` 單元測試、`itemForm.test.ts`（form／30／60 映射）。

---

## 2. DoD

- [x] 自動化覆蓋 P／R／H8／M＊
- [x] type-check／既有測試不回歸（全庫約 250 tests）

---

## 3. 開發日誌

### 2026-08-01

- 初稿

### 2026-08-02

- 對齊已寫測試檔；補 formMedia M1–M3；標完成
