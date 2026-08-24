# Session Handoff —— 給下一個聊天用的接續筆記

**用途：** 開新聊天時貼給 Claude 看，快速還原這個 session 建立的角色定位、工作流程與現況，不用重新從頭摸索。
**身分：** L2 容器層 Owner，負責 CR-01（畫布）+ CR-02（管線）+ CR-11（工具列）。詳細角色定位見 [README.md](README.md)，五項 editorStore action 缺口清單見 [MILESTONE_0726.md](MILESTONE_0726.md)。
**最後更新：** 2026-08-24（本輪 session，box-select／旋轉／管線折線／節點格線對齊）

---

## 1. 這個 session 建立的工作流程（下一輪請延用）

1. **大改動前先寫 `PLAN_<功能>.md`**：範疇判定（哪些檔案屬於 L1/L2/L3）、既有介面盤點、設計、明確排除範圍、待確認問題。使用者確認決策後才動工
2. **實作完成前一定跑四項驗證**：`pnpm type-check` / `pnpm lint-check` / `pnpm format-check` / `pnpm test`，全過才算完成
3. **一批功能做完後寫 `PR_DESCRIPTION_<日期>.md`**：整理變更檔案、範圍外項目、已知風險，附驗證結果與對應 PLAN 文件連結表，方便直接貼進 GitHub PR
4. **遇到不確定的產品/設計決策就用選項讓使用者選**，不擅自定案（例如：Esc 要不要開放自訂、鍵位衝突要擋下還是警告、檔案鎖要不要覆蓋）
5. **發現既有程式碼的問題（dead state、命名不一致、失效綁定等）先回報，不擅自順手修**，除非使用者明確要求
6. **要動到本週被檔案鎖鎖住的檔案（例如 toby 的 W0823-T1/T2）時，先明講衝突再問使用者要不要覆蓋**——這輪多次發生（見 §3），使用者傾向「直接覆蓋，保持 diff 精簡並在 commit message 註明」

## 2. 目前已完成、已驗證通過的功能

| 功能 | 對應文件 | 變更檔案重點 |
|------|----------|---------------|
| addConnection（畫管線） | [PLAN_addConnection.md](PLAN_addConnection.md) | `FlowNodeOverlay.vue` 動態多埠 Handle、`FactoryCanvas.vue` `@connect` |
| removeConnection（刪管線） | [PLAN_removeConnection.md](PLAN_removeConnection.md) | `selectionStore.ts` 加 `selectedEdgeIds`、Delete 鍵、右鍵選單 |
| resetCanvas（暫時性 Ctrl+R） | [PLAN_resetCanvas.md](PLAN_resetCanvas.md) | `useShortcuts.ts` 的 `triggerResetCanvas()` |
| 快捷鍵可配置化 + WASD 平移 + Esc 設定介面 | [PLAN_wasdCameraPan.md](PLAN_wasdCameraPan.md) / [PLAN_configurableShortcuts.md](PLAN_configurableShortcuts.md) / [PLAN_shortcutSettingsPanel.md](PLAN_shortcutSettingsPanel.md) | 新增 `keybindingStore.ts`、`useKeybinding.ts`、`ShortcutRow.vue`、`ShortcutSettingsPanel.vue` |
| paper_fig 設計稿 Vue 轉換（v1） | 見 [PR_DESCRIPTION_0823.md](PR_DESCRIPTION_0823.md) §4 | 新增 `src/app/dev/PaperFigMainField.vue`，dev-only 路由 `/dev/paper-fig-main-field`，不掛在左側 dev 選單 |
| P 鍵／Navbar 切換管線工具（W0823-H1） | [PLAN_connectTool.md](PLAN_connectTool.md) | `keybindingStore.ts` 新增 `toggleConnectTool`、`useShortcuts.ts`、`Navbar.vue` |
| X 鍵切換框選 + 框選視覺化 + 批次移動/旋轉 | [PLAN_boxSelectVisualAndMultiOps.md](PLAN_boxSelectVisualAndMultiOps.md) | 詳見 §3.1 兩個 Vue Flow 失效綁定；`editorStore.ts` 新增 `rotateDevices`；`style.css` 選取框顏色覆寫 |
| 旋轉後埠方向與連線端點正確跟轉（R-B3 接線缺口） | 同上 PLAN 內文 + 對話記錄 | `FlowNodeOverlay.vue`：`position` prop 用 `rotatePortSide` 換算，視覺座標維持原始 side 交給既有 CSS transform；`updateNodeInternals` 強制連線重新量測 |
| 管線折線 90 度直角轉彎（R-C3 幾何部分） | [PLAN_pipelinePolylineRender.md](PLAN_pipelinePolylineRender.md) | 新增 `src/utils/pipelinePath.ts`（`buildPipelinePath`，L/Z 形演算法）、`PipelineEdge.vue` 自己算路徑（不需改 `FactoryCanvas.vue`）；後續補中繼點吸附格線（`provide`/`inject` `gridSize`，新增 `injectionKeys.ts`） |
| 節點外框吃真實 machine 尺寸並精準貼齊格線（接手 W0823-T1） | [PLAN_nodeFootprintSize.md](PLAN_nodeFootprintSize.md) | `FlowNodeOverlay.vue` 外框改 `machine.width/height × gridSize`；`style.css` 歸零 Vue Flow 預設佈景外層 wrapper 的 `padding`/固定 `width`/`border-width`；埠視覺位置改用 `offset × gridSize` 對齊格子中心 |

以上皆已 commit（見 §4 分支列表）。

**額外設計筆記（尚未實作）：** [DESIGN_clipboardAndEdgeSelectionState.md](DESIGN_clipboardAndEdgeSelectionState.md)——clipboard store 與管線選取狀態的資料模型構想，對應 MILESTONE §5 問題 2、3。

## 3. 本輪重要技術發現（下次遇到類似症狀先看這段，避免重複除錯）

### 3.1 兩個看似合理、實際完全失效的 Vue Flow 綁定

`FactoryCanvas.vue` 曾經用 `:selection-on-drag="activeTool === 'box-select'"` 與 `@selection-change="handleSelectionChange"` 做框選，兩者在這個專案用的 Vue Flow 版本（`@vue-flow/core@1.48.2`）**都不存在**——不是 prop 也不是 event，Vue 只是把它們當成無意義的 fallthrough attrs 靜默吞掉，activeTool 切換得完全正常，但框選拖曳本身跟選取同步全部沒有實際作用。

- 正確的框選觸發方式：`:selection-key-code="activeTool === 'box-select' ? true : undefined"`——傳字面 boolean `true`（不是按鍵字串）給 `selectionKeyCode`，搭配 `panOnDrag` 未啟用，左鍵拖曳就會直接框選
- 正確的選取同步方式：`watch(getSelectedNodes, ...)`／`watch(getSelectedEdges, ...)`（`useVueFlow()` 提供的兩個 `computed`），取代根本沒被觸發過的 `@selection-change`

**教訓：這個版本的 Vue Flow 沒有官方 TS 型別檢查會攔下這種「傳給元件一個不存在的 prop/event」的錯誤**（Vue 對未宣告的 prop/event 一律當 fallthrough attr，不會噴 warning）。之後如果懷疑某個 Vue Flow 互動「activeTool 換了但沒反應」，先去 `node_modules/@vue-flow/core/dist/types/*.d.ts` 或 `types/hooks.d.ts` 確認該 prop/event 真的存在，不要只憑印象或舊教學文章。

### 3.2 CSS transform 旋轉不會觸發 Vue Flow 重新量測 Handle

`FlowNodeOverlay.vue` 用 `transform: rotate()` 讓整張卡片視覺旋轉，但 CSS transform 不改變版面尺寸（layout box），Vue Flow 內建的 `ResizeObserver` 只在版面尺寸變動時才重新量測 Handle 座標並更新連線端點。純旋轉不會觸發它，導致連線停在旋轉前的座標。修法：`watch(rotation, () => nextTick(() => updateNodeInternals([props.id])))`。

### 3.3 `<Handle :position>` 同時是 CSS 定位依據，也是 Vue Flow 判斷連線方向的依據

不能只改其中一個。這個 session 的最終解法（`FlowNodeOverlay.vue`）：`position` prop 餵 `rotatePortSide` 換算後的方位（給連線方向判斷用），但視覺座標（`style`）刻意手動複製 Vue Flow 內建 class 的定位樣式、鍵在**原始未旋轉的 side** 上（交給父層既有的 CSS rotate transform 帶到正確的最終方位）。兩者故意不同，混用同一個值會造成「連線方向對了但視覺位置雙重旋轉跑掉」或反過來。

### 3.4 Vue Flow 預設佈景（`theme-default.css`）對自訂節點型別的隱藏尺寸干擾

自訂節點型別命名為 `default`（`const nodeTypes = { default: FlowNodeOverlay }`）時，Vue Flow 會把內建的 `.vue-flow__node-default` class 套到**外層 wrapper**（不是 `FlowNodeOverlay.vue` 自己的根節點，是 Vue Flow 另外包的一層，真正用 `transform: translate(x,y)` 定位到 `node.position` 的元素）。這個 class 帶了 `padding: 10px`、固定 `width: 150px`、`border-width: 1px`——三者都會讓內層精確尺寸的方塊看起來對不齊背景格線／比機器實際尺寸大。全部要在 `style.css` 用 `.vue-flow__node.vue-flow__node-default { padding: 0; width: auto; border-width: 0; }` 歸零（連同既有的 `background-color: transparent` 覆寫）。**只要之後又新增自訂節點型別、且沿用 Vue Flow 的內建型別名稱（`default`/`input`/`output`），一律要檢查這個外層 wrapper 有沒有帶多餘的尺寸樣式。**

## 4. 分支狀態

這輪從 `dev/cake`（`657f5c4`）一路開了三個子分支，逐步疊加功能，**目前 HEAD 在最後一個**：

```
dev/cake (657f5c4, 已 push)
  └─ dev/cake_boxselect (ad65a8c, 已 push) —— X 鍵框選 + 旋轉/連線修復
       └─ dev/cake_pipeline (85f4b28, 已 push) —— 管線折線 + 格線吸附
            └─ dev/cake_tobygrid (a65c2ab, 尚未 push) —— 節點外框格線對齊 ← 目前所在分支
```

`dev/cake_boxselect` 與 `dev/cake_pipeline`已經 push 到 `origin`（使用者自己或透過本 session push，已用 `git ls-remote` 核對過）。`dev/cake_tobygrid` 目前只在本機，還沒 push——下一輪如果要接續在這個分支上工作或要 push，記得先問一句。

**注意：分支名稱與內容不是嚴格一一對應**——`dev/cake_boxselect`裡其實同時含有 P 鍵管線工具、X 鍵框選、旋轉/連線修復三批功能（因為是循序 commit 上去的，不是每個分支只對應同名功能）。要找特定功能改了什麼，看 §2 表格對應的 PLAN 文件與 commit message 比看分支名稱準。

## 5. Dev Server 狀態

這輪穩定用 **port 5173**（不是舊筆記提過的 5174，那是更早一輪因為 config 變動才跳掉的，這輪沒再遇到）。新開聊天時先確認是否還活著（`curl -s -o /dev/null -w '%{http_code}' http://localhost:5173`），沒開就 `pnpm dev`（背景執行）重新啟動。

## 6. 現在進行中、尚未驗證完成的工作

**`PaperFigMainField.vue` 的頂部工具列改版（依 `paperfigv2.css`）這輪完全沒有動**，狀態停在上一輪筆記記錄的地方：`pnpm type-check`/`lint-check` 已過，但**目視比對畫面是否貼近設計稿**這一步從未做過（沒開過瀏覽器實際看）。如果下一輪要接續這塊，回頭讀舊版 handoff 的 §3（已被本次改寫覆蓋，可從 git log 找 `38cd5fc` 之前的版本）或直接問使用者現在還要不要繼續做。

## 7. 這個 repo 已發現但本次沒有一併修的既有問題（下次遇到記得先查這份清單，避免重複調查）

- **`canvasStore.offset` / `canvasStore.zoom` 是 dead state**：完全沒接到 Vue Flow 真實的 viewport。畫面平移／縮放實際上要透過 `useVueFlow().setViewport()` 才會動（WASD 平移已經是這樣做，見 `FactoryCanvas.vue`）
- **`FactoryCanvas.vue` 工具列的 `equipmentLabelMap` 用的是 `smelter`/`crusher`/`assembler`/`conveyor-node`/`power-node` 佔位字串**，只有 `crusher` 對得上 `src/data/machines.ts` 真實的 `Machine.id`，其餘機型放置後查不到真實配方/埠資料
- **`editorStore.resetCanvas()` 沒有走 Command Pattern**，呼叫後無法 `Ctrl+Z` 復原（`useShortcuts.ts` 的暫時性觸發因此加了 `window.confirm()` 防呆）
- **`geometryUtils.getOccupiedCells()` 在全 repo 沒有任何呼叫點**（本輪稽核過），且其註解假設 `device.position` 是格子座標，但 Vue Flow 實際給的是像素——就算之後要接線也要先處理座標系轉換
- **`src/utils/shirone/getMachineOccupiedGrids.ts` 是另一套完全獨立、不相通的 `getOccupiedCells` 實作**，用的是 `shironesMachine`（3D `[x,y,z]`）這個平行型別系統，只被 `src/lib/validation/detectors/overlapDetector.ts` 使用，跟 `editorStore`/`FactoryCanvas.vue` 實際用的 `FactoryNode`/`Machine` 完全沒有接上。兩套邏輯未來若要合併成一套要先確認哪個是要留下來的權威版本
- **非方形機器旋轉後、CSS `transform-origin`（預設繞中心點）會讓外框相對左上角位移**，本輪 W0823-T1 footprint 尺寸明確排除這個修正（toby 的 GUIDE 也說「本週不追」），僅在方形或未旋轉機器上驗證過對齊格線
- **`FlowNodeOverlay.vue` 裡 `rotateTargetUid`（單點點擊記錄旋轉目標）的 fallback 路徑理論上已經很少會用到**：修正 `getSelectedNodes` 同步 bug 後，`selectionStore` 現在單點點擊也會正確反映，R 鍵優先看 `selectionStore`，這個 fallback 目前只在 `selectionStore` 意外為空時才會走到。還沒有整個拔除，因為沒有明確理由要動
- **`src/paper_fig.css`（v1，已刪除）之前的副檔名誤標**會讓 `prettier --check` 直接 SyntaxError；`paperfigv2.css` 目前副檔名也不是真正的 CSS，轉完 `.vue` 後記得一併確認要不要刪除或搬到 `docs/` 下

## 8. 專案基本規則提醒（來自 `docs/dernoson/claude/CLAUDE.md`，長期有效）

- 三層架構：L1（store/型別/引擎）不寫真實 UI；L2（`src/editor/`、composables）互動邏輯；L3（`src/components/`）純展示，**不得 import Pinia store**——**注意 `src/editor/` 底下的檔案（例如 `FlowNodeOverlay.vue`、`FactoryCanvas.vue`、`PipelineEdge.vue`）屬 L2，本來就可以 import store；`PipelineEdge.vue` 不 import store是 R-C3 這張工單自己額外訂的規則，不是通用三層規則，兩者不要搞混**
- 元件命名：PascalCase 資料夾 + `Index.vue`
- 註解：繁中、JSDoc、禁 emoji、講「為什麼」不講「做了什麼」
- Store 操作：L2 一律呼叫 L1 高階 action，不自組 Command、不直接 mutate `nodes`/`edges`
- 不擅自 push / 建 PR / 合併 master；大改動先討論分步驟
- Nuxt UI 元件優先，VueUse 工具函式優先，自訂顏色寫 `tokens.css`（但目前 `style.css` 還有不少既有的散落顏色值，非本次要處理）

## 9. 上一輪（2026-08-23）的 git 事故記錄（歷史保留，供對照）

那一輪一開始 `git status` 顯示 `Revert currently in progress`，是上上一個 session 或其他協作者留下的未完成 revert 序列（針對 PR #30 的一連串 revert/reapply），跟本文件描述的 CR-01/02/11 工作無關。過程中 `git revert --continue` 差點刪掉已完成的快捷鍵可配置化功能（誤判成垃圾 commit），改成 `--abort` 又不小心把分支 reset 回比預期更早的 commit，一度讓好幾個檔案從工作目錄消失（後來用 `git reflog` 找回 `780ebcf` 復原，沒有真的遺失）。**教訓：`git revert --abort` 的 ORIG_HEAD 不一定是「乾淨、你以為的那個起點」，abort 前最好先用 `git reflog` 確認會落在哪個 commit。** 完整細節見 git log 裡 `38cd5fc` 這次 commit 的內容（`git show 38cd5fc`）。
