# V16-A1 — 範圍與定案

**對應工項：** V16-A1
**狀態：** `[x]` 完成（2026-10-18｜開版定案）
**日期：** 2026-10-18
**開發分支：** `dev/aaaaa1011`
**正式依據：** [W1011-A0](../../../work_dispatch/aaaaa/1011/W1011-A0_c5_primary_output.md)、[WEEK_20261011](../../../work_dispatch/WEEK_20261011.md) v1.2、[C5](../../../roadmap/detail/C5_source_primary_output.md)、[todolist_v16](../todolist_v16.md)

> **執行計畫：** 本檔所屬之 `todolist_v16`＋`dev_v16/` **即為**本週 aaaaa 執行計畫檔。

---

## 1. 背景

### 1.1 連線月第二週與關鍵路徑

全隊主戲＝設備拖曳（toby）＋左面板換新（harry）＋畫布樣式子元件。aaaaa **不在**拖曳／換面板寬度上。

C5 store 歸屬已裁 B（PR #59）。本週工單要求交**寫入 action**，讓 10/18 引擎讀切片有欄可讀；正式頁表單與引擎改掛仍排後。

### 1.2 為什麼是 V16 不是續掛 V15

V15（出界＋埠命中）已合 master（#60／#65）。本週是新工單 W1011-A0，性質從「純函式」改為「store action＋歷史」，消費者與檔案面不同 → 新版本號。

---

## 2. 最終決策（2026-10-18 開版）

| # | 決策 | 落點 |
|---|------|------|
| 1 | V16＝W1011-A0 ② | 本檔／todolist |
| 2 | 掛點＝`layoutStore`（裁決 B） | [C1](./C1_set_device_primary_output.md) |
| 3 | 簽章＝`setDevicePrimaryOutput(uid, itemId \| null, ratePerMin?) → void` | C5 §4.2／工單 |
| 4 | 未知 uid＝**靜默 no-op，且不進歷史**（不 throw） | C1 |
| 5 | `itemId === null`＝清除 `primaryOutput`／`sourceRatePerMin` | C1 |
| 6 | 省略速率＝預設 **30**／min | C5 §4.4 |
| 7 | 歷史型別＝**`MachineRecipeChange`**（已決） | C1 |
| 8 | 引擎讀取＝**經 `toTopology`**（已決）；本版只寫 PR；實作下週 | [D1](./D1_engine_read_path.md) |
| 9 | **不發**解鎖句 | [E1](./E1_acceptance_and_handoff.md) |
| 10 | 不碰 GridCanvas／LayoutView／MainLayout／toolbar／Stats／shapes／detectors | AGENT_WEEK 禁止表 |
| 11 | 分支 **`dev/aaaaa1011`** | meta |

### 2.1 為什麼本版不做引擎改掛／表單

工單 §1／§2：引擎讀＝下週；正式頁表單可延。混進引擎會與 toby／harry 鎖檔與 review 面膨脹衝突。

### 2.2 為什麼回傳 void 而非 PlacementResult

C5／工單契約寫 `→ void`。本 action 不做 overlap 預檢；未知／重複 uid＝靜默 no-op **且不進歷史**。若日後 L2 需要 ok／fail 語意，另開擴充，**不在本版**。

### 2.3 與其他 action 的一致性

沿用 `moveDevice`／`addDevice` 模式：clone before／after → `historyStore.execute` → execute／undo 還原整份 devices 陣列拷貝。`cloneDevice` 已 spread 頂層欄位，足以覆蓋 `primaryOutput`／`sourceRatePerMin`。

---

## 3. 與既有版本／工單邊界

| 對象 | 關係 |
|------|------|
| V15 | 已合 master；本版 B1 收斂文件狀態 |
| W1011-A0 | 本版 C1＝其實作 DoD；①已完成；D1＝PR 註記義務 |
| W1011-T2（toby） | 消費既有 `moveDevice`；**零檔案交集** |
| W1011-H2（harry） | 日後呼叫本 action；本版不改 MainLayout |
| R-C5 | 本版交寫入端；引擎讀／表單＝後續切片 |
| R-C1 | owner＝toby；本版不碰 |

---

## 4. 非目標

見 [todolist_v16](../todolist_v16.md)「非目標」。

---

## 5. DoD（本細項）

- [x] §2 決策與 todolist 概述一致
- [x] §3 邊界表含 T2／H2／R-C5／R-C1
- [x] 明文「不發解鎖句」與 void／預設 30

---

## 6. 開發日誌

### 2026-10-18｜負責人確認

- D-1＝`MachineRecipeChange`；D-2＝經 `toTopology`；未知 uid＝no-op 不進歷史

### 2026-10-18

- 開版定案；對齊 WEEK v1.2／W1011-A0／C5 §4.1a
