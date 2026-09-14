# W0914-D0｜dernoson｜守閘：合入四支 PR，放行主畫面接入

| meta | value |
|------|-------|
| 週次 | 2026-09-14 → 2026-09-20 |
| 等級 | **確定**（決策／合入，不兼功能） |
| 擋門檻 | 否（但閘門失守會撤回主畫面接入） |
| 上游 | [WEEK_20260914](../../WEEK_20260914.md) |
| 產能參考 | 自報 ≤2h，全額給守門（本週待審量大，優先序見 §1） |
| 待審上限 | **≤3**（現況已滿：#45／#47／#48） |

---

## 1. 本週最重要的一件事

**清掉積壓。** 三支 PR 同時開著，而 `origin/master` 上**還沒有 `layoutStore`**——下游全部卡在這件事上。

合入順序：**#45（A0）→ #47（H1）→ #48（G1，需 paper「過」）→ T1 → S1。**

| PR | 誰 | 卡在哪 | 你要做的 |
|----|----|--------|----------|
| [#45](https://github.com/dernoson/endfield-playground/pull/45) | aaaaa | review 意見未收完 | **本週前段合入**；意見若只剩枝節就直接合，不要為了完美再多繞一週 |
| [#47](https://github.com/dernoson/endfield-playground/pull/47) | harry | 同上 | #45 之後合 |
| [#48](https://github.com/dernoson/endfield-playground/pull/48) | goodmorning | 等你＋paper | 技術面你審；視覺等 paper「過」 |
| T1 | toby | 未開 | 主畫面接入，週後段 |
| S1 | shirone | 未開 | L3 元件，不押死線 |

---

## 2. 本週定案（已裁，不用再等）

| # | 事項 | 結論 |
|---|------|------|
| 1 | **主畫面接入方式** | 佈局視角改掛 `GridCanvas`；舊 `FactoryCanvas` **保留不刪**、不再是入口；toby 留切換開關 |
| 2 | **本週互動範圍** | 只讀渲染＋視窗座標。**擺放／選取仍鎖**，9/21 才開 |
| 3 | **L2 owner** | toby＝`LayoutView.vue`／`GridCanvas.vue`／`MainLayout.vue`；harry＝`useGridViewport.ts`／`GridViewportDemo.vue`／`router`。**同檔退回後到者** |
| 4 | **`ToolbarPanel.vue`** | **本週對 goodmorning 解鎖，限視覺**（template／class／style）。邏輯、`dataTransfer`、`listToolbarMachines`、a11y 屬性不得改。aaaaa 與其餘全員不動該檔 |
| 5 | **Storybook** | L2 不再以 Storybook 當驗收現場；**L3（G1／S1）仍要 story** |
| 6 | **9/27 必要項** | 主編已裁擴大為 **B1＋B2＋B4**。承擔與頂替見 [WEEK_20260914](../../WEEK_20260914.md) §2.1 |
| 7 | **右側資訊面板** | 標的＝R-B4；本週只收 L3 呈現元件，**接線與攤平層排 9/21** |

---

## 3. 閘門判準（本週版）

| PR 內容 | 處置 |
|---------|------|
| store 收尾、viewport、主畫面容器接入（只讀）、L3 元件＋story | 可審 |
| 工具列**只改視覺** | 可審（限 goodmorning） |
| **擺放／選取接線** | **退回**（本週未解鎖，排 9/21） |
| **刪除 `FactoryCanvas.vue`／`FlowNodeOverlay.vue`** | **退回**（退路要留） |
| 往 Vue Flow 佈局加新功能 | 退回 |
| `GridCanvas.vue` 內出現 store import | **退回**（取資料應在 `LayoutView.vue`） |
| toby 與 harry 同檔 | **退回後到者** |
| goodmorning 改到 `ToolbarPanel.vue` 的 `<script setup>` 邏輯 | 退回（§2-4 界線） |
| shirone 改到 `src/editor/inspector/*` | 退回（本週無人動該區） |
| 改 `editorStore` 簽名 | 退回 |
| 網頁 Upload、檔名含不可見字元、檔落根目錄 | 退回，不例外 |

---

## 4. 仍要處理

| # | 事項 | 產出 | 期限 |
|---|------|------|------|
| A | 上週退件三筆的結果確認 | goodmorning 已改走 PR（#48）；MBD／avery 兩筆維持不合入，**不用再催**（兩人休假中） | — |
| B | #48 範圍對齊新界線 | PR comment 寫明「本週可改 `ToolbarPanel.vue` 視覺，邏輯與 a11y 不動」 | 發工單後盡快 |
| C | 主畫面接入的驗收 | `pnpm dev` 首頁自己看一次：新畫布畫得出來、切換鍵可退回舊殼 | 隨 T1 |
| D | **9/20 檢查點** | #45 未合或 T1 未演示 → 在週日會**書面**記錄 B2／B4 是否依 ROADMAP §11 降級 | 9/20 |

---

## 5. 不做（規則 17）

不寫 `layoutStore`、`LayoutView`、`useGridViewport`、工具列視覺。下游交不出來就**延壓並標 roadmap**，不要自己吃。

你上週自報投入降到 ≤2h——本週待審四到五支，**把時間全部放在合入與退件理由上**，功能一律不碰。

---

## 6. DoD

- [ ] #45 已合入 master
- [ ] #47 已合入或已寫明卡在哪
- [ ] #48 技術意見已送達；合入時附 paper「過」紀錄
- [ ] #48 的範圍 comment 已對齊 §2-4 界線
- [ ] T1 若開 PR：已確認 `GridCanvas.vue` 無 store import、`FactoryCanvas` 未被刪
- [ ] 本週合入皆在 §2 宣告範圍內；無擺放／選取接線被放行
- [ ] 待審 ≤3 維持
- [ ] 9/20 檢查點結論已書面（含 B2／B4 是否降級）
- [ ] 自己的 diff 不含 layout／toolbar 功能實作
