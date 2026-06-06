# C3 — L2 README 更新計畫

**對應工項**：V5-C3

---

## 1. 工項目標

更新 L2 開發者的 README 文件，新增：

- 連結到 `L1_API_REFERENCE.md`
- 連結到 `FLOW_ENGINE_GUIDE.md`
- L2 「不可為」清單
- 如何呼叫 editorStore actions 的範例

**影響檔案**：
- `docs/harry/README.md`（CR-01 + CR-02 主責）
- `docs/toby/README.md`（L2 後續開發者）

---

## 2. 更新內容

### 2.1 新增章節：L1 API 參考文件

在各 L2 開發者的 README 中，新增章節：

```markdown
## X. L1 API 參考文件

**必讀文件**：
- [L1 API Reference](../../L1_API_REFERENCE.md) — 完整 API 簽名、State / Actions / Getters
- [FlowEngine Guide](../../FLOW_ENGINE_GUIDE.md) — 流量計算引擎使用指南

---
```

---

### 2.2 新增章節：L2 「不可為」清單

```markdown
## X. L2 「不可為」清單

### X.1 禁止直接 mutate editorStore.nodes / edges

❌ **錯誤範例**：

```typescript
// 禁止！
editorStore.nodes.push(newNode);  // 不進歷史

editorStore.nodes = editorStore.nodes.filter(n => n.id !== 'uid1');
```

✅ **正確範例**：

```typescript
// 正確！使用高階 action
editorStore.placeDevice(newNode);
editorStore.removeDevices(['uid1']);
```

---

### X.2 禁止自己組 Command

❌ **錯誤範例**：

```typescript
// 禁止！L2 不應該自己組 Command
const historyStore = useHistoryStore();
historyStore.execute({
  id: crypto.randomUUID(),
  type: 'custom',
  execute() { /* ... */ },
  undo() { /* ... */ },
});
```

✅ **正確範例**：

```typescript
// 正確！高階 action 內部會自動產生 Command
editorStore.moveDevices(['uid1', 'uid2'], { x: 40, y: 0 });
```

---

### X.3 禁止修改 flowStore / validationStore

flowStore 與 validationStore 為 **唯讀 store**，L2 僅消費其數據，不可修改。

❌ **錯誤範例**：

```typescript
// 禁止！
flowStore.edgeFlows.set('uid', { ... });
validationStore.alerts.push({ ... });
```

✅ **正確範例**：

```typescript
// 正確！僅消費
const flow = flowStore.edgeFlows.get('uid');
const alerts = validationStore.alertsByDevice('uid');
```

---
```

---

### 2.3 新增章節：editorStore Actions 使用範例

```markdown
## X. editorStore Actions 使用範例

### X.1 擺放設備

```typescript
import { useEditorStore } from '@/store/editorStore';

const editorStore = useEditorStore();

function handlePlaceDevice(machineType: string, x: number, y: number) {
  editorStore.placeDevice({
    id: crypto.randomUUID(),
    type: 'default',
    position: { x, y },
    data: {
      label: machineType,
      machineType,
      recipeIndex: 0,
      rotation: 0,
    },
  });
}
```

### X.2 批次移動設備

```typescript
import { useEditorStore } from '@/store/editorStore';
import { useSelectionStore } from '@/store/selectionStore';

const editorStore = useEditorStore();
const selectionStore = useSelectionStore();

function handleDrag(delta: { x: number; y: number }) {
  editorStore.moveDevices(
    selectionStore.selectedNodeIds,
    delta
  );
}
```

### X.3 刪除選中設備

```typescript
import { useEditorStore } from '@/store/editorStore';
import { useSelectionStore } from '@/store/selectionStore';

const editorStore = useEditorStore();
const selectionStore = useSelectionStore();

function handleDelete() {
  if (selectionStore.selectedNodeIds.length === 0) return;
  
  editorStore.removeDevices(selectionStore.selectedNodeIds);
  selectionStore.clearSelection();
}
```

### X.4 變更配方

```typescript
import { useEditorStore } from '@/store/editorStore';

const editorStore = useEditorStore();

function handleRecipeChange(deviceUid: string, newRecipeIndex: number) {
  editorStore.setRecipe(deviceUid, newRecipeIndex);
}
```

### X.5 旋轉設備

```typescript
import { useEditorStore } from '@/store/editorStore';

const editorStore = useEditorStore();

function handleRotate(deviceUid: string) {
  const device = editorStore.nodes.find(n => n.id === deviceUid);
  if (!device) return;
  
  const currentRotation = device.data?.rotation ?? 0;
  const nextRotation = (currentRotation + 1) % 4 as Rotation;
  
  editorStore.rotateDevice(deviceUid, nextRotation);
}
```

---
```

---

### 2.4 新增章節：常見問題 (FAQ)

```markdown
## X. 常見問題 (FAQ)

### Q1：為什麼不能直接 mutate editorStore.nodes？

**A1**：直接 mutate 不會產生 Command，導致無法 undo/redo。必須使用高階 action。

### Q2：如何判斷設備是否有 Error？

**A2**：使用 `validationStore.hasBlockingError(deviceUid)`。

### Q3：如何取得管線流量？

**A3**：使用 `flowStore.edgeFlows.get(connectionUid)`。

### Q4：如何觸發 FlowEngine 重新計算？

**A4**：FlowEngine 會自動 watch editorStore 變化，不需手動觸發。

---
```

---

## 3. 實作步驟

1. 開啟 `docs/harry/README.md`
2. 在適當章節後插入上述所有新增內容
3. 開啟 `docs/toby/README.md`
4. 同步插入相同內容
5. 確認所有相對路徑連結正確

---

## 4. 驗證標準

| 項目 | 標準 |
|------|------|
| 連結正確 | 所有相對路徑可訪問 |
| 內容完整 | 包含「不可為」清單與範例 |
| 同步一致 | harry 與 toby 的 README 內容一致 |

---

## 5. 注意事項

- 章節編號 `X` 需根據各 README 現有結構調整
- 相對路徑 `../../` 需根據實際檔案位置調整
- 所有 TypeScript 程式碼範例需包含正確的 import 語句

---

*此文件對應 V5-C3 工項，實作後標記 [x] 於 todolist_v5.md。*
