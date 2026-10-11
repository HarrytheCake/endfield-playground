# W1004-M1｜MBD｜頂欄四顆按鈕（存檔／設定／下載／上傳）進 Storybook

| meta | value |
|------|-------|
| 週次 | 2026-10-04 → 2026-10-11 |
| 等級 | **確定（恢復功能派工）** |
| 擋門檻 | 否（D4 頂欄 UI 的提前量） |
| 上游 | 10/04 會議原句、白紙稿、上週 [W0921-M0](../0921/W0921-M0_pause.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | Storybook 裡四顆按鈕對得上白紙稿｜**新目錄** `src/components/TopBarButton/`（`Index.vue`＋`Index.stories.ts`）｜`MainLayout`／`StatsPanel`／`GridCanvas`／`ToolbarPanel` 一律不碰｜paper（稿）、dernoson（PR） |

---

## 0. 為什麼這週恢復派你功能

前兩週不派的理由是**共檔**：右側 owner 是 shirone、工具列是 goodmorning、`MainLayout` 本週整檔是 harry。

這張不一樣——**全新目錄、沒有別人在裡面**，而且你 10/05 週報自報 3–5h。會議也點名給你。所以本週是正式工單，不是暫停單。

**條件只有一個：做在新目錄裡，不要順路去改 `StatsPanel`。** `dev/MBD` 上的 StatsPanel 樣式 diff **不要帶進這次的 PR**（那部分 owner 是 shirone）。

---

## 1. 做什麼

白紙稿頂欄那排按鈕裡的四顆：**存檔、設定、下載（匯出）、上傳（匯入）**。

**交一個按鈕元件＋四個 story，不是四個元件。** 四顆只差 icon 與 label，複製四份日後改樣式要改四個地方。

```text
src/components/TopBarButton/
├── Index.vue          ← 一顆方形 icon 按鈕，外觀由 props 決定
└── Index.stories.ts   ← 四個 story：存檔／設定／下載／上傳
```

建議 props（可依稿微調，但**不要吃 store**）：

| prop | 用途 |
|------|------|
| `icon` | Lucide icon 名（如 `i-lucide-settings`） |
| `ariaLabel` | 無障礙名稱（四顆都是純 icon，沒這個讀不出來） |
| `disabled` | 稿上「尚未實作」的灰階態 |
| `active` | 若稿有按下／選中態 |

點擊一律 `emit('click')` 往上丟，**元件自己不做事**。

---

## 2. 樣式從哪裡抄

paper 的設計參考頁已經把這排按鈕做出來了：`src/app/dev/PaperFigMainField.vue`（約 130–175 行）＋ `src/app/dev/paperfigv2.css`。

稿上的數值大致是：方形 `size-13.75`、`rounded-lg`、底色 `#4E4E4E`、icon `size-6.25` 白色、停用態 `opacity-40`。

**那是 dev 參考頁，不是你要改的檔。** 把 class 抄進你自己的元件即可，**不要去改 `PaperFigMainField.vue`**。

既有可參考的 L3 範例：`src/components/ShortcutRow/`（目前唯一用 Nuxt UI `UButton` 的 L3 元件，含 stories 寫法）。

---

## 3. 本週明確不做

- **不要接進 `MainLayout.vue`。** 本週那支整檔是 harry 的，他在拆舊底欄與舊右側。你的按鈕**下週（10/11）才由他掛上**。
- **不要接 store／任何真實功能。** 存檔／下載／上傳的行為屬 R-D4（藍圖 JSON，11 月）；設定已有 `keybindingStore.openSettingsPanel()`，但**接線不是你這張**。L3 規則：不 import Pinia。
- 不要碰 `StatsPanel`／`GridCanvas`／`ToolbarPanel`（見 [WEEK §2.2](../../WEEK_20261004.md) 鎖表）。
- 不要用檔名當版本、不要開 `src/components/TopBarButton2/` 這種平行目錄。

---

## 4. 一句話驗收

**`pnpm storybook` → `L3/TopBarButton`：四個 story 都看得到，外觀對得上白紙稿頂欄那排，元件裡沒有 `useXxxStore`。**

---

## 5. 卡住怎麼辦

- Storybook 跑不起來：先看 [上週的上手指引](../0921/GUIDE_storybook_first_look.md)，再問 dernoson。
- 稿上尺寸／顏色看不清：問 paper，不要自己猜一套新配色。
- 做不完四顆：**先交「設定」＋「下載」兩個 story**，PR 標題寫清楚只交兩顆。半成品四顆比完成兩顆難審。

---

## 6. DoD

- [ ] `src/components/TopBarButton/Index.vue`＋`Index.stories.ts` 在 PR 裡
- [ ] Storybook 可見至少兩個 story（目標四個）
- [ ] 元件無 `import { use…Store }`、無 `pinia`
- [ ] PR 不含 `StatsPanel`／`MainLayout`／`GridCanvas`／`ToolbarPanel` 的改動
- [ ] `pnpm type-check`／`lint-check`／`format-check` 通過
