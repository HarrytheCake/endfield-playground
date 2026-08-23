# PR Description 草稿：快捷鍵可配置化 + Figma 設計稿轉換 dev 頁面

對應 commit `1649872`（快捷鍵可配置化 + WASD 平移畫面 + 設定介面）與 `b46537d`（新增 paper_fig 設計稿 Vue 轉換版 dev 頁面），另加上本輪尚未 commit 的後續調整（`PaperFigMockup` 更名為 `PaperFigMainField` + 底部設備選取列轉換 + 全螢幕排版）。以下內容可直接複製進 GitHub PR 描述欄。

---

## Summary

- 新增 `keybindingStore`，把散落在 `useShortcuts.ts` / `FactoryCanvas.vue` 兩處的所有快捷鍵統一成可配置、可持久化覆寫的單一權威來源
- 新增 WASD 按住平移畫面視角
- 新增 Esc 開啟的快捷鍵設定介面，可即時重新錄製任一動作的鍵位
- 新增 `src/paper_fig.css`（Figma 匯出稿）的 Vue 轉換版 dev 頁面（後更名為 `PaperFigMainField.vue`），接上 5 顆已有現成 action 的按鈕，並嵌入真實 `FactoryCanvas.vue` 預覽
- 該 dev 頁面改為 `h-screen` 全螢幕排版；新增 `PaperFigBottomBar.vue`（依 `paperfigbottombar.css` 轉換的底部設備選取列），預設收合、按 Z 鍵或畫布下緣黃色三角形展開，展開時讓出版面空間、不與畫布重疊

## 1. 快捷鍵可配置化（keybindingStore）

**變更檔案：** `src/store/keybindingStore.ts`（新增，L1）、`src/composables/useKeybinding.ts`（新增，L2）、`src/composables/useShortcuts.ts`、`src/editor/canvas/FactoryCanvas.vue`

- `keybindingStore.ts`：靜態動作清單 `KEYBINDING_ACTIONS`（11 個動作：復原、取消復原、刪除選取、旋轉設備、暫時平移、WASD 四方向、暫時性重置畫布、開啟設定），使用者覆寫用 VueUse `useLocalStorage` 持久化；提供 `resolvedCombo()` / `setBinding()` / `resetBinding()` / `findConflict()`
- `useKeybinding.ts`：鍵盤事件正規化層——`comboFromEvent()` 統一 Ctrl/Meta（跨平台）；`useComboHeld()` 給 hold 型動作（WASD、Space）；`onComboTriggered()` 給 trigger 型動作（Undo、Delete、旋轉、重置畫布），用 `event.repeat` 過濾長按重複觸發；`useKeyCapture()` 給設定介面錄製新鍵位用
- `useShortcuts.ts` / `FactoryCanvas.vue`：全面改為讀 `keybindingStore.resolvedCombo()`，不再硬編字串
- **Escape 例外**：拿起預覽中取消放置固定綁死原生 Escape，**不**透過可配置的 `openSettings` 動作，避免使用者改鍵位後「取消放置」失效

## 2. WASD 按住平移畫面

**變更檔案：** `src/editor/canvas/FactoryCanvas.vue`

- 用 `useVueFlow().setViewport()` 直接操作 Vue Flow 自身的 viewport（**不是** `canvasStore.offset`——後者目前完全沒接到真實畫布，屬既有 dead state）
- VueUse `useRafFn()` 依 delta time 計算位移，僅在至少一方向鍵按住時啟動 raf loop，放開即暫停
- 方向語意：W/A = 視角往上/左移動（`viewport.y`/`x` 增加）

## 3. Esc 開啟快捷鍵設定介面

**變更檔案：** `src/components/ShortcutRow/Index.vue`（新增，L3）、`src/editor/settings/ShortcutSettingsPanel.vue`（新增，L2）、`src/app/App.vue`

- `ShortcutRow.vue`：純展示元件，不 import store，props 進 emits 出，`UKbd` 顯示鍵位徽章
- `ShortcutSettingsPanel.vue`：`UModal` 容器，依分類（歷史／選取／畫布／系統）渲染所有動作，點「設定」進入錄製狀態，鍵位衝突時顯示警告但**不擋下**（允許使用者刻意共用鍵位）
- 掛載於 `App.vue` 最外層，全域可用

**決策記錄：** 不做 Shift 加速；WASD 四方向拆成獨立可配置項；鍵位衝突僅警告不阻擋

## 4. paper_fig 設計稿 Vue 轉換版 dev 頁面

**變更檔案：** `src/app/dev/PaperFigMainField.vue`（新增，原名 `PaperFigMockup.vue`）、`src/router/index.ts`

- 將 `src/paper_fig.css`（實為 Figma 匯出的 JSX 標記，非真正 CSS，副檔名誤標且會讓 `prettier --check` 直接 SyntaxError）轉換為正式 `.vue` 元件，**已刪除原始檔案**
- 轉換時一併清掉 Figma 匯出雜訊：重複兩次的 View Select 區塊只留一份、科學記號角度（`3.5e-15deg`）、alpha=0 透明邊框、浮點誤差像素值、未註冊的 `HarmonyOS_Sans_TC` 字型
- 接上 5 顆有現成 action 的按鈕：復原/取消復原（`historyStore`）、縮放（`canvasStore.zoom`，**尚未接回真實 viewport，已知限制**）、基地切換（`canvasStore.baseRegion`）、快捷鍵設定（`keybindingStore.openSettingsPanel()`）
- 其餘按鈕（匯出/匯入、視角切換、分類 Tab、搜尋）因缺對應 action 或資料模型，維持靜態視覺並在註解說明原因
- 中間嵌入真實 `FactoryCanvas.vue`（非重繪），並補呼叫 `useValidation()` + `useFlowEngine()`（順序對齊 `MainLayout.vue`），讓 overlay 正常運作
- 路由設計：獨立於 `DevLayout` 之外的頂層路由，帶自己的 `import.meta.env.DEV` 守衛，**不**出現在左側 dev 工具導覽列，只能直接切網址到達 `/dev/paper-fig-main-field`
- **更名**：`PaperFigMockup.vue` → `PaperFigMainField.vue`，路由 `/dev/paper-fig-mockup` → `/dev/paper-fig-main-field`，一併更新 `docs/harry/SESSION_HANDOFF.md` 內的文件引用

## 5. paper_fig 底部設備選取列 + 全螢幕排版

**變更檔案：** `src/app/dev/PaperFigBottomBar.vue`（新增）、`src/app/dev/PaperFigMainField.vue`

- 新增 `PaperFigBottomBar.vue`，依 `src/app/dev/paperfigbottombar.css`（Figma 匯出稿）還原「設備選取列」：搜尋框 + 六顆分類 Tab（加工/種植/電力/物流/儲存/武器）+ 可橫向捲動的設備卡片列，**已刪除原始 CSS 來源檔**（比照 §4 對 `paper_fig.css` 的處理方式）
- 按鈕改用 Nuxt UI `UButton`（`variant="ghost"` 卸掉預設樣式，`:ui` prop 蓋上設計稿量測到的尺寸與 `#2B2B2B`/`#3C3C3C`/`#EEFD1C` 配色），維持設計稿原本的結構與色彩；分類 Tab、設備卡片皆無對應 store/資料模型，維持純視覺不接 action。設備圖片素材（`image_miner_2.png` 等）不存在於本專案，改用 Lucide 圖示佔位
- `PaperFigMainField.vue` 由固定高度（`h-150`）改為 `h-screen` 全螢幕排版，畫布容器改用 `flex-1` 撐滿剩餘垂直空間
- 新增 Z 鍵（`useEventListener` 監聽 `window` keydown，固定綁死不走 `keybindingStore`，本頁僅供設計參考）與畫布下緣置中的黃色三角形按鈕，兩者皆可展開/收合底部設備選取列
- 展開/收合採條件渲染 + flex 排版（`PaperFigBottomBar` 是與畫布容器同層的 flex 子項），**非** absolute 疊層，因此展開時畫布會讓出空間變矮，兩者不重疊

## 明確不在本次範圍內

- 快捷鍵：匯出/匯入自訂鍵位設定
- WASD：Shift 加速、`activeTool === 'pan'` 與 WASD 併存的邊界情境未特別處理
- paper_fig mockup：匯出/匯入、視角切換（CR-05）、搜尋、分類 Tab、設備卡片點擊（`EquipmentType` 對應真實 `Machine.id` 尚未決定映射方式，皆維持純視覺）
- `canvasStore.zoom` 接回真實 Vue Flow viewport（既有 dead state，本次沒有一併修）

## 驗證

```
pnpm type-check   # 通過
pnpm lint-check   # 通過
pnpm format-check # 通過
pnpm test         # 28 個測試檔、301 個測試全通過
```

手動測試待補：各動作重新錄製鍵位並確認生效、WASD 平移方向與速度、Esc 在拿起預覽/一般狀態下的優先序、paper_fig mockup 頁面五顆按鈕實際效果、中間嵌入畫布操作、Z 鍵與黃色三角形展開/收合底部設備選取列、全螢幕排版在不同視窗尺寸下的表現。

## 對應文件

| 功能 | 計畫文件 |
|------|----------|
| WASD 平移 | [docs/harry/PLAN_wasdCameraPan.md](PLAN_wasdCameraPan.md) |
| 快捷鍵可配置化 | [docs/harry/PLAN_configurableShortcuts.md](PLAN_configurableShortcuts.md) |
| 快捷鍵設定介面 | [docs/harry/PLAN_shortcutSettingsPanel.md](PLAN_shortcutSettingsPanel.md) |
| clipboard / edge 選取狀態設計筆記 | [docs/harry/DESIGN_clipboardAndEdgeSelectionState.md](DESIGN_clipboardAndEdgeSelectionState.md) |
