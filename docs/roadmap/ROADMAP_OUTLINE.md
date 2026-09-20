# Roadmap 大綱｜2026-08-23 → 2026-11-29

**版本：** v1.10（2026-09-19；W0914-A1：R-C2／R-D4 依新模型重訂完成，兩項封鎖解除）
**建立日期：** 2026-08-22
**規劃：** aaaaa
**守門與合入：** dernoson（主編）
**上游來源：** 主編提出並確認的 ROADMAP v0.2（決策層原始文件，未公開；其內容已完整拆進本檔與 `detail/`）
**狀態總覽：** **M1 成立。** L1／只讀殼／B1 切片維持。**W0914：** `layoutStore` **#45 已合入 master**（9/14）、viewport **#47 已合入**；主畫面接入 #50 待審、工具列 #48 待審；**擺放／選取仍鎖至佈局底層接完**；**M2 硬綁恢復為只押 B1**。右側本週＝**產線總覽 StatsPanel**（非 B4）。**R-C2／R-D4 兩項自 8/25 起的封鎖已於 9/19 解除**（見 §9）。詳見 [WEEK_20260914](../work_dispatch/WEEK_20260914.md) v1.1。

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## 0. 這份檔是什麼

上游 ROADMAP v0.2 回答「**到 11/29 要做出什麼**」，本檔回答「**那些事要拆成哪幾個工項、每項誰做、做完長什麼樣**」。

| 檔案 | 職責 |
|------|------|
| 上游 ROADMAP v0.2（未公開） | 主編 10 步、三塊畫面、月底門檻、刻意不做 |
| **本檔（大綱）** | 工項群組、**流程決策**、狀態標記、週曆、封鎖追蹤；技術細節指向 detail／影響分析 |
| [detail/](./detail/) | 各工項的背景、決策、檔案計畫、週切片、DoD、風險頂替 |
| [LAYOUT_REWRITE_DISPATCH_IMPACT_0825](../aaaaa/LAYOUT_REWRITE_DISPATCH_IMPACT_0825.md) | 8/25 佈局自建對派工／里程碑的影響（首次裁決） |
| [LAYOUT_REWRITE_EARLY_START_0831](../aaaaa/LAYOUT_REWRITE_EARLY_START_0831.md) | **8/30–31 提前開工**：時程、影響範圍、協作者、L1 主責 |

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
| **佈局渲染層** | **確認提前開發**佈局視角 **SVG 自建**。L1／只讀殼已合。**主畫面接入：** 改掛 `GridCanvas`；舊殼保留不刪。**照稿切換器下週另派**（非 Avery）。擺放／選取等底層接完。見 **§1.6**、[WEEK_20260914](../work_dispatch/WEEK_20260914.md) |
| **佈局 L1 主責** | **aaaaa**；時數與 B1 衝突時 **L1＞B1**。dernoson 只裁示／合入／守閘，不兼功能（規則 17） |
| 關鍵路徑限制 | 月底門檻必要條件只派 `risk ≤ 中`。**9 月程式必要實質以 aaaaa／B1 為主**。~~9/14 曾擴大 M2 含 B2／B4~~ → **9/15 撤回**：恢復「渲染層／底層未接完前不把必要項押在 L2 強綁」；M2 **硬綁 B1** |
| 資料流 | `data_1` → `pnpm sync:aaaaa-data` → `docs/aaaaa/data` → `pnpm generate:src-data` → `src/data` |
| 速率 | belt 30／min、pipe 60／min（沿用 V8／V9） |
| 藍圖格式 | **`{ version: 2, planId?, devices, pipelines }`**（2026-09-19 重訂定案）。`connections` 為衍生值不儲存；**舊 v1 檔不讀**，匯入直接拒絕。見 [detail/D4](./detail/D4_blueprint_json_io.md) §4 |

### 1.3 非目標（11/29 前不做）

- CR-05 流程視角／並列視角的完整產品化（流程視角可續掛 Vue Flow，但不當 11/29 門檻）
- 框選多物、複製貼上、自動物流橋／分流／匯流生成
- 自動路徑規劃、LP 優化（CR-07）
- HTML 自包含記錄檔、跨版本 migrate
- 調度券總效率當主演示（引擎欄位保留，UI 不當門檻）
- 重寫 FlowEngine 或在佈局自建完成前回頭加深舊 `FactoryCanvas`／Vue Flow node 選取

### 1.4 流程大綱（含佈局自建軌道）

```text
R-A 對齊（8/23→8/30）✅ M1
      │
      ▼
R-B 擺放（9/6→9/27）──── 使用者可見：真機器選單、擺放、選取、刪／轉
      │                      │
      │                      ├── 並行軌道【佈局自建 L1✅→只讀殼✅合入→store 契約待合】（§1.6）
      │                      │     落子／選取仍等 store **合入**＋整合
      │                      │     主責：aaaaa（L1 已交；store PR #45）；殼＝toby #46
      │                      ▼
      │                 09/14：殼接主畫面（只讀；#45 後）＋viewport
      │                 擺放／選取：底層接完再開（不硬綁 9/27）
      ▼
R-C 連線（10/4→10/25）── 全部掛新畫布；C2 契約須先重訂
      ▼
R-D 串通（11/1→11/29）── D4 格式跟新模型；D1–D3 相對獨立
      ▼
   11/29 驗收劇本 8 步

R-E 跨月支撐（貫穿；含人力／門檻縮小裁示）
```

**讀法：** 上面是使用者功能軸；右邊是技術前置軸。兩邊都要動，但**門檻必要項在殼落地前只能押在左邊不依賴畫布的塊**（本月＝B1）與右邊的 **L1 純函式／契約**。store 已交未合時，**不以「分支有 store」假裝 B2 已解**。

### 1.5 里程碑一覽

| 里程碑 | 日期 | 使用者能做到 | 必要工項（預設） | 佈局自建下的調整 |
|--------|------|--------------|------------------|------------------|
| M1 對齊 | 2026-08-30 | 新 clone 能開；放一台佔格證據 | A1、A2 | **已過**；不改 |
| M2 擺放 | 2026-09-27 | 拉多種真機器；點選看資訊；單刪；可轉 90° | B1、B2、B4 | **硬綁 B1**。B2／B4：殼與底層接完才列必要，否則依 §11 降級（D0 書面）。**9/14 擴大為誤會，9/15 撤回** |
| M3 連線 | 2026-10-25 | 兩 port 拉管線可彎折；拖移；源設素材 | C1、C2、C3、C5 | **整段依賴新畫布**；C2 須 9 月重訂 |
| M4 串通 | 2026-11-29 | 右側產耗＋警訊；JSON 存讀 | D1、D2、D4、D5 | D4 跟新儲存形狀；D1–D3 可並行 |

「必要」＝該月門檻缺此項即不通過，只能派給 `risk ≤ 中`。  
「加分」＝未交不影響門檻，須在工單寫明頂替。

### 1.6 佈局視角自建——流程決策說明（加強）

| 問 | 答 |
|----|-----|
| **改什麼？** | 只改**佈局視角**的渲染與互動：廢 `FactoryCanvas`／`FlowNodeOverlay` 等 Vue Flow 節點盒，改自建 SVG（`GridCanvas` 已合入）。**「廢」的執行方式（9/14 定案）：先換入口、不刪檔**——`MainLayout.vue` 的畫布區改掛容器 `LayoutView.vue` → `GridCanvas`；舊殼保留為切換退路，待新殼站穩再排廢除工項 |
| **不改什麼？** | **不是**捨棄 Vue.js；流程視角可續用 Vue Flow；右側 Stats／detector 純函式不因換殼重寫 |
| **為何改？** | Vue Flow 節點盒限制 paper 稿 1:1 落地；佔格／port／管線與資料模型長期分叉；8/30 主編：不提前則設計 UI「沒地方擺」 |
| **為何提前？** | **已定案提前開工**（8/30–31）。評估與閘門：[EARLY_START](../aaaaa/LAYOUT_REWRITE_EARLY_START_0831.md) |
| **優先序** | **① store 合入 → ② 主畫面接入（只讀）→ ③ L3／加分**。擺放／選取等底層接完再開 |
| **卡住誰？** | **等底層就緒：** B2 落子、B4 選取、B3／B5、C\*。**本週：** #45、T1（#45 後）、#47、StatsPanel→`src/app`。**不卡：** B1 切片、D1 殼（StatsPanel 遷移） |
| **關鍵路徑** | #45 合入 → toby 容器接入。只讀殼已在 master，接上主畫面後仍不代表 B2 已解 |
| **誰做 L1？** | aaaaa；store＝[W0914-A0](../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md) |
| **L2 解鎖** | 只讀殼已合（#46）。**9/14 放行：** 只讀殼接主畫面（T1／H1），互動仍只讀；**#45 合入後 T1 開工**。擺放／選取仍退回 |
| **L2 檔案切分** | toby＝LayoutView／GridCanvas／MainLayout；harry＝viewport。import 可、改對方檔退回 |
| **視角切換器** | 照稿；本週不做；下週另派人（非 Avery） |
| **誰不做？** | dernoson 不兼功能；本週無人動 inspector（B4）；StatsPanel 歸 shirone |

首次派工影響分析（8/25）：[LAYOUT_REWRITE_DISPATCH_IMPACT_0825](../aaaaa/LAYOUT_REWRITE_DISPATCH_IMPACT_0825.md)。

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
| R-C2 | 連線契約與型別檢查（**2026-09-19 已重訂**） | M3 | aaaaa（規則）＋L2（owner 待定） | 純函式＋接線 | **是** | [C2](./detail/C2_add_connection_contract.md) |
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

**M1 驗收（2026-08-30）：成立。** 必要項 R-A1／R-A2 皆 `[x]`；加分 A3／A4 為 `[~]`（機制已跑、半頁置頂已生效，repo 半頁與完成率紀錄見各 detail）。

- [x] **R-A1** 公告基準與工單格式凍結：確認本大綱可公告、凍結「主線只走 editorStore action」、固定四欄工單格式與週日會議程
  - 細項：[detail/A1_announce_and_baseline.md](./detail/A1_announce_and_baseline.md)（W0823-D0，8/23 宣讀＋Discord 摘要）
- [x] **R-A2** 佔格與 port 對資料：產出 port／佔格錯機清單（機器 id ＋ 錯在資料或渲染），修正「錯在資料」者，至少一台常用加工機佔格正確
  - 細項：[detail/A2_grid_and_port_alignment.md](./detail/A2_grid_and_port_alignment.md)（W0823-A1，PR #32 合入；錯機清單＋`rotatePort` pad-to-square＋`/dev/placement-demo`）
- [~] **R-A3** 新人上手半頁：三塊畫面、props／emit、L3 禁 store、禁止根目錄上傳、禁止檔名當版本
  - 細項：[detail/A3_onboarding_onepager.md](./detail/A3_onboarding_onepager.md)（Discord 置頂已生效；**repo 貼入 `docs/dernoson/` 尚未完成**）
- [x] **R-A4** 週節奏與門檻驗收機制：週日會固定議程、30 秒驗收定義、連續兩週未演示的處理、延期改版規則
  - 細項：[detail/A4_weekly_cadence_gate.md](./detail/A4_weekly_cadence_gate.md)（8/23 會上宣讀；8/30 首次完成率與本檔週曆回寫）

---

## 4. R-B｜擺放月（→ 2026-09-27）

**門檻句：** 從下方選單拉多種真機器放到畫布；點選後看到該機資訊；能刪單台；能轉 90 度（若 8 月未做完，9 月必須完成）。對應主編步驟 2 ＋ 5。

- [~] **R-B1** 工具列接真實機器資料：`ToolbarPanel` 清單改吃 `getAllMachines`／`getMachinesByTag`，分類 Tab 可先少類，卡片顯示真名與佔格
  - 細項：[detail/B1_toolbar_real_machines.md](./detail/B1_toolbar_real_machines.md)（**9/6 切片已合入** PR #43：分類 Tab＋名稱＋佔格、不接 store／落子。整包仍待 9/27：真實機器尚未走落子鏈）
- [!] **R-B2** 擺放鏈 L2 串接：工具列意圖 → drop／click → **只呼叫** `placeDevice`；預覽佔格讀真實 machine size
  - 細項：[detail/B2_placement_chain.md](./detail/B2_placement_chain.md)（只讀殼 #46；store #45 待合。**W0914：主畫面只讀接入**（[T1](../work_dispatch/toby/0914/W0914-T1_main_view_integration.md)，#45 後開工）。落子鏈等底層接完；**不列 9/27 硬綁**）
- [!] **R-B3** 旋轉 90 度：拿起中或已放置皆可 `rotateDevice`；port side／offset 走 `portUtils`
  - 細項：[detail/B3_rotation_90.md](./detail/B3_rotation_90.md)（**A2 依賴已解除**；仍等 B2／佈局殼）
- [~] **R-B4** 選取與設備資訊面板：選取 → L2 攤成 plain props → L3 顯示
  - 細項：[detail/B4_selection_inspector.md](./detail/B4_selection_inspector.md)（PR #33；MachineCard #41。**W0914 右側工單更正為產線總覽 StatsPanel**（[S1](../work_dispatch/shirone/0914/W0914-S1_stats_panel_land.md)），**不是本項**。B4 選取接線等底層接完；**不列 9/27 硬綁**）
- [ ] **R-B5** 刪除單台：Delete／右鍵接 `removeDevices`，進歷史
  - 細項：[detail/B5_delete_single_device.md](./detail/B5_delete_single_device.md)（等新選取／畫布入口）

---

## 5. R-C｜連線月（→ 2026-10-25）

**門檻句：** 兩台設備 port 對 port 拉管線，皮帶與水管能分、能轉 90 度彎；單台／單線可刪、可拖移；源設備能設產出素材。對應主編步驟 3 ＋ 4 ＋ 6。

- [!] **R-C1** Port 命中與 draft 連線：port 點可見、可點選、拖出暫時折線，放開命中另一 port 才成立
  - 細項：[detail/C1_port_hit_and_draft.md](./detail/C1_port_hit_and_draft.md)（等 B2；harry W0823-H1 已交工具態快捷鍵，屬連線前置加分）
- [ ] **R-C2** 連線契約與型別檢查（佈局模型版）：`canConnect(draft, layout)` 純函式回傳可／不可＋理由碼；`layoutStore.addPipeline` 內部作最終防線；L2 draft 期間呼叫決定 highlight
  - 細項：[detail/C2_add_connection_contract.md](./detail/C2_add_connection_contract.md)（**2026-09-19 依新模型重訂完成**：六條原規則三改寫／一成立／兩作廢，新增「斷線管線合法」；不碰 `editorStore.addConnection`）
- [ ] **R-C3** 管線折線與 90 度彎折渲染：`PipelineEdge` 畫正交折線，違規線段給紅色視覺
  - 細項：[detail/C3_pipeline_polyline_render.md](./detail/C3_pipeline_polyline_render.md)
- [ ] **R-C4** 拖移進歷史：拖曳結束呼叫 `commitDeviceMove(uids, before)`，Undo 可還原位置
  - 細項：[detail/C4_move_into_history.md](./detail/C4_move_into_history.md)
- [ ] **R-C5** 源節點素材設定：源設備可指定 `primaryOutput` 與速率，寫入 `FactoryNode.data`
  - 細項：[detail/C5_source_primary_output.md](./detail/C5_source_primary_output.md)

---

## 6. R-D｜串通月（→ 2026-11-29）

**門檻句：** 一條「源 → 加工 → 匯出點」連起來後，右側看到產耗（含中間物）；重疊與缺 IO／配方不符在右側有字；頂欄 JSON 存檔再開得回來。對應主編步驟 7 ＋ 8 ＋ 9 ＋ 10。

- [~] **R-D1** 右側產耗表接 flowStore：`ItemSummaryTable` 讀 `itemSummary`，空產線顯示空狀態，有連線會變
  - 細項：[detail/D1_stats_item_summary.md](./detail/D1_stats_item_summary.md)（W0823-M1 空狀態切片已合入 PR #37；**尚未**接 `flowStore`）
- [~] **R-D2** E001 重疊警訊上右側：`E001_deviceOverlap` 真邏輯＋測試，集中 `registerDetector`，右側顯示一條可懂訊息
  - 細項：[detail/D2_e001_overlap_alert.md](./detail/D2_e001_overlap_alert.md)（W0823-S1＋layout 收斂已合入 PR #36；`/dev/validation-test` 可觀察；**右側 Tips 列表未做**；shirone 轉調後純函式 owner 待移交）
- [~] **R-D3** 配方類警訊：缺輸入／缺輸出（E004／E005）與材料組合不符（W001）至少一類上右側，與 azure 草稿收斂成一套
  - 細項：[detail/D3_recipe_alerts.md](./detail/D3_recipe_alerts.md)（**W001 已合入 master** PR #35；E004／E005 仍在舊分支 `dev/azure9572`；ID 表未凍結；右側未接）
- [ ] **R-D4** 最小藍圖 JSON 匯出／匯入：`{ version: 2, planId?, devices, pipelines }` ＋ Zod 驗證；頂欄 Save／Load
  - 細項：[detail/D4_blueprint_json_io.md](./detail/D4_blueprint_json_io.md)（**2026-09-19 依新模型重訂完成**：version 跳 2、**不讀舊檔**、匯入沿用 `layoutStore.loadSnapshot` 不新增 action）
- [ ] **R-D5** 驗收劇本與彩排：8 步劇本文件化，11/22 先彩排一次，11/29 正式演示
  - 細項：[detail/D5_acceptance_rehearsal.md](./detail/D5_acceptance_rehearsal.md)

---

## 7. R-E｜跨月支撐（8/23 → 11/29）

不綁單月門檻，但每月都要有動作。

- [~] **R-E1** 資料與 codegen 維運：`data_1` → `data` → `src/data` 同步流程保持可跑，資料改動附測試
  - 細項：[detail/E1_data_codegen_ops.md](./detail/E1_data_codegen_ops.md)（本週無 codegen 管線變更；harry PR 另夾 TableCfg 快取待裁）
- [~] **R-E2** 三層守門與 PR 規範：待審 PR ≤ 3、禁止根目錄上傳與檔名當版本、Breaking 先改 L1
  - 細項：[detail/E2_layer_guard_pr_rules.md](./detail/E2_layer_guard_pr_rules.md)（W0907 合入 #41／#46／#44；**待審滿 3：#45／#47／#48**。閘門：無強綁 L2 放行。**0914 更新：** 鎖狀態改由當週 `WEEK_*.md` §3 統一宣告；`ToolbarPanel.vue` 本週對 goodmorning 限視覺解鎖，`ToolbarPanel` 踩鎖爭議結案）
- [ ] **R-E3** 備援與人力調度：可投入時間不穩定者不承擔門檻必要條件、每週配對名額 ≤ 2、已知空窗不派工
  - 細項涉及個別成員的可投入時間與備援安排，**於決策層維護、不公開**；對協作者生效的部分已寫進 [A4](./detail/A4_weekly_cadence_gate.md) 與每週工單
  - **2026-09-15 決策層備註（PR #49 review）：** ①S1＝產線總覽 StatsPanel→`src/app/`（非 B4）；②撤回 M2 必要項擴大，恢復硬綁 B1；③T1 等 #45 合入後開工；④視角切換器照稿、下週另派人（非 Avery）；⑤paper 命名已確認、排版靠 Figma comment；⑥A0／A1 不限制超前。
  - **2026-09-14 晚 決策層備註（0914 派工初版；部分已由 9/15 覆寫）：** 主畫面接入定案等。**M2 擴大／右側＝B4 兩條已撤回。**
  - **2026-09-14 決策層備註（摘要）：** W0907 實績回寫。avery 亞運至約 10 月初；MBD 假第二週；azure 續 0。下週產能約 12–20h 功能／4 人。
  - **2026-09-07 決策層備註（摘要）：** MBD 9/4 請接下來兩週假 → 9/7–9/20 不派。avery 窗口至 9/14；**再失聯除名**（窗口期未推 git）。
  - **2026-09-06 決策層備註（摘要）：** L1 解鎖已發；harry 回歸；9 月門檻仍只硬綁 B1（aaaaa）。

---

## 8. 週曆對照（標的日＝週日）

當週做不完就在當日會上改下一週，不把欠帳堆到月底。

| 週日 | 對應工項 | 30 秒看得出的產出 |
|------|----------|-------------------|
| 08/23 | A1、A3、A4 | **已交：** 公告大綱＋Discord；發 W0823 十張四欄工單；A4 規則口頭凍結 |
| **08/30** | **A2（門檻）** | **M1 成立。** 放一台佔格證據＝測試全綠＋錯機清單＋`/dev/placement-demo`；PR #32 合入。同日清空待審 PR #33–#38 |
| 09/06 | **L1 打底最優**＋B1 次優 | **已交。** L1 解鎖句＋`/dev/layout-l1-preview`＝PR #40（9/1）。B1 真機器列表＝PR #43（9/4）。L2 強綁未開（符合閘門）。加分：S1 PR #41 待合；G1 改錯檔不宜合；T1 等閘成功 |
| **09/13** | **佈局自建；L2 薄片** | **部分達成。** T1 GridCanvas 只讀＝**#46 合入**；S1 MachineCard＝**#41 合入**；A0 layoutStore＝**#45 仍開**（解鎖句已發於分支）；H1 viewport＝#47 待合；G1＝#48 踩鎖；P1／V1 未交。見 [WEEK_20260907](../work_dispatch/WEEK_20260907.md) |
| **09/20** | **主畫面只讀接入＋store 合入** | #45 進 master；T1（#45 後）掛 GridCanvas；#47／#48；S1＝StatsPanel→`src/app/`。**切換器本週不做。** 見 [WEEK_20260914](../work_dispatch/WEEK_20260914.md) v1.1 |
| 09/27 | **M2 門檻** | **硬綁 B1**。B2／B4 視底層是否接完再列；否則依 §11 |
| 10/04 | C1、C2 | 兩個 port 能連一條直線，型別對才允許。**C2 定義已於 2026-09-19 重訂完成**；本週切片＝錨點判定提共用＋`connectRules.ts`＋測試 |
| 10/11 | C3 | 彎折點 90 度；違規線段有紅色視覺 |
| 10/18 | C4、C5 | 拖移進歷史（或明寫「本週只移不 Undo」並排進 10/25）；源素材可設 |
| 10/25 | **C1＋C2＋C3＋C5（門檻）** | 步驟 3 ＋ 4 單物 ＋ 6 |
| 11/01 | D1 | 右側產耗表接 `itemSummary`，空產線有空狀態。**空狀態切片已由 W0823-M1 提前交** |
| 11/08 | D2 | 兩台重疊 → 右側一條訊息。**E001 純函式＋dev 頁已就位**；缺右側 Tips |
| 11/15 | D3 | 缺輸入或輸出、材料組合不符，至少一類上右側。**W001 純函式已合入**；缺右側與 ID 表 |
| 11/22 | D4、D5 | JSON 匯出下載；匯入還原；**驗收劇本彩排一次**。**D4 格式已於 2026-09-19 重訂完成**（v2；舊檔不讀） |
| 11/29 | **D1＋D2＋D4＋D5（門檻）** | 步驟 7～10 串在同一條演示產線上 |

---

## 9. 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 解除條件 | 狀態 |
|----|----------|----------|----------|------|
| R-B2 | 只讀殼 #46 已合。落子仍等 **store 合入＋主畫面只讀接入站穩＋再解鎖互動** | aaaaa（#45）；toby（T1） | store 進 master ＋ 佈局視角＝新殼 → 再開落子 | `[!]` **本週只讀接入中**。**不列 M2 硬綁**（9/15 撤回擴大） |
| R-B3 | 旋轉牽涉 port side／offset 換算；依賴擺放鏈 | R-B2；原等 R-A2 | **A2 已完成**（`rotatePort` pad-to-square＋測試全綠）→ A2 條件解除；仍等 B2／佈局層 | `[!]`（A2 依賴已清） |
| R-C1 | 依賴 R-B2 擺放鏈可用 | R-B2 | B2 於 9/27 門檻通過（或依 §11 改降級方案） | `[!]` |
| ~~R-C2~~ | ~~佈局自建後連接改為衍生值、不儲存，`addConnection`／`removeConnection` 廢除，本工項原定義失去標的（2026-08-25）~~ | — | — | **已解除（2026-09-19）：** W0914-A1 依新模型重訂完成，契約寫入 [detail/C2](./detail/C2_add_connection_contract.md) §4 與 §5；狀態改 `[ ]` 待實作（純函式 10/04）。**順帶消除**原「改 `editorStore.addConnection` 須標 Breaking、10/11 前提跨 CR 協商」之依賴 |
| ~~R-D4~~ | ~~§1.2 已定案的藍圖格式 `{ version, planId?, nodes, edges }` 不再是儲存形狀（改 `devices`／`pipelines`）（2026-08-25）~~ | — | — | **已解除（2026-09-19）：** 格式重訂為 `{ version: 2, planId?, devices, pipelines }`，舊檔不讀；狀態改 `[ ]` 待實作（純函式 11/08）。**順帶消除**原「CR-01 同意新增 `loadBlueprint`」之依賴（沿用 `layoutStore.loadSnapshot`） |
| ~~R-D3~~ | ~~shirone 與 azure9572 同域不同 ID~~ | — | — | **部分解除（8/30）：** W001 已合入 master（PR #35）。E004／E005 仍在 `dev/azure9572`；ID 表未凍結；右側未接。改標 `[~]`，不再列本表 |
| ~~R-D2~~ | ~~detector 註冊入口需集中~~ | — | — | **已解除（8/30）：** 使用端顯式 `registerDetector`；E001 於 `/dev/validation-test` 掛上。整項改 `[~]`（缺右側 Tips）。shirone 轉調 → 後續 owner 待移交 aaaaa |

新增封鎖一律回寫本表，寫明原因與等待對象；口頭封鎖不算數。

### 9.1 本週（W0907）完成率快照（A4 §4.4）

| 等級 | 分母 | 已 30 秒驗收／已合入 | 完成率 |
|------|------|----------------------|--------|
| **確定（9/27 前置）** | 1（A0＝layoutStore） | 交付在 PR #45；**未合 master** | **交付 100%／合入 0%** |
| **確定（L2 薄片）** | 2（T1、H1） | T1 **#46 合入**；H1 #47 待合 | **50% 合入**（H1 大致完成） |
| **確定（閘門／L3）** | 2（D0、S1） | D0 達成；S1 **#41 合入** | **100%** |
| **加分／暫停** | 4（P1、G1、V1、M0／Z0） | G1 有 PR 踩鎖；P1／V1 未交；M0／Z0 不計 | **不擋門檻** |

說明：合入優先未把 A0 排在 T1／S1 之前完成——**9/27 前置風險在 #45**。上期（W0831）快照見 git 歷史；當時確定項 100% 合入。

---

## 10. 完成定義（Definition of Done）

### 10.1 單一工項

- [ ] 該工項細項檔的「§DoD」全部勾選
- [ ] 本檔對應項目狀態標記已更新（`[x]` 或 `[!]` 並填封鎖表）
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過（純文件工項免）
- [ ] 交付路徑符合工單「交哪個檔」，未新開平行目錄或以檔名當版本
- [ ] 跨層需求已寫進文件，而非只留在對話

### 10.2 月底門檻

- [x] **M1（8/30）：** 該月「必要工項」全部 `[x]`（R-A1、R-A2）
- [ ] **M1：** 週日會上完成 30 秒演示（錄影或現場皆可）——**以 V10 三證據（測試全綠＋錯機清單＋`/dev/placement-demo`）代替主畫布目視**；會上記錄待補
- [x] **M1：** 未達成項目已在本檔改期並記錄延因，而非默默順延（本週無必要項延期；加分未達見 §9.1）
- [x] **M1：** 加分工項未交者，已確認由既有產出頂替，門檻不受影響（G1→現有 Toolbar；V1→維持現況）
- [ ] M2（9/27）／M3（10/25）／M4（11/29）：尚未到期

### 10.3 11/29 總驗收

以 [D5 驗收劇本](./detail/D5_acceptance_rehearsal.md) 的 8 步為準，全部通過即「初步串通、可運行」。

---

## 11. 動態調整規則

- 週日會只問「演示過了沒」，過了才開下一週範圍
- 連續兩週同項沒演示：切半或換人，不累積罪惡感清單
- 底層 API 改簽名：標 Breaking，先改 L1 再改 L2，同一週不逼 L3 跟版
- 主設計稿與功能順序衝突：外觀聽主設計，順序聽本檔
- §1.2 已定案與 §2 工項總表變更，須主編＋aaaaa 同意後改版本號
- ~~**渲染層落地前，不把任何月底門檻的必要項押在 L2**（2026-08-25）~~ → ~~**2026-09-14 放寬**~~ → **2026-09-15 撤回放寬，恢復本條**：M2 硬綁 B1；B2／B4 等底層接完再列必要
- **舊 Vue Flow 佈局畫布：只維護、不加深；新殼站穩前不刪檔**——換入口即可；照稿切換器下週另派
- **檔案鎖以當週 `WEEK_*.md` §3 為準**；鎖可按週轉移
- **時數優先序：L1 打底 ＞ B1 演示 ＞ 加分**（2026-08-31 定案）
- **L2 強綁閘門：** 無 aaaaa 的 `layout-L1` 完成宣告 → 不得開工／合入強綁 L2（擺放／選取／畫布殼接線）
- 主編下游無人時：延壓並標 §9，不自己吃功能實作（規則 17）

---

## 12. 版本紀錄

| 版 | 日期 | 說明 |
|----|------|------|
| **v1.10** | **2026-09-19** | **W0914-A1 契約重訂：** R-C2 連線契約與 R-D4 藍圖格式依 `PlacedDevice`／`Pipeline` 新模型重寫，**§9 兩項封鎖解除**，狀態 `[!]` → `[ ]`；§1.2 藍圖格式定案為 `{ version: 2, devices, pipelines }`、舊檔不讀；§8 的 10/04 與 11/22 備註更新。**順帶消除兩項跨 CR 協商依賴**（C2 不改 `editorStore.addConnection`；D4 沿用 `loadSnapshot`） |
| **v1.9** | **2026-09-15** | **PR #49 勘誤：** S1＝產線總覽 StatsPanel→`src/app/`；**撤回 M2 必要項擴大**（恢復硬綁 B1）；T1 等 #45；切換器下週另派；paper 命名結案 |
| **v1.8** | **2026-09-14 晚** | 0914 派工初版（M2 擴大／右側＝B4 等條已由 v1.9 覆寫） |
| **v1.7** | **2026-09-14** | **W0907 回寫：** GridCanvas 只讀 **#46 合入**；MachineCard **#41 合入**；layoutStore **#45 待合**；viewport #47 待合；§8／§9／§9.1 更新；B2 改等 store 合入＋整合 |
| **v1.6** | **2026-09-06** | **L1 解鎖已發**（PR #40）；**B1 9/6 切片合入**（PR #43）；§8 09/13 走已解鎖分支；B2 改等 store 模型＋只讀殼開工；C2 重訂順延；W0831 完成率快照 |
| **v1.5** | **2026-08-31** | **定案**提前 SVG 自建；**L1 最優**覆寫「B1 優先」；L2 **等宣告**閘門；§8 對齊 A0／WEEK_0907；派工 W0831-A0 |
| v1.4 | 2026-08-31 | §1.6 決策說明；提前開工評估（其後優先序被 v1.5 修正） |
| v1.3 | 2026-08-30 晚 | 會議改派 MachineCard／工具列 style；佈局提前開工註記 |
| v1.2a | 2026-08-30 | W0831 發工前技術勘誤（B1 落子鏈／RecipeDef／欄位名） |
| v1.2 | 2026-08-30 | W0823 完成度回寫；M1 成立 |
| v1.1 | 2026-08-25 | 佈局自建首次裁決；§9／§11；影響分析 0825 |
| v1.0 | 2026-08-22 | 初版 22 工項 |
