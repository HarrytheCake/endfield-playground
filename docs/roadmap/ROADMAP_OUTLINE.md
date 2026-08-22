# Roadmap 大綱｜2026-08-23 → 2026-11-29

**版本：** v1.0
**建立日期：** 2026-08-22
**規劃：** aaaaa
**守門與合入：** dernoson（主編）
**上游來源：** 主編提出並確認的 ROADMAP v0.2（決策層原始文件，未公開；其內容已完整拆進本檔與 `detail/`）
**狀態總覽：** 22 個工項全部 `[ ]` 未開始（規劃完成，待 8/23 公告後開工）

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## 0. 這份檔是什麼

上游 ROADMAP v0.2 回答「**到 11/29 要做出什麼**」，本檔回答「**那些事要拆成哪幾個工項、每項誰做、做完長什麼樣**」。

| 檔案 | 職責 |
|------|------|
| 上游 ROADMAP v0.2（未公開） | 主編 10 步、三塊畫面、月底門檻、刻意不做 |
| **本檔（大綱）** | 工項群組、狀態標記、週曆、封鎖追蹤；**不寫長篇技術細節** |
| [detail/](./detail/) | 各工項的背景、決策、檔案計畫、週切片、DoD、風險頂替 |

結構沿用 `docs/aaaaa/dev/` 既有慣例：`todolist_vN.md` ↔ `dev_vN/`，本檔即 roadmap 版的 todolist，`detail/` 即 roadmap 版的 dev 細項資料夾。

相關：[work_dispatch/](../work_dispatch/)（**正式每週派工**）、[AGENT_CONTEXT.md](../aaaaa/AGENT_CONTEXT.md)、`spec/00_top_spec.md`。

---

## 1. 概述

### 1.1 目標

到 2026-11-29，做出一條**已串通、打開就能操作、右側數字與警訊跟得上畫布**的主線。不是做完 Top Spec Phase 1。

### 1.2 已定案（主編已確認，本輪不再重議）

| 項 | 結論 |
|----|------|
| 驗收基準 | 主編 10 步；11/29 以 [D5 驗收劇本](./detail/D5_acceptance_rehearsal.md) 的 8 步演示為準 |
| 月底門檻 | 8/30 對齊、9/27 擺放、10/25 連線、11/29 串通；每月最後一個週日驗收 |
| 分層硬規則 | L3 不 import store；L2 只呼叫 L1 高階 action；L1 不寫正式 UI |
| 唯一寫入點 | 藍圖狀態只經 `editorStore` 高階 action；禁止 `nodes.push`、禁止自組 Command |
| 引擎不重算 | FlowEngine 只在 L1 跑；L2／L3 只讀 `flowStore` |
| 工單格式 | 四欄固定：畫面｜交哪個檔｜不要碰｜卡住找誰 |
| 一週一塊 | 同一人同一週只做一種性質（純函式／畫面／接線） |
| 關鍵路徑限制 | 月底門檻的必要條件只派 `risk ≤ 中`（aaaaa、shirone、paper、dernoson） |
| 資料流 | `data_1` → `pnpm sync:aaaaa-data` → `docs/aaaaa/data` → `pnpm generate:src-data` → `src/data` |
| 速率 | belt 30／min、pipe 60／min（沿用 V8／V9） |
| 藍圖格式 | 最小 JSON `{ version, planId?, nodes, edges }`；**不做** HTML 自包含記錄檔 |

### 1.3 非目標（11/29 前不做）

- CR-05 流程視角／並列視角
- 框選多物、複製貼上、自動物流橋／分流／匯流生成
- 自動路徑規劃、LP 優化（CR-07）
- HTML 自包含記錄檔、跨版本 migrate
- 調度券總效率當主演示（引擎欄位保留，UI 不當門檻）
- 重寫 FlowEngine 或 store 骨架

### 1.4 流程大綱

```text
R-A 對齊（8/23→8/30）
      │  能打開、能放一台、佔格與資料一致
      ▼
R-B 擺放（9/6→9/27）           步驟 2 ＋ 5
      │  真機器選單、擺放鏈、旋轉、選取資訊、單刪
      ▼
R-C 連線（10/4→10/25）          步驟 3 ＋ 4 ＋ 6
      │  port 對 port、90 度彎折、拖移進歷史、源素材
      ▼
R-D 串通（11/1→11/29）          步驟 7 ＋ 8 ＋ 9 ＋ 10
      │  右側產耗、重疊警訊、配方警訊、JSON 存讀
      ▼
   11/29 驗收劇本 8 步

R-E 跨月支撐（8/23→11/29，貫穿全期，不綁單月門檻）
```

### 1.5 里程碑一覽

| 里程碑 | 日期 | 使用者能做到 | 必要工項 | 加分工項 |
|--------|------|--------------|----------|----------|
| M1 對齊 | 2026-08-30（日） | 新 clone 能開；放一台且佔格不是錯尺寸 | A1、A2 | A3、A4 |
| M2 擺放 | 2026-09-27（日） | 拉多種真機器；點選看資訊；單刪；可轉 90° | B1、B2、B4 | B3、B5 |
| M3 連線 | 2026-10-25（日） | 兩 port 拉管線可彎折；拖移；源設素材 | C1、C2、C3、C5 | C4 |
| M4 串通 | 2026-11-29（日） | 右側產耗＋兩類警訊；JSON 存讀還原 | D1、D2、D4、D5 | D3 |

「必要」＝該月門檻缺此項即不通過，只能派給 `risk ≤ 中`。
「加分」＝未交不影響門檻，須在工單寫明由誰的既有產出頂替。

---

## 2. 工項總表

| ID | 工項 | 里程碑 | 建議主責 | 性質 | 擋門檻 | 細項 |
|----|------|--------|----------|------|--------|------|
| R-A1 | 公告基準與工單格式凍結 | M1 | dernoson | 決策 | 是 | [A1](./detail/A1_announce_and_baseline.md) |
| R-A2 | 佔格與 port 對資料 | M1 | aaaaa | 資料／純函式 | **是** | [A2](./detail/A2_grid_and_port_alignment.md) |
| R-A3 | 新人上手半頁 | M1 | dernoson | 文件 | 否 | [A3](./detail/A3_onboarding_onepager.md) |
| R-A4 | 週節奏與門檻驗收機制 | M1 | aaaaa＋dernoson | 流程 | 否 | [A4](./detail/A4_weekly_cadence_gate.md) |
| R-B1 | 工具列接真實機器資料 | M2 | aaaaa（資料）＋L3 | 資料→畫面 | **是** | [B1](./detail/B1_toolbar_real_machines.md) |
| R-B2 | 擺放鏈 L2 串接 | M2 | toby／harry | 接線 | **是** | [B2](./detail/B2_placement_chain.md) |
| R-B3 | 旋轉 90 度 | M2 | toby／harry | 接線 | 否 | [B3](./detail/B3_rotation_90.md) |
| R-B4 | 選取與設備資訊面板 | M2 | L2 攤平＋L3 呈現 | 接線＋畫面 | **是** | [B4](./detail/B4_selection_inspector.md) |
| R-B5 | 刪除單台 | M2 | toby／harry | 接線 | 否 | [B5](./detail/B5_delete_single_device.md) |
| R-C1 | Port 命中與 draft 連線 | M3 | L2 主責 | 接線 | **是** | [C1](./detail/C1_port_hit_and_draft.md) |
| R-C2 | addConnection 契約與型別檢查 | M3 | aaaaa（規則）＋L2 | 純函式＋接線 | **是** | [C2](./detail/C2_add_connection_contract.md) |
| R-C3 | 管線折線與 90 度彎折渲染 | M3 | L3 | 畫面 | **是** | [C3](./detail/C3_pipeline_polyline_render.md) |
| R-C4 | 拖移進歷史 | M3 | L2 | 接線 | 否 | [C4](./detail/C4_move_into_history.md) |
| R-C5 | 源節點素材設定 | M3 | aaaaa（action）＋L2 | 接線 | **是** | [C5](./detail/C5_source_primary_output.md) |
| R-D1 | 右側產耗表接 flowStore | M4 | aaaaa | 接線＋畫面 | **是** | [D1](./detail/D1_stats_item_summary.md) |
| R-D2 | E001 重疊警訊上右側 | M4 | shirone（純函式）＋L2 | 純函式＋接線 | **是** | [D2](./detail/D2_e001_overlap_alert.md) |
| R-D3 | 配方類警訊 E004／E005／W001 | M4 | shirone／azure 收斂 | 純函式 | 否 | [D3](./detail/D3_recipe_alerts.md) |
| R-D4 | 最小藍圖 JSON 匯出／匯入 | M4 | aaaaa | 純函式＋接線 | **是** | [D4](./detail/D4_blueprint_json_io.md) |
| R-D5 | 11/29 驗收劇本與彩排 | M4 | aaaaa＋dernoson | 驗收 | **是** | [D5](./detail/D5_acceptance_rehearsal.md) |
| R-E1 | 資料與 codegen 維運 | 跨月 | aaaaa | 資料 | 否 | [E1](./detail/E1_data_codegen_ops.md) |
| R-E2 | 三層守門與 PR 規範 | 跨月 | dernoson | 流程 | 否 | [E2](./detail/E2_layer_guard_pr_rules.md) |
| R-E3 | 備援與人力調度 | 跨月 | aaaaa | 流程 | 否 | 細項於決策層維護，不公開 |

「建議主責」為規劃值，**實際派工以 [work_dispatch/](../work_dispatch/) 當週 `WEEK_*.md` 與各人細項為準**。

---

## 3. R-A｜對齊月（→ 2026-08-30）

**門檻句：** 新 clone 能開網頁；從下方拿一種設備放到格子上，佔格與資料大致一致；至少一處走真實 machine 尺寸；列出 port 錯的機器清單。

- [ ] **R-A1** 公告基準與工單格式凍結：確認本大綱可公告、凍結「主線只走 editorStore action」、固定四欄工單格式與週日會議程
  - 細項：[detail/A1_announce_and_baseline.md](./detail/A1_announce_and_baseline.md)
- [ ] **R-A2** 佔格與 port 對資料：產出 port／佔格錯機清單（機器 id ＋ 錯在資料或渲染），修正「錯在資料」者，至少一台常用加工機佔格正確
  - 細項：[detail/A2_grid_and_port_alignment.md](./detail/A2_grid_and_port_alignment.md)
- [ ] **R-A3** 新人上手半頁：三塊畫面、props／emit、L3 禁 store、禁止根目錄上傳、禁止檔名當版本
  - 細項：[detail/A3_onboarding_onepager.md](./detail/A3_onboarding_onepager.md)
- [ ] **R-A4** 週節奏與門檻驗收機制：週日會固定議程、30 秒驗收定義、連續兩週未演示的處理、延期改版規則
  - 細項：[detail/A4_weekly_cadence_gate.md](./detail/A4_weekly_cadence_gate.md)

---

## 4. R-B｜擺放月（→ 2026-09-27）

**門檻句：** 從下方選單拉多種真機器放到畫布；點選後看到該機資訊；能刪單台；能轉 90 度（若 8 月未做完，9 月必須完成）。對應主編步驟 2 ＋ 5。

- [ ] **R-B1** 工具列接真實機器資料：`ToolbarPanel` 清單改吃 `getAllMachines`／`getMachinesByTag`，分類 Tab 可先少類，卡片顯示真名與佔格
  - 細項：[detail/B1_toolbar_real_machines.md](./detail/B1_toolbar_real_machines.md)
- [ ] **R-B2** 擺放鏈 L2 串接：工具列 `armPlacement` → drop／click → **只呼叫** `placeDevice`；預覽佔格讀真實 machine size
  - 細項：[detail/B2_placement_chain.md](./detail/B2_placement_chain.md)
- [ ] **R-B3** 旋轉 90 度：拿起中或已放置皆可 `rotateDevice`；port side／offset 走 `portUtils`
  - 細項：[detail/B3_rotation_90.md](./detail/B3_rotation_90.md)
- [ ] **R-B4** 選取與設備資訊面板：選取 → L2 把 `Machine` ＋ node 攤成 plain props → L3 顯示名稱、佔格、配方、耗電
  - 細項：[detail/B4_selection_inspector.md](./detail/B4_selection_inspector.md)
- [ ] **R-B5** 刪除單台：Delete 鍵與右鍵入口接 `removeDevices`，走既有 `useShortcuts`，進歷史
  - 細項：[detail/B5_delete_single_device.md](./detail/B5_delete_single_device.md)

---

## 5. R-C｜連線月（→ 2026-10-25）

**門檻句：** 兩台設備 port 對 port 拉管線，皮帶與水管能分、能轉 90 度彎；單台／單線可刪、可拖移；源設備能設產出素材。對應主編步驟 3 ＋ 4 ＋ 6。

- [ ] **R-C1** Port 命中與 draft 連線：port 點可見、可點選、拖出暫時折線，放開命中另一 port 才成立
  - 細項：[detail/C1_port_hit_and_draft.md](./detail/C1_port_hit_and_draft.md)
- [ ] **R-C2** addConnection 契約與型別檢查：`FactoryEdge` 必帶 handle；belt↔pipe 錯接與單埠單線由純函式判定，L2 只呼叫
  - 細項：[detail/C2_add_connection_contract.md](./detail/C2_add_connection_contract.md)
- [ ] **R-C3** 管線折線與 90 度彎折渲染：`PipelineEdge` 畫正交折線，違規線段給紅色視覺
  - 細項：[detail/C3_pipeline_polyline_render.md](./detail/C3_pipeline_polyline_render.md)
- [ ] **R-C4** 拖移進歷史：拖曳結束呼叫 `commitDeviceMove(uids, before)`，Undo 可還原位置
  - 細項：[detail/C4_move_into_history.md](./detail/C4_move_into_history.md)
- [ ] **R-C5** 源節點素材設定：源設備可指定 `primaryOutput` 與速率，寫入 `FactoryNode.data`
  - 細項：[detail/C5_source_primary_output.md](./detail/C5_source_primary_output.md)

---

## 6. R-D｜串通月（→ 2026-11-29）

**門檻句：** 一條「源 → 加工 → 匯出點」連起來後，右側看到產耗（含中間物）；重疊與缺 IO／配方不符在右側有字；頂欄 JSON 存檔再開得回來。對應主編步驟 7 ＋ 8 ＋ 9 ＋ 10。

- [ ] **R-D1** 右側產耗表接 flowStore：`ItemSummaryTable` 讀 `itemSummary`，空產線顯示空狀態，有連線會變
  - 細項：[detail/D1_stats_item_summary.md](./detail/D1_stats_item_summary.md)
- [ ] **R-D2** E001 重疊警訊上右側：`E001_deviceOverlap` 真邏輯＋測試，集中 `registerDetector`，右側顯示一條可懂訊息
  - 細項：[detail/D2_e001_overlap_alert.md](./detail/D2_e001_overlap_alert.md)
- [ ] **R-D3** 配方類警訊：缺輸入／缺輸出（E004／E005）與材料組合不符（W001）至少一類上右側，與 azure 草稿收斂成一套
  - 細項：[detail/D3_recipe_alerts.md](./detail/D3_recipe_alerts.md)
- [ ] **R-D4** 最小藍圖 JSON 匯出／匯入：`{ version, planId?, nodes, edges }` ＋ Zod 驗證；頂欄 Save／Load
  - 細項：[detail/D4_blueprint_json_io.md](./detail/D4_blueprint_json_io.md)
- [ ] **R-D5** 驗收劇本與彩排：8 步劇本文件化，11/22 先彩排一次，11/29 正式演示
  - 細項：[detail/D5_acceptance_rehearsal.md](./detail/D5_acceptance_rehearsal.md)

---

## 7. R-E｜跨月支撐（8/23 → 11/29）

不綁單月門檻，但每月都要有動作。

- [ ] **R-E1** 資料與 codegen 維運：`data_1` → `data` → `src/data` 同步流程保持可跑，資料改動附測試
  - 細項：[detail/E1_data_codegen_ops.md](./detail/E1_data_codegen_ops.md)
- [ ] **R-E2** 三層守門與 PR 規範：待審 PR ≤ 3、禁止根目錄上傳與檔名當版本、Breaking 先改 L1
  - 細項：[detail/E2_layer_guard_pr_rules.md](./detail/E2_layer_guard_pr_rules.md)
- [ ] **R-E3** 備援與人力調度：可投入時間不穩定者不承擔門檻必要條件、每週配對名額 ≤ 2、已知空窗不派工
  - 細項涉及個別成員的可投入時間與備援安排，**於決策層維護、不公開**；對協作者生效的部分已寫進 [A4](./detail/A4_weekly_cadence_gate.md) 與每週工單

---

## 8. 週曆對照（標的日＝週日）

當週做不完就在當日會上改下一週，不把欠帳堆到月底。

| 週日 | 對應工項 | 30 秒看得出的產出 |
|------|----------|-------------------|
| 08/23 | A1、A3、A4 | 公告大綱；發本週工單；確認誰跑得起 `pnpm dev` |
| 08/30 | **A2（門檻）** | 放一台且佔格不是錯尺寸；port 錯機清單存在 |
| 09/06 | B1 | 下方選單至少一個分類顯示真實機器名 |
| 09/13 | B2、B4 | 拖放走真實 size；點選設備 → 資訊區出現名稱＋佔格 |
| 09/20 | B3 或 B5 | 旋轉 90 度或刪單台，擇一穩定演示 |
| 09/27 | **B1＋B2＋B4（門檻）** | 步驟 2 ＋ 5 ＋ 單刪；B3／B5 未完成者本日補齊 |
| 10/04 | C1、C2 | 兩個 port 能連一條直線，型別對才允許 |
| 10/11 | C3 | 彎折點 90 度；違規線段有紅色視覺 |
| 10/18 | C4、C5 | 拖移進歷史（或明寫「本週只移不 Undo」並排進 10/25）；源素材可設 |
| 10/25 | **C1＋C2＋C3＋C5（門檻）** | 步驟 3 ＋ 4 單物 ＋ 6 |
| 11/01 | D1 | 右側產耗表接 `itemSummary`，空產線有空狀態 |
| 11/08 | D2 | 兩台重疊 → 右側一條訊息 |
| 11/15 | D3 | 缺輸入或輸出、材料組合不符，至少一類上右側 |
| 11/22 | D4、D5 | JSON 匯出下載；匯入還原；**驗收劇本彩排一次** |
| 11/29 | **D1＋D2＋D4＋D5（門檻）** | 步驟 7～10 串在同一條演示產線上 |

---

## 9. 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 解除條件 | 狀態 |
|----|----------|----------|----------|------|
| R-B2 | L2 產能不足（toby ≤2h／假日；harry 動力驅動不可預測） | 每週 work_dispatch 雙軌切分 | toby／harry 各承接「一週一塊」、同週不改同一檔；門檻不綁單一人 | `[~]` 可開工（人力仍緊） |
| R-B3 | 同上；旋轉牽涉 port side／offset 換算 | R-A2 錯機清單 | A2 完成且 `portUtils` 換算有測試 | `[!]` |
| R-C1 | 依賴 R-B2 擺放鏈可用 | R-B2 | B2 於 9/27 門檻通過 | `[!]` |
| R-D3 | shirone 與 azure9572 同域不同 ID，需先收斂 | 主編對 azure 是否續留的裁示 | 主編裁示＋detector ID 表定案 | `[!]` |
| R-D2 | detector 註冊入口需集中，避免兩套 | R-E2 守門規則 | `registerDetector` 單一入口確立 | `[!]` |

新增封鎖一律回寫本表，寫明原因與等待對象；口頭封鎖不算數。

---

## 10. 完成定義（Definition of Done）

### 10.1 單一工項

- [ ] 該工項細項檔的「§DoD」全部勾選
- [ ] 本檔對應項目狀態標記已更新（`[x]` 或 `[!]` 並填封鎖表）
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過（純文件工項免）
- [ ] 交付路徑符合工單「交哪個檔」，未新開平行目錄或以檔名當版本
- [ ] 跨層需求已寫進文件，而非只留在對話

### 10.2 月底門檻

- [ ] 該月「必要工項」全部 `[x]`
- [ ] 週日會上完成 30 秒演示（錄影或現場皆可）
- [ ] 未達成項目已在本檔改期並記錄延因，而非默默順延
- [ ] 加分工項未交者，已確認由既有產出頂替，門檻不受影響

### 10.3 11/29 總驗收

以 [D5 驗收劇本](./detail/D5_acceptance_rehearsal.md) 的 8 步為準，全部通過即「初步串通、可運行」。

---

## 11. 動態調整規則

- 週日會只問「演示過了沒」，過了才開下一週範圍
- 連續兩週同項沒演示：切半或換人，不累積罪惡感清單
- 底層 API 改簽名：標 Breaking，先改 L1 再改 L2，同一週不逼 L3 跟版
- 主設計稿與功能順序衝突：外觀聽主設計，順序聽本檔
- §1.2 已定案與 §2 工項總表變更，須主編＋aaaaa 同意後改版本號

---

## 12. 版本紀錄

| 版 | 日期 | 說明 |
|----|------|------|
| v1.0 | 2026-08-22 | 依主編已確認的 ROADMAP v0.2 展開為 22 個工項；建立大綱 ↔ 細項結構與 Agent 文檔 |
