# V6-D1 — editorStore 單元測試

**對應工項：** V6-D1  
**狀態：** 未開始  
**依賴：** V6-B1  
**測試檔：** `src/__tests__/store/editorStore.test.ts`

---

## 1. 背景與動機

既有測試覆蓋 `moveDevices(uids, delta)` 的位移與 undo。V6 需鎖住「已套用」路徑，防止雙重位移與漏進歷史。

---

## 2. 技術決策

- 沿用檔案內既有 `beforeEach(createPinia)`、繁中 `it` 描述、section header 風格
- 不拆遷測試檔
- 浮點座標用 `toBeCloseTo`（若有小數）；整數像素可用 `toBe`
- 透過 `useHistoryStore().canUndo` / `undo()` / `redo()` 驗證歷史整合

---

## 3. 測試案例規劃

### 既有 `moveDevices`（回歸）

- [ ] 批次移動 position 正確
- [ ] undo 還原
- [ ] redo 再套用
- [ ] 空 uids 不進歷史

### 新路徑（名稱依 A2 定案）

假設 `commitDeviceMove`：

| 案例 | Arrange | Act | Assert |
|------|---------|-----|--------|
| 進歷史 | 節點在 (0,0)；手動把 position 改成 (50,0) 模擬 Vue Flow | `commitDeviceMove(['n1'], { n1: {x:0,y:0} })` | `canUndo === true`；position 仍為 (50,0)（未變 100） |
| undo | 同上 | `undo()` | position 回到 (0,0) |
| redo | 再 `redo()` | position 回到 (50,0) |
| 零位移 | before 與目前相同 | commit | `canUndo` 不變／不新增紀錄 |
| 多 uid | 兩台都已「拖」到新位 | 一次 commit | 一次 undo 兩台皆還原 |
| 不雙重位移 | 關鍵 | commit 後讀 position | **不得**變成 before+2*delta |

若採 `alreadyApplied`：等價案例，Act 改為 `moveDevices(uids, delta, { alreadyApplied: true })`，Assert 同樣禁止 2×delta。

---

## 4. 檔案修改計畫

| 檔案 | 動作 |
|------|------|
| `src/__tests__/store/editorStore.test.ts` | 新增 describe 區塊 |

---

## 5. 驗證標準

```bash
pnpm test -- src/__tests__/store/editorStore.test.ts
```

- 全數通過
- 含至少 1 個「不雙重位移」明示斷言

---

## 6. 開發日誌

### 2026-08-01

- 測試計畫初稿
