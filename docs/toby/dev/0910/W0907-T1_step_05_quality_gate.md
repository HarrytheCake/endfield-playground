# 步驟 5：品質檢查與交付

## 目標

確認程式碼範圍、禁止依賴與四項品質指令，整理符合 1C／2A 決策的交付摘要。

## 變更範圍檢查

執行：

```powershell
git status --short
git diff -- src/editor/layout/GridCanvas.vue src/editor/layout/GridCanvas.stories.ts
```

確認工單程式碼只涉及：

```text
src/editor/layout/GridCanvas.vue
src/editor/layout/GridCanvas.stories.ts
```

本次由使用者明確要求建立的 `docs/toby/dev/0910/` 分步文件屬規劃產物，不視為程式碼範圍
違規。除此之外不得出現其他非既有變更。

## 禁止內容檢查

執行：

```powershell
rg -n "store|FactoryCanvas|vue-flow|defineEmits|@click|@mousedown|@pointerdown|draggable" src/editor/layout/GridCanvas.vue
```

並人工確認：

- 沒有 Pinia store import 或 mutation。
- 沒有 Vue Flow import。
- 沒有 emit 或互動事件。
- 沒有修改 props 資料。
- 沒有連接狀態解析或 viewport 邏輯。

## 品質指令

依序執行：

```powershell
pnpm type-check
pnpm lint-check
pnpm format-check
pnpm test
```

目前環境未提供專案所述的 `validate-changes` skill，因此直接執行上述完整指令。若後續環境
提供該 skill，則應依 skill 規則重新驗證。

## 失敗處理

- 只修正兩個目標程式檔造成的問題。
- 不修改 `.storybook/main.ts` 讓 Story 被收錄。
- 不修改 store、router、fixtures、utilities 或 `LayoutL1Preview.vue`。
- 若失敗來自基準分支，保留指令、錯誤摘要與判定依據後回報。
- 若修正必須越界，停止並請使用者重新裁定。

## 交付摘要格式

```text
程式修改檔案：
- src/editor/layout/GridCanvas.vue
- src/editor/layout/GridCanvas.stories.ts

完成內容：
- 以 props 唯讀渲染格線、設備佔格、標籤與管線折線。
- 建立 Connected／Broken 兩組 Story args。
- 未加入 store、Vue Flow、emit 或互動事件。

決策註記：
- 依 1C，Storybook 可見性不列驗收，未修改 .storybook/main.ts。
- 依 2A，保留 src/editor/layout/GridCanvas.vue 特例路徑。

驗證：
- pnpm type-check：通過／失敗
- pnpm lint-check：通過／失敗
- pnpm format-check：通過／失敗
- pnpm test：通過／失敗

未驗收項目：
- 目前 Storybook 不掃描 src/editor，因此未執行 Storybook UI 肉眼驗收。
```

## Git 與外部操作限制

- 未經使用者明確指示，不 commit、不 push。
- 未經使用者明確指示，不建立 PR 或合併分支。
- 若使用者要求 commit，訊息使用簡潔繁體中文，不加表情符號或 AI 生成字樣。

## 完成條件

- 程式碼只涉及兩個指定目標檔。
- 禁止內容檢查沒有發現越界實作。
- 四項品質指令皆已執行並記錄結果。
- 交付摘要清楚標示 Storybook UI 未納入驗收。

