# V13-C1 — R-C2 連線契約重訂（新模型）

**對應工項：** V13-C1
**狀態：** `[x]` 完成（2026-09-19；V14-B1 於 2026-09-27 收斂 meta）
**日期：** 2026-09-19
**依賴：** [A1](./A1_scope_decision.md)（定案 #2：discriminated union）
**產物：** 改寫 [roadmap/detail/C2](../../../roadmap/detail/C2_add_connection_contract.md) §3／§4／§5／§6／§10／§11，狀態 `[!]` → `[ ]`
**正式依據：** [W0914-A1 §2](../../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)

---

## 1. 背景

R-C2 自 2026-08-25 佈局自建裁決起標 `[!]`，原因是原契約建立在 `FactoryEdge`（node uid ＋ handle）上，而新模型的連線是**衍生值**：

```text
resolveConnections(devices, pipelines) → Connection[]
```

`Connection.from`／`to` 是 `PortRef | null`，由**管線首／末 waypoint 的 xy 是否等於某個埠的外側錨點**決定（`src/utils/layout/resolveConnections.ts`）。沒有 `addConnection` 這個動作可以攔截——使用者做的是「畫一條管線」，連線是畫完之後算出來的。

所以本項要回答的不是「`addConnection` 該擋什麼」，而是 **「一條 draft 管線在放開滑鼠之前，怎麼知道它會不會產生一條非法連線」**。

### 1.1 現況的兩個關鍵事實

讀 `resolveConnections` 原始碼後確認兩件會影響規則設計的事：

| 事實 | 影響 |
|------|------|
| 它的 JSDoc 明寫「初稿只做 **xy 幾何對齊**；媒質不相容等規則留驗證期再修」 | 媒質規則**沒有**任何地方在擋，C2 是唯一的落點 |
| 端點比對只看 `x`／`y`，**不看 `z`** | belt（慣例 z＝0）與 pipe（z＝1）的端點落在同一 xy 格時會解到同一個埠。規則 2 必須自己擋，不能指望 `resolveConnections` |

---

## 2. 本項要回答的三件事（對照 W0914-A1 §2）

1. 連線前檢查的簽章長怎樣 → §4.2／§4.3
2. 原六條規則在新模型下哪幾條還成立 → §3
3. 規則放哪一層 → §5

---

## 3. 六條規則逐條重判（本項核心）

原規則表見 [C2 §4.1](../../../roadmap/detail/C2_add_connection_contract.md)（2026-08-22 凍結版，對 `FactoryEdge`）。

| # | 原規則 | 新模型下的判定 | 標記 |
|---|--------|----------------|------|
| 1 | 必須 output → input | **判定來源改變**：不再讀 edge 的方向欄位（管線沒有方向），改看 draft 解出的 `from`／`to` 各自是哪種 `portType`。兩端同為 `output` 或同為 `input` 時拒絕 | **改寫** |
| 2 | 媒質必須相同 | **升為三方一致**：舊模型只比兩埠；新模型的 `Pipeline` 自己帶 `media`，所以要求 `pipeline.media` ＝ `from` 埠媒質 ＝ `to` 埠媒質。任一不符即拒絕 | **改寫** |
| 3 | 單埠單線 | **語意成立，判定來源改變**：不再掃 `edges`，改掃現有 `resolveConnections` 結果中已被佔用的 `PortRef`（`deviceId`＋`portType`＋`portIndex` 三元組） | **改寫** |
| 4 | 不可自連 | 原樣成立：`from.deviceId === to.deviceId` 時拒絕 | **成立** |
| 5 | 不可重複邊 | **作廢為獨立規則**。新模型下兩台機器之間可以有多條實體管線走不同路徑（這是合理的），而「同一對埠被連兩次」已被規則 3 擋死。保留它只會製造一條永遠觸發不到的分支 | **作廢**（由規則 3 吸收） |
| 6 | handle 必帶 | **作廢**。新模型沒有 handle；端點由幾何命中決定。對應的新約束是「路徑良構」（waypoints ≥2 點、座標有限、逐段軸對齊），而這**已經實作在 `layoutStore.addPipeline` 的 `pipelineWaypointsValid`**，不需要 C2 重做 | **作廢**（已由 store 涵蓋） |

### 3.1 新增一條放行規則

| # | 規則 | 說明 |
|---|------|------|
| 7 | **斷線管線合法** | `from`／`to` 任一為 `null`（端點沒對上任何埠）**不是**違規。使用者可以先把管線畫到一半、或刪掉一台機器讓管線斷在原地——`Connection` 型別本身就允許 `null`，`removeDevice` 的 JSDoc 也明寫「管線保留（可變成斷線）」。canConnect 對這種 draft 回 `ok: true`，由 L2 自行決定畫成灰色而非綠色 |

這條要寫成明文，否則實作者很容易照舊模型的直覺把「沒接上」當成 `missing_handle` 拒絕掉，那會讓手動佈線無法進行（V12 演示頁的手動拉線就是這樣運作的）。

### 3.2 順帶澄清：相鄰即連線嗎

不會。`resolveConnections` 只從 `pipelines` 產出 `Connection`，**沒有管線就沒有連線**。兩台機器的埠錨點即使剛好貼在一起，也不會自動連上。這一點原 detail 沒寫，但新模型下會有人問。

---

## 4. 技術決策

### 4.1 回傳形狀：改 discriminated union

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 沿用原 `ConnectCheckResult` | `{ ok: boolean; reason: ... \| null; message: string \| null }` | 與 8/22 凍結版一致 | 型別擋不住 `{ ok: true, reason: 'media' }`；失敗時無法帶「是哪個埠」 | 否 |
| **B. discriminated union** | `ok` 當 discriminant；失敗分支各自帶該原因才有意義的資料 | 與同一 store 的 `PlacementResult` 同形，L2 只需一套 narrowing；能標紅特定的埠 | 與 8/22 版不相容（尚未實作，無遷移成本） | **是** |

負責人 2026-09-19 定案採 B（[A1 §2.2](./A1_scope_decision.md)）。

### 4.2 `message` 欄位拿掉，另出描述函式

原 §4.3 把 `message` 放進結果，理由是「L3 不做文案組裝」。這個理由仍然成立，但塞進 union 的每個分支會很難看，而且會逼純函式在還不知道語系的情況下先組好字串。

**決策：`ConnectResult` 不帶 `message`；同檔另出一支 `describeConnectFailure()`。** L3 仍然不組文案（呼叫這支函式的是 L2），而結構化資料（哪個埠、期望什麼媒質）比一句預組字串更有用——L2 可以據此只把違規的那個埠標紅。

### 4.3 型別草案

```ts
/** 連線失敗原因；命名風格對齊 PlacementFailReason */
export type ConnectFailReason =
    | 'direction'      // 兩端同向（皆 output 或皆 input）
    | 'media'          // pipeline.media 與埠媒質三方不一致
    | 'port_occupied'  // 該埠已被現有連線佔用
    | 'self_loop'      // 兩端落在同一台設備
    | 'malformed';     // waypoints 不良構（<2 點／非有限／非軸對齊）

/**
 * 連線可行性結果；**不 throw**，供 L2 決定 draft 的顏色
 *
 * `ok: true` 時 `from`／`to` 可為 `null`（合法但尚未接上；見 §3.1）。
 */
export type ConnectResult =
    | { ok: true; from: PortRef | null; to: PortRef | null }
    | { ok: false; reason: 'direction'; ports: [PortRef, PortRef] }
    | { ok: false; reason: 'media'; pipelineMedia: PortMedia; mismatched: PortMediaMismatch[] }
    | { ok: false; reason: 'port_occupied'; occupied: PortRef[] }
    | { ok: false; reason: 'self_loop'; deviceId: string }
    | { ok: false; reason: 'malformed' };

/** 媒質不符的單一埠 */
export interface PortMediaMismatch {
    port: PortRef;
    /** 該埠實際的媒質 */
    media: PortMedia;
}
```

型別**本版不落進 `src/types/layout.ts`**（[A1 §2.1](./A1_scope_decision.md)），隨 10/04 的實作一起落。

### 4.4 簽章

```ts
/**
 * 連線前檢查：draft 管線會不會產生非法連線
 *
 * @param draft 尚未落地的管線；不需要 id（還沒生）
 * @param layout 目前佈局；用來展開埠錨點與查已佔用的埠
 */
export function canConnect(
    draft: Pick<Pipeline, 'media' | 'waypoints'>,
    layout: {
        devices: readonly PlacedDevice[];
        pipelines: readonly Pipeline[];
    },
): ConnectResult;

/** 把失敗結果轉成一行繁中短句；`ok` 時回 null */
export function describeConnectFailure(result: ConnectResult): string | null;
```

### 4.5 實作硬約束：端點判定必須共用

`canConnect` 判斷 draft 的兩端落在哪個埠時，**必須呼叫 `resolveConnections` 內部那支同格多埠的判定邏輯**（`findPortAt`，含「起點偏好 output、終點偏好 input」與「否則取掃描順序第一個」兩條穩定規則），不得另寫一份。

理由：兩邊若各寫一份，在「同一格有多個埠」的情況下會對同一條 draft 得出不同的 `from`／`to`——於是 canConnect 說可以、`resolveConnections` 算出來卻是另一條連線。這是最難查的那種 bug。

實作時需把 `findPortAt`／`collectPortAnchors` 從 `resolveConnections.ts` 提為模組內共用或另開 `portAnchorIndex.ts`。**這是 10/04 實作週的第一件事**，不是順手可做的。

### 4.6 與引擎側的關係（原 §4.4 微調）

原結論維持：連線前守門與引擎側 V8 檢查不互相取代，且兩處必須共用同一組媒質判定函式。

**一處要改**：原文寫「引擎側的檢查保留，因為 JSON 匯入（D4）可能帶進未經 UI 的邊」。新模型下 D4 的匯入走 `layoutStore.loadSnapshot`，而 `loadSnapshot` 回傳 `LayoutIssues`（只查佔格與 id，**不查連線合法性**）。所以這句依然成立，而且更要緊——見 [C2 §4.4](./C2_d4_blueprint_format.md)。

---

## 5. 規則放哪一層（回答 W0914-A1 §2-3）

沿用原 §4.2 的方案 C（純函式＋action 內部雙保險），但**落點全部改變**：

| 層 | 落點 | 職責 |
|----|------|------|
| 純函式 | `src/utils/layout/connectRules.ts` | §3 的語意規則（方向／媒質／單埠單線／自連） |
| L1 store | `layoutStore.addPipeline` 內部呼叫 `canConnect` | 最終防線；繞過 UI 也擋得住 |
| L1 store（既有） | `addPipeline` 的 `pipelineWaypointsValid`＋`assessInvolving` | 路徑良構與**佔格重疊**；`canConnect` 不重做 |
| L2 | draft 期間呼叫 `canConnect` | highlight 顏色；放開前就知道能不能連 |

### 5.1 住址從 `src/utils/` 改到 `src/utils/layout/`

原 §5 規劃 `src/utils/connectRules.ts`。改為 `src/utils/layout/connectRules.ts`，與 `resolveConnections`／`overlapDetection`／`portAnchors` 等六件同區——它要共用那一區的錨點展開邏輯（§4.5）。

### 5.2 跨 CR 協商需求消失（重要）

原 §5／§8 要求「修改 `src/store/editorStore.ts` 的 `addConnection`，屬 CR-01 主責，須事前與主編確認並標為 Breaking」，並排 10/11 提出。

**新模型下這件事不存在。** 連線動作發生在 `layoutStore.addPipeline`，那是 aaaaa 自己的檔（V12 新建）。`editorStore.addConnection` 完全不碰。

影響：原 §10 的風險「改 `addConnection` 破壞既有 L2 MVP」**移除**；原 §8 的「最遲 10/11 提出跨 CR 協商」**移除**。這是 10/25 門檻的一項明確風險下降，E1 交接時要講。

### 5.3 職責分界：canConnect 不做什麼

| 不做 | 誰做 |
|------|------|
| 佔格重疊 | `addPipeline` → `assessInvolving` → `PlacementResult.overlap` |
| 路徑良構 | `addPipeline` → `pipelineWaypointsValid` |
| 環路 | **不擋**（沿用原凍結結論；`topologicalSort` 已能略過） |
| 速率上限（belt 30／pipe 60） | 引擎側 |
| 「這條連線在產線上有沒有意義」 | [R-D3](../../../roadmap/detail/D3_recipe_alerts.md) 警訊 |

---

## 6. 檔案計畫（改寫 C2 §5）

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/utils/layout/connectRules.ts` | `canConnect`＋`describeConnectFailure` |
| 新建 | `src/__tests__/utils/layout/connectRules.test.ts` | §3 四條有效規則各一正一反；斷線放行；malformed |
| 重構 | `src/utils/layout/resolveConnections.ts` | 提出共用的錨點展開與 `findPortAt`（§4.5）；對外行為不變，既有測試須原樣綠 |
| 修改 | `src/store/layoutStore.ts` | `addPipeline` 內部呼叫 `canConnect`（**aaaaa 自己的檔；非 Breaking**） |
| 修改 | L2 佈局容器（owner 依 10 月派工） | draft highlight；**不是 aaaaa 的刀** |
| 唯讀 | `src/composables/useFlowEngine.ts` | 確認媒質判定共用，不複製 |
| **不碰** | `editorStore.addConnection`、環路偵測、引擎既有檢查 | |

---

## 7. 週切片（改寫 C2 §6）

| 週日 | 切片 |
|------|------|
| 10/04 | 錨點判定提共用（§4.5）＋`connectRules.ts`＋測試。**純函式門檻** |
| 10/11 | `addPipeline` 接最終防線（提前一週；不需跨 CR 協商） |
| 10/18 | L2 draft highlight：不合法紅色、合法綠色、斷線灰色 |
| 10/25 | **門檻：** 型別對才允許連線，錯接有即時視覺 |

---

## 8. DoD（本細項）

> 下表左欄的節號指**產物** [detail/C2](../../../roadmap/detail/C2_add_connection_contract.md)，括號內指**本檔**。

- [x] detail/C2 §4.1 規則表已換成本檔 §3 的六條重判＋新增規則 7
- [x] detail/C2 §4.3 型別已換成本檔 §4.3 的 union；`message` 去留與理由已寫入
- [x] detail/C2 §4.2／§5 落點已改為 `src/utils/layout/connectRules.ts`＋`layoutStore.addPipeline`
- [x] detail/C2 §5／§8／§10 中「改 `editorStore.addConnection`／標 Breaking／10/11 跨 CR 協商」已移除，並在 §11 記錄移除理由
- [x] detail/C2 §6 週切片已更新（內部防線由 10/18 提前至 10/11）
- [x] 本檔 §4.5 的「端點判定必須共用」已寫進 detail，落在 **detail/C2 §4.4**（這是實作者最容易漏的一條）
- [x] detail/C2 meta 狀態 `[!]` → `[ ]`，`最後更新` 改 2026-09-19
- [x] detail/C2 §11 補開發日誌一則

---

## 9. 開發日誌

### 2026-09-19

- 讀 `resolveConnections.ts` 原始碼定規則：確認它只比 xy 不比 z、媒質規則無人在擋、
  同格多埠有 prefer 穩定規則 → 推出 §3 規則表、§4.5 共用約束
- 六條規則判定：1／2／3 改寫、4 成立、5 由 3 吸收作廢、6 已由 store 涵蓋作廢；新增規則 7 斷線放行
- 定案回傳形狀＝discriminated union（[A1 §2.2](./A1_scope_decision.md)）；`message` 改由 `describeConnectFailure` 出
- 發現跨 CR 協商需求消失（§5.2）：連線動作落在 `layoutStore.addPipeline`，不碰 `editorStore`
- **產物已落地：** detail/C2 全檔改寫，§8 DoD 全數勾選。本檔 §4.5 的共用約束在產物中編為 **§4.4**，
  DoD 已標明對應關係——兩份文件各自獨立編號，交叉引用時要寫清楚指的是哪一份
