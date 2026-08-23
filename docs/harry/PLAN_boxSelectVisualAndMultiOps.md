# 待實作：框選視覺化 + 多選移動／旋轉

**狀態：** 實作中（本文件記錄本次變更範圍）
**對應：** 使用者直接反饋（非既有工單）——「box-select 沒有視覺效果」「選取後無法批次移動／旋轉」「動作要記錄進歷史」
**相關檔案：**

- `src/style.css`（全域樣式，覆寫 Vue Flow 預設選取框顏色）
- `src/store/editorStore.ts`（L1，新增 `rotateDevices` 批次旋轉 action）
- `src/editor/canvas/FactoryCanvas.vue`（L2，R 鍵旋轉改為優先讀取 `selectionStore` 多選）

---

## 0. 重要例外：本次會動 `FactoryCanvas.vue`

`docs/work_dispatch/harry/W0823-H1_connect_tool_shortcut.md` 本週對 harry 設有檔案鎖，禁止改 `FactoryCanvas.vue`／`FlowNodeOverlay.vue`（保留給 toby 的 W0823-T1），避免同週衝突。

**本次由使用者直接指示、明確同意覆蓋此鎖**，因為多選旋轉的根因就在這個檔案裡（R 鍵目前只認單點點擊記錄的 `rotateTargetUid`，完全沒有讀取 `selectionStore` 的框選結果）。已知風險：與 toby 本週在同檔的變更之後合併時可能衝突，需要 dernoson／toby 知情，PR 說明會明確標註。

## 1. 根因調查結果

### 1.1 框選「沒有視覺效果」

`FactoryCanvas.vue` 的 `:selection-on-drag="activeTool === 'box-select'"` 其實已經正確接上 Vue Flow，拖曳確實會呼叫 `handleSelectionChange` 寫入 `selectionStore`——**互動本身沒壞**。  \
問題出在 Vue Flow 內建佈景（`theme-default.css`）給 `.vue-flow__selection` 的預設樣式是 `background: rgba(0, 89, 220, 0.08); border: 1px dotted rgba(0, 89, 220, 0.8);`——8% 不透明度的淡藍色，疊在本專案的深色畫布（`.factory-flow { background: #0c0c0f }`）上幾乎看不見。`style.css` 已有先例（`.vue-flow__node.vue-flow__node-default` 覆寫），本次比照同模式加一段覆寫規則即可，**不需要動 `FactoryCanvas.vue` 這部分**。

### 1.2 「選取後無法批次移動」

`FactoryCanvas.vue` 的 `selection-drag-start` / `selection-drag-stop` 已經共用 `handleNodeDragStart` / `handleNodeDragStop`，兩者都支援多 uid（`dragUids` 陣列），最終呼叫 `editorStore.commitDeviceMove(uids, before)`，內部本來就是整組視為單一歷史項目。**推測這部分其實沒壞**，看起來壞掉是因為 §1.1 選取框看不見，使用者以為框選沒生效。等 §1.1 CSS 修好後應重新手動驗證一次；若屆時仍有問題，需要另開新的調查。

### 1.3 「選取後無法批次旋轉」——確認是真的缺口

R 鍵旋轉（`onComboTriggered('rotateDevice', ...)`）目前**完全不讀 `selectionStore`**，只認 `rotateTargetUid`——一個只在單點點擊節點時（`handleNodeClick`）才會寫入的獨立變數，跟框選是兩條平行邏輯。且 `editorStore.rotateDevice(uid, rotation)` 簽名只收單一 uid。**需要新增一個批次版本的 L1 action。**

## 2. 設計

### 2.1 `src/style.css`：框選視覺覆寫

比照既有 `.vue-flow__node.vue-flow__node-default` 覆寫的模式，加一段：

```css
/*
 * Vue Flow 預設選取框顏色（8% 不透明度淡藍）疊在深色畫布背景上幾乎看不見，
 * 加大不透明度並換成較亮的琥珀色以確保框選拖曳時使用者看得到範圍。
 */
.vue-flow__selection,
.vue-flow__nodesselection-rect {
    background: rgba(250, 204, 21, 0.12);
    border: 1px dashed rgba(250, 204, 21, 0.85);
}
```

### 2.2 `editorStore.ts`：新增 `rotateDevices`

比照 `moveDevices` 的批次寫法，每個設備各自從**自己目前的 rotation** 前進一格（0→1→2→3→0），整組視為一筆歷史：

```ts
function rotateDevices(uids: string[]): void {
    if (uids.length === 0) return;
    const historyStore = useHistoryStore();
    const targetSet = new Set(uids);
    const previous = new Map<string, Rotation>();
    for (const n of nodes.value) {
        if (targetSet.has(n.id)) previous.set(n.id, (n.data?.rotation ?? 0) as Rotation);
    }
    if (previous.size === 0) return;
    const next = new Map<string, Rotation>();
    previous.forEach((r, id) => next.set(id, ((r + 1) % 4) as Rotation));
    const applyRotations = (map: Map<string, Rotation>) => {
        nodes.value = nodes.value.map((n) =>
            map.has(n.id)
                ? { ...n, data: { ...(n.data ?? { label: '' }), rotation: map.get(n.id)! } }
                : n,
        );
    };
    historyStore.execute({
        id: crypto.randomUUID(),
        type: HistoryRecordType.MachineRotation,
        label: `旋轉 ${previous.size} 台設備`,
        execute() {
            applyRotations(next);
        },
        undo() {
            applyRotations(previous);
        },
    });
}
```

不修改既有 `rotateDevice(uid, rotation)` 簽名——單點點擊（無框選時）的旋轉流程繼續用它；`rotateDevices` 是純新增的批次版本。

### 2.3 `FactoryCanvas.vue`：R 鍵優先讀 `selectionStore`

```ts
onComboTriggered('rotateDevice', () => {
    if (placementArmed.value) {
        previewRotation.value = ((previewRotation.value + 1) % 4) as Rotation;
        return;
    }

    if (selectionStore.selectedNodeIds.length > 0) {
        editorStore.rotateDevices(selectionStore.selectedNodeIds);
        return;
    }

    if (!rotateTargetUid.value) return;
    const target = nodes.value.find((n) => n.id === rotateTargetUid.value);
    if (!target) return;
    const current = (target.data?.rotation ?? 0) as Rotation;
    editorStore.rotateDevice(target.id, ((current + 1) % 4) as Rotation);
});
```

有框選（1 台以上皆算）時一律走批次版本；只有完全沒有框選、改用單點點擊時才 fallback 回原本的 `rotateTargetUid` 路徑。`selectionStore` 已經是本檔既有 import，不需新增依賴。

## 3. 明確排除範圍

- 不改 `moveDevices` / `commitDeviceMove`（§1.2 判斷目前沒壞，先不動）
- 不做旋轉時的即時預覽動畫或音效
- 不處理框選與 `placementArmed`（拿起中）狀態同時發生的邊界情況——目前拿起中優先處理 `previewRotation`，維持原行為
- 不改 `FlowNodeOverlay.vue`
- 不處理 `rotateTargetUid` 與 `selectionStore` 互相清空同步的邊界情況（例如框選後再單點點擊另一節點）——沿用現有各自獨立的生命週期，不在本次範圍內重新設計

## 4. 驗證方式

- `pnpm type-check` / `lint-check` / `format-check` / `test`
- `pnpm dev` 手動測試：
    1. 按 X 進框選工具，拖曳框住 2 台以上設備 → 應該看得到黃色虛線框（視覺修復驗證）
    2. 框選後拖曳其中一台設備 → 全部選取的設備應一起移動（§1.2 假設驗證）
    3. 框選後按 R → 全部選取的設備各自旋轉一格；`Ctrl+Z` 一次 → 全部設備旋轉還原
    4. 未框選、單點點擊一台設備後按 R → 沿用原本單台旋轉行為不變
    5. 拿起預覽（放置模式）中按 R → 只影響預覽旋轉，不受本次改動影響
