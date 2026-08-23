# 待實作：P 鍵／Navbar 切換管線工具（connect）

**狀態：** 規劃中（本文件記錄本次變更範圍，供 dernoson review 對照）
**對應：** [W0823-H1](../work_dispatch/harry/W0823-H1_connect_tool_shortcut.md)；CR-02「管線模式切換」切片，為 R-C1（port 點擊／draft 彎折）預留工具態。本週**只做切換**，不畫管線
**先讀：** [GUIDE_shortcut_conflicts.md](../work_dispatch/harry/GUIDE_shortcut_conflicts.md)
**相關檔案：**

- `src/composables/useShortcuts.ts`（L2，P 鍵綁定 + Space 衝突修正）
- `src/editor/navbar/Navbar.vue`（L2，新增「管線」按鈕）
- `src/store/keybindingStore.ts`（新增一筆 `KEYBINDING_ACTIONS` 定義，見 §4 待確認問題——**這是與工單原始檔案清單的落差，需要先確認**）

---

## 1. 範圍判定（依 CLAUDE.md 三層架構）

- `Navbar.vue`、`useShortcuts.ts` 皆屬 L2（互動邏輯 / composable），本次改動不涉及 L3 展示元件
- `editorStore.setActiveTool()` 是既有 L1 高階 action，**只呼叫，不修改函式本體**——符合工單「禁改 store action」
- `keybindingStore.ts` 的 `KEYBINDING_ACTIONS` 是靜態設定清單，非 action 邏輯；新增一筆定義不算「修改 action」，但工單原始檔案清單沒列到這個檔案，需先確認（見 §4）

## 2. 既有介面盤點

- `ToolMode` 已含 `'connect'`（`src/types/editor.ts:6`），不需擴型別
- `editorStore.setActiveTool(tool)` 為既有 action，直接呼叫即可
- `Navbar.vue` 現有 `tools` 陣列只有 `select`／`pan`，`@click="editorStore.setActiveTool(tool.id)"` 與選中態 `:variant` 已是現成的 v-for 模式，加一筆即可
- `useShortcuts.ts` 目前**不是** GUIDE 文件描述的原始 `useEventListener(keydown/keyup)` 寫法，而是已改用可配置鍵位系統：
  - `onComboTriggered(actionId, callback)`：單次觸發型（P 鍵切換要用這個）
  - `useComboHeld(actionId)`：持續按住型，目前 `holdPan`（預設鍵位 `Space`）用這個，透過 `watch(holdPan, ...)` 切工具
  - 兩者都依 `keybindingStore.resolvedCombo(actionId)` 動態讀鍵位，不能再照抄 GUIDE §3 的原始 `useEventListener` 片段
- **Space 衝突確認仍然存在**，只是位置換了：目前 `watch(holdPan, (held) => { editorStore.setActiveTool(held ? 'pan' : 'select') })` 放開一律寫死 `'select'`，切到 connect 後手滑碰到 Space 一樣會被打回 select。GUIDE 方案 A（記住前一個工具）邏輯不變，但要改寫在這個 `watch` 裡，不是 GUIDE 給的 keydown/keyup 片段

## 3. 設計

### 3.1 keybindingStore.ts（新增設定項）

在 `KEYBINDING_ACTIONS` 加一筆：

```ts
{ id: 'toggleConnectTool', label: '切換管線工具', category: 'canvas', defaultCombo: 'P' },
```

`P` 目前未被任何既有動作占用（既有：`Ctrl+Z`／`Ctrl+Y`／`Delete`／`R`／`Space`／`W`／`A`／`S`／`D`／`Ctrl+R`／`Escape`）。加入後會自動出現在 `ShortcutSettingsPanel.vue`（該面板本來就是遍歷 `KEYBINDING_ACTIONS` 渲染），使用者可自行改鍵位，不需要另外改設定介面元件。

### 3.2 useShortcuts.ts

1. 新增一段 `onComboTriggered('toggleConnectTool', () => { ... })`：

    ```ts
    onComboTriggered('toggleConnectTool', () => {
        editorStore.setActiveTool(editorStore.activeTool === 'connect' ? 'select' : 'connect');
    });
    ```

2. 修正 Space 放開後寫死 `'select'` 的問題（採 GUIDE 方案 A，記住前一個工具），把現有：

    ```ts
    const holdPan = useComboHeld('holdPan');
    watch(holdPan, (held) => {
        editorStore.setActiveTool(held ? 'pan' : 'select');
    });
    ```

    改成：

    ```ts
    /** 暫時切 pan 前的工具，放開後還原（避免把 connect 等工具打回 select） */
    let toolBeforePan: ToolMode | null = null;
    const holdPan = useComboHeld('holdPan');
    watch(holdPan, (held) => {
        if (held) {
            toolBeforePan = editorStore.activeTool;
            editorStore.setActiveTool('pan');
        } else {
            editorStore.setActiveTool(toolBeforePan ?? 'select');
            toolBeforePan = null;
        }
    });
    ```

    （`watch` 只在 `holdPan` 真的變化時觸發一次，不像 GUIDE 原本擔心的 keydown repeat 問題，所以不需要額外擋重複觸發）

3. 更新檔案頂部 JSDoc 快捷鍵清單，加入「P：切換管線工具（connect）」

### 3.3 Navbar.vue

`tools` 陣列加入：

```ts
{ id: 'connect', label: '管線' },
```

不需其他變更，`@click`／`:variant` 選中態邏輯現成可用。

## 4. 待確認問題

**工單原始檔案清單只列 `useShortcuts.ts` + `Navbar.vue`（+可選 PLAN），沒有 `keybindingStore.ts`**——這是因為工單／GUIDE 撰寫時，`useShortcuts.ts` 還是原始 `useEventListener` 寫法，尚未套用可配置鍵位系統。現在專案已全面改用 `keybindingStore` + `useKeybinding.ts`，若 P 鍵不透過 `KEYBINDING_ACTIONS` 註冊，會跟其他快捷鍵的架構不一致（無法被使用者於設定介面重新綁定、也繞過 `resolvedCombo()`／`findConflict()` 的衝突檢查機制）。

兩個選項：

| 方案 | 做法 | 代價 |
|------|------|------|
| **A. 比照既有架構，於 `keybindingStore.ts` 新增一筆 `KEYBINDING_ACTIONS`**（建議） | P 鍵可被使用者於設定介面重新綁定，享有衝突偵測；與 `rotateDevice`／`holdPan` 等其他快捷鍵一致 | 多改一個工單清單外的檔案；只新增一筆靜態資料，不改任何 action 函式本體或簽名 |
| B. 在 `useShortcuts.ts` 內硬編 `'P'` 鍵（用原生 `useEventListener`，比照 GUIDE 原始寫法） | 完全不碰 `keybindingStore.ts`，嚴格符合工單檔案清單 | P 鍵變成整個專案唯一不可配置、不會衝突檢查的快捷鍵，之後要補上還要再改一次；與現有架構不一致 |

本 PLAN 預設採 **方案 A**，因為工單清單是基於過時的架構假設；但這牽動到「工單檔案鎖」的字面規則，需要使用者或 dernoson 確認再動工。

## 5. 明確排除範圍

- 不畫管線、不做 port 點擊／draft 彎折（R-C1 範疇）
- 不改 `FactoryCanvas.vue`、`FlowNodeOverlay.vue`（工單檔案鎖）
- 不改 `editorStore.setActiveTool()` 或任何其他 action 的函式本體／簽名
- 不做框選、clipboard
- Navbar 按鈕文案暫定「管線」，不額外處理 i18n

## 6. 驗證方式

- `pnpm type-check` / `lint-check` / `format-check` / `test`
- `pnpm dev` 手動測試：
  1. 按 P → Navbar「管線」呈選中態；再按 P → 回「選取」
  2. 點 Navbar「管線」按鈕效果與按 P 一致
  3. 切到 connect 後按住 Space 拖畫布、放開 → 仍在 connect（驗證方案 A 的還原邏輯）
  4. `Ctrl+Z`／`Delete`／`Ctrl+R`／`Escape` 開設定介面等既有快捷鍵皆正常
  5. 若採方案 A：於快捷鍵設定介面確認「切換管線工具」有出現、可重新綁定、與既有鍵位衝突時會被攔下
