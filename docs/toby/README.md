# 工作摘要

## CR-01 設備旋轉功能

### 操作方式

- **拿起中旋轉**：點擊工具列設備按鈕進入拿起狀態 → 按 **R** 依序循環 0°→90°→180°→270° → 點畫布放置時套用當下角度；**Esc** 可隨時取消拿起
- **已放置設備旋轉**：直接點擊畫布上已放置的設備 → 按 **R** 直接旋轉它（透過 `editorStore.rotateDevice`，自動進歷史，可 Ctrl+Z 復原）

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

## 其他排查

- **img_mat 圖片顯示**：實測 dev server 與 `pnpm build` + `pnpm preview` 皆正常顯示（含檔名有空格的 `Amethyst Fiber.png`），本機無法重現使用者回報的「build 後不顯示」問題，待確認實際部署環境後續查
