# 待指派任務：CR-09 配方警示（Recipe Warning）Detector 實作

**你是 azure9572，你要負責做 L1 detector 純函式**

**狀態：** 待指派，尚未動工
**類型：** 新功能（L1，比照 CR-03 shirone 的 detector 開發模式）
**相關 CR：** CR-09（配方警示，spec `09_recipe_warning.md`）；依賴 CR-01（設備配方狀態）、CR-02（管線連接狀態）、CR-03（沿用其 Alert / Detector 基礎設施）、CR-04（W002 / W003 需流量估算結果）
**相關檔案：**
- `src/types/validation.ts`（L1，已完成——`Alert` / `Detector` / `ValidationContext` 型別）
- `src/store/validationStore.ts`（L1，已完成——detector 註冊與執行框架）
- `src/composables/useValidation.ts`（L1，已完成——已在 `MainLayout.vue` 串接 editorStore watcher，detector 註冊後不需再手動觸發）
- `src/lib/validation/detectors/E001_deviceOverlap.ts`（L1，已完成——**照這個檔案的寫法**做新 detector）
- `src/data/products.ts`（`getRecipesForMachine()`，已完成）
- `src/composables/useFlowEngine.ts`（`validateRecipeMatch()`，已完成——W001 可直接複用其比對邏輯）
- `src/store/flowStore.ts`（W002 / W003 需要的流量估算結果，已完成但用法有架構問題，見第 5 節）

---

## 1. 這個任務要解決什麼

CR-03 的 detector 基礎設施（`Detector` 介面、`useValidationStore`、`useValidation` watcher）已經完成並串接進主畫面，`E001`（設備重疊）已有完整實作可作範例。但 **CR-09「配方警示」對應的 5 個 detector（E004、E005、W001、W002、W003）都還沒有任何程式碼**，只有 spec 文件。這個任務就是把 `spec/09_recipe_warning.md` 定義的規則，依 `E001_deviceOverlap.ts` 的既有模式，一個一個實作成 detector 純函式。

---

## 2. Spec 依據（`spec/09_recipe_warning.md` §2.2）

#### Error（阻斷估算，CR-04 會略過）

| 代碼 | 名稱 | 觸發條件 |
|------|------|----------|
| E004 | 輸入缺失 | 設備配方明確要求輸入時，未接入任何輸入（含部分輸入缺失，可能有多種輸入） |
| E005 | 輸出缺失 | 設備配方明確要求輸出時，未接出任何輸出（含部分輸出缺失，可能有多種輸出） |

#### Warning（不阻斷估算）

| 代碼 | 名稱 | 觸發條件 |
|------|------|----------|
| W001 | 材料組合無法處理 | 設備輸入材料組合不符配方，無法被該設備任一配方使用 |
| W002 | 輸入不足 | 管線輸入端流量不足以滿足下游所需；含輸入端缺失（視為 0） |
| W003 | 輸出阻塞 | 管線輸出端無法排出全部流量；含輸出端缺失（視為 0） |

spec 文件開頭即註明 CR-09 依賴 CR-01～CR-04，其中「CR-03 沿用其定義的 Error / Warning 顯示規格與面板呈現慣例」——也就是說 **CR-09 不需要重新設計 Alert 顯示方式，直接沿用 CR-03 已經做好的 `Alert` / `ValidationContext` 型別即可**。

---

## 3. 已有的基礎設施（可直接用，不需要重寫）

```typescript
// src/types/validation.ts
interface Detector {
  code: string
  level: 'error' | 'warning'
  run: (ctx: ValidationContext) => Alert[]
}
interface ValidationContext {
  devices: FactoryNode[]
  connections: FactoryEdge[]
  getDef: (machineType: string) => Machine | undefined
  baseRegion: BaseRegion
}
```

- 註冊方式：`validationStore.registerDetector(YourDetector)`（實際集中註冊時機由 dernoson 規劃，開發期間可在 dev 測試頁手動註冊驗證）
- `FactoryNode.data.recipeIndex` 對應 `getRecipesForMachine(machineType)[recipeIndex]`（`src/data/products.ts`），可取得該設備目前選用配方的 `inputs: RecipeItem[]` / `outputs: RecipeItem[]`
- `useFlowEngine.ts` 已經有 `validateRecipeMatch(machineType, recipeIndex, incomingItemIds: Set<string>)` 函式，判斷輸入品項組合是否符合某配方——**W001 的核心邏輯就是這個函式，可以直接 import 使用或參考其實作方式**（注意：這是 CR-04 檔案內的 export function，不是 store，import 沒有跨層問題）

照抄 `E001_deviceOverlap.ts` 的檔案結構即可起手：

```typescript
import type { Alert, Detector, ValidationContext } from '@/types/validation';

export const E004_missingInput: Detector = {
    code: 'E004',
    level: 'error',
    run(ctx: ValidationContext): Alert[] {
        const alerts: Alert[] = [];
        // ...
        return alerts;
    },
};
```

---

## 4. 這個任務的範圍（Scope）

### 4.1 E004 / E005（優先做，Phase 1，邏輯最單純）

- 對每個 `ctx.devices` 中的設備，取得其配方 `getRecipesForMachine(machineType)[recipeIndex]`
- 若配方 `inputs.length > 0` 但該設備沒有任何管線接入 → E004；`outputs.length > 0` 但沒有任何管線接出 → E005
- **需要你確認的問題**：目前 `FactoryEdge` 只有 `edge.source` / `edge.target`（設備層級），**沒有記錄接的是哪一個 port**（Vue Flow 的 `sourceHandle` / `targetHandle` 欄位目前沒有被 CR-02 寫入或至少沒有包進 `FactoryEdgeData`）。spec 寫的是「含部分輸入缺失，可能有多種輸入」，暗示理想上要能判斷「這個設備有 3 種輸入品項，只接了 2 種」這種 port 級別的缺失，但現有資料結構目前只能判斷「這個設備有沒有*任何*管線接入」。建議：
  1. 先實作「設備層級」版本（有配方要求輸入但完全沒有任何入邊 → E004），這個用現有資料結構就做得到
  2. 部分輸入缺失（多品項只接了一部分）的判斷，需要跟 CR-02 負責人（或 aaaaa/dernoson）確認 `FactoryEdge` 是否該補上 port 級別資訊，不要自己擅自更動 `FactoryEdgeData` 型別定義

### 4.2 W001（次優先，邏輯已有現成函式可用）

- 直接沿用或參考 `validateRecipeMatch()`：對每個設備，蒐集其所有入邊帶來的品項（`itemId`），若這個組合不符合該設備*任一*配方 → W001
- **注意**：`docs/shirone/DETECTOR_CHECKLIST.md` 與 `docs/shirone/README.md` 都把 W001 列在 shirone 的 CR-03 detector 清單裡（狀態「待實作」）。這代表 W001 可能已經被指派給 shirone，或至少 shirone 認為這是他的範圍。**開始做 W001 之前，請先跟 dernoson / shirone 確認歸屬**，避免兩人重工。如果談好由你接手，記得請 shirone 更新他那邊的 checklist 狀態。

### 4.3 W002 / W003（Phase 2）

- `flowStore.ts` 已經有 `congestedEdges: Set<string>`（管線輸出端流量超過下游可排出上限），概念上就是 W003 的判斷依據
- 你只需要專注在「給定流量資料時如何判斷 W002 / W003」這段偵測邏輯本身：
  - W002 輸入不足：下游需求速率 > 上游實際供給速率（含完全沒接管線，視為 0）
  - W003 輸出阻塞：可直接參考 `flowStore.congestedEdges` 的判斷邏輯
- 這個 detector 實際上會在整個計算流程的哪個時間點被呼叫、跟 FlowEngine 的執行順序怎麼安排，是後續整合時 dernoson / aaaaa 要處理的問題，**不需要你來管或事先確認**。你只要把 detector 寫成「輸入資料 → 輸出 `Alert[]`」的純函式，需要用到哪些欄位（例如流量結果）就當作 `ValidationContext` 需要補充的欄位列出來即可

### 4.4 不在這個任務範圍內

- **畫布視覺呈現**（設備紅 / 黃框、管線閃爍、tooltip）、**物件資訊面板顯示警示列表**、**產線總覽面板警示列表**——這些是 spec §2.3～§2.5 的 UI 呈現規格，目前連 CR-03 自己的 E001 都還沒接上任何實際 UI 元件（`grep` 全專案，只有 dev 測試頁 `ValidationTest.vue` 在用 `validationStore`）。這代表 UI 呈現是 CR-03 + CR-09 共用、目前完全沒人做的一塊，**不在本任務範圍**，建議另外開任務指派

---

## 5. 驗收標準（detector 本身，不含 UI）

1. `E004_missingInput.ts` / `E005_missingOutput.ts`：設備配方要求輸入 / 輸出但完全未接管線時，回傳對應 Alert；已接管線時回傳空陣列
2. `W001_unmatchedMaterial.ts`：接入品項組合不符任一配方時回傳 Alert；符合任一配方時不回傳
3. 每個 detector 至少 4 個測試案例（無設備 / 正常情況 / 觸發情況 / 邊界情況），比照 `E001_deviceOverlap` 的既有測試寫法（`src/__tests__/lib/validation/detectors/`，若尚未建立此路徑則新建）
4. `pnpm type-check` / `lint-check` / `format-check` / `test` 全過（可用 `validate-changes` skill 一次跑完）

---

## 6. 給指派者的備註

- 建議動工順序：**E004 → E005 → （跟 shirone 確認歸屬後）W001 → W002 / W003**
- azure9572 只需要專注在 detector 偵測邏輯本身（輸入資料 → 輸出 `Alert[]`）；detector 何時被呼叫、跟 FlowEngine 的執行順序如何整合，是後續由 dernoson / aaaaa 處理的整合問題，不需要 azure9572 事先確認或煩惱
- 唯一需要動工前對齊的是 **W001 的歸屬**（`docs/shirone/DETECTOR_CHECKLIST.md` 已把它列在 shirone 名下），避免兩人重工
