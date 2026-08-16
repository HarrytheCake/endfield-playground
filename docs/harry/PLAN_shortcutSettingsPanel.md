# 待實作：Esc 開啟快捷鍵設定介面（Step 3 / 3）

**狀態：** 規劃中，尚未動工
**依賴：** 需要 Step 2（`PLAN_configurableShortcuts.md`）的 `keybindingStore` 先存在（介面要讀寫它）
**相關檔案：**

- `src/editor/settings/ShortcutSettingsPanel.vue`（**新增，L2 容器**——讀寫 `keybindingStore`，掛載於 `App.vue`）
- `src/components/ShortcutRow/Index.vue`（**新增，L3 純展示**——單一動作一行，props 進、emits 出，不 import store）
- `src/composables/useShortcuts.ts`（L2，Esc 開啟介面的觸發點）

---

## 1. 範疇判定

- 讀寫 `keybindingStore` 的容器邏輯 → **L2**（放在 `src/editor/settings/`，比照 `src/editor/inspector/InspectorPanel.vue` 的既有模式：L2 容器讀 store，往下傳 plain object props 給純展示子元件）
- 單一快捷鍵列（顯示目前鍵位、「設定」按鈕、衝突警示）→ **L3**，遵守「不得 import Pinia store」硬規則，只透過 props（`label` / `combo` / `hasConflict` / `isRecording`）與 emits（`start-rebind` / `reset`）跟 L2 溝通
- 容器本身用 Nuxt UI 的 `UModal` 包起來（依指示「盡量使用 Nuxt UI」）

## 2. Esc 的雙重身分問題

`FactoryCanvas.vue` 現有 Esc 邏輯：拿起預覽中按 Esc → 取消放置。Step 3 要新增：非拿起狀態按 Esc → 開啟設定介面。兩者不衝突的前提是明確排序：

```
Esc 按下：
  若 placementArmed → 取消放置（固定行為，見 PLAN_configurableShortcuts.md §6，優先且不可配置）
  否則 → 若 openSettings 動作的鍵位剛好是 Esc → 開啟設定介面
```

另外，Nuxt UI 的 `UModal` 底層（Reka UI Dialog）本身就有「按 Esc 關閉」的內建行為（`dismissible` 預設 `true`）。設定介面打開後再按一次 Esc，應該要是「關閉介面」而不是我們自己的全域監聽器又做了別的事。實作上讓 `openSettings` 這個 trigger 監聽器只負責「開」，不負責「關」（`isSettingsPanelOpen` 已經是 `true` 時直接 no-op），關閉一律交給 `UModal` 自己的 Esc / 外部點擊 / 關閉按鈕處理，兩個 Esc 處理器就不會互踩。

## 3. 設計

- 面板開關狀態放 `keybindingStore.isSettingsPanelOpen`（單一 boolean），理由是專案裡其他「畫面狀態」都是 store 化的 reactive flag（`placementArmed`、`activeTool` 皆是），保持一致比在 `App.vue` 局部維護 ref 更符合現有慣例
- 面板內容：依 Step 2 的 `ACTIONS` 清單渲染，按 `category` 分組（歷史 / 選取 / 畫布 / 系統）
- 「設定」按鈕點下去 → 該行進入「錄製中」狀態 → 監聽下一個 `keydown`，組出鍵位字串 → 呼叫 `keybindingStore.setBinding(actionId, combo)`；若 `findConflict()` 回傳衝突，顯示警告（`UBadge` 或類似元件）但仍允許儲存（依 Step 2 §6 的決策：警告不擋下）
- 「錄製下一個按鍵」邏輯用 Step 2 已規劃的 `useKeyCapture()` composable（見 `PLAN_configurableShortcuts.md` §4），因為 L3 的 `ShortcutRow` 不能自己 import store，錄製到的字串透過 emit 往上交給 L2 容器處理
- 鍵位顯示用 Nuxt UI 的 `UKbd` 元件（本專案還沒用過，但套件已內建，符合「優先使用 Nuxt UI」），一組鍵位（如 `Ctrl+Z`）拆成多個 `UKbd` 徽章逐一顯示

## 4. 明確不在本次範圍內

- 匯出 / 匯入自訂鍵位設定
- 鍵位衝突時的「自動與另一動作交換」之類進階行為
- 行動裝置 / 觸控的替代操作方案

## 5. 驗證方式

- `pnpm type-check` / `lint-check` / `format-check` / `test`
- 手動測試：Esc 在拿起預覽中優先取消放置、非拿起狀態按 Esc 開啟設定介面、介面內再按 Esc 能正常關閉且不誤觸發別的行為、錄製新鍵位流程、衝突提示顯示正確但仍可儲存
