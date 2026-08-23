# W0823-M1｜MBD｜ItemSummaryTable 空狀態（單檔 L3 mock）

| meta | value |
|------|-------|
| 週次 | 2026-08-23 → 2026-08-30 |
| 對應 roadmap | [R-D1](../../roadmap/detail/D1_stats_item_summary.md) 的 L3「空狀態」提前切片（正式接 `flowStore` 在 11 月） |
| 等級 | **加分項**（不擋 8/30） |
| 擋 8/30 門檻 | **否** |
| 性質 | 純展示／mock（**本週只做這一種**） |
| 預估時數 | 本週只給**一塊**；能交就交，交不了說一聲即可 |
| review_gate | dernoson（查 props／型別） |
| **先讀** | [GUIDE_empty_state_snippet](./GUIDE_empty_state_snippet.md)（可直接貼的片段＋檔案現況） |
| mentor | 環境／型別可問 dernoson；**本週 pair 名額已滿**（toby＋avery）→ 以 Discord 非同步為主 |
| 空窗 | 你已告知 8 月底至 9 月初有個人事務 → **9 月預設暫停**；本週若無法開工，Discord 說「暫停」即可，**不計失敗** |
| 狀態 | `[ ]` 未開始 |

---

## 0. 一句話

只改 `ItemSummaryTable.vue`：當 `rows` 是空陣列時，顯示看得懂的「目前沒有產耗資料」空狀態，而不是一張空白表——**不接 store、不改 MainLayout、不碰 Vue Flow。**

---

## 1. 四欄工單

| 欄 | 內容 |
|----|------|
| **畫面** | 打開右側統計區（`StatsPanel` 已掛 `ItemSummaryTable :rows="[]"`）→ 看到明確空狀態文案（不是只有表頭的空白表） |
| **交哪個檔** | **僅** `src/components/StatsPanel/ItemSummaryTable.vue` |
| **不要碰** | `MainLayout`、`ProductionStats.vue`（L2）、任何 `src/store/**`、`FlowChart/**`、`MBDFlow.vue`、一次改多個子面板 |
| **卡住找誰** | dernoson（型別／合入）。**週中會有人問一句進度**（是流程，不是質疑） |

---

## 2. 為何是你、範圍怎麼切

| 依據 | 結論 |
|------|------|
| 本週可做 | 單一 L3＋mock；StatsPanel 子層是你 7 月交過、最熟的區 |
| 本週不做 | store、MainLayout、Vue Flow 主畫布、FlowChart 整包 |
| 要避開的失敗模式 | 一次接進 layout 容易漏 props → **開工前必須報檔名**；本週禁止碰 layout |
| 範圍收斂 | 你近期有空窗 → 只維護現況一小塊，不開新戰場 |
| D1 | 11 月要空狀態；本週先把 L3 殼做好，之後 L2 接真資料較省事 |

**本週不做：** 接 `flowStore`、算產耗、電力／倉庫／調度券當主演示、AlertList（可留 11 月）。

---

## 3. 名詞與契約

| 詞 | 意思 | 你要做的 |
|----|------|----------|
| **L3** | 只吃 props、只顯示 | 空狀態也只根據 `rows.length === 0` 判斷 |
| **mock** | 先用假／空資料看畫面 | `Index.vue` 已經傳 `:rows="[]"`，剛好測空狀態 |
| **空狀態** | 沒資料時給使用者一句話／一塊提示 | 不要只顯示空 `<tbody>` |
| **禁止算數** | L3 不做 produced−consumed 之外的新計算 | `net` 若已由 props 帶來就顯示；空狀態時不算 |

### Mock props（本週驗收用）

| prop | 型別 | 空狀態時 |
|------|------|----------|
| `rows` | `ItemSummaryRow[]` | `[]` |

`ItemSummaryRow` 維持檔內既有欄位（`itemId`、`name`、`iconUrl`、`produced`、`consumed`、`net`、`efficiency`）——**不要為了空狀態改壞有資料時的表格。**

建議文案（可改）：「目前沒有產耗資料——放置設備並連線後會顯示在這裡。」

**設計稿錨定：** paper 本週的 W0823-P1 正在標「右側資訊／警訊」的 frame。若他先交，照那個 frame 的層級與留白做；**若本週沒稿，就用上面的純文字版本**——不要為了等稿而停工，也不要自己發明一套視覺規範。

---

## 4. 開工前檢查（必做）

- [ ] Discord **先回報**：「W0823-M1 我要改 `ItemSummaryTable.vue`」  
  （本週多人同時動 UI，先報檔名可避免撞檔）
- [ ] 本機確認能開 `pnpm dev`（若不確定，先問 dernoson，**不要**為了跑起來去改 MainLayout）
- [ ] 打開現況：`ItemSummaryTable.vue`、`StatsPanel/Index.vue`（Index **只讀**，看它已傳 `:rows="[]"`）
- [ ] 若本週因個人事務無法做：回「本週暫停」→ 結案，不算失敗

---

## 5. 步驟

1. 在 `ItemSummaryTable.vue` 的 template：`rows.length === 0` 時顯示空狀態區塊；否則維持現有表格（片段見 GUIDE §2）  
   1.1 同檔順手刪掉檔尾 `</template>` 後那顆多餘的 `S`（既有殘留，`format-check` 會挑）  
2. **不要** `import` store／`useFlowEngine`  
3. 若用到 `@/utils/flowHelpers` 的效率色，有資料列時可保留；空狀態不需要  
4. 自測：`pnpm dev` → 看右側統計 → 空狀態看得見  
5. （可選）本地暫時把 Index 的 `:rows` 改成一筆假資料確認表格沒壞——**不要把假資料 commit 進 Index**；測完還原，或只在自己分支玩完再還原後只交 ItemSummaryTable

### 交件

- PR 或推分支請 dernoson 合入  
- 訊息寫清：改哪個檔、空狀態長什麼樣（可附截圖）  
- commit 請寫完整一句（避免只寫 `123`／`fix`）

---

## 6. DoD

- [ ] 開工前 Discord 已報檔名  
- [ ] 僅改 `ItemSummaryTable.vue`  
- [ ] `rows=[]` 時有明確空狀態；有 rows 時表格仍可用  
- [ ] 無 store／MainLayout／FlowChart 變更  
- [ ] 截圖或文字說明可 30 秒驗收  

---

## 7. 未交頂替

不擋 8/30。未交或暫停 → 右側維持現況（空白表）；D1 正式空狀態延到 11 月由當週工單重派。

---

## 8. 回報

| 時機 | 動作 |
|------|------|
| 開工前 | 報檔名（必做） |
| 週中 | 會被問一句；回「做了／卡住／暫停」之一 |
| 無法繼續 | 主動說「暫停」即可 |

---

## 9. 開發日誌（派工側）

### 2026-08-23

- 依 D1 的 L3 空狀態切片正式派工：單檔、禁 layout／store、開工前報檔名
- 單檔：`ItemSummaryTable` 空狀態；對齊 D1 提前 L3 殼
- 不擋 8/30；pair 名額不占（非同步）
