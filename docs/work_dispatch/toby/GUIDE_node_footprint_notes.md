# 技術註記｜toby｜節點佔格尺寸的三個坑（W0823-T1 專用）

| meta | value |
|------|-------|
| 對應工單 | [W0823-T1](./W0823-T1_placement_footprint_size.md) |
| 為什麼有這份 | 工單原本的步驟 3「rotation 1／3 寬高對調」**會做錯**；下面是看過現況程式後的正確做法 |
| 讀完再動手 | 約 5 分鐘，可省掉一小時試錯（你只有 2h） |

---

## 1. 坑一：旋轉不要自己再交換一次

`FlowNodeOverlay.vue` 的根節點**已經**套了 CSS 旋轉：

```97:103:src/editor/canvas/FlowNodeOverlay.vue
<template>
    <div
        class="relative min-w-25 rounded border bg-zinc-800 px-3 py-2 text-sm text-white"
        :class="isInvalid ? 'border-dashed border-gray-500 opacity-50' : 'border-zinc-600'"
        :style="{ transform: `rotate(${rotationDeg}deg)` }"
    >
```

`rotate(90deg)` 已經讓視覺上的寬高互換了。若你在 style 裡再依 `rotation === 1 || 3` 交換一次 `width`／`height`，等於**交換兩次**，畫面會轉回錯的方向。

**正確做法：** style 一律寫**原始**尺寸，旋轉交給既有的 `transform`。

```ts
import { storeToRefs } from 'pinia';
import { useCanvasStore } from '@/store/canvasStore';

const canvasStore = useCanvasStore();
const { gridSize } = storeToRefs(canvasStore);

/** 節點外框尺寸：機器佔格數 × 單格像素；旋轉沿用既有 CSS transform，不在此交換寬高 */
const footprintStyle = computed(() => {
    const def = machine.value;
    const base = { transform: `rotate(${rotationDeg.value}deg)` };
    if (!def) return base;
    return {
        ...base,
        width: `${def.width * gridSize.value}px`,
        height: `${def.height * gridSize.value}px`,
    };
});
```

template 改成 `:style="footprintStyle"`（原本那個只寫 transform 的 style 要移除，不要兩個 style 打架）。

---

## 2. 坑二：`min-w-25` 會擋住小機器

根節點 class 上的 `min-w-25`（= 100px = 5 格）會讓 1×1、2×2 的機器被撐大，看起來永遠對不上格數。

把它拿掉，或改成 `min-w-0`。其餘 class（`px-3 py-2`、`border`）可留：Tailwind 預設 `box-sizing: border-box`，padding 與 border 都算在你設的寬高內，不會外擴。若文字被擠爆，把 `px-3 py-2` 調小或加 `overflow-hidden`。

---

## 3. 坑三：非方形機器旋轉後不對齊左上格（本週只記錄）

CSS `rotate` 是**繞元素中心**旋轉。3×2 的機器轉 90° 後，視覺方塊會相對原本的左上角位移 `(width − height) × gridSize ÷ 2` 像素——外框大小對，位置會偏。

本週**不要**追這個。`getOccupiedCells` 的格子計算是以左上角為基準，要對齊得改 `transform-origin` 或改由 `FactoryCanvas` 給節點寬高，那已超出 2 小時與本切片範圍。做法是：

- 驗收用**方形或未旋轉**的機器截圖
- 在 PR 描述加一行：「非方形機器旋轉後位置偏移，屬 transform-origin 議題，未在本切片處理」

---

## 4. 另一個已知落差（知道就好，不用你修）

`geometryUtils.getOccupiedCells()` 的註解假設 `device.position` 是格子座標，但 Vue Flow 的 `position` 實際是**像素**（吸附成 `gridSize` 的倍數）。所以「畫面尺寸」與「detector 算的格子」目前不是同一套座標。

本週 shirone 的 E001 也踩到同一件事，已列為 aaaaa 的幾何域待辦。你這塊只做「外框像素 = 格數 × gridSize」，不需要處理座標換算。

---

## 5. 30 秒驗收

1. `pnpm dev` → 從選單拿一台機器放到畫布
2. 數畫布格線：外框大約蓋住 `width × height` 格
3. 換一台不同尺寸的機器再放一次，兩台格數不同
4. 按 Ctrl+Z 能還原（確認你沒繞過 `placeDevice`）
5. 全檔搜尋確認沒有新增 `nodes.push`、`historyStore.execute`

截圖或 30 秒錄影 → PR。

---

## 6. 卡住

- overlay 該不該讀 `canvasStore`：可以（它本來就讀 `flowStore`）；仍不確定就問 dernoson 一句，不要卡著
- 機器資料尺寸看起來就是錯的：截圖給 aaaaa，那是本週 A1 在修的 JSON，不是你的 bug
- 超過一次嘗試還卡住 → 直接問，本週寧可零合併也不要交無法 review 的大包
