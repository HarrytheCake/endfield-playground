# V6-A2 — API 方案定案（方案 B 子選項）

**對應工項：** V6-A2  
**狀態：** 已定案（2026-08-01）  
**依賴：** [A1_problem_analysis.md](./A1_problem_analysis.md)

---

## 1. 背景與動機

方案 B 已採用；§7 待決事項已由負責人確認，可實作。

---

## 2. 最終決策

| 決策項 | 結論 | 決策者 | 日期 |
|--------|------|--------|------|
| B-opt vs B-commit | **採用 `commitDeviceMove`（平行 action）**；保留 `moveDevices(uids, delta)` | aaaaa | 2026-08-01 |
| 本版是否含管線跟隨 | **否**；只做移動能 undo，跟隨留 CR-02 | aaaaa | 2026-08-01 |
| `editorStore` 由誰改 | **aaaaa**（先改並測試，供協作者檢驗；之後主編 merge） | aaaaa | 2026-08-01 |
| `FactoryCanvas` 由誰改 | **aaaaa**（同上） | aaaaa | 2026-08-01 |
| 零位移拖曳 | **完全不進歷史** | aaaaa | 2026-08-01 |

---

## 3. 凍結簽名

```typescript
import type { DevicePositionSnapshot } from '@/types/editor'
// DevicePositionSnapshot = Record<string, { x: number; y: number }>

commitDeviceMove(uids: string[], before: DevicePositionSnapshot): void

// 既有保留：
moveDevices(uids: string[], delta: { x: number; y: number }): void
```

行為：

1. 呼叫當下自 `nodes` 讀 `after`
2. 與 `before` 比較；無實際位移 → 不進歷史
3. Command：`execute` 寫入 after（首次等價 no-op；redo 重套用）；`undo` 寫入 before
4. JSDoc 註明管線跟隨 TODO(CR-02)

L2 偽碼：

```typescript
// drag-start
before = Object.fromEntries(dragged.map((n) => [n.id, { ...n.position }]))

// drag-stop
editorStore.commitDeviceMove(uids, before)
```

---

## 4. 已否決

| 方案 | 原因 |
|------|------|
| A（L2 自組 Command） | 違反 Command 歸屬 |
| C（單向 nodes） | 本版成本過高 |
| B-opt（alreadyApplied 參數） | 語意較混；已選平行 action |

---

## 5. 驗證標準

- [x] 決策表已填
- [x] 簽名已凍結並同步 B1 / C1 / 實作
- [ ] 協調說明已交協作者檢驗（實作後）

---

## 6. 開發日誌

### 2026-08-01

- 負責人確認四項決策；解除 A2 封鎖並開始實作
