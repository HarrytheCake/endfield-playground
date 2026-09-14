# V12 TODOLIST — 佈局 store 契約（`layoutStore`｜本週 aaaaa）

**版本：** V12  
**建立日期：** 2026-09-11  
**負責人：** aaaaa  
**前置：** V11 A–H 程式已合入（PR [#40](https://github.com/dernoson/endfield-playground/pull/40)、[#43](https://github.com/dernoson/endfield-playground/pull/43)）；文件殘項本版收斂  
**正式工單：** [W0907-A0](../../work_dispatch/aaaaa/0907/W0907-A0_layout_store_model.md)（最優・擋 9/27 前置）  
**上游：** [WEEK_20260907](../../work_dispatch/WEEK_20260907.md) v1.1、[ROADMAP_OUTLINE](../../roadmap/ROADMAP_OUTLINE.md) v1.6 R-B2、[EARLY_START](../LAYOUT_REWRITE_EARLY_START_0831.md)  
**門檻週：** 2026-09-07 → 2026-09-13  
**開發分支：** `dev/aaaaa0907`（建議）  
**狀態總覽：** `[x]` A–E 完成（E1 待 PR 合入；證據與解鎖句已落）  
**驗收指南：** [dev_v12/V12_acceptance_guide.md](./dev_v12/V12_acceptance_guide.md)  
**解鎖證據：** [dev_v12/evidence/E1_unlock.md](./dev_v12/evidence/E1_unlock.md)

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）
>
> **範圍宣告：** 本版＝本週 aaaaa 工項（A0）。**無次優功能刀**；`ToolbarPanel` 全員硬鎖。  
> **執行計畫：** 本檔＋`dev_v12/` **即為** layout store 執行計畫檔。

---

## 概述

### 目標

1. **補完上週解鎖句尾巴：** 交出可依賴的 `layoutStore`（devices／pipelines／getter `connections`）
2. **不動 `editorStore`：** 平行新建；舊 store 測試原樣綠
3. **契約四釘：** connections＝getter；action 回傳不 throw；L2 讀取面 `readonly()`；`LayoutSnapshot` 進出對稱
4. **`/dev` store 演示必要**（週會報告用）
5. **解鎖句：** 達則 `layout-store：…；L2 可開 …`；未達擺放鏈則明寫「本週仍只讀」

### 已定案（2026-09-11｜負責人確認）

| # | 項 | 結論 |
|---|----|------|
| 1 | 版本 | **V12**＝W0907-A0；不延續 V11 開新刀 |
| 2 | store 形狀 | **單一 Pinia store**（不另拆 composable） |
| 3 | L2 唯讀面 | return 用 **`readonly()`**；本週 toby 仍吃 props、不接 store |
| 4 | 放置合法性 | `{ ok: true } \| { ok: false; reason: 'overlap' \| … }`；**不 throw** |
| 5 | `/dev` 演示 | **本版必要**（週會報告） |
| 6 | 解鎖句 | 完成則發 `layout-store：…`；**不提前解鎖擺放** → 未到則「本週仍只讀」 |
| 7 | V11 殘項 | 文件狀態收斂進本版前置；程式已由主編 PR merge |
| 8 | 分支 | `dev/aaaaa0907` |
| 9 | ToolbarPanel | **全員硬鎖**（含 aaaaa） |

詳見 [A1_scope_decision.md](./dev_v12/A1_scope_decision.md)。

### 非目標（本版不做）

- 改寫／遷移 `editorStore`；藍圖 JSON `nodes`／`edges` → `devices`／`pipelines`
- 改 `GridCanvas.vue`／`useGridViewport.ts`／router（toby／harry 檔）
- C2 連線契約重訂、D4 藍圖格式重訂、R-B2 擺放鏈產品化
- 加深舊 `FactoryCanvas`／Vue Flow
- 動 `ToolbarPanel.vue`

### 流程大綱

```text
A 定案 → B V11 殘項收斂（前置）
      → C layoutStore 契約＋測試
      → D /dev store 演示（週會）
      → E 驗收＋解鎖句／PR
```

### 週切片

| 區間 | 切片 | 對應 |
|------|------|------|
| → 約 9/12 | 定案落檔；V11 文件收斂；store 骨架＋四釘測 | A1、B1、C1 |
| → 約 9/13 | `/dev` 演示；品質閘；解鎖句或「本週仍只讀」；PR | D1、E1 |

### 下游消費者（PR 必寫）

```text
下游消費者：
- L2（toby T1）：本週仍吃 props／fixture；9/14 再接 layoutStore
- L2（harry H1）：純座標，與 store 無關
- B2 擺放鏈：等本版 store 契約＋殼可擺放；本週不接落子、不解鎖擺放
- FlowEngine：仍經 toTopology；本版不改引擎
```

### layout-store 解鎖句（達門檻時發）

```text
layout-store：useLayoutStore 可讀寫 devices／pipelines；connections 為 getter；測試綠；L2 可開 <允許的下一刀或「本週仍只讀」>
```

未達則 PR／Discord 寫明「尚未解鎖、缺什麼」。**不提前解鎖擺放／選取。**

---

## V12-A｜範圍與定案

- [x] **V12-A1** 9 項決策落版；與 A0／V11／L2 邊界
  - 細項：[dev_v12/A1_scope_decision.md](./dev_v12/A1_scope_decision.md)

---

## V12-B｜V11 殘項收斂（前置）

- [x] **V12-B1** 交叉比對 PR #40／#43 已合入；回寫 V11 todolist／acceptance／H1 證據狀態；確認無程式殘刀帶入
  - 細項：[dev_v12/B1_v11_residue_close.md](./dev_v12/B1_v11_residue_close.md)

---

## V12-C｜layoutStore 契約

- [x] **V12-C1** `src/store/layoutStore.ts`：單一 Pinia；state＝devices／pipelines；`connections` getter；action 最小集＋`PlacementResult`；return `readonly()`；測試釘 §3 四點
  - 細項：[dev_v12/C1_layout_store.md](./dev_v12/C1_layout_store.md)
  - 產物：`src/store/layoutStore.ts`、`src/__tests__/store/layoutStore.test.ts`；`PlacementResult` 於 `types/layout.ts`

---

## V12-D｜／dev store 演示（週會必要）

- [x] **V12-D1** `/dev` 頁：載入 mock fixture → 經 `layoutStore` 顯示 devices／pipelines／connections；可切換已連接／斷線；不接 editorStore
  - 細項：[dev_v12/D1_dev_store_preview.md](./dev_v12/D1_dev_store_preview.md)
  - 產物：`LayoutStorePreview.vue`；獨立入口 `dev/layout-store-preview.html`（不掛 `src/router`／`DevLayout`）

---

## V12-E｜驗收、PR、解鎖句

- [x] **V12-E1** 品質閘；PR；讀取面簽章；解鎖句或「本週仍只讀」
  - 細項：[dev_v12/E1_acceptance_and_unlock.md](./dev_v12/E1_acceptance_and_unlock.md)
  - 驗收：[dev_v12/V12_acceptance_guide.md](./dev_v12/V12_acceptance_guide.md)
  - 證據：[dev_v12/evidence/E1_unlock.md](./dev_v12/evidence/E1_unlock.md)

---

## 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 解除條件 |
|----|---------|---------|----------|
| B1 | — | — | **已解除**（文件收斂完成） |
| C1 | — | — | **已解除**（layoutStore＋四釘測綠） |
| D1 | — | — | **已解除**（`dev/layout-store-preview.html` 獨立入口） |
| E1 | — | — | **已解除**（證據＋解鎖句；PR 待合入） |
| — | **不動** editorStore／ToolbarPanel／GridCanvas／viewport | — | 本版硬鎖 |

---

## 完成定義（Definition of Done）

### A0 主線（對照 WEEK §0.1 V1）

- [x] `src/store/layoutStore.ts` 在 master 或可審 PR
- [x] `connections` 為 getter（呼叫 `resolveConnections`）；非 state
- [x] action 最小集：載入快照、加／刪設備、移動、加／刪管線；重疊回傳 `PlacementResult`
- [x] return 面 `readonly()`；測試證明不可直接 mutate 讀取面
- [x] `loadSnapshot(toLayoutSnapshot(scenario))` 再匯出等值
- [x] `pnpm test src/__tests__/store/layoutStore.test.ts` 綠
- [x] `pnpm test src/__tests__/store/editorStore.test.ts` 原樣綠
- [x] `pnpm type-check` 綠
- [x] `/dev` store 演示可跑（週會）
- [x] PR body：讀取面簽章＋解鎖句（或「本週仍只讀」）

### 品質閘

- [x] type-check／本範圍 test 可過（51 tests：layoutStore＋editorStore＋previewUtils）
- [x] diff 未改 `editorStore` 簽名、未碰 `GridCanvas`／`ToolbarPanel`／`FactoryCanvas`

---

## 未交頂替

| 工項 | 未交影響 |
|------|----------|
| C1 store 契約 | **無頂替**；9/27 門檻再縮（主編週會定） |
| D1 `/dev` | **本版必要**；未交則週會無法演示，E1 不得標個人驗收完成 |
| 解鎖擺放 | **本版刻意不發**；L2 維持只讀 |

---

## 本週工項檢核（對照 W0907-A0）

| 工項 | 工單要求 | V12 狀態 | 備註 |
|------|----------|----------|------|
| A1 定案 | 形狀／唯讀／回傳／dev／解鎖 | [x] | 9 項 |
| B1 殘項 | V11 文件收斂 | [x] | 前置完成 |
| C1 store | layoutStore＋四釘測 | [x] | 測綠；擋門檻程式面完成 |
| D1 演示 | /dev 週會 | [x] | `dev/layout-store-preview.html`（獨立入口） |
| E1 驗收 | 品質閘＋解鎖句 | [x] | 見 evidence/E1_unlock |

---

## 開發日誌

### 2026-09-12

- **V12-E1 完成：** 品質閘 51 tests 綠；`evidence/E1_unlock.md`；解鎖句明寫本週仍只讀；PR [#45](https://github.com/dernoson/endfield-playground/pull/45)

### 2026-09-11

- 依 W0907-A0、WEEK v1.1 開 V12
- 負責人確認 9 項決策（單一 store／readonly／PlacementResult／dev 必要／不解鎖擺放）
- 交叉比對：PR #40（9/1）、#43（9/4）皆已 MERGED；V11 程式無殘刀，僅文件狀態待收斂 → B1
- **V12-B1 完成：** 回寫 todolist_v11／V11_acceptance／H1／evidence；CLAUDE 索引 V11→完成、V12→現行；AGENT_ROADMAP v1.6
- **V12-C1 完成：** `layoutStore`＋`PlacementResult`；四釘測綠；`editorStore` 測原樣綠；type-check 過；`addPipeline` 亦做佔格檢查
- **V12-D1 完成：** `/dev/layout-store-preview`；真實機器＋預設／點格放置＋自動 belt；未接 editorStore
- 分支建議：`dev/aaaaa0907`

### 2026-09-14

- **PR [#45](https://github.com/dernoson/endfield-playground/pull/45) review 修訂：**
  - §1 `loadSnapshot` 全量評估；`PlacementResult` 帶 `conflicts`／`invalidIds`；操作只歸咎涉及的 id；另出 `layoutIssues`
  - §2 `addPipeline` 補座標檢查；併同擋「<2 點」與「非軸對齊」（`getPipelineOccupiedCells` 前置條件）
  - §3 `removeDevice`／`removePipeline` 改回 `PlacementResult`
  - §4 store return 成員補 JSDoc
  - §5 撤回 `src/router`／`DevLayout.vue`；dev 頁改 Vite 獨立 HTML 入口（進度存證頁與主線互不牽動）
  - §6 所有變更 action 經 `historyStore` 組 Command；dev 頁有 Undo／Redo
  - §7 補點兩埠自動拉線與手動拉線；併修埠方向、手動轉角、undo 後選取殘留
- 品質閘：41 檔 772 測試綠；type-check／lint／format 綠；`pnpm build` 不含 dev 頁

### 2026-09-15（第二輪 review 修訂）

- **§1 聚合回報：** 新增 `LayoutIssues`（`ok`／`invalidIds`／`conflicts`），`layoutIssues` 與
  `loadSnapshot` 改回此型別，invalid 與 overlap **同時**回報；載入時併查設備座標與重複 id
  （設備／管線共用一個 id 命名空間），不合法者排除於佔格之外，`move`／`remove` 遇 id 不唯一亦擋下
- **§2 z 有限數：** `addDevice`／`moveDevice` 改用 `positionFinite`（x／y／z），
  修掉 z 為 `NaN`／`Infinity` 時被回報成 `overlap: [['a','a']]` 的問題
- **§3 演示頁掛法：** 說明「共用 store／污染 history」與「非工項交付物」後，
  主編確認維持獨立 HTML 入口（見 [D1 §2.1](./dev_v12/D1_dev_store_preview.md)）
- **§4 `historyStore` 全域堆疊：** 本 PR 不處理，保留於 PR 說明「待決」
- 品質閘：41 檔 **784** 測試綠；type-check／lint 綠
