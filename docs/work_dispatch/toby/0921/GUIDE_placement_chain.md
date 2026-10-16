# GUIDE｜落子鏈怎麼接（W0921-T1 教學檔）

本檔是骨架與踩坑提醒，**不是規格**。規格看 [W0921-T1](./W0921-T1_placement_chain.md)。

---

## 1. 意圖層：為什麼不用 store

工具列在下方、畫布在中間，兩個元件沒有父子關係，要傳「使用者選了哪台機器」只有三條路：

| 路 | 問題 |
|----|------|
| 擴充 `editorStore.armPlacement` | `EquipmentType` 是封閉聯集；擴充它等於把新佈局模型綁回舊藍圖世界，而那條邊界還沒裁 |
| 塞進 `layoutStore` | 那是藍圖狀態的唯一寫入點，不該裝「游標現在拿著什麼」這種 UI 暫態 |
| **module-scope 的小 composable** | 沒有依賴、可測試、之後要搬進哪個 store 都不影響呼叫端 |

走第三條。骨架：

```ts
// src/editor/toolbar/usePlacementIntent.ts
import { readonly, ref } from 'vue';

/** 使用者目前「拿在手上」要放的真實機器 id；null＝沒有武裝 */
const armedMachineId = ref<string | null>(null);

/** 落子意圖：工具列寫入、畫布讀取；不進任何 store */
export function usePlacementIntent() {
    return {
        armedMachineId: readonly(armedMachineId),
        /** 武裝一台真實機器；同一台再點一次視為取消 */
        arm(machineId: string) {
            armedMachineId.value = armedMachineId.value === machineId ? null : machineId;
        },
        /** 落子成功或按 Esc 後解除武裝 */
        disarm() {
            armedMachineId.value = null;
        },
    };
}
```

`ref` 放在**模組層**不是函式內——這樣兩個元件各自呼叫 `usePlacementIntent()` 拿到的是同一份狀態。這是 Vue 裡最輕量的跨元件共享寫法，不需要 Pinia。

---

## 2. 工具列那一刀有多小

現況（`ToolbarPanel.vue`）：

```ts
function handleRealMachineClick(row: ToolbarMachineRow) {
    selectedRealMachineId.value = row.id;
    console.info('[toolbar] real machine selected (no store / no place)', { ... });
}
```

改成：

```ts
function handleRealMachineClick(row: ToolbarMachineRow) {
    selectedRealMachineId.value = row.id;
    arm(row.id);
}
```

**就這樣。** template 一個字都不要動——那是 goodmorning 的視覺。

`selectedRealMachineId` 這個本地 highlight 保留不動，先不要順手把它換成 `armedMachineId`；那是視覺的事，等工具列的樣式定下來再說。

> #48 也在改這個檔（goodmorning 本週必須收尾）。**你先推意圖層即可。** 他 rebase 時要以你的 `<script>` 為底套視覺，不得刪 `arm`。

---

## 3. 畫布端：座標怎麼算

`GridCanvas` 目前沒有平移縮放，SVG 是 1:1 的，所以：

```ts
const cell = {
    x: Math.floor(event.offsetX / cellSize),
    y: Math.floor(event.offsetY / cellSize),
    z: 0,
};
```

**`offsetX` 要相對於 `<svg>`**，不是外層那個有 padding 的 div。事件掛在 `<svg>` 上就對了。

> 之後接 `useGridViewport` 時，這段會換成 `viewport.screenToCell(...)`。**本週不接**——那是另一刀，而且會跟你這刀改同一個檔。

---

## 4. 結構長怎樣

```text
ToolbarPanel.vue ──arm(machineId)──┐
                                   ├─→ usePlacementIntent（module-scope ref）
LayoutView.vue ───armedMachineId───┘
      │
      ├─ canPlaceDevice(draft, layout)   ← aaaaa 的純函式，只問不寫
      ├─ layoutStore.addDevice(device)   ← 唯一寫入點
      └─ GridCanvas.vue                  ← 只負責畫，保持無 store
```

點擊落子的流程：

1. `armedMachineId` 是 null → 什麼都不做（之後這裡會是「選取」，本週不開）
2. 有值 → 算出格座標 → `canPlaceDevice`
3. `ok: false` → return，不落子（之後這裡會是紅框提示）
4. `ok: true` → `getMachineById(machineType)` 拿中文名當 `label` → `addDevice`
5. 落子後**不要** `disarm()`——連放三台是正常需求，讓使用者自己點別台或按 Esc

---

## 5. 三個會踩到的坑

**① A0 還沒合入就想開工。** 可以開，但把 `canPlaceDevice` 那一步先留空，直接 `addDevice`。`addDevice` 失敗時不會寫入也不會進 history，所以不會弄髒狀態——但這是依賴實作細節，**不可以當成最終版交出去**，A0 一到就補上。

**② 想自己算重疊。** `toDeviceFootprint`／`deviceSizeFromMachine`／`detectOverlaps` 都是 public export，你 import 得到，寫起來也不難。不要。兩套判定不一致的 bug 會在幾週後以「明明綠的卻放不下」的形式出現，那時沒人記得是這裡。

**③ 初始 snapshot 與 Ctrl+Z。** `LayoutView` 現在掛載時會載 mock 快照，而那一筆會進 history——上週你已經在 PR 裡列過這個限制，主編認定為預期行為。**本週不要順手去修它**，那是 `historyStore` 分堆疊的問題（待決 C-3），改了會擴大 diff。

---

## 6. 手動驗證清單

| 步驟 | 預期 |
|------|------|
| `pnpm dev` 開首頁 | 畫布有 mock 設備（原樣） |
| 下方點「基礎生產」分類任一台 | 卡片高亮 |
| 點畫布空白格 | 出現一台新設備，標籤是中文名，佔格正確 |
| 點已被佔用的格 | 什麼都沒發生（A0 合入後） |
| 連點三個空格 | 放出三台 |
| `grep -n "store" src/editor/layout/GridCanvas.vue` | 零命中 |
| `git diff --stat` | 不含 editorStore、StatsPanel、MainLayout、inspector |
