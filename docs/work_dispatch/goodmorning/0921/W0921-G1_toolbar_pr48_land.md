# W0921-G1｜goodmorning｜本週必須把 #48 修完合入

| meta | value |
|------|-------|
| 週次 | 2026-09-21 → 2026-09-27 |
| 等級 | **確定・單一件事** |
| 擋門檻 | **否**（T1 已改在 master 接落子，不擋門檻演示） |
| 交期 | **9/26（五）前**推可審版；**9/27 門檻日前**合入或明寫卡點 |
| 產能參考 | 自報 ≤2h。**只給這一件**，不加派設備樣式 |
| 上游 | [WEEK_20260921](../../WEEK_20260921.md) v1.2、[PR #48](https://github.com/dernoson/endfield-playground/pull/48) |
| 版本 | **v1.2（2026-09-24）**。v1.1「擱置、本週無交付」**作廢**——主編改裁：拖太久了，本週修完 |

---

## 0. 先說一句

上週病假那週不算在你頭上。但 #48 從 9/13 開到現在，**已經兩週多沒動**——主編 9/24 改裁：**本週一定要把工具列這支收乾淨**。

限視覺解鎖維持。**仍然只給這一件事**，不會同時塞「佈局設備樣式」。

---

## 1. 一句話驗收

**#48 合入 master：工具列看起來是你的視覺，資料來源仍是真實機器（`listToolbarMachines`），Tab／列表／舊五顆按鈕的點擊與拖拉都沒壞；toby 若已接上的落子意圖（`arm`）還在。**

---

## 2. 為什麼現在又要合了

9/23 曾裁「維持現狀不合不關」，是為了不擋 T1。**T1 已經解鎖、可以直接改 master**，所以這條依賴不在了——但 #48 本身不能再無限期掛著。

合進去之前必須先修一件事，否則會**退回 B1 已交付的資料側**（#43）：

| master（要保留） | 你分支上現在（要改掉） |
|------------------|------------------------|
| `listToolbarMachines(activeTag)` | 寫死的 `equipments = [ … ]` |
| `MACHINE_TAGS`／`TOOLBAR_MACHINE_TAGS` | 寫死的 `categoryTabs` |
| toby 可能已加的 `arm(row.id)`（落子意圖） | 若 rebase 後出現，**不要刪** |

視覺（CSS、class、間距、顏色、stories）**就是主編要的**，那部分留著。

---

## 3. 你要做的事（四步）

| # | 做什麼 |
|---|--------|
| 1 | Discord 回一句「開始修 #48」——讓人知道你在線上 |
| 2 | 把 **最新 master** merge／rebase 進 `dev/goodmorning`（期間進了 #45／#47／#50／#51，而且 **toby 可能已改過同一個檔的 `<script>`**） |
| 3 | **資料來源換回真實機器**；**template／style／stories 保留你的視覺** |
| 4 | PR 回一則「已 rebase、資料來源已換回、可再審」 |

### 3.1 跟 toby 撞檔時怎麼辦

同一個 `ToolbarPanel.vue`：

| 區 | 誰的 |
|----|------|
| `<script>` 裡的落子意圖（`usePlacementIntent`／`arm`） | **toby，不要動、不要刪** |
| `<script>` 裡把 hardcode 換回 `listToolbarMachines` | **你要做的**（僅此一項 script 例外） |
| `<template>`／`<style>`／`*.stories.ts` | **你的** |

**順序建議：** 先看 master／toby 的 PR 有沒有合。有的話以那一版 `<script>` 為底，把你的 template／style 套上去，再把資料來源接回真實機器。**不要用你分支上的整份 `.vue` 覆蓋 master。**

衝突解不動 → **當天找 dernoson**，不要硬解。

---

## 4. 交哪個檔

| 動作 | 檔案 |
|------|------|
| 修改 | `src/editor/toolbar/ToolbarPanel.vue` |
| 修改／保留 | `src/editor/toolbar/ToolbarPanel.stories.ts` |
| 可改 | `.storybook/main.ts`（若你分支已有、且為掛上 stories 所需） |

---

## 5. 不要碰

| 不要 | 為什麼 |
|------|--------|
| `src/editor/layout/*` | toby 落子鏈，門檻線 |
| 刪掉 `arm`／`usePlacementIntent` 相關呼叫 | 那是 T1 |
| `src/app/StatsPanel/*`、`MainLayout.vue` | shirone／toby |
| 新開平行目錄、改檔名 | 沿用 #48 |
| 同時開「設備方塊視覺」 | 下週再說 |

---

## 6. DoD

- [ ] `dev/goodmorning` 已含最新 master（含 toby 若已合入的 script）
- [ ] 真實機器列表仍走 `listToolbarMachines`／既有 tag，**沒有**寫死的機器陣列當正式資料源
- [ ] `pnpm dev`：Tab、真機器列表、舊五顆按鈕點擊／拖拉未壞
- [ ] 若 master 已有落子意圖：點真機器後畫布側仍讀得到 armed id（或 PR 寫明「等 T1 合入後再驗」）
- [ ] stories 仍可開（`pnpm storybook`）
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 綠
- [ ] **9/26 前** PR 可再審；**9/27 前**合入或 Discord 明寫卡點

---

## 7. 卡住找誰

| 狀況 | 找誰 |
|------|------|
| rebase／衝突 | dernoson，**當天** |
| 不確定算不算「視覺」 | PR 上問一句 |
| 身體還沒好、做不完 | **立刻講**。主編會裁：是否改由他人代修資料來源後合視覺 |

> 主編週中會 ping。**這次 ping 是問進度**——因為有交期了。

---

## 8. 未交頂替

9/26 無動靜：主編或他人**代為**把 hardcode 換回真實資料、保留可用的 stories／視覺後合入或關閉。  
連續擱置不會再延長第三週。

---

## 9. 下週預告（不是本週）

#48 落地後，佈局視角設備方塊視覺才發。前提改回「工具列視覺進 master」＋「畫布上已能落子」。
