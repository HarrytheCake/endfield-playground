# W0823-T1 工單分析摘要

分析目標：`docs/work_dispatch/toby/W0823-T1_placement_footprint_size.md`

## 結論

這份工單原本是設備 footprint 渲染任務，但已於 2026-08-25 改指向：

- 只修改 `src/editor/inspector/InspectorPanel.vue`。
- 唯讀顯示單一選取設備的名稱、佔格與耗電。
- 未選取或多選時顯示空狀態。
- 不修改 `FactoryCanvas.vue`、`FlowNodeOverlay.vue`、任何 store、Command 或其他元件。

Inspector 顯示本身可以用兩個 computed 完成：

1. 從 `selectionStore.selectedNodeIds` 找出唯一選取的節點。
2. 使用節點的 `data.machineType` 呼叫 `getMachine()` 取得機器定義。

不過目前程式存在兩個上游問題，可能使嚴格 DoD 無法只靠修改 InspectorPanel 達成。

## 主要阻礙

### 1. 單擊節點可能不會更新 SelectionStore

`FactoryCanvas.vue` 目前只在 Vue Flow 的 `selection-change` 事件中同步
`selectionStore`。既有開發筆記已記錄：單純點擊節點不一定觸發此事件，
而 `handleNodeClick()` 目前只更新旋轉目標，沒有更新 `selectedNodeIds`。

可能結果：

```text
單擊設備
  → rotateTargetUid 更新
  → selectedNodeIds 未更新
  → Inspector 仍顯示空狀態
```

若以框選觸發 `selection-change`，Inspector 接線較可能正常。修正單擊行為需要修改
`FactoryCanvas.vue`，但這超出本工單允許範圍。

### 2. 新放置節點的 machineType 與 getMachine 契約不一致

`getMachine(name)` 使用機器中文名稱查詢，例如：

- `精煉爐`
- `粉碎機`

但 `FactoryCanvas.vue` 建立新節點時，把英文 `EquipmentType` 寫入
`data.machineType`，例如：

- `smelter`
- `crusher`
- `assembler`

因此新放置節點可能出現：

```text
getMachine('crusher') → undefined
```

既有 editorStore mock nodes 多半使用中文 `machineType`，所以本切片可用 mock 設備演示；
新放置設備則可能顯示空狀態。修正此契約同樣需要修改工單禁止變更的畫布程式。

## 文件內部落差

### 既有 InspectorPanel 已呼叫寫入 action

工單的自查文字要求整個檔案不得呼叫 `editorStore.xxx()` 寫入函式，但現有
InspectorPanel 本來就會呼叫：

- `editorStore.setMapSize()`
- `editorStore.setSnapToGrid()`

合理驗收方式應是：本次新增的設備資訊區不得新增 store mutation，而不是要求整個
既有檔案完全沒有 action。

### 提前切片與完整 B4 的分層不同

本工單把 `InspectorPanel.vue` 當作 L2，允許直接 import stores 和 data。

完整的 `docs/roadmap/detail/B4_selection_inspector.md` 則要求：

- `InspectorSidebar.vue` 作為 L2，讀取 stores 並攤平資料。
- `InspectorPanel.vue` 作為 L3，只接收 plain props，不得 import store 或 data。

因此本工單是暫時性的提前切片，之後完成 B4 時可能需要把資料接線移到
InspectorSidebar。

### 其他差異

- 工單寫「左側 Inspector」，實際 Inspector 位於右側。
- 本切片直接顯示靜態 `width × height`，未處理 90°／270° 旋轉後的尺寸交換。
- 耗電骨架未加單位，也未處理 `power = -1` 代表資料未定義的情況。

## 建議驗收方式

在不擴大工單範圍的前提下，應驗證：

1. 未選取時顯示空狀態。
2. 多選時顯示空狀態，且不殘留上一台資料。
3. 指向既有 mock 設備時，顯示正確名稱、佔格及耗電。
4. 框選一台設備時，確認 SelectionStore 是否同步。
5. 單擊沒有反應時，記錄為 FactoryCanvas 既有接線問題。
6. 新放置設備查不到機器時，記錄為 `machineType` 資料契約問題。

## 建議決策

可選擇以下其中一種範圍：

### 維持原小切片

- 只修改 `InspectorPanel.vue`。
- 使用既有 mock 設備或框選方式驗收。
- 將單擊選取及英文 `machineType` 問題回報為上游缺口。

### 另開上游修正工單

- 在 `handleNodeClick()` 同步單一選取狀態。
- 統一新節點 `machineType` 與 `getMachine()` 的查詢契約。
- 不把這兩項修正混入原本限制為單檔、兩小時的 Inspector 工單。

## 測試現況

目前只有 `src/__tests__/store/selectionStore.test.ts` 驗證 SelectionStore 本身，尚未覆蓋：

- Vue Flow 單擊至 SelectionStore 的接線。
- Inspector 單選、空選及多選顯示。
- `getMachine()` 查不到時的 fallback。
- 新放置英文 `machineType` 的情況。

本工單限制只修改一個檔案，因此原預期應以手動演示和截圖驗收為主。
