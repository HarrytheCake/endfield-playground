# W0921-D0｜dernoson｜門檻週：裁決已出，本週只剩守閘

| meta | value |
|------|-------|
| 週次 | 2026-09-21 → 2026-09-27（**M2 門檻日 9/27**） |
| 等級 | **確定**（決策／合入，不兼功能） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20260921](../../WEEK_20260921.md) **v1.2** |
| 產能參考 | 自報 ≤2h，**連續三期**。本單刻意只有合入與守閘，沒有任何要你寫的東西 |
| 待審上限 | ≤3（期初含 #48＝1；見 §1.2） |
| 版本 | **v1.2（2026-09-24）**。追加 R-3′（#48 本週必須收完）與 MBD 產能裁示 |

---

## 1. 裁決紀錄（2026-09-23 已出，本節僅存查）

原單列了三項待裁＋一項 B2 解鎖，本週派工先按建議選項發。**你的實際裁示如下，與預設有三處不同**，工單與 roadmap 已全數改完。

| # | 你的裁示 | 與原預設的差異 | 已改的檔 |
|---|----------|----------------|----------|
| **R-1** | **駁回。** `shirones_StatsPanel`／`test_StatsPanel` 只在 `dev/shirone0918`，沒開 PR、不在 master；master 上只有一套，**不存在「三套要選」** | 原預設是「本週先不裁，留待另案」——問題本身不成立 | [S1](../../shirone/0921/W0921-S1_stats_panel_split_pr.md) §4 |
| **R-D1 封鎖** | **撤銷。** 理由同上 | 原本開了一條 roadmap 封鎖 | [大綱 §9](../../../roadmap/ROADMAP_OUTLINE.md)、[D1](../../../roadmap/detail/D1_stats_item_summary.md) |
| **R-2** | **不合，M1 作廢。** MBD 的 StatsPanel 樣式工作已由 shirone 接手 | 原預設是「面板樣式收、由他重推乾淨分支」 | [M0](../../MBD/0921/W0921-M0_pause.md)（取代 M1）、[B4](../../../roadmap/detail/B4_selection_inspector.md) |
| **S1 範圍** | **擴大：** shirone 負責搬家 ＋ MBD 原本的樣式設計，兩件都要做完 | 原單只有搬家 | [S1](../../shirone/0921/W0921-S1_stats_panel_split_pr.md) v1.1 |
| **R-3** | **#48 維持現狀，不合也不關**（9/23）→ **已被 R-3′ 覆寫** | 見下表 | [G1](../../goodmorning/0921/W0921-G1_toolbar_pr48_land.md) |
| **R-4（B2 解鎖）** | **同意開放點擊落子。** 選取／旋轉／刪除不開 | 與預設相同 | [大綱 §4／§9](../../../roadmap/ROADMAP_OUTLINE.md)、[B2](../../../roadmap/detail/B2_placement_chain.md) |
| **§4 第 3 條** | **不採納**（待審停滯 3 天點名） | 原列為新規則 | [WEEK §3](../../WEEK_20260921.md)、[E2](../../../roadmap/detail/E2_layer_guard_pr_rules.md) |

### 1.1 追加裁示（2026-09-24）

| # | 裁示 | 你要做的 |
|---|------|----------|
| **R-3′** | **#48 本週必須修完合入**（不再無限期擱置）。T1 仍不依賴它 | 審 G1：資料來源必須是真實機器；不得刪 toby 的 `arm`；9/26 前可審、9/27 前合入或代修 |
| **MBD** | 週報約 **3–5h 有產能**，**本週仍不派新功能碼**（Storybook／工作流未確認前不宜再給共檔 L3） | §5 D 結案：不補派功能；可選學習不算交付 |

### 1.2 兩項連帶後果

**① goodmorning 恢復交付；MBD 不列分母。** G1 進合入序與 V3。MBD 完成率仍不計。

**② #48 重新計入待審。** 期初待審實質 1（#48）；合入後歸零。

---

## 2. 合入序

**S1 搬家 PR → A0 → T1 → G1（#48）→ H1 → A1。** 待審 ≤3。

| PR | 誰 | 你要做的 |
|----|----|----------|
| S1 搬家 | shirone | 只看「是不是純 rename」。**含新面板或樣式就退回重拆**；`MainLayout.vue` 只准動 StatsPanel 那一行 |
| A0 | aaaaa | 看 `layoutStore.test.ts` 有沒有被改——**沒改且全綠**才是行為不變的證據 |
| T1 | toby | **擋門檻。** 看 §4 的退回清單；`ToolbarPanel.vue` 的 diff 以 script／意圖層為主 |
| G1 | goodmorning | **清積壓。** rebase 後資料來源＝真實機器；視覺／stories 可留；**不得刪 `arm`** |
| H1 | harry | 純函式＋dev 頁，加分項，有空再審 |
| A1 | aaaaa | 提前量，交了就審，不急 |
| S1 樣式 | shirone | **無死線**，交多少審多少 |
| ~~MBD~~ | ~~MBD~~ | **不在序列內**（不派新功能） |

---

## 3. 本週生效的兩條流程改動

都來自上期暴露的缺口（[ROADMAP §9.2](../../../roadmap/ROADMAP_OUTLINE.md)），本單是它們第一次進工單。

| # | 改動 | 要你做什麼 |
|---|------|-----------|
| 1 | **鎖表同步公告 Discord，暫停者也要收到** | [WEEK §3](../../WEEK_20260921.md) 的鎖表整段貼進 Discord；avery、azure、MBD 的暫停單本週都附了鎖清單 |
| 2 | **簽核前提不得綁在無法履行的人身上** | 「paper 過」不再是任何 PR 的合入前提，一律改**事後補審**。低時數成員的簽核比照 |

> 原第 3 條「待審停滯 3 天即 Discord 點名」**你已否決**，[R-E2](../../../roadmap/detail/E2_layer_guard_pr_rules.md) 未新增該條，十條清單不動。

---

## 4. 閘門判準

| PR 內容 | 處置 |
|---------|------|
| 落子鏈（點擊落子、預檢、意圖層） | **可審**（R-4 放行範圍） |
| 落子前預檢純函式、C2 規則純函式、C3 折線純函式 | 可審 |
| 工具列視覺＋資料來源復原（#48；不得刪落子意圖） | 可審 |
| StatsPanel **純 rename** | 可審 |
| StatsPanel 樣式（改既有五檔的 template／style） | 可審，無死線 |
| **選取、旋轉、刪除、拖移既有設備** | **退回**（B3／B4／B5 未放行） |
| 擴充 `EquipmentType` 聯集或改 `editorStore` 簽名 | **退回**（會把新模型綁回舊藍圖世界） |
| L2 自己 import `detectOverlaps` 重算佔格 | **退回**（兩套判定） |
| `GridCanvas` 內 store import | 退回 |
| 刪 `InspectorSidebar` 或 `FactoryCanvas` | **退回**（B4 入口與舊殼退路） |
| 新開第三個 StatsPanel 目錄 | **退回**（單一 owner ＝ shirone，單一路徑 ＝ `src/app/StatsPanel/`） |
| 同一支 PR 同時含 rename 與樣式 | **退回重拆** |
| 非 owner 改 `MainLayout.vue`（shirone 的 StatsPanel import 那一行除外） | 退回 |
| 把既有真實資料來源換成 hardcode 陣列 | **退回**（#48 的前車之鑑，見 [B1](../../../roadmap/detail/B1_toolbar_real_machines.md)） |
| `docs/paper/` 的 gitlink | 你清掉（§5），並加入 PR 檢查項 |
| 網頁 Upload、檔名當版本、不可見字元 | 退回 |

---

## 5. 仍要處理

| # | 事項 | 期限 |
|---|------|------|
| A | 清掉 `docs/paper/` 誤入的 gitlink（`160000 commit …/endfield-playground`，無 `.gitmodules`）。**口頭跟 paper 說一次即可，不列為他的扣分項** | 本週 |
| B | 裁 azure9572 舊分支 `dev/azure9572` 上 E004／E005 的去留。**已掛超過三週，R-D3 右側接線要到 11/15**；若備賽延到 11 月，10 月前要決定移交或作廢 | 10 月前 |
| C | `dev/Avery` 標記作廢（`FactoryLayout.vue` 的 U+2060 殘留、已與 master 分歧三個月），回歸時重開 | 本週 |
| D | **MBD／goodmorning 補派——已結（9/24）：** G1 恢復交付；MBD 不派新功能（有產能、先確認 Storybook） | 已結 |
| E | **9/27 門檻記錄**：B1 過或降級，兩種都要寫進 [ROADMAP §9.1](../../../roadmap/ROADMAP_OUTLINE.md) 當日快照 |

---

## 6. 不做（規則 17）

不寫落子鏈、不寫預檢、不替 shirone 收面板的尾。下游交不出就延壓標 roadmap。

**單點依賴仍未緩解。** 本期 5 個 PR 全在 48 小時內處理完，響應不是瓶頸；瓶頸是「只有一個人能合」。備援指定不列本週工項，但它已經掛了三期。

---

## 7. DoD

- [x] §1 裁決已給出（2026-09-23）＋追加裁示（2026-09-24）
- [x] B2 解鎖範圍明確宣告（放行點擊落子／不放行選取旋轉刪除）
- [x] MBD／goodmorning 補派結論已寫（G1 恢復；MBD 不派功能）
- [ ] S1 搬家 PR 合入，`src/app/StatsPanel/` 進 master
- [ ] A0 合入且 `layoutStore.test.ts` 未被修改
- [ ] T1 若開：無 `editorStore` 簽名變更、無自算重疊
- [ ] G1／#48：資料來源為真實機器；未刪落子意圖；9/27 前合入或代修
- [ ] 鎖表已貼 Discord（含暫停者）
- [ ] 待審 ≤3
- [ ] 9/27 門檻結果已記錄
- [ ] 自己的 diff 不含落子鏈／預檢／StatsPanel 實作
