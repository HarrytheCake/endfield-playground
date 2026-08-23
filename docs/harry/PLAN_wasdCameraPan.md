# 待實作：WASD 按住移動畫面（Step 1 / 3）

**狀態：** 規劃中，尚未動工
**依賴關係：** 無前置；但本項新增的 4 個動作（上下左右移動）之後要被 Step 2（可配置化，見 `PLAN_configurableShortcuts.md`）納管，實作順序建議 Step 1 → 2 → 3
**相關檔案：** `src/editor/canvas/FactoryCanvas.vue`（L2）

---

## 1. 範疇判定

「快捷鍵 / 畫面平移互動」明列在 `CLAUDE.md` §1 的 L2 範疇。**不需要新的 L1 store**，也**不需要 L3 元件**——這純粹是滑鼠/鍵盤互動邏輯。

## 2. 關鍵發現：要動的是 Vue Flow 的 viewport，不是 canvasStore

`canvasStore.offset` / `canvasStore.zoom` 目前完全沒有接到畫布上（`FactoryCanvas.vue` 只用了 `canvasStore.gridSize`）。真正控制畫面平移/縮放的是 Vue Flow 元件自己內部的 viewport 狀態，透過 `useVueFlow()` 取得：

- `viewport`：`Ref<{ x: number; y: number; zoom: number }>`，目前的視角
- `setViewport(transform, options?)`：直接設定視角

所以本項要呼叫的是 `setViewport()`，**不是** `canvasStore.setOffset()`。（這個 dead state 之後要不要清掉是另一個問題，不在本次範圍，但先記錄起來。）

## 3. 實作位置的限制

`useVueFlow()` 依賴 `<VueFlow>` 元件建立的 provide/inject context。`useShortcuts.ts` 是在 `App.vue` 層級全域註冊的 composable，在 `<VueFlow>` 之外呼叫 `useVueFlow()` 拿不到正確的 flow instance。**因此 WASD 平移邏輯必須寫在 `FactoryCanvas.vue` 內部**（跟現有的 R 鍵旋轉、Esc 取消放置同一個模式），不能塞進 `useShortcuts.ts`。

## 4. 設計

- 用 `useMagicKeys()` 取得 `w` / `a` / `s` / `d` 四個 reactive boolean ref（沿用現有模式，`FactoryCanvas.vue` 已經有一個 `keys = useMagicKeys()` 實例可以共用）
- 用 VueUse 的 `useRafFn()`（優先於自己手刻 `requestAnimationFrame`，符合 `CLAUDE.md` §4「優先使用 VueUse」）建立一個每幀執行的 callback：
  - 任一方向鍵按住時，依「速度（px/秒）× delta time」算出本幀位移量
  - 呼叫 `setViewport({ ...viewport.value, x: viewport.value.x ± dx, y: viewport.value.y ± dy })`
  - 四鍵都沒按住時 no-op（`useRafFn` 可設 `immediate: false`，只在至少一鍵按下時啟動，避免長期空轉的 raf loop）
- 移動速度先訂一個常數（例如 600px/秒，實際手感待人工測試調整），不做成 UI 可調參數（超出本次範圍）

## 5. 需要處理的邊界情況

1. **輸入框 focus 時不應觸發**——例如之後 Step 3 的快捷鍵設定介面裡如果有文字輸入框，使用者打字時按到 w/a/s/d 不應該讓畫面亂飄。需要在 raf callback 或 key ref 上加一層判斷（檢查 `document.activeElement` 是否為 `INPUT` / `TEXTAREA` / `contenteditable`）
2. **與現有按鍵是否衝突**：目前已用鍵位為 `Ctrl+Z`、`Ctrl+Y`、`Delete`、`Space`（按住）、`R`（旋轉，僅限有點選設備時）、`Ctrl+R`（暫時性 resetCanvas，見 `PLAN_resetCanvas.md`）。W/A/S/D 目前未被使用，無衝突
3. **`activeTool === 'pan'`（Space 按住）時是否還要讓 WASD 生效**：兩者語意重疊（都是平移），建議兩者並存不互斥——這點待確認，非我能擅自決定

## 6. 決策（已與使用者確認）

- **不做 Shift 加速**——移動速度固定，不加修飾鍵變速
- 移動方向與螢幕方向的對應：W = 視角往上移動（看到更上方的內容，`viewport.y` 增加），S/A/D 依此類推；此為建議預設，實作時仍會在程式碼註解中寫清楚語意方便之後調整

## 7. 驗證方式

- `pnpm type-check` / `lint-check` / `format-check` / `test`
- 手動測試：按住 W/A/S/D 各方向確認畫面平移方向符合預期、放開立即停止、與 Space 拖曳平移並存不互相干擾、在假設的文字輸入框 focus 時不觸發
