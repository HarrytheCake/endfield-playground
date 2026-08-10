# V6-B1 — L1 editorStore 移動 API

**對應工項：** V6-B1  
**狀態：** 封鎖中（依賴 V6-A2）  
**依賴：** [A2_api_decision.md](./A2_api_decision.md)

---

## 1. 背景與動機

現行 `moveDevices` 假設呼叫前座標仍為「移動前」。拖曳路徑需要「確認已套用」語意，並產生單一 `HistoryRecordType.MachineMovement` 紀錄。

---

## 2. 技術決策

實作內容以 A2 **最終決策**為準。以下按建議草案 **B-commit** 撰寫；若改採 B-opt，將本文件簽名段替換即可。

### 必須遵守

- 只透過 `historyStore.execute` 進歷史（L1 內部）
- 空 `uids` → no-op、不進歷史
- before/after 無實際位移 → no-op、不進歷史
- 不在本版實作管線跟隨；可留註解 `// TODO(CR-02): pipeline follow on move`

---

## 3. 型別設計（B-commit 草案）

```typescript
/** uid → 拖曳開始時的像素座標 */
type DevicePositionSnapshot = Record<string, { x: number; y: number }>

function commitDeviceMove(uids: string[], before: DevicePositionSnapshot): void
```

建議 Command 結構：

```typescript
const after: DevicePositionSnapshot = /* 自 nodes 擷取 uids */
// 若無變化 return

historyStore.execute({
  id: crypto.randomUUID(),
  type: HistoryRecordType.MachineMovement,
  label: `移動 ${uids.length} 台設備`,
  execute() {
    applyPositions(after)  // redo 友善；首次呼叫時通常已是 after
  },
  undo() {
    applyPositions(before)
  },
})
```

注意：若 `historyStore.execute` 會立刻跑一次 `execute()`，首次套用 `after` 必須**等價於現況**（寫入相同座標可接受），不可再加 delta。

### 若採 B-opt

```typescript
function moveDevices(
  uids: string[],
  delta: { x: number; y: number },
  options?: { alreadyApplied?: boolean },
): void
```

- `alreadyApplied !== true`：維持現有 `applyDelta` 邏輯
- `alreadyApplied === true`：首次 execute 跳過 `+delta`（或改存 before/after 絕對座標）

---

## 4. 檔案修改計畫

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/store/editorStore.ts` | 修改 | 新增 `commitDeviceMove` 或擴充 `moveDevices`；export / return 同步 JSDoc |
| `src/app/dev/HistoryReplay.vue` | 視情況 | 僅在 breaking 時改；B-commit 下可不動 |
| `src/__tests__/store/editorStore.test.ts` | 修改 | 見 D1 |

**不動：** FlowEngine、validationStore、其他 CR 資料夾。

---

## 5. 遷移說明

| 呼叫端 | B-commit | B-opt |
|--------|----------|-------|
| HistoryReplay `moveDevices(delta)` | 無需改 | 無需改 |
| 未來方向鍵微調 | 繼續用 `moveDevices` | 同左 |
| FactoryCanvas 拖曳 | 改呼叫 `commitDeviceMove` | 呼叫 `moveDevices(..., { alreadyApplied: true })` |

---

## 6. 驗證標準

- [ ] 主動 `moveDevices` 既有測試全過
- [ ] 新路徑：進歷史、undo 回 before、redo 回 after
- [ ] 零位移不進歷史
- [ ] 不重複位移（見 D1 斷言）
- [ ] JSDoc 註明拖曳應使用哪條 API、管線跟隨未實作

---

## 7. 開發日誌

### 2026-08-01

- 初稿；實作等待 A2 定案與 editorStore 修改授權
