# 步驟 2：建立唯讀資料接線

## 目標

在 `InspectorPanel.vue` 建立單一選取設備至機器定義的唯讀 computed 資料流。

## 修改檔案

只修改：

```text
src/editor/inspector/InspectorPanel.vue
```

## 實作內容

在 `<script setup>` 增加：

```ts
import { useSelectionStore } from '@/store/selectionStore';
import { getMachine } from '@/data/machines';
```

建立 SelectionStore 的唯讀參照：

```ts
/** 選取狀態 store：本面板唯讀目前選取的設備 uid */
const selectionStore = useSelectionStore();
const { selectedNodeIds } = storeToRefs(selectionStore);
```

建立目前唯一選取的節點：

```ts
/** 目前選取的單一設備節點；未選取或多選時為 undefined */
const selectedDevice = computed(() => {
    if (selectedNodeIds.value.length !== 1) return undefined;
    return editorStore.nodes.find((node) => node.id === selectedNodeIds.value[0]);
});
```

建立對應的機器定義：

```ts
/** 選取設備的機器定義；缺少 machineType 或查無資料時為 undefined */
const selectedMachine = computed(() => {
    const machineType = selectedDevice.value?.data?.machineType;
    return machineType ? getMachine(machineType) : undefined;
});
```

## 資料流

```text
selectionStore.selectedNodeIds
        │
        ▼
selectedDevice
        │ node.data.machineType
        ▼
getMachine(machineType)
        │
        ▼
selectedMachine
```

## 限制

- 不呼叫 `selectionStore.setSelection()` 或其他寫入函式。
- 不呼叫新的 `editorStore` action。
- 不直接修改 `editorStore.nodes`。
- 不使用 `historyStore.execute()`。
- 不修改 `getMachine()` 或機器資料。

既有 InspectorPanel 本來就會透過地圖設定欄位呼叫 `setMapSize()` 和
`setSnapToGrid()`；本工單的唯讀要求只約束本次新增的設備資訊功能。

## 驗收條件

- `selectedNodeIds.length !== 1` 時，`selectedDevice` 為 `undefined`。
- 找不到節點時不拋出例外。
- 缺少 `machineType` 或查無機器時，`selectedMachine` 為 `undefined`。
- 新增程式碼沒有 store mutation。

## 下一步

computed 資料流完成後，進入「步驟 3：呈現設備資訊」。
