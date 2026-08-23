# 待實作：所有快捷鍵可配置化（Step 2 / 3）

**狀態：** 規劃中，尚未動工
**依賴：** 需要 Step 1（`PLAN_wasdCameraPan.md`）的 WASD 動作先定義好，本項的動作清單要涵蓋它；實作上建議 Step 1 完成後再做本項
**相關檔案：**

- `src/store/keybindingStore.ts`（**新增，L1**）
- `src/composables/useKeybinding.ts`（**新增，L2**——鍵盤事件正規化與 hold/trigger 兩種消費模式）
- `src/composables/useShortcuts.ts`（L2，改為讀 store 而非硬編字串）
- `src/editor/canvas/FactoryCanvas.vue`（L2，R 鍵旋轉／Esc 取消放置／WASD 改為讀 store）

---

## 1. 範疇判定

新增一個「按鍵組合的持久化狀態」——這是 Pinia store 的職責，屬於 **L1**。消費端（實際綁定 `keydown` / `useMagicKeys`）維持在 L2（`useShortcuts.ts` 與 `FactoryCanvas.vue`），只是資料來源從硬編字串改成讀 store。**不需要新的 L3 元件**（設定介面本身是 Step 3 的範圍）。

## 2. 現況盤點：目前所有快捷鍵，散落在兩個檔案

| 動作 | 目前鍵位 | 目前所在檔案 |
|------|----------|--------------|
| 復原 | Ctrl+Z / Cmd+Z | `useShortcuts.ts` |
| 取消復原 | Ctrl+Y / Cmd+Y | `useShortcuts.ts` |
| 刪除選取（設備＋管線） | Delete | `useShortcuts.ts` |
| 暫時切換平移工具 | Space（按住） | `useShortcuts.ts` |
| 重置畫布（暫時性，見 `PLAN_resetCanvas.md`） | Ctrl+R / Cmd+R | `useShortcuts.ts` |
| 旋轉選取設備 | R | `FactoryCanvas.vue` |
| 取消拿起預覽 | Esc | `FactoryCanvas.vue` |
| 上下左右移動畫面（Step 1） | W/A/S/D（按住） | `FactoryCanvas.vue`（新增） |

要做到「全部可配置」，這張表就是設定介面（Step 3）要渲染的清單，所以 Step 2 的 store 必須是這 8 項動作的單一權威來源。

## 3. Store 設計（`keybindingStore.ts`）

```ts
/** 單一快捷鍵動作的靜態定義（id、顯示名稱、預設鍵位、分類） */
interface KeybindingAction {
    id: string; // 例如 'undo'、'panUp'
    label: string; // 中文顯示名稱
    category: 'history' | 'selection' | 'canvas' | 'system';
    defaultCombo: string; // 例如 'Ctrl+Z'、'W'、'Escape'
}
```

- `ACTIONS: KeybindingAction[]`：上表 8 項的靜態常數清單（含預設鍵位），供 store 與設定介面共用
- `bindings: ref<Record<string, string>>`：使用者自訂鍵位覆寫，用 VueUse `useLocalStorage()` 持久化（對齊 `CLAUDE.md` §4「優先使用 VueUse」）
- `resolvedCombo(actionId)`：函式，`bindings[actionId] ?? ACTIONS.find(a => a.id === actionId).defaultCombo`
- `setBinding(actionId, combo)`：寫入覆寫
- `resetBinding(actionId)`：清除覆寫，回到預設
- `findConflict(combo, excludingActionId?)`：檢查是否已有其他動作占用同一組合，回傳衝突的 actionId 或 null
- `isSettingsPanelOpen: ref(false)`：Step 3 設定介面的開關狀態（純 UI 狀態，一併放在這個 store，理由見 `PLAN_shortcutSettingsPanel.md` §3）

## 4. 鍵盤事件層（`useKeybinding.ts`）：不能只靠 `useMagicKeys()` 動態索引

`useMagicKeys()` 支援 `keys[comboString]` 動態索引沒錯，但要正確支援「使用者自訂任意鍵位＋跨平台 Ctrl/Cmd 統一」，需要自己組一層鍵位字串正規化與按下狀態追蹤，而不是直接依賴 `useMagicKeys` 的內建字串解析（它的別名規則不一定跟我們想要的 `Ctrl` 統一吃下 `Meta` 一致）。這一層封裝成 `useKeybinding.ts`，提供：

- `comboFromEvent(event: KeyboardEvent): string`：由原生事件組出與 store 一致的鍵位字串（`Ctrl` 統一代表 Ctrl 或 Meta，讓同一組預設鍵位跨平台都能觸發）
- `useComboHeld(actionId): ComputedRef<boolean>`：hold 型動作用（WASD、Space），reactive 讀取「目前是否按住」
- `onComboTriggered(actionId, callback, { preventDefault? })`：trigger 型動作用（Undo、Delete、旋轉、重置畫布等單次觸發），內部用 `event.repeat` 過濾長按重複觸發
- `useKeyCapture(onCaptured)`：Step 3 設定介面「錄製下一個按鍵」要用，非本項核心但放在同一檔案，因為都是鍵盤事件正規化的邏輯

`FactoryCanvas.vue` 的 Escape（取消拿起預覽）**不**透過這層配置——固定綁死在原生 Escape，理由見 §6。

## 5. 消費端改法

`useShortcuts.ts` 把目前的 `useMagicKeys()` + `watch` 寫法，改成呼叫 `onComboTriggered('undo', ...)` / `useComboHeld('holdPan')` 等。`FactoryCanvas.vue` 的 R 鍵、WASD 同理。

## 6. 決策（已與使用者確認）

- **Esc 開放使用者自訂**：新增一個可配置動作 `openSettings`（預設鍵位 `Escape`），用來開啟 Step 3 的設定介面。但「拿起預覽中按 Esc 取消放置」這個行為**固定綁死在原生 Escape**，不透過 `openSettings` 的可配置鍵位——即使使用者把 `openSettings` 改綁到別的鍵，取消放置永遠是按實體 Escape。理由：取消放置是模態編輯的通用慣例（像大多數軟體的 Esc = 取消），跟「開啟一個設定畫面」這種一般性快捷鍵不是同一類東西，混在一起配置容易讓使用者搞混
- **鍵位衝突時的行為：允許設定但顯示警告**，不擋下。`findConflict()` 回傳衝突對象時，Step 3 介面用 Nuxt UI 的 `UBadge`/`UAlert` 提示，使用者仍可自行決定要不要接受衝突（例如刻意讓兩個不常同時用的動作共用一鍵）
- **WASD 四個方向拆成 4 個獨立可配置動作**（`panUp` / `panDown` / `panLeft` / `panRight`），不綁成一組不可拆的整體，讓使用者可以只改其中一個方向

## 7. 明確不在本次範圍內

- 快捷鍵設定介面本體（Step 3，見 `PLAN_shortcutSettingsPanel.md`）
- 匯出 / 匯入自訂鍵位設定

## 8. 驗證方式

- `pnpm type-check` / `lint-check` / `format-check` / `test`（`keybindingStore` 建議補單元測試：預設值、覆寫、reset、衝突偵測）
- 手動測試：改鍵位後重新整理頁面確認持久化、每個動作改鍵後實際按新鍵位能觸發、舊鍵位不再觸發、衝突時正確顯示警告但仍可儲存
