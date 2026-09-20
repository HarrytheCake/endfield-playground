# V13-C2 — R-D4 藍圖格式重訂（新模型）

**對應工項：** V13-C2
**狀態：** `[ ]` 未開始
**日期：** 2026-09-19
**依賴：** [A1](./A1_scope_decision.md)（定案 #3／#4）、[C1](./C1_c2_connect_contract.md)（§4.4 匯入端過濾引用其規則表）
**產物：** 改寫 [roadmap/detail/D4](../../../roadmap/detail/D4_blueprint_json_io.md) §3／§4／§5／§8／§10／§11，狀態 `[!]` → `[ ]`
**正式依據：** [W0914-A1 §3](../../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)

---

## 1. 背景

R-D4 自 2026-08-25 起標 `[!]`：原 schema 是 `{ version: 1, planId?, nodes, edges }`，而新模型的儲存形是 `devices`／`pipelines`，**`connections` 是衍生值、不進儲存**。

`src/types/layout.ts` 已經有現成的儲存形：

```ts
export interface LayoutSnapshot {
    devices: PlacedDevice[];
    pipelines: Pipeline[];
}
```

而 `layoutStore` 已經有進出兩端：`toSnapshot(): LayoutSnapshot`、`loadSnapshot(snapshot): LayoutIssues`。所以本項的重訂很大一部分是「把 D4 原本要新造的東西，對上 V12 已經造好的東西」。

---

## 2. 本項要回答的兩件事（對照 W0914-A1 §3）

1. `BlueprintFile` 的新形狀，`version` 跳 2 還是維持 1 → §4.1／§4.2
2. 舊檔要不要讀 → §4.3

---

## 3. 技術決策

### 3.1 新 schema（凍結）

```ts
/** 最小藍圖檔格式（佈局自建後） */
export interface BlueprintFile {
    /** 格式版本；佈局模型版固定 2 */
    version: 2;
    /** 所屬計畫；未指定時省略 */
    planId?: string;
    /** 已擺放設備 */
    devices: PlacedDevice[];
    /** 管線；connections 為衍生值，不存 */
    pipelines: Pipeline[];
}
```

`devices`／`pipelines` 的欄位定義**直接沿用** `src/types/layout.ts`，不另立一套檔案專用型別。這樣 `BlueprintFile` 去掉 `version`／`planId` 之後就是一個 `LayoutSnapshot`，序列化與反序列化都只是加／減兩個欄位。

原 §4.1 那句「`edges` 必須包含兩端 uid 與 handle」**刪除**——新模型沒有 handle，管線帶的是 `waypoints`。取代它的檢查見 §4.4。

### 3.2 為什麼 `version` 跳 2

| 方案 | 說明 | 採用 |
|------|------|------|
| 維持 `1` | 重用版本號、換掉內容 | 否 |
| **跳 `2`** | 舊版本號留給舊格式 | **是** |

理由：`version` 這個欄位在原 §4.5 就寫明「現在沒有遷移邏輯，但必須寫進檔案，是留給下一輪的鉤子」。**現在就是那個下一輪。** 若重用 `1`，任何已經存在使用者硬碟上的 v1 檔會被誤判為新格式、通過版本檢查、然後在欄位層炸開——錯誤訊息會變成「缺少 devices 欄位」而不是「這是舊版檔案」。跳 2 讓拒絕發生在第一個檢查點，訊息也說得清楚。

### 3.3 舊檔政策：不讀（決策 #4）

| 方案 | 採用 |
|------|------|
| **不讀舊檔；匯入 `version: 1` 直接拒絕整檔並提示** | **是** |
| 提供一次性 `nodes`／`edges` → `devices`／`pipelines` 轉換 | 否 |

**理由不是工作量，是資訊缺口。** 舊格式的 `edges` 用 `sourcePortId`／`targetPortId`（handle）表達「A 的這個埠連到 B 的那個埠」；新模型的 `Pipeline` 用 `waypoints` 表達**實體路徑**，連接則由路徑端點是否落在埠錨點上衍生。舊檔裡**沒有任何路徑資訊**。

要轉換，就得替使用者的舊藍圖自動佈線——在已放置的設備之間找一條不撞佔格的路徑（那正是 `bfsGridPath` 在做的事）。那是**憑空造圖，不是格式轉換**：轉出來的產線長相跟使用者當初擺的不一樣，而且可能因為佔格衝突而根本找不到路徑，於是變成「部分成功」，違反 §4.3 的全有或全無。

拒絕時的提示要說清楚是格式問題，不是檔案壞了：

```text
此檔為舊版藍圖格式（version 1），本版不支援匯入。
```

> **本段依 [W0914-A1 §3](../../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md) 的要求寫進文件，避免 11 月驗收時被當成缺陷。**

### 3.4 未來若要轉換

不是不可能，但條件是「B2 擺放鏈與自動佈線都已產品化」，屆時轉換等於「載入舊設備座標 → 對每條舊 edge 跑一次自動佈線」。**那要另開工項**，不在本輪範圍，也不在 11/29 前做。

---

## 4. 與 V12 既有能力的對接（原 §4.4 大幅簡化）

### 4.1 `loadBlueprint` 這個 action 已經存在

原 §4.4 的決策是「新增 `editorStore.loadBlueprint(data)` 專用 action，一次寫入、一筆歷史」，並註明「需 CR-01 同意新增 action；若未及同意，退回逐一呼叫既有 action 並記為技術債」。

新模型下**這件事已經做完了**。`layoutStore.loadSnapshot` 就是它：

| §4.4 方案 B 的要求 | `loadSnapshot` 現況 |
|--------------------|---------------------|
| 一次寫入 | 直接覆寫 `devices`／`pipelines`（深拷貝） |
| 一筆歷史，Undo 一次還原 | 以 `HistoryRecordType.Macro`、label「載入佈局快照」推入一筆 Command |
| 需 CR-01 同意 | **不需要**；`layoutStore` 是 aaaaa 自己的檔 |

所以原 §8 的依賴「CR-01 同意 `loadBlueprint`，最遲 11/8 提出」**移除**；原 §10 的風險「新 action 未獲同意 → 退回逐一呼叫、記技術債」**移除**。

### 4.2 兩道驗證，職責分開

`loadSnapshot` 回傳 `LayoutIssues`（`ok`／`invalidIds`／`conflicts`），但它查的是**佔格與 id**：未知機型、座標非有限、id 重複、彼此重疊。它**不查**連線合法性，也不查 JSON 的形狀。

所以匯入要兩道：

| 道 | 誰 | 查什麼 | 失敗怎麼辦 |
|----|-----|--------|-----------|
| 1 | `parseBlueprint`（新建純函式） | **形狀**：版本號、必要欄位、型別 | 拒絕整檔，畫布不動 |
| 2 | `loadSnapshot` 回傳的 `LayoutIssues` | **語意**：未知機型、重疊、重複 id | `!ok` 時 undo 該筆 Macro 並拒絕（維持全有或全無） |

第 2 道能直接 undo 是因為 `loadSnapshot` 已經進了歷史，這是 V12 順手帶來的好處。

### 4.3 連線合法性要不要在匯入時查

要，而且**只有這裡要**。[C1 §4.6](./C1_c2_connect_contract.md) 已經指出：匯入是唯一繞過 UI 的路徑，`loadSnapshot` 又不查連線。

作法：匯入成功後對每條 pipeline 跑一次 `canConnect`，把違規的收集起來。**但不拒絕整檔**——違規連線在新模型下的後果是「這條管線解不出合法 Connection」，引擎側會把該鏈路判為 invalid，使用者看得到警訊。拒絕整檔會讓一條爛管線毀掉整張藍圖，代價不對等。

這條與 §4.3（形狀錯就全拒）不衝突：**形狀錯 → 全拒；語意違規 → 載入並警示。** 要寫成明文，否則實作者會在這裡猶豫。

---

## 5. 沿用不改的決策

| 原節 | 結論 | 狀態 |
|------|------|------|
| §4.2 驗證機制 | Zod（若獲主編同意）；否則手寫型別守衛，**驗證不可省** | 沿用 |
| §4.3 匯入策略 | 全有或全無；匯入前清空或提示「將取代目前內容」；不做合併匯入 | 沿用 |
| §4.5 版本欄位用途 | 留給下一輪的鉤子；讀到非預期版本直接拒絕 | 沿用（預期值改 2） |
| §7 不做 | HTML 自包含、跨版本 migrate、雲端儲存、自動存檔、合併匯入、匯出圖片 | 沿用 |

---

## 6. 檔案計畫（改寫 D4 §5）

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/types/blueprint.ts` | `BlueprintFile` v2 |
| 新建 | `src/utils/layout/blueprintIo.ts` | `serializeBlueprint`／`parseBlueprint`（純函式） |
| 新建 | `src/__tests__/utils/layout/blueprintIo.test.ts` | round-trip、壞檔拒絕、**v1 拒絕**、缺欄位拒絕 |
| 唯讀 | `src/store/layoutStore.ts` | 用既有 `toSnapshot`／`loadSnapshot`；**不新增 action** |
| 修改 | `src/editor/navbar/Navbar.vue` | Save／Load 按鈕與檔案選擇（L2；owner 依 11 月派工） |
| **不碰** | `editorStore`、HTML 自包含、跨版本 migrate、雲端儲存、自動存檔 | |

住址與 [C1 §5.1](./C1_c2_connect_contract.md) 同理，放 `src/utils/layout/`。

---

## 7. 依賴更新（改寫 D4 §8）

| 依賴 | 原狀 | 現狀 |
|------|------|------|
| [B2](../../../roadmap/detail/B2_placement_chain.md)、[C1](../../../roadmap/detail/C1_port_hit_and_draft.md) | 要先有東西可存 | 不變 |
| [C5](../../../roadmap/detail/C5_source_primary_output.md) | `primaryOutput` 要在 node.data 內 | **已滿足**：`PlacedDevice.primaryOutput` 是頂層欄位 |
| CR-01 同意 `loadBlueprint` | 最遲 11/8 提出 | **移除**（§4.1） |
| Zod 依賴 | 主編同意；否則手寫守衛 | 不變 |
| [R-C2](../../../roadmap/detail/C2_add_connection_contract.md) 的 `canConnect` | 匯入端過濾 | **新增**：§4.3 需要它；C2 的 10/04 純函式是 D4 的前置 |

---

## 8. DoD（本細項）

> 下表左欄的節號指**產物** [detail/D4](../../../roadmap/detail/D4_blueprint_json_io.md)，括號內指**本檔**。

- [x] detail/D4 §4.1 schema 已換成本檔 §3.1 的 `devices`／`pipelines` v2
- [x] 本檔 §3.2 的「version 跳 2」理由已寫進 detail（落在 **detail/D4 §4.2**）
- [x] 本檔 §3.3 的「不讀舊檔」政策與資訊缺口理由已寫進 detail（落在 **detail/D4 §4.3**）
- [x] detail/D4 §4.4 已改寫為「沿用 `loadSnapshot`」；CR-01 協商需求與對應風險已移除
- [x] detail/D4 新增 **§4.6／§4.6.1** 說明兩道驗證與「形狀錯全拒、語意違規載入並警示」（源自本檔 §4.2／§4.3）
- [x] detail/D4 §5 檔案計畫、§8 依賴表已更新
- [x] detail/D4 §3 現況盤點已對上 `LayoutSnapshot`／`toSnapshot`／`loadSnapshot`
- [x] detail/D4 meta 狀態 `[!]` → `[ ]`，`最後更新` 改 2026-09-19
- [x] detail/D4 §11 補開發日誌一則

---

## 9. 開發日誌

### 2026-09-19

- 定案 `version: 2`＋不讀舊檔（[A1 §2.3](./A1_scope_decision.md)）；理由寫成「資訊缺口」而非工作量，見 §3.3
- 對上 V12 既有能力：`LayoutSnapshot`／`toSnapshot`／`loadSnapshot` 已涵蓋原 §4.4 方案 B，
  CR-01 協商需求與「新 action 未獲同意」風險消失
- 補 §4.2 兩道驗證與 §4.3「形狀錯全拒、語意違規載入並警示」的分界；後者原 detail 未定義
- 確認 `primaryOutput` 在新模型是 `PlacedDevice` 頂層欄位 → 原 C5 依賴已自動滿足
- **產物已落地：** detail/D4 全檔改寫，§8 DoD 全數勾選。本檔 §4.2／§4.3 的兩道驗證在產物中編為
  **§4.6／§4.6.1**，DoD 已標明對應關係
