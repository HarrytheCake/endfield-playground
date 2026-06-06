# shirone — L1 Rule Contributor

**角色：** L1 Rule Contributor（規則貢獻者）
**所屬層：** L1（基礎建設層）
**主責範疇：** CR-03 各個 detector 純函式

---

## 1. 角色定位

shirone 是學生，對數學與寫程式都有基礎，目前已寫過一些 CR-03 邏輯。在 L1 中扮演「規則貢獻者」：**只負責 detector 純函式**，**完全不碰 Vue / Pinia / store 結構 / UI / FlowEngine utility 本體**。

這個分工的好處：
- 每個 detector 是獨立檔案、互不阻塞，可以並行開發
- 純函式可單獨單元測試，不需要跑整個 Pinia 環境
- 介面由 Architect 凍結後，shirone 不會被上游變動影響

**寫程式時看到的世界**：

```typescript
// shirone 的工作只有這個形狀的純函式：
const detector: Detector = {
  code: 'E001',
  level: 'error',
  run: (ctx: ValidationContext): Alert[] => {
    // ... 純邏輯：input → output
    return []
  }
}
```

不會出現 `ref` / `computed` / `defineStore` / `useXxxStore` / `import 'vue'`。如果寫到某一步覺得「需要拿 store 的東西」或「需要 Vue 反應性」，那是介面設計問題，回頭找 dernoson 或 aaaaa 補 `ValidationContext`。

---

## 2. Detector 介面約定（已凍結）

介面已凍結於 `src/types/validation.ts`（**不是** `src/lib/validation/types.ts`），實際內容：

```typescript
import type { FactoryNode, FactoryEdge } from '@/types/graph'
import type { Machine } from '@/types/machine'

export type AlertLevel = 'error' | 'warning'

export interface Alert {
  uid: string
  level: AlertLevel
  code: string
  message: string
  relatedDeviceUids: string[]
  relatedConnectionUids: string[]
}

export interface ValidationContext {
  devices: FactoryNode[]
  connections: FactoryEdge[]
  getDef: (machineType: string) => Machine | undefined
  // 幾何 helper 視 detector 需求由 aaaaa 補上（如 getOccupiedCells）
}

export interface Detector {
  code: string                // 'E001' | 'W003' | ...
  level: AlertLevel
  run: (ctx: ValidationContext) => Alert[]
}
```

> 原計劃 `ValidationContext` 含 `graph: DirectedGraph` 欄位，但實際評估 E001~E006 detector 均不需要 graph topology（見 `aaaaa.md` §3.2）。若未來新 detector 真的需要 graph 結構，再由 aaaaa 從 `useFlowEngine.ts` 暴露對應 helper 加入 context。

**注意**：原規劃的 `PlacedDevice` / `Connection` 型別實際命名為 `FactoryNode` / `FactoryEdge`（對齊 Vue Flow 慣例），detector 內存取 device 屬性時請走 `node.data.machineType` / `node.data.recipeIndex` / `node.data.rotation` / `node.position.x` / `node.position.y`。

每個 detector 一個檔案，路徑與命名規則：

```
src/lib/validation/detectors/
  E001_deviceOverlap.ts
  E002_portTypeMismatch.ts
  E003_recipeMismatch.ts
  E004_illegalRouting.ts
  E005_duplicateOutput.ts
  E006_powerCoverage.ts
  W001_missingInput.ts
  W002_unconnectedOutput.ts
  ...
```

檔案結構固定如下（E001 骨架已建立，可參考）：

```typescript
// src/lib/validation/detectors/E001_deviceOverlap.ts
import type { Detector, Alert } from '@/types/validation'

export const E001_deviceOverlap: Detector = {
  code: 'E001',
  level: 'error',
  run: (ctx) => {
    const alerts: Alert[] = []
    // ... 純函式邏輯（目前為 stub，等 shirone 補）
    return alerts
  }
}
```

---

## 3. 工作流程

> **目前進度**：E001 已從 `origin/shirone/0522` 遷移為 `src/lib/validation/detectors/E001_deviceOverlap.ts` 的骨架（介面對齊新版 `ValidationContext`），但 `run()` 內邏輯仍為 stub，等 shirone 補上實際碰撞偵測。E002~E006、W001~W005 皆未開始。
>
> 上手前建議先讀 `docs/shirone/README.md` 的引導，再回來看本檔。

### 3.1 每個 detector 一個 PR

- 一個檔案、一個單元測試、一個 PR
- PR 之間互不依賴，可以同時開十個 PR 不會卡彼此
- PR 描述標明：detector code、觸發條件（抄 spec 表格）、單測覆蓋情境

### 3.2 不需要動的東西

shirone **完全不需要**改下面這些（要改就找 Architect）：

| 不要動 | 為什麼 |
|---|---|
| `useValidationStore` 內部結構 | Architect 負責 |
| `Alert` 型別 | dernoson 負責 |
| `FlowGraph` / `buildGraph` / `topologicalSort` 內部（住在 `useFlowEngine.ts`） | aaaaa 負責，detector 只是消費者（且多數 detector 不會用到） |
| Detector 註冊機制（怎麼把 detector 串進 store） | Architect 負責 |
| 任何 `.vue` 檔案、UI、警示列表畫面 | L2 / L3 負責 |

### 3.3 如果發現 ValidationContext 不夠用

例如某個 detector 需要 `getOccupiedCells(device, def)` 之類的 helper，但 `ValidationContext` 沒提供：

1. **不要**在 detector 裡自己 reimplement
2. 在 PR / issue 提出：「W004 需要 X helper，建議放在 `@/utils/geometry`」
3. 由 aaaaa 補完 helper，再 merge 你的 detector

這個流程確保 utility 是共用的、單一來源的。

---

## 4. Phase 1 要做的 Detectors（E001–E006）

對應 `spec/03_validation.md` 第 2.2 節 Error 區塊：

| 代碼 | 名稱 | 主要邏輯 | 估計難度 | 狀態 |
|---|---|---|---|---|
| **E001** | 設備重疊 | 對每個 device 算 occupied cells，用 Map<"x,y", uid> 偵測碰撞 | 低 | 骨架已建立（stub），邏輯待補 |
| **E002** | 接口 type 不符 | 對每條 connection，比較 from / to 兩端 port 的 type | 低 | 未開始 |
| **E003** | 配方不符 | 對每條 connection，比較 from 端輸出 item 與 to 端 activeRecipe 所需 item | 中 | 未開始 |
| **E004** | 佈線違法 | 對每條 connection 的線段，檢查是否穿越任何 device 的格子（排除物流橋情境） | 中 | 未開始 |
| **E005** | 接口重複連接 | 對每個 device port，數 `connections.filter(c => c.from === port).length`，>1 即觸發（除非經分流器，這要看 autoNodes 旗標） | 中 | 未開始 |
| **E006** | 未在供電範圍內 | 取所有供電樁的 n×n 覆蓋格聯集；對非電力類設備，檢查是否至少有一格在聯集內 | 中 | 未開始 |

實作前務必看清楚 spec 4.2 對應的範例（E001、E006 都有完整範例可參考）。

---

## 5. Phase 2 要做的 Detectors（W001–W005）

對應 `spec/03_validation.md` 第 2.2 節 Warning 區塊：

| 代碼 | 名稱 | 額外依賴 |
|---|---|---|
| W001 | 輸入缺失 | 無額外依賴 |
| W002 | 輸出未接 | 無額外依賴 |
| W003 | 堵塞風險 | **依賴 FlowEngine 結果**（需要 edge 的實際 rate） |
| W004 | 效率不足 | **依賴 FlowEngine 結果**（需要 nodeEfficiencies） |
| W005 | 總耗電超載 | 加總比較即可 |

W003 / W004 需要 FlowEngine 跑完才能算，因此這兩個 detector 的執行時機要與 Architect 對齊（可能要分兩階段驗證：先跑 W001/W002/W005，再跑 FlowEngine，再跑 W003/W004）。Phase 2 啟動時再討論。

W003 / W004 需要 FlowEngine 跑完才能算，因此這兩個 detector 的執行時機要與 Architect 對齊（可能要分兩階段驗證：先跑 W001/W002/W005，再跑 FlowEngine，再跑 W003/W004）。Phase 2 啟動時再討論。

---

## 6. 單元測試建議

每個 detector 至少要涵蓋：

1. **空輸入**：`devices: [], connections: []` → 不該 throw、回傳 `[]`
2. **正向情境**：構造 1–2 個會觸發的最小場景 → 確認回傳的 Alert.code 正確
3. **負向情境**：構造看似會觸發但不該觸發的場景 → 確認回傳 `[]`
4. **邊界**：例如 E001 對齊但不重疊、E006 設備剛好擦邊覆蓋一格

測試檔位置：`src/__tests__/validation/detectors/E001_deviceOverlap.test.ts`

範例骨架：

```typescript
// E001_deviceOverlap.test.ts
import { describe, it, expect } from 'vitest'
import { E001_deviceOverlap } from '@/lib/validation/detectors/E001_deviceOverlap'
import { makeCtx } from '@/__tests__/helpers/makeValidationCtx'

describe('E001 設備重疊', () => {
  it('完全不重疊時回傳空陣列', () => {
    const ctx = makeCtx({
      devices: [
        { uid: 'a', deviceId: 'refinery', x: 0, y: 0, rotation: 0, activeRecipe: null },
        { uid: 'b', deviceId: 'refinery', x: 5, y: 0, rotation: 0, activeRecipe: null }
      ]
    })
    expect(E001_deviceOverlap.run(ctx)).toEqual([])
  })

  it('兩台 3x3 完全重疊回傳一個 Alert', () => {
    // ...
  })
})
```

`makeValidationCtx` helper 由 Architect 預先放好，shirone 直接 import 就能用。

---

## 7. 工作節奏建議

| 順序 | 工項 | 依賴 | 狀態 |
|---|---|---|---|
| 1 | 等 dernoson 凍結 `Detector` / `ValidationContext` 介面 | dernoson | ✅ 已完成 |
| 2 | 等 aaaaa 完成 `buildGraph` 與幾何 helper | aaaaa | `buildGraph` ✅；幾何 helper 視 detector 需求補 |
| 3 | 先做 E001（最簡單，當作介面熟悉） | — | 進行中（骨架已建立，待補邏輯） |
| 4 | E002 / E005（純 port 比對） | — | 未開始 |
| 5 | E006（需要 occupied cells helper） | 第 2 項完成 | 未開始 |
| 6 | E003 / E004（規則比較複雜，留到熟悉之後） | — | 未開始 |
| 7 | Phase 2 起做 W001 / W002 / W005 | — | 未開始 |
| 8 | W003 / W004（等 FlowEngine 穩定） | Phase 2 中後期 | 未開始（FlowEngine 已穩定，可隨時開工） |

---

*本文件為 shirone 個人職責定義，與 Architect 的協作介面見 `L1.md`。*
