# W1011-T2 分析摘要

分析日期：2026-10-16。狀態：步驟 01–05 已依序完成本地實作與驗證，使用者已指示將最終變更提交本機 Git；未 push／開 PR。各步驟保留執行當時的階段證據，最終結果見步驟 04／05。

## 1. 來源與基準

- 開發守則：[AGENTS.md](../../claude/AGENTS.md)，依 A.11 進行範圍、資料流、問題分類與分步分析。
- 工單：[W1011-T2](../../../work_dispatch/toby/1011/W1011-T2_device_drag.md)。
- 上游：[週派工 v1.2](../../../work_dispatch/WEEK_20261011.md)。
- 選取接收端：[W1011-H2](../../../work_dispatch/harry/1011/W1011-H2_left_panel_swap.md)。
- 實際基準：本機 `dev/toby`、commit `4cfa624`；分析開始時工作樹乾淨。尚未更新遠端，不宣稱與最新 master 一致。
- AGENTS 架構導覽與 L2 舊文件部分仍描述 Vue Flow／editorStore；本單依最新派工與實際首頁的 LayoutView／layoutStore 路徑分析。

本次依使用者要求將分析與詳細步驟存入本目錄；使用者後續已要求依序執行並在完成步驟後驗證，現已依序完成。push 或建立 PR 仍需明確指示。

## 2. 目標與範圍

正式頁的已放設備可拖到另一格；拖曳時只有本地預覽，正常放開才透過高階 action 提交一次。失敗回原位、不彈窗。未拖動的點擊提供選取事件，空白拖曳仍能平移。

| 檔案 | 本單責任 |
| --- | --- |
| `src/editor/layout/LayoutView.vue` | 指標分流、設備命中、本地手勢／預覽、單次提交、選取 emit、落子 click 抑制 |
| `src/editor/layout/GridCanvas.vue` | 純 props 預覽渲染與必要拿起狀態，保留既有 cell-click |
| `src/editor/layout/GridCanvas.stories.ts` | 必要時補預覽、空值及邊界情境；不引入 Pinia |
| `src/__tests__/` 對應測試 | 有需要時補互動驗證；不得以重寫實作邏輯的測試代替真實事件驗收 |

禁止修改 `layoutStore.ts`、`placementCheck.ts`、`editorStore`、MainLayout；不處理 Ctrl+Z 接鍵、旋轉、Delete、多選、工具列拖曳落子、整套 shapes 替換、管線跟隨。保留既有點擊落子、初始化 fixture、基地 Error、視窗換算與中鍵／平移工具操作。

## 3. 實作前現況與目標資料流

```text
MainLayout → LayoutView → GridCanvas
                │            └─ click → cell-click(Position)
                ├─ useGridViewport：offset／zoom／screenToCell／panBy
                ├─ usePlacementIntent：armedMachineId → 預檢 → addDevice
                └─ layoutStore.devices／pipelines → props

本單新增：
pointerdown → 座標換算 → 手勢分流／設備佔格命中
pointermove → local ref 預覽 → GridCanvas prop
pointerup   → 有效移位 → moveDevice → 成功寫入／失敗清預覽
未拖動點擊 → LayoutView emit select-device(id | null) → H2 接收
```

1. LayoutView 目前僅在中鍵或 activeTool=pan 的左鍵開始平移；選取工具下的空白拖曳尚未實作。
2. GridCanvas 接唯讀 devices／pipelines，按設備佔格畫 SVG，只有 cell-click 事件，尚無預覽 prop。
3. 命中應沿用 `getMachineById` → `deviceSizeFromMachine` → `toDeviceFootprint` → `getDeviceOccupiedCells`。與目前畫布一樣，以 xy 投影判斷可見佔格；不把 screenToCell 固定產出的 z=0 強套成設備層別限制。
4. `PlacedDevice.id` 是實例識別，`machineType` 是機器定義 ID，不可互換；position 以格為單位，rotation 是 0–3 次旋轉。
5. `moveDevice(id, position)` 回傳 PlacementResult，拒絕時不改資料；成功後自行推入 history。即使傳入原位置，也沒有略過歷史的判斷。
6. 管線存絕對座標，移動設備不會跟著平移；衍生 connections 可能斷線，屬既有模型。
7. H2 明定選取 ID 放 MainLayout local ref；本單只提供 select-device，不能自行改 MainLayout 或新增 selection store。
8. 既有 store 測試涵蓋成功移動、重疊拒絕、找不到 ID、非有限 z 等；尚未看到 LayoutView 指標互動測試。Vitest 使用 node 環境，不能預設已具備 DOM 元件測試能力。

## 4. 問題分類與文件落差

| 分類 | 發現 | 處理方式 |
| --- | --- | --- |
| 本單缺口 | 設備命中、預覽、移位提交、選取事件均未接 | 在兩個畫布檔案完成接線 |
| 本單風險 | pointerup／pointercancel／lostpointercapture 現在共用結束路徑 | 只有正常放開能提交，取消及卸載只清理 |
| 本單風險 | 既有 click 連續落子可能在拖曳後誤觸 | 統一手勢結果與 click 抑制，驗證下一次正常點擊可恢復 |
| 上游接線 | MainLayout 尚未訂閱 select-device | 交付事件契約；面板顯示驗收由 H2 接手 |
| 文件落差 | 工單稱 moveDevice 內跑 canMoveDevice | 實際兩者共用 assessInvolving；直接呼叫 action 即可，不重構 store |
| 文件落差 | 週派工寫出界禁區應回原位 | 目前移動判定沒有基地邊界限制；LayoutView 的出界只顯示 Error。沿用 action 結果，不新增邊界阻擋；若驗收要求改變，先交由需求／L1 負責人釐清 |
| 視覺落差 | 現有設備本來就是淺藍填色 | 預覽須具可辨識拿起狀態；本次只補必要狀態，不整套換皮 |
| 後續需求 | C1 已有 hitTestPortAt | 分流保留可插入埠命中的位置；本單不呼叫它或實作拉線 |

`hitTestPortAt` 使用連續格座標，不能在後續 C1 直接餵入 floor 後的 screenToCell 結果；本週保留清楚座標入口即可，不預先建立通用互動框架。

## 5. 建議互動契約

- 中鍵或平移工具左鍵優先進平移，按到設備也不搬動。
- 普通左鍵命中設備：進入待拖／點選狀態，超過小幅螢幕像素門檻才視為拖曳。
- 普通左鍵空白：未拖動可清選取並保留原有武裝落子；超過門檻開始平移並抑制落子。門檻數值在步驟 01 固定並記錄。
- 預覽位置＝設備起始 position＋目前游標格與按下格的 xy 差值；保留設備原 z，避免從設備中間抓取時跳位。
- GridCanvas 建議新增可空的 `deviceDragPreview` prop，包含 deviceId 與 position，預設 null。渲染時只替換該設備的顯示位置並帶拿起狀態；不改 props、不疊留原位實體。名稱可於步驟 01 調整，但介面須保持唯讀。
- 只有 pointerup、已判定拖曳且終點不同原位才呼叫一次 moveDevice；未移位點選或拖回原格不新增歷史。
- pointercancel、lostpointercapture、卸載不提交、不選取、不落子；清理需可重複執行，避免 releasePointerCapture 引發第二次處理。
- 多指標期間僅接受起始 pointerId；右鍵不啟動本單手勢。

上述契約已於 [步驟 01](./W1011-T2_step_01_scope.md) 定稿，並在步驟 02／03 實作：一般左鍵拖曳門檻為螢幕歐氏距離 ≥4 CSS px，預覽 prop 採唯讀 deviceDragPreview、預設 null。一般左鍵捕捉 SVG，保留原 click 落子路徑。若後續文件或使用者指定不同優先序，先更新對應步驟。

## 6. 驗證與交付

按 [分步索引](./W1011-T2_steps.md) 逐步執行。驗收涵蓋成功／拒絕、點選／平移／落子互斥、座標與旋轉、取消／卸載、多指標、預覽與 history。完整品質指令為 type-check、lint-check、format-check、test；修改 Story 時另驗證 Storybook。未執行的項目須明列，不以既有測試內容宣稱本次通過。

PR 是工單最終交付項，但 AGENTS 明定未經使用者明確指示不可自行 push／開 PR。實作與驗證完成後先提供可審查 diff 及交付摘要。

## 7. 最終結果（2026-10-16）

使用者曾指定參考圖色 #4D7991，之後要求恢復先前顏色，並明確要求保留原本外框。最終拖曳填色為 sky-300（亮暗模式相同），移除該次新增的自訂色票與全域 import；外框沿用未拖曳時的顏色與 1.5 實線，不再加粗或改虛線。

- LayoutView／GridCanvas 已支援本地預覽、淺藍拿起、單次提交、選取 emit 及取消清理；沒有修改禁止檔案。
- 完整品質檢查通過，Vitest 49 份測試共 912 案通過；獨立 Chromium 正式頁驗收曾完成 29 案。瀏覽器腳本後續依使用者要求移除，結果保留為歷史紀錄。
- 九個 Story、Controls JSON 更新／null 恢復、Accessibility 檢查及亮／暗預覽截圖檢視通過；正式與 Storybook 建置皆通過。
- 實體裝置、完整鍵盤／螢幕閱讀器流程未執行；H2 面板接線仍是上游交接，出界維持既有非阻擋 Error 契約。
- 詳細操作、指令、證據與限制見 [步驟 04](./W1011-T2_step_04_verification.md) 與 [步驟 05](./W1011-T2_step_05_quality_gate.md)。
