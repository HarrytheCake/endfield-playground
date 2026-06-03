---
name: add-jsdoc
description: 為指定範圍的 TS / Vue 程式碼補上符合本專案規範的 JSDoc 註解。能處理檔案、行範圍、整個資料夾、單一函式 / class / store / type 等粒度。會自動為 function / composable / class / store 添加 @example，並在 Pinia store 中同步 return 物件的成員註解。當使用者要求「幫 xxx 加註解」、「補一下 yyy.ts 的 JSDoc」、「這個 function / store / class 沒有註解」、「整理 zzz 的註解」等任務時觸發。
---

# 加註 JSDoc 註解

為 TS / Vue 程式碼補 JSDoc。本 skill 只動註解、**不改動任何程式邏輯**。

## 適用範圍

使用者會以下列任一形式指定範圍：

- 整個檔案：「幫 `src/store/flowStore.ts` 加註解」
- 行範圍：「幫 `xxx.ts` 第 40 ~ 80 行加註解」
- 單一目標：「幫這個 function / class / store 補 JSDoc」
- 整個資料夾：「幫 `src/composables/` 整批加註解」

對指定範圍內**所有符合「必須註解的目標」**的程式碼，補上或重寫 JSDoc。

## 大原則（取自 `CLAUDE.md` §3）

1. **繁體中文**為主，專有名詞 / API 名稱 / 型別名（`PlacedDevice`、`ref`、`computed`、`Map` 等）保持原樣
2. **嚴禁表情符號**
3. **單行也用 `/** */`**，不用 `//`
4. **描述意圖，不描述程式碼字面**
   - 不行：「設定 state 為傳入的 value」
   - 可以：「同步畫布縮放係數，避免 zoom 與 gridSize 出現中間狀態」
5. **多行內容用 `  \` 換行**（兩個空白 + 反斜線），不要用 `<br>` 或多個 `\n` 段落
6. **既有有意義的 JSDoc 保留**；空洞或錯誤的重寫
7. 不在 JSDoc 之外加 `//` 解釋（除非是 inline 不便 JSDoc 的特殊技巧說明）

## 必須加 `@example` 的目標（本專案特別規定）

下列四類**一律**要加 `@example`：

- 一般 **function**（包含 arrow / named）
- Vue **composable**（`useXxx` 函式）
- **class**
- Pinia **store** 的整個 `defineStore`

`@example` 內容規則：
- 顯示**怎麼用**，不顯示「內部如何運作」
- 內部省略段用 `// ...`
- 程式碼縮排與本身一致（4 空格）
- 不需可執行，但需語法正確 + 表達意圖

例：

```ts
/**
 * 將格子座標換算為畫面像素座標，回傳值已含畫布平移與縮放。
 * @param cell 格子座標
 * @returns 畫面像素座標
 * @example
 * const { x, y } = cellToPixel({ x: 3, y: 5 })
 * // x, y 已經乘上 gridSize 並加上 canvas offset
 */
```

## 各目標類型的寫法重點

### Function / Composable

- 描述：說明**做什麼**與**為什麼存在**，不要拆解程式碼字面
- `@param`：每個非顯而易見的參數寫一行說明（型別已寫在 TS 簽名，**不要重複寫型別**）
- `@returns`：回傳值意義非平凡時加；單純 `void` 或回傳的型別已自我說明則省略
- `@example`：必加

非平凡副作用（寫入 store、觸發 watch、發 event）必須在描述中指出。

### Class

- 類別頂部 JSDoc：
  - 若 class 有 `abstract`、`final` 語意（TS 沒有 `final` 關鍵字，但概念上不該被繼承時）或全 `static` 成員的工具類，**在描述開頭以 `[abstract]` / `[final]` / `[static]` 標註**
  - 例：「`[abstract]` 所有 detector 的基類，子類必須實作 `run()`」
- **每個屬性**：用 `[public]` / `[protected]` / `[private]` 標註可見性後接描述
  - 例：「`[private]` 內部快取，避免每次重算拓撲」
- **constructor**：用 `@param` 列出每個參數意義；構造邏輯特殊時加描述
- **每個 method**：當作 function 寫（含 `@param` / `@returns` / `@example`）
- 整個 class **頂部需 `@example`** 顯示典型用法

### Type / Interface

- 整個 type 頂部 JSDoc 描述用途
- **`@example` 規則特別**：
  - **泛型（generic）/ 工具型別**（如 `Result<T, E>`、`DeepPartial<T>`）→ **必加** `@example`，顯示一個具體實例化的用法
  - **純資料 type / interface**（如 `PlacedDevice`、`Alert`）→ **不必加**，但若用法不直覺可加
- **每個欄位 / 屬性**：個別 `/** */`
  - 物件型 type 的每個 key 都要寫
  - interface extends 父介面時，父介面的欄位**不重複寫**

### Pinia Store（特殊規則）

整個 `defineStore` 一份 JSDoc，內含 `@example` 顯示元件如何取得與使用。

內部結構**個別加註**：

- 每個 `ref` / `reactive` / `computed`：在宣告處上方加 JSDoc
- 每個內部宣告的 function：當作 function 寫（`@param` / `@returns` / `@example` 視情況）
- **`return { ... }` 中暴露的每個成員**：再寫一次 JSDoc，**內容必須與宣告處同步**

> Store 的 return 同步是本專案硬性規定。修改宣告處註解時，必須同步修改 return 處；反之亦然。本 skill 在處理 store 時應主動檢查兩處是否一致，若已存在的兩邊不一致，以宣告處為準，警示給使用者。

藍圖類 action（會自動進歷史的）**在描述中明確指出**「呼叫一次自動產生一筆 Command 推入 historyStore」。

### Vue SFC（`.vue` 內 `<script setup lang="ts">`）

- `defineProps` / `defineEmits`：每個欄位 / event 加 JSDoc
- `<script setup>` 內宣告的 `ref` / `computed` / function：跟一般 TS 規則相同
- 副作用 hook（`onMounted` / `onUnmounted` / `watch` / `watchEffect`）：在 callback 上方用 JSDoc 說明**為什麼有這個副作用**（不要寫「在 mount 時執行 xxx」，要寫「為了 yyy 而在 mount 時 zzz」）

### Const / 全域變數

- 模組頂部的 `export const`：說明用途與生命週期（特別是有狀態的單例）
- 區域內常數通常不需註解，除非數值意義不明（如 `LONG_PRESS_MS = 300`）

## 大型頁面區段

長檔案內可用 section header 分段（**不是 JSDoc**，是普通註解）：

```ts
// ─── State ───────────────────────────────────────────────────────────────────
```

這類 section header 維持既有風格不重寫，只在缺失時補。本 skill 主要焦點是 JSDoc，不在「重新分段」。

## 工作流程

1. **讀指定範圍的源檔**，列出所有符合「必須註解的目標」
2. 對每個目標：
   - 已有 JSDoc 且內容具體 → 保留
   - 已有 JSDoc 但空洞 / 錯誤 / 不符規範 → 重寫
   - 沒有 JSDoc → 補上
3. **store 額外步驟**：補完內部 + return 兩邊註解，並驗證同步
4. 用 `Edit` 工具一段段改，不要用 `Write` 整檔覆寫（保護其他段落與格式）
5. 完成後回報：補了哪些目標、改了哪些既有註解、有沒有發現邏輯上不確定要再向使用者確認的地方

## 不該做的事

- **不要改任何程式碼**：本 skill 只動 JSDoc。若發現程式碼有 bug、命名怪、可優化處，**回報給使用者**，不順手改
- **不要在簡單 getter / setter 上硬加 JSDoc 湊數**：只有「必須註解的目標」需要
- **不要為了加 `@example` 而瞎編一個跟函式無關的範例**：寫不出有意義範例就回報給使用者，可能是該函式介面設計需要調整
- **不要混用語言**：句子內部就只有「中文 + 專有名詞英文」，不要寫「這個 function 會 process the input」這種半中半英
- **不要把型別塞進 `@param` 描述**：型別由 TS 簽名負責，描述只寫**意義**
- **不要漏 store 的 return 同步**：這是本專案規範差異最大的一點
- **不要用 `//` 取代 JSDoc**：就算是單行說明
