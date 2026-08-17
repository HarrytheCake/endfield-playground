# 工作摘要

## CR-01 設備旋轉功能

### 操作方式

- **拿起中旋轉**：點擊工具列設備按鈕進入拿起狀態 → 按 **R** 依序循環 0°→90°→180°→270° → 點畫布放置時套用當下角度；**Esc** 可隨時取消拿起
- **已放置設備旋轉**：對已放置的設備左鍵長按，進入「拿起設備」狀態 → 按 **R** 旋轉預覽 → 放下時套用當下角度（透過 `editorStore.rotateDevice`，自動進歷史，可 Ctrl+Z 復原）

### 涉及檔案

- [FactoryCanvas.vue](../../src/editor/canvas/FactoryCanvas.vue)：`previewRotation`（拿起預覽旋轉狀態）、`rotateTargetUid`（點選旋轉目標）、R / Esc 鍵 `useMagicKeys` 綁定
- [FlowNodeOverlay.vue](../../src/editor/canvas/FlowNodeOverlay.vue)：`rotationDeg` computed，套用 `transform: rotate()` 呈現旋轉視覺效果
- [style.css](../../src/style.css)：修正 Vue Flow 節點外層白色背景殘留

### 過程中排除的誤區

- **HTML5 原生拖放會封鎖鍵盤事件**：一開始嘗試「按住拖曳工具列按鈕 + 拖曳中按 R」，實測發現瀏覽器原生 Drag and Drop API 進行時鍵盤事件不會正常派送到頁面，因此改為「點擊拿起（不需拖曳）→ 按 R」的設計
- **Vue Flow 單純點擊節點不會觸發 `selection-change`**：該事件只在框選拖曳時才會發出，因此「點選已放置設備後按 R 旋轉」改為在 `handleNodeClick` 直接記錄點擊節點 uid（`rotateTargetUid`），不依賴 `selectionStore`
- **旋轉後外層露出白色背景**：Vue Flow 內建佈景 `theme-default.css` 把節點外層 wrapper 背景設為白色（`--vf-node-bg: #fff`）；我們只旋轉了內層自繪的深色方塊，外層沒有跟著轉，footprint 不對齊時就露出白色。修法是把 `.vue-flow__node-default` 外層背景蓋成 `transparent`（需疊加 `.vue-flow__node` 兩個 class 才能壓過原本規則的優先權，因為 `theme-default.css` 在 `main.ts` 是後匯入的）

### 尚未處理

- 旋轉是整個節點方塊套用 CSS `transform: rotate()`，文字標籤會跟著轉向（採簡易版方案，非 port 精確定位版）
- 尚未依 `Machine.input_ports` / `output_ports` 用 `rotatePortSide` / `rotatePortOffset` 做 port 精確重新定位

## CR-01 基地選擇 UI（`baseRegion`）

對應任務：[MILESTONE_0726.md](MILESTONE_0726.md)

### 操作方式

- Navbar 右側「基地選擇」按鈕點開下拉選單，選項：武陵地區 / 四號谷地 / 自由畫布
- 選擇後透過 `canvasStore.setBaseRegion()` 寫入，畫布立即疊加對應格子尺寸的框線（武陵 256×256 格、四號谷地 192×192 格）；選自由畫布則無框線
- 框線純視覺參考，`pointer-events-none`，框線外仍可正常放置設備

### 涉及檔案

- [BaseRegionSelector/Index.vue](../../src/components/BaseRegionSelector/Index.vue)（L3）：純展示下拉元件，不 import store，靠 `modelValue` / `update:modelValue` 溝通
- [Navbar.vue](../../src/editor/navbar/Navbar.vue)（L2）：掛載選擇器、讀寫 `canvasStore.baseRegion`
- [FactoryCanvas.vue](../../src/editor/canvas/FactoryCanvas.vue)（L2）：`baseRegionBoundary` computed，依 `canvasSize.w/h × gridSize` 換算框線像素尺寸，透過既有的 `EdgeLabelRenderer` 容器渲染（沿用其自動跟隨 pan/zoom 的 transform，不需自行處理縮放換算）

### 尚未處理

- E003 detector（偵測設備超出框線、顯示 Error 警示）不在此任務範圍，另開任務處理
- CR-11 工具列「基地隱藏中繼器」不在此任務範圍

## 其他排查

- **img_mat 圖片顯示**：實測 dev server 與 `pnpm build` + `pnpm preview` 皆正常顯示（含檔名有空格的 `Amethyst Fiber.png`），本機無法重現使用者回報的「build 後不顯示」問題，待確認實際部署環境後續查
