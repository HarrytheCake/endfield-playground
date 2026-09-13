# 步驟 5：品質檢查與交付摘要

## 目標

確認變更範圍、靜態檢查與測試結果，整理可供 reviewer 驗收的交付摘要。

## 變更範圍檢查

執行：

```powershell
git status --short
git diff -- src/editor/inspector/InspectorPanel.vue
```

確認：

- 程式碼只修改 `InspectorPanel.vue`。
- 沒有修改 `FactoryCanvas.vue` 或 `FlowNodeOverlay.vue`。
- 沒有修改 stores、機器資料或測試。
- 新增設備資訊程式沒有呼叫 store mutation。
- 沒有 `nodes.push`、`historyStore.execute` 或自組 Command。

注意：InspectorPanel 原本就有 `setMapSize()` 和 `setSnapToGrid()`；檢查重點是本次 diff
沒有新增 mutation，不是要求整個檔案完全沒有既有 action。

## 品質指令

依序執行：

```powershell
pnpm type-check
pnpm lint-check
pnpm format-check
pnpm test
```

如果目前環境提供 `validate-changes` skill，應依 skill 規則執行完整驗證。

## 失敗處理

- 只修正本次變更造成的錯誤。
- 不順便重構既有 InspectorPanel。
- 若失敗來自基準分支既有問題，保留完整輸出並在交付摘要中註明。
- 不為了通過檢查而修改工單禁止檔案。

## 交付摘要格式

```text
修改檔案：src/editor/inspector/InspectorPanel.vue

完成內容：
- 單選設備時顯示名稱、佔格與耗電。
- 未選取或多選時顯示空狀態。
- 設備資訊資料流為唯讀，沒有新增 store mutation。

操作方式：
1. 開啟正式編輯器。
2. 選取一台既有設備。
3. 在右側 Inspector 查看設備資訊。

驗證：
- pnpm type-check：通過／失敗
- pnpm lint-check：通過／失敗
- pnpm format-check：通過／失敗
- pnpm test：通過／失敗

已知上游問題：
- 單擊 selection-change：有／無
- 新設備 machineType 契約：有／無
```

## Git 與外部操作限制

- 未經使用者明確指示，不 push。
- 未經使用者明確指示，不建立 PR。
- 未經使用者明確指示，不合併分支。
- Commit 訊息使用簡潔繁體中文，不加表情符號或 AI 生成字樣。

## 完成條件

- 四項品質指令皆已執行並記錄結果。
- 已完成截圖或短錄影。
- 已清楚記錄已知上游問題。
- 已向 reviewer 提供修改檔、完成內容和操作方式。
