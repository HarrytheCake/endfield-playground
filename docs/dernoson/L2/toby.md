# toby — L2 Senior IC

**角色：** L2 容器層 Senior IC（CR-01 + CR-02 合併區塊 技術後盾）
**背景：** 在業軟體工程師
**配對：** harry（Owner）的技術後盾與 PR reviewer

---

## 1. 角色定位

toby 不負責 L2 的對外協調與整體進度，那是 harry 的事。toby 把技術風險最高的幾塊吃下來，並當 harry PR 的最後一道把關。

主要承擔：
- 技術深度高、容易踩坑的實作
- harry PR 的 code review，重點放在 store 寫入路徑、Vue 響應性陷阱、是否誤把 Command 邏輯塞回 L2
- 跟 L1（dernoson + aaaaa）對齊每個跨 store 操作對應的 high-level action 介面；缺的請 L1 補（**不在 L2 自己組 Command 或寫 macro**）
- 在 harry 卡住時 pair 一陣子帶過去

不需要承擔：
- spec 對齊與優先序判斷（harry）
- 對 L1 / L3 的介面協商（harry 主導，toby 在技術選擇上提意見）
- 上下層全部介面文件的維運（harry）

---

## 2. 主要職責

### 2.1 高風險實作（toby own 的 PR）

#### A. 90 度路徑驗證即時偵測

由 toby 完整 own。對應 spec：`02_pipeline.md` §2.3 「彎折點 90 度限制」、§4「強制 90 度轉角」、§6.3 範例。

要點：
- `DraftConnection` 型別**不存在於程式碼**，draft 狀態由 L2 container 自行用 local ref（含 waypoints 陣列）維護。
- waypoints 變動時即時跑 `validateAllSegments()`
- 違規線段索引由 L2 computed 算出 `invalidSegmentIndices` 並餵給 `<PipelineDraft>` 的 prop
- 滑鼠移動是高頻事件，要保證不會因為每次 mousemove 跑 O(n) 驗證導致掉幀；若 waypoint 數量大，考慮只重算受影響的相鄰兩段
- 違規時封鎖「確認放置」：在 L2 commit handler 入口檢查 `hasInvalidSegment`，true 就 reject 並維持 draft，不呼叫 `editorStore.addConnection(edge)`

#### B. autoNode 的 L2 接線（分流器 / 匯流器 / 物流橋）

對應 spec：`02_pipeline.md` §2.5、`08_history.md`。

要點：
- 生成邏輯（決定該插哪種 node、座標、新拓樸）以及「Command 產生並推入歷史」都由 L1 負責。L2 只做：
  1. 在 commit draft 時呼叫 `editorStore.addConnection(edge: FactoryEdge)`，該 action 應內部自動處理 autoNode 生成與歷史記錄。**L2 不需要再包 Command、不呼叫 `historyStore.execute()`**。
  2. **目前 Phase 1 的 `addConnection` 為簡化版，autoNode 自動生成尚未實作**；toby 要跟 dernoson / aaaaa 對齊補上時程與簽名。
- 截斷模式切換：點選 `<AutoNodeBadge>` 後呼叫 L1 提供的對應 high-level action（目前 `editorStore` 尚未暴露 `toggleSplitterMode`，需請 L1 補）；該 action 內部自動進歷史。
- 物流橋不可切換（不顯示切換 badge），L2 在 map prop 時就要過濾掉 `kind === 'bridge'` 的 autoNode 不發 toggle event。

#### C. 設備移動時管線跟隨更新

對應 spec：`01_canvas_and_devices.md` §2.4、§6.3 「設備正對管線時自動連接」。

要點：
- 設備 move 完成後的「管線端點重算」、「90 度重驗」、「auto-connect」全部由 L1 的 `editorStore.moveDevices(uids, delta)` 內部負責。
- L2 只負責：收集 move 的 uids + delta，呼叫一次 `moveDevices(...)`。整個 move（含跟隨與 auto-connect）由 L1 包成單一歷史項目，一次 Ctrl+Z 全還原。
- **目前 Phase 1 的 `moveDevices` 內部管線跟隨尚未完整實作**（L1 已留好 hook，待 CR-02 階段補上）；toby 反映給 L1 補，**不要在 L2 自己組 Command**。

範例（示意）：

```typescript
function commitMove(uids: string[], delta: { x: number; y: number }) {
  // 一次呼叫；L1 內部處理管線跟隨、重驗、auto-connect 並產生單一歷史項目
  editorStore.moveDevices(uids, delta)
}
```

#### D. 框選複製含管線

對應 spec：`01_canvas_and_devices.md` §2.5、`08_history.md`。

要點：
- 框選範圍判定（哪些 node / edge 落在框內）、管線納入規則（兩端都在框內才複製）、新舊 uid 對照表、整組進歷史 — 這些**全部由 L1 已提供的 `editorStore.pasteSelection(devices: FactoryNode[], connections: FactoryEdge[], offset: { x: number; y: number })`** 內部處理。
- L2 只負責：把框選範圍內的 nodes + edges 與貼上的偏移量丟給該 action。
- 若實作中發現 paste 的某些邊界 case L1 還沒處理（例如跨 autoNode），toby 跟 L1 對齊介面並請 L1 補。

#### E. 跟 L1 對齊跨 store 操作介面

原規劃中的 `placedDeviceStore + pipelineStore` 已合併為單一 `editorStore`。凡是「同時動到 nodes + edges」的操作，**不在 L2 寫 macro**（`createMacroCommand` 與 `src/lib/macros/` 在程式碼中根本不存在）。toby 的工作是：

1. 列出所有 L2 需要的跨資料操作（例：放置設備時自動連接、移動設備時管線跟隨、autoNode 生成、框選複製）。
2. 跟 dernoson / aaaaa 對齊每個操作對應的 `editorStore` high-level action 簽名（input / output / 是否自動進歷史）。
3. 若 L1 還沒提供（例如 Phase 1 的 `addConnection` 還沒含 autoNode、`moveDevices` 還沒含管線跟隨），請 L1 補上（由 L1 在 action 內部把多個 mutation 組合成單一歷史項目）。
4. L2 container 內只呼叫這些 high-level action，**不出現 `historyStore.execute(...)`、不 import `createMacroCommand`、不建立 `src/lib/macros/` 資料夾**。

### 2.2 Code review harry 的 PR

review 重點清單：

| 檢查項 | 為什麼重要 |
|---|---|
| 有沒有「直接改 store state 而非走 action」的 mutation | 走 action 才會自動進歷史；直接改 state 就漏 undo |
| 有沒有人在 L2 自己呼叫 `historyStore.execute()` 或 import `createMacroCommand` | 違反新決策；應該改成呼叫對應的 L1 high-level action（缺的請 L1 補） |
| 是否 import store 從 L3 內部 | 違反硬規則 1 |
| props 是不是 plain object 而非 reactive ref | 防止 L3 不小心改到 store |
| 滑鼠 / 鍵盤事件有沒有清掉 listener | 容器卸載時的 memory leak |
| Ctrl+Z / Ctrl+Y 有沒有正確綁到 `historyStore.undo() / redo()`，且 input focus 時不觸發 | UX 與快捷鍵 scope |
| `useMagicKeys` 綁的快捷鍵有沒有 scope 衝突 | 例如 input focus 時不該觸發 Delete |
| Vue 響應性陷阱：reactive 物件解構 / Map 寫入未觸發更新 | flowStore 用 Map，要確認 set 之後畫面有更新 |
| 90 度驗證的邊界 case：waypoints 為空、首尾貼齊 | spec 沒講但實際會炸 |

### 2.3 與 harry 的協作方式

- 每隔一天 30 分鐘同步進度與卡點
- harry 卡住超過半天的問題：直接 pair 一輪帶過去，不要讓他自己鑽
- toby 的 PR 也丟給 harry review，讓 harry 熟悉技術細節並學習
- 對 spec 有疑問時，由 harry 出面去問 dernoson；toby 提供「技術上可不可行 / 有什麼隱含風險」的判斷

---

## 3. 對 L1 的依賴項目（toby 視角）

L1 已交付的 `useEditorStore` 已暴露 L2 主要需要的 high-level actions。**所有列在「高階 actions」的呼叫一次 = 一筆歷史項目**，L2 不需要也不應該自己包 Command 或 macro：

```typescript
import { useEditorStore } from '@/store/editorStore'

// 高階 actions（自動進歷史）
placeDevice(node: FactoryNode): void
//   ↑ 應內部自動處理放置後 auto-connect；Phase 1 尚未含
moveDevices(uids: string[], delta: { x: number; y: number }): void
//   ↑ 應內部自動處理：管線端點重算、90 度重驗、移動後 auto-connect；Phase 1 尚未含管線跟隨
rotateDevice(uid: string, rotation: Rotation): void  // Rotation = 0|1|2|3
removeDevices(uids: string[]): void                  // 含關聯邊
setRecipe(uid: string, recipeIndex: number): void
pasteSelection(devices: FactoryNode[], connections: FactoryEdge[], offset: { x: number; y: number }): void
addConnection(edge: FactoryEdge): void
//   ↑ Phase 1 簡化版；autoNode（分流 / 匯流 / 物流橋）自動生成尚未實作
removeConnection(uid: string): void

// 尚未存在、需請 L1 補的 high-level actions（toby 跟 L1 對齊）：
// - toggleSplitterMode(connectionUid, autoNodeIndex)  ← AutoNodeBadge 截斷模式切換
```

```typescript
import { useHistoryStore } from '@/store/historyStore'

// L2 只用 undo / redo / canUndo / canRedo / undoDepth / redoDepth
undo(): Command | null
redo(): Command | null
canUndo / canRedo / undoDepth / redoDepth  // computed
// ※ 沒有對 L2 開放的 execute()；Command 由 editorStore action 內部產生
```

L1 提供的純函式 utility（不寫入、不進歷史）位於 `src/utils/`（例如 `portUtils`），可直接 import 使用。早期文件提到的 `findCrossings` / `isPortFacing` 等簽名以 L1 實際 export 為準。

若 L1 提供的某個 action 還沒把該包進歷史的子操作包好（例如 `moveDevices` 還沒處理管線跟隨、`addConnection` 還沒處理 autoNode），toby 反映回 L1 補；**不在 L2 寫 macro 補位**。

---

## 4. 風險與緩衝

| 風險 | 緩衝策略 |
|---|---|
| 畫布渲染套件選定（**Vue Flow 已選定**，`@vue-flow/core` 已安裝），影響 hit test 與事件流寫法 | 90 度驗證寫成「不依賴具體 renderer」的 pure function；事件層再透過 Vue Flow API 接 |
| L1 high-level action 介面 Phase 1 尚未完備（`moveDevices` 未含管線跟隨、`addConnection` 未含 autoNode、`toggleSplitterMode` 尚未存在） | toby 在 kickoff 前列出 L2 需要的所有跨資料操作，逐一跟 L1 對齊；缺的請 L1 補，**不在 L2 用 macro 補位** |
| 框選複製範圍跨 autoNode 的邊界 | 由 L1 high-level action 決定；第一版以「autoNode 算 device」一律納入，若不合理再跟 L1 討論調整 |

---

*本文件為 toby 的 L2 個人職責定義，總體分層原則見 `L2.md`，協作對象見 `harry.md`。*
