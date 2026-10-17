# 0018_20261006_global-harmonyos-font

- **prev:** —
- **skill:** plan-history v3
- **status:** done

## 主題簡述

`HarmonyOS Sans TC` 字型的 `@font-face` 目前寫在個別元件中，字型檔也跟著元件放。commit `27f754f` 把 `test_StatsPanel` 的引用改成 `/fonts/...`，但字型檔沒有放進 `public/fonts/`，因此路徑解析不到任何檔案。使用者裁定字型設定應為全域，並選擇「方案 B」：字型檔放在 `src/assets/fonts/`，由 Vite 處理（加 hash、build 時檢查檔案是否存在）。

**本計畫的約束**

- 只搬字型檔與 `@font-face` 宣告，不改任何元件的 `font-family` 使用方式，也不設定全域預設字型（`--font-sans`）。
- 除了修好會擋住 build 驗證的 `MainLayout.vue:8` import 之外（見 `0018#2`），不碰其他既有錯誤。

## 規劃描述

1. 把 `src/app/test_StatsPanel/fonts/*.ttf` 以 `git mv` 移到 `src/assets/fonts/`。
2. 刪除 `src/app/MachineCard/fonts/`，這份與上一步的檔案位元組完全相同（→ O1）。
3. 把四個 `@font-face` 宣告寫進 `src/style.css`，路徑使用相對路徑 `./assets/fonts/...`。
4. 移除 `src/app/test_StatsPanel/Index.vue` 與 `src/app/MachineCard/Index.vue` 中的 `@font-face` 區塊。
5. `vite.config.ts` 預設就會處理 CSS 中的相對 `url()`，因此不需要修改（→ O2）。

## 觀察與推論

### O1 · 2026-10-06 05:34:43+08:00 — 字型有兩份相同副本

`md5sum` 的結果顯示，`src/app/MachineCard/fonts/` 與 `src/app/test_StatsPanel/fonts/` 中的四個 `.ttf` 雜湊值兩兩相同。`src/app/MachineCard/Index.vue:62-92` 自己也寫了一份 `@font-face`，使用 `./fonts/...`。

推論：改為全域之後，這兩份副本可以合併為一份，而且合併後畫面不會有任何變化。

### O2 · 2026-10-06 05:34:43+08:00 — Vite 設定無須調整

`vite.config.ts` 沒有設定 `base`、`publicDir` 或 `assetsInclude`，`.ttf` 屬於 Vite 預設就會處理的資源類型。`src/style.css` 由 `src/main.ts:2` 載入，Vite 會把其中的相對 `url()` 解析成 hash 過的資源路徑。

### O3 · 2026-10-06 05:34:43+08:00 — test_StatsPanel 子元件的字族名稱寫錯

`AttentionPanel.vue`、`HeaderLabel.vue`、`ResultPanel.vue` 使用的是 `[font-family:'HarmonyOS_Sans_TC',sans-serif]`（中間是底線），與 `@font-face` 宣告的 `'HarmonyOS Sans TC'`（中間是空白）名稱不一致。

推論：無論字型檔放在哪裡，這些元件目前都套用不到 HarmonyOS 字型，只會退回 `sans-serif`。這個問題早在本次變更之前就存在，不在本計畫範圍內。

### O4 · 2026-10-06 05:38:23+08:00 — 落地後的驗證結果

驗證時的檔案狀態：四個 `.ttf` 已移到 `src/assets/fonts/`，`src/app/MachineCard/fonts/` 已刪除，`src/style.css` 中有四個 `@font-face`，兩個元件中的 `@font-face` 已移除。

- dev server 取得 `/src/style.css?direct` 後，四個 `url()` 解析為 `/src/assets/fonts/HarmonyOS_Sans_TC_*.ttf`，逐一 fetch 都回傳 200 `font/ttf`，大小與原檔相同。
- `pnpm test`：43 個測試檔、827 個案例全數通過。
- `pnpm type-check` 有三個錯誤：`MainLayout.vue:8` 找不到 `shirones_StatsPanel`、`Index.stories.ts:3` 宣告了未使用的 `PowerData`、`test_StatsPanel/Index.vue:46` 宣告了未使用的 `e`。以 `git stash` 回到 HEAD 重跑，三個錯誤完全相同。
- `vite build` 與 dev server 首頁同樣因為 `MainLayout.vue:8` 而失敗。

推論：三個 type-check 錯誤在本次變更之前就存在。字型路徑在 dev 環境可以正確解析；build 階段的 hash 輸出要等 `MainLayout.vue:8` 修好之後才能確認。

### O5 · 2026-10-06 05:46:16+08:00 — Tailwind 會把字族名稱中的底線轉成空白

- **更正:** O3

以 `@tailwindcss/node@4.2.4` 的 `compile()` 編譯 `[font-family:'HarmonyOS_Sans_TC',sans-serif]`，輸出為 `font-family: 'HarmonyOS Sans TC',sans-serif;`。

推論：Tailwind 的 arbitrary value 會把底線轉成空白，所以那三個子元件的字族名稱其實沒有寫錯，不需要修改。

### O6 · 2026-10-06 05:47:18+08:00 — 修好 MainLayout 後的完整驗證

驗證時的檔案狀態：`MainLayout.vue:8` 已改為 import `@/app/test_StatsPanel/Index.vue`。改之前 `MainLayout.vue:44` 以 `<StatsPanel />` 使用，沒有傳任何 props；新舊兩個元件的 props 也全部是選填。

- `vite build` 成功，輸出 `HarmonyOS_Sans_TC_{Light,Regular,Medium,Bold}-<hash>.ttf` 四個檔案。
- `pnpm test`：43 個測試檔、827 個案例全數通過。
- `pnpm type-check` 剩兩個既有錯誤：`Index.stories.ts:3` 的 `PowerData`、`test_StatsPanel/Index.vue:46` 的 `e`。
- dev server 首頁正常渲染。「產線總覽」的計算後 `font-family` 為 `"HarmonyOS Sans TC", sans-serif`，`document.fonts` 中 300 與 400 兩個字重為 `loaded`，對應的 `.ttf` 請求都回傳 200；重新載入後沒有任何 4xx/5xx 資源。

### O7 · 2026-10-06 05:50:04+08:00 — 修正後 type-check 歸零

- **更新:** O6

拿掉 `Index.stories.ts:3` 的 `PowerData` import，並移除 `test_StatsPanel/Index.vue:46` 中 `startDrag` 未使用的參數 `e`。之後 `pnpm type-check` 為 0 個錯誤，`pnpm lint` 沒有錯誤也沒有警告，`pnpm test` 的 827 個案例全數通過。

### O8 · 2026-10-06 05:51:19+08:00 — 全專案字型設定掃描

以 grep 搜尋 `src/`、`index.html`、`.storybook/` 中的 `font-family`、`@font-face`、字型檔副檔名與 Tailwind 字型 class，並在 dev 首頁實測：

- `HarmonyOS Sans TC` 的使用處有 `MachineCard/Index.vue:63`、`components/FormulaItem/Index.vue:26` 與 `test_StatsPanel` 的三個子元件。用到的字重只有 300、400、500、700，全部有對應的 `@font-face`。首頁上有 26 個文字元素實際使用這個字族，300 與 400 兩個字重為 `loaded`。
- `.storybook/preview.ts:6` 有 import `src/style.css`，所以 Storybook 也能取得全域字型。
- `src/app/dev/paperfigv2.css` 沒有被任何程式碼 import（只出現在 `PaperFigMainField.vue` 的註解中），不會影響任何頁面。
- `font-mono`、`font-sans` 是 Tailwind 預設字族，使用的都是系統字型，不需要額外載入。
- `src/style.css:41` 的 `:root { font-family: Inter, 'Segoe UI', system-ui, sans-serif; }`：整個專案沒有任何地方載入 Inter（沒有 `@font-face`，`index.html` 也沒有 link）。用 canvas 量測，`Inter, monospace` 的字寬與純 `monospace` 相同（都是 334.28），表示這台機器上沒有 Inter，瀏覽器退回 `Segoe UI`。首頁有 73 個文字元素使用這組設定。

推論：HarmonyOS 字型在所有使用處都能正確套用。唯一沒有正確套用的是全域預設的 `Inter`：它從來沒有被載入，所以實際顯示的字型取決於使用者電腦上裝了什麼。這個問題早在本計畫之前就存在。

## 待辦

### 1 字型檔移至 src/assets/fonts 並在 style.css 全域宣告

- **state:** 完成
- **needs:** 0018#2
- **basis:** → O1、O2、O6

達成狀態：四個 `.ttf` 只在 `src/assets/fonts/` 保留一份；`src/style.css` 有四個 `@font-face` 宣告，路徑為 `./assets/fonts/...`；所有元件中都不再有 `@font-face`；`vite.config.ts` 不變。驗證方式：`pnpm build` 成功，且輸出中出現 hash 過的 `.ttf` 檔。

**沿革**

- H1 · 2026-10-06 決斷 —— 採方案 B，字型檔放在 `src/assets/fonts/`，設定為全域（使用者）
- H2 · 2026-10-06 落地 —— 字型檔移到 `src/assets/fonts/`、`@font-face` 集中到 `src/style.css`，dev 環境已確認路徑可解析 → O4
- H3 · 2026-10-06 落地 —— build 輸出 hash 過的字型檔，頁面上字型已實際套用 → O6

### 2 MainLayout 的 StatsPanel import 改指向 test_StatsPanel

- **state:** 完成
- **basis:** → O6

`src/app/layouts/MainLayout.vue:8` 原本 import 的是已被 `27f754f` 刪除的 `shirones_StatsPanel`，導致 type-check、build 與 dev 首頁全部失敗。改為 `@/app/test_StatsPanel/Index.vue`。使用端沒有傳任何 props，所以不需要其他調整。

**沿革**

- H1 · 2026-10-06 決斷 —— 改 import 指向 `test_StatsPanel`（使用者）
- H2 · 2026-10-06 落地 —— build 與首頁恢復正常 → O6

### 3 test_StatsPanel 子元件字族名稱的底線寫法

- **state:** 否決
- **basis:** → O5

原本以為 `'HarmonyOS_Sans_TC'` 與 `@font-face` 宣告的名稱不一致，經查證後確認 Tailwind 會把底線轉成空白，名稱實際上是一致的，因此不做修改。

**沿革**

- H1 · 2026-10-06 決斷 —— 使用者要求修正
- H2 · 2026-10-06 否決 —— 前提不成立，Tailwind 會把底線轉成空白 → O5

### 4 清除 test_StatsPanel 兩個既有的 type-check 錯誤

- **state:** 完成
- **basis:** → O7

`pnpm type-check` 必須通過才能 push（`CLAUDE.md` 第 7 節）。需要處理兩處：`Index.stories.ts:3` 有未使用的 `PowerData` import，刪除它；`Index.vue:46` 的 `startDrag` 有未使用的參數 `e`，移除這個參數。`AttentionPanel` 發出的事件參數本來就沒有用到，所以移除後行為不變。

**沿革**

- H1 · 2026-10-06 決斷 —— 使用者要求修正
- H2 · 2026-10-06 落地 —— type-check 歸零 → O7

### 5 全專案掃描字型設定是否正確套用

- **state:** 完成
- **needs:** 0018#4
- **basis:** → O8

找出所有 `font-family`、`@font-face` 與字型檔引用，確認每一處宣告的字族都有對應的來源，而且在頁面上能實際套用。找到的問題記為觀察，回報給使用者決定是否處理。

**沿革**

- H1 · 2026-10-06 決斷 —— 使用者要求掃描
- H2 · 2026-10-06 落地 —— 只發現全域預設的 Inter 沒有被載入，交由使用者決定 → O8
