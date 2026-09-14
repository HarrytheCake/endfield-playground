# V12 驗收指南 — aaaaa 本週交付（A0 layoutStore）

**週次：** 2026-09-07 → 2026-09-13  
**負責人：** aaaaa  
**最後更新：** 2026-09-12  
**工單：** [W0907-A0](../../work_dispatch/aaaaa/0907/W0907-A0_layout_store_model.md)  
**對照公開驗收：** [WEEK_20260907 §0.1 V1](../../work_dispatch/WEEK_20260907.md)

---

## 0. 交付總覽

| 工項 | 內容 | PR | 分支 |
|------|------|-----|------|
| A0 layout store | `layoutStore`＋測試＋`/dev` 演示＋解鎖句 | [#45](https://github.com/dernoson/endfield-playground/pull/45) **待審** | `dev/aaaaa0907` |

V12 執行計畫：[todolist_v12.md](../todolist_v12.md)＋本目錄 `dev_v12/`。

**本指南只驗 aaaaa A0**（對應 WEEK V1）。全隊 V2–V7 以 WEEK §0.1／§0.2 為準，不在此重複。

---

## 1. 對照 WEEK §0.1 V1

| WEEK 欄 | 內容 |
|---------|------|
| 驗什麼 | layout store 契約 |
| 過關長相 | `layoutStore` 可讀寫 devices／pipelines；`connections` 為 getter 衍生；測試綠 |
| 誰 | aaaaa A0 |
| 擋門檻 | **是**（9/27 前置） |

本檔 §2–§4 即 review_gate 可執行步驟。

---

## 2. A0 — 自動化（約 1 分鐘）

```bash
pnpm type-check
pnpm test src/__tests__/store/layoutStore.test.ts
pnpm test src/__tests__/store/editorStore.test.ts
```

| 預期 | 說明 |
|------|------|
| layoutStore 測全綠 | 涵蓋 W0907-A0 §3 四點（getter／PlacementResult／readonly／snapshot 對稱） |
| editorStore 測原樣綠 | **未動舊 store** |
| type-check 綠 | — |

---

## 3. A0 — 硬約束（diff）

- [x] 未改 `editorStore` 簽名或欄位
- [x] 未碰 `src/editor/layout/GridCanvas.vue`
- [x] 未碰 `src/editor/toolbar/ToolbarPanel.vue`
- [x] 未加深 `FactoryCanvas`／Vue Flow 佈局
- [x] store 內未重寫幾何／連線演算法（組用 `utils/layout/*`）

---

## 4. A0 — 視覺／週會（`/dev`，約 1 分鐘）

詳見 [D1](./D1_dev_store_preview.md)：

```text
1. pnpm dev → http://localhost:5173/dev/layout-store-preview.html
2. 選真實機器 →「放到預設點」或點空格；紫條 devices 增加
3. 拉 belt 三式：點兩機／點兩埠（綠圓＋橙方）／手動點格 → 綠線；connections 非 null
4. 故意重疊放置 → store=overlap（不 throw）；紅框只在真正重疊的設備
5. Undo／Redo 可退回；確認未接 editorStore／未改 ToolbarPanel／`src/router`
```

**本項為週會報告必要；未交則不得標個人驗收完成。**
**與 V11 `/dev/layout-l1-preview` 差異：** V11 只切 fixture；V12 經 store 讀寫真實機器。

---

## 5. PR body 必備

1. **讀取面簽章**（型別即可；見 [C1 §2.1](./C1_layout_store.md)）
2. **解鎖句**（預設帶本週仍只讀；見 [E1](./E1_acceptance_and_unlock.md)）
3. **下游消費者**（toby 仍 props；B2 仍等擺放殼）

---

## 6. 相關文件

| 文件 | 用途 |
|------|------|
| [todolist_v12.md](../todolist_v12.md) | 工項狀態總表 |
| [C1_layout_store.md](./C1_layout_store.md) | store 契約 |
| [D1_dev_store_preview.md](./D1_dev_store_preview.md) | `/dev` 步驟 |
| [E1_acceptance_and_unlock.md](./E1_acceptance_and_unlock.md) | 解鎖句規則 |
| [WEEK_20260907 §0.2 A0](../../work_dispatch/WEEK_20260907.md) | 公開 review_gate 速查 |
