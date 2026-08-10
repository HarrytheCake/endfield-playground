# 開發守則

關於專案使用的 tech stack 與資料夾架構，請參考根目錄 `README.md`。
關於三層架構與每個人的職責分配，請參考 `docs/dernoson/` 下對應層級的文件（`L1/L1.md`、`L2/L2.md`、`L3/L3.md`）。
關於專案的專有名詞與核心概念，請參考 `docs/dernoson/claude/CONTEXT.md`。
關於目前正在進行的計畫與所有開放中的項目，請參考 `docs/dernoson/plan-history/head.md`（見第 6 節）。

---

## 1. 三層架構（必讀）

本專案採三層架構，所有新增程式碼都必須能明確落在某一層：

| 層級             | 範疇                                                                                | 嚴禁事項                                               |
| ---------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **L1 基礎層**    | Pinia stores、型別、FlowEngine、history、graph utility、validation detectors        | 不寫真實 UI（僅允許 `src/app/dev/` 下的 debug 測試頁） |
| **L2 容器層**    | 主畫面 layout、互動（拖拉 / 快捷鍵 / 框選）、消費 store、給 L3 傳 props / 收 events | 不做純視覺樣式（屬於 L3）                              |
| **L3 UI 元件層** | 純展示元件，靠 props 渲染、靠 emits 通知上層                                        | **嚴格禁止 `import { useXxxStore }`** 任何 Pinia store |

三條硬規則：

1. L3 元件 **不得** import 任何 Pinia store；資料只能由 props 進入、事件只能由 emits 流出
2. L1 不寫真實 UI；需要 debug 時放 `src/app/dev/` 並加 dev-only route guard
3. L2 不做純視覺樣式調整；那是 L3 的職責，L2 只做事件路由與資料映射

詳細邊界與每層交付物見 `docs/dernoson/L1/L1.md`、`L2/L2.md`、`L3/L3.md`。

---

## 2. 元件命名慣例

- 每個 Vue 元件對應一個 PascalCase 資料夾
- **主元件命名為 `Index.vue`**
- 子元件用 PascalCase 平鋪在同一資料夾下（不另開 `nodes/` 之類的次層）
- 範例：
    - `src/components/InfoPanel/Index.vue`（主）
    - `src/components/InfoPanel/RecipeListTab.vue`（子）
    - `src/components/InfoPanel/DeviceShapeDiagram.vue`（子）

---

## 3. 程式碼註解規則

### 通則

- 一律使用繁體中文（專有名詞、API 名稱除外）
- **嚴格禁止表情符號**
- 使用 JSDoc 格式註解（`/** ... */`），單行也用 `/** */` 不用 `//`
- 註解描述「為什麼」與「意圖」，不要重複「程式碼字面上做了什麼」

### 必須註解的目標

- **函數**：說明用途、參數意義、回傳值意義；非平凡的副作用要點出
- **類別 / interface / type alias**：說明用途；**成員必須逐一註解**
- **全域變數**：說明用途與生命週期
- **Pinia store**
    - 內部以 `ref`、`computed`、`reactive` 宣告的每個變數
    - 內部宣告的函數
    - return 輸出的每個成員（註解內容須與宣告處一致）
- **大型頁面區段**：用區塊註解標示段落用途
- **`.vue` SFC 中**
    - `<script setup>` 內宣告的變數與函數
    - `defineProps` 與 `defineEmits` 的每個欄位
    - 副作用 hook 的用途（`onMounted` / `onUnmounted` / `watch` / `watchEffect` 等）

---

## 4. 程式碼設計規則

- **元件**：優先使用 Nuxt UI v3 元件，不自己重新發明（Button、Modal、Table、Tooltip、Tabs 等）
- **工具函式**：優先使用 VueUse（`useMagicKeys`、`useLocalStorage`、`useDebounceFn`、`useElementSize` 等），不自己重新發明
- **樣式**：優先使用 Tailwind CSS 內建 class；自訂顏色統一寫在 `src/assets/styles/tokens.css`，少寫散落的 inline CSS
- **TypeScript**：避免 `any`；確實需要時加註解說明原因
- **遵照 SOLID 原則**：尤其單一職責（一個函式 / 元件做一件事）與依賴反轉（依賴介面而非實作）
- **不過度設計**：不寫使用者未要求的功能；不為「未來可能」預先抽象；三個相似的地方再考慮抽出共用

---

## 5. Store 操作規範（Command Pattern）

- L1 high-level store actions 內部會**自動產生 Command 並推入 historyStore**
- L2 **不得**自己呼叫 `historyStore.execute()`，也**不得** import `createMacroCommand`
- L2 對 historyStore 的合法使用：
    - `historyStore.undo()` / `historyStore.redo()`（綁定 Ctrl+Z / Ctrl+Y）
    - `historyStore.canUndo` / `historyStore.canRedo`（給 UI 判斷 disabled 狀態）
- 如果 L1 沒有對應的 high-level action 可用，**回報給 L1 維護者補上**，不在 L2 自己組 mutation

---

## 6. 計畫紀錄（plan-history）

所有計畫檔放在 `docs/dernoson/plan-history/`，由 `plan-history` skill 維護。完整格式、版本規則與一致性檢查見 `.claude/skills/plan-history/SKILL.md`，此處只列每次工作都會用到的部分。

### 開工前先寫計畫

動任何非瑣碎的開發、重構、修 bug、文件重整之前，先呼叫 `plan-history` skill 把計畫寫成檔案，再開始實作。**這是第 8 節「不擅自建立新檔案」的唯一例外** —— 計畫檔本來就該主動建立。

免寫的情況：純問答、唯讀調查、使用者已經完整指定的單點機械性修改（改錯字、rename 一個 symbol、bump 一個版本）。不確定就寫，成本很低。

### 每個 session 開始先讀 head.md

`docs/dernoson/plan-history/head.md` 記錄目前使用中的是哪一份計畫，以及**所有開放中的項目，一行一個**。提出任何工作規劃之前先讀它，才會接續正在跑的計畫，而不是另起一份平行的。

它是產生出來的檔案，**嚴禁手動編輯**。

### 要做某一格，不要讀整份計畫

`head.md` 只回答「是哪一格」。真的要動手做那一格時，用工具把那一格要出來：

```bash
python3 docs/dernoson/plan-history/plan-item.py 0011#5
```

回傳的是計畫檔頭、該項目的當前正文、以及它所依據的觀察，就這些。**不要用 `Read` 開計畫檔去撈其中一格** —— 一份活著的計畫動輒數萬 token，大半是其他項目與刻意保留的過期內容（已被推翻的觀察、已被取代的決策），讀進來既貴，又會把現在有效的那一小段埋掉。

- `--history`：附上全部沿革與全部相關觀察，用於稽核
- `--list`：在終端機看與 `head.md` 相同的開放項清單
- **v1 / v2 的計畫沒有可定址的格子**，工具會直接說明而不是猜；那些計畫要整份讀

寫計畫、稽核計畫、或回答關於整份計畫的問題時才整份讀；執行其中一格時不要。

### 建立或更新計畫後

```bash
python3 docs/dernoson/plan-history/update-head.py
```

重新產生 `head.md` 並印出一致性衝突報告。`.claude/settings.json` 的 PostToolUse hook 會自動跑一次，但**衝突報告才是重點**，仍要自己跑一次看輸出。**不要靠弱化紀錄來消衝突** —— 不把未完成的項目改成終結狀態、不刪項目來讓 `done` 通過、不改觀察來讓時序檢查閉嘴；修真正的狀態，或把衝突告訴使用者讓他決定。

---

## 7. 提交流程

分支命名、PR 流程、驗證指令細節請見根目錄 `README.md`「開發者守則」。補充給 Claude Code 的規則：

- push 前必須執行並通過 `pnpm type-check` / `lint-check` / `format-check` / `test`（可直接用 `validate-changes` skill 一次跑完，見第 10 節）
- Commit 訊息簡潔、繁中為主；不加表情符號、不加 AI 生成字樣
- 不擅自 push、不擅自建 PR、不擅自合併 master —— 這些動作須使用者明確指示

---

## 8. 互動原則

- 當需求會導致大量程式碼變更或跨多個檔案時，必須先提出與使用者討論的請求，規劃步驟分割，一次僅執行一個步驟
- 不擅自建立新檔案（README、CHANGELOG 等）—— 除非使用者明確要求；`docs/dernoson/plan-history/` 下的計畫檔是例外，見第 6 節
- 對於不確定的決策，回報給使用者選擇，不擅自下判斷
- 修 bug 時聚焦原因，不順便重構周邊；重構時不順便改邏輯

---

## 9. 安全與隱私

- 嚴格禁止讀取 `.env`、`.env.*`、`.secrets`、任何 credentials 檔案
- 不在程式碼、commit、PR 中留下任何金鑰、token、密碼
- 對外部 API 的 request body 與 response 不假設安全，做 schema 驗證（Zod）

---

## 10. 可用 Skills 與 Agents

專案特定的 skills / agents 放在 `docs/dernoson/claude/`，透過根目錄 `.claude/` symlink 生效（設定方式見 `docs/dernoson/README.md`）。完整規則見各自的 `SKILL.md` / agent 定義檔，此處僅列索引：

**Skills**（`.claude/skills/`，用 `/<name>` 或符合觸發條件時自動使用）：

- `add-jsdoc`：依第 3 節註解規則，為指定範圍的 TS / Vue 程式碼補齊 JSDoc
- `plan-history`：在 `docs/dernoson/plan-history/` 記錄與維護計畫；**開工前必須先寫計畫檔**，規則見第 6 節
- `validate-changes`：跑 format → lint → type-check → test 全套驗證；**改完程式碼、回報「完成」前必須跑**

**Agents**（`.claude/agents/`，用 Task／Agent 呼叫）：

- `dependency-grapher`：畫指定範圍的模組相依圖（Mermaid），只讀程式碼、只寫 markdown，不改原始碼
- `test-writer`：建立或更新 Vitest 單元測試，測試檔鏡射到 `src/__tests__/`
