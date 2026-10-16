# 教學｜MBD｜第一次打開 Storybook（可選，W0921-M0）

| meta | value |
|------|-------|
| 對應工單 | [W0921-M0](./W0921-M0_pause.md) |
| 性質 | **學習單步**，不是功能交付 |
| Deadline | **無** |
| 要不要開 PR | **不要** |

---

## 0. 這是什麼

Storybook ＝ 一個專門用來**單獨看某個畫面元件**的小網站，不用開整個遊戲主畫面。

之後你做 L3（按鈕、卡片、空狀態）時，別人會用它檢查「元件長得對不對」。你現在只要會**打開、點開一個現成的故事**就夠了。

---

## 1. 三步

在專案根目錄（有 `package.json` 的那層）：

```bash
pnpm install
pnpm storybook
```

瀏覽器應自動打開（常見是 `http://localhost:6006`）。

左側會有一排元件名稱。點開任一項，例如：

- `MachineCard`（設備卡片）
- 或 `StatsPanel`／`ItemSummaryTable`（右側產線總覽相關）

右邊會出現該元件的樣子。上面若有 Controls／不同 story 名稱，可以點著玩。

---

## 2. 做完怎麼算「看過了」

Discord 回一兩句即可，例如：

> Storybook 開起來了，有看到 MachineCard 的 xxx 狀態。

**不用截圖、不用寫報告、不用開 PR。**

---

## 3. 開不起來時

| 狀況 | 怎麼辦 |
|------|--------|
| `pnpm` 不認識 | 跟 dernoson 說，先確認 Node／pnpm 有沒有裝 |
| 跑起來全紅 | 把終端機最後 20 行貼 Discord，**不要自己改一堆設定檔** |
| 頁面是空的 | 等編譯跑完；或問 dernoson「Storybook 入口是哪個」 |

---

## 4. 明確不要做的事

- 不要為了「練習」去改 `ToolbarPanel.vue`、`MainLayout.vue`、StatsPanel
- 不要新開一個自己的 `docs/MBD/...` 平行站來代替 Storybook
- 不要刪別人的 `.stories.ts`

看完就停。下一步功能工單會另發。
