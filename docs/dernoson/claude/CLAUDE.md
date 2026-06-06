# 開發守則

關於專案使用的 tech stack 與資料夾架構，請參考根目錄 `README.md`。
關於三層架構與每個人的職責分配，請參考 `docs/dernoson/` 下對應層級的文件（`L1/L1.md`、`L2/L2.md`、`L3/L3.md`）。

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

## 6. 提交流程

- 採 branch 開發：`dev/<name>` 或 `dev/<feature>`
- 開新 PR 前必須執行並通過：

```bash
pnpm type-check
pnpm lint-check
pnpm format-check
```

- Commit 訊息簡潔、繁中為主；不加表情符號、不加 AI 生成字樣
- 不擅自 push、不擅自建 PR、不擅自合併 master —— 這些動作須使用者明確指示

---

## 7. 互動原則

- 當需求會導致大量程式碼變更或跨多個檔案時，必須先提出與使用者討論的請求，規劃步驟分割，一次僅執行一個步驟
- 不擅自建立新檔案（README、CHANGELOG、planning 文件等）—— 除非使用者明確要求
- 對於不確定的決策，回報給使用者選擇，不擅自下判斷
- 修 bug 時聚焦原因，不順便重構周邊；重構時不順便改邏輯

---

## 8. 安全與隱私

- 嚴格禁止讀取 `.env`、`.env.*`、`.secrets`、任何 credentials 檔案
- 不在程式碼、commit、PR 中留下任何金鑰、token、密碼
- 對外部 API 的 request body 與 response 不假設安全，做 schema 驗證（Zod）
