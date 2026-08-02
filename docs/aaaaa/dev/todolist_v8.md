# V8 TODOLIST — Dev 資料預覽＋FlowEngine 埠／媒質／速率規則

**版本：** V8  
**建立日期：** 2026-08-01  
**最後更新：** 2026-08-02  
**負責人：** aaaaa  
**前置：** V7 完成（資料 v3／machineMode／belt·pipe）；開版時 V6 鎖定（後於 2026-08-02 解鎖）  
**狀態總覽：** A–G 實作完成；正式關閉／report 可另開

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## 概述

### 目標

1. `/dev/flow-engine` 內新增**機器／產品**分頁：JSON 檢視＋可視化預覽（色塊／文字／placeholder；圖像後補）
2. FlowEngine 引擎側強化（**CR-04 先做**；不依賴 CR-02／CR-03 連線拒絕）：
   - 單埠僅能接一條線路；多線進單口必經匯流器
   - 複數出入口依當前 `modes[].ports` 數量判定
   - 固體→輸送帶、液／氣→管道；速率上限 belt 30／pipe 60
   - 拓樸視覺化依 `machineMode` 的 ports 顯示方位與數量；切 mode 更新標籤
3. 品項 `form: 'solid' | 'liquid' | 'gas'`（已入 materials／products／`src/data`）

### 已定案（2026-08-01）

| 項 | 結論 |
|----|------|
| 版本 | **開 V8**；V6 鎖定不重開 |
| Dev 預覽 | 掛在 `/dev/flow-engine` **分頁／分區**（非獨立路由） |
| 圖像 | 先 placeholder；正式圖後補 |
| 埠基數 | 依 `modes[].ports`；**每埠最多一條邊** |
| H8 | 改為合法「雙鏈 → 匯流器 → Sink」；滿速 30+30 匯入後出口仍 30 → 反向堵塞，上游約各 15 |
| 驗證落點 | **僅 FlowEngine**（非法標記／速率截斷）；文件註明 CR-04 引擎側先行 |
| 拓樸 | 改 `/dev/graph-viz` 與／或 flow-engine 內拓樸；跟 `machineMode` ports；切 mode 更新標籤 |
| 速率 | `BELT_RATE_LIMIT = 30`；`PIPE_RATE_LIMIT = 60` |
| 媒質判定 | 依品項 **`form`**：solid→belt，liquid／gas→pipe |
| form | 已寫入 materials／products；型別 `ItemForm`；codegen 至 `src/data` |

詳見 [A1_scope_decision.md](./dev_v8/A1_scope_decision.md)。

### 非目標（本版不做）

- V6 拖曳 debug／管線跟隨
- CR-02 連線時 UI 拒絕、CR-03 Detector（可後續對齊）
- 產品正式圖像資源
- loss 納入 summary（仍延後）

### 流程大綱

```text
A 定案 ✓ → B Dev 預覽 ✓ → C 引擎規則 ✓ → D 拓樸 ✓ → E form ✓ → F 測試 ✓ → G 文件 ✓
```

### 尚未開發／本版刻意不做（供追蹤）

| 類別 | 項目 | 說明 |
|------|------|------|
| 本版非目標 | CR-02 UI 連線拒絕 | 引擎已標非法；畫布拒絕連線屬後續 |
| 本版非目標 | CR-03 Detector 對齊 | 同上 |
| 本版非目標 | 正式產品／機器圖 | Dev 仍用 placeholder |
| 本版非目標 | loss→summary | V7 起刻意延後 |
| 本版非目標 | V6 拖曳 debug | V6 鎖定；見 [todolist_v6.md](./todolist_v6.md) |
| 可選後續 | `report_v8.md` | 正式關閉報告尚未寫 |
| 邊界案例 | 無 handle 抽象邊＋多埠機器 | 抽象測試邊可能跳過部分媒質／埠檢查（文件已註） |

---

## V8-A｜範圍與定案

- [x] **V8-A1** 範圍、定案表、與 V6／V7 邊界
  - 細項：[dev_v8/A1_scope_decision.md](./dev_v8/A1_scope_decision.md)

---

## V8-B｜Dev：機器／產品預覽（flow-engine 分頁）

- [x] **V8-B1** 機器目錄分頁：列表＋JSON＋依 modes／ports 可視化（placeholder）
  - 細項：[dev_v8/B1_machine_catalog_tab.md](./dev_v8/B1_machine_catalog_tab.md)
  - 元件：`src/app/dev/MachineCatalogPanel.vue`

- [x] **V8-B2** 產品／材料目錄分頁：列表＋JSON＋form placeholder
  - 細項：[dev_v8/B2_product_catalog_tab.md](./dev_v8/B2_product_catalog_tab.md)
  - 元件：`src/app/dev/ProductCatalogPanel.vue`

---

## V8-C｜FlowEngine 埠／媒質／速率

- [x] **V8-C1** 單埠單線驗證；複數埠依 `modes[].ports`
  - 細項：[dev_v8/C1_port_cardinality.md](./dev_v8/C1_port_cardinality.md)
  - 測試：`src/__tests__/flowEngine.v8.portCardinality.test.ts`

- [x] **V8-C2** `PIPE_RATE_LIMIT = 60`；依邊媒質／form 套用 30／60
  - 細項：[dev_v8/C2_rate_limits.md](./dev_v8/C2_rate_limits.md)
  - 測試：`src/__tests__/flowEngine.v8.rateLimits.test.ts`

- [x] **V8-C3** 品項 `form` ↔ belt／pipe 一致性（引擎側）
  - 細項：[dev_v8/C3_matter_state_media.md](./dev_v8/C3_matter_state_media.md)
  - 測試：`src/__tests__/flowEngine.v8.formMedia.test.ts`（M1–M3）

- [x] **V8-C4** 修正 H8 preset（匯流＋堵塞回推 15／15）
  - 細項：[dev_v8/C4_h8_merger_congestion.md](./dev_v8/C4_h8_merger_congestion.md)
  - 測試：`src/__tests__/flowEngine.v8.h8Merger.test.ts`

---

## V8-D｜拓樸視覺化

- [x] **V8-D1** 依 `machineMode.ports` 畫出入口數量／方位；切 mode 更新標籤
  - 細項：[dev_v8/D1_topology_ports.md](./dev_v8/D1_topology_ports.md)
  - 元件：`DevTopologySvg.vue`／`topologyPortUtils.ts`

---

## V8-E｜form（物態）資料

- [x] **V8-E1** 型別 `ItemForm`／欄位 `form`；codegen 匯入 materials＋products
  - 細項：[dev_v8/E1_matter_state_schema.md](./dev_v8/E1_matter_state_schema.md)
  - 欄位名定案為 **`form`**（非 matterState）

---

## V8-F｜測試

- [x] **V8-F1** 單元／preset：埠一對一、pipe 60、H8 匯流堵塞、form↔媒質
  - 細項：[dev_v8/F1_testing.md](./dev_v8/F1_testing.md)
  - 測試：`flowEngine.v8.*`、`itemForm.test.ts`、`topologyPortUtils`（全庫約 250 tests）

---

## V8-G｜品質與對外文件

- [x] **V8-G1** README／GUIDE／CONTEXT／AGENT 反映 V8
  - 細項：[dev_v8/G1_quality_docs.md](./dev_v8/G1_quality_docs.md)

---

## 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 解除條件 |
|----|---------|---------|----------|
| （無） | — | — | — |

---

## 完成定義（Definition of Done）

- [x] `/dev/flow-engine` 有機器／產品分頁；JSON＋placeholder 可視化可用
- [x] FlowEngine：單埠多線標非法（C1）
- [x] H8 為匯流合法情境且堵塞回推符合 15／15 預期（C4）
- [x] belt≤30、pipe≤60 依媒質套用
- [x] 拓樸依當前 mode ports 顯示；切 mode 標籤更新
- [x] `form`（ItemForm）已進型別與 `src/data`；solid→belt、liquid／gas→pipe
- [x] 測試與 type-check 通過；V6 仍鎖定；README／AGENT／GUIDE 反映 V8 狀態
