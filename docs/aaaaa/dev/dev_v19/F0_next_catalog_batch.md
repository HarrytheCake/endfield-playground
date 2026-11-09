# V19-F0 — 下一批 Hub catalog／可點測補齊（交接草案）

**對應工項：** V19-F0（交接清單）
**狀態：** `[x]` 清單落版；**已由 [V20-A1](../dev_v20/A1_scope_decision.md) 正式承接**（2026-11-01；實作見 V20-C1／D1）
**日期：** 2026-11-01
**依賴：** [E1](./E1_ops_rules_and_handoff.md) `[x]`（維運規則已訂）
**承接：** [todolist_v20](../todolist_v20.md)（**已開版**）、[dev_v20/](../dev_v20/)
**單一真相：** `/dev/l1-contract-lab`＋`contractCatalog.ts`（沿用 E1 §1；**不另開第二 hub**）

---

## 1. 為什麼要這份

V19＝Hub **MVP**（目錄骨架＋詞彙＋少數點測）。inventory 大量 `todo` 是刻意欠帳，不是本週失敗。  
本檔把「下一批先補什麼」裁成**可開工切片**，避免後續一次填滿全量。

---

## 2. 本批範圍（建議＝一週級切片）

### 2.1 必做（P0／P1｜L2 最常踩雷）

| 優先 | API／符號 | 目標 | 建議分頁 |
|------|-----------|------|----------|
| P0 | `collectPortAnchors`／`findPortAt` | 定義表＋一鍵對照：**格點精確 ≠ `hitTestPortAt` 熱區** | 新建案例或掛 V15 旁註 |
| P0 | `resolveConnections` | 定義表＋可點測（管線→`Connection[]`；與 `canConnect` 同錨點語意） | V14／V15 或新「連線解析」區 |
| P1 | `addPipeline`／`removePipeline` | 獨立 Pinia 一鍵寫入／刪除；文案標 **內含 canConnect** | V16 |
| P1 | `buildGapConnectionWaypoints` | **inventory 新增列**＋可點測；與 `buildConnectionWaypoints` 對照（間隙繞障） | V15 |

### 2.2 本批建議順帶（P2｜同一刀可吃則吃）

| API | 說明 |
|-----|------|
| `resolvePortAnchorCell` | 與 findPortAt／錨點同一故事；可併定義列 |
| `describeConnectFailure` | 已 listed；若有餘力拆獨立按鈕（現多跟 canConnect） |

### 2.3 本批**不做**（列 V20+／再下一刀）

| 區 | 符號（inventory 仍 `todo`） |
|----|------------------------------|
| layout-utils | `getDeviceOccupiedCells`、`detectOverlaps`、`toDeviceFootprint`／`toPipelineFootprint`、`collectLayoutIssues`／`assessInvolving`、`getPipelineTiles`／`buildPipelinePolyline`、`getMachinePortMedia`、`pipelineGeometry` 系列 |
| layout-store | `loadSnapshot`／`toSnapshot`、`connections`／`layoutIssues`（computed） |
| validation | `detectors`／E001…（可選掛說明） |
| 基礎設施 | JSDoc／codegen 自動同步（仍依 A-4；另開版本評估） |

> **平行線（非本 F0 切片）：** Lab **輕量可調參試玩**（非 swagger）→ [V20-F1](../dev_v20/F1_tryout_not_swagger.md)／[V21-A0 牌程](../dev_v21/A0_tryout_panel_plan.md)。與 §2.3 inventory 補齊**脫鉤**。

---

## 3. 完整待列快照（2026-11-01｜相對 inventory）

> 實作時以 `CONTRACT_INVENTORY` 為準；本表僅交接用。

**layout-utils `todo`：**  
`resolvePortAnchorCell` · `collectPortAnchors／findPortAt` · `resolveConnections` · `getDeviceOccupiedCells` · `detectOverlaps` · `toDeviceFootprint／toPipelineFootprint` · `collectLayoutIssues／assessInvolving` · `getPipelineTiles／buildPipelinePolyline` · `getMachinePortMedia` · `pipelineGeometry` 系列  
（近親未單獨列：`buildGapConnectionWaypoints` → **本批應新增 inventory 列**）

**layout-store `todo`：**  
`addPipeline／removePipeline` · `loadSnapshot／toSnapshot` · `connections／layoutIssues（computed）`

**validation `todo`：** `detectors／E001…`

---

## 4. 技術約束（沿用 V19）

| 項 | 規則 |
|----|------|
| 真呼叫 | 一鍵案例必須呼叫真實 API |
| 簽名 | **不改** `layoutStore`／`utils/layout`／`editorStore` 簽名 |
| 畫布 | **不碰** `LayoutView`／`GridCanvas` 業務 |
| Pinia | 寫入類走 `withLabPinia`（或同等隔離） |
| catalog | `todo`→`listed`＋定義列＋（建議）可點測；依 [E1 §1.2](./E1_ops_rules_and_handoff.md) |
| 路由 | 不另開第二 hub |

---

## 5. 建議實作順序（單人一天級）

```text
1. findPortAt 對照 hitTestPortAt（文案＋雙案例）
2. resolveConnections（唯讀案例）
3. buildGapConnectionWaypoints（inventory 新列＋點測；對照既有 waypoints）
4. addPipeline／removePipeline（獨立 Pinia；失敗路徑可帶 describeConnectFailure）
5. （可選）resolvePortAnchorCell 定義列
6. type-check／lint；回寫 todolist_v20／USAGE／AGENT_WEEK
```

---

## 6. DoD（本批實作完成時才勾）

- [x] P0／P1 四項皆有定義列（或同等白話）且 inventory＝`listed`（V20-C1／D1）
- [x] `buildGapConnectionWaypoints` 已進 inventory（不再只活在 dont 句）
- [x] 每項至少一則可點測（寫入類隔離 Pinia）
- [x] USAGE 易踩雷句已補（熱區 vs 錨點；gap vs 一般 waypoints；addPipeline）
- [x] 未改鎖檔／簽名；品質閘綠
- [x] **未**一次填滿 §2.3 全量
- [x] 正式 E1 驗收表勾選（見 [V20-E1](../dev_v20/E1_acceptance_and_handoff.md)）

---

## 7. 開發日誌

### 2026-11-01｜V20-E1 驗收通過

- F0 §6 全勾；本批交接完成；PR 另裁

### 2026-11-01｜V20-C1／D1 實作完成

- F0 §6 實作項勾完；其後 E1 驗收

### 2026-11-01｜V20 正式承接

- V20-A1 `[x]`；實作改走 [todolist_v20](../todolist_v20.md)／C1→D1→E1

### 2026-11-01｜清單落版

- 依 inventory 盤點＋L2 踩雷優先序裁本批
- 本檔本身不改程式
