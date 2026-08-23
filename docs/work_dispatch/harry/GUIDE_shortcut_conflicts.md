# 技術註記｜harry｜P 鍵會被 Space 打回 select（W0823-H1 專用）

| meta | value |
|------|-------|
| 對應工單 | [W0823-H1](./W0823-H1_connect_tool_shortcut.md) |
| 為什麼有這份 | 工單只寫「Space 仍是 pan，不要弄壞」，但實際情況是**反過來**：既有的 Space 處理會把你剛切好的 connect 打回 select |
| 建議 | 動手前掃一眼，決定 §2 要走 A 還是 B，寫進你的 PLAN |

---

## 1. 現況

`useShortcuts.ts` 目前這樣處理 Space：

```96:106:src/composables/useShortcuts.ts
    useEventListener(window, 'keydown', (event) => {
        if (event.code === 'Space') {
            editorStore.setActiveTool('pan');
        }
    });
    useEventListener(window, 'keyup', (event) => {
        if (event.code === 'Space') {
            editorStore.setActiveTool('select');
        }
    });
```

放開 Space 一律變 `'select'`，不管按下前是什麼工具。所以「按 P 進 connect → 手滑碰到空白鍵 → 回到 select」，而且畫面上只會看到工具鈕自己跳掉，很難查。

順帶兩個既有行為，知道就好：

- `setActiveTool(tool)` 在 `tool !== 'select'` 時會 `placementArmed = false`，所以切 connect 會自動放下手上的機器——這是我們要的
- `FactoryCanvas` 只對 `'pan'`／`'box-select'` 有特別行為，`'connect'` 進來不會壞掉，畫布單純不平移

---

## 2. 兩個處理方式，擇一寫進 PLAN

| 方案 | 做法 | 代價 |
|------|------|------|
| **A. 記住前一個工具**（建議） | Space keydown 前把 `editorStore.activeTool` 存進一個 module 內的變數，keyup 還原它而不是寫死 `'select'` | 同檔 5 行內；仍只動 `useShortcuts.ts`，不碰 store |
| B. 本週不處理 | P 鍵照做，PLAN 與 PR 寫明「已知：Space 會重置工具，待 C1 一併處理」 | 零風險，但使用者會踩到 |

A 的形狀大致是：

```ts
/** Space 暫時切 pan 前的工具，放開後還原（避免把 connect 等工具打回 select） */
let toolBeforePan: ToolMode | null = null;

useEventListener(window, 'keydown', (event) => {
    if (event.code !== 'Space') return;
    if (toolBeforePan === null) toolBeforePan = editorStore.activeTool;
    editorStore.setActiveTool('pan');
});

useEventListener(window, 'keyup', (event) => {
    if (event.code !== 'Space') return;
    editorStore.setActiveTool(toolBeforePan ?? 'select');
    toolBeforePan = null;
});
```

`keydown` 會連續觸發（按住不放），所以要用 `toolBeforePan === null` 擋住覆寫，否則第二次觸發會把 `'pan'` 自己存進去。

---

## 3. P 鍵怎麼寫

比照同檔 Ctrl+R 的寫法用 `useEventListener` 就好，不必動 `useMagicKeys`：

```ts
useEventListener(window, 'keydown', (event) => {
    if (event.key.toLowerCase() !== 'p') return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    // 在輸入框打字時不搶鍵
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, [contenteditable="true"]')) return;

    editorStore.setActiveTool(editorStore.activeTool === 'connect' ? 'select' : 'connect');
});
```

記得更新檔案頂部 JSDoc 的快捷鍵清單，加一行 **P：管線（connect）**。

---

## 4. Navbar 只要加一列

```28:31:src/editor/navbar/Navbar.vue
const tools: Array<{ id: ToolMode; label: string }> = [
    { id: 'select', label: '選取' },
    { id: 'pan', label: '移動畫布' },
];
```

加入 `{ id: 'connect', label: '管線' }` 即可。`v-for` 與 `@click="editorStore.setActiveTool(tool.id)"` 都現成，選中態靠 `:variant` 自動反白，**不需要新寫 action**。型別 `ToolMode` 已含 `'connect'`（`src/types/editor.ts`），不要自創 `'pipeline'`。

---

## 5. 驗收

1. `pnpm type-check`／`lint-check`／`format-check`／`test`
2. `pnpm dev`：按 P → Navbar「管線」反白；再按 P → 回「選取」
3. 若走方案 A：進 connect 後按住空白鍵拖畫布、放開 → **仍在 connect**
4. Ctrl+Z／Delete／Ctrl+R 都還正常

PR 或分支說明附上這幾步操作即可。本週不要求真的拉得出管線。
