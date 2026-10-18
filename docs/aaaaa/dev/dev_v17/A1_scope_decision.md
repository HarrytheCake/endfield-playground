# V17-A1 — 範圍與定案

**對應工項：** V17-A1
**狀態：** `[x]` 完成（2026-10-18｜#73 線定案；同日擴寫納入 #58）
**日期：** 2026-10-18
**開發分支：** #73＝`dev/aaaaa1018`；#58＝`dev/aaaaa1018-58`
**正式依據：** [#73](https://github.com/dernoson/endfield-playground/issues/73)、[#58](https://github.com/dernoson/endfield-playground/issues/58)、[todolist_v17](../todolist_v17.md)、[V16-D1](../dev_v16/D1_engine_read_path.md)

> **執行計畫：** `todolist_v17`＋`dev_v17/` **即為**本週 aaaaa 執行計畫檔。

---

## 1. 背景

### 1.1 為什麼現在做

V16（#72）交了 `setDevicePrimaryOutput`，並預告引擎經 `toTopology` 讀新模型。新模型 `machineType`＝英文 id，但驗證／引擎仍用 `getMachine`（中文名）。**只接 toTopology、不改查表＝整條鏈假活。** 主編開 #73，要求與「引擎讀最小切片」一併處理。

並行債：**#58**（dev／正式頁共用 `historyStore`；正式頁開頁自動載 `connected` 示範並進 Undo）。assignee＝aaaaa；#57 S1-2 列過；W1004 曾暫緩以免與 toby 搶 `LayoutView`。本版收進 V17 第二主線。

### 1.2 為什麼是 V17

V16 範圍刻意不含引擎改掛。本版是 #73 新工單＋兌現 V16-D1 附帶義務，並清 #58 → 新版本號。

---

## 2. 最終決策

### 2.0 版本範圍（2026-10-18｜擴寫）

| 主線 | Issue | 狀態 |
|------|-------|------|
| **查表＋引擎讀** | [#73](https://github.com/dernoson/endfield-playground/issues/73) | 實作完；[#74](https://github.com/dernoson/endfield-playground/pull/74) 交審中 |
| **歷史隔離＋停載示範** | [#58](https://github.com/dernoson/endfield-playground/issues/58) | 文件已開；實作＝H1／H2／H3 |

### 2.1 #73 線（2026-10-18｜負責人確認；已執行）

| # | 決策 | 落點 |
|---|------|------|
| 1 | 權威查表＝`getMachineById`；過渡＝`byId ?? byName` | [C1](./C1_resolve_machine_def.md) |
| 2 | `resolveMachineDef` 放 **`machines.ts`** | C1 |
| 3 | 配方鍵維持中文 `machineDef.name` | D1／E1 |
| 4 | E004／W001 **只改查表**；A-5 不動；開 PR 知會 azure | [D1](./D1_validation_id_lookup.md) |
| 5 | 引擎查定義走同一 resolve；配方走 name | [E1](./E1_flow_engine_id_lookup.md) |
| 6 | 讀取路徑＝經 `toTopology`；**F1＝A 必交、B 加分** | [F1](./F1_engine_topology_slice.md) |
| 7 | #73 驗收／PR＝[G1](./G1_acceptance_and_handoff.md) | G1／#74 |
| 8 | **不發**解鎖句 | G1／H3 |
| 9 | #73 分支 **`dev/aaaaa1018`**（#74）；#58 分支 **`dev/aaaaa1018-58`** | meta |

### 2.2 雙查移除時機（寫進程式註解＋PR）

當正式頁與驗證／引擎**不再**消費 `editorStore` 的中文 `machineType`（#57 S4-1／S5-2 完成且 dev 頁遷完）→ 刪 `?? getMachine` 分支，只留 `getMachineById`。

### 2.3 生產掛載——**已決＝A 必交；B 加分**

| 方案 | 說明 | 本版 |
|------|------|------|
| **A. 測試餵入** | 單元測試：`toTopology`→引擎可測入口；生產仍可 watch editorStore | **必交**（滿足 #73 驗收）｜**已交** |
| **B. `/dev` 最小掛載** | `/dev` 入口改餵 layoutStore＋toTopology | **時數夠再加**｜未做 |

### 2.4 #58 線（2026-10-18｜納入 V17）

| # | 決策 | 落點 |
|---|------|------|
| 1 | 正式頁**不**自動 `loadSnapshot(connected)` | [H1](./H1_stop_auto_demo_snapshot.md) |
| 2 | 跨正式／dev 情境 → `historyStore.clear()`（不做雙 Pinia） | [H2](./H2_clear_history_on_context_switch.md) |
| 3 | 本版**不**預設重置 `layoutStore`（與清歷史分離） | H2 |
| 4 | #58 專線驗收／PR＝[H3](./H3_history_isolation_acceptance.md)；分支 **`dev/aaaaa1018-58`**（與 G1／#74 分線） | H3 |
| 5 | 示範資料只留 `/dev` | H1 |

---

## 3. 與既有邊界

| 對象 | 關係 |
|------|------|
| V16／#72 | 已合；本版兌現引擎讀註記 |
| #73 | 第一主線；#74 交審 |
| #58 | 第二主線；H1–H3 |
| #64／azure | E004／W001 **只改查表**；A-5 已決不重開 |
| #57 S4-2／S1-2 | 查表對 S4-2；歷史對 S1-2 |
| layout utils | 已 `getMachineById`；非主刀 |
| toby／harry／樣式 | #73 線零交集；**#58 必動 `LayoutView`**——PR 知會 toby／harry（空畫布驗收改手動） |

---

## 4. 非目標

見 [todolist_v17](../todolist_v17.md)。

---

## 5. DoD（本細項）

- [x] §2 決策與 todolist 概述一致
- [x] 明文雙查移除時機與 F-1＝A／B
- [x] 邊界含 #73／#58／#64／layout utils
- [x] #58 納入後 H1／H2／H3 細項已建檔

---

## 6. 開發日誌

### 2026-10-18｜擴寫 #58

- V17＝#73＋#58；H1／H2／H3 建檔；#73 線標為已交、待 #74 合入

### 2026-10-18｜負責人確認

- C-1＝machines.ts；F-1＝A 必交、B 加分；D-1＝只改查表、開 PR 知會 azure

### 2026-10-18

- 開版草案；對齊 #73 原文與 master `c5af7fc`
