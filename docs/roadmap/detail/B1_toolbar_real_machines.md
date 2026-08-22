# R-B1 — 工具列接真實機器資料

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §4 |
| 里程碑 | M2（2026-09-27）；首次可演示 9/6 |
| 擋門檻 | **是** |
| 建議主責／備援 | aaaaa（資料側）＋goodmorning／MBD（卡片視覺）／aaaaa 全包 |
| 性質 | 資料 → 畫面 |
| 依賴 | [A2](./A2_grid_and_port_alignment.md)、[E1](./E1_data_codegen_ops.md) |
| 狀態 | `[ ]` 未開始 |
| 最後更新 | 2026-08-22 |

---

## 1. 背景與動機

下方選單是使用者的第一個接觸點，但 `ToolbarPanel` 目前列的是假設備。這造成兩個問題：新成員看不出專案在做什麼遊戲，以及擺放鏈（[B2](./B2_placement_chain.md)）沒有真實 `machineType` 可用，導致下游的佔格、port、配方全部無從對起。

`src/data/machines.ts` 已提供完整查詢介面（`getAllMachines`、`getMachinesByTag`、`MACHINE_TAGS`），V9 也已在 `/dev/flow-engine` 的 `MachineCatalogPanel.vue` 做過 tag 分頁。本項是把已驗證過的 dev 頁作法搬到正式工具列，**不是重新設計資料層**。

## 2. 使用者看得到什麼

下方選單出現分類 Tab，點某一類會列出該類真實機器的名稱與佔格；點卡片能發出「我要放這台」的意圖（實際擺放由 [B2](./B2_placement_chain.md) 完成）。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 工具列 | `src/editor/toolbar/ToolbarPanel.vue` | 清單為假設備 |
| 機器查詢 | `src/data/machines.ts` | `getAllMachines`／`getMachinesByTag`／`MACHINE_TAGS` 可用 |
| 已驗證原型 | `src/app/dev/MachineCatalogPanel.vue` | V9 tag 分頁，可直接參考 |
| 機器外形 | `src/components/MachineShape.vue` | 已支援 `getMachineMode(machine, machineMode?)` |
| 視覺稿 | `docs/paper/` | 選單稿對齊 9/6（見 §8） |
| 圖像資源 | — | **無正式圖**；本項用 placeholder |

## 4. 技術決策

### 4.1 分層切分（本項最重要的一件事）

| 層 | 做什麼 | 誰 |
|----|--------|-----|
| L1 | 提供 `getMachinesByTag`、`MACHINE_TAGS`（已有，不動） | aaaaa |
| L2 | 在工具列容器讀 `machines` 資料，攤平成 plain 卡片 props；接收卡片 emit 後呼叫 `armPlacement` | L2 主責 |
| L3 | 卡片元件只吃 props（`id`、`name`、`sizeText`、`tag`、`iconUrl?`）、只 emit `pick` | goodmorning／MBD |

**L3 卡片不得 import `src/data/machines.ts`**，這與「L3 不 import store」是同一條規則的延伸：L3 不自己取資料。

### 4.2 方案比較：分類 Tab 的範圍

| 方案 | 內容 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 一次上全部 tag | `MACHINE_TAGS` 全列 | 完整 | Tab 過多、無圖時視覺崩壞、9/6 交不出 | 否 |
| **B. 先上 2–3 類常用** | 例如加工類、輸送類、源類 | 9/6 可演示；風險低 | 不完整 | **是** |
| C. 只做搜尋不做 Tab | 單一輸入框 | 最省 | 不會用的人搜不到關鍵字 | 否 |

採 B。9/6 至少一類顯示真實機器名，9/27 前補到 2–3 類。搜尋框列為加分，不擋門檻。

### 4.3 卡片顯示欄位（凍結）

| 欄位 | 來源 | 缺值處理 |
|------|------|----------|
| 名稱 | `machine.name` | 必有 |
| id | `machine.id` | 必有；卡片上可不顯示但需帶在 emit |
| 佔格 | `machine.size` → `"3×2"` | 必有；來源正確性由 [A2](./A2_grid_and_port_alignment.md) 保證 |
| 分類 | `machine.tag` | 無 tag 者歸 `untagged`，不顯示於 Tab |
| 圖 | placeholder | **本項不做正式圖**；缺圖顯示機器名首字方塊 |

### 4.4 emit 契約

```text
卡片 emit: pick(machineId: string)
容器接住 → editorStore.armPlacement(...)
```

卡片**不知道** `armPlacement` 存在，這是 [B2](./B2_placement_chain.md) 的事。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | `src/editor/toolbar/ToolbarPanel.vue` | 容器：改吃 `getMachinesByTag`，攤平 props |
| 新建或修改 | `src/components/MachineCard/Index.vue` | L3 卡片；若已有既有檔則沿用，不新開平行目錄 |
| 唯讀參考 | `src/app/dev/MachineCatalogPanel.vue` | tag 分頁作法 |
| 唯讀 | `src/data/machines.ts` | 不改資料層 |
| **不碰** | `FactoryCanvas.vue`、`editorStore` 簽名、`flowStore` | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 09/06 | 至少一個分類顯示真實機器名與佔格（可無圖、可無搜尋） |
| 09/13 | 卡片 emit `pick` 打通到容器（與 [B2](./B2_placement_chain.md) 對接） |
| 09/20 | 補到 2–3 類；套 paper 視覺稿 |
| 09/27 | **門檻：** 從下方選單拉多種真機器放到畫布 |

## 7. 不做

- 不做正式機器圖像資源
- 不做拖曳排序、我的最愛、最近使用
- 不做搜尋（列為加分項）
- 不在卡片內讀 store 或算任何流量

## 8. 依賴與封鎖

| 依賴 | 說明 |
|------|------|
| [A2](./A2_grid_and_port_alignment.md) | 佔格文字若顯示錯尺寸，等於把資料錯誤搬到選單上 |
| [E1](./E1_data_codegen_ops.md) | `src/data` 須與 `docs/aaaaa/data` 同步 |
| paper 視覺稿 | **不擋門檻**；稿未到就用現有樣式，9/20 再套 |
| L3 人選 | 卡片為加分工單，未交由 aaaaa 以最簡卡片頂替 |

## 9. DoD

- [ ] 工具列至少一個分類列出真實機器（名稱＋佔格文字）
- [ ] 佔格文字與 `machine.size` 一致（抽查 3 台）
- [ ] L3 卡片不 import `src/data/*` 與任何 store（code review 確認）
- [ ] 點卡片會 emit `pick(machineId)`，容器收得到（可先只 console 驗證）
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 無圖導致視覺難看被當成未完成 | 30 秒驗收只看「名稱與佔格是真的」，明寫圖不驗 |
| goodmorning／MBD 未交卡片 | 容器直接用最簡 `<button>` 列表頂替，門檻仍成立 |
| 有人在卡片裡直接 import 資料 | code review 硬擋；[E2](./E2_layer_guard_pr_rules.md) 列為退回理由 |
| Tab 數量膨脹 | §4.2 限 2–3 類，超出改期到 10 月 |

**未交頂替：** L3 卡片可丟棄，容器與資料側不可丟棄。

## 11. 開發日誌

### 2026-08-22
- 建檔。tag 分頁作法確認可沿用 V9 `MachineCatalogPanel.vue`，不重新設計
