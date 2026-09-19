# R-C2 — 連線契約與型別檢查（佈局模型版）

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §5 |
| 里程碑 | M3（2026-10-25）；純函式最遲 10/4 |
| 擋門檻 | **是** |
| 建議主責／備援 | aaaaa（規則純函式）＋L2（呼叫端，owner 待定）／— |
| 性質 | 純函式 ＋ 接線 |
| 依賴 | [A2](./A2_grid_and_port_alignment.md)（已完成）、`layoutStore`（PR #45 已合入） |
| 狀態 | `[ ]` **已定義、待實作**（2026-09-19 依新模型重訂完成） |
| 最後更新 | 2026-09-19 |

> **2026-09-19 重訂：** 本檔原本建立在 `FactoryNode`／`FactoryEdge` 上，自 2026-08-25 佈局自建裁決後標 `[!]` 失效。本次依已合入 master 的 `PlacedDevice`／`Pipeline` 模型重寫 §1、§3、§4、§5、§6、§8、§10。重訂過程與逐條判定理由見 [V13-C1](../../aaaaa/dev/dev_v13/C1_c2_connect_contract.md)。

---

## 1. 背景與動機

連線規則沒有一份可執行的定義，造成兩個下游問題：

1. **FlowEngine 收到非法邊時只能整條鏈判為 invalid**，使用者看到「沒有數字」卻不知道為什麼
2. **L2 只好自己判斷**，於是型別檢查邏輯散在容器裡，與引擎側的判定（V8 已實作 `isItemFormMediaMismatch`、埠一對一）變成兩套

V8／V9 已經在引擎側把規則想清楚了：belt 對 belt、pipe 對 pipe，`form` 決定媒質（solid→belt，liquid／gas→pipe），單埠單線。本項要做的是**把這些規則抽成連線前就能呼叫的純函式**，讓 L2 在放開滑鼠的當下就知道能不能連。

### 1.1 新模型改變了「攔截點」

舊模型有 `addConnection(edge)` 這個動作可以攔。新模型沒有——連線是**衍生值**：

```text
resolveConnections(devices, pipelines) → Connection[]
```

`Connection.from`／`to` 是 `PortRef | null`，由**管線首／末 waypoint 的 xy 是否等於某個埠的外側錨點**決定。使用者做的動作是「畫一條管線」，連線是畫完之後算出來的。

所以本項要回答的不是「`addConnection` 該擋什麼」，而是 **「一條 draft 管線在放開滑鼠之前，怎麼知道它會不會產生一條非法連線」**。

### 1.2 兩個影響規則設計的現況事實

| 事實 | 影響 |
|------|------|
| `resolveConnections` 的 JSDoc 明寫「初稿只做 **xy 幾何對齊**；媒質不相容等規則留驗證期再修」 | 媒質規則**沒有**任何地方在擋，本項是唯一落點 |
| 端點比對只看 `x`／`y`，**不看 `z`** | belt（慣例 z＝0）與 pipe（z＝1）的端點落在同一 xy 格時會解到同一個埠。規則 2 必須自己擋 |

## 2. 使用者看得到什麼

把皮帶管線的端點拖到水管埠上，該埠不會亮綠、放開後線不會留下；把已經連過的埠再連一條，同樣被擋。合法的連線放開後就留在畫面上。**畫到一半、還沒接到任何埠的管線是允許的**，顯示為未連接狀態。

## 3. 現況盤點（2026-09-19）

| 對象 | 路徑 | 現況 |
|------|------|------|
| 佈局 store | `src/store/layoutStore.ts` | **已有**（PR #45）；`addPipeline`／`removePipeline` 為管線入口 |
| 管線型別 | `src/types/layout.ts` `Pipeline`（`id`／`media`／`waypoints`） | 已有 |
| 衍生連線 | `src/types/layout.ts` `Connection`（`from`／`to` 為 `PortRef \| null`） | 已有 |
| 連線推導 | `src/utils/layout/resolveConnections.ts` | 已有；只做 xy 幾何對齊 |
| 埠錨點 | `src/utils/layout/portAnchors.ts` `resolvePortAnchorCell` | 已有 |
| 埠媒質 | `PortMedia`（`belt`｜`pipe`），`src/types/machine.ts` | 已有（V7） |
| 物品形態 | `ItemForm`，`getItemForm`／`getItemPortMedia`／`getMaterialPortMedia` | 已有（V8／V9） |
| 路徑良構檢查 | `layoutStore` 私有 `pipelineWaypointsValid`（≥2 點／有限／軸對齊） | **已有**；本項不重做 |
| 佔格重疊檢查 | `layoutStore` 私有 `assessInvolving` → `PlacementResult` | **已有**；本項不重做 |
| 引擎側檢查 | `isItemFormMediaMismatch`、埠一對一、`flowEngine.v8.portCardinality.test.ts` | 已有 |
| **連線前檢查** | — | **不存在**，本項要補 |
| ~~`editorStore.addConnection`~~ | `src/store/editorStore.ts` | **不在本項範圍**（新模型不經此路徑） |

## 4. 技術決策

### 4.1 規則清單（2026-09-19 重判・凍結）

原規則表（2026-08-22 凍結，對 `FactoryEdge`）逐條重判如下：

| # | 原規則 | 新模型下的判定 | 標記 |
|---|--------|----------------|------|
| 1 | 必須 output → input | **判定來源改變**：管線沒有方向欄位，改看 draft 解出的 `from`／`to` 各自是哪種 `portType`。兩端同為 `output` 或同為 `input` 時拒絕 | **改寫** |
| 2 | 媒質必須相同 | **升為三方一致**：舊模型只比兩埠；新模型的 `Pipeline` 自己帶 `media`，故要求 `pipeline.media` ＝ `from` 埠媒質 ＝ `to` 埠媒質 | **改寫** |
| 3 | 單埠單線 | **語意成立，判定來源改變**：不再掃 `edges`，改掃現有 `resolveConnections` 結果中已被佔用的 `PortRef`（`deviceId`＋`portType`＋`portIndex`） | **改寫** |
| 4 | 不可自連 | 原樣成立：`from.deviceId === to.deviceId` 時拒絕 | **成立** |
| 5 | 不可重複邊 | **作廢為獨立規則**。新模型下兩台機器間可以有多條實體管線走不同路徑（合理），而「同一對埠被連兩次」已被規則 3 擋死。保留它只會製造永遠觸發不到的分支 | **作廢**（由規則 3 吸收） |
| 6 | handle 必帶 | **作廢**。新模型沒有 handle；端點由幾何命中決定。對應的新約束是路徑良構（≥2 點／座標有限／逐段軸對齊），**已實作在 `layoutStore.addPipeline`** | **作廢**（已由 store 涵蓋） |
| **7** | （新增）**斷線管線合法** | `from`／`to` 任一為 `null` **不是**違規。`Connection` 型別本身允許 `null`，`removeDevice` 亦明寫「管線保留（可變成斷線）」。回 `ok: true`，由 L2 自行畫成未連接樣式 | **新增・放行** |

**環路不在此檢查。** FlowEngine 的 `topologicalSort` 已能偵測環路並略過該子圖；在連線當下擋環路會讓合理的回收產線無法搭建，屬過度限制。（沿用 2026-08-22 結論，新模型不改變它。）

> **規則 7 必須寫成明文**，否則實作者容易照舊模型直覺把「沒接上」當成 `missing_handle` 拒絕，那會讓手動佈線無法進行。

#### 4.1.1 相鄰即連線嗎

不會。`resolveConnections` 只從 `pipelines` 產出 `Connection`，**沒有管線就沒有連線**。兩台機器的埠錨點即使貼在一起，也不會自動連上。

### 4.2 方案比較：規則放哪一層

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 只寫在 `addPipeline` 內部 | action 自己擋 | 唯一入口，一定生效 | L2 拿不到「為什麼不行」，無法在放開前給提示 | 部分 |
| B. 寫在 L2 容器 | 容器判斷後才呼叫 | 可即時提示 | 與引擎側兩套；容器繞過就失效 | 否 |
| **C. 純函式 ＋ action 內部同時使用** | `canConnect(draft, layout)` 回傳結果與原因；L2 呼叫它做提示，`addPipeline` 也呼叫它做最終防線 | 一套邏輯兩處使用；可測試 | 需定義 context | **是** |

落點（與舊版不同，因住址與攔截點都變了）：

| 層 | 落點 | 職責 |
|----|------|------|
| 純函式 | `src/utils/layout/connectRules.ts` | §4.1 的語意規則（方向／媒質／單埠單線／自連） |
| L1 store | `layoutStore.addPipeline` 內部呼叫 `canConnect` | 最終防線；繞過 UI 也擋得住 |
| L1 store（既有） | `pipelineWaypointsValid`＋`assessInvolving` | 路徑良構與**佔格重疊**；`canConnect` 不重做 |
| L2 | draft 期間呼叫 `canConnect` | highlight 顏色；放開前就知道能不能連 |

### 4.3 型別設計

採 discriminated union，與同一 store 的 `PlacementResult` 同形——`ok` 當 discriminant，失敗分支各自帶該原因才有意義的結構化資料。理由：原 `{ ok: boolean; reason: ... | null; message: string | null }` 型別擋不住 `{ ok: true, reason: 'media' }`，且失敗時無法指出是哪個埠。

```typescript
/** 連線失敗原因；命名風格對齊 PlacementFailReason */
export type ConnectFailReason =
    | 'direction'      // 兩端同向（皆 output 或皆 input）
    | 'media'          // pipeline.media 與埠媒質三方不一致
    | 'port_occupied'  // 該埠已被現有連線佔用
    | 'self_loop'      // 兩端落在同一台設備
    | 'malformed'      // waypoints 不良構（<2 點／非有限／非軸對齊）

/**
 * 連線可行性結果；不 throw，供 L2 決定 draft 的顏色
 *
 * ok 為 true 時 from／to 可為 null（合法但尚未接上；見 §4.1 規則 7）。
 */
export type ConnectResult =
    | { ok: true; from: PortRef | null; to: PortRef | null }
    | { ok: false; reason: 'direction'; ports: [PortRef, PortRef] }
    | { ok: false; reason: 'media'; pipelineMedia: PortMedia; mismatched: PortMediaMismatch[] }
    | { ok: false; reason: 'port_occupied'; occupied: PortRef[] }
    | { ok: false; reason: 'self_loop'; deviceId: string }
    | { ok: false; reason: 'malformed' }

/** 媒質不符的單一埠 */
export interface PortMediaMismatch {
    port: PortRef
    /** 該埠實際的媒質 */
    media: PortMedia
}
```

簽章：

```typescript
/**
 * 連線前檢查：draft 管線會不會產生非法連線
 *
 * @param draft 尚未落地的管線；不需要 id（還沒生）
 * @param layout 目前佈局；用來展開埠錨點與查已佔用的埠
 */
export function canConnect(
    draft: Pick<Pipeline, 'media' | 'waypoints'>,
    layout: { devices: readonly PlacedDevice[]; pipelines: readonly Pipeline[] },
): ConnectResult

/** 把失敗結果轉成一行繁中短句；ok 時回 null */
export function describeConnectFailure(result: ConnectResult): string | null
```

**`message` 不放進 union**，改由 `describeConnectFailure` 產出。與 [B4](./B4_selection_inspector.md) 的攤平契約一致：L3 仍不做文案組裝（呼叫描述函式的是 L2），而結構化資料（哪個埠、期望什麼媒質）比預組字串更有用——L2 可據此只把違規的那個埠標紅。

### 4.4 實作硬約束：端點判定必須共用

`canConnect` 判斷 draft 兩端落在哪個埠時，**必須共用 `resolveConnections` 內部的錨點展開與命中邏輯**（`collectPortAnchors`／`findPortAt`，含「起點偏好 output、終點偏好 input」與「同格多埠時取掃描順序第一個」兩條穩定規則），不得另寫一份。

理由：兩邊各寫一份時，在「同一格有多個埠」的情況下會對同一條 draft 得出不同的 `from`／`to`——於是 `canConnect` 說可以、`resolveConnections` 算出來卻是另一條連線。

實作時需把該邏輯從 `resolveConnections.ts` 提為共用（模組內匯出或另開 `portAnchorIndex.ts`），**這是 10/04 實作週的第一件事**，不是順手可做的。提完 `resolveConnections` 對外行為須不變，既有測試原樣綠。

### 4.5 與引擎側的關係

本項是**連線前**的守門，引擎側 V8 的檢查是**算流量時**的守門，兩者不互相取代：

- 連線前擋掉的，引擎根本不會看到
- 引擎側的檢查保留，因為 JSON 匯入（[D4](./D4_blueprint_json_io.md)）可能帶進未經 UI 的管線——新模型下匯入走 `layoutStore.loadSnapshot`，而它只查佔格與 id、**不查連線合法性**，所以這條更要緊

兩處必須共用同一組媒質判定函式，不得各寫一份。

### 4.6 本項不做什麼（職責分界）

| 不做 | 誰做 |
|------|------|
| 佔格重疊 | `addPipeline` → `assessInvolving` → `PlacementResult.overlap` |
| 路徑良構 | `addPipeline` → `pipelineWaypointsValid` |
| 環路 | **不擋**（§4.1） |
| 速率上限（belt 30／pipe 60） | 引擎側 |
| 「這條連線在產線上有沒有意義」 | [D3](./D3_recipe_alerts.md) 警訊 |

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/utils/layout/connectRules.ts` | `canConnect`＋`describeConnectFailure` |
| 新建 | `src/__tests__/utils/layout/connectRules.test.ts` | §4.1 四條有效規則各一正一反；規則 7 斷線放行；`malformed` |
| 重構 | `src/utils/layout/resolveConnections.ts` | 提出共用的錨點展開與命中判定（§4.4）；對外行為不變 |
| 修改 | `src/store/layoutStore.ts` | `addPipeline` 內部呼叫 `canConnect`（**aaaaa 主責檔；非 Breaking**） |
| 修改 | L2 佈局容器（owner 待定） | draft 放開前呼叫 `canConnect` 決定 highlight 顏色 |
| 唯讀 | `src/composables/useFlowEngine.ts` | 確認媒質判定共用，不複製邏輯 |
| **不碰** | `editorStore.addConnection`、環路偵測、引擎既有檢查 | |

> 住址由原規劃的 `src/utils/connectRules.ts` 改為 `src/utils/layout/connectRules.ts`，與 `resolveConnections`／`overlapDetection`／`portAnchors` 同區——它要共用那一區的錨點邏輯。

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 10/04 | 錨點判定提共用（§4.4）＋`connectRules.ts`＋測試交付。**純函式門檻** |
| 10/11 | `addPipeline` 內部防線接上（較舊版提前一週；不需跨 CR 協商） |
| 10/18 | L2 接上：不合法紅色、合法綠色、斷線灰色；放開不建立非法管線 |
| 10/25 | **門檻：** 型別對才允許連線，錯接有即時視覺 |

## 7. 不做

- 不做環路擋阻
- 不做速率上限檢查（belt 30／pipe 60 屬引擎側，不在連線當下擋）
- 不做「這條連線在產線上有沒有意義」的語意檢查（屬 [D3](./D3_recipe_alerts.md) 警訊）
- 不做自動修正建議
- 不做自動佈線（draft 的 waypoints 由 L2 或 [C3](./C3_pipeline_polyline_render.md) 提供）

## 8. 依賴與封鎖

| 依賴 | 狀態 |
|------|------|
| [A2](./A2_grid_and_port_alignment.md)（埠資料正確） | **已完成** |
| `layoutStore`（PR #45） | **已合入 master**（2026-09-14） |
| L2 呼叫端 owner | **待定**；10/18 切片需要，最遲 10 月首週派工時決 |

**跨 CR 協商需求已消失（2026-09-19）：** 舊版要求「修改 `editorStore.addConnection`，屬 CR-01 主責，須標 Breaking 並最遲 10/11 提出」。新模型下連線動作落在 `layoutStore.addPipeline`，是 aaaaa 主責檔，**不需要主編點頭、不屬 Breaking**。

## 9. DoD

- [ ] `connectRules.ts` 實作 §4.1 的四條有效規則＋規則 7 放行，`canConnect` 回傳 §4.3 型別
- [ ] 錨點判定已與 `resolveConnections` 共用（§4.4）；`resolveConnections` 既有測試原樣綠
- [ ] 測試涵蓋四條規則各一正一反、斷線放行、`malformed`，全綠
- [ ] belt／pipe 錯接在 UI 上有即時紅色回饋且不建立管線
- [ ] 同一埠連第二條被擋
- [ ] `addPipeline` 內部亦擋（繞過 UI 直接呼叫也不會建立非法連線）
- [ ] 媒質判定與 `useFlowEngine` 共用同一函式（code review 確認無複製）
- [ ] 未改 `editorStore` 任何簽名
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 規則散成兩套 | §4.2 決策；DoD 列入 code review 檢查 |
| **錨點判定寫成兩份** | §4.4 硬約束；症狀是「預檢說可以、實際解出另一條連線」，極難查 |
| 過度限制導致合理產線連不起來 | 環路明確排除；規則 7 放行斷線；規則清單凍結，新增規則須另開工項 |
| L2 呼叫端無 owner | 10 月首週派工時決；純函式先行不受影響 |
| ~~改 `addConnection` 破壞既有 L2 MVP~~ | **已移除**（§8：不碰 `editorStore`） |

**未交頂替：** 若純函式未完成，10/25 門檻降級為「連得起來但不檢查型別」，並在該日記錄為技術債，11 月由引擎側的既有檢查兜底（使用者會看到鏈路 invalid 而非即時回饋）。

## 11. 開發日誌

### 2026-09-19
- **依新模型重訂完成，狀態 `[!]` → `[ ]`。** 六條原規則逐條重判：1／2／3 改寫、4 成立、5 由 3 吸收作廢、6 已由 `addPipeline` 涵蓋作廢；新增規則 7「斷線管線合法」
- 回傳改 discriminated union 對齊 `PlacementResult`；`message` 移出 union，另出 `describeConnectFailure`
- 落點由 `src/utils/` 改 `src/utils/layout/`；攔截點由 `editorStore.addConnection` 改 `layoutStore.addPipeline`
- 新增 §4.4 硬約束：錨點判定必須與 `resolveConnections` 共用
- **跨 CR 協商需求消失**，§8 對應依賴與 §10 對應風險移除；§6 內部防線由 10/18 提前至 10/11
- 重訂依據與逐條理由：[V13-C1](../../aaaaa/dev/dev_v13/C1_c2_connect_contract.md)；工單 [W0914-A1](../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)

### 2026-08-30
- 狀態 meta 同步為 `[!]`；**本週無產出**。重訂契約仍排 9 月首週（與 §1.2 藍圖格式一併）

### 2026-08-25
- 佈局自建裁決：連接改為衍生值、不儲存 → 本工項原定義失效，大綱改標 `[!]` 待重新定義

### 2026-08-22
- 建檔。規則清單自 V8 引擎側既有檢查（埠一對一、form／media）反向整理為連線前版本；刻意排除環路
