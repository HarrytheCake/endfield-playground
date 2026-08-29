# PR Description 草稿：`dev/cake` → `master`

對應 commit `657f5c4`（P 鍵／Navbar 切換管線工具）與 `38cd5fc`（SESSION_HANDOFF 文件更新）。以下內容可直接複製進 GitHub PR 描述欄。

---

## Summary

- 新增可配置快捷鍵 `toggleConnectTool`（預設 `P`），在 `select`／`connect` 兩個工具模式間切換；`Navbar.vue` 加一顆「管線」按鈕對應同一 action
- 順手修正既有 bug：`Space` 暫時切到 `pan` 工具、放開後原本寫死回 `select`，導致切好的 `connect` 被 `Space` 誤打回 `select`；改為記住按住前的工具並還原
- `docs/harry/SESSION_HANDOFF.md` 補上前一輪 `PaperFigMainField` 驗證進度與一次 `git revert --abort` 誤刪工作目錄檔案的事故記錄（純文件更新，不影響程式行為）

## 1. P 鍵／Navbar 切換管線工具（W0823-H1）

**變更檔案：** `src/store/keybindingStore.ts`、`src/composables/useShortcuts.ts`、`src/editor/navbar/Navbar.vue`

- `keybindingStore.ts`：`KEYBINDING_ACTIONS` 新增一筆 `{ id: 'toggleConnectTool', label: '切換管線工具', category: 'canvas', defaultCombo: 'P' }`——比照既有 `holdPan`／`rotateDevice` 等動作走可配置鍵位架構，而非另外硬編一顆不可改的 `P` 鍵。使用者可在既有的快捷鍵設定介面重新綁定、也享有內建的鍵位衝突偵測，不需要額外改設定介面元件本身
- `useShortcuts.ts`：新增 `onComboTriggered('toggleConnectTool', ...)`，呼叫既有 `editorStore.setActiveTool()`（`'connect'` ↔ `'select'` 互切），未新增或修改任何 store action 本體
- `Navbar.vue`：`tools` 陣列加入 `{ id: 'connect', label: '管線' }`，沿用現成的 `@click`／選中態 `:variant` v-for 邏輯，無需額外樣式或邏輯

**本次刻意排除：** 不畫管線、不做 port 點擊或 draft 彎折互動（屬 R-C1 範疇）、不改 `FactoryCanvas.vue` / `FlowNodeOverlay.vue`（當週檔案鎖）、不做框選 / clipboard。這是 CR-02「管線模式切換」的第一片，純粹把工具狀態接上，畫布真正的連線互動留待後續 R-C1 工單。

## 2. Space 暫時平移放開後的還原邏輯修正

**變更檔案：** `src/composables/useShortcuts.ts`

- 修正前：`watch(holdPan, (held) => editorStore.setActiveTool(held ? 'pan' : 'select'))`——放開 `Space` 一律寫死回 `'select'`，若使用者原本在 `connect` 工具中途按住 `Space` 平移畫面，放開後會被意外打回 `select`
- 修正後：新增本地變數 `toolBeforePan` 記錄按下 `Space` 當下的工具，放開時還原為該工具而非固定值，`connect`／未來其他工具模式與 `Space` 平移可以正常共存

## 明確不在本次範圍內

- 管線繪製本身（port 命中判定、拖曳 draft 線、90 度折線渲染）——屬 R-C1／R-C3，待後續工單
- 快捷鍵設定介面本身沒有變更（沿用既有 `ShortcutSettingsPanel.vue`，新動作自動出現在清單中）
- `docs/harry/SESSION_HANDOFF.md` 的更新純屬文件記錄（前一輪 PaperFigMainField 驗證狀態、一次 `git revert --abort` 誤操作復原記錄），不影響任何程式行為，審查時可視為 no-op

## 驗證

依 commit message 與 `SESSION_HANDOFF.md` 記錄的當輪驗證結果：

```
pnpm type-check   # 通過（vue-tsc --build 全綠）
pnpm lint-check   # 通過
pnpm format-check # 紅——但失敗的 4 個檔案（App.vue／ShortcutRow/Index.vue／useKeybinding.ts／
                  # ShortcutSettingsPanel.vue）與本次改動無關，是既有問題，非本次改動引入
pnpm test         # 未在此輪重新記錄，合併前建議重跑一次確認
```

手動測試待補（合併前建議實測）：
1. 按 `P` → Navbar「管線」呈選中態；再按 `P` → 回「選取」
2. 點 Navbar「管線」按鈕效果與按 `P` 一致
3. 切到 `connect` 後按住 `Space` 拖畫布、放開 → 仍停留在 `connect`（驗證還原邏輯）
4. `Ctrl+Z`／`Delete`／`Ctrl+R`／`Escape` 開設定介面等既有快捷鍵皆正常
5. 快捷鍵設定介面內確認「切換管線工具」有出現、可重新綁定、與既有鍵位衝突時會被攔下

## 對應文件

| 功能 | 計畫文件 |
|------|----------|
| P 鍵／Navbar 切換管線工具 | [docs/harry/PLAN_connectTool.md](PLAN_connectTool.md) |
| 對應派工單 | [docs/work_dispatch/harry/W0823-H1_connect_tool_shortcut.md](../work_dispatch/harry/W0823-H1_connect_tool_shortcut.md) |
