# W1102-H1｜harry｜右側產耗接 itemSummary

| meta | value |
|------|-------|
| 週次 | 2026-11-02 → 2026-11-08 |
| 等級 | **確定**（本週 roadmap 切片；自報 **3–5h**） |
| 擋門檻 | 否（11/29 整項才是門檻） |
| 上游 | [WEEK_20261102](../../WEEK_20261102.md)、[D1](../../../roadmap/detail/D1_stats_item_summary.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 右側產耗表｜`ProductionStats.vue`、`StatsPanel/Index.vue`、`ItemSummaryTable.vue`｜`GridCanvas`／`LayoutView`／`DeviceShape`／store 簽名｜aaaaa（`itemSummary` 形狀）、dernoson（合入） |

---

## 0. 白話目標

右側要出現這條產線的產耗。沒有設備時顯示一句話，不要空白，也不要一排 0。接上連線之後，改畫布，數字會變。

你 10/31 的 `dev/cake_prodstats` 可以當起點。那支分支**還沒開 PR，不算已交**。

---

## 1. 一步一步

1. 從 `origin/master` 開分支。若沿用 `dev/cake_prodstats`，只帶右側產耗的提交。
2. `ProductionStats.vue` 讀 `flowStore` 的 `itemSummary`，攤成 rows 傳下去。
3. `ItemSummaryTable.vue` 只吃 props。沒有設備時顯示「尚未擺放設備」。
4. 有源、有連線時，改連線，表格數字會變。
5. **開 PR。** 沒有 PR 不算交。

四種空狀態裡，本週只做「沒有設備」。另外三種是 11/08，不要一起做。

---

## 2. 不要做

- 把 `dev/cake_toolbar`、`dev/cake_machinecard` 併進這張 PR
- 重寫 `flowStore`／`useFlowEngine`
- 在 `ItemSummaryTable` 裡算流量，或 import store
- 改 `layoutStore`／`editorStore` 簽名
- 改 `GridCanvas`／`LayoutView`／`MainLayout`／`DeviceShape`
- 調度券總效率、倉庫預估、電力當驗收

---

## 3. DoD

- [ ] 空產線有一句「尚未擺放設備」，不是空白，也不是一排零
- [ ] 一條有連線的產線，右側數字會隨畫布變
- [ ] `ItemSummaryTable.vue` 不 import store
- [ ] gh 上看得到 PR

未交：維持 [#37](https://github.com/dernoson/endfield-playground/pull/37) 的「目前沒有產耗資料」。數字延後，不改派別人加時。
