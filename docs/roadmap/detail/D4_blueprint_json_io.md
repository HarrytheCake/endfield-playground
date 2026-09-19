# R-D4 — 最小藍圖 JSON 匯出／匯入（佈局模型版）

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §6 |
| 里程碑 | M4（2026-11-29）；首次可演示 11/22 |
| 擋門檻 | **是**（主編步驟 10） |
| 建議主責／備援 | aaaaa／— |
| 性質 | 純函式 ＋ 接線 |
| 依賴 | [B2](./B2_placement_chain.md)、[C1](./C1_port_hit_and_draft.md)、[C2](./C2_add_connection_contract.md) |
| 狀態 | `[ ]` **已定義、待實作**（2026-09-19 依新模型重訂完成） |
| 最後更新 | 2026-09-19 |

> **2026-09-19 重訂：** 本檔原 schema `{ version, planId?, nodes, edges }` 自 2026-08-25 佈局自建裁決後標 `[!]` 失效。本次依已合入 master 的 `LayoutSnapshot`／`layoutStore` 重寫 §3、§4、§5、§8、§10。重訂理由見 [V13-C2](../../aaaaa/dev/dev_v13/C2_d4_blueprint_format.md)。

---

## 1. 背景與動機

匯出／匯入是主編 10 步的最後一步，也是唯一一項讓成果「離開瀏覽器」的功能。沒有它，使用者關掉分頁就失去一切，任何超過一次會話的使用都不成立。

CR-06 的完整規格包含 HTML 自包含記錄檔與跨版本遷移，本輪明確**精簡**：只做最小 JSON。理由是 HTML 自包含牽涉資源內嵌與版本演進，工作量與 JSON 不在同一個量級，而 11/29 的驗收只需要「存得出、讀得回」。

### 1.1 新模型讓本項變小了

V12（PR #45）已經把儲存形與進出兩端做好了：

```typescript
interface LayoutSnapshot { devices: PlacedDevice[]; pipelines: Pipeline[] }

layoutStore.toSnapshot(): LayoutSnapshot
layoutStore.loadSnapshot(snapshot): LayoutIssues
```

所以本項剩下的其實只有「加一層檔案外殼＋驗證＋頂欄按鈕」。原本規劃要新造的 `loadBlueprint` action **已經存在**（§4.4）。

## 2. 使用者看得到什麼

頂欄有 Save 與 Load 兩顆按鈕。按 Save 下載一個 `.json`；重新整理頁面後按 Load 選那個檔，設備與管線都回來了。選到舊版格式的檔會被明確拒絕，並說明是格式問題而不是檔案損毀。

## 3. 現況盤點（2026-09-19）

| 對象 | 路徑 | 現況 |
|------|------|------|
| 儲存形 | `src/types/layout.ts` `LayoutSnapshot`（`devices`／`pipelines`） | **已有** |
| 設備／管線型別 | `PlacedDevice`（含 `rotation`／`machineMode`／`primaryOutput`）、`Pipeline`（`media`／`waypoints`） | **已有** |
| 匯出來源 | `layoutStore.toSnapshot()`（深拷貝，不含 connections） | **已有** |
| 匯入入口 | `layoutStore.loadSnapshot(snapshot)` → `LayoutIssues`；已進 history 一筆 Macro | **已有** |
| 語意檢查 | `LayoutIssues`（`ok`／`invalidIds`／`conflicts`）：未知機型、非有限座標、重複 id、佔格重疊 | **已有** |
| 連線合法性檢查 | [C2](./C2_add_connection_contract.md) `canConnect` | 待 C2 實作（10/04） |
| 頂欄 | `src/editor/navbar/Navbar.vue` | 已存在 |
| 計畫型別 | `src/types/plan.ts` | 已有（`planId` 來源） |
| Schema 驗證 | — | **不存在**；需引入或手寫 |
| 匯出／匯入 | — | **不存在**，本項全新 |
| ~~`FactoryNode`／`FactoryEdge`~~ | `src/types/graph.ts` | **不是本項儲存對象**（舊模型） |

## 4. 技術決策

### 4.1 Schema（2026-09-19 重訂・凍結）

```typescript
/** 最小藍圖檔格式（佈局自建後） */
interface BlueprintFile {
  /** 格式版本；佈局模型版固定 2 */
  version: 2
  /** 所屬計畫；未指定時省略 */
  planId?: string
  /** 已擺放設備 */
  devices: PlacedDevice[]
  /** 管線；connections 為衍生值，不存 */
  pipelines: Pipeline[]
}
```

`devices`／`pipelines` 的欄位定義**直接沿用** `src/types/layout.ts`，不另立檔案專用型別。去掉 `version`／`planId` 後就是一個 `LayoutSnapshot`，序列化與反序列化只是加／減兩個欄位。

`devices` 必須包含 `machineType`、`position`、`rotation`，以及 `machineMode`／`primaryOutput`（若該機需要）；`pipelines` 必須包含 `media` 與至少兩點的 `waypoints`。

> 原要求「`edges` 必須包含兩端 uid 與 **handle**」**刪除**——新模型沒有 handle，管線帶的是路徑。取代它的把關見 §4.6。

### 4.2 版本號跳 2

| 方案 | 說明 | 採用 |
|------|------|------|
| 維持 `1` | 重用版本號、換掉內容 | 否 |
| **跳 `2`** | 舊版本號留給舊格式 | **是** |

`version` 在原 §4.5 就寫明「現在沒有遷移邏輯，但必須寫進檔案，是留給下一輪的鉤子」。**現在就是那個下一輪。** 若重用 `1`，既有的 v1 檔會通過版本檢查、然後在欄位層炸開——錯誤訊息會變成「缺少 devices 欄位」而不是「這是舊版檔案」。跳 2 讓拒絕發生在第一個檢查點。

### 4.3 舊檔政策：不讀（凍結）

| 方案 | 採用 |
|------|------|
| **不讀舊檔；匯入 `version: 1` 直接拒絕整檔並提示** | **是** |
| 提供一次性 `nodes`／`edges` → `devices`／`pipelines` 轉換 | 否 |

**理由是資訊缺口，不是工作量。** 舊格式的 `edges` 用 `sourcePortId`／`targetPortId`（handle）表達「A 的這個埠連到 B 的那個埠」；新模型的 `Pipeline` 用 `waypoints` 表達**實體路徑**，連接則由端點是否落在埠錨點上衍生。**舊檔裡沒有任何路徑資訊。**

要轉換就得替使用者的舊藍圖自動佈線——在已放置的設備之間找一條不撞佔格的路徑。那是**憑空造圖，不是格式轉換**：轉出來的產線長相跟使用者當初擺的不一樣，而且可能因佔格衝突找不到路徑，於是變成「部分成功」，違反 §4.5 的全有或全無。

拒絕時的提示須說清楚是格式問題：

```text
此檔為舊版藍圖格式（version 1），本版不支援匯入。
```

> 本段刻意寫進文件，避免 11 月驗收時被當成缺陷。未來若要支援轉換，前提是 [B2](./B2_placement_chain.md) 擺放鏈與自動佈線都已產品化，屆時等於「載入舊設備座標 → 對每條舊 edge 跑一次自動佈線」，**須另開工項**，不在 11/29 前做。

### 4.4 匯入走哪條路：沿用 `loadSnapshot`

原決策是「新增 `editorStore.loadBlueprint(data)` 專用 action，一次寫入、一筆歷史」，並註明需 CR-01 同意。**新模型下這件事已經做完了：**

| 原方案 B 的要求 | `layoutStore.loadSnapshot` 現況 |
|-----------------|----------------------------------|
| 一次寫入 | 直接覆寫 `devices`／`pipelines`（深拷貝） |
| 一筆歷史，Undo 一次還原 | 以 `HistoryRecordType.Macro`、label「載入佈局快照」推入一筆 Command |
| 需 CR-01 同意 | **不需要**；`layoutStore` 是 aaaaa 主責檔 |

所以**不新增 action、不碰 `editorStore`**。

### 4.5 匯入策略：全有或全無

| 方案 | 作法 | 採用 |
|------|------|------|
| A. 逐節點載入，壞的跳過 | 部分成功 | 否——使用者會得到一張缺了幾台機器的產線，且不知道缺了什麼 |
| **B. 驗證通過才整批載入，否則不動現況** | 全有或全無 | **是** |

匯入前先清空畫布，或提示「將取代目前內容」。**不做合併匯入。**

### 4.6 兩道驗證，職責分開

`loadSnapshot` 回傳的 `LayoutIssues` 查的是**佔格與 id**（未知機型、非有限座標、重複 id、彼此重疊）。它**不查** JSON 的形狀，也**不查**連線合法性。所以匯入要兩道：

| 道 | 誰 | 查什麼 | 失敗怎麼辦 |
|----|-----|--------|-----------|
| 1 | `parseBlueprint`（本項新建） | **形狀**：版本號、必要欄位、型別 | **拒絕整檔**，畫布不動 |
| 2 | `loadSnapshot` 回傳的 `LayoutIssues` | **語意**：未知機型、重疊、重複 id | `!ok` 時 undo 該筆 Macro 並拒絕（維持全有或全無） |

第 2 道能直接 undo，是因為 `loadSnapshot` 已經進了歷史。

#### 4.6.1 連線合法性：載入但警示

匯入是唯一繞過 UI 的路徑（[C2 §4.5](./C2_add_connection_contract.md)），而上述兩道都不查連線。作法是：匯入成功後對每條 pipeline 跑一次 `canConnect`，收集違規者，**但不拒絕整檔**。

違規連線在新模型下的後果是「這條管線解不出合法 Connection」，引擎側會把該鏈路判為 invalid，使用者看得到警訊。拒絕整檔會讓一條爛管線毀掉整張藍圖，代價不對等。

**分界一句話：形狀錯 → 全拒；語意違規 → 載入並警示。**

### 4.7 方案比較：驗證機制

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 不驗證，直接 `JSON.parse` | 最省 | — | 壞檔會讓畫布進入半損毀狀態，比不能載入更糟 | 否 |
| B. 手寫型別守衛 | 逐欄檢查 | 無新依賴 | 冗長；欄位增加時容易漏 | 備選 |
| **C. Zod schema** | 宣告式驗證 | 錯誤訊息可讀；與型別同源 | 新增依賴 | **是（若專案已有或可加）** |

若引入 Zod 需經主編同意（新依賴）。未獲同意則退回 B，但**驗證本身不可省**。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/types/blueprint.ts` | `BlueprintFile` v2 |
| 新建 | `src/utils/layout/blueprintIo.ts` | `serializeBlueprint`／`parseBlueprint`（純函式） |
| 新建 | `src/__tests__/utils/layout/blueprintIo.test.ts` | round-trip、壞檔拒絕、**v1 拒絕**、缺欄位拒絕、管線路徑不良構拒絕 |
| 唯讀 | `src/store/layoutStore.ts` | 用既有 `toSnapshot`／`loadSnapshot`；**不新增 action** |
| 修改 | `src/editor/navbar/Navbar.vue` | Save／Load 按鈕與檔案選擇（L2；owner 依 11 月派工） |
| **不碰** | `editorStore`、HTML 自包含匯出、跨版本 migrate、雲端儲存、自動存檔 | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 11/08 | `blueprintIo.ts` ＋ round-trip 測試（純函式先行） |
| 11/15 | 兩道驗證串起來（§4.6）；v1 拒絕路徑 |
| 11/22 | **頂欄 Save 下載；Load 還原 devices／pipelines** |
| 11/29 | **門檻：** 匯出後重新整理再匯入，設備還在 |

> 原 11/15 切片為「`loadBlueprint` action ＋ 測試」，因該 action 已存在（§4.4）而改為驗證串接。

## 7. 不做

- 不做 HTML 自包含記錄檔（明列於不做清單）
- 不做跨版本 migrate、不做 v1 舊檔轉換（§4.3）
- 不做雲端儲存、自動存檔、localStorage 持久化
- 不做合併匯入
- 不做匯出圖片
- 不存 `connections`（衍生值）

## 8. 依賴與封鎖

| 依賴 | 狀態 |
|------|------|
| [B2](./B2_placement_chain.md)、[C1](./C1_port_hit_and_draft.md) | 要先有東西可存；仍 `[!]`／`[ ]` |
| [C2](./C2_add_connection_contract.md) `canConnect` | **新增依賴**：§4.6.1 匯入端過濾需要它；C2 的 10/04 純函式是本項前置 |
| ~~[C5](./C5_source_primary_output.md) `primaryOutput` 在 node.data 內~~ | **已滿足**：新模型中 `primaryOutput` 是 `PlacedDevice` 頂層欄位 |
| Zod 依賴（若採用） | 主編同意；否則退回手寫守衛 |
| ~~CR-01 同意 `loadBlueprint`~~ | **已移除**（§4.4：沿用 `loadSnapshot`，不碰 `editorStore`） |

## 9. DoD

- [ ] 頂欄 Save 可下載 `.json`，內容符合 §4.1 schema（`version: 2`）
- [ ] Load 選檔後 devices／pipelines 完整還原（含 `rotation`、`machineMode`、`primaryOutput`、`waypoints`）
- [ ] 匯出 → 重新整理 → 匯入，畫面與匯出前一致
- [ ] **`version: 1` 的檔被拒絕**，且提示文字說明是舊版格式
- [ ] 壞檔（缺欄位／型別不符／版本不符）被拒絕且畫布維持原狀
- [ ] 語意違規（未知機型／重疊）觸發 undo 並拒絕；連線違規則載入並警示（§4.6）
- [ ] round-trip 測試通過（序列化再解析得到等價結構）
- [ ] 匯入後 Undo 一次可還原（`loadSnapshot` 的 Macro）
- [ ] 匯入後右側產耗數字正確重算
- [ ] 未改 `editorStore` 任何簽名
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 壞檔讓畫布半損毀 | §4.5 全有或全無＋§4.6 兩道驗證 |
| 繞過連線規則載入非法管線 | §4.6.1 匯入後跑 `canConnect` 並警示；引擎側既有檢查兜底 |
| 新依賴（Zod）未獲同意 | 退回手寫型別守衛，驗證不可省 |
| C2 未如期交付 → §4.6.1 無法做 | 匯入端過濾降級為「不查連線」，記為技術債；不擋 11/29 主線 |
| ~~新 action 未獲同意~~ | **已移除**（§4.4） |

**未交頂替：** 無。這是驗收劇本第 7 步。若 11/22 未完成，最低限度提供「匯出」單向功能（讓成果不會遺失），匯入延到下一輪——但這會讓門檻降級，須在 11/22 會上明確記錄。

## 11. 開發日誌

### 2026-09-19
- **依新模型重訂完成，狀態 `[!]` → `[ ]`。** schema 改 `devices`／`pipelines`；`version` 跳 **2**；**不讀舊檔**（§4.3，理由為資訊缺口：舊檔無路徑資訊，轉換等於憑空造圖）
- §4.4：匯入沿用 `layoutStore.loadSnapshot`，**不新增 action、不碰 `editorStore`** → CR-01 協商需求與對應風險移除；§6 的 11/15 切片改為驗證串接
- 新增 §4.6 兩道驗證與 §4.6.1「形狀錯全拒、語意違規載入並警示」的分界
- `primaryOutput` 為 `PlacedDevice` 頂層欄位 → 原 C5 依賴已自動滿足；改新增對 C2 `canConnect` 的依賴
- 重訂依據：[V13-C2](../../aaaaa/dev/dev_v13/C2_d4_blueprint_format.md)；工單 [W0914-A1](../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)

### 2026-08-30
- 狀態 meta 同步為 `[!]`；**本週無產出**。Zod schema 重訂仍排 9 月首週

### 2026-08-25
- 佈局自建裁決：儲存形狀改 `devices`／`pipelines`，`connections` 為衍生值 → 原 `{ nodes, edges }` 格式失效，大綱改標 `[!]`

### 2026-08-22
- 建檔。schema 刻意最小化；`version` 欄位無實際邏輯但保留為下一輪遷移鉤子
