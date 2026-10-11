# Roadmap 大綱｜2026-08-23 → 2026-11-29

**版本：** v1.16（2026-10-06；PR #59 主編裁 R-1＝B／R-2 同意）
**建立日期：** 2026-08-22
**規劃：** aaaaa
**守門與合入：** dernoson（主編）
**上游來源：** 主編提出並確認的 ROADMAP v0.2（決策層原始文件，未公開；其內容已完整拆進本檔與 `detail/`）
**狀態總覽：** **M1 成立。M2 功能門檻成立（驗收因 9/27 連假延至 10/04）。** 自建畫布打底全在 master：L1 #40、store #45、殼 #46、viewport #47、主畫面 #50、契約 #51、落子預檢＋`canConnect`＋點擊落子 #54／#55、StatsPanel 搬家 #53、折線幾何 #56。**未合：** 工具列視覺 [#48](https://github.com/dernoson/endfield-playground/pull/48)（CONFLICTING）。**2026-10-04 會議：** 問卷未齊仍派工；harry 換正式殼（拆舊底欄／舊右側）；toby 無邊界畫布＋基地框＋出界 Error；G／S 收工具列與右側並合作設備樣；白紙未接管線警示＋點管線變藍／左面板。**選取鎖部分覆寫：** 管線（及左面板所需的）點選本週允許；旋轉與 Delete 仍不開。C2 L1 已提前交完；C1 UI 順延 10/11。**2026-10-06 重派（v1.15）：** 會議紀錄另點名 **azure9572**（E004／E005／W001 用現行 detector 模型接 dev 頁 → **R-D3 由 11/15 提前到 10 月**）與 **MBD**（頂欄存檔／設定／下載／上傳四顆進 Storybook → **R-D4 頂欄 UI 提前量**），兩人原暫停單作廢；**只有 avery 整週暫停**（主編裁再放一週、不除名）。**連假空白一週不延 M3**——改以把 C1 命中判定與出界列表兩支 L1 純函式提前到 10/04 週交付來補。本週派工見 [WEEK_20261004](../work_dispatch/WEEK_20261004.md) **v1.2**（主編已裁 R-1＝B／R-2 同意）。

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
| **佈局渲染層** | **確認提前開發**佈局視角 **SVG 自建**。L1／只讀殼／store／**主畫面接入皆已合入**（#40／#46／#45／#50）。舊殼保留不刪。**照稿切換器仍待派**（非 Avery）。擺放／選取等底層接完。見 **§1.6**、[WEEK_20260914](../work_dispatch/WEEK_20260914.md) |
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
      │                      ├── 並行軌道【佈局自建 L1✅→只讀殼✅→store✅→主畫面接入✅】（§1.6）
      │                      │     技術前置全數合入；落子／選取只剩「解鎖與否」的裁決
      │                      │     主責：aaaaa（L1／store #40／#45）；殼＋容器＝toby #46／#50
      │                      ▼
      │                 09/20：殼已接上主畫面（只讀）＋viewport 合入 ✅
      │                 09/26–27：點擊落子＋預檢＋canConnect 合入 ✅（#54／#55）
      │                 10/04：M2 延後驗收過功能門檻；視覺 #48 仍欠
      ▼
R-C 連線（10/4→10/25）── 全部掛新畫布；C2 L1 已交；10/04 週改換殼，C1 UI→10/11
      ▼
R-D 串通（11/1→11/29）── D4 格式跟新模型；D1–D3 相對獨立
      ▼
   11/29 驗收劇本 8 步

R-E 跨月支撐（貫穿；含人力／門檻縮小裁示）
```

**讀法：** 上面是使用者功能軸；右邊是技術前置軸。兩邊都要動，但**門檻必要項在殼落地前只能押在左邊不依賴畫布的塊**（本月＝B1）與右邊的 **L1 純函式／契約**。store 已交未合時，**不以「分支有 store」假裝 B2 已解**。

**2026-10-04 更新：技術前置軸與點擊落子鏈都在 master。** 不再存在「分支有 store／落子」的假裝風險。**未齊的是正式 UI 殼**（#48、舊底欄／Inspector、12×8 畫布、設備樣）。**解鎖仍是裁決：** 10/04 放行管線點選＋左面板；旋轉／Delete 仍鎖。見 §9。

### 1.5 里程碑一覽

| 里程碑 | 日期 | 使用者能做到 | 必要工項（預設） | 佈局自建下的調整 |
|--------|------|--------------|------------------|------------------|
| M1 對齊 | 2026-08-30 | 新 clone 能開；放一台佔格證據 | A1、A2 | **已過**；不改 |
| M2 擺放 | 2026-09-27（**驗收延至 2026-10-04**） | 拉多種真機器放到畫布 | B1、B2（點擊落子） | **硬綁 B1 功能句已過**（#43 列表＋#54／#55 落子）。B4 點選看資訊、單刪、旋轉**未列入該月必要**，延入 10 月；#48 視覺轉 W1004-G1 |
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
| **優先序** | 落子鏈已合入。**2026-10-04 起：** ① 正式畫面換殼＋無邊界畫布 → ② C1 UI（10/11）→ ③ C3 視覺／C5 |
| **卡住誰？** | **已解：** store、容器、viewport、點擊落子、C2 L1。**10/04 放行：** 管線點選＋左面板。**仍鎖：** 旋轉、Delete。**仍等實作：** #48、無邊界畫布、換殼、C1 UI、引擎接 layoutStore。**不卡：** B1 資料切片、D1 空狀態 |
| **關鍵路徑** | **10/04 起在正式 UI 殼**（harry 換殼、G1 清 #48、toby 無邊界）。C1 不再被 B2 封鎖，但本週會議不派 C1 |
| **誰做 L1？** | aaaaa；store＝[W0914-A0](../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md)（**已合入 #45**）；契約＝[W0914-A1](../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)（**已合入 #51**） |
| **L2 解鎖** | **2026-09-23：** 點擊落子。**2026-10-04 追加：** 管線點選變藍＋左設備面板。旋轉／Delete 仍鎖。原則不變——底層就緒不等於自動解鎖 |
| **L2 檔案切分** | **W1004：** `MainLayout.vue`＝harry；`LayoutView`／`GridCanvas` 視窗＝toby；viewport composable＝harry 已交、本週由 toby 接入。G／S 只動設備佔格視覺區。import 可、改對方檔退回 |
| **視角切換器** | 照稿；仍未派（非 Avery）。**已連續兩週順延** |
| **誰不做？** | dernoson 不兼功能；inspector（B4）仍無人動；StatsPanel 歸 shirone |

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
| R-D3 | 配方類警訊 E004／E005／W001 | M4（**純函式段提前至 10 月**） | **azure9572**（10/04 會議點名）／備援 aaaaa | 純函式 | 否 | [D3](./detail/D3_recipe_alerts.md) |
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
- [x] **R-A3** 新人上手半頁：三塊畫面、props／emit、L3 禁 store、禁止根目錄上傳、禁止檔名當版本
  - 細項：[detail/A3_onboarding_onepager.md](./detail/A3_onboarding_onepager.md)（Discord 置頂已生效；**2026-10-04 收尾：repo 版改由根目錄 `README.md` 承接**）
- [x] **R-A4** 週節奏與門檻驗收機制：週日會固定議程、30 秒驗收定義、連續兩週未演示的處理、延期改版規則
  - 細項：[detail/A4_weekly_cadence_gate.md](./detail/A4_weekly_cadence_gate.md)（8/23 會上宣讀；8/30 首次完成率與本檔週曆回寫）

---

## 4. R-B｜擺放月（→ 2026-09-27）

**門檻句：** 從下方選單拉多種真機器放到畫布；點選後看到該機資訊；能刪單台；能轉 90 度（若 8 月未做完，9 月必須完成）。對應主編步驟 2 ＋ 5。

- [~] **R-B1** 工具列接真實機器資料：清單吃真實機器（#43）；點擊落子已接（#54／#55）。**視覺 [#48](https://github.com/dernoson/endfield-playground/pull/48) 仍未合入**（W1004-G1）
  - 細項：[detail/B1_toolbar_real_machines.md](./detail/B1_toolbar_real_machines.md)
- [x] **R-B2** 擺放鏈 L2 串接（**點擊落子切片**）：工具列意圖 → 點畫布 → `canPlaceDevice` → `addDevice`。已合 #54／#55。拖曳／綠紅框仍為加分、未做
  - 細項：[detail/B2_placement_chain.md](./detail/B2_placement_chain.md)
- [!] **R-B3** 旋轉 90 度：技術依賴已清；**10/04 會議仍不開旋轉**
  - 細項：[detail/B3_rotation_90.md](./detail/B3_rotation_90.md)
- [~] **R-B4** 選取與設備資訊面板：**2026-10-04 放行**管線點選＋左面板（P1 出稿、H1 留槽）。右側舊 Inspector 從正式頁卸載、檔案保留
  - 細項：[detail/B4_selection_inspector.md](./detail/B4_selection_inspector.md)
- [ ] **R-B5** 刪除單台：Delete 仍鎖（10/04 未放行）
  - 細項：[detail/B5_delete_single_device.md](./detail/B5_delete_single_device.md)

---

## 5. R-C｜連線月（→ 2026-10-25）

**門檻句：** 兩台設備 port 對 port 拉管線，皮帶與水管能分、能轉 90 度彎；單台／單線可刪、可拖移；源設備能設產出素材。對應主編步驟 3 ＋ 4 ＋ 6。

- [ ] **R-C1** Port 命中與 draft 連線：port 點可見、可點選彎折點，命中才成立
  - 細項：[detail/C1_port_hit_and_draft.md](./detail/C1_port_hit_and_draft.md)（**B2 依賴已清**；本週不派，切片改 10/11。正式頁尚無拉管線 UI）
- [~] **R-C2** 連線契約與型別檢查：`canConnect` 純函式＋`addPipeline` 防線 **已合 #54**；L2 draft highlight 未做
  - 細項：[detail/C2_add_connection_contract.md](./detail/C2_add_connection_contract.md)
- [~] **R-C3** 管線折線：`buildPipelinePolyline` 幾何 **已合 #56**；`GridCanvas` 仍畫簡單折線、未套用該函式
  - 細項：[detail/C3_pipeline_polyline_render.md](./detail/C3_pipeline_polyline_render.md)
- [ ] **R-C4** 拖移進歷史：拖曳結束呼叫 `commitDeviceMove(uids, before)`，Undo 可還原位置
  - 細項：[detail/C4_move_into_history.md](./detail/C4_move_into_history.md)
- [ ] **R-C5** 源節點素材設定：源設備可指定 `primaryOutput` 與速率，寫入 **`layoutStore`／`PlacedDevice`**（**主編 2026-10-06 裁採 B**）；引擎讀取端隨 10/18 提前一部分 D1 鏈
  - 細項：[detail/C5_source_primary_output.md](./detail/C5_source_primary_output.md)

---

## 6. R-D｜串通月（→ 2026-11-29）

**門檻句：** 一條「源 → 加工 → 匯出點」連起來後，右側看到產耗（含中間物）；重疊與缺 IO／配方不符在右側有字；頂欄 JSON 存檔再開得回來。對應主編步驟 7 ＋ 8 ＋ 9 ＋ 10。

- [~] **R-D1** 右側產耗表接 flowStore：空狀態切片 #37；路徑搬家 #53。**尚未**接 `flowStore`（引擎仍讀舊 `editorStore`）。樣式收尾＝W1004-S1
  - 細項：[detail/D1_stats_item_summary.md](./detail/D1_stats_item_summary.md)
- [~] **R-D2** E001 重疊警訊上右側：`E001_deviceOverlap` 真邏輯＋測試，集中 `registerDetector`，右側顯示一條可懂訊息
  - 細項：[detail/D2_e001_overlap_alert.md](./detail/D2_e001_overlap_alert.md)（W0823-S1＋layout 收斂已合入 PR #36；`/dev/validation-test` 可觀察；**右側 Tips 列表未做**；shirone 轉調後純函式 owner 待移交）
- [~] **R-D3** 配方類警訊：缺輸入／缺輸出（E004／E005）與材料組合不符（W001）至少一類上右側，與 azure 草稿收斂成一套
  - 細項：[detail/D3_recipe_alerts.md](./detail/D3_recipe_alerts.md)（**W001 已合入 master** PR #35；右側未接）
  - **2026-10-06 提前：** 10/04 會議點名 azure9572 本人收斂 E004／E005／W001 並接 `/dev/validation-test`＝[W1004-Z1](../work_dispatch/azure9572/1004/W1004-Z1_recipe_alerts_new_model.md)。**純函式段由 11/08–11/15 提前到 10/04 週**；上右側仍排 11/08。ID 表本週由主編凍結為 **E004／E005／W001 三支**（W002／W003 不收）。**不接 `layoutStore` 新模型**——驗證改吃佈局模型屬十一月 D1 鏈
- [ ] **R-D4** 最小藍圖 JSON 匯出／匯入：`{ version: 2, planId?, devices, pipelines }` ＋ Zod 驗證；頂欄 Save／Load
  - 細項：[detail/D4_blueprint_json_io.md](./detail/D4_blueprint_json_io.md)（**2026-09-19 依新模型重訂完成**：version 跳 2、**不讀舊檔**、匯入沿用 `layoutStore.loadSnapshot` 不新增 action）
  - **2026-10-06：頂欄按鈕外觀提前。** 10/04 會議點名 MBD 做存檔／設定／下載／上傳四顆＝[W1004-M1](../work_dispatch/MBD/1004/W1004-M1_topbar_buttons_storybook.md)，交 `src/components/TopBarButton/` 元件＋stories。**只有外觀、不接行為**（存讀仍排 11/22）；10/11 由 harry 掛進 `MainLayout`
- [ ] **R-D5** 驗收劇本與彩排：8 步劇本文件化，11/22 先彩排一次，11/29 正式演示
  - 細項：[detail/D5_acceptance_rehearsal.md](./detail/D5_acceptance_rehearsal.md)

---

## 7. R-E｜跨月支撐（8/23 → 11/29）

不綁單月門檻，但每月都要有動作。

- [~] **R-E1** 資料與 codegen 維運：`data_1` → `data` → `src/data` 同步流程保持可跑，資料改動附測試
  - 細項：[detail/E1_data_codegen_ops.md](./detail/E1_data_codegen_ops.md)（本期無 codegen 管線變更。**harry PR #47 夾帶的 TableCfg／icons 快取已於 9/14 隨合入入樹，主編選擇不拆**——落在 `docs/harry/dev/`，不影響 `src/`）
- [~] **R-E2** 三層守門與 PR 規範：待審 PR ≤ 3、禁止根目錄上傳與檔名當版本、Breaking 先改 L1
  - 細項：[detail/E2_layer_guard_pr_rules.md](./detail/E2_layer_guard_pr_rules.md)（**W0914 合入 #45／#47／#49／#50／#51，待審 3→1**，規則達成。閘門：無擺放／選取放行，`FactoryCanvas` 保留未刪。**0921 更新三項：** ①檔案鎖對「暫停者」事實上不生效——W0914 有兩人在 `MainLayout.vue` 越界，鎖表須同時公告於 Discord；②**CI 供應鏈納入本項範圍**——主編 9/15 修補 `discord-notify` workflow 的指令注入面，此前 roadmap 從未列過；③`docs/paper/` 出現誤入的 gitlink，須清除並加入 PR 檢查項）
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
| **09/20** | **主畫面只讀接入＋store 合入** | **達成。** #45 進 master（9/14）；#47 合入（9/14）；**T1 掛上 GridCanvas＝#50 合入（9/20）**；C2／D4 契約重訂＝#51 合入（9/20）。**未達：** S1 StatsPanel→`src/app/` 未開 PR；#48 病假懸置。切換器順延。見 [WEEK_20260914](../work_dispatch/WEEK_20260914.md) v1.1 |
| 09/27 | **M2 門檻（連假停工）** | **驗收延至 10/04。** 當週無演示。程式側 #54／#55／#53／#56 已於連假前／當日合入 |
| **10/04** | **M2 延後結算＋正式換殼** | **功能門檻過**（點真機器落到 GridCanvas）。#48 未合。派工＝harry 換殼、toby 無邊界、G／S 工具列＋右側＋設備樣、白紙未接管線稿、**azure E004／E005／W001 接 dev 頁**、**MBD 頂欄四顆進 Storybook**、**aaaaa 兩支 L1 前置**（`devicesOutsideBase`＋`findPortAt`）。**C1 UI 不在本週。** 見 [WEEK_20261004](../work_dispatch/WEEK_20261004.md) v1.1 |
| 10/11 | **C1 切片（必要）** | 兩個 port 能連；吃已存在的 `canConnect` 與 aaaaa 上週交的 `findPortAt`。**owner 本週日會定（toby 或 harry）**。前提＝換殼大致站穩；另：harry 把 MBD 的頂欄按鈕掛上 |
| 10/18 | **C3 套用＋C5（必要）** | `GridCanvas` 改用 `buildPipelinePolyline`（#56 已在 master，視覺鏈同 G／S）；源素材寫 `layoutStore`（已裁 B），**引擎讀取路徑本週必做**。C4 拖移仍視選取是否放行 |

| 10/25 | **C1＋C2＋C3＋C5（門檻）** | 步驟 3 ＋ 4 單物 ＋ 6。**日期不因連假順延** |
| 11/01 | D1 | 右側產耗表接 `itemSummary`，空產線有空狀態。**空狀態切片已由 W0823-M1 提前交** |
| 11/08 | D2 | 兩台重疊 → 右側一條訊息。**E001 純函式＋dev 頁已就位**；缺右側 Tips |
| 11/15 | D3 | 缺輸入或輸出、材料組合不符，至少一類上右側。**純函式段已於 10/04 週提前（W1004-Z1）**，本週只剩「上右側」 |
| 11/22 | D4、D5 | JSON 匯出下載；匯入還原；**驗收劇本彩排一次**。**D4 格式已於 2026-09-19 重訂完成**（v2；舊檔不讀） |
| 11/29 | **D1＋D2＋D4＋D5（門檻）** | 步驟 7～10 串在同一條演示產線上 |

### 8.1 10 月緊湊化（2026-10-06）

9/27 連假整週空白，**M3 日期不動**，等於三週要吃掉原本四週的量。三項調整：

| 調整 | 內容 |
|------|------|
| **L1 前置提前一週** | `findPortAt`（C1 §4.2 指定 aaaaa 提供）與 `devicesOutsideBase` 都在 **10/04 週**交，使 10/11 的 C1 工單只剩互動與視覺，不必當週從零想埠座標 |
| **加分項提前吃掉** | R-D3 純函式段（azure Z1）與 R-D4 頂欄按鈕外觀（MBD M1）都在 10/04 週落地。兩者**都不擋門檻、也不與門檻鏈共檔**，提前做等於把 11 月的量先搬走 |
| **必要項不擴大** | 問卷產能上修（shirone 6–10h、goodmorning／paper 3–5h）只用來加深樣式與清 #48，**不回頭擴大任何人的必要範圍** |

**一項已裁、一項仍待定：** C5 的 store 歸屬＝**B（layoutStore）**（主編 2026-10-06）；**C1 的 L2 owner** 仍待週日會定（見 §9）。

---

## 9. 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 解除條件 | 狀態 |
|----|----------|----------|----------|------|
| ~~R-B2~~ | ~~等 store／殼／解鎖~~ | — | — | **已解除且已合入（2026-09-26／27）：** 點擊落子 #54／#55。狀態改 `[x]`（拖曳加分未做） |
| R-B3 | 旋轉未放行 | 主編當週裁 | 10/04 會議仍不開旋轉 | `[!]`（技術依賴已清） |
| ~~R-C5~~ | ~~寫入位置未裁~~ | — | — | **已解除（2026-10-06）：** 主編裁 **採 B**——寫 `layoutStore`／`PlacedDevice.primaryOutput`；引擎讀取端隨 10/18 提前一部分 D1 鏈（見 [C5 §4.1a](./detail/C5_source_primary_output.md)） |
| **R-C1 owner** | **L2 主責未定（2026-10-06 新增）。** 10/04 會議把當週產能全給換殼，C1 只記「順延 10/11」未指人 | 主編＋週日會 | 10/11 工單發出前定 toby 或 harry | **`[!]` 待裁，期限 10/11**；命中判定純函式已派給 aaaaa（10/04 週） |
| ~~R-C1~~ | ~~等 B2~~ | — | — | **已解除（B2 點擊落子在 master）。** 狀態改 `[ ]`；**W1004 不派**，切片 10/11 |
| R-B4 | 9/23 曾鎖選取 | 主編 | **10/04 部分解除：** 管線點選＋左面板。完整設備 inspector 與 Delete 未放行 | `[~]` |
| ~~R-D1 遷移~~ | ~~`StatsPanel` → `src/app/` 的遷移多出兩套未經裁決的平行面板（2026-09-21 新增）~~ | — | — | **已撤銷（2026-09-23 主編裁）：** 那兩套只在 `dev/shirone0918`、未開 PR、不在 master；master 只有一套，**不存在版本選擇問題**。原判讀把「未開 PR 的分支內容」當成交付物，屬誤判。D1 的唯一前置回到「遷移合入 master」，已排進 [W0921-S1](../work_dispatch/shirone/0921/W0921-S1_stats_panel_split_pr.md) |
| ~~R-C2~~ | ~~佈局自建後連接改為衍生值、不儲存~~ | — | — | **L1 已合 #54**（`canConnect`＋`addPipeline` 防線）。狀態改 `[~]`；缺 L2 highlight |
| ~~R-D4~~ | ~~§1.2 已定案的藍圖格式 `{ version, planId?, nodes, edges }` 不再是儲存形狀（改 `devices`／`pipelines`）（2026-08-25）~~ | — | — | **已解除（2026-09-19）：** 格式重訂為 `{ version: 2, planId?, devices, pipelines }`，舊檔不讀；狀態改 `[ ]` 待實作（純函式 11/08）。**順帶消除**原「CR-01 同意新增 `loadBlueprint`」之依賴（沿用 `layoutStore.loadSnapshot`） |
| ~~R-D3~~ | ~~shirone 與 azure9572 同域不同 ID~~ | — | — | **部分解除（8/30）：** W001 已合入 master（PR #35）。E004／E005 仍在 `dev/azure9572`；ID 表未凍結；右側未接。改標 `[~]`，不再列本表 |
| ~~R-D2~~ | ~~detector 註冊入口需集中~~ | — | — | **已解除（8/30）：** 使用端顯式 `registerDetector`；E001 於 `/dev/validation-test` 掛上。整項改 `[~]`（缺右側 Tips）。shirone 轉調 → 後續 owner 待移交 aaaaa |

新增封鎖一律回寫本表，寫明原因與等待對象；口頭封鎖不算數。

### 9.1 本週（W0914）完成率快照（A4 §4.4）

| 等級 | 分母 | 已 30 秒驗收／已合入 | 完成率 |
|------|------|----------------------|--------|
| **確定（9/27 前置）** | 2（A0＝layoutStore、T1＝主畫面接入） | **#45 合入（9/14）、#50 合入（9/20）** | **100% 合入** |
| **確定（L2／契約）** | 2（H1＝viewport、A1＝C2／D4 重訂） | **#47 合入（9/14）、#51 合入（9/20）** | **100% 合入** |
| **確定（閘門）** | 1（D0） | 合入 5 個 PR；待審 3→1；無擺放／選取放行 | **100%** |
| **確定（L3）** | 2（S1、G1） | S1 標的達成但**未開 PR**；G1 **病假零產出**，#48 懸置七天 | **0% 合入** |
| **加分／暫停** | 4（P1、M0、Z0、V0） | P1 無審稿對象但自主交付稿上四項；M0／Z0／V0 不計 | **不擋門檻** |

**說明：**

- **確定項的五項技術主線（A0、A1、T1、H1、D0）100% 合入，是 roadmap 開跑以來第一次。** 上期「交付在分支、未進 master」的缺口關閉，9/27 前置風險解除。
- **未達的兩項都在 L3 且都不擋門檻**，但成因不同：S1 是**沒開 PR**（分支上有那一刀，工作樹也有兩個工單沒要求的目錄），G1 是沒交（病假）。
  > **2026-09-23 更正：** 原句寫「S1 是交了不能合」。主編裁示未開 PR 的分支內容不算交付，兩者不能混為一談——**沒開 PR 就是沒交**。這一版的用詞已改。
- **驗收對照（[WEEK_20260914 §0.1](../work_dispatch/WEEK_20260914.md)）：** V1 ✅ / V2 ✅ / V3 ✅ / V4 ❌ / V5 ❌ / V6 ✅ / V7 部分。
- 上期（W0907）快照見 git 歷史；當時確定項交付 100%、合入 50%。

### 9.2 本週暴露的三項流程缺口（非工項，交主編裁）

| # | 缺口 | 建議處置 |
|---|------|----------|
| 1 | **檔案鎖對「暫停者」不生效。** `WEEK_*.md` §3 的鎖只送達當週有收到工單的人；本週 `MainLayout.vue` 被兩個不在收件人名單上的人各改一份 | 暫停工單也要附「本週別碰這些檔」清單；鎖表同步公告於 Discord |
| 2 | **簽核前提互等。** #48 的合入前提是「paper 過」，但 #48 七天無動靜 → paper 無稿可審 → 兩邊互等 | 任何「A 的交付需 B 簽核」須同時寫逾時處置；低時數成員的簽核一律改事後補審 |
| 3 | **CI 供應鏈不在任何工項範圍內。** 主編 9/15 修補 `discord-notify` workflow 的指令注入面，屬計畫外工作 | 併入 R-E2（已於 §7 回寫） |

### 9.3 W0921／M2 延後結算（A4 §4.4；驗收日 2026-10-04）

連假導致 9/27 當週停工，完成率改在延後驗收日計算。口徑：合入 master 才算。W0914 快照見 §9.1（不覆寫）。

| 等級 | 分母 | 已合入 | 完成率 |
|------|------|--------|--------|
| **確定（門檻鏈）** | 2（A0 預檢、T1 落子） | #54、#55 | **100%** |
| **確定（清積壓／搬家）** | 2（G1 #48、S1 搬家） | S1 搬家 #53；**#48 未合** | **50%** |
| **確定（閘門）** | 1（D0） | 選取／刪／轉未被偷放行；#48 仍佔待審 | **部分** |
| **加分** | H1 折線、P1、A1 | H1 #56、A1 隨 #54；P1 未見 repo 交付 | 不擋門檻 |

**M2：** 硬綁功能句成立；視覺包裝不成立（#48）。欠帳不改寫 M2 必要項，轉 W1004。

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
- [x] **M2 功能門檻（原 9/27，驗收 10/04）：** 點真機器放到新畫布（B1 資料＋B2 點擊落子）
- [ ] **M2 視覺包裝：** #48 未合入——**不擋已延後的功能驗收**，轉 W1004-G1
- [ ] M3（10/25）／M4（11/29）：尚未到期

### 10.3 11/29 總驗收

以 [D5 驗收劇本](./detail/D5_acceptance_rehearsal.md) 的 8 步為準，全部通過即「初步串通、可運行」。

---

## 11. 動態調整規則

- 週日會只問「演示過了沒」，過了才開下一週範圍
- 連續兩週同項沒演示：切半或換人，不累積罪惡感清單
- 底層 API 改簽名：標 Breaking，先改 L1 再改 L2，同一週不逼 L3 跟版
- 主設計稿與功能順序衝突：外觀聽主設計，順序聽本檔
- §1.2 已定案與 §2 工項總表變更，須主編＋aaaaa 同意後改版本號
- ~~**渲染層落地前，不把任何月底門檻的必要項押在 L2**（2026-08-25）~~ → ~~**2026-09-14 放寬**~~ → **2026-09-15 撤回放寬，恢復本條**：M2 硬綁 B1。**2026-09-20 補註：** 渲染層已落地（#50），本條的前提消失；**但 M2 只剩一週且 B2／B4 未開工，本月仍不改必要項**，兩項改列 M3 前置
- **底層就緒不等於自動解鎖。** 技術前置全數合入後，擺放／選取的放行仍是**主編的當週裁決**，不得由「依賴已清」推論而自行開工
- **舊 Vue Flow 佈局畫布：只維護、不加深；新殼站穩前不刪檔**——入口已於 9/20 換成 `LayoutView`，舊殼保留為退路；照稿切換器仍待派
- **檔案鎖以當週 `WEEK_*.md` §3 為準**；鎖可按週轉移。**2026-09-21 追加：鎖表須同時公告於 Discord，且暫停者的工單也要附「本週別碰這些檔」清單**——W0914 有兩人在 `MainLayout.vue` 越界，成因是鎖只送達當週有工單的人
- **時數優先序：L1 打底 ＞ B1 演示 ＞ 加分**（2026-08-31 定案）
- **L2 強綁閘門：** 無 aaaaa 的 `layout-L1` 完成宣告 → 不得開工／合入強綁 L2（擺放／選取／畫布殼接線）
- 主編下游無人時：延壓並標 §9，不自己吃功能實作（規則 17）

---

## 12. 版本紀錄

| 版 | 日期 | 說明 |
|----|------|------|
| **v1.16** | **2026-10-06** | **[PR #59](https://github.com/dernoson/endfield-playground/pull/59) 主編裁決回寫：** ①**R-1＝B**——C5 寫入 `layoutStore`／`PlacedDevice.primaryOutput`；引擎讀取端隨 10/18 提前一部分 D1 鏈；§9 R-C5 封鎖解除。②**R-2 同意**——D3 ID 表凍結為 E004／E005／W001（W002／W003 不收）。C1 的 L2 owner 仍待週日會定 |
| **v1.15** | **2026-10-06** | **依 10/04 會議紀錄原句重新派工（v1.14 漏接兩人）：** ①**azure9572 復工**——會議點名「修 E004／E005／W001，用當前新模型接到 dev 畫面」，派 [W1004-Z1](../work_dispatch/azure9572/1004/W1004-Z1_recipe_alerts_new_model.md)；**R-D3 純函式段由 11/15 提前到 10/04 週**，ID 表凍結為 E004／E005／W001（W002／W003 不收），**不接 `layoutStore`**。②**MBD 恢復功能派工**——會議點名頂欄存檔／設定／下載／上傳四顆進 Storybook，派 [W1004-M1](../work_dispatch/MBD/1004/W1004-M1_topbar_buttons_storybook.md)；理由是**共檔風險消失**（新目錄），**R-D4 頂欄 UI 外觀提前**。③**avery 維持整週暫停**（主編裁再放一週、不除名）。**10 月緊湊化（§8.1）：** 連假空白一週**不延 M3**，改以把 `findPortAt`／`devicesOutsideBase` 提前到 10/04 週交付；新增 §9 兩項待裁封鎖（**C5 的 store 歸屬**、**C1 的 L2 owner**），期限皆 10/11。派工見 [WEEK_20261004](../work_dispatch/WEEK_20261004.md) v1.1 |
| **v1.14** | **2026-10-04** | **連假停工一週 → M2 驗收延至 10/04。** 畫布打底與點擊落子已在 master，**可以派 10 月工。** 問卷未齊不擋。會議改本週為換殼＋無邊界畫布，C1 切片改 10/11；C2 L1／C3 幾何已提前合入。管線點選部分覆寫 9/23 選取鎖。派工見 [WEEK_20261004](../work_dispatch/WEEK_20261004.md) v1.0 |
| **v1.13** | **2026-09-24** | **追加裁示（[PR #52](https://github.com/dernoson/endfield-playground/pull/52)）：** ①**#48 本週必須修完合入**（覆寫 v1.12「維持現狀」）——硬條件仍為 rebase＋換回 `listToolbarMachines`；不擋 T1，與 toby 同檔分區鎖。②**MBD**：週報約 3–5h **有產能**，**本週仍不派新功能碼**（Storybook／工作流未確認）；可選上手指引。派工見 [WEEK_20260921](../work_dispatch/WEEK_20260921.md) v1.2 |
| **v1.12** | **2026-09-23** | **主編裁決回寫（[PR #52](https://github.com/dernoson/endfield-playground/pull/52)）：** ①**R-B2 封鎖解除**——放行點擊落子，owner ＝ toby；選取／旋轉／刪除不開，B3／B4／B5 續鎖。②**R-D1 遷移封鎖撤銷**——未開 PR 的分支內容不算交付物，master 上只有一套 StatsPanel，不存在版本選擇問題；原判讀為誤判，§9.1 用詞一併更正。③**StatsPanel 單一 owner ＝ shirone**（元件＋路徑＋樣式），原屬 MBD 的樣式工作轉出，其 `dev/MBD` 分支不合入。④**#48 維持現狀不合不關**（已被 v1.13 覆寫），落子鏈改在 master 版 `ToolbarPanel.vue` 上接；#48 合入硬條件記入 [detail/B1](./detail/B1_toolbar_real_machines.md)。⑤「待審停滯 3 天點名」**不採納**，R-E2 不新增該條 |
| **v1.11** | **2026-09-21** | **W0914 結算：** 確定項五項（A0／A1／T1／H1／D0）全數合入，**佈局視角換殼完成**——`MainLayout` → `LayoutView` → `GridCanvas`，資料來自 `layoutStore`，舊 `FactoryCanvas` 保留；待審 3→1。§9 的 R-B2 由「等前置」改為**「等裁決」**，R-B3 解除佈局殼依賴；**新增封鎖 R-D1 遷移**（StatsPanel 交了三套未收斂）。§7 的 R-E2 **納入 CI 供應鏈**。新增 **§9.2 三項流程缺口**（鎖表對暫停者失效、簽核前提互等、CI 不在任何工項內），§11 對應補三條 |
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
