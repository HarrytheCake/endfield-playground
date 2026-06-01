# V3 TODOLIST — 主編審查技術債修正

**版本：** V3  
**建立日期：** 2026-05-22  
**負責人：** aaaaa  
**對應開發文件：** [dev_v3.md](./dev_v3.md)

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## V3-A｜vitest.config.ts 分離（無外部依賴）

> 主編指定：禁止修改 `vite.config.ts`，應另建 `vitest.config.ts`

- [x] **V3-A1** 復原 `vite.config.ts`
  - 將 `import { defineConfig } from 'vitest/config'` 改回 `import { defineConfig } from 'vite'`
  - 移除 `test: { environment, globals, alias }` 區塊

- [x] **V3-A2** 新增 `vitest.config.ts`
  - `import { defineConfig } from 'vitest/config'`
  - 承接原有 `test: { environment: 'node', globals: true, alias: { '@': ... } }` 內容
  - 不重複定義 plugins（vitest 會自行尋找 vite.config 中的 plugins）

- [x] **V3-A3** 驗證 `pnpm test --run` 仍能全數通過（24/27 或以上）

---

## V3-B｜FlowEngineResult 型別外置（無外部依賴）

> 主編指定：`src/store/flowStore.ts` #97繼 payload type 應展到 store 外部

- [x] **V3-B1** `src/types/flow.ts` 新增 `FlowEngineResult` interface
  - 轉移 `applyResult` payload 的 7 個欄位为命名 interface
  - 同檔新入，於現有 `ItemSummary`、`EdgeFlow` 之後

- [x] **V3-B2** `src/store/flowStore.ts` 修正 `applyResult` 參數型別
  - `applyResult(payload: { ... })` 改為 `applyResult(payload: FlowEngineResult)`
  - 新增 `import type { ..., FlowEngineResult } from '@/types/flow'`

- [x] **V3-B3** `src/composables/useFlowEngine.ts` 加入型別
  - `runFlowEngine` 內部組議結果物件實密加上 `FlowEngineResult` 型別標註（非強制，將 `const result: FlowEngineResult = { ... }` 方式組織）

---

## V3-C｜plans.ts `-1` → `null`（無外部依賴）

> 主編指定：無限制不應使用 `-1`，改用 `null`

- [x] **V3-C1** `src/data/plans.ts` 型別修正
  - `MaterialRate.rate: number` → `rate: number | null`
  - `MachineLimit.limit: number` → `limit: number | null`
  - `priority_products.max_rate: number` → `max_rate: number | null`

- [x] **V3-C2** `src/data/plans.ts` 資料內全面替換
  - 所有 `rate: -1` 改為 `rate: null`
  - 所有 `limit: -1` 改為 `limit: null`
  - 所有 `max_rate: -1` 改為 `max_rate: null`

- [x] **V3-C3** `src/editor/stats/ProductionStats.vue` 下游修實
  - `=== -1` 全面改為 `=== null`
  - `.toFixed(0)` 調用需加 null guard：`allocated !== null ? allocated.toFixed(0) : '∅'`
  - `remaining === -1` 改為 `remaining === null`
  - `machineCountClass(used, limit)` 中 `limit === -1` 改為 `limit === null`

- [x] **V3-C4** `src/composables/useFlowEngine.ts` 檢查是否有間接依賴 `-1`
  - FlowEngine 目前不直接讀取 plans.ts，預期無需修改；確認後標記

---

## V3-D｜品質驗證（依賴 V3-A、V3-B、V3-C）

- [x] **V3-D1** `pnpm type-check` 零錯誤
- [x] **V3-D2** `pnpm test --run` 全數通過（27 條不變）
- [x] **V3-D3** `pnpm lint-check` 零警告
- [x] **V3-D4** `pnpm format-check` 通過

---

## V3-E｜封鎖項目（等待外部依賴）

- [!] **V3-E1** `src/data/devices.ts` 查詢邏輯去字串屬名比對
  - 目前 `getRecipesForMachine(machineName)` 與 `r.machine === machineName` 均使用字串
  - 待 CR-01 定義 machine id / enum 後，將 `RecipeDef.machine` 由字串改為 id 型
  - **目前以 stub 實作維持現狀**，不需修改

---

## 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 預計解除 |
|----|---------|---------|----------|
| V3-E1 | `RecipeDef.machine` 目前為字串，需 machine id enum 確定後才能改為 id 型比對 | CR-01 machine id 設計 | CR-01 介面確認後 |
