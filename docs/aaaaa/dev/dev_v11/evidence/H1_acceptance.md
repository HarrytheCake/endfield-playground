# V11-H1 證據 — 工具列真實機器

**日期：** 2026-09-01（合入狀態：2026-09-11 收斂——PR [#43](https://github.com/dernoson/endfield-playground/pull/43) **已於 2026-09-04 MERGED**）  
**分支：** `dev/aaaaa0831-h1`（基於 master @ PR #40 合入後；現已合入 master）

---

## 1. 品質閘

| 閘 | 結果 |
|----|------|
| `pnpm type-check` | 通過 |
| `pnpm test src/__tests__/editor/toolbarMachines.test.ts` | **4 tests** 通過 |
| V11 相關 layout＋mockLayout＋toolbar | **9 files／63 tests** 通過 |

---

## 2. 手動驗收步驟（約 2 分鐘）

```text
1. pnpm dev → 開 http://localhost:5173/（主編輯器，非 /dev）
2. 看畫面下方工具列：
   - 上半：既有五顆（精煉爐、粉碎機…）仍可用
   - 下半：分類 Tab（物流設備／倉庫存取／基礎生產…）＋橫向機器列表
3. 預設 Tab「基礎生產」：應見粉碎機 3×3、精煉爐等真實名稱＋佔格
4. 切「合成製造」：應見灌裝機 6×4
5. 切「物流設備」：應見分流器 1×1
6. 點一台真實機器 → 卡片高亮（藍框）；DevTools Console 出現
   [toolbar] real machine selected (no store / no place) { id, name, sizeText, tag }
7. 點上半「粉碎機」→ 仍可 armPlacement；拖曳到畫布仍可落子（舊路徑未改）
8. 確認點真實機器後畫布**不會**進入放置模式
```

**注意：** H1 **無**獨立 `/dev` 頁或 Storybook story（`ToolbarPanel` 在 L2 `src/editor/`，驗收走主 app `/`）。

---

## 3. 自動化對照（單元測試）

| 機器 | id | 佔格 | 分類 |
|------|-----|------|------|
| 粉碎機 | `crusher` | 3×3 | 基礎生產 |
| 塑型機 | `shaping_machine` | 3×3 | 基礎生產 |
| 灌裝機 | （合成製造內） | 6×4 | 合成製造 |
| 分流器 | （物流設備內） | 1×1 | 物流設備 |

---

## 4. 下游消費者（PR 用）

| 誰 | 怎麼用 |
|----|--------|
| 9/6 演示 | 主 app 底部工具列截圖（名稱＋佔格） |
| W0831-S1 MachineCard | 吃 `ToolbarMachineRow`：`id`／`name`／`sizeText` |
| B2 落子 | **本 PR 不接**；等 `EquipmentType`／store 解封 |
| goodmorning G1 | 只做 `PaperFigBottomBar` 視覺；與本 PR 資料列表分開 |

---

## 5. 刻意未改

- `EquipmentType`、`armPlacement`、`setSelectedEquipment`、`dataTransfer` key
- `FactoryCanvas`、`FlowNodeOverlay`、`editorStore` 簽名
- L3 元件未直接 import `src/data/*`（經 `toolbarMachines.ts` 攤平）
