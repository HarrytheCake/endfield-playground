# V12-C1 — layoutStore 契約

**對應工項：** V12-C1  
**狀態：** `[x]` 完成（2026-09-11）  
**日期：** 2026-09-11  
**開發分支：** `dev/aaaaa0907`  
**正式依據：** [W0907-A0](../../../work_dispatch/aaaaa/0907/W0907-A0_layout_store_model.md) §2–§3、[A1_scope_decision](./A1_scope_decision.md)

---

## 1. 背景與動機

L2 本週可用 props／fixture 畫只讀殼，但 9/14 整合需要**單一讀寫入口**。  
平行新建 `layoutStore`，組既有純函式，**不**改 `editorStore`。

---

## 2. 技術決策

| 項 | 選擇 | 理由 |
|----|------|------|
| 形狀 | 單一 Pinia setup store | 契約面單純；不必多一層 composable |
| 衍生連線 | `computed`／getter 呼叫 `resolveConnections` | 對齊 `types/layout` 開頭約定 |
| 唯讀 | return 對 devices／pipelines／connections 包 `readonly()` | L2 不應直接 mutate |
| 放置失敗 | `PlacementResult`，不 throw | UI 要畫紅框需回傳值 |
| 演算法 | 只組 `utils/layout/*` | 禁止在 store 重寫幾何 |
| `addPipeline` | **做**佔格檢查，回傳 `PlacementResult` | 與 addDevice 對稱；寫死於測試 |

### 2.1 讀取面簽章（PR body 用）

```ts
function useLayoutStore(): {
  readonly devices: Readonly<PlacedDevice[]>;
  readonly pipelines: Readonly<Pipeline[]>;
  readonly connections: Readonly<Connection[]>; // getter
  readonly layoutIssues: LayoutIssues;          // 全量問題（invalid＋overlap 並列）
  loadSnapshot(snapshot: LayoutSnapshot): LayoutIssues;
  toSnapshot(): LayoutSnapshot;
  addDevice(device: PlacedDevice): PlacementResult;
  removeDevice(id: string): PlacementResult;
  moveDevice(id: string, position: Position): PlacementResult;
  addPipeline(pipeline: Pipeline): PlacementResult;
  removePipeline(id: string): PlacementResult;
};
```

> 兩輪 review 後的定案：單一操作回 `PlacementResult`（一次一個 reason 夠用）；  \
> 聚合面（`layoutIssues`／`loadSnapshot`）回 {@link LayoutIssues}，讓 invalid 與 overlap 同時回報。

### 2.2 Action 行為摘要

| Action | 行為 |
|--------|------|
| `loadSnapshot` | 覆寫 devices／pipelines（深拷貝）；回該快照的**全部**問題（仍會載入，供 L2 畫紅框） |
| `toSnapshot` | 匯出 `{ devices, pipelines }`（不含 connections；深拷貝） |
| `addDevice`／`moveDevice` | 座標三軸須有限；重疊 → `overlap`＋`conflicts`；缺定義／id 不唯一 → `invalid`；成功才寫入 |
| `removeDevice`／`removePipeline` | 刪除；找不到或 id 不唯一 → `invalid`；管線保留（可斷線） |
| `addPipeline` | 管線 CRUD＋佔格檢查（≥2 點、座標有限、逐段軸對齊）；不維護 Connection state |
| 全部變更 action | 於 store 內組 Command 推入 `historyStore`；L2 只呼叫 `undo()`／`redo()` |

---

## 3. 檔案修改計畫

| 檔 | 動作 |
|----|------|
| `src/store/layoutStore.ts` | **新建** |
| `src/__tests__/store/layoutStore.test.ts` | **新建** |
| `src/types/layout.ts` | 補 `PlacementResult`／`PlacementFailReason` |
| `src/store/editorStore.ts` | **未碰** |
| `src/editor/layout/GridCanvas.vue` | **未碰** |
| `src/editor/toolbar/ToolbarPanel.vue` | **未碰** |

---

## 4. 驗證標準（釘 W0907-A0 §3 四點）

1. `connections` 隨 devices／pipelines 變；非獨立可寫 state  
2. 重疊放置回傳 `ok: false`，不 throw；成功路徑 `ok: true`  
3. 讀取面不可直接 mutate（`readonly`；toSnapshot 深拷貝）  
4. `loadSnapshot(toLayoutSnapshot(scenario))` → `toSnapshot()` 與輸入等值（devices／pipelines）

```bash
pnpm type-check
pnpm test src/__tests__/store/layoutStore.test.ts
pnpm test src/__tests__/store/editorStore.test.ts
```

**2026-09-11 結果：** type-check 過；layoutStore＋editorStore **46 tests** 全綠。

---

## 5. DoD

- [x] `layoutStore.ts` 可編譯
- [x] 四點測試綠
- [x] editorStore 測原樣綠
- [x] type-check 綠
- [x] 未改硬鎖檔

---

## 6. 開發日誌

### 2026-09-11

- 細項落檔；簽章與 PlacementResult 初稿寫入 A1／本檔
- 實作 `layoutStore`：組 `resolveConnections`／`detectOverlaps`／`toFootprint`；`addPipeline` 亦佔格檢查
- 測試四釘＋invalid／remove 重算；type-check／46 tests 綠
