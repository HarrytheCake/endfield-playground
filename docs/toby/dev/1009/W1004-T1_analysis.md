# W1004-T1 分析摘要

分析日期：2026-10-09。此文件記錄需求、程式基準與執行建議；實際執行結果依各步驟文件與索引。

## 來源與基準

- [開發守則](../../claude/AGENTS.md)，尤其 A.1、A.5、A.7、A.11。
- [W1004-T1 工單](../../../work_dispatch/toby/1004/W1004-T1_unbounded_canvas.md)。
- [無邊界格點教學](../../../work_dispatch/toby/1004/GUIDE_unbounded_canvas.md)。
- [A0 上游派工 §1](../../../work_dispatch/aaaaa/1004/W1004-A0_dispatch_and_e003.md)：出界 ID 列表為必做，但 T1 可先沿用現有幾何。
- [前期落子交付](../0926/W0921-T1_steps.md)。

分析時分支為 `dev/toby`，`git status --short --branch` 未列出變更。這是文件建立前的基準；真正開始實作時必須再確認。

## 需求與可觀察結果

世界是無邊界格點，SVG 是可平移的視窗。原 12×8 不再限制顯示或點擊落子範圍。選基地只新增框線與出界 Error 視覺，不阻止放置。

1. 正式首頁可平移到原 12×8 之外，放下設備並看見完整佔格。
2. 未選基地時，沒有基地框或出界 Error。
3. 已選基地時，框線存在；設備任何佔格跨界都標示 Error，仍能透過既有 action 放置。
4. 重疊、無效機器或無效座標仍沿用既有拒絕規則。
5. GridCanvas 不 import Pinia 或任何 store 模組，純資料由 props 傳入。

## 實際程式現況

| 檔案                                                    | 現況                                                                 | 本工單影響                                          |
| ------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| `src/editor/layout/GridCanvas.vue`                      | 預設 12×8，SVG 寬高由格數乘 cellSize；點擊依矩形比例換算格數         | 改為容器大小的視窗與可見格線，使用一致的座標轉換    |
| `src/editor/layout/LayoutView.vue`                      | 讀 layoutStore，預檢後呼叫 addDevice；空設備時載入 connected fixture | 新增視窗互動及基地資料映射，保留落子與 fixture 行為 |
| `src/editor/layout/useGridViewport.ts`                  | 已提供 panBy、screenToCell、cellToScreen、zoomAt 等純視窗操作        | 優先直接使用，不重寫數學                            |
| `src/store/canvasStore.ts`                              | baseRegion 可為 null，canvasSize 衍生自 BASE_REGION_SIZES            | L2 讀取；不在 GridCanvas 引入此模組                 |
| `src/utils/layout/placementCheck.ts`                    | 檢查 invalid／overlap，沒有基地邊界條件                              | 保留原行為，不加入出界拒絕                          |
| `src/utils/geometryUtils.ts`                            | isWithinBaseRegion 可重用；isDeviceWithinBaseRegion 吃舊 FactoryNode | 不把 PlacedDevice 強制轉成舊 node                   |
| `src/utils/layout/deviceOccupancy.ts`、`toFootprint.ts` | 已處理旋轉尺寸及 z 層佔格                                            | 出界與畫面佔格使用相同來源                          |
| `src/editor/layout/GridCanvas.stories.ts`               | 已有畫布 Story                                                       | 實作時調整明確容器尺寸與邊界情境                    |

基地尺寸：`wuling` 為 256×256；`valley4` 為 192×192。基地內格點滿足 `0 <= x < w`、`0 <= y < h`。框線右、下邊畫在 `w`、`h`，但索引 `w`、`h` 已經出界。

## 資料流與分層

```text
Navbar → canvasStore.baseRegion
                    ↓
LayoutView：基地尺寸、出界 ID、useGridViewport 視窗狀態
                    ↓ props
GridCanvas：可見格線、設備佔格、管線、基地框、Error
                    ↓ 使用者事件
LayoutView：平移 → panBy
            點擊 → screenToCell → 既有 handleCellClick
                    ↓
canPlaceDevice → layoutStore.addDevice → history → props 重繪
```

建議把視窗狀態與平移手勢生命周期放在 L2，GridCanvas 以 props／emits 處理顯示及元件內事件。GridCanvas 不註冊全域快捷鍵或直接存取 store。若點擊改為先 emit 本地像素，再由 LayoutView 換算，需保留現有 `cell-click(Position)` 契約的可用路徑，不能讓 Story 或其他呼叫端靜默失效；步驟 01 先選定唯一接法。

## 範圍與限制

主要修改為 `GridCanvas.vue`、`LayoutView.vue`，必要時同步其 Story 與直接相關測試。既有元件不因命名規則順便搬家。

實作時發現 Storybook 主設定未收錄原有 GridCanvas Story，因此補上 `.storybook/main.ts` 的單檔收錄路徑，以完成實際 Story 驗證，不收錄其他 L2 容器。

禁止修改 `MainLayout.vue`、ToolbarPanel template／style、StatsPanel、選取／旋轉／刪除行為與 `layoutStore.addDevice` 簽章。不處理 connected fixture 自動載入、引擎改接 layoutStore、框選、埠命中及 C1 管線互動。縮放不是本週必要交付，須先完成平移與出界 DoD。

設備填色、字重與正式視覺稿留給 G＋S；本工單提供穩定設備群組、出界 class 與最低限度可辨識的 Error 視覺。

## 問題分類與依賴

- 本工單缺陷：固定 SVG 範圍、固定格數換算、缺少平移與基地視覺接線。
- 上游缺件：分析時本分支未找到 `devicesOutsideBase`。實作前再搜尋，若已交付直接使用；尚未交付可在 LayoutView 暫用既有佔格與 isWithinBaseRegion，不建立第二套旋轉算法。
- 已知基準問題：空畫布自動載入 fixture；本週保留，不以空畫布驗收失敗為由擴大修正。
- 文件落差：AGENTS 架構導覽與舊 L2 文件部分仍描述 editorStore／Vue Flow。最新工單與實際首頁已使用 LayoutView／layoutStore，本工單依此路徑工作。
- 容器風險：MainLayout 由 harry 負責。若其容器無有效尺寸導致 SVG 為零高，記錄 DOM 與尺寸證據，不透過修改禁止檔案解決。

## 交付方式

依 [分步索引](./W1004-T1_steps.md) 一次完成並驗收一個步驟。程式修改後記錄實際測試結果與上游待辦；未執行的驗收不標示通過。不得自行 push、建立 PR 或合併。
