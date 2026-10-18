# V16-D1 — 引擎讀取最小接法定案（PR 註記｜本版不實作）

**對應工項：** V16-D1
**狀態：** `[x]` 已決＝經 `toTopology`（2026-10-18｜負責人）
**日期：** 2026-10-18
**依賴：** [A1](./A1_scope_decision.md) `[x]`
**正式依據：** [C5 §4.1a](../../../roadmap/detail/C5_source_primary_output.md)、[W1011-A0](../../../work_dispatch/aaaaa/1011/W1011-A0_c5_primary_output.md)
**目的：** 本版 PR 必須寫明「10/18 引擎怎麼讀到 primaryOutput」的選定接法；**程式改動留到下週**

---

## 1. 背景

裁決 B 的附帶義務：10/18 切片須讓引擎（或經 adapter）讀到正式畫布上的 `PlacedDevice.primaryOutput`。範圍只限源素材讀取路徑，**不做**整包右側產耗（D1 roadmap）。

現況：

| 對象 | 現況 |
|------|------|
| `PlacedDevice.primaryOutput` | 型別已有；本版 C1 補寫入 |
| `toTopology` | **已**映射 `primaryOutput`／`sourceRatePerMin` |
| `useFlowEngine` | **仍掛**舊 `editorStore`／`FactoryNode.data` |

---

## 2. 方案比較

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| **A. 經 `toTopology`** | 正式畫布路徑：`layoutStore` → `toTopology` → 餵引擎建圖輸入 | adapter 已映射；改動集中在「誰呼叫 toTopology／watch 來源」；與 D4 藍圖形一致 | 須確認引擎入口能否吃拓樸節點而非只 watch editorStore | **是（已決）** |
| B. 引擎直接讀 `layoutStore` | `useFlowEngine` 內改 watch `layoutStore.devices` | 最短路徑 | 引擎與 layout 耦合加深；易膨脹成「整包接 layoutStore」 | 否 |
| C. 雙寫 editorStore | action 同時寫舊 store | 引擎零改 | 違反唯一寫入點；裁決已否 C | **禁止** |

---

## 3. 定案（2026-10-18｜負責人）

**採 A：經 `toTopology`。**

PR 註記原文（一句）：

```text
10/18 引擎讀取最小接法：正式畫布經 toTopology(layoutStore 快照) 餵入引擎建圖；
不雙寫 editorStore；不做整包右側產耗。
```

實作邊界（下週，非本版）：

- 只打通「源素材讀取 → 有數字」最小路徑
- 不改 `editorStore` 簽名
- 不接 ProductionStats／D1 右側表

---

## 4. DoD（本細項）

- [x] §3 接法經負責人確認＝A（`toTopology`）
- [x] 同上句寫進 PR body
- [x] 本版 diff **不含** `useFlowEngine`／引擎改掛（E1 複驗）

---

## 5. 開發日誌

### 2026-10-18｜已決

- 負責人確認採 A（經 `toTopology`）

### 2026-10-18

- 建檔；建議採 A；待確認
