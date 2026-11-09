# W1102-T1｜toby｜右側產線總覽接上實際數據

| meta | value |
|------|-------|
| 週次 | 2026-11-02 → 2026-11-08 |
| 等級 | **確定**（11/01 會議；自報 **3–5h**） |
| 擋門檻 | 否（11/29 整項才是門檻） |
| 上游 | [WEEK_20261102](../../WEEK_20261102.md) v1.1、[D1](../../../roadmap/detail/D1_stats_item_summary.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 右側產耗表｜`ProductionStats.vue`、`StatsPanel/Index.vue`、`ItemSummaryTable.vue`｜`GridCanvas`／`DeviceShape`／左欄長相／store 簽名｜aaaaa（`itemSummary` 形狀）、dernoson（合入） |

---

## 0. 白話目標

會議要你把右邊產線總覽的實際數據接完。

沒有設備時顯示一句話，不要空白，也不要一排 0。接上連線之後，改畫布，數字會變。

從 `origin/master` 做。`dev/cake_prodstats` 是別人的未合分支，不要拿來當底。

---

## 1. 一步一步

1. `ProductionStats.vue` 讀 `flowStore` 的 `itemSummary`，攤成 rows 傳下去。
2. `ItemSummaryTable.vue` 只吃 props。沒有設備時顯示「尚未擺放設備」。
3. 有源、有連線時，改連線，表格數字會變。
4. **開 PR。**

四種空狀態裡，本週只做「沒有設備」。另外三種是 11/08。

---

## 2. 不要做

- 重寫 `flowStore`／`useFlowEngine`
- 在表格元件裡算流量，或 import store
- 改 `GridCanvas`／`LayoutView`／`connectionWaypoints`
- 改 `DeviceShape`、左欄下拉、`setDevicePrimaryOutput`
- 旋轉、Delete
- 折線核對（v1.0 草稿已撤回）

---

## 3. DoD

- [ ] 空產線有一句「尚未擺放設備」
- [ ] 一條有連線的產線，右側數字會隨畫布變
- [ ] `ItemSummaryTable.vue` 不 import store
- [ ] gh 上看得到 PR

未交：維持 [#37](https://github.com/dernoson/endfield-playground/pull/37) 的「目前沒有產耗資料」。
