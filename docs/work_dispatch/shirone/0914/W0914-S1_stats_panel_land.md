# W0914-S1｜shirone｜產線總覽面板落地（`StatsPanel` → `src/app/`）

| meta | value |
|------|-------|
| 週次 | 2026-09-14 → 2026-09-20 |
| 等級 | **確定**（本週只這一塊；**不押死線**——已知你這週忙） |
| 擋門檻 | 否 |
| 對應 roadmap | [R-D1 右側產耗表](../../../roadmap/detail/D1_stats_item_summary.md) 的**畫面殼**（本週不接 `flowStore`） |
| 現況 | MBD 已實作的 `src/components/StatsPanel/`（`Index`／`PowerSummary`／`ItemSummaryTable`／`TicketEstimate`／`WarehouseEstimate`＋stories） |
| 過審 | **白紙（paper）過審**（視覺／排版對稿） |
| 配對窗口 | 有（本週名額給你）；路徑或 import 卡住找 dernoson |
| 產能參考 | 自報 3–5h；忙就先交一半，推到分支即算交付 |

> **勘誤（主編 09/14–15 PR #49 review）：**  
> 先前誤把「右側面板」寫成 R-B4 設備資訊（點選單機）。正確標的是**產線總覽面板**——右側**恆常顯示**的整條產線層級概覽（產能、耗電、警示等）。設備點選資訊仍走 Inspector／R-B4，**本週不做**。

---

## 1. 目標

主編 9/13 的「shirone 與 MBD 共同完成主畫面右邊資訊面板」，指的是這塊**產線總覽**，不是點選設備後才出現的資訊欄。

本週你做兩件事（怎麼拆、要不要順手對稿，**你定**）：

1. **把 `src/components/StatsPanel/` 整包移到 `src/app/StatsPanel/`**（與 `MachineCard` 同層——`src/app/` 是這類畫面殼的合理位置）
2. **更新所有引用**（至少 `MainLayout.vue` 的 import、各 `*.stories.ts`），讓 `pnpm dev` 首頁右側與 Storybook 仍能開

一句話：**右側恆常那塊總覽，路徑在 `src/app/StatsPanel/`，跑得起來、對得上稿的方向。**

**本週不接 `flowStore`、不算流量、不顯示即時產速。** 接線是 R-D1／11 月的事；現況用假 props／零值即可（你現在的 `Index.vue` 已經是這種寫法）。

---

## 2. 這塊面板是什麼（白話）

| | 產線總覽（本週） | 設備資訊（不是本週） |
|--|------------------|----------------------|
| 何時出現 | **一直在右側** | 點了畫布上某台設備才填 |
| 看什麼 | 整條產線：產能表、耗電、券／倉估算、之後的警示 | 單機：名稱、佔格、配方、耗電 |
| 現有檔 | `StatsPanel/*` | `InspectorPanel`／未來 B4 |
| roadmap | 偏 R-D1 殼 | R-B4 |

MBD 假期中（至 9/20）；空狀態文案那類單步，他 9/21 起仍可接手——**你本週以搬路徑＋殼能跑為主**，文案精修不必一次做完。

---

## 3. 邊界

| 允許 | 不要 |
|------|------|
| 移動／改名 `src/components/StatsPanel/*` → `src/app/StatsPanel/*` | 碰 `src/editor/inspector/*`（設備資訊／B4） |
| 更新 `MainLayout.vue` 的 StatsPanel import（**只改 import 路徑**；`area-canvas` 歸 toby） | import 任何 store 或 `src/data/*` |
| 調整子元件結構、stories、對稿用的假 props | 接 `flowStore`／`useFlowEngine`／算產速 |
| Tailwind／Nuxt UI；對 paper 稿做視覺微調 | 碰 `ToolbarPanel.vue`、`src/editor/layout/*` |
| — | 刪掉既有子元件不留替代（Power／Item／Ticket／Warehouse） |

元件內部怎麼拆、要不要再抽共用，**你定**。需要對照時看已合入的 MachineCard（[#41](https://github.com/dernoson/endfield-playground/pull/41)）與現況 StatsPanel。

---

## 4. 驗收

- [ ] `src/app/StatsPanel/` 存在；`src/components/StatsPanel/` **不再**作為正式路徑（搬完可刪舊目錄）
- [ ] `pnpm dev` 首頁右側仍看得到統計／總覽區塊（不報錯）
- [ ] `pnpm storybook` 相關 stories 仍開得起來
- [ ] 檔內 `grep` 不到 `store`、`flowStore`、`src/data`
- [ ] `pnpm type-check`、`pnpm lint-check` 綠
- [ ] paper 對稿回「過」（或已依清單改完再請審）

**L3 本週仍以 Storybook＋主畫面右側為驗收現場。**

---

## 5. 分歧時

視覺或路徑若與 paper／本工單衝突：**先回一句再改**，不要只靠實作表態。gate 只有一個人（dernoson）。

---

## 6. 未交頂替

不計失敗。未交時右側維持現況 `src/components/StatsPanel/`，不影響 9/27（門檻硬綁仍是 B1）。你這週忙，**先把路徑搬過去＋import 綠**最有價值。
