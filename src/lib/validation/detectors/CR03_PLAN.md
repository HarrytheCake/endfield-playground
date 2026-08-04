# CR-03 統一碰撞偵測器實作計畫 (E001 + E002)

> **2026-08-04 更新紀錄 (Re-evaluation Log)**:
> 1. **修正演算法缺陷**：原本僅使用 `Set<string>` 收集 ID，會導致遺失「誰和誰撞在一起」的配對資訊。改為儲存碰撞組合 `Array<{id1, id2}>`。
> 2. **移除錯誤分類職責**：偵測器只負責輸出「哪些物件發生了碰撞」，不再自行判斷是 `E001` 還是 `E002`，後續由處理端根據物件類型自行決定 Error 代碼。

基於 `spec/03_validation.md` 最新重估紀錄，我們不再分開實作 E001 (設備重疊) 和 E002 (佈線違法)，而是透過一個**全局 3D 空間索引**一次解決。

## 1. 核心演算法 (多維陣列 Spatial Grid)

既然這是純幾何的格子，我們完全拋棄 `Map` 和雜湊，直接採用最直覺的 **3D 陣列 (3D Array)** 來表示整個場景的空間。
陣列的索引 (Index) 本身就對應了座標的 `x, y, z`，裡面存放該格子的物件 ID。
```ts
// 格式: allgrid[x][y][z] = [物件 ID, 物件 ID, ...]
const allgrid: string[][][][] = [];
// 記錄發生碰撞的物件組合，例如 [{ id1: 'furnace_1', id2: 'pipe_1' }]
const collisions: Array<{id1: string, id2: string}> = [];
```

## 2. 執行流程

1. **收集所有物件佔用的 3D 格子**：
   - 遍歷所有 `ctx.devices`，用 `getMachineOccupiedGrids(device, def)` 拿到 `[x,y,z][]`
   - 遍歷所有 `ctx.connections`，用 `getPipelineOccupiedGrids(points)` 拿到 `[x,y,z][]`
2. **填入 3D 陣列並偵測碰撞**：
   - 針對每一個拿到的 `[x,y,z]`，直接存取 `allgrid[x][y][z]`。
   - 因為 JS 陣列是動態的，如果該維度尚未初始化，則動態建立 `[]`。
   - 如果該格子裡面已經有其他物件的 ID，**就代表發生了 3D 立體碰撞！** 將該格子內已存在的 ID (`existingId`) 與當下存入的 ID 形成配對 `{id1: existingId, id2: entity.id}`，存入 `collisions` 陣列中。
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
