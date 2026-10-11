# V15-C1 — 出界 id 列表（`devicesOutsideBase`｜W1004-A0 ②）

**對應工項：** V15-C1
**狀態：** `[x]` 完成（2026-10-10）
**日期：** 2026-10-10
**依賴：** [A1](./A1_scope_decision.md) `[x]`、[B1](./B1_v14_residue_close.md) `[x]`
**正式工單：** [W1004-A0 §1](../../../work_dispatch/aaaaa/1004/W1004-A0_dispatch_and_e003.md)
**對照公開驗收：** WEEK §0.2 **V10**
**開發分支：** `dev/aaaaa1004`
**產物：** `src/utils/layout/devicesOutsideBase.ts`、`src/__tests__/utils/layout/devicesOutsideBase.test.ts`

---

## 1. 背景與動機

舊路徑 `isDeviceWithinBaseRegion` 吃 `FactoryNode`＋`canvasStore` 基地列舉。新模型要一支吃 `PlacedDevice[]` 的**列表**函式，供 toby 標框外 Error。

**出界 ≠ 不可放置。** `canPlaceDevice` 繼續只擋重疊等既有條件；出界只是視覺 Error（spec／#57 S2-2）。

---

## 2. 技術決策

| 決定 | 理由 |
|------|------|
| 簽章 | `devicesOutsideBase(devices, region, getMachine?) → string[]` |
| 純函式、不寫 store | 工單明文；L2 可任意呼叫 |
| 佔格共用 `getDeviceOccupiedCells`＋`toDeviceFootprint` | 禁止第二套佔格 |
| 基地範圍共用 `isWithinBaseRegion` | 與舊 E003 幾何一致 |
| 「出界」定義 | 設備任一佔格不在基地內 → id 進列表 |
| **不改** `canPlaceDevice`／`addDevice` | 本項零碰 store／placementCheck |

### 2.1 `region` 型別（實作選定）

參數用 `BaseRegion`（`@/store/canvasStore` 型別＋`BASE_REGION_SIZES` 經 `isWithinBaseRegion`）。  
與既有 `geometryUtils.ts` 相同依賴方向（**型別／常數，非 Pinia runtime**）。`region === null` → `[]`。

### 2.2 未知機型

查不到定義 → **略過**（對齊 `collectPortAnchors`）。

---

## 3. 檔案修改計畫

| 動作 | 檔案 |
|------|------|
| 新建 | `src/utils/layout/devicesOutsideBase.ts` |
| 新建 | `src/__tests__/utils/layout/devicesOutsideBase.test.ts` |
| **不碰** | `placementCheck.ts`、`layoutStore.ts`、`GridCanvas.vue`、`canPlaceDevice` |

---

## 4. 測試計畫

| # | 案例 | 狀態 |
|---|------|------|
| 1 | 全在基地內 → `[]` | `[x]` |
| 2 | 一台部分出界 → 含該 id | `[x]`（filling 6×4 @ x=251） |
| 3 | 一台完全出界 → 含該 id | `[x]` |
| 4 | 多台混合 → 僅出界者（輸入序） | `[x]` |
| 5 | 旋轉後佔格出界 | `[x]`（6×4 @ y=252 rot1） |
| 6 | 未知機型略過 | `[x]` |
| — | `null` 基地 → `[]`；valley4 邊界 | `[x]` |

回歸：`placementCheck`＋`layoutStore` 測試與本項同跑 **55 passed**；本項 diff 不含它們。

---

## 5. 驗證標準（DoD）

- [x] 匯出 `devicesOutsideBase`；JSDoc 註明「僅列表／不擋落子」
- [x] 無 Pinia／store 寫入；無 `editorStore` import
- [x] §4 測試覆蓋
- [x] `canPlaceDevice`／`addDevice` 未改
- [x] 相關 `vitest` 綠
- [x] 給 toby 一句（見下）

### 5.1 給 toby（PR／USAGE）

```text
devicesOutsideBase(devices, canvasStore.baseRegion) → string[]
把回傳 id 對上畫布設備上 Error 樣（如 class out-of-base）。
不要把出界寫進 canPlaceDevice；null 基地回 []。
```

---

## 6. 開發日誌

### 2026-10-10｜完成

- 實作＋8 則測試全綠；回歸 placementCheck／layoutStore 未改且綠
- 下一刀＝V15-D1 `hitTestPortAt`

### 2026-10-10

- 建檔；對齊 W1004-A0 ②；待實作
