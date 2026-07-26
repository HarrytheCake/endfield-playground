# 待指派任務：CR-03 管線碰撞偵測（E002 佈線違法）

**你是 shirone，繼續你的設備擺設衝突偵測（CR-03），這次專注在管線碰撞**

**狀態：** 待指派，尚未動工
**類型：** L1 detector（延續 E001 的模式）
**相關 CR：** CR-03（擺設位置衝突，spec `03_validation.md` §2.2 / §2.2.1）
**相關檔案：**
- `src/lib/validation/detectors/E001_deviceOverlap.ts`（已完成，這次的參考範本）
- `src/utils/geometryUtils.ts`（已完成 `getOccupiedCells` / `cellsOverlap` / `isWithinBaseRegion`，這次需要擴充）
- `src/types/graph.ts`（`FactoryEdgeData`：`portType` / `bendPoints`）
- `src/editor/canvas/PipelineEdge.vue`（管線路徑如何從 `bendPoints` 畫出來，供你理解座標結構）
- `src/store/canvasStore.ts`（`gridSize`，pixel ↔ 格子座標換算基準）
- `src/data/machines.ts`（設備 tags，`分流器` / `物流橋` / `匯流器` 等物流設備定義）

---

## 1. 這個任務要解決什麼

E001（設備重疊）你已經完成。CR-03 剩下的 Error 還有 **E002「佈線違法」**：管線路徑經過的格子，若與該格已佔用物件有「佔用層交集」，就算違法佈線。目前 `src/lib/validation/detectors/` 底下完全沒有這個 detector，這次任務就是把它做出來。

**注意**：E003（超出基地框線）不在這次任務內——那個依賴 `canvasStore.baseRegion` 選擇 UI，目前指派給 toby 的任務還在 wiring 階段，等他那邊做完 UI 之後再排 E003。這次請專注在 E002。

---

## 2. Spec 依據（`spec/03_validation.md` §2.2 / §2.2.1）

| 代碼 | 名稱 | 觸發條件 |
|------|------|----------|
| E002 | 佈線違法 | 管線路徑經過的格子上，與該格已佔用物件的佔用層有交集（非物流橋，見 §2.2.1） |

E002 判定不是單純的格子重疊，而是要套用 **§2.2.1 高度層與立體碰撞判定**：

```
occupiedLayers(obj) = h === 1 ? {0, 1} : {z}
```

- **z（物理層）**：`0` 地面層、`1` 空中層
- **h（貫穿旗標）**：`1` 表示不論本體在哪層都同時佔滿 `{0,1}`；`0` 表示只佔自己的 `z` 層

| 物件 | z | h | 佔用層 |
|------|---|---|--------|
| 一般設備（大部分設備） | 0 | 1 | {0, 1} |
| 傳送帶本體 | 0 | 0 | {0} |
| 水管本體 | 1 | 0 | {1} |
| 貨物取出口 / 存入口、供貨源樁 | 0 | 0 | {0} |
| 傳送帶的分流器 / 匯流器 / 物流橋 | 0 | 0 | {0} |
| 水管的分流器 / 匯流器 / 物流橋（中介橋） | 0 | 1 | {0, 1} |

兩物件同格時，`occupiedLayers(A) ∩ occupiedLayers(B)` 非空才算衝突（觸發 E002）；例如水管（{1}）穿過傳送帶（{0}）不衝突，但水管穿過一般設備（{0,1}）就衝突。

---

## 3. 已有的基礎設施（可直接用）

`E001_deviceOverlap.ts` 的骨架直接照抄：

```typescript
import type { Alert, Detector, ValidationContext } from '@/types/validation';

export const E002_illegalRouting: Detector = {
    code: 'E002',
    level: 'error',
    run(ctx: ValidationContext): Alert[] {
        const alerts: Alert[] = [];
        // ...
        return alerts;
    },
};
```

`geometryUtils.ts` 現有的 `getOccupiedCells(device, def)` / `cellsOverlap(cellsA, cellsB)` 可以繼續沿用「設備佔了哪些格子」這部分，但**目前完全沒有處理 z/h 圖層**（單純比對 (x,y) 是否重疊），你這次需要在 `geometryUtils.ts` 補上：

1. **`occupiedLayers(z, h)` 或等效判斷函式**：把 §2.2.1 的公式寫成可重用的工具（新函式，目前不存在）
2. **管線路徑轉格子座標的工具**（目前不存在）：你收到的管線資訊會是很純粹的座標陣列 `[<起點座標>, <彎折點座標>, ..., <終點座標>]`（pixel 座標，對應 `FactoryEdge.data.bendPoints` 補上起點終點後的完整路徑），各段落已保證為純水平 / 純垂直（見 `PipelineEdge.vue` 註解，CR-02 §2.3 已驗證）。你需要一個類似 `getPipelineOccupiedCells(points, gridSize)` 的函式，依序走過這個座標陣列，把每一段直線依 `canvasStore.gridSize` 換算並列舉出所有經過的格子

---

## 4. 這個任務的範圍（Scope）

### 4.1 資料缺口（已排定由 aaaaa 處理，不需要你煩惱）

目前 `Machine` 型別（`src/types/machine.ts`）還沒有 `z` / `h` 欄位，`src/data/machines.ts` 的設備資料也還沒標註誰是「傳送帶分流器」「水管分流器」。§2.2.1 那張表格對應的資料，**aaaaa 會負責新增 `z` / `h` 欄位並回填 `machines.ts`**，你不需要自己決定要不要擴充型別、也不需要去跟人協調這件事。

- 動工當下如果 `z` / `h` 欄位還沒補齊，你可以先用 `ctx.getDef(machineType)` 讀資料時做防呆（欄位不存在時用簡化預設值，例如一般設備視為 z=0/h=1、管線本體依 `portType` 判斷），detector 邏輯先寫、之後欄位補齊只需要換成真實讀值，不需要重寫判定邏輯本身

### 4.2 detector 邏輯本身

- 對每條 `ctx.connections`（`FactoryEdge`）：算出其路徑經過的所有格子（含其 z/h，依 `portType` 決定）
- 對每個 `ctx.devices`：算出其佔用格子（沿用 `getOccupiedCells`，含其 z/h）
- 同一格子上，管線與設備的 `occupiedLayers` 有交集 → 產生 E002 Alert（`relatedConnectionUids` 放該管線 uid，`relatedDeviceUids` 放被穿越的設備 uid）
- **管線與管線之間的碰撞，套用同一套 `occupiedLayers` 判定、產生同樣的 E002 Alert**（不是獨立代碼）：兩條管線路徑同格時，一樣算 `occupiedLayers(A) ∩ occupiedLayers(B)`，非空即衝突（例如水管路徑與傳送帶路徑同格不衝突，兩條水管路徑同格則衝突）。這種情況 `relatedConnectionUids` 放兩條管線 uid，`relatedDeviceUids` 為空
- 你只需要專注在偵測邏輯本身（輸入資料 → 輸出 `Alert[]`），不用管這個 detector 何時被呼叫、跟 FlowEngine 的執行順序怎麼安排，那是後續整合的事

### 4.3 不在這個任務範圍內

- **E003（超出基地框線）**：等 toby 的基地選擇 UI 做完再排
- **W001（材料組合無法處理）**：你的 `docs/shirone/DETECTOR_CHECKLIST.md` 之前把它列在你名下，但這次另外指派給 azure9572 做 CR-09 配方警示時也把它列進去了，**兩邊重疊，需要你們兩人（或找 dernoson）對齊歸屬**，這次任務先不用管

---

## 5. 驗收標準

1. 手動繪製一條穿越一般設備（h=1）的管線路徑，確認觸發 E002
2. 水管路徑穿越傳送帶本體 / 貨物取出口 / 供貨源樁所在格子，確認**不**觸發 E002（層交集為空）
3. 水管路徑穿越一般設備，確認觸發 E002
4. 兩條水管路徑交會於同一格子，確認觸發 E002；水管路徑與傳送帶路徑交會於同一格子，確認**不**觸發（層交集為空）
5. 至少 4 個測試案例（無管線 / 正常不衝突 / 觸發衝突 / 邊界情況：例如管線恰好貼著設備邊緣不重疊），比照 `E001_deviceOverlap.test.ts` 寫法，並涵蓋管線對管線的情境
6. `pnpm type-check` / `lint-check` / `format-check` / `test` 全過（`validate-changes` skill 一次跑完）

---

## 6. 給指派者的備註

- `Machine` 的 z/h 欄位由 aaaaa 負責新增與回填，shirone 不用等，先用簡化預設值把偵測邏輯寫好，欄位到位後再切換讀值即可
- W001 目前兩份指派文件都提到，需要 dernoson 出面拍板歸屬（see `docs/azure9572/MILESTONE_0726.md` 第 6 節）
