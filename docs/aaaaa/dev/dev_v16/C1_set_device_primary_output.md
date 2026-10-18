# V16-C1 — `setDevicePrimaryOutput`（W1011-A0 ②）

**對應工項：** V16-C1
**狀態：** `[x]` 完成（2026-10-18）
**日期：** 2026-10-18
**依賴：** [A1](./A1_scope_decision.md) `[x]`、[B1](./B1_v15_residue_close.md) `[x]`
**正式工單：** [W1011-A0 §1](../../../work_dispatch/aaaaa/1011/W1011-A0_c5_primary_output.md)、[C5 §4.1–4.2](../../../roadmap/detail/C5_source_primary_output.md)
**對照公開驗收：** WEEK §0.2 **V8**
**開發分支：** `dev/aaaaa1011`
**產物：** `src/store/layoutStore.ts`（新增 action）、對應 `__tests__`

---

## 1. 背景與動機

引擎正向傳播從源節點 `primaryOutput × sourceRatePerMin` 起算。型別與 `toTopology` 映射已有，缺的是正式畫布**寫入路徑**。沒有 action，源設備永遠產不出數字；10/18 引擎讀也無欄可讀。

本項只交 L1 寫入端；UI／引擎改掛不在範圍。

---

## 2. 契約

```typescript
/**
 * 設定源設備的主要產出物與速率。
 * 寫入 layoutStore 的 PlacedDevice；進歷史。
 * 未知／重複 uid → 靜默 no-op，且不進歷史（不 throw）。
 */
function setDevicePrimaryOutput(
  uid: string,
  /** 基礎材料 id；傳 null 表示清除設定 */
  itemId: string | null,
  /** 每分鐘產出；省略時預設 30 */
  ratePerMin?: number,
): void
```

| 規則 | 說明 |
|------|------|
| 掛點 | **僅** `layoutStore`；**禁止**寫 `editorStore` |
| 欄位 | `PlacedDevice.primaryOutput`、`sourceRatePerMin`（頂層，與型別一致） |
| 設定 | `itemId` 非 null → 寫入；`ratePerMin ?? 30` |
| 清除 | `itemId === null` → 刪除／置 `undefined` 兩欄（語意＝未設定） |
| 未知／重複 uid | 找不到或同 id 多台 → **靜默 no-op，且不進歷史**（已決；測試釘死） |
| 歷史 | 成功寫入才 `historyStore.execute`；Undo 還原整份 devices before 快照 |
| 型別枚舉 | **已決**＝`HistoryRecordType.MachineRecipeChange` |

---

## 3. 技術決策

| 決定 | 狀態 | 說明 |
|------|------|------|
| 回傳 void | **已決** | 對齊 C5／工單；不做 PlacementResult |
| 預設 30 | **已決** | C5 §4.4；本版不做速率 UI |
| 不驗證「是否源機器」 | **已決（本版）** | L1 只寫欄位；「只對源機開放」屬 UI／日後驗證器 |
| 不驗證材料 form／media | **已決（本版）** | 下拉過濾屬 L2／L3；本版測試可用任意字串 id |
| clone 策略 | **沿用** | `devices.map(cloneDevice)` before／after |

### 3.1 實作草圖（非正式碼）

```text
index = find unique device by uid
if not found OR not unique → return（不進歷史）
before = clone all devices
after = map：命中者寫 primaryOutput／sourceRatePerMin（或清除）
history.execute({ type: MachineRecipeChange, execute→after, undo→before })
```

---

## 4. 檔案修改計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | `src/store/layoutStore.ts` | 新增 `setDevicePrimaryOutput`；export |
| 修改或新建 | `src/__tests__/store/layoutStore.test.ts`（或 `layoutStore.primaryOutput.test.ts`） | 設定／清除／未知 uid／Undo |
| **不碰** | `editorStore`、`useFlowEngine`、`GridCanvas`、`MainLayout`、表單元件 | |

---

## 5. 驗證標準

| # | 案例 | 預期 |
|---|------|------|
| 1 | 既有 device 設 `itemId='源礦'` | `primaryOutput==='源礦'`；`sourceRatePerMin===30` |
| 2 | 同 uid 再設 `ratePerMin=15` | 速率＝15；進第二筆歷史 |
| 3 | `itemId=null` | 兩欄清除；Undo 可還原前一狀態 |
| 4 | 未知／重複 uid | devices 不變；**歷史不增** |
| 5 | Undo／Redo | 與 `moveDevice` 同棧行為 |
| 6 | grep | 無 `editorStore` 寫入；無鎖檔 diff |

品質閘：`pnpm type-check`／`lint-check`／`format-check`／`test`。

---

## 6. DoD（本細項）

- [x] action 在 `layoutStore` return 面匯出
- [x] §5 測試全綠（6 案；全套 929 tests）
- [x] 進歷史、可 Undo
- [x] 未改 `editorStore` 簽名

---

## 7. 開發日誌

### 2026-10-18｜實作完成

- `setDevicePrimaryOutput` 進 `layoutStore`；歷史＝`MachineRecipeChange`
- 測試：`src/__tests__/store/layoutStore.primaryOutput.test.ts`（設定／速率／清除／未知／重複／Undo）
- 品質閘：type-check／lint／format／test 綠（929）
- **下一刀＝E1（驗收／開 PR）**；D1 接法已決，開 PR 時寫 body

### 2026-10-18｜定案回寫

- 歷史型別＝`MachineRecipeChange`；未知 uid＝no-op 不進歷史

### 2026-10-18

- 建檔；待實作
