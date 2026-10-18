# 會議介紹｜aaaaa 本線：C5 寫入／#73 查表＋引擎讀／#58 歷史隔離

| meta | value |
|------|-------|
| 週次 | 2026-10-11 → 2026-10-18（寫入端）；接續 10/18 → 10/25（引擎讀／查表） |
| 對象 | 週會／協作者（aaaaa 本線工項） |
| 工單 | [W1011-A0](./W1011-A0_c5_primary_output.md) |
| Issue | [#73](https://github.com/dernoson/endfield-playground/issues/73)（查表）；[#58](https://github.com/dernoson/endfield-playground/issues/58)（歷史隔離｜**仍 OPEN**） |
| PR | [#72](https://github.com/dernoson/endfield-playground/pull/72) **MERGED**；[#74](https://github.com/dernoson/endfield-playground/pull/74) 交審中（Closes #73） |
| 執行計畫 | [todolist_v16](../../../aaaaa/dev/todolist_v16.md)（寫入）、[todolist_v17](../../../aaaaa/dev/todolist_v17.md)（查表＋引擎讀） |
| 正式依據 | [C5](../../../roadmap/detail/C5_source_primary_output.md)、[WEEK_20261011](../../WEEK_20261011.md) V8、[#57](https://github.com/dernoson/endfield-playground/pull/57) S1-2 |
| 撰寫 | aaaaa |
| 最後更新 | 2026-10-18 |

---

## 0. 三十秒結論

C5 要讓「源設備選一種基礎材料 → 引擎算出每分鐘產多少」。本線拆兩段交付，另有一則正式頁／dev 歷史隔離債：

| 段 | 交付 | 狀態 |
|----|------|------|
| **寫入端（1011／V16）** | `layoutStore.setDevicePrimaryOutput`；欄位＝`primaryOutput`／`sourceRatePerMin` | [#72](https://github.com/dernoson/endfield-playground/pull/72) **已合 master** |
| **讀取端＋查表（1018／V17）** | 機型一律能用英文 id 查；驗證／引擎對齊；經 `toTopology` 餵引擎可測出 **30/min** | [#74](https://github.com/dernoson/endfield-playground/pull/74) 交審中 |
| **歷史隔離（#58）** | dev／正式頁 Undo 互不影響；正式頁**不**自動載示範快照 | [#58](https://github.com/dernoson/endfield-playground/issues/58) **仍 OPEN**；已納入 **V17-H**（[H1](../../../aaaaa/dev/dev_v17/H1_stop_auto_demo_snapshot.md)／[H2](../../../aaaaa/dev/dev_v17/H2_clear_history_on_context_switch.md)／[H3](../../../aaaaa/dev/dev_v17/H3_history_isolation_acceptance.md)；實作未開始） |

| 問 | 答 |
|----|-----|
| 為什麼拆兩段？ | 寫入與讀取可獨立驗收；#72 PR 已註明接法＝經 `toTopology` |
| 現場看數字怎麼證？ | 單元測試產線（見 §3）；正式 UI 表單／右側產耗**本線不做** |
| Ctrl+Z 會清掉正式頁？ | **會**——#58：共用 `historyStore`＋開頁 `loadSnapshot(connected)` 會進堆疊（見 §3.5） |
| 解鎖句？ | **不發**（本線屬契約／查表修正，非畫面解鎖） |

```text
資料流（已打通可測路徑）：

  layoutStore.setDevicePrimaryOutput(uid, '源礦', 30)
        │
        ▼
  PlacedDevice.primaryOutput / sourceRatePerMin
        │
        ▼
  toTopology(devices, pipelines, connections)
        │  data.machineType＝英文 id；帶上 primaryOutput
        ▼
  buildGraph → validateChains → propagateFlows
        │
        ▼
  源產出 30/min → 粉碎機吞吐 30 → sink 收入 30
```

---

## 1. 本週工項說明

### 1.1 工項一覽

| # | 名稱 | Issue／PR | 做什麼 | 不做什麼 |
|---|------|-----------|--------|----------|
| A | C5 寫入 action | [#72](https://github.com/dernoson/endfield-playground/pull/72) | `setDevicePrimaryOutput`；進歷史；可 Undo | 正式頁下拉、右側產耗表、改 `editorStore` |
| B | 機型查表統一 | [#73](https://github.com/dernoson/endfield-playground/issues/73)／[#74](https://github.com/dernoson/endfield-playground/pull/74) | `resolveMachineDef`；驗證 getDef／E004／W001；引擎查定義改 id | 廢 `getMachine`、配方資料改英文鍵、重開 W001 A-5 |
| C | 引擎讀最小切片 | 同上（#73 驗收-2） | 測試：`toTopology` → 引擎；源→粉碎→sink 各 30/min | `/dev` 改掛 layoutStore（F1-B）、整包 ProductionStats |
| D | 歷史隔離＋停載示範 | [#58](https://github.com/dernoson/endfield-playground/issues/58)｜**OPEN** | V17-H：停自動 fixture＋情境 `history.clear()`（§1.4）；**實作下一刀** | 雙 Pinia、本版預設清 layoutStore |

### 1.2 為什麼需要 B（#73）

新模型 `PlacedDevice.machineType`＝**英文 id**（例：`crusher`），`toTopology` 原樣傳出。  
舊驗證／引擎用 `getMachine(中文名)` 查表。若只接 layoutStore 不改查表：

- E004／W001：查不到定義 → 全部略過 → **無警示**
- 引擎：源不識為源、配方全空 → **無產耗數字**

故 #73 是「改讀 layoutStore 之前」的前置修正，與 #72 預告的引擎讀切片一併完成。

### 1.3 與週大綱的對應

| 週大綱 | 本線對應 |
|--------|----------|
| WEEK_20261011 **V8**（C5 寫入） | A → #72 |
| WEEK 註：10/18 引擎讀最小切片 | C → #74 內 F1＝A（測試餵入） |
| C5 §4.1a 裁決 B | 寫 `layoutStore`；不雙寫 `editorStore` |
| #57 S1-2／W1004「正式頁 fixture」債 | D → #58（仍 OPEN） |

### 1.4 [#58](https://github.com/dernoson/endfield-playground/issues/58)｜dev／正式頁操作歷史需分離（OPEN）

**問題（現況）：**

- `/dev/*` 與正式頁 `/` **共用同一個 Pinia** → 共用同一份 `historyStore`
- 在 A 頁產生的 Undo／Redo 堆疊，切到 B 頁後仍在；按 **Ctrl+Z** 會撤銷**另一頁**的操作
- 會寫入 `historyStore` 的 dev 頁目前包括：`HistoryReplay.vue`、`LayoutStorePreview.vue`、`PaperFigMainField.vue`

**相關現象（正式頁）：**

- `LayoutView.vue` 在 `onMounted` 且 `devices.length === 0` 時呼叫 `loadSnapshot(connected)` 示範快照
- 該次 `loadSnapshot` **會推入一筆歷史**
- 連按 Ctrl+Z 會把示範資料一併撤掉 → **畫布變空白**
- 此行為原出自 toby 0914 整合指南；**負責人已裁：正式頁不應自動載示範；示範屬 dev 用途**

**期望（尚未實作）：**

| # | 期望 | 備註 |
|---|------|------|
| 1 | dev 與正式頁的操作歷史**互不影響** | 初步方向：切換路由時 `historyStore.clear()`（實作細節待決） |
| 2 | 正式頁開頁**不**自動 `loadSnapshot(connected)` | 若仍需示範，改由 `/dev` 頁提供 |
| 3 | 既有空白畫布仍可驗收 | 需與 toby／harry 對「空畫布怎麼演示放置」 |

**本週狀態：** **未修程式**；已納入 [todolist_v17](../../../aaaaa/dev/todolist_v17.md) **V17-H** 並建細項。  
W1004／toby 0921 曾暫緩以免與 T1 搶檔；現 #58 為 V17 第二主線，實作時 PR 知會 toby／harry（空畫布驗收改手動）。

---

## 2. 名詞解釋

| 名詞 | 意義 | 易混點 |
|------|------|--------|
| **`PlacedDevice`** | 佈局領域「已放置設備」；存於 `layoutStore.devices` | 不是 Vue Flow 的 `FactoryNode`；經 `toTopology` 才轉成節點 |
| **`machineType`（新模型）** | 機器定義的**英文 id**（snake_case），例：`material_source`、`crusher`、`item_sink` | 舊 `editorStore`／部分 dev 頁仍可能是**中文名**（`粉碎機`） |
| **`Machine.id`／`Machine.name`** | `id`＝英文；`name`＝中文顯示名 | 查**定義**用 id；查**配方**目前仍用 `name` |
| **`getMachine`／`getMachineById`** | 分別以中文名／英文 id 查 `machines.ts` | 新路徑權威＝`getMachineById` |
| **`resolveMachineDef`** | `getMachineById(x) ?? getMachine(x)`；過渡雙查 | 移除時機：正式頁與驗證／引擎不再消費中文 `machineType` 之後 |
| **`primaryOutput`** | 源設備選定產出的品項名（字串，例：`源礦`） | 不是配方 index；缺此欄 → 引擎不產數字 |
| **`sourceRatePerMin`** | 源設備產出速率（個／分）；省略時 action 預設 **30** | 受傳送帶上限（belt＝30）約束時，鏈上常落在 30 |
| **`toTopology`** | `devices`＋`pipelines`＋`connections` → `FactoryNode[]`／`FactoryEdge[]` | **不**改引擎本體；只做 adapter |
| **`ValidationContext.getDef`** | 驗證偵測器查機器定義的唯一入口 | E004／W001 **禁止**再直接呼叫 `getMachine` |
| **E004** | 有配方需輸入的加工機卻無入邊 → error | 源機（`is_source`）略過 |
| **W001** | 上游材料與目前 mode 配方不符 → warning | A-5（只比對目前 mode）本線**未改語意**，只改查表 |
| **配方鍵** | `getRecipesForMachine(machineDef.name, modeId)` | 資料層仍以**中文名**為鍵；**不要**把英文 id 直接當配方鍵 |
| **F1＝A／B** | A＝單元測試經 `toTopology` 餵引擎（必交）；B＝`/dev` 掛 layoutStore（加分，本版未做） | 會議上勿把「測試產線綠」說成「正式頁已掛引擎」 |
| **`historyStore`** | 全域 Undo／Redo 堆疊（Pinia）；`execute`／`undo`／`redo`／**`clear()`** | 目前**只有一份**；dev 與正式頁共用 |
| **`loadSnapshot`** | `layoutStore` 整包載入 devices／pipelines；**會進歷史** | 正式頁開頁自動載 `connected`＝#58 現象來源之一 |
| **`connected` 示範快照** | `getMockLayoutScenario('connected')` → 已接線的 fixture | 屬 **dev 用途**；負責人裁正式頁不應自動載 |

### 2.1 常見設備 id（演示用）

| 中文名 | 英文 id | 角色 |
|--------|---------|------|
| 基礎材料輸出點 | `material_source` | 源（`is_source`）；需 `primaryOutput` |
| 粉碎機 | `crusher` | 加工 |
| 物品輸入口 | `item_sink` | 匯（`is_sink`）；產耗統計交貨點 |

---

## 3. 演示方法／使用說明

### 3.1 寫入端：`setDevicePrimaryOutput`（#72｜已合）

**程式用法：**

```ts
import { useLayoutStore } from '@/store/layoutStore'

const layout = useLayoutStore()

// 設定：寫入 primaryOutput；省略速率 → 30；進歷史
layout.setDevicePrimaryOutput(deviceUid, '源礦')
layout.setDevicePrimaryOutput(deviceUid, '源礦', 15)

// 清除
layout.setDevicePrimaryOutput(deviceUid, null)

// 未知／重複 uid → 靜默 no-op，不進歷史
```

**現場怎麼證（無正式 UI 時）：**

```bash
pnpm test -- src/__tests__/store/layoutStore.primaryOutput.test.ts
```

預期：設定／自訂速率／清除／Undo／未知 uid 全綠。

**`toTopology` 是否帶出欄位：** 已映射；設定後轉拓樸，節點 `data.primaryOutput`／`data.sourceRatePerMin` 應有值。

### 3.2 查表：`resolveMachineDef`（#74｜C1）

```ts
import { resolveMachineDef } from '@/data/machines'

resolveMachineDef('crusher')  // → Machine（粉碎機）
resolveMachineDef('粉碎機')   // → 同一台（過渡）
resolveMachineDef('nope')     // → undefined
```

**驗證路徑：** `useValidation` 的 `getDef`＝`resolveMachineDef`。  
偵測器只呼叫 `ctx.getDef(machineType)`。

```bash
pnpm test -- src/__tests__/data/machines.test.ts
pnpm test -- src/__tests__/lib/validation/detectors/E004_missingInput.test.ts
pnpm test -- src/__tests__/lib/validation/detectors/W001_unmatchedMaterial.test.ts
```

重點案：E004 **T10**（英文 id 加工機無入邊）、W001 **T19**（英文 id＋材料不符）。

### 3.3 引擎讀切片：toTopology → 30/min（#74｜F1＝A）

**這是週會最該播的一條**（證明「有欄位 → 有數字」）：

```bash
pnpm test -- src/__tests__/flowEngine.topology.layout.test.ts
```

產線（全英文 id）：

```text
material_source（primaryOutput=源礦, 30/min）
  --belt--> crusher
  --belt--> item_sink
```

預期：

| 檢查點 | 預期 |
|--------|------|
| 源 | `isSource`；產出源礦 30/min |
| 粉碎機 | 合法；效率 1；入源礦 30、出源石粉末 30 |
| sink | 收入源石粉末 30 |
| 缺 `primaryOutput` | 源無產出數字；下游無邊流量（與現行引擎一致） |

**手動 `/dev` 頁（相容煙測，非本線新功能）：**

```bash
pnpm dev
# http://localhost:5173/dev/validation-test
# http://localhost:5173/dev/flow-engine-test
```

這兩頁仍吃舊 `editorStore`（中文名）；靠雙查過渡，**不應因 #74 掛掉**。正式「layoutStore 掛引擎」畫面＝F1-B，**本版未做**。

### 3.4 品質閘（合入標準）

```bash
pnpm type-check
pnpm lint-check
pnpm format-check
pnpm test
```

#74 開 PR 當下：四項綠；**961** tests。

### 3.5 [#58] 現象演示（bug 復現｜尚未修復）

**目的：** 週會 30 秒講清楚「為什麼正式頁 Ctrl+Z 會變空白／dev 會污染正式頁」。

**準備：** `pnpm dev`

#### A. 正式頁開頁示範進歷史 → Ctrl+Z 變空白

1. 開新分頁進正式頁 `/`（或硬重新整理，確保 `layoutStore` 空）
2. 應看到 **connected 示範產線**（非空白）——來自 `LayoutView` `onMounted` → `loadSnapshot(...)`
3. 連按 **Ctrl+Z**
4. **現況：** 示範被撤銷 → 畫布空白  
5. **期望（#58）：** 開頁根本不載示範；或該載入**不進** Undo 堆疊

#### B. dev ↔ 正式頁歷史互相污染

1. 開 `/dev/layout-store-preview.html`（或會寫 history 的其它 `/dev/*`）
2. 在 dev 頁做幾次放置／拉線／Undo 可見的操作
3. 不關分頁，切回正式頁 `/`
4. 按 **Ctrl+Z**
5. **現況：** 可能撤銷到 **dev 頁留下的 Command**（或反之）  
6. **期望：** 切換路由時歷史已清空（或分堆疊），兩頁互不影響

> `historyStore` 已有 `clear()`；#58 初步方向是在 **dev ↔ 正式** 切換時呼叫，細節（誰 watch router、是否連 `layoutStore` 一併重置）仍待決。

---

## 4. 下游串接用法

### 4.1 誰會用到什麼

| 下游角色／模組 | 應怎麼接 | 不要做 |
|----------------|----------|--------|
| **正式頁／左面板表單**（harry 等，C5 UI） | 選中源設備後呼叫 `layout.setDevicePrimaryOutput(uid, itemId, rate?)` | 雙寫 `editorStore.primaryOutput`；自己發明第二個欄位名 |
| **驗證改讀 layoutStore**（#57 S5-2） | 組 `ValidationContext` 時 `getDef: resolveMachineDef`；設備 `machineType` 用英文 id | 偵測器內再 `import { getMachine }` |
| **引擎掛正式畫布** | `toTopology(layout.devices, layout.pipelines, layout.connections)` → 既有 `buildGraph`／`propagateFlows`（或之後的 store 掛載點） | 引擎直接深耦合 `layoutStore` 當唯一路徑（V16-D1 已否決方案 B）；不要雙寫 editor |
| **azure／配方警示** | 繼續維護 E004／W001 **語意**；查表已對齊 id | 本線未改 A-5；勿當本 PR 重開模式裁決 |
| **產耗右側表（roadmap D1）** | 等引擎有數字後再接 summary UI | 本線不做 ProductionStats 整包 |
| **toby／畫布拖曳** | 無關 C5 寫入；繼續用 `moveDevice` | 勿改 `GridCanvas` 來「順便」掛 primaryOutput |
| **正式頁／dev 歷史（#58）** | 見 §4.5；修時需動 `LayoutView`＋路由邊界 | 勿在未對齊 toby／harry 前「順便」刪開頁 fixture |

### 4.2 建議呼叫片段（給接線的人）

**寫入（UI／action）：**

```ts
// 使用者在面板選「源礦」
layout.setDevicePrimaryOutput(selectedDeviceId, '源礦', 30)
```

**讀取建圖（未來正式掛載，對齊 #74 測試）：**

```ts
import { toTopology } from '@/utils/layout/toTopology'
import {
  buildGraph,
  validateChains,
  topologicalSort,
  propagateFlows,
  calcItemSummary,
} from '@/composables/useFlowEngine'

const { nodes, edges } = toTopology(
  layout.devices,
  layout.pipelines,
  layout.connections, // getter
)
const graph = buildGraph(nodes, edges)
validateChains(graph)
const flows = propagateFlows(topologicalSort(graph), graph)
const summary = calcItemSummary(graph)
```

**查機型（任何新碼）：**

```ts
import { resolveMachineDef } from '@/data/machines'
// 或只在確認輸入必為英文 id 時：
import { getMachineById } from '@/data/machines'
```

### 4.3 資料契約速查

| 欄位 | 誰寫 | 誰讀 | 鍵／型別 |
|------|------|------|----------|
| `PlacedDevice.machineType` | 放置流程（既有） | `toTopology`、驗證、引擎 | **英文 id** |
| `PlacedDevice.primaryOutput` | `setDevicePrimaryOutput` | `toTopology` → 引擎源節點 | 品項名字串 |
| `PlacedDevice.sourceRatePerMin` | 同上（可省略＝30） | 同上 | number |
| 配方表 | 資料層（不動） | `getRecipesForMachine(name, mode)` | **中文 name** |

### 4.4 移除雙查的時機（給日後清債）

當下列皆成立，可把 `resolveMachineDef` 收成只呼叫 `getMachineById`：

1. 正式頁與驗證／引擎**不再**消費中文 `machineType`
2. `/dev/validation-test`、`/dev/flow-engine-test` 已遷完或廢止中文 fixture
3. #57 S4-1／S5-2（改讀 layoutStore）完成

### 4.5 [#58] 修好之後誰怎麼接（V17-H｜文件已定、程式未交）

執行細項：

| 細項 | 內容 |
|------|------|
| [H1](../../../aaaaa/dev/dev_v17/H1_stop_auto_demo_snapshot.md) | 正式頁停自動 `loadSnapshot(connected)` |
| [H2](../../../aaaaa/dev/dev_v17/H2_clear_history_on_context_switch.md) | 跨正式／dev → `historyStore.clear()` |
| [H3](../../../aaaaa/dev/dev_v17/H3_history_isolation_acceptance.md) | 驗收＋PR（Closes #58；與 #74 分線） |

| 角色 | 修好後的用法／影響 |
|------|-------------------|
| **正式頁使用者** | 開 `/`＝空畫布；Ctrl+Z 不會清掉「進頁示範」 |
| **dev 頁作者** | 切回正式頁不帶走 Undo 堆疊 |
| **路由／殼層** | 跨情境 `clear()`；**不**預設重置 `layoutStore`（H2） |
| **toby／harry** | 空畫布驗收改手動；勿再依賴自動 `connected` |
| **測試** | ① mount 不載 fixture；② 跨界後 `undoDepth === 0` |

```ts
import { useHistoryStore } from '@/store/historyStore'
useHistoryStore().clear()
```

---

## 5. 驗收對照與連結

| 驗收項 | 證據／狀態 |
|--------|------------|
| 英文 id 餵入 → E004／W001 有警示 | T10／T19；[#74](https://github.com/dernoson/endfield-playground/pull/74) |
| `toTopology` → 引擎產耗各 30/min | `flowEngine.topology.layout.test.ts` |
| dev 頁不壞 | 中文名回歸測綠；手動待 reviewer |
| 品質閘全綠 | type／lint／format／test |
| C5 寫入 action | [#72](https://github.com/dernoson/endfield-playground/pull/72) MERGED |
| #58 歷史隔離＋停載示範 | **未交程式**；V17-H 文件已開；現象 §3.5；接法 §4.5 |

| 項目 | 連結 |
|------|------|
| 工單 | [W1011-A0](./W1011-A0_c5_primary_output.md) |
| Issue（查表） | [#73](https://github.com/dernoson/endfield-playground/issues/73) |
| Issue（歷史） | [#58](https://github.com/dernoson/endfield-playground/issues/58) |
| PR 寫入 | [#72](https://github.com/dernoson/endfield-playground/pull/72) |
| PR 查表＋引擎讀 | [#74](https://github.com/dernoson/endfield-playground/pull/74) |
| #57 S1-2 | [PR #57](https://github.com/dernoson/endfield-playground/pull/57) |
| V16 執行計畫 | [todolist_v16](../../../aaaaa/dev/todolist_v16.md) |
| V17 執行計畫 | [todolist_v17](../../../aaaaa/dev/todolist_v17.md) |
| 引擎讀接法定案 | [V16-D1](../../../aaaaa/dev/dev_v16/D1_engine_read_path.md) |
| Agent 週摘要 | [AGENT_WEEK_1011](../../../aaaaa/claude/AGENT_WEEK_1011.md)、[AGENT_WEEK_1018](../../../aaaaa/claude/AGENT_WEEK_1018.md) |

---

## 6. 收束一句

**已交：** 源素材能寫進 `layoutStore`，英文 id 拓樸能被驗證／引擎認出來並算出 30/min。  
**未交／需知情：** #58——dev 與正式頁仍共用 Undo 堆疊，正式頁開頁仍會自動載示範且進歷史。  
**不是本線：** 正式表單、右側產耗整包。
