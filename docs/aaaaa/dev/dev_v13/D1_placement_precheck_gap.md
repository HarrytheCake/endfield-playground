# V13-D1 — 0921 落子前置：缺口盤點與簽章草案

**對應工項：** V13-D1
**狀態：** `[x]` 完成（2026-09-19；V14-B1 於 2026-09-27 收斂 meta）
**日期：** 2026-09-19
**依賴：** [A1](./A1_scope_decision.md)（定案 #5：只收 `canPlaceDevice`，純文件）
**性質：** **非工單項**；負責人 2026-09-19 追加
**產物：** 本細項本身即交付物（無程式產物）

---

## 1. 為什麼現在盤

[W0914-A0 §2](../../../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md) 寫明「B1 的工具列→落子那一刀**改排 9/21**」，[§5](../../../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md) 寫明「容器 owner 是 toby，9/21 才開落子」。而 9/27 是**硬綁 B1** 的門檻日。

也就是說：B1 依賴 B2（擺放鏈），B2 依賴殼（T1／#50），**而 B2 只有 9/21 → 9/27 一週**。若 9/21 開刀當天才發現 L1 側缺東西，那一週要同時補 L1 與接 L2，來不及。

本項的產出是給 0921 派工用的一張現成清單，不是實作。

---

## 2. 核心缺口：落子前沒有「不寫入」的入口

### 2.1 現況

`layoutStore` 對外只有「做了才知道」的入口：

```ts
addDevice(device: PlacedDevice): PlacementResult;
moveDevice(id: string, position: Position): PlacementResult;
```

檢查邏輯確實齊全，但它住在模組私有的兩支函式裡，**沒有 export**：

| 函式 | 位置 | 對外可見 |
|------|------|----------|
| `collectLayoutIssues(devices, pipelines)` | `src/store/layoutStore.ts` | **否**（模組私有） |
| `assessInvolving(devices, pipelines, involvedIds)` | 同上 | **否**（模組私有） |

### 2.2 B2 要的是什麼

擺放鏈的互動是：從工具列拖一台機器出來 → 游標在格點上移動 → **每一格都要即時顯示這裡能不能放**（綠框／紅框）→ 放開才落子。

用現有 API 做不到，三個理由：

| # | 障礙 | 說明 |
|---|------|------|
| 1 | 預檢沒有入口 | 要知道能不能放，只能真的 `addDevice`。它失敗時確實不會寫入、也不會進歷史（`assessInvolving` 失敗就 `return`），所以不會污染狀態——但這是**依賴實作細節**的用法，哪天 `addDevice` 改成先寫後檢就爛掉 |
| 2 | 預檢的輸入比 `PlacedDevice` 少 | 拖曳當下只有 `machineType`、目標格、`rotation`。`PlacedDevice` 要求 `id`，於是 L2 得為每一格 mousemove 先 `crypto.randomUUID()` 生一個**用完就丟**的 uid |
| 3 | 失敗結果指不到 draft | `PlacementResult.conflicts` 是 `[string, string][]` 的 id 配對。draft 還沒有 id，L2 拿到配對也不知道哪一邊是自己 |

繞過去的土砲作法是 L2 自己 import `toDeviceFootprint`＋`deviceSizeFromMachine`＋`detectOverlaps` 重算一次（這三支都是 public export）。**那就是兩套判定**，跟 [C1 §4.5](./C1_c2_connect_contract.md) 要避免的是同一類錯誤。

### 2.3 效能要先講清楚

`collectLayoutIssues` 是**全量**的：對所有 devices 與 pipelines 展開佔格再跑 `detectOverlaps`。拖曳時每格呼叫一次，等於每格跑一次全量。

這在幾十台設備的規模沒問題，但**要寫明量級與量測門檻**，不要讓 L2 自己踩到才發現。建議寫進 detail 的一句：「設備數超過約 200 時改由 L2 自行 debounce 或改增量判定；在此之前不做最佳化」。不預先最佳化，但也不讓人以為它免費。

---

## 3. 簽章草案

```ts
/** 尚未落子的設備；沒有 id */
export interface DeviceDraft {
    machineType: string;
    /** 佔格左上角；z 為佔用層起點 */
    position: Position;
    rotation: Rotation;
    /** 缺省時以該機 modes[0].id 解釋 */
    machineMode?: string;
}

/** 目前佈局；唯讀 */
export interface LayoutView {
    devices: readonly PlacedDevice[];
    pipelines: readonly Pipeline[];
}

/**
 * 落子前預檢：**不寫入 store、不生 uid、不進 history**
 *
 * 失敗時 `conflicts` 內以 {@link DRAFT_ID} 代表尚未落子的這一台。
 */
export function canPlaceDevice(draft: DeviceDraft, layout: LayoutView): PlacementResult;

/**
 * 移動前預檢：同上，但對象是已存在的設備
 *
 * @param id 既有設備 uid；不存在或不唯一時回 invalid
 */
export function canMoveDevice(id: string, position: Position, layout: LayoutView): PlacementResult;

/** draft 在 PlacementResult.conflicts 中的代稱 */
export const DRAFT_ID = '__draft__';
```

### 3.1 三個設計決定與理由

| 決定 | 理由 |
|------|------|
| **回傳沿用既有 `PlacementResult`**，不新增型別 | L2 對 `addDevice` 與 `canPlaceDevice` 用同一套 narrowing。預檢與實際落子回同樣的東西，才能保證「預覽綠了就一定放得進去」 |
| **`conflicts` 用保留 id `'__draft__'`** | 讓 L2 從配對中認出自己。取值要在 detail 裡寫死並在測試釘住，不能讓呼叫端各自約定 |
| **`canMoveDevice` 一起出** | B2 不只有落子，還有拖曳既有設備。兩支共用同一份佔格計算，分開交等於做兩次 |

### 3.2 為什麼不是 `canPlaceDevice(device: PlacedDevice)`

因為那樣就得先生 uid（§2.2 障礙 2）。`DeviceDraft` 刻意不含 `id`，型別本身就擋掉「拿預檢當落子用」。

---

## 4. 落點與 store 的關係

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/utils/layout/placementCheck.ts` | `canPlaceDevice`／`canMoveDevice`／`DRAFT_ID` |
| 新建 | `src/__tests__/utils/layout/placementCheck.test.ts` | 空地可放／重疊拒絕（conflicts 含 `__draft__`）／未知機型 invalid／非有限座標 invalid／移動到自己原位可放 |
| 重構 | `src/store/layoutStore.ts` | 把 `collectLayoutIssues`／`assessInvolving` 提到 `placementCheck.ts`；`addDevice`／`moveDevice` 改呼叫它 |
| **不碰** | `editorStore`、L2 容器 | |

重構那一列是重點：**不是另寫一份**，是把 store 裡那兩支私有函式搬出來共用。搬完之後 store 的對外行為必須完全不變，`layoutStore.test.ts` 原樣綠——這是驗收條件。

這與 [C1 §5](./C1_c2_connect_contract.md) 的分層一致：純函式在 `src/utils/layout/`，store 呼叫它作最終防線，L2 呼叫它做預覽。

---

## 5. 0921 週切片建議

| 週日 | 切片 | 誰 |
|------|------|-----|
| 9/21 → 9/23 | `placementCheck.ts` 提共用＋`canPlaceDevice`／`canMoveDevice`＋測試；`layoutStore` 測原樣綠 | aaaaa（L1，純函式） |
| 9/21 → 9/27 | B2 L2 接上：拖曳預覽綠／紅、放開呼叫 `addDevice` | 容器 owner（依 0921 派工） |
| 9/27 | **門檻：** B1 硬綁——工具列選機器 → 放到格點 → 畫面上有那台機器 | — |

L1 那一刀刻意排在前三天，讓 L2 有四天可接。兩者不同檔，可平行開工：L2 先照簽章寫呼叫、L1 交件後接上即可。

---

## 6. 相鄰缺口（本版只記錄，不決策）

盤點時另外找到四個 L1 側缺口。負責人 2026-09-19 裁示**本版只收落子前預檢**，以下四項只記錄，供 0921 派工時參考（理由見 [A1 §2.4](./A1_scope_decision.md)）。

| # | 缺口 | 現況 | 誰要用 | 為什麼本版不決 |
|---|------|------|--------|----------------|
| 1 | `createPlacedDevice` 工廠 | 無。呼叫端要自己生 uid、填預設 `rotation`／`machineMode`／`label` | B1 工具列→落子；B2 | 落子端 owner 未定；工廠的預設值（label 用中文名還是 id）屬呈現決策，要問 paper |
| 2 | `rotateDevice` action | `PlacedDevice.rotation` 型別有，store 無對應 action | R-B3（旋轉 90 度） | B3 不擋 9/27 門檻；排序未定 |
| 3 | 選取面歸屬 | `layoutStore` 無選取；`selectionStore` 屬舊藍圖世界 | R-B4（選取與設備資訊面板） | 牽涉 CR-01 邊界，需主編＋aaaaa（[AGENT_ROADMAP §7](../../claude/AGENT_ROADMAP.md)） |
| 4 | belt 佈線純函式升格 | `buildBlockedXy`／`bfsGridPath`／`compressGridPath`／`findRoutableBeltWaypoints` 住在 `src/app/dev/layoutStorePreviewUtils.ts`（**dev-only**） | B2 自動拉線；R-C3 管線折線渲染 | C3 owner 未定；升格範圍要看 C3 實際要哪幾支 |

> 第 4 項是**搬家不是重寫**：這些函式隨 #45 一起進了版控（見 [B1 §2.1](./B1_v12_residue_close.md)），已有 `src/__tests__/app/layoutStorePreviewUtils.test.ts` 覆蓋。

---

## 7. DoD（本細項）

- [x] §2 缺口敘述可獨立閱讀（0921 派工者不必回頭讀 layoutStore 原始碼）
- [x] §3 簽章草案含 `DeviceDraft`／`LayoutView`／`DRAFT_ID` 與三個設計決定的理由
- [x] §4 落點寫明「提共用、非另寫一份」，並列出 store 行為不變的驗收條件
- [x] §5 切片建議標明 L1／L2 可平行開工
- [x] §6 四個相鄰缺口各有現況、用途、不決理由
- [x] 本版**未**動 `src/`

---

## 8. 開發日誌

### 2026-09-19

- 讀 `layoutStore.ts` 確認 `collectLayoutIssues`／`assessInvolving` 為模組私有 → 核心缺口＝預檢無入口
- 確認 `toDeviceFootprint`／`deviceSizeFromMachine`／`detectOverlaps` 皆為 public export
  → L2 有能力自己重算一份，這正是要先擋下的重複實作
- 簽章定為回傳既有 `PlacementResult`、draft 以 `'__draft__'` 代稱；`canMoveDevice` 一併出
- 盤出四個相鄰缺口，依負責人裁示只記錄不決策

### 2026-09-27（V14-B1）

- meta／DoD 由 `[ ]` 收斂為 `[x]`（與 todolist_v13 對齊）；內容未改
- 確認本檔 §3 仍為 W0921-A0／V14-C1 的**唯一簽章依據**
