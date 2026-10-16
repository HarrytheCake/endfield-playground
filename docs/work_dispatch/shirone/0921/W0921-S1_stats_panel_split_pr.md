# W0921-S1｜shirone｜StatsPanel 兩支 PR：先把「搬家」合進去，再把樣式做完

| meta | value |
|------|-------|
| 週次 | 2026-09-21 → 2026-09-27 |
| 等級 | **確定・兩件，有先後** |
| 擋門檻 | 否（搬家那支擋 [D1](../../../roadmap/detail/D1_stats_item_summary.md) 十一月的切片） |
| 產能參考 | 自報下週 ≤2h。**§0.1 說明為什麼本單超出 2h，以及超出的部分怎麼處理** |
| 上游 | [WEEK_20260921](../../WEEK_20260921.md)、上週工單 [W0914-S1](../../shirone/0914/W0914-S1_stats_panel_land.md) |
| 版本 | v1.1（2026-09-23 依主編裁決擴大範圍；原 §4「主編會裁留哪一套」刪除） |

---

## 0. 先講結論：上週的工單，那一刀你做對了

W0914-S1 要的是「把產線總覽 `StatsPanel` 搬到 `src/app/StatsPanel/`」。你分支上的第一筆 commit（`8a24858 refactor(StatsPanel): 產線總覽面板遷移至 src/app`）**就是那一刀，而且是乾淨的 10 檔 rename、0 行變更**。

它沒進 master 的原因不是做得不對，是**整支分支沒開 PR**，而且那一刀後面還跟著 19 筆——兩套依 Figma 重寫的面板（`shirones_StatsPanel`、`test_StatsPanel`，合計約 2,800 行），`MainLayout.vue` 的 import 指向其中一套，分支基底早於 #50，那一行現在必定衝突。

主編看到的是一支「什麼都有、又沒開 PR」的分支。**本週不是叫你重做，是叫你把那一刀單獨拿出來先合掉。**

### 0.1 本週範圍比上週大，先說清楚

主編 2026-09-23 裁示：**StatsPanel 的樣式設計工作原本在 MBD 那邊，現在整個轉給你**，右側面板從此只有一個 owner ＝ 你（元件、路徑、樣式全包）。

所以本週有兩件：

| # | 件 | 大小 | 時機 |
|---|----|------|------|
| **A** | 搬家 PR（10 檔 rename ＋ 一行 import） | **≤2h，實際約 20 分鐘** | **本週一定要進 master** |
| **B** | 樣式 PR（把 Figma 的視覺落到搬完家的那套上） | 明顯超過 2h | **不下死線，做到哪算哪** |

**A 是本週的硬要求，B 不是。** 你自報 ≤2h，那 2h 全部花在 A 上就夠了；B 有多少時間做多少，跨週沒關係，主編不會催。**兩件請分成兩支 PR，不要合在一起送**——A 只有十個 rename，一眼就能過；混進樣式就變成幾百行，又會回到上週「沒辦法只合他要的那部分」的狀況。

---

## 1. 一句話驗收

**A：一支 PR，只含 `src/components/StatsPanel/` → `src/app/StatsPanel/` 的純 rename ＋ `MainLayout.vue` 的 import 一行，`git diff --stat` 看不到任何新增元件。**

（B 沒有驗收句，因為不下死線。）

---

## 2. A：搬家（三步）

| 步 | 做什麼 |
|----|--------|
| 1 | 從**最新的 master** 開一支新分支 `dev/shirone0921` |
| 2 | 把 `8a24858` 那一筆 cherry-pick 過來（或直接重做一次 `git mv`，10 個檔，兩分鐘） |
| 3 | 改 `src/app/layouts/MainLayout.vue` 裡 StatsPanel 的 import 路徑，**只改那一行**，開 PR |

**不要 rebase `dev/shirone0918`。** 那支分支留著別動——§4 會講它接下來的用途。從 master 重開一支乾淨的比較快，也比較不會出事。

### 交哪個檔

| 動作 | 檔案 |
|------|------|
| 搬移 | `src/components/StatsPanel/*` → `src/app/StatsPanel/*`（含 4 個 `.stories.ts`） |
| 修改 | `src/app/layouts/MainLayout.vue` —— **只有 StatsPanel 的 import 那一行** |

### `MainLayout.vue` 的例外授權

該檔的 owner 是 toby。本週**破例只對你開放 import 路徑那一個字串**，其餘一個字都不能動——包括空行、格式、順序。

這是上週踩鎖的直接後果：你那份 diff 現在必定與 #50 衝突。給例外是因為「改路徑的人順手改 import」比「兩個人接力改同一行」更不容易出錯，不是鎖失效了。

---

## 3. B：樣式（A 合入之後才開工）

**標的：讓 `src/app/StatsPanel/` 這一套長成 Figma 的樣子。** 不是再開新目錄，是改現有的那五個面板檔。

### 為什麼不直接用 `shirones_StatsPanel`

那套是整個重寫的，缺了兩塊已經合入 master 的東西：

| 缺的 | 為什麼不能缺 |
|------|--------------|
| `ItemSummaryTable.vue` 的資料結構 | [D1](../../../roadmap/detail/D1_stats_item_summary.md) 十一月要把 `flowStore.itemSummary` 接進這個元件，契約已經定了 |
| MBD 的四種空狀態（PR #37 已合入） | 沒資料時畫面該長什麼樣，那份已經過審、也已經在 master 上 |

所以做法是**把新稿的視覺搬到舊結構上**，不是拿新目錄取代舊目錄。`shirones_StatsPanel` 和 `test_StatsPanel` 在 `dev/shirone0918` 上是你的**參考素材**——樣式從那裡抄過來，結構維持 `src/app/StatsPanel/` 的。

### 接手 MBD 的部分

MBD 於 9/20 在 `dev/MBD` 上改了同一批檔的樣式（Index、ItemSummaryTable、PowerSummary、TicketEstimate、WarehouseEstimate，commit 訊息「嚴肅模仿 figma」）。**那支分支不合入**，但內容你可以看、可以用：

```
git fetch origin && git diff origin/master...origin/dev/MBD -- src/components/StatsPanel/
```

**看過再動手。** 兩個人對同一張稿的判讀不會完全一樣，哪邊的做法好就用哪邊的，不用從零開始。

### B 的邊界

| 可以 | 不可以 |
|------|--------|
| 改 `src/app/StatsPanel/` 五個面板檔的 template／style | 新增第三個面板目錄 |
| 更新對應的 `.stories.ts` | 刪掉 `ItemSummaryTable.vue` 或它的 props |
| 抽共用的 CSS 變數／字型 | import 任何 store 或 `src/data`（§7 的硬約束，上週你守住了） |
| 分成多支小 PR 交 | 一次交 2,800 行 |

**字型：** 三份重複的 `HarmonyOS_Sans_TC` 該收成一份（`src/app/MachineCard/fonts/` 已有）。是既有 blob 重用、SHA 相同，**倉庫不會膨脹**，所以不急，順手做即可。

---

## 4. `dev/shirone0918` 的處置

**留著別刪，本週不合入。** 上週把那兩個目錄當成「交付了三套面板、要挑一套」是判讀錯了——主編 9/23 已駁回這個說法：**沒開 PR 的分支內容不算交付物，master 上從頭到尾只有一套 StatsPanel。**

所以沒有「留哪一套」這題。那支分支現在的定位是**素材**，用途寫在 §3。等 B 做完、`src/app/StatsPanel/` 是你要的樣子之後，它就可以刪了。

---

## 5. 不要碰

| 不要 | 為什麼 |
|------|--------|
| `src/app/layouts/MainLayout.vue` 的其他任何一行 | toby 的鎖；本週他在改別的區塊 |
| `src/editor/layout/*`、`src/editor/toolbar/*` | toby 的落子鏈，**9/27 門檻線上** |
| `src/utils/layout/*`、`src/store/*` | aaaaa 的預檢重構 |
| `src/editor/inspector/*`、`InspectorSidebar` | B4 的入口，凍結保留 |
| A 那支 PR 裡夾帶任何新元件、新字型、新 story | **夾帶就退回重拆**，那正是上週卡住的原因 |
| detector、store、9 月門檻必要項 | 不在你本週範圍 |

---

## 6. 一句要寫在前面的話（規則 21）

上週的兩套新面板不是白做，也不是錯——**是工單沒要、而你沒先說**。這是第三次同型：W0823 是幾何路線、W0831 是路徑與檔數，兩次事後都被追認；這次多出來的是工單沒有要的另外兩件事，其中一件動到別人正在合入的檔。

**所以本週的邊界寫成清單而不是一句話。若你認為還該做 X，先在 Discord 講一句再做**——不必等回覆超過半天，講了就算數。這對你是必要條件不是選配。

順帶一提：這週範圍變大了，但**變大的部分是 B，而 B 不下死線**。不要因為多了一件就把 A 拖到週末——A 是別人在等的那一件。

---

## 7. DoD

**A（本週必交）：**

- [ ] 分支 `dev/shirone0921` 自**最新 master** 開出
- [ ] `git diff --stat origin/master...` 只有 10 個 rename（`R100`）＋`MainLayout.vue` 一行
- [ ] `src/app/StatsPanel/` 在 PR 分支上存在，`src/components/StatsPanel/` 不存在
- [ ] `pnpm dev` 首頁右側總覽區塊仍在、不報錯
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 綠
- [ ] `dev/shirone0918` 未被刪除、未被 rebase

**B（無死線，交多少算多少）：**

- [ ] 改的是 `src/app/StatsPanel/`，沒有第三個目錄
- [ ] `ItemSummaryTable.vue` 的 props 與 PR #37 的空狀態都還在
- [ ] 全域搜尋仍零 `store`／`src/data` import
- [ ] 每支 PR 都附一張改前改後的截圖

---

## 8. 卡住找誰

| 狀況 | 找誰 |
|------|------|
| cherry-pick 或 `git mv` 出事 | dernoson，當天講 |
| `MainLayout.vue` 改完 `pnpm dev` 壞了 | **不要自己擴大修**，貼錯誤訊息找 toby |
| 樣式要對哪張稿、稿與現況對不上 | paper |
| MBD 那份 diff 看不懂／想問他當初為什麼那樣改 | Discord 直接問 MBD，他這週暫停但看得到訊息 |
| 覺得應該順手做 X | **先講再做**（§6） |

---

## 9. 未交頂替

**A 沒交：** 右側維持舊路徑 `src/components/StatsPanel/`，畫面不受影響，但 [D1](../../../roadmap/detail/D1_stats_item_summary.md) 十一月的切片沒有落腳點——這支 PR 只有十個 rename，卻是那條線的解鎖鍵。

**B 沒交：** 面板維持現在的樣式，不影響任何門檻。跨週繼續即可。

---

## 10. 下期預告（不是本週工項）

你週報提到同類工作打算半自動交給 workflow，預估下次可壓在 20 分鐘到 1 小時。**這件事本身很好，值得試**——A 那支正好是適合拿來試的大小。唯一要注意的是：單位成本降一個量級時，review 量會同比上升，所以第一次用它交的東西範圍請比平常更小，讓人看得完。
