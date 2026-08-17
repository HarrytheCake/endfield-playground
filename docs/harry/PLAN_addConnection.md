# 待實作：addConnection MVP（畫管線）

**狀態：** 實作中（本文件記錄本次變更範圍，供 harry / toby review 對照）
**對應：** `MILESTONE_0726.md` 五項缺口中的第一項，`addConnection`
**相關檔案：**

- `src/editor/canvas/FlowNodeOverlay.vue`（L2 container 內的節點展示元件）
- `src/editor/canvas/FactoryCanvas.vue`
- `src/store/editorStore.ts`（`addConnection` action，未變更，僅呼叫）

---

## 1. 前置調查發現的阻塞（已與 harry 對齊）

`FlowNodeOverlay.vue` 原本每個節點只有左右各一顆沒有 `id` 的 Handle。但 `useFlowEngine.ts` 的埠媒質判斷（`resolvePortMedia`）依賴 handle id 格式 `in-{idx}` / `out-{idx}` 去查 `machine.modes[].input_ports/output_ports[idx].media`。單一 Handle 意味著多埠機器（例如粉碎機 2 個輸入）永遠只能連到埠 0，且 belt/pipe 誤接不會被擋。

MVP 範圍因此擴大為「每個埠一顆 Handle」，而不只是接 `@connect` 事件。

## 2. 本次變更範圍

### `FlowNodeOverlay.vue`

- 依 `machine.modes[currentMode].input_ports` / `output_ports` 動態渲染對應數量的 `Handle`
- 每顆 Handle 的 `id` 命名為 `in-${index}` / `out-${index}`，`index` 為該埠在原始陣列中的位置（與 `useFlowEngine.ts` 的解析格式對齊）
- `Position` 沿用埠定義的 `side`（0° 旋轉時的絕對方位）；旋轉視覺效果由既有的父層 CSS `transform: rotate()` 處理，不需再對 Handle 座標做三角函數轉換
- 同側多顆埠時，用 `top`/`left` 百分比把 Handle 沿邊均分，避免重疊

### `FactoryCanvas.vue`

- `VueFlow` 新增 `@connect` 監聽
- 新增 `handleConnect(connection: Connection)`：從 `connection.source` 找出來源節點的 `machineType` / `machineMode`，依 `connection.sourceHandle` 解析出埠索引，查出該埠 `media` 作為 `FactoryEdgeData.portType`（查不到時 fallback `belt`）
- 組出 `FactoryEdge`（`id` 用 `crypto.randomUUID()`、`type: 'pipeline'`），呼叫 `editorStore.addConnection()`——全程走 L1 high-level action，沒有自己組 Command

## 3. 明確不在本次範圍內（留給後續 PR）

- port hover 高亮、拖曳中預覽線的額外視覺回饋
- 手動彎折點（`bendPoints`）——本次一律直線連接
- 連線時的即時合法性檢查／錯誤提示（媒質不匹配目前僅影響 FlowEngine 計算結果，不會擋下使用者操作）
- autoNode（分流／匯流／物流橋）——依 `editorStore.addConnection` 既有 JSDoc，Phase 1 簡化版本就是不含這段

## 4. 驗證方式

- `pnpm type-check` / `lint-check` / `format-check` / `test`（`validate-changes` skill）
- 手動測試：畫布上放置兩台單埠機器並連線；若有多埠機器（如粉碎機），確認兩個輸入 Handle 都能個別連線且不重疊