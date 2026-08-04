

# CR-03 統一碰撞偵測器實作計畫 (E001 + E002)

> **2026-08-04 更新紀錄 (Re-evaluation Log)**:
> 1. **移除錯誤分類職責**：偵測器只負責輸出「哪些物件發生了碰撞」，不再自行判斷是 `E001` 還是 `E002`，後續由處理端根據物件類型自行決定 Error 代碼。
> 2. **適配歐幾里得空間座標**：基於 `src/types/euclideanSpace.ts`，物件的 `position` 與 `size` 統一採用 `Position` (`number[]`) 陣列結構。陣列索引將改以迴圈方式動態存取。
> 3. **拿到的就是原始座標**：不要再math.floor了!!
> 4. **要return的東西是 list of objects.id**
> 5. **不要管E003**

基於 `spec/03_validation.md` 最新重估紀錄，我們不再分開實作 E001 (設備重疊) 和 E002 (佈線違法)，而是透過一個**全局多維空間索引**一次解決。

## 1. 核心演算法 (多維陣列 Spatial Grid)

既然這是純幾何的格子，我們完全拋棄 `Map` 和雜湊，直接採用最直覺的 **多維陣列** 來表示整個場景的空間。
陣列的維度層級對應了 `Position` 的長度（如 `[x, y, z]`）。最深處存放該格子的物件 ID 陣列。
```ts
// 由於 Position 是一維數值陣列 (number[])
// 格式: allgrid[pos[0]][pos[1]]...[pos[n-1]] = [物件 ID, 物件 ID, ...]
const allgrid: any[] = [];
// 記錄發生碰撞的物件組合，例如 [{ id1: 'furnace_1', id2: 'pipe_1' }]
const collisions: Array<{id1: string, id2: string}> = [];
```

## 2. 執行流程

1. **收集所有物件佔用的空間格子**：
   - 遍歷所有 `ctx.devices`，用 `getMachineOccupiedGrids(device, def)` 拿到 `Position[]` (即 `number[][]`)。
   - 遍歷所有 `ctx.connections`，用 `getPipelineOccupiedGrids(points)` 拿到 `Position[]`。
2. **填入多維陣列並偵測碰撞**：
   - 針對每一個拿到的 `Position` (變數 `pos`)，以迴圈遍歷 `pos` 的每一個軸向數值，逐層存取 `allgrid`。
   - 因為 JS 陣列是動態的，如果該層維度尚未初始化，則動態賦值 `[]`。
   - 當進入到最後一個維度（代表單一格子）時，如果該格子裡面已經有其他物件的 ID，**就代表發生了空間碰撞！** 將該格子內已存在的 ID (`existingId`) 與當下存入的 ID 形成配對 `{id1: existingId, id2: entity.id}`，存入 `collisions` 陣列中。
3. **回傳碰撞結果**：
   - 走訪完後，將 `collisions` 陣列直接輸出。
   - 偵測器**不負責**判定是 `E001` 還是 `E002`，將分類工作交由上層或驗證核心處理。

## 3. 預計更動檔案

### `src/lib/validation/detectors/collisionDetector.ts` (新建)
負責實作上述的陣列碰撞邏輯，取代原本空的 `deviceOverlap.ts`。

### `src/utils/geometryUtils.ts` (更新)
將你寫好的 `getMachineOccupiedGrids` 和 `getPipelineOccupiedGrids` 整合進來。

### `src/__tests__/lib/validation/detectors/collisionDetector.test.ts` (新建)
加入測試案例，驗證 3D 陣列演算法的碰撞判定。