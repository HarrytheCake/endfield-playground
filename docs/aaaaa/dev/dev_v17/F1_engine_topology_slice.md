# V17-F1 — 引擎讀新模型最小切片（經 `toTopology`）

**對應工項：** V17-F1
**狀態：** `[x]` 完成（A｜單元測試）
**日期：** 2026-10-18
**依賴：** [E1](./E1_flow_engine_id_lookup.md)、[V16-D1](../dev_v16/D1_engine_read_path.md) `[x]`
**正式依據：** [#73](https://github.com/dernoson/endfield-playground/issues/73) 驗收-2、[C5 §4.1a](../../../roadmap/detail/C5_source_primary_output.md)、#72 PR 註記
**開發分支：** `dev/aaaaa1018`

---

## 1. 背景

V16 已決：引擎讀取＝**經 `toTopology(layoutStore 快照)`**，不雙寫 editorStore。  
#73 要求與查表修正一併處理，否則「有欄位、有 adapter、引擎仍只認中文名」半套。

本細項交付**可測的最小讀取路徑**。生產掛載深度：**已決＝A 必交；B 加分**。

---

## 2. 最小切片定義

### 2.1 必做（A｜驗收釘死）

單元測試（或可匯出的純函式路徑）：

```text
layout 快照（英文 id）：
  基礎材料輸出點（source）—primaryOutput=源礦, rate=30
  → belt → 粉碎機
  → belt → 物品輸入口（sink）

toTopology → 餵引擎建圖／重算
→ 產耗：源產出 30/min、粉碎機相關、sink 收入可對上（#73：產耗各 30/min）
```

### 2.2 加分（B｜時數夠再加）

| 方案 | 內容 | 本版 |
|------|------|------|
| A | 僅單元測試經 toTopology 餵引擎 | **必交｜已交** |
| B | `/dev` 入口最小改掛 layoutStore＋toTopology | **加分｜本版未做** |

**不做：** 整包右側 ProductionStats／D1、廢除 editorStore、改 GridCanvas／MainLayout。

---

## 3. 技術決策

| 決定 | 說明 |
|------|------|
| Adapter | 使用既有 `toTopology`（已 `getMachineById` 預設） |
| 引擎入口 | 既有純函式鏈：`buildGraph` → `validateChains` → `topologicalSort` → `propagateFlows` → `calcItemSummary`（測試內 `runOnTopology`；不改 store 掛載） |
| primaryOutput | 消費 V16 欄位；測試直接組 `PlacedDevice` |

---

## 4. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/__tests__/flowEngine.topology.layout.test.ts` | #73 產線案例（A） |
| 可選修改 | `useFlowEngine.ts`／小 adapter | **未改**（純 API 夠用） |
| 可選 | `src/app/dev/…` | **B 未做** |

---

## 5. 驗證標準

| # | 案例 | 預期 | 結果 |
|---|------|------|------|
| 1 | §2.1 產線 | 源判為源；粉碎機有配方；產耗鏈 **30/min** 量級正確 | ✅ |
| 2 | 缺 primaryOutput 的源 | 行為與現行引擎一致（可不產數字） | ✅ |
| 3 | 品質閘 | 全綠 | ✅ 2 tests |

---

## 6. DoD

- [x] §2.1 測試綠（A）
- [x] 接法與 V16-D1／PR 註記一致（經 toTopology）
- [x] 未做右側產耗整包
- [ ] PR 註明本版＝A（若含 B 一併寫）→ **G1**

---

## 7. 開發日誌

### 2026-10-18｜完成（A）

- 新增 `flowEngine.topology.layout.test.ts`：`material_source`／`crusher`／`item_sink` 英文 id 快照 → `toTopology` → 引擎
- 產線：源礦／源石粉末 產耗各 30/min；缺 `primaryOutput` 不產數字
- **未做 B**（`/dev` 掛載）；下一刀＝G1

### 2026-10-18｜定案

- F-1＝A 必交；B 時數夠再加（負責人確認）

### 2026-10-18

- 建檔；待 E1
