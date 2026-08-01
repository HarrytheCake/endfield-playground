---
name: add-jsdoc
description: 為指定範圍的 TS / Vue 程式碼補上符合 CR-04 / 本專案規範的 JSDoc 註解。能處理檔案、行範圍、整個資料夾、單一函式 / class / store / type 等粒度。會自動為 function / composable / class / store 添加 @example，並在 Pinia store 中同步 return 物件的成員註解。當使用者要求「幫 xxx 加註解」、「補一下 yyy.ts 的 JSDoc」、「這個 function / store / class 沒有註解」、「整理 zzz 的註解」等任務時觸發。
---

# 加註 JSDoc 註解（CR-04）

為 TS / Vue 程式碼補 JSDoc。本 skill 只動註解、**不改動任何程式邏輯**。

規範依據：`docs/aaaaa/claude/CLAUDE.md` §5（對齊主編 `docs/dernoson/claude/CLAUDE.md` §3）。

## 適用範圍

使用者會以下列任一形式指定範圍：

- 整個檔案：「幫 `src/store/flowStore.ts` 加註解」
- 行範圍：「幫 `xxx.ts` 第 40 ~ 80 行加註解」
- 單一目標：「幫這個 function / class / store 補 JSDoc」
- 整個資料夾：「幫 `src/composables/` 整批加註解」

對指定範圍內**所有符合「必須註解的目標」**的程式碼，補上或重寫 JSDoc。

## 大原則

1. **繁體中文**為主，專有名詞 / API 名稱 / 型別名保持原樣
2. **嚴禁表情符號**
3. **單行也用 `/** */`**，不用 `//`
4. **描述意圖，不描述程式碼字面**
5. **既有有意義的 JSDoc 保留**；空洞或錯誤的重寫
6. JSDoc 與被註解目標必須相鄰（IDE hover 才能顯示）

正確位置：在 `defineStore` / `export function` **正上方**，不要放在 `import` 之前。

## 必須加 `@example` 的目標

下列四類**一律**要加 `@example`：

- 一般 **function**
- Vue **composable**（`useXxx`）
- **class**
- Pinia **store** 的整個 `defineStore`

`@example` 顯示怎麼用，不顯示內部運作；省略段用 `// ...`。

## 各目標類型重點

### Function / Composable

- 說明做什麼與為什麼存在
- `@param`：只寫意義，**不要重複寫型別**
- `@returns`：非平凡時加
- 非平凡副作用（寫入 flowStore、觸發 watch）必須在描述中指出

### Pinia Store（硬性同步）

- 每個 `ref` / `computed` / 內部 function：宣告處加 JSDoc
- `return { ... }` 每個成員必須有 JSDoc，且與宣告處**一字不差**（含 `@param` / `@returns` / `@example`）
- 禁止用 `// state` / `// actions` section header 取代正規 JSDoc
- 兩邊不一致時以宣告處為準，並警示使用者

### Type / Interface

- 整個 type 頂部描述用途
- 泛型 / 工具型別必加 `@example`；純資料 interface 可省略
- 每個欄位個別 `/** */`

### Vue SFC

- `defineProps` / `defineEmits` 每個欄位
- `<script setup>` 內變數與函數
- 副作用 hook：說明**為什麼**有這個副作用

## CR-04 常見目標

優先熟悉下列檔案的術語（見 `docs/aaaaa/claude/CONTEXT.md`）：

- `src/composables/useFlowEngine.ts` — `buildGraph`、`propagateFlows`、`detectCongestion` 等
- `src/store/flowStore.ts` — `applyResult`、`edgeFlows`、`itemSummary`
- `src/types/flow.ts` — `EdgeFlow`、`FlowNode`、`ItemSummary`

## 工作流程

1. 讀指定範圍源檔，列出必須註解的目標
2. 保留具體 JSDoc；重寫空洞 / 錯誤者；補上缺失者
3. Store：補完內部 + return，並驗證同步
4. 用 Edit 分段改，不要整檔覆寫
5. 回報：補了哪些、改了哪些、有無需確認處

## 不該做的事

- 不要改任何程式邏輯；發現 bug 只回報
- 不要為簡單 getter 硬湊 JSDoc
- 不要漏 store 的 return 同步
- 不要用 `//` 取代 JSDoc
- 不要把型別塞進 `@param` 描述
