# W0914-G1｜goodmorning｜工具列收尾並合入（本週 `ToolbarPanel` 解鎖給你）

| meta | value |
|------|-------|
| 週次 | 2026-09-14 → 2026-09-20 |
| 等級 | **確定**（上週那張的收尾；本週不加第二塊） |
| 擋門檻 | 否 |
| 對應 PR | [#48](https://github.com/dernoson/endfield-playground/pull/48)（開著；等 paper 與 dernoson 審核意見） |
| **鎖狀態** | **`src/editor/toolbar/ToolbarPanel.vue` 本週解鎖給你（限視覺）**——見 §2 |
| 過審 | **paper 過審＋dernoson 技術綠**，兩個都要 |
| 交付終點 | **合入 master**（不再只到 Storybook） |
    10|| 產能參考 | ≤2h、可中斷；**不押日中死線**，週日會前有結果即可 |

---

## 0. 先對齊：這週和上週差在哪

上週的工單把你的終點畫在 Storybook，並且**禁止你碰 `ToolbarPanel.vue`**。

**這週兩件事都改了：**

1. 主編 9/14 裁定：**`ToolbarPanel.vue` 本週對你解鎖**，你可以直接改那支正式工具列的**視覺**。
2. 你的終點從「開出 PR」變成「**合入 master**」——[#48](https://github.com/dernoson/endfield-playground/pull/48) 已經在等審核，本週把它收掉。

會議紀錄記的是「等待 paper 與 dernoson 審核」。所以你這週的節奏是：**等意見 → 改 → 再請審 → 合入**，不是重新做一份。

---

## 1. 本週要做的

| # | 事 | 產出 |
|---|-----|------|
| 1 | 依 **paper** 的對稿意見改視覺 | #48 上的新 commit |
| 2 | 依 **dernoson** 的技術意見改範圍／寫法 | 同上 |
| 3 | 把對好的樣式套進正式的 `ToolbarPanel.vue` | 該檔的視覺 diff |
| 4 | 兩人都點頭後合入 | #48 merged |

意見還沒到就先在 Discord 催一句（**@白紙**、**@dernoson**），不要靜等一週。

---

## 2. 解鎖的界線（很重要，超出即退回）

**可以改的：** `ToolbarPanel.vue` 的 template 排版、Tailwind class、`<style>`、按鈕與分類 Tab 的外觀、間距、顏色、狀態樣式（預設／選中／禁用）。

**不可以改的：**

| 不要動 | 為什麼 |
|--------|--------|
| `<script setup>` 裡的邏輯：`handleEquipClick`、`handleEquipDragStart`、`activeTag` 切換、`selectedRealMachineId` | 那是 R-B1 的資料層，動了會讓落子與拖拉壞掉 |
| 真實機器分類列表的資料來源（`listToolbarMachines`、`TOOLBAR_MACHINE_TAGS`） | 上週剛修好名稱裁切，不要回退 |
| `dataTransfer` 那幾行 | 畫布 drop 靠它認機器類型 |
| 任何 store 呼叫 | 你不需要新增，也不要刪既有的 |
| `aria-label`／`role`／鍵盤可及性屬性 | 只能加，不能拿掉 |

一句話：**只改「長怎樣」，不改「怎麼運作」。** 判斷不了的就在 PR 問一句。

---

## 3. 功能回歸自檢（合入前一定要做）

```bash
pnpm dev
```

打開首頁，看下方工具列：

- [ ] 五顆舊按鈕（精煉爐／粉碎機／組裝台／輸送帶節點／電力節點）點得動、點了會進武裝態
- [ ] 可以把按鈕拖到畫布上（不會報錯）
- [ ] 真實機器分類 Tab 切得動，切換後高亮會清掉
- [ ] 真實機器名稱**沒有被裁切**（上週修好的東西不要回退）

有任何一項壞掉，那就是你改到 §2 的禁區了。

---

## 4. 交檔

```bash
git switch dev/goodmorning0907   # 或你 #48 的分支
# 改完
git push
```

**用 `git push`，不要用 GitHub 網頁 Upload。** 上週三筆網頁上傳已經退件過一次，這週再用會直接退回、不看內容。

---

## 5. DoD

- [ ] paper 回「過」（或已依其清單改完並再請審）
- [ ] dernoson 技術綠
- [ ] §3 四項功能回歸自檢全過
- [ ] `pnpm type-check`、`pnpm lint-check` 綠
- [ ] diff 只含工具列相關檔（`src/editor/toolbar/*`、`src/components/Toolbar*`、其 `*.stories.ts`）
- [ ] 未用網頁 Upload
- [ ] **#48 已合入 master**

---

## 6. 本週不做

| 項 | 什麼時候 |
|----|----------|
| **佈局視角下的設備樣式** | 會議紀錄裡的那塊**排在工具列合入之後**，本週不派。工具列收完就先停，下週（9/21）正式發 |
| 把工具列接到新畫布的落子 | L2 的接線，9/21 起 |
| 改 `src/editor/layout/*`、`src/app/layouts/MainLayout.vue` | toby 本週的檔 |

**想提前看設備樣式要對什麼稿：** 可以先去看 toby 本週接上主畫面的新畫布（`pnpm dev` 首頁），設備現在是藍色方塊——下週要換的就是它。**但這週不要動他的檔。**

---

## 7. 未交頂替

不計失敗。#48 掛著、工具列維持現況，不影響 9/27 門檻。真的要中途退出，Discord 回一句即可。
