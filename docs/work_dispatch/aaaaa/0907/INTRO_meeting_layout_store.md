# 會議介紹｜W0907-A0 layoutStore（使用／展示／連接）

| meta | value |
|------|-------|
| 週次 | 2026-09-07 → 2026-09-13 |
| 對象 | 週會／協作者（aaaaa 本週工項） |
| 工單 | [W0907-A0](./W0907-A0_layout_store_model.md) |
| PR | [#45](https://github.com/dernoson/endfield-playground/pull/45) |
| 演示頁 | `dev/layout-store-preview.html`（Vite 獨立入口；不經 `src/router`） |
| 執行計畫 | [todolist_v12](../../../aaaaa/dev/todolist_v12.md) |
| 撰寫 | aaaaa |
| 最後更新 | 2026-09-12 |

---

## 0. 三十秒結論

上週 L1（型別＋`resolveConnections`／`toTopology`）已合入。  
本週補上**平行的 `layoutStore`**：L2 之後有統一讀寫入口，**不必碰**舊的 `editorStore`。

| 問 | 答 |
|----|-----|
| 交付什麼？ | store 契約＋可互動 `/dev` 演示＋解鎖句 |
| 解鎖了什麼？ | store 可依賴；**擺放／選取仍鎖**（本週仍只讀） |
| 現場看哪？ | `pnpm dev` → `http://localhost:5173/dev/layout-store-preview.html` |

**解鎖句：**

```text
layout-store：useLayoutStore 可讀寫 devices／pipelines；connections 為 getter；測試綠；L2 可開（本週仍只讀；擺放／選取等 9/14 整合）
```

---

## 1. 使用介紹

### 1.1 這是什麼

| 項目 | 說明 |
|------|------|
| 模組 | `src/store/layoutStore.ts`（Pinia） |
| 持有 | `devices`／`pipelines`（藍圖目標形） |
| 衍生 | `connections`＝**getter**，每次呼叫 `resolveConnections`，**不進**藍圖儲存 |
| 失敗語意 | `PlacementResult`：`{ ok: true }` 或 `{ ok: false; reason: 'overlap' \| 'invalid' }`，**不 throw** |

### 1.2 誰要用、怎麼讀寫

```ts
import { useLayoutStore } from '@/store/layoutStore'

const layout = useLayoutStore()

// 讀（readonly 面；不要直接 mutate 陣列）
layout.devices
layout.pipelines
layout.connections
layout.layoutIssues          // → LayoutIssues；紅框畫這裡指的 id

// 寫（單一操作 → PlacementResult；快照 → LayoutIssues）
layout.loadSnapshot(snapshot) // → LayoutIssues（invalid 與 overlap 並列）
layout.addDevice(device)      // → PlacementResult
layout.moveDevice(id, pos)    // → PlacementResult
layout.removeDevice(id)       // → PlacementResult；管線保留（可斷線）
layout.addPipeline(pipeline)  // → PlacementResult
layout.removePipeline(id)     // → PlacementResult
layout.toSnapshot()           // 匯出；不含 connections
```

### 1.3 和 V11／舊世界的差別

| | V11 `/dev/layout-l1-preview` | V12 `dev/layout-store-preview.html` |
|--|------------------------------|--------------------------------|
| 入口 | 掛在 `src/router` | **獨立 HTML 入口**（不動他人檔、不進 production bundle） |
| 資料路徑 | fixture → 純函式 | fixture／真實機器 → **layoutStore** |
| 能否放置 | 否（只切場景） | 是（預設點／點格） |
| 能否拉 belt | 否 | 是（兩機自動／兩埠自動／手動，BFS 繞機身） |
| undo／redo | 否 | 是（store 內接 `historyStore`） |
| 與 editorStore | 不接 | **不接**（平行新建） |

---

## 2. 功能展示（週會操作腳本）

**準備：** `pnpm dev` → 網址 `http://localhost:5173/dev/layout-store-preview.html`

> 演示頁是開發進度存證，刻意**不掛**在 `src/router`／`DevLayout.vue`（他人本週的檔），  \
> 改用 Vite 的獨立 HTML 入口，兩邊互不牽動。

### 2.1 放置真實機器（約 30 秒）

1. 上方選分類 Tab（來自 `toolbarMachines`，**未改** `ToolbarPanel`）
2. 點一台真實機器（例：塑型機）
3. 按「放到預設點」**或**直接點格點空格
4. 紫條 `devices` 應增加；格上出現佔格；**綠圓＝輸出埠、橙方＝輸入埠**

### 2.2 拉 belt 三種方式（約 45 秒）

1. **點兩機**：點第一台（藍框＝起點）→ 點第二台（紫框＝終點）→「自動拉 belt」
2. **點兩埠**：切「點兩埠拉線」→ 點一個輸出（綠圓）與一個輸入（橙方），順序不限
3. **手動**：切「手動拉線」→ 依序點格 →「完成手動拉線」；斜著點會自動補轉角
4. 應出現綠線；`pipelines`／`connections` 非 0；已接埠變白邊高亮

> 塑型機埠在上下：路徑會 **BFS 繞開機身**，避免誤報 overlap。  \
> belt 一律以輸出為起點；`resolveConnections` 對反向路徑兩端仍非 null，故由頁面擺正。

### 2.3 放置失敗語意（約 15 秒）

1. 故意在已佔格上再放一台
2. 狀態列應顯示 `last=overlap`，**畫面不崩、不 throw**
3. 說明：L2 之後可依回傳值畫紅框

### 2.4 與 L1 頁對照（選講）

同開 `/dev/layout-l1-preview`：只能切 fixture、不經 store。  
V12 頁才是「證明 A0 契約」的演示。

---

## 3. 連接說明（給 L2／下週）

### 3.1 資料流

```text
真實機器列（toolbarMachines）或 mock LayoutSnapshot
        │
        ▼
 layoutStore.loadSnapshot / addDevice / addPipeline / …
        │
        ├─ devices／pipelines（state）
        └─ connections（getter → resolveConnections）
                │
                ├─ 本週：dev/layout-store-preview.html 消費
                └─ 9/14：GridCanvas × viewport 整合再接 store
```

### 3.2 本週誰接、誰不接

| 角色／工項 | 本週 | 說明 |
|------------|------|------|
| toby T1 GridCanvas | **不接 store** | 吃 props／fixture 只讀殼 |
| harry H1 viewport | 無關 | 純座標換算 |
| aaaaa A0 | 交 store＋`/dev` | 完成後**不回頭改** toby／harry 檔 |
| 9/14 整合週 | 再接 | 單一 owner 接 GridCanvas × store |

### 3.3 讀取面約定（給接線的人）

1. 用 `useLayoutStore()`；讀 `devices`／`pipelines`／`connections`／`layoutIssues`
2. **不要**直接 `devices.push(...)`；改呼叫 action
3. 放置／移動先看 `PlacementResult.ok`；`overlap` 帶 `conflicts`、`invalid` 帶 `invalidIds`，紅框只畫這些 id
4. 快照載入看 `LayoutIssues`：`invalidIds` 與 `conflicts` 可能同時非空，兩者都要畫
5. `connections` 不要當可寫 state；改管線／設備後會重算
6. undo／redo 只呼叫 `historyStore.undo()`／`redo()`；**不要**自己組 Command
7. 不要改 `editorStore` 簽名；藍圖 JSON 遷移不在本週

### 3.4 檔案邊界

| 會動（本週已交） | 不要碰 |
|------------------|--------|
| `src/store/layoutStore.ts` | `editorStore` |
| `src/types/layout.ts`（`PlacementResult`） | `GridCanvas.vue` |
| `LayoutStorePreview.vue`＋utils＋獨立入口 | `ToolbarPanel.vue`／`src/router`／`DevLayout.vue` |
| 相關測試 | `FactoryCanvas`／Vue Flow 加深 |

---

## 4. 驗收與連結

| 項目 | 連結 |
|------|------|
| 工單 | [W0907-A0](./W0907-A0_layout_store_model.md) |
| 週大綱 V1 | [WEEK_20260907 §0.1](../../WEEK_20260907.md) |
| 驗收指南 | [V12_acceptance_guide](../../../aaaaa/dev/dev_v12/V12_acceptance_guide.md) |
| 解鎖證據 | [E1_unlock](../../../aaaaa/dev/dev_v12/evidence/E1_unlock.md) |
| PR | [#45](https://github.com/dernoson/endfield-playground/pull/45) |

---

## 5. 收束一句

**這週交付的是「可依賴的佈局 store 契約＋週會看得見」，不是新畫布、也不是產品落子。**
