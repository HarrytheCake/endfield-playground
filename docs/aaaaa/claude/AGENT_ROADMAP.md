# Roadmap Agent 操作文檔（2026-08-23 → 11-29）

| meta | value |
|------|-------|
| 版本 | **v1.6（2026-09-11）** |
| 用途 | 供 AI Agent 讀取，協助執行 [ROADMAP_OUTLINE.md](../../../roadmap/ROADMAP_OUTLINE.md) 規劃的工項與每週派工 |
| 對應大綱 | [ROADMAP_OUTLINE.md](../../../roadmap/ROADMAP_OUTLINE.md) **v1.6** |
| 細項資料夾 | [detail/](../../../roadmap/detail/) |
| 本週公開派工 | [WEEK_20260907](../../../work_dispatch/WEEK_20260907.md) v1.1 |
| 佈局定案（公開） | [LAYOUT_REWRITE_EARLY_START_0831](../../LAYOUT_REWRITE_EARLY_START_0831.md) |
| 本週 Agent 約束 | [AGENT_WEEK_0907](./AGENT_WEEK_0907.md) |
| 本週決策層 | [0907/](../collaborator_survey/dispatch_private/0907/)（複查／E3／口頭稿） |
| 上週決策層 | [0831/](../collaborator_survey/dispatch_private/0831/) |
| 相鄰文檔 | [AGENT_CONTEXT.md](../../AGENT_CONTEXT.md)（CR-04 技術上下文）、[claude/CLAUDE.md](./CLAUDE.md)（CR-04 開發守則） |
| 語言 | 繁體中文（API 名稱、路徑、專有名詞除外） |

> 本檔只談 **roadmap 執行與派工操作**。FlowEngine 演算法、型別速查、跨 CR 契約請讀 [AGENT_CONTEXT.md](../../AGENT_CONTEXT.md)；程式碼註解與提交規則請讀 [claude/CLAUDE.md](../../claude/CLAUDE.md)。不要在本檔重複那些內容。

---

## 1. 你正在協助什麼

「明日方舟：終末地 集成工業模擬器」的 **2026-08-23 → 11-29 產品 roadmap 執行**。

目標是到 11/29 做出**一條已串通、打開就能操作、右側數字與警訊跟得上畫布的主線**——不是做完 Top Spec Phase 1，也不是把所有 CR 都實作完。

**2026-08-31 起的執行現實（必須納入判斷）：**

| 事實 | 含義 |
|------|------|
| **M1 已成立**（8/30） | A1／A2 完成；A3／A4 機制已跑 |
| **佈局 SVG 自建已定案、提前開工** | 拔佈局視角 Vue Flow；流程視角可續用 |
| **L1 打底＝全域最優先** | aaaaa **W0831-A0**；與 B1 衝突時 **A0＞A1** |
| **L2 強綁等宣告** | 唯一解鎖句：`layout-L1：…；L2 可開 …` |
| 團隊仍是讀書會性質 | 多數每週 2–6h；**任何「一次做完」建議都是錯的** |

---

## 2. 讀檔順序（依任務類型）

| 任務 | 讀這些，依序 |
|------|-------------|
| 產出每週工單 | 本檔 → [ROADMAP_OUTLINE](../../../roadmap/ROADMAP_OUTLINE.md) §1.6 §2 §8 → 當週 [0831/DECISION](./0831/DECISION_20260831_svg_l1_first.md)（或當週決策檔）→ 相關 [detail/](../../../roadmap/detail/) → [personal_profile/README](../personal_profile/README.md) §2 → 寫入 [work_dispatch/](../../../work_dispatch/)（`WEEK_*.md`＋`<code>/<MMDD>/W*.md`） |
| 執行某個工項 | 本檔 → 該工項 detail 全文 → 若涉佈局／畫布：先確認 **L1 是否已宣告** → [AGENT_CONTEXT](../../AGENT_CONTEXT.md) → [claude/CLAUDE.md](../../claude/CLAUDE.md) |
| 回答「現在進度如何」 | 大綱 §2／§3–§7 勾選 ＋ §8 週曆 ＋ §9 封鎖表 ＋ 當週 `WEEK_*.md` |
| 更新工項狀態 | 該工項 detail §11 開發日誌 → 大綱對應勾選 → §9 封鎖表 |
| 佈局／L1／L2／store 閘門問題 | [EARLY_START](../../LAYOUT_REWRITE_EARLY_START_0831.md) → [WEEK_0907](../../../work_dispatch/WEEK_20260907.md) → [AGENT_WEEK_0907](./AGENT_WEEK_0907.md) → [todolist_v12](../dev/todolist_v12.md) |
| 新增或修改工項 | 本檔 §7 → 先提問，取得負責人同意才動 |

**不要一次讀完全部 detail。** 只讀當前任務相關的那幾份。

---

## 3. 檔案地圖

```text
docs/roadmap/               ← 公開
├── ROADMAP_OUTLINE.md      大綱：工項、§1.6 佈局決策、週曆、封鎖、DoD
└── detail/                 工項細項（E3 人員細節不公開）

docs/aaaaa/
├── LAYOUT_REWRITE_DISPATCH_IMPACT_0825.md   8/25 首次派工影響（公開）
├── LAYOUT_REWRITE_EARLY_START_0831.md       8/31 SVG 提前＋L1 最優（公開定案）
├── claude/
│   ├── AGENT_ROADMAP.md                     本檔
│   └── AGENT_WEEK_0907.md                   本週 Agent 強制約束
└── collaborator_survey/dispatch_private/    ← 未進版控
    ├── 0823/                                決策層封存
    ├── 0831/                                上週決策層
    └── 0907/                                本週決策層
        ├── REVIEW_20260907.md
        ├── E3_risk_backup_staffing.md
        └── INTRO_A0_layout_store.md         週會口頭稿（A0）

docs/work_dispatch/         ← 公開正式派工
├── WEEK_20260831.md        上週
├── WEEK_20260907.md        本週大綱 v1.1
└── <code>/<MMDD>/W*.md     例：aaaaa/0907/W0907-A0_*.md
```

結構等同 `docs/aaaaa/dev/` 的 `todolist_vN.md` ↔ `dev_vN/`：大綱只放清單與狀態，長篇在 detail；**決策層**放風險等級、會議裁示；Agent 週約束放 `claude/AGENT_WEEK_*.md`。

### 上游與周邊

| 檔案 | 內容 |
|------|------|
| [ROADMAP_202608_202611.md](../ROADMAP_202608_202611.md) | 主編已確認的 v0.2 原始 roadmap（唯讀基準） |
| [DISCUSSION_DERNOSON_20260818.md](../DISCUSSION_DERNOSON_20260818.md) | 卡點分析與分派原則 |
| [work_dispatch/](../../../work_dispatch/) | **正式每週派工**（`WEEK_*.md`＋`<code>/<MMDD>/`） |
| [TICKETS_20260823.md](../TICKETS_20260823.md) | **已廢棄草稿**；勿再作為執行依據 |
| [personal_profile/README.md](../personal_profile/README.md) | 風險矩陣與派工規則 |
| `spec/` | 官方功能規格（CR-01 ～ CR-11） |
| `docs/dernoson/L1|L2|L3` | 三層邊界與契約 |

---

## 4. 硬規則速查（違反即為錯誤輸出）

### 4.1 架構

1. **L3 不 import Pinia store，也不 import `src/data/*`。** 只吃 props、只 emit。
2. **L2 只呼叫 L1 高階 action。** 禁止 `nodes.push`、禁止直接 mutate store 陣列、禁止 `historyStore.execute()`、禁止在容器內算流量。
3. **L1 不寫正式 UI。** debug 頁只能在 `src/app/dev/` 並加 dev-only guard。
4. **Detector 不 import Vue／Pinia。** 純函式，吃 `ValidationContext`，吐 alert。
5. **FlowEngine 只在 L1 跑。** L2／L3 只讀 `flowStore`。
6. **`src/data/*.ts` 是 codegen 產物，禁止手改。** 改 `docs/aaaaa/data/*.json` 後跑 `pnpm generate:src-data`。

### 4.2 佈局自建／L1 閘門（2026-08-31 定案）

7. **確認提前開發**佈局視角 **SVG 自建**（拔 Vue Flow）。流程視角可續用 Vue Flow。
8. **L1 打底最優先**（aaaaa）。時數與 B1 衝突時 **A0＞A1**。
9. **L2 強綁項禁止搶跑**（B2／B3／B5、B4 選取端、C\* 畫布、GridCanvas 接線）。唯一解鎖＝aaaaa 宣布 `layout-L1：…；L2 可開 …`。
10. **禁止加深舊** `FactoryCanvas`／Vue Flow node 作為正式路徑。
11. **dernoson 不合功能**（規則 17）：只裁示／合入／守閘。無宣告的強綁 L2 PR 須退回。

### 4.3 規劃

12. **一週一塊，一人一種性質**（純函式／畫面／接線，三選一）。
13. **月底門檻的必要工項只派 `risk ≤ 中`**。9 月起程式必要實質主要押 **aaaaa**（shirone 已轉 L3）。
14. **每張工單四欄**：畫面｜交哪個檔｜不要碰｜卡住找誰，外加等級、擋門檻、未交頂替。
15. **「交哪個檔」必須是具體路徑**，不能寫中文元件名。
16. 工單路徑固定：`docs/work_dispatch/<code>/<MMDD>/W*.md`（例 `0831/`）。

### 4.4 文件

17. 繁體中文；**禁止表情符號**（大綱與 detail 內文皆同）。
18. 狀態標記只用 `[ ]` `[~]` `[x]` `[!]`。
19. 封鎖一律回寫 [ROADMAP_OUTLINE.md](../../../roadmap/ROADMAP_OUTLINE.md) §9，寫明原因與等待對象。
20. 改期一律回寫大綱 §8 週曆；口頭改期不算數。
21. 決策層（風險等級、問卷、健康／行程細節）**不得**寫進公開 `work_dispatch/`／`roadmap/`。

---

## 5. 工項速查

| ID | 工項 | 里程碑 | 性質 | 擋門檻 | 狀態（快照） |
|----|------|--------|------|--------|--------------|
| R-A1 | 公告基準與工單格式凍結 | M1 08/30 | 決策 | 是 | `[x]` |
| R-A2 | 佔格與 port 對資料 | M1 08/30 | 資料／純函式 | **是** | `[x]` |
| R-A3 | 新人上手半頁 | M1 08/30 | 文件 | 否 | `[~]` |
| R-A4 | 週節奏與門檻驗收機制 | M1 08/30 | 流程 | 否 | `[x]` |
| R-B1 | 工具列接真實機器資料 | M2 09/27 | 資料→畫面 | **是** | `[ ]`（本週 A1＝次優） |
| R-B2 | 擺放鏈 L2 串接 | M2 09/27 | 接線 | **是** | `[!]` 等 layout-L1 |
| R-B3 | 旋轉 90 度 | M2 09/27 | 接線 | 否 | `[!]` 等殼／B2 |
| R-B4 | 選取與設備資訊面板 | M2 09/27 | 接線＋畫面 | **是** | `[~]` 呈現有進度；選取端等殼 |
| R-B5 | 刪除單台 | M2 09/27 | 接線 | 否 | `[ ]` 等新選取 |
| R-C1 | Port 命中與 draft 連線 | M3 10/25 | 接線 | **是** | `[!]` |
| R-C2 | 連線契約（待重訂） | M3 10/25 | 純函式＋接線 | **是** | `[!]` |
| R-C3 | 管線折線渲染 | M3 10/25 | 畫面 | **是** | `[ ]` |
| R-C4 | 拖移進歷史 | M3 10/25 | 接線 | 否 | `[ ]` |
| R-C5 | 源節點素材設定 | M3 10/25 | 接線 | **是** | `[ ]` |
| R-D1 | 右側產耗表接 flowStore | M4 11/29 | 接線＋畫面 | **是** | `[~]` |
| R-D2 | E001 重疊警訊上右側 | M4 11/29 | 純函式＋接線 | **是** | `[~]` |
| R-D3 | 配方類警訊 | M4 11/29 | 純函式 | 否 | `[~]` |
| R-D4 | 藍圖 JSON IO（格式待重訂） | M4 11/29 | 純函式＋接線 | **是** | `[!]` |
| R-D5 | 驗收劇本與彩排 | M4 11/29 | 驗收 | **是** | `[ ]` |
| R-E1 | 資料與 codegen 維運 | 跨月 | 資料 | 否 | `[~]` |
| R-E2 | 三層守門與 PR 規範 | 跨月 | 流程 | 否 | `[~]` |
| R-E3 | 風險備援與人力調度 | 跨月 | 流程 | 否 | `[ ]`（決策層 [0823/E3](./0823/E3_risk_backup_staffing.md)） |

**此表為快照，以 [ROADMAP_OUTLINE.md](../../../roadmap/ROADMAP_OUTLINE.md) §2–§7 為準。** 兩處不一致時以大綱為準，並修正本表。

**本週（0907）公開工單速查：** A0（layoutStore 最優・擋門檻）＞ D0 閘門 ＞ T1／H1 只讀薄片 ＞ S1 確定 ＞ P1／G1／V1 加分 ＞ M0／Z0 暫停。詳見 [WEEK_20260907](../../../work_dispatch/WEEK_20260907.md) 與 [AGENT_WEEK_0907](./AGENT_WEEK_0907.md)。

---

## 6. 常見任務的執行流程

### 6.1 產出某一週的工單

```text
1. 讀大綱 §8 週曆＋§1.6 佈局優先序
2. 讀當週決策層（例 0831/DECISION、MEETING、E3 週切片）
3. 讀相關 detail §6 週切片
4. 讀 personal_profile §2.2 矩陣，套用 §2.3 規則挑人
5. 檢查 L1 閘門：無宣告則不得派強綁 L2 為「確定／必要」
6. 每張工單填：四欄 ＋ 等級 ＋ 擋門檻 ＋ 未交頂替
7. 寫成 WEEK_<YYYYMMDD>.md ＋ work_dispatch/<code>/<MMDD>/W*.md
8. 同步決策層 REVIEW／AGENT_WEEK；公開檔不得含風險等級
```

**公開／未公開分界：** `docs/roadmap/` 與 `docs/work_dispatch/` 全員可讀。工單裡**不得**出現：個人檔連結、問卷題號、風險等級（高／最高）、查勤名單、自評落差、健康或行程具體原因。這些一律留在 `collaborator_survey/`；工單只寫「本週可做／本週不做／時數上限／未交怎麼辦」。等級用**確定／加分／暫停**，不用「可丟棄」對外用語時改寫為加分＋頂替說明即可。

**不要**在工單裡發明 detail 沒有的工作內容。若該週切片不足以填滿某人的工時，寧可留白，不要加派。

### 6.2 執行某個工項的實作

```text
1. 讀該 detail 全文，特別是 §4 技術決策與 §7 不做
2. 若目標檔屬佈局／舊畫布：確認 layout-L1 宣告；未宣告則停
3. 對照 §5 檔案計畫，確認要改哪些檔、哪些「不碰」
4. 確認 §8 依賴是否已滿足；未滿足則停下來回報，不要繞過
5. 實作；純函式優先於接線，接線優先於視覺
6. 跑 pnpm type-check / lint-check / format-check / test
7. 逐條核對 §9 DoD
8. 回寫 §11 開發日誌（日期倒序）與大綱狀態標記
```

### 6.3 遇到工項延誤

```text
1. 讀該 detail §10 的「未交頂替」
2. 若有頂替方案：套用，並在大綱 §8 週曆記錄延因
3. 若寫「無」：立即回報負責人，不要自行決定降級
4. 若涉及月底門檻必要工項變更：需主編 ＋ aaaaa 同意並升大綱版本號
5. 若 L1 未在週內宣告解鎖：下週走 WEEK_0907 §1B，不得寫死強綁 L2
```

### 6.4 發現細項檔與程式碼現況不符

detail 是規劃快照，程式碼會演進。發現不符時：

1. **以程式碼現況為準**做判斷
2. 在該 detail §3 現況盤點補一行修正，並在 §11 記錄
3. **不要**因為現況不同就擴大或縮小 §4 的技術決策——決策變更需提問

---

## 7. 需要提問而非自行決定的情況

以下一律先問負責人（aaaaa）或主編（dernoson），列出具體選項與建議，取得答覆才動：

| 情況 | 問誰 |
|------|------|
| 新增或刪除工項 | aaaaa |
| 變更月底門檻的必要工項清單 | 主編 ＋ aaaaa |
| 變更大綱 §1.2／§1.6 已定案項目（含 L1／L2 閘門） | 主編 ＋ aaaaa |
| 修改 `editorStore` 等 CR-01 主責檔的 action 簽名 | 主編（標 Breaking） |
| 引入新的 npm 依賴（例如 Zod） | 主編 |
| 修改 `docs/dernoson/`、`docs/<其他協作者>/` | **嚴禁修改**，一律提出草稿由對方貼入 |
| 判定 azure9572／avery 是否續留 | 主編 |
| 把某人的工單從加分升為門檻必要 | aaaaa（依 personal_profile） |
| 在無 `layout-L1` 宣告下派強綁 L2 | **禁止**；若堅持要問主編＋aaaaa |

**禁止在需求不清時擅自擴大範圍或選定未確認的技術方案。**

---

## 8. 關鍵程式路徑速查（roadmap 相關）

| 主題 | 路徑 | 相關工項 |
|------|------|----------|
| 藍圖狀態與高階 action | `src/store/editorStore.ts` | B2、B3、B5、C2、C4、C5、D4 |
| 歷史（Command Pattern） | `src/store/historyStore.ts` | B5、C4 |
| 選取 | `src/store/selectionStore.ts` | B4、B5 |
| 驗證 store | `src/store/validationStore.ts`、`src/composables/useValidation.ts` | D2、D3 |
| 流量結果 | `src/store/flowStore.ts` | D1 |
| 流量引擎 | `src/composables/useFlowEngine.ts` | D1、D3 |
| 佔格幾何 | `src/utils/geometryUtils.ts`（佈局自建後住址可能變） | A2、B2、D2 |
| 埠旋轉 | `src/utils/portUtils.ts` | A2、B3、C1 |
| 機器資料 | `src/data/machines.ts` | A2、B1、B4 |
| 配方資料 | `src/data/products.ts` | B4、D3 |
| 材料資料 | `src/data/materials.ts` | C5 |
| **舊佈局畫布（禁止加深）** | `src/editor/canvas/FactoryCanvas.vue`、`FlowNodeOverlay.vue`、`PipelineEdge.vue` | 等 L1／新殼 |
| 工具列 | `src/editor/toolbar/ToolbarPanel.vue` | B1、G1 |
| Inspector | `src/editor/inspector/InspectorSidebar.vue`、`InspectorPanel.vue` | B4 |
| 右側統計 | `src/editor/stats/ProductionStats.vue`、`src/components/StatsPanel/` | D1、D2 |
| 頂欄 | `src/editor/navbar/Navbar.vue` | D4 |
| 快捷鍵 | `src/composables/useShortcuts.ts` | B5、C4 |
| E001 detector | `src/lib/validation/detectors/E001_deviceOverlap.ts` | D2 |
| Dev 除錯頁 | `src/app/dev/FlowEngineTest.vue`、`DevTopologySvg.vue`、`ValidationTest.vue` | A2、C1、D1、D5 |
| 佈局 L1 打底（已合入） | 見 [W0831-A0](../../../work_dispatch/aaaaa/0831/W0831-A0_layout_l1_foundation.md) | layout-L1 |
| 佈局 store（本週最優） | 見 [W0907-A0](../../../work_dispatch/aaaaa/0907/W0907-A0_layout_store_model.md) | layout-store |

---

## 9. 常見誤判（讀到這裡就別再犯）

| 誤判 | 正確理解 |
|------|----------|
| 「右側沒數字 → 引擎壞了，要重寫 FlowEngine」 | 引擎完整。先查 `machineType`、edge handle、`primaryOutput`。`/dev/flow-engine` 能跑通即證明引擎正常 |
| 「L1 早在 5–6 月完成，L3 只能等」 | **FlowEngine／既有 L1 API** 早已可用；**佈局模型 L1 打底**（resolveConnections／toTopology／types）是 **2026-08-31 定案的新最優項**。兩者不要混為一談 |
| 「B1 比 L1 打底更重要，先做演示」 | **已定案 L1＞B1**（A0＞A1）。B1 仍爭取 9/6 演示，但是次優 |
| 「toby／harry 可以先改 FactoryCanvas 暖身」 | **禁止**。無 `layout-L1` 宣告不得開強綁 L2 |
| 「主編說能早則早，所以派他寫 GridCanvas」 | 接的是**決策／合入帶寬**，不是功能實作（規則 17） |
| 「這個人是 XX 層 Owner，整層都派給他」 | 已廢除整層 Owner。依工作形狀與 git 實際範圍派工 |
| 「順便把 A 也做了比較有效率」 | 每個 detail 都有 §7 不做。順便做會讓 PR 無法一週內 review |
| 「先做好看的 UI 再接資料」 | 先接得通再談外觀。外觀以 paper 為準，且不擋門檻 |
| 「框選／流程視角／HTML 匯出應該一起做」 | 全部明列於 11/29 前不做（大綱 §1.3） |
| 「detector 直接讀 flowStore 比較快」 | detector 禁止 import Pinia |
| 「機器資料錯了，我改 `src/data/machines.ts`」 | codegen 產物。改 `docs/aaaaa/data/*.json` 再跑 codegen |
| 「工單沒寫清楚，我猜一個範圍做」 | 提問。範圍不清時擅自擴大是本專案最貴的浪費 |
| 「下週一定開 L2，先把 0907 工單寫死」 | 無宣告走 WEEK_0907 **§1B**；有宣告才走 §1A |

---

## 10. 輸出格式規範

Agent 產出的 markdown 須符合既有慣例：

| 項目 | 規範 |
|------|------|
| 語言 | 繁體中文；API 名稱、路徑、指令保留原文 |
| 表情符號 | **禁止** |
| 標題 | `#` 一份檔一個；章節用 `##` `###` |
| meta 區 | 決策層／工單用表格；大綱用粗體 key-value 皆可 |
| 狀態 | `[ ]` `[~]` `[x]` `[!]` |
| 連結 | 相對路徑；注意從 `0823/`／`0831/` 多一層目錄 |
| 表格 | 決策、比較、清單優先用表格 |
| 開發日誌 | `### YYYY-MM-DD`，**日期倒序**（最新在上） |
| 工單檔名 | `W<MMDD>-<字母><序號>_snake_case.md`，放在 `<code>/<MMDD>/` |
| 決策層週資料夾 | `dispatch_private/<MMDD>/`；每週至少：REVIEW、E3 週切片；有定案則加 DECISION／MEETING／AGENT_WEEK |

### 10.1 決策層週檔格式（對齊 0823／0831）

| 慣例 | 說明 |
|------|------|
| 開頭 | `# 主題｜日期或週次` |
| meta 表 | version／狀態／範圍／公開對應／撰寫／最後更新 |
| 分隔 | meta 後 `---` |
| 結論靠前 | `## 0` 或 `## 1` 先給 30 秒結論表 |
| 日誌 | 文末 `## 日誌`＋`### YYYY-MM-DD` |

---

## 11. 版本紀錄

| 版 | 日期 | 說明 |
|----|------|------|
| v1.6 | 2026-09-11 | 本週改 0907：A0＝layoutStore；檔案地圖加 0907／AGENT_WEEK_0907；速查對齊 WEEK v1.1 |
| v1.5 | 2026-08-31 | 對齊 ROADMAP v1.5：SVG 提前定案、L1 最優、L2 閘門；檔案地圖改 0823／0831；工項狀態快照更新；誤判表補佈局／A0 |
| v1.0 | 2026-08-22 | 建立；對應 ROADMAP_OUTLINE v1.0 與 detail |
