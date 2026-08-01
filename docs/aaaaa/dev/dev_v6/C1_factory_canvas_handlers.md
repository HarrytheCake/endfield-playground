# V6-C1 — FactoryCanvas 拖曳接線

**對應工項：** V6-C1  
**狀態：** 封鎖中（依賴 V6-B1；實作主責可能為 L2）  
**依賴：** [B1_editor_store_api.md](./B1_editor_store_api.md)

---

## 1. 背景與動機

`FactoryCanvas.vue` 目前啟用 `nodes-draggable` 與 `v-model:nodes`，但沒有 `@node-drag-start` / `@node-drag-stop`。需在拖曳生命週期接上 L1，且**禁止** L2 直接 `historyStore.execute()`。

---

## 2. 技術決策

| 項目 | 決定 |
|------|------|
| 監聽事件 | Vue Flow：`node-drag-start`、`node-drag-stop`（必要時參考 `node-drag` 僅除錯，不入歷史） |
| 歷史入口 | 只呼叫 L1（`commitDeviceMove` 或 `moveDevices(..., { alreadyApplied: true })`） |
| 多選 | 一次提交所有本次拖曳移動到的 uid（與選取拖曳行為一致） |
| 零移動 | 交由 L1 no-op；或 L2 比對後不呼叫 |

### 建議狀態

```typescript
/** 拖曳開始時的位置快照；非拖曳中為 null */
let dragBeforeSnapshot: DevicePositionSnapshot | null = null
let dragUids: string[] = []
```

### start

1. 由事件取得被拖節點；若為多選拖曳，收集「一同移動」的 uid 列表（通常為選取集合，或以 Vue Flow 事件提供的 nodes 為準——實作時對照 Vue Flow 版本文檔）
2. 自 `editorStore.nodes` 讀取各 uid 當下 `position` 寫入 `dragBeforeSnapshot`

### stop

1. 若無 snapshot → return
2. 呼叫 L1 commit / alreadyApplied API
3. 清空 snapshot

### 嚴禁

- `historyStore.execute(...)` 自組 Command
- `import { createMacroCommand }`
- 在 stop 時呼叫「會再 +delta」的裸 `moveDevices`（未帶 alreadyApplied）

---

## 3. 型別設計

無新公開型別；複用 B1 的 `DevicePositionSnapshot`（若放在 types 則從 `@/types/...` 引入，避免 L2 複製結構）。

---

## 4. 檔案修改計畫

| 檔案 | 動作 |
|------|------|
| `src/editor/canvas/FactoryCanvas.vue` | 新增 drag handlers、本地 snapshot 狀態 |
| overlay / FlowEngine 顯示 | **不動**（CR-04 overlay 邏輯維持） |

---

## 5. 遷移說明

無資料格式遷移。行為遷移：拖曳從「只改 position」變為「改 position + 結束時入歷史」。

---

## 6. 驗證標準

- [ ] 單選拖曳 → Ctrl+Z 回原位 → Ctrl+Y 回拖曳後
- [ ] 多選拖曳 → 一次 undo 全部回去
- [ ] 點一下未移動 → 歷史堆疊無新項目（或等價可接受行為，與 L1 約定一致）
- [ ] 程式碼搜尋：Canvas 內無 `historyStore.execute`
- [ ] 拖曳跟手、既有 snap / 框選不被破壞

---

## 7. 開發日誌

### 2026-08-01

- 初稿；標註 L2 主責與待授權協同
