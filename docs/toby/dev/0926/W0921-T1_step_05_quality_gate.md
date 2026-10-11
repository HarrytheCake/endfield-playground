# 步驟 05：品質門檻與交付檢查

## 目標

確認本次 diff、架構邊界與品質檢查結果，整理可審閱的交付證據。

## 檢查

1. 檢查 `git diff --stat` 與逐檔 diff；工具列只改 `<script>`，畫布沒有 store／Vue Flow import，沒有越界修改，`useShortcuts.ts` 維持未修改。
2. 核對正常、空值、重疊、連放、座標邊界、工具列意圖同步與既有 Esc 行為；確認本分支預檢與 `addDevice` 結果一致。
3. 依序執行 `pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test`。若目前環境確實提供 `validate-changes` skill，依 AGENTS.md 使用；不可假設 Claude skill 已在本環境可呼叫。
4. 交付摘要列出修改檔、落子欄位、操作方式、驗證結果、自建預檢與未做的加分項。若有 PR body，依派工列出落子欄位及本週未做項目。

## 完成條件

- 四項品質指令通過，或有明確的失敗命令、輸出及既有基準證據。
- 沒有超出使用者裁定與派工邊界的程式變更。
- 未經使用者明確指示，不自行 push、建立 PR 或合併。

## 驗證進度（2026-09-26）

`pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test`、`pnpm build` 全部通過；完整測試為 44 個檔案、831 項。本目錄 Markdown 的 Prettier 檢查與 `git diff --check` 通過，`GridCanvas.vue` 未引入 store 或 Vue Flow；工具列 diff 只在 script。打包輸出只有既有的大 chunk 提示，未阻擋 build。未 push、未建立 PR。
