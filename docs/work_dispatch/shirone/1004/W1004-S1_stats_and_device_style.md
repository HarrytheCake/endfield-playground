# W1004-S1｜shirone｜右側面板樣式收完；與 goodmorning 做畫布設備樣

| meta | value |
|------|-------|
| 週次 | 2026-10-04 → 2026-10-11 |
| 等級 | **確定・兩件** |
| 擋門檻 | 否 |
| 上游 | [#53](https://github.com/dernoson/endfield-playground/pull/53) 搬家已合；上週 [W0921-S1](../0921/W0921-S1_stats_panel_split_pr.md) 的 B |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 右側對稿；畫布設備與 G 同一套｜`src/app/StatsPanel/*`；設備 `<g>` 與 G 共有｜MainLayout 槽位（harry）、GridCanvas 視窗數學（toby）、第三個 Stats 目錄｜goodmorning、paper |

---

## 0. 白話目標

搬家那刀已經在 master。會議「右側面板完工」＝把 `src/app/StatsPanel/` **做成稿上的樣子**（上週 B、無死線 → 本週收一輪可演示版本）。

第二件：跟 goodmorning **一起**做畫布上已放置設備的樣式。不是各做一個方塊。

---

## 1. 一句話驗收

**正式頁右側看得出是稿的產線總覽（不必數字接引擎）；畫布設備樣式與 G 同一 PR 或明確約定同一元件。**

---

## 2. 右側（A）

- 只改 `src/app/StatsPanel/` 現有檔  
- **保留** `ItemSummaryTable` 的 props／空狀態（D1 十一月要接 `flowStore`）  
- **不要**再開 `shirones_StatsPanel`／`test_StatsPanel` 進 master  
- 本週**不要**接 `flowStore`（引擎還在舊 `editorStore`，接了會是錯數字）

harry 會把舊 Inspector 從正式頁拿掉，右側應只剩你這塊。他改槽、你改塊內。

---

## 3. 設備樣（B）

見 [G1 §2](../../goodmorning/1004/W1004-G1_toolbar_and_device_style.md)。T1 把無邊界合入後再動 `GridCanvas` 的設備 `<g>`。出界 Error 的 class 由 toby 留口，你套稿上的 Error 設備樣（若稿還沒有，先用紅色描邊，等白紙）。

---

## 4. DoD

- [ ] 右側視覺相對上週搬家版有一輪稿向改動，可截圖
- [ ] 無新目錄、`ItemSummaryTable` 契約仍在
- [ ] 設備樣式與 G 不雙份
