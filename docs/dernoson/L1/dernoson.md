# dernoson — L1 Architect 兼最高負責人

**角色：** L1 Architect + 專案最高負責人
**所屬層：** L1（基礎建設層）
**橫切職責：** 跨 CR 規範守門 / PR review 把關 / historyStore 主責

---

## 1. 角色定位

身兼兩重身分：

1. **最高負責人**：對整個三層架構（L1 / L2 / L3）的邊界守門，三條硬規則的最終仲裁者
2. **L1 Architect**：與 aaaaa 共同擁有 L1 的型別、stores 結構、共用 utility 設計權

L1 內部與 aaaaa 平行決策；跨層議題（L1 ↔ L2、L1 ↔ L3）由 dernoson 拍板。

---

## 2. L1 內部分工（與 aaaaa）

aaaaa 已經把 CR-04 的型別與資料層做完，FlowEngine 主流程也由 aaaaa 領銜推進。為了避免兩個 Architect 互踩，建議分工如下（**彈性，不是硬規定**）：

| 範疇 | 建議主責 | 備援 |
|---|---|---|
| 全域型別（`FactoryNode` / `FactoryEdge` / `Machine` / `PortDef`） | aaaaa | dernoson review |
| FlowEngine 主流程、單設備輸出計算 | aaaaa | — |
| graph utility（`buildGraph` / `topologicalSort`） | aaaaa | — |
| `useHistoryStore` + `createMacroCommand` | **dernoson** | aaaaa review |
| 各 store 高階 actions「內部自動產生 Command 並入棧」規範 | **dernoson** | — |
| CR-01 / CR-02 store 骨架 | aaaaa 起手，dernoson 補 actions | 互相 review |
| CR-03 validationStore 骨架（不含 detector 本體） | dernoson | aaaaa review |
| Detector 介面定義（`Detector` / `ValidationContext`） | **dernoson**（要凍結給 shirone） | aaaaa review |
| dev-only debug 頁（FlowEngine 測試頁） | aaaaa | — |

簡言之：**aaaaa 負責「資料怎麼算」，dernoson 負責「操作怎麼記錄、規範怎麼守」。**

---

## 3. 具體負責項目

> **狀態速覽（Phase 1）**：historyStore + createMacroCommand ✅ 完成；Detector 介面已凍結 ✅；L1 各高階 action 的 Command 自動入棧規範已落地於 editorStore ✅。剩下的工作為 PR review 守門與 W001–W005 Phase 2 規劃。

### 3.1 CR-08 historyStore 守門人

`useHistoryStore` 是整個專案的 undo / redo 心臟，由 dernoson 主責。**已完成**並上線於 `src/store/historyStore.ts`，搭配 `src/lib/history/createMacroCommand.ts`。介面已凍結：

- `execute()` / `undo()` / `redo()` / `clear()` 介面已凍結
- `createMacroCommand(label, commands)` 支援巢狀組合（macro 內包 macro）
- 提供 `canUndo` / `canRedo` getter、外加 `undoDepth` / `redoDepth` 給 UI 顯示
- Session 結束自動清空（不持久化）
- 單元測試已覆蓋：基本 undo/redo、redo 佇列清空時機、macro 反向順序

實際 freeze 後的介面：

```typescript
// src/types/history.ts
export interface Command {
  label: string
  execute(): void
  undo(): void
}

// src/store/historyStore.ts
export const useHistoryStore = defineStore('history', () => {
  function execute(cmd: Command): void
  function undo(): void
  function redo(): void
  function clear(): void
  const canUndo: ComputedRef<boolean>
  const canRedo: ComputedRef<boolean>
  const undoDepth: ComputedRef<number>
  const redoDepth: ComputedRef<number>
  // ...
})

// src/lib/history/createMacroCommand.ts
export function createMacroCommand(
  label: string,
  commands: Command[]
): Command
```

### 3.2 跨 CR Command Pattern 規範守門

CR-01、CR-02、CR-05 的所有「藍圖狀態變更」**必須**由 L1 store action 內部自動產生 Command 並推入 `historyStore`。L2 只呼叫 high-level action，不負責生成 Command。dernoson 的責任：

- **設計階段**：協助 aaaaa 在每個 L1 store action 規劃時，確認內部會正確包好 Command（單一 mutation 用單一 Command；多 store 原子寫入用 `createMacroCommand` 組合）
- **L1 PR review**：檢查 store action 是否有直接 mutate state 而沒把對應 Command 推入歷史的地方
- **L1 PR review**：對「應該是 macro 但被拆成多個 Command 入棧」的情況打回
- **L1 PR review**：對「不應該進歷史的視圖操作（縮放 / 框選 / 視角切換）卻產生 Command」的情況打回
- **L2 PR review**：重點不再是「L2 有沒有自己包好 Command」，而是「L2 有沒有用對 L1 high-level action」——例如該呼叫 `addConnection` 卻自己拼一堆低階 mutation，就是錯的

### 3.3 Detector 介面凍結

**已完成**：介面凍結於 `src/types/validation.ts`，shirone 可開始批量寫 detector。實際介面：

```typescript
// src/types/validation.ts
import type { FactoryNode, FactoryEdge } from '@/types/graph'
import type { Machine } from '@/types/machine'

export type AlertLevel = 'error' | 'warning'

export interface ValidationContext {
  devices: FactoryNode[]
  connections: FactoryEdge[]
  getDef: (machineType: string) => Machine | undefined
  // 注意：不含 graph —— Phase 1 detector 經評估均不需要 graph topology，
  // 詳見 aaaaa.md §3.2
}

export interface Detector {
  code: string                // 'E001' | 'W003' | ...
  level: AlertLevel
  run: (ctx: ValidationContext) => Alert[]
}
```

凍結後，介面變更必須通知 shirone 並同步修改其已交付的 detector。

### 3.4 PR Review 重點清單

審 L1 / L2 PR 時的固定 checklist：

- [ ] L1 PR 沒有 import `.vue` / Tailwind class
- [ ] L1 PR 新增的 store action：藍圖狀態變更都已在內部自動產生 Command 並推入 `historyStore`
- [ ] L1 PR 沒有把純視覺操作（縮放 / 框選 / 視角切換）誤包成 Command
- [ ] L2 PR 沒有自己包 Command、沒有自己呼叫 `historyStore.execute()` —— 應該透過 L1 高階 action
- [ ] L2 PR 對於藍圖狀態變更都使用對應的 L1 high-level action（`placeDevice` / `moveDevices` / `rotateDevice` / `removeDevices` / `setRecipe` / `pasteSelection` / `addConnection` / `removeConnection`），而非低階拼湊
- [ ] L3 PR 沒有 `import { useXxxStore }`（grep 一次就好）
- [ ] 新增 store action 有對應單元測試（含「Command 是否正確入棧 + undo 可還原」）
- [ ] 型別變更有同步更新 `docs/dernoson/L1/L1.md` 的交付清單區塊

---

## 4. 對 L2 / L3 的介面交付責任

dernoson 是 L1 對外的窗口。具體要交付：

### 4.1 給 L2 的

- 穩定的 store actions 簽名（見 `L1.md` 第 5 節 + §8）—— 已完成、可使用
- `historyStore.undo()` / `redo()` / `canUndo` / `canRedo` / `undoDepth` / `redoDepth` 介面已凍結
  （注意：`historyStore.execute()` 與 `createMacroCommand` 為 L1 內部使用，L2 不直接觸碰）
- 「哪些操作該進歷史 / 哪些不該」的決策表（直接抄 CR-08 spec 2.2 / 2.3）——
  這份表是 L1 設計 store action 時決定「要不要在內部產生 Command」的依據

### 4.2 給 L3 的

L3 不直接接觸 L1，但 dernoson 需確保：

- L1 型別命名乾淨可直接作為 props 型別（例如 L3 的 `<DeviceCard :node="...">` 直接吃 `FactoryNode`）
- 不在型別裡塞 store-only 欄位（例如不要在 `FactoryNode.data` 裡放 `_isDirty` 之類的內部 flag）

---

## 5. 工作節奏建議

| 階段 | dernoson 重點 |
|---|---|
| Phase 1 啟動 | 先把 `useHistoryStore` + `createMacroCommand` + Detector 介面三件事凍結 |
| Phase 1 中期 | 全力 review L1 各 store 的 high-level action：是否在內部自動產生並推入正確的 Command |
| Phase 1 後期 | 開始 review L2 PR，確保 L2 都透過 L1 high-level action 操作、沒有自己包 Command 或繞過 L1 直接寫 state |
| Phase 2 起 | 把 W001–W005 的觸發時機與 W003 / W004 與 FlowEngine 結果的依賴關係釐清 |

---

*本文件為 dernoson 個人職責定義，與 aaaaa / shirone 的協作介面見 `L1.md`。*
