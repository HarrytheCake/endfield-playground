# W0914-S1｜shirone｜右側「設備資訊面板」呈現元件（L3）

| meta | value |
|------|-------|
| 週次 | 2026-09-14 → 2026-09-20 |
| 等級 | **確定**（本週只這一塊；**不押死線**——已知你這週忙） |
| 擋門檻 | 否（R-B4 的呈現側；接線不在本週） |
| 對應 roadmap | [R-B4 選取與設備資訊面板](../../../roadmap/detail/B4_selection_inspector.md) §4.1 |
| 前置 | 你已合入的 MachineCard 與 `src/components/FormulaItem/`（[#41](https://github.com/dernoson/endfield-playground/pull/41)、[#43](https://github.com/dernoson/endfield-playground/pull/43)） |
| 過審 | **白紙（paper）過審** |
| 配對窗口 | 有（本週名額給你）；欄位對不上就直接約 |
    10|| 產能參考 | 自報 3–5h；忙就先交一半，推到分支即算交付 |

---

## 1. 目標

主編 9/13 定的暫定安排是「shirone 與 MBD 共同完成主畫面右邊資訊面板」。MBD 這週還在假期（到 9/20），所以**本週先由你把呈現元件做出來**，他 9/21 回來接空狀態與文案那一小塊。

這塊面板就是 roadmap 的 **R-B4**：點畫布上一台設備，右側顯示這台機的名稱、佔格、配方、耗電。

**本週只做「顯示」那一半。** 「點了之後把資料送進來」是 L2 的接線，本週選取還鎖著，不是你的事。

一句話：**Storybook 裡餵一包純文字 props，面板就長出來；不餵，就顯示空狀態。**

---

## 2. 這塊面板要吃什麼（B4 §4.1 的攤平契約）

**全部是已經處理好的字串**，你不需要算、不需要換單位、不需要判斷有沒有值以外的事：

| prop | 型別 | 例 | 本週 |
|------|------|-----|------|
| `name` | `string` | `分流器` | **必做** |
| `sizeText` | `string` | `3×2` | **必做** |
| `powerText` | `string \| null` | `120 kW`／`null` | **必做** |
| `portsText` | `string` | `入 2／出 1` | **必做** |
| `machineId` | `string` | `splitter` | **必做** |
| `modeLabel` | `string \| null` | `高速模式`／`null` | 可選 |
| `recipes` | `{ label; inputs; outputs; timeText }[]` | 見下 | 可選（可重用 `FormulaItem`） |

`recipes` 每一項都是字串，例如 `{ label: '鐵板', inputs: '鐵礦 ×2', outputs: '鐵板 ×1', timeText: '2.0s' }`。

**這幾個名字請照用**，不要改成別的拼法——9/21 L2 攤平層要照這份餵進來，名字對不上就得改兩邊。

---

## 3. 三個狀態

| 狀態 | 顯示 |
|------|------|
| 有選取（1 台） | 完整資訊 |
| 沒選取 | 空狀態（例如「點選設備以查看資訊」）。**文案先隨便寫一句能看的**，正式文案 9/21 由 MBD 定 |
| 選了多台 | 「已選取 N 台」一行就夠，不做聚合統計 |

---

## 4. 邊界

| 允許 | 不要 |
|------|------|
| 新建 `src/components/<你定的名字>/`＋其 `*.stories.ts` | **碰 `src/editor/inspector/*`**（那是 L2 接線層，本週無人動） |
| 重用／延伸 `src/app/MachineCard/*`、`src/components/FormulaItem/*` | import 任何 store 或 `src/data/*` |
| 自己決定要不要拆子元件、檔名怎麼取 | 顯示即時產速、效率、流量（那是 11 月的事） |
| Tailwind class、Nuxt UI 元件 | 做可編輯欄位 |
| — | 碰 `ToolbarPanel.vue`（本週歸 goodmorning）、`src/editor/layout/*`（toby／harry） |

**能重用就重用。** MachineCard 已經有標題、資訊列、配方列表這些零件；如果面板長得跟卡片九成像，直接抽共用元件比重寫划算——**怎麼抽你定**，工單不寫死。

---

## 5. 驗收

- `pnpm storybook` 有這個面板的頁面，至少三個 story：`selected`（完整）、`empty`（未選取）、`multiple`（已選取 N 台）
- 檔內 `grep` 不到 `store`、`src/data`
- `pnpm type-check`、`pnpm lint-check` 綠
- paper 對稿回「過」（或你已依其修改清單改完再請審）

**L3 本週仍以 Storybook 為驗收現場。** 主編 9/13 說的「不須使用 Storybook」是針對 L2（toby／harry）的接線任務，你這邊照舊。

---

## 6. 分歧時

視覺或欄位若與 paper／本工單衝突：**先回一句再改**，不要只靠實作表態。gate 只有一個人（dernoson）。

---

## 7. 未交頂替

不計失敗。未交時 9/21 由 L2 直接在 Inspector 輸出純文字列表頂替，**視覺可丟棄、攤平契約不可丟棄**（B4 §10）。你這週忙，交一半也可以——先把 `selected` 那個 story 做出來最有價值。
