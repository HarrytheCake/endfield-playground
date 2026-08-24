# 待實作：節點外框佔格吃真實 machine 尺寸（接手 W0823-T1）

**狀態：** 規劃中
**對應：** [W0823-T1_placement_footprint_size.md](../work_dispatch/toby/W0823-T1_placement_footprint_size.md)（`[ ]` 未開始，本週 toby 未交，範圍不擋 8/30，使用者指示由本 session 接手）／[GUIDE_node_footprint_notes.md](../work_dispatch/toby/GUIDE_node_footprint_notes.md)（三個坑，已讀）
**相關檔案：**

- `src/editor/canvas/FlowNodeOverlay.vue`（主改；ticket 指定的主檔）

---

## 1. 範圍判定

- `FlowNodeOverlay.vue` 位於 `src/editor/`，屬 L2，**不是** L3（`src/components/`），因此**可以直接 import store**——它本來就已經 `import { useFlowStore } from '@/store/flowStore'`，本次加 `useCanvasStore()` 讀 `gridSize` 是同一模式的延伸，不需要像 `PipelineEdge.vue` 那樣另外用 provide/inject（那是 R-C3 DoD 對「該檔」的特別規定，非通用三層規則）
- 只改這一個檔案，比照 ticket §1「主改一個」的要求
- **不改** `FactoryCanvas.vue`、`editorStore.ts`、`src/data/machines.ts`
- 不新增 Pinia action、不 `nodes.push`、不自組 Command

## 2. 現況覆核（GUIDE 三個坑，逐一確認仍然有效）

| 坑 | GUIDE 說法 | 目前程式碼現況（本 session 已改過旋轉部分，需重新核對） |
|----|-----------|--------------------------------------------------------|
| 坑一：旋轉不要自己再交換寬高 | 根節點已有 `transform: rotate(rotationDeg deg)`，style 若再交換 width/height 等於交換兩次 | **仍然成立**——`rotationDeg` computed 與根節點 `:style="{ transform: ... }"` 都還在（本 session 為了修連線方向問題特別保留、註明不可移除），本次沿用**原始（未交換）** width/height |
| 坑二：`min-w-25` 擋住小機器 | 需拿掉或改 `min-w-0` | 現況仍是 `min-w-25`，需移除 |
| 坑三：非方形機器旋轉後不對齊左上格 | `transform-origin` 議題，GUIDE 明說本週不追 | 沿用不追，PR／commit message 註明 |

## 3. 設計

### 3.1 讀取 gridSize

```ts
import { useCanvasStore } from '@/store/canvasStore';
import { storeToRefs } from 'pinia';

const canvasStore = useCanvasStore();
const { gridSize } = storeToRefs(canvasStore);
```

### 3.2 外框尺寸 computed

```ts
/**
 * 節點外框像素尺寸：機器原始 width/height × gridSize。
 * 旋轉的視覺寬高互換已由根節點既有的 CSS transform 處理，這裡永遠用原始尺寸，
 * 避免跟 transform 疊加造成二次交換（GUIDE 坑一）。
 */
const footprintStyle = computed(() => {
    if (!machine.value) return {};
    return {
        width: `${machine.value.width * gridSize.value}px`,
        height: `${machine.value.height * gridSize.value}px`,
    };
});
```

### 3.3 合併進既有的 rotate transform style

目前根節點的 `:style` 只有 `transform`，兩者要合併成一個物件（避免兩個 `:style` binding 互踩）：

```ts
const rootStyle = computed(() => ({
    ...footprintStyle.value,
    transform: `rotate(${rotationDeg.value}deg)`,
}));
```

template 改 `:style="rootStyle"`。

### 3.4 移除 `min-w-25`

根節點 class 拿掉 `min-w-25`；`px-3 py-2`、`border` 等其餘 class 保留（GUIDE 坑二已確認 padding/border 算在 box-sizing: border-box 內，不會外擴）。機器格數 1×1 時可能塞不下文字，屬已知取捨，不在本次特別處理溢出（GUIDE 未要求）。

## 4. 明確排除範圍

- 不修正非方形機器旋轉後的 `transform-origin` 位置偏移（GUIDE §3 與 ticket DoD 皆明列本次不做）
- 不呼叫／不修正 `geometryUtils.getOccupiedCells()`——該函式目前存在但**從未被實際呼叫**（本 session 稽核過，全 repo 搜尋零呼叫點），且已知有 `device.position` 假設是格子座標、但 Vue Flow 實際給的是像素的座標系不一致問題（`GUIDE_node_footprint_notes.md` §4 記錄），這是比本次範圍更大的整合工作，本次只做「外框像素尺寸正確」（ticket §3 允許的最小驗收形態），不牽動佔格驗證
- 不做重疊拒絕、不做超出基地拒絕（沿用 B2/D2 既有排程）
- 不處理小機器（1×1）文字溢出的視覺優化

## 5. 驗證方式

- `pnpm type-check` / `lint-check` / `format-check` / `test`
- `pnpm dev` 手動測試：
    1. 放置一台常用機器（例如粉碎機），外框格數目視與 `getMachine` 的 `width`/`height` 一致
    2. 放置另一台不同尺寸的機器，兩者外框大小不同
    3. 旋轉已放置設備（R 鍵），確認：（a）非方形機器寬高視覺互換一次、不是零次或兩次；（b）連線與埠仍正確跟著轉（本 session 先前已修好，本次不應破壞）
    4. Ctrl+Z 能還原放置（證明走 `placeDevice`，非自組邏輯）
