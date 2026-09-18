# 步驟 5：品質檢查與交付

## 目標

確認格式、型別、靜態規則、測試與實際 diff 都符合工單及專案守則，再整理交付資訊。

## 完整品質指令

依序執行：

```bash
pnpm type-check
pnpm lint-check
pnpm format-check
pnpm test
```

任一指令失敗時：

1. 判斷是否由本次變更造成。
2. 若屬本次範圍，修正後重新執行相關指令。
3. 若屬基準分支既有問題，保存完整錯誤輸出並回報，不擴大修改周邊檔案。

## Diff 檢查

1. 執行 `git status --short` 與 `git diff --stat`。
2. 逐檔閱讀本次 diff，確認只包含：
   - `src/editor/layout/LayoutView.vue`
   - `src/app/layouts/MainLayout.vue`
   - 必要時的 `src/editor/layout/GridCanvas.vue`
   - 使用者要求的 `docs/toby/dev/0918/*` 規劃文件
3. 確認 `GridCanvas.vue` 搜尋不到 store 或 Vue Flow import。
4. 確認未產生或修改自動生成檔、dist、README 或 CHANGELOG。
5. 確認沒有刪除或修改 `FactoryCanvas.vue`。

## 交付摘要

回報時應包含：

- 新增及修改的檔案。
- 首頁如何載入初始 layoutStore 內容。
- 明確註明本週沒有視角切換器。
- `pnpm dev` 的手動驗收結果。
- 四項品質指令的結果。
- 初始 snapshot 的 undo 行為。
- 新舊 store 並存造成的已知過渡限制。

PR body 至少應有一句說明初始資料載入方式，例如：

> 首頁由 LayoutView 在 layoutStore 為空時載入 connected snapshot；本週不含視角切換器。

## 禁止動作

- 未經使用者明確指示不得自行 push。
- 不得自行建立 PR 或合併 master。
- 不得因交付方便而追加切換器、互動功能或舊 store 遷移。

## 完成條件

- 手動驗收通過。
- 四項品質指令全部通過，或已明確證明失敗屬既有基準問題。
- diff 僅包含核准範圍。
- 已向使用者摘要驗證結果與未解決的上游問題。
