# Session Handoff —— 給下一個聊天用的接續筆記

**用途：** 開新聊天時貼給 Claude 看，快速還原這個 session 建立的角色定位、工作流程與現況，不用重新從頭摸索。
**身分：** L2 容器層 Owner，負責 CR-01（畫布）+ CR-02（管線）+ CR-11（工具列）。詳細角色定位見 [README.md](README.md)，五項 editorStore action 缺口清單見 [MILESTONE_0726.md](MILESTONE_0726.md)。

---

## 1. 這個 session 建立的工作流程（下一輪請延用）

1. **大改動前先寫 `PLAN_<功能>.md`**：範疇判定（哪些檔案屬於 L1/L2/L3）、既有介面盤點、設計、明確排除範圍、待確認問題。使用者確認決策後才動工
2. **實作完成前一定跑四項驗證**：`pnpm type-check` / `pnpm lint-check` / `pnpm format-check` / `pnpm test`，全過才算完成
3. **一批功能做完後寫 `PR_DESCRIPTION_<日期>.md`**：整理變更檔案、範圍外項目、已知風險，附驗證結果與對應 PLAN 文件連結表，方便直接貼進 GitHub PR
4. **遇到不確定的產品/設計決策就用選項讓使用者選**，不擅自定案（例如：Esc 要不要開放自訂、鍵位衝突要擋下還是警告）
5. **發現既有程式碼的問題（dead state、命名不一致等）先回報，不擅自順手修**，除非使用者明確要求

## 2. 目前已完成、已驗證通過的功能

| 功能 | 對應文件 | 變更檔案重點 |
|------|----------|---------------|
| addConnection（畫管線） | [PLAN_addConnection.md](PLAN_addConnection.md) | `FlowNodeOverlay.vue` 動態多埠 Handle、`FactoryCanvas.vue` `@connect` |
| removeConnection（刪管線） | [PLAN_removeConnection.md](PLAN_removeConnection.md) | `selectionStore.ts` 加 `selectedEdgeIds`、Delete 鍵、右鍵選單 |
| resetCanvas（暫時性 Ctrl+R） | [PLAN_resetCanvas.md](PLAN_resetCanvas.md) | `useShortcuts.ts` 的 `triggerResetCanvas()` |
| 快捷鍵可配置化 + WASD 平移 + Esc 設定介面 | [PLAN_wasdCameraPan.md](PLAN_wasdCameraPan.md) / [PLAN_configurableShortcuts.md](PLAN_configurableShortcuts.md) / [PLAN_shortcutSettingsPanel.md](PLAN_shortcutSettingsPanel.md) | 新增 `keybindingStore.ts`、`useKeybinding.ts`、`ShortcutRow.vue`、`ShortcutSettingsPanel.vue` |
| paper_fig 設計稿 Vue 轉換（v1） | 見 [PR_DESCRIPTION_0823.md](PR_DESCRIPTION_0823.md) §4 | 新增 `src/app/dev/PaperFigMainField.vue`，dev-only 路由 `/dev/paper-fig-main-field`，不掛在左側 dev 選單 |

以上皆已 commit（見 `git log`：`1649872` 快捷鍵可配置化、`b46537d` paper_fig v1 轉換）。

**額外設計筆記（尚未實作）：** [DESIGN_clipboardAndEdgeSelectionState.md](DESIGN_clipboardAndEdgeSelectionState.md)——clipboard store 與管線選取狀態的資料模型構想，對應 MILESTONE §5 問題 2、3。

## 3. 現在進行中、尚未驗證完成的工作

**`PaperFigMainField.vue` 正在依 `paperfigv2.css`（`src/app/dev/paperfigv2.css`）重做頂部工具列**，這是比 v1 更精確的 Figma 座標匯出（絕對定位疊層，非上下堆疊）。目前進度：

1. 已改成疊層結構：`FactoryCanvas` 鋪底，工具列/視角列 `absolute` 浮在上方（而非 v1 的上下堆疊 flex 區塊）
2. 已依使用者指示拿掉 v1 的「底部設備選取列／分類 Tab／搜尋框」（v2 沒有這段設計）
3. 工具列樣式第一次手刻 `<button>`/`<div>` 被指出跟設計稿不像，已改回用 `UButton`/`USlider` + `:ui` prop 覆寫（`variant="ghost"` 卸掉預設樣式，`:ui.base`/`:ui.leadingIcon` 蓋上設計稿的 55×55 扁平色塊 + `#4E4E4E`/`#EEFD1C` 配色）
4. 按鈕實際順序已由使用者確認為：**快捷鍵設定 → 匯出 → 匯入 → 基地切換 → 復原 → 取消復原 → botton frame（語意不明，僅視覺）→ 縮放**
5. **`pnpm type-check` 已於 2026-08-23 這輪重新跑過並通過**（`vue-tsc --build` 全綠）。`pnpm lint-check` 也過。**尚未做的**：目視比對 `http://localhost:5174/dev/paper-fig-main-field`（或重啟 dev server）是否真的貼近 `paperfigv2.css`——這輪沒啟動 dev server，沒有實際看過畫面
6. **`pnpm format-check` 目前是紅的**，但失敗的 4 個檔案跟 PaperFigMainField 無關，是快捷鍵功能的檔案（見下方 §3.1）——`PaperFigMainField.vue` 本身格式沒問題

### 3.1 意外發現：快捷鍵功能（§2 列為「已完成、已驗證通過」）目前 format-check 不過

2026-08-23 這輪重跑四項驗證時發現，以下 4 個檔案有 Prettier 格式問題（`--check` 印出 warn，非本次改動造成，是既有問題）：
`src/app/App.vue`、`src/components/ShortcutRow/Index.vue`、`src/composables/useKeybinding.ts`、`src/editor/settings/ShortcutSettingsPanel.vue`。
下一輪如果要動這些檔案，記得先跑 `prettier --write` 確認範圍後再處理，避免跟自己的改動混在一起看不清楚。

## 4. Dev Server 狀態

Session 中途有啟動過 `pnpm dev`（背景執行），port 因為 config 變動重啟後跳到 **5174**（不是預設的 5173）。2026-08-23 這輪確認 dev server **目前沒有在跑**（`curl` 回傳 000）。新開聊天時請先確認 dev server 是否還活著（`curl -s -o /dev/null -w '%{http_code}' http://localhost:5174`），沒開就重新啟動一次。

## 7. 2026-08-23 這輪的重大事故記錄（下次遇到類似 git 狀態務必先看這段）

這輪一開始 `git status` 顯示 **`Revert currently in progress`**（工作目錄乾淨、無衝突標記），是上一個 session 或其他協作者留下的未完成 revert 序列，跟本文件描述的 CR-01/02/11 工作完全無關。處理過程與教訓：

1. 序列是針對 PR #30（`dev/cake_feature`）合併後的一連串 revert/reapply：`57fe4a2` 合併 PR30 → `0fff4b5`「隨便」→ `25ce07a` revert PR30 → `a0d263b` reapply PR30 → `780ebcf` revert「隨便」，`780ebcf` 是 revert 序列跑到一半、還卡在要 revert `7216b16`（commit message 是「not using」）時停住的狀態。
2. **`git revert --continue` 後發現 `7216b16`「not using」其實不是垃圾 commit**——它就是 §2 表格裡「快捷鍵可配置化 + WASD 平移 + Esc 設定介面」那批已完成功能的實際內容（`keybindingStore.ts`／`useKeybinding.ts`／`ShortcutRow.vue`／`ShortcutSettingsPanel.vue`／三份 PLAN 文件，980 行新增），繼續 revert 下去會把這批驗證過的功能刪掉。**已確認使用者要 abort，不要繼續 revert。**
3. **`git revert --abort` 本身也捅了簍子**：它把 `dev/cake` reset 回 revert 序列開始前的 `6d33020`，比 `780ebcf` 早了 3 個 commit（`d6351aa`、`7216b16`、以及一個 merge），導致 `SESSION_HANDOFF.md`、`PR_DESCRIPTION_0823.md`、`DESIGN_clipboardAndEdgeSelectionState.md`、`PaperFigMainField.vue`、`PaperFigBottomBar.vue`、`paperfigv2.css` 這些在 PR30 reapply（`a0d263b`）才加回來的檔案全部從工作目錄消失。**靠 `git reflog` 找回 `780ebcf`，用 `git reset --hard 780ebcf` 復原**，檔案都還在，沒有真的遺失。
4. **教訓：`git revert --abort` 的 ORIG_HEAD 不一定是「乾淨、你以為的那個起點」**，尤其在多重 revert/reapply 疊過的分支上，abort 前最好先用 `git reflog` 確認 abort 會落在哪個 commit，不要預設它等於「revert 開始前一秒」。
5. **`dev/cake` 目前跟 `origin/dev/cake` 分叉（本地領先 3 個、origin 領先 56 個 commit，尚未深入比對這 56 個是什麼）**，沒有 push，沒有動 origin。下一輪如果要處理分叉，先看清楚 origin 那 56 個 commit 是什麼再決定要 merge/rebase 還是別的做法，不要用本文件的假設帶入。

## 5. 這個 repo 已發現但本次沒有一併修的既有問題（下次遇到記得先查這份清單，避免重複調查）

- **`canvasStore.offset` / `canvasStore.zoom` 是 dead state**：完全沒接到 Vue Flow 真實的 viewport（`FactoryCanvas.vue` 只用 `canvasStore.gridSize`）。任何要做「縮放/平移控制項」的功能都要注意這點，畫面平移／縮放實際上要透過 `useVueFlow().setViewport()` 才會動
- **`FactoryCanvas.vue` 工具列的 `equipmentLabelMap` 用的是 `smelter`/`crusher`/`assembler`/`conveyor-node`/`power-node` 佔位字串**，只有 `crusher` 對得上 `src/data/machines.ts` 真實的 `Machine.id`，其餘機型放置後查不到真實配方/埠資料
- **`editorStore.resetCanvas()` 沒有走 Command Pattern**，呼叫後無法 `Ctrl+Z` 復原（`useShortcuts.ts` 的暫時性觸發因此加了 `window.confirm()` 防呆）
- **`src/paper_fig.css`（v1，已刪除）之前的副檔名誤標**會讓 `prettier --check` 直接 SyntaxError；`paperfigv2.css` 目前副檔名也不是真正的 CSS（沒有選擇器/大括號的扁平屬性清單），轉完 `.vue` 後記得一併確認要不要刪除或搬到 `docs/` 下，避免重蹈覆轍擋住 `format-check`

## 6. 專案基本規則提醒（來自 `docs/dernoson/claude/CLAUDE.md`，長期有效）

- 三層架構：L1（store/型別/引擎）不寫真實 UI；L2（`src/editor/`、composables）互動邏輯；L3（`src/components/`）純展示，**不得 import Pinia store**
- 元件命名：PascalCase 資料夾 + `Index.vue`
- 註解：繁中、JSDoc、禁 emoji、講「為什麼」不講「做了什麼」
- Store 操作：L2 一律呼叫 L1 高階 action，不自組 Command、不直接 mutate `nodes`/`edges`
- 不擅自 push / 建 PR / 合併 master；大改動先討論分步驟
- Nuxt UI 元件優先，VueUse 工具函式優先，自訂顏色寫 `tokens.css`（但目前 `style.css` 還有不少既有的散落顏色值，非本次要處理）
