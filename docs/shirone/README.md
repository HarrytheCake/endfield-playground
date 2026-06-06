# shirone 工作筆記

## 你的職責

L1 Rule Contributor —— 負責 CR-03 各個 detector 純函式。  \
詳細定位見 `docs/dernoson/L1/shirone.md`。

## 既有工作已遷移到正式架構

| 原本（`origin/shirone/0522`） | 已遷移到 |
|---|---|
| `src/validation_check/overlap.ts` | `src/lib/validation/detectors/E001_deviceOverlap.ts` |
| `src/validation_check/overlap.md` | 重點已整併進上述 `.ts` 檔頭 JSDoc 中（算法草稿保留） |

差異要點：

1. **增量更新 helper（`remove_old_overlap`）已捨棄** —— 本專案 Detector 為純函式，每次 run 全量重算，不需要增量狀態管理
2. **介面對齊 `Detector`**：實作必須符合 `src/types/validation.ts` 的 `Detector` interface
3. **Alert.relatedDeviceUids 用 `string`** —— 你原本的 `id_a / id_b: number` 改為設備的 `uid: string`（對應 `FactoryNode.id`）

## 開工流程（每個 detector）

### 0. 使用 geometryUtils 工具（V5 新增）

aaaaa 已在 V5-B1 提供 `src/utils/geometryUtils.ts`，包含三個工具函式：

```typescript
import { getOccupiedCells, cellsOverlap, isWithinBaseRegion } from '@/utils/geometryUtils';

// 計算設備佔據的所有格子（考慮旋轉）
const cells = getOccupiedCells(device, def);
// 回傳 Set<"x,y">，例如 Set { "5,10", "5,11", "6,10", "6,11" }

// 檢查兩個格子集合是否有重疊
const hasOverlap = cellsOverlap(cellsA, cellsB);

// 檢查座標是否在基地範圍內（null 基地永遠回傳 true）
const inBounds = isWithinBaseRegion(x, y, canvasStore.baseRegion);
```

**E001 已使用這些函式完成實作，可作為參考範例。** 見 `src/lib/validation/detectors/E001_deviceOverlap.ts`。

### 1. 從 E001 開始（最熟悉）

E001 已完成實作草稿，展示如何：
- 使用 `getOccupiedCells` 取得設備佔據格子
- 使用 `cellsOverlap` 檢查重疊
- 處理無效 machineType 的邊界情況
- 產生 Alert 物件

測試檔案已建立於 `src/__tests__/lib/validation/detectors/E001_deviceOverlap.test.ts`，包含 H1~H8 測試案例。

**你可以直接執行測試確認邏輯正確性**：
```bash
pnpm test E001
```

### 2. 後續 detector

對每個新 detector：

```bash
src/lib/validation/detectors/E002_portTypeMismatch.ts
src/lib/validation/detectors/E003_recipeMismatch.ts
src/lib/validation/detectors/E004_illegalRouting.ts
src/lib/validation/detectors/E005_duplicateOutput.ts
src/lib/validation/detectors/E006_powerCoverage.ts
```

模板（直接 copy E001 那個檔案，把 code / level / 描述換掉）：

```typescript
import type { Alert, Detector, ValidationContext } from '@/types/validation';

export const E00X_xxx: Detector = {
    code: 'E00X',
    level: 'error', // 或 'warning'（W001~W005 屬於 warning）
    run(ctx: ValidationContext): Alert[] {
        const alerts: Alert[] = [];
        // 你的偵測邏輯
        return alerts;
    },
};
```

各 detector 的觸發條件見 `spec/03_validation.md` §2.2。

### 3. 寫單元測試

測試檔位置：`src/__tests__/lib/validation/detectors/E00X_xxx.test.ts`  \
範例骨架可參考既有的 `src/__tests__/store/validationStore.test.ts` 第 30 行附近的 `makeAlert` helper。

每個 detector 至少要測：
- Happy path（無問題時回傳空陣列）
- 觸發條件命中時回傳正確 Alert（含 code / level / relatedDeviceUids）
- 邊界情況（空 devices、單一 device、無相關連線等）

### 4. 註冊

寫完一個 detector，**先不要自動註冊**，等 dernoson 規劃集中初始化點再一起接上。  \
你可以在 dev 測試頁手動 `useValidationStore().registerDetector(YourDetector)` 驗證。

## 你不需要碰的東西

- `validationStore` 本體（dernoson + aaaaa 維護）
- `useValidation` composable（已串接 editorStore watcher，跑 detector 由它觸發）
- FlowEngine、graph utility（aaaaa 維護）
- store / UI / Vue 元件

## 接下來

1. 補完 E001 `run()` 邏輯 + 對應單元測試
2. 跑一次 `pnpm validate-all` 確認通過
3. 開 PR，dernoson 會 review detector 規則邏輯
4. 接續 E002 → E006
