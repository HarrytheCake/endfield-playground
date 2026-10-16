# W0921-M0｜MBD｜本週不派新功能（有產能，先確認工作流）

| meta | value |
|------|-------|
| 週次 | 2026-09-21 → 2026-09-27 |
| 等級 | **暫停功能派工**（不計完成率） |
| 擋門檻 | **否** |
| 狀態 | `[x]` 成立 |
| 上游 | [WEEK_20260921](../../WEEK_20260921.md) v1.2、週報 0914、上週 [W0914-M0](../0914/W0914-M0_pause.md) |
| 版本 | **v1.2（2026-09-24）**。依週報確認產能後，主編決定**本週不派新產品工作** |

---

## 1. 問卷怎麼說（所以才這樣裁）

你 9/21 填的週報：

| 欄 | 你填的 |
|----|--------|
| 本週投入 | 3–5h |
| 下週可投入 | **與本週差不多** → 仍是約 **3–5h** |
| 下週風險 | 時間不穩 |
| 補充 | 「慢慢搞」 |
| 性質 | 聽派工指示 |

**結論：這週你有時間。** 不是「零產能不能派」。

但右側面板（StatsPanel）已整區轉給 shirone，而主編對「再給一塊新的 L3」仍保守——目前對 Storybook／PR 工作流還不熟時，**多給新功能等於多給踩鎖與重工的機會**（上週 `MainLayout` 與 StatsPanel 撞車就是前例）。

所以本週的決定是：

> **有產能，但不派新的產品功能碼。**  
> 可選：只做「Storybook 上手」這一步（§3），不開功能 PR、不做死線、不計未完成。

---

## 2. 上週那 6 筆：仍然不合入

`dev/MBD` 整支不合入；StatsPanel 樣式由 shirone 做。理由不變——右側只留一個 owner。你的成果他可以參考，分支留著不刪。

---

## 3. 可選：Storybook 上手（不做也完全沒關係）

若你這週想動一下手、又不要碰門檻線上的檔，照 [GUIDE_storybook_first_look.md](./GUIDE_storybook_first_look.md) 走一遍即可。

| 要 | 不要 |
|----|------|
| 本機把 Storybook 開起來 | 改 `src/` 任何正式元件 |
| 看既有 stories（MachineCard 或 StatsPanel） | 新開平行目錄 |
| Discord 貼「我看到了 XXX」一兩句 | 為了交而硬開 PR |

**推不推分支都行；這不是交付項。**

---

## 4. 本週別碰這些檔（規則 23）

| 檔／區 | owner |
|--------|-------|
| `src/app/StatsPanel/*`、`src/components/StatsPanel/*` | **shirone**（整區） |
| `src/app/layouts/MainLayout.vue` | toby |
| `src/editor/layout/*`、`src/editor/toolbar/*` | toby／goodmorning（門檻＋#48） |
| `src/utils/layout/*`、`src/store/*` | aaaaa |
| `src/editor/inspector/*`、`InspectorSidebar` | **凍結：誰都不能刪** |
| `FactoryCanvas.vue`、`FlowNodeOverlay.vue` | 凍結 |

**這週 `src/` 底下不要改產品碼。** 想動什麼先 Discord 講一句。

---

## 5. 下次什麼時候會再派功能

兩個條件都近了才發（規則 19 單步）：

1. Storybook 你自己開得起來（§3，或之後 Discord 講一聲「會了」）
2. 有一塊**不與人共檔、有稿可對、不必先懂 store** 的 L3

方向仍是：獨立呈現元件，或接 paper 稿的純視覺——**不會是 StatsPanel**。

---

## 6. 卡住找誰

| 狀況 | 找誰 |
|------|------|
| Storybook 開不起來 | dernoson 或 GUIDE 裡的指令 |
| 覺得閒著想做功能 | **先講再做**，不要自己挑檔開工 |
| 上週那 5 個檔的去向 | shirone／dernoson |

本週總表：[WEEK_20260921](../../WEEK_20260921.md)。
