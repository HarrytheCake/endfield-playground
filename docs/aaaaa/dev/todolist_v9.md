# V9 TODOLIST — 強化視覺化預覽工具

**版本：** V9  
**建立日期：** 2026-08-02  
**負責人：** aaaaa  
**前置：** V8 實作完成；V6 已完成／解鎖  
**狀態總覽：** ✅ **A–G 實作完成**／✅ **H1-1～H1-5 驗收補強完成**（2026-08-02）
> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## 概述

### 目標

1. **資料釐清**：`products.json`＝產品、`materials.json`＝基礎材料；停止 codegen 把 materials 做成假產品
2. **新建「基礎材料輸出點」**：專出 materials，依 `form` 選 belt／pipe；物品輸出口保留僅固體
3. **machines modes-only**：移除外層 `input_ports`／`output_ports`；單形態＝`modes: [{ id: default, ... }]`；預設＝`modes[0]`
4. **預覽強化**：機器目錄依 tag 分頁；拓樸／機器預覽依 width×height 格點＋ side／offset 畫埠
5. **反向鏈路**：從產品回推至基礎材料；最短配方步數、無循環；效率＝`quantity * 60 / timeSeconds`（個／分）
6. **引擎**：節點可不預選配方；依實際輸入匹配；不齊則無產出
7. **演示**：先盤點既有 H／V7／V8 案例，再分項做 V9 preset

### 已定案（2026-08-02）

| 項 | 結論 |
|----|------|
| 產品／材料 | `products.json`＝已整理產品；`materials.json`＝基礎材料；結構不同 |
| 產品判定 | 在 `products.json` 內即為產品（含拆解／灌裝雙向配方品） |
| 基礎材料源 | 新建機器「基礎材料輸出點」；依 `form` 選 belt／pipe |
| Codegen | 停止 `buildSourceProducts`；測試改接基礎材料輸出點 |
| 物品輸出口 | 保留，僅固體；總產值只計回「物品輸入口」 |
| 引擎配方 | 依實際輸入匹配；不齊無產出；引擎核心行為變更 |
| 最短鏈路 | 回推至基礎材料，選**配方步數最少**且無循環（息壤例選短鏈） |
| 埠資料 | 全面 `modes`；外層 ports 自 `aaaaa/data/machines` 移除 |
| 速率 | belt 30／min、pipe 60／min（沿用 V8） |
| 多配方衝突 | 優先輸入種類集合完全吻合；仍多條則依 products.json 順序取第一 |

詳見 [A1_scope_decision.md](./dev_v9/A1_scope_decision.md)。

### 非目標（本版不做）

- V6 已關閉；不回頭做拖曳 debug／管線跟隨（CR-02）
- 正式產品／機器圖像資源
- loss 納入 summary
- CR-02 連線時 UI 拒絕（仍以引擎側為主，除非演示需要）

### 流程大綱

```text
A 定案 ✓ → B–F2 ✓ → G1 ✓（V9 A–G）
         → H1 驗收回饋整理 ✓ → H1-* 修復（待做）
```

### 驗收回饋摘要（2026-08-02）

詳見 [dev_v9/H1_acceptance_followups.md](./dev_v9/H1_acceptance_followups.md)。

| ID | 問題 | 建議 |
|----|------|------|
| H1-1 | H7 期望堵塞與視覺不符 | ✅ 方案 B：一般機同品多入邊亦按比例分攤；H7 入邊約 15／15 橘邊 |
| H1-2 | D1→赫銅零件非法 | ✅ `matchRecipeByEdgeCandidates`＋演示 `primaryOutput` |
| H1-3 | 「研製合成粉末方塊」出現在產品目錄 | ✅ 已自 codegen 移除；H2/H3 改用緻密藍鐵粉末 |
| H1-4 | `/dev/graph-viz` 與 FlowEngine／V9 脫節 | ✅ 退役：路由轉址 flow-engine；刪除 `GraphViz.vue` |
| H1-5 | HistoryReplay V6 checklist 難懂；按鈕無反應 | ✅ 文案分層＋對照表＋disabled／busy 提示 |

---

## V9-A｜範圍與定案

- [x] **V9-A1** 範圍、定案表、與 V6／V7／V8 邊界
  - 細項：[dev_v9/A1_scope_decision.md](./dev_v9/A1_scope_decision.md)

---

## V9-B｜資料與 codegen

- [x] **V9-B1** machines：modes-only；移除外層 ports；codegen／型別／MachineShape
  - 細項：[dev_v9/B1_modes_only_ports.md](./dev_v9/B1_modes_only_ports.md)

- [x] **V9-B2** 新建「基礎材料輸出點」；停止假產品注入；產品／材料目錄分離
  - 細項：[dev_v9/B2_materials_products_source.md](./dev_v9/B2_materials_products_source.md)

---

## V9-C｜預覽 UI

- [x] **V9-C1** 機器預覽：tag 分頁（基礎生產／合成製造／…）
  - 細項：[dev_v9/C1_machine_tag_tabs.md](./dev_v9/C1_machine_tag_tabs.md)

- [x] **V9-C2** 拓樸／機器預覽：WxH 格點＋ side／offset 畫埠
  - 細項：[dev_v9/C2_grid_topology.md](./dev_v9/C2_grid_topology.md)

---

## V9-D｜反向鏈路

- [x] **V9-D1** 反向鏈路演算法：DAG、去循環、最短步數、效率個／分
  - 細項：[dev_v9/D1_reverse_chain.md](./dev_v9/D1_reverse_chain.md)

---

## V9-E｜FlowEngine 配方匹配

- [x] **V9-E1** 依輸入匹配配方；不齊無產出；recipeIndex 語意變更
  - 細項：[dev_v9/E1_input_recipe_match.md](./dev_v9/E1_input_recipe_match.md)

---

## V9-F｜案例與演示

- [x] **V9-F1** 先盤點現有 H／V7／V8 案例（對／錯／過時表）
  - 細項：[dev_v9/F1_case_inventory.md](./dev_v9/F1_case_inventory.md)

- [x] **V9-F2** 分項演示 preset（滿速／未滿／分流／匯流／非法／複雜…）
  - 細項：[dev_v9/F2_demo_presets.md](./dev_v9/F2_demo_presets.md)

---

## V9-G｜品質與對外文件

- [x] **V9-G1** 測試＋README／GUIDE／CONTEXT
  - 細項：[dev_v9/G1_quality_docs.md](./dev_v9/G1_quality_docs.md)

---

## V9-H｜驗收回饋（整理完成；修復待做）

- [x] **V9-H1** 分析整理 FlowEngine／GraphViz／HistoryReplay 回饋並回寫文件
  - 細項：[dev_v9/H1_acceptance_followups.md](./dev_v9/H1_acceptance_followups.md)

- [x] **V9-H1-1** H7 堵塞期望對齊（方案 B：引擎同品多入邊分攤＋H7 expected）
- [x] **V9-H1-2** D1 演示圖合法化（副產物／入邊品項；赫銅零件可再現）
- [x] **V9-H1-3** 隔離或移除測試 stub「研製合成粉末方塊」於產品目錄
- [x] **V9-H1-4** GraphViz：退役或轉址（決策見 H1 §5）
- [x] **V9-H1-5** HistoryReplay V6：直觀說明＋disabled／無訊息排查修復

---

## 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 解除條件 |
|----|---------|---------|----------|
| — | （無） | — | F2 已由 F1 解鎖；H1-* 互不封鎖 |

---

## 完成定義（Definition of Done）

### A–G（已達成）

- [x] machines JSON／codegen 僅 `modes[]` 定義埠；預設＝`modes[0]`
- [x] 產品目錄＝`products.json`；材料目錄＝`materials.json`；無 materials 假配方注入
- [x] 「基礎材料輸出點」可用；依 form 出 belt／pipe
- [x] 機器預覽有 tag 分頁
- [x] 拓樸依 WxH 格點畫埠
- [x] 反向最短鏈路＋效率可算；息壤類案例選短鏈
- [x] 引擎：輸入不齊無產出；齊全後自動匹配配方
- [x] F1 盤點完成
- [x] F2 演示覆蓋約定情境
- [x] 測試通過；README／GUIDE／CONTEXT 反映 V9

### H（驗收後補強；未完成）

- [x] H7 期望與視覺／引擎語意一致
- [x] D1「產生演示圖」對含副產物長鏈不誤報整圖非法（或明確警告）
- [x] 產品目錄無 codegen-only stub
- [x] GraphViz 處置落地（退役或轉址）
- [x] HistoryReplay V6 區可直觀操作、按鈕狀態可理解
