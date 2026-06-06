## 概要

本 PR 把 L1 基礎建設層從零拉到 Phase 1 完整可運作狀態，包含 aaaaa 的 CR-04 V4 工作與 dernoson 後續的 stores / history / validation / 三層架構文件等。**完成後 L2 / L3 / shirone / azure9572 都可以開始動工**。

合計 89 個檔案 / +20,299 行 / -100 行。

## 分項變更

### 1. CR-04 FlowEngine（aaaaa，已併入 dev/dernoson）

- `src/types/flow.ts`：型別完整化（`FlowGraph` / `FlowNode` / `EdgeFlow` / `ItemSummary` / `FlowEngineResult` / `RecipeDef` / `ProductDef`）
- `src/types/machine.ts`：`Machine` 加 `id`，新增 41 台機器的 snake_case id
- `src/types/plan.ts`、`src/data/plans.ts`：拆 interface 與資料
- `src/data/machines.ts` / `src/data/devices.ts`：重構為 list + map，新增 `getMachineById` / `getRecipesForMachine` 等查詢 API
- `src/utils/portUtils.ts`：Port 旋轉純函式

### 2. CR-08 historyStore（Command Pattern）

- **新建** `src/store/historyStore.ts`：Pinia + Command Pattern（`execute` / `undo` / `redo` / `canUndo` / `canRedo`）
- **新建** `src/lib/history/createMacroCommand.ts`：L1 內部 macro 組合 helper
- **重寫** `src/types/history.ts`：`Command` interface + `HistoryRecordType` enum
- **刪除** `src/lib/history/historyManager.ts`、`src/composables/useCurrentHistory.ts`（舊靜態 class 設計）

### 3. CR-01 + CR-02 editorStore（merged-store 設計，plan B）

採「plan B：augment editorStore 而非新建 placedDeviceStore + pipelineStore」。editorStore 兼任二者，新增 **8 個高階 actions**：

- `placeDevice` / `moveDevices` / `rotateDevice` / `removeDevices`
- `setRecipe` / `pasteSelection`
- `addConnection`（Phase 1 簡化版，autoNode 未實作）/ `removeConnection`

每個 action 內部自動產生 Command 並推入 historyStore（**L2 不需要也不該自己組 Command**）。

### 4. CR-01 useCanvasStore

- **新建** `src/store/canvasStore.ts`：`gridSize` / `offset` / `zoom` / `baseRegion` / `showGrid`。純視角狀態，不進歷史

### 5. CR-03 validationStore 骨架 + E001 stub

- **新建** `src/store/validationStore.ts`：`alerts` / `detectors` + `registerDetector` / `run(ctx)` / `hasBlockingError(uid)`
- **新建** `src/types/validation.ts`：`Alert` / `Detector` / `ValidationContext`
- **新建** `src/lib/validation/detectors/E001_deviceOverlap.ts`：shirone 草稿遷移結果（純結構，邏輯為 stub）

### 6. L1 串通完整資料流

- **新建** `src/composables/useValidation.ts`：watch editorStore，sync 跑 validation（**不 debounce**，確保 FlowEngine 讀到最新 alerts）
- **更新** `src/composables/useFlowEngine.ts`：watch 增加 `validationStore.alerts` 依賴；`buildGraph` 簽名加上 `hasBlockingError` callback；移除舊 `require()` hack
- **更新** `src/app/layouts/MainLayout.vue`：MainLayout 同時啟動 `useValidation()` 與 `useFlowEngine()`

### 7. useShortcuts 重寫（Ctrl+Z 真接通 historyStore）

- **刪除** `src/store/shortcutStore.ts`（死碼：本地 undo/redo 跟 historyStore 完全不通）
- **刪除** `src/types/editor.ts` 中的 `ShortcutAction` interface
- **重寫** `src/composables/useShortcuts.ts`：Ctrl+Z/Y → `historyStore.undo/redo`；Delete → `editorStore.removeDevices(...)`；Space → 切 `activeTool`

### 8. selectionStore

- **新建** `src/store/selectionStore.ts`：選取狀態（不進歷史）

### 9. Tests（**197 個案例 / 13 個檔**）

- 既有 `flowEngine.test.ts`（27 個案例，aaaaa 的 H1~H6 整合測試）
- **新增** 12 個測試檔：historyStore / canvasStore / validationStore / editorStore / flowStore / selectionStore / portUtils / createMacroCommand / useValidation / useFlowEngine (buildGraph + validateRecipeMatch) / data/machines / data/devices

### 10. 三層架構文件（docs/dernoson/）

- **L1 / L2 / L3 完整職責文件**：14 份個人職責 + 3 份層級總覽
- **L1 相依圖**：`docs/dernoson/graphs/L1-architecture.md`（Mermaid flowchart）
- **個人引導**：`docs/dernoson/README.md` / `docs/shirone/README.md`
- **Claude 工具集**：`docs/dernoson/claude/` 下的 agents（`test-writer`、`dependency-grapher`）與 skills（`add-jsdoc`、`validate-changes`）
- 透過 symlink `.claude → docs/dernoson/claude` 讓 Claude Code 載入（其他人不會受影響）

### 11. 工具鏈

- `package.json` 新增 `concurrently` dev dep + `validate-all` script
- `vitest.config.ts` 新建（含 `@` alias、`environment: node`、`globals: true`）

## 關鍵設計決策（review 重點）

| 決策 | 為什麼 | 影響範圍 |
|---|---|---|
| **plan B**：editorStore 兼任 placedDevice + pipeline | Vue Flow 已選定且深度整合，再拆兩個 store 是不必要的解耦 | 所有 L2 actions |
| **historyStore**：Pinia Command Pattern（非靜態 class） | 響應式 canUndo / canRedo 給 UI 用、與 Vue 生態統一 | CR-08 整體 |
| **L1 action 內部自動產生 Command** | L2 不需要學 Command Pattern；違反此規則的 PR 直接 reject | L2 所有寫入操作 |
| **DirectedGraph 不抽出** | CR-03 detectors 實際評估後無一需要 graph topology | CR-03 ValidationContext |
| **useValidation sync watch、useFlowEngine debounce** | validation 必須先於 flow engine 完成，alerts 才會是最新 | 資料流時序 |
| **Vue Flow 已選定** | 已安裝且使用；FlowChart 也走 custom node 寫法 | L3 azure9572 / MBD |

## Test plan

- [ ] `pnpm type-check` 通過
- [ ] `pnpm lint` 通過
- [ ] `pnpm test` 通過（197 案例）
- [ ] `pnpm format-check` 通過
- [ ] 開發環境啟動（`pnpm dev`），Ctrl+Z / Ctrl+Y 在畫布上實際還原 / 取消還原藍圖變更
- [ ] Delete 鍵刪除選取設備並進入歷史
- [ ] 驗證 doc 各份對應到實際程式碼狀態（型別、API 簽名、路徑等）

## 後續工作（不在本 PR）

- `harry` / `toby` 開工 L2 容器層（CR-01 + CR-02 互動）
- `shirone` 補 E001 `run()` 邏輯 + 寫 E002~E006
- `azure9572` 寫 `src/lib/flowChart/buildGraph.ts` + `layout.ts`（CR-05 Phase 1 純算法）
- `goodmorning` / `avery` / `MBD` 開工 L3 元件
- L1 Architect 後續：把 azure9572 的純函式包成 viewStore / flowChartStore