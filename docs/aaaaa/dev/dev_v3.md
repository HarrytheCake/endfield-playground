# dev_V3 — 主編審查技術債修正

**版本：** V3  
**建立日期：** 2026-05-22  
**負責人：** aaaaa  
**對應 TODO：** [todolist_v3.md](./todolist_v3.md)

---

## 1. 背景與動機

主編對本專案進行 code review，指出三類屬於 CR-04 負責範圍的技術問題：

| # | 指摘來源 | 問題描述 |
|---|---------|----------|
| 1 | `vite.config.ts` | 直接修改 vite 設定檔成為 vitest 入口，導致各協作者執行 `pnpm dev` 時行為異常 |
| 2 | `src/store/flowStore.ts` #97繼 | `applyResult()` payload 為內嵌匹名型別，外部呼叫者無法 import，適当限制 TypeScript 型別安全性 |
| 3 | `src/data/plans.ts` #3 #8 | 無限制數量用 `-1` 表示，語意不清晰且顏色等呼叫者容易寫出 `=== -1` 的穄魅碼 |

另有一項評論（`src/data/devices.ts` 串列名稱判斷邏輯）目前屬封鎖狀態：須等待 CR-01 確認 machine id 設計後才能對齊。

---

## 2. 技術決策

### 2.1 vitest 設定分離

| 方案 | 做法 | 優麺 |
|------|------|------|
| 方案 A（目前） | `vite.config.ts` import 自 `vitest/config`，加入 `test:{}` 區塊 | 控制集中；但整封將全團 vite 环境污染 |
| **方案 B（選擇）** | `vite.config.ts` 復原純 vite；新增 `vitest.config.ts` 兒載 test 設定 | vitest 預設自動尋找 `vitest.config.ts`，兩者完全區隔 |

選擇方案 B。

### 2.2 FlowEngineResult 型別外置

| 方案 | 做法 | 優麺 |
|------|------|------|
| 方案 A（目前） | inline type 寫在 `applyResult(payload: {...})` 參數 | 簡浔；但外部呼叫者無法 import |
| **方案 B（選擇）** | 將 type 套出為 `src/types/flow.ts` 內的 `FlowEngineResult` interface | 可被 `useFlowEngine.ts` 和未來其他 store 共用 |

選擇方案 B，放入 `src/types/flow.ts`（CR-04 主責）。

### 2.3 `null` vs `-1` 表示無限制

| 方案 | 做法 | 優麺 |
|------|------|------|
| 方案 A（目前） | `-1` 表示無限制 | 斸進就型不符（rate 应為正數），消費者容易寫出魔法數字 |
| 方案 B | `undefined` 表示無限制 | JSON 不容易表示 undefined，序列化時需額外處理 |
| **方案 C（選擇）** | `null` 表示無限制 | JSON 原生支援 `null`，型別清晰（`number \| null`），分支清晰 |

選擇方案 C（對齊主編建議）。

---

## 3. 型別設計

### 3.1 FlowEngineResult（新增，放入 `src/types/flow.ts`）

```typescript
/** flowStore.applyResult() 的 payload 型別，同時供 useFlowEngine.ts 使用 */
export interface FlowEngineResult {
    edgeFlows: Map<string, EdgeFlow>;
    nodeEfficiencies: Map<string, number>;
    itemSummary: ItemSummary[];
    sinkDeliveries: Map<string, number>;
    congestedEdges: Set<string>;
    invalidChainUids: Set<string>;
    totalPowerDemand: number;
    totalPowerSupply: number;
}
```

### 3.2 plans.ts 型別變更

```typescript
// 修改前
export interface MaterialRate {
    name: string;
    rate: number; // -1 = 無限制
}
export interface MachineLimit {
    name: string;
    limit: number; // -1 = 無限制
}

// 修改後
export interface MaterialRate {
    name: string;
    rate: number | null; // null = 無限制
}
export interface MachineLimit {
    name: string;
    limit: number | null; // null = 無限制
}
```

同步修正 `priority_products.max_rate`：
```typescript
priority_products: { name: string; max_rate: number | null }[];
```

---

## 4. 檔案修改計畫

| 檔案 | 動作 | 說明 |
|------|------|------|
| `vite.config.ts` | **修改** | 移除 `import from 'vitest/config'` 與 `test:{}` 區塊，改回純 vite |
| `vitest.config.ts` | **新增** | 承接原 test 設定 |
| `src/types/flow.ts` | **修改** | 新增 `FlowEngineResult` interface |
| `src/store/flowStore.ts` | **修改** | `applyResult` payload 改用 `FlowEngineResult` |
| `src/composables/useFlowEngine.ts` | **修改** | `applyResult` 呼叫處加入型別 |
| `src/data/plans.ts` | **修改** | interface 改 `null`，資料 `-1` 改 `null` |
| `src/editor/stats/ProductionStats.vue` | **修改** | `=== -1` 判斷改為 `=== null` |
| `src/data/devices.ts` | **不動**（封鎖） | 待 CR-01 machine id 定義後再對齊 |

---

## 5. 遷移說明

### `-1` → `null` 轉換規則

| 位置 | 變更 |
|------|------|
| `MaterialRate.rate` 型別 | `number` → `number \| null` |
| `MachineLimit.limit` 型別 | `number` → `number \| null` |
| `priority_products.max_rate` 型別 | `number` → `number \| null` |
| plans 資料內 `-1` 全數 | 改為 `null` |
| `ProductionStats.vue` `=== -1` | 改為 `=== null` |
| `ProductionStats.vue` `allocated.toFixed(0)` | 加 null guard：`allocated !== null` 才呼叫 `.toFixed` |

---

## 6. 開發日誌

### 2026-05-22
- V3 規劃建立，來源為主編對 V1/V2 的 code review 回饋
- 對各項指摘進行 CR-04 範圍分析，排除不屬於本 CR 的項目
- `devices.ts` 串列名稱判斷問題標記為封鎖，等待 CR-01 machine id 介面定義
