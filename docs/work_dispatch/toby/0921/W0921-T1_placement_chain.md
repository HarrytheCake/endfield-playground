# W0921-T1｜toby｜落子鏈：從工具列選一台真機器，放到新畫布上

| meta | value |
|------|-------|
| 週次 | 2026-09-21 → 2026-09-27（**M2 門檻週**） |
| 等級 | **確定・本週主戲** |
| 擋門檻 | **是**（9/27 硬綁 B1：「從下方選單拉真機器放到畫布」） |
| 前置 | 殼與 store 全在 master（#45／#46／#47／#50）。預檢 `canPlaceDevice` 由 aaaaa **9/24 交**（[A0](../../aaaaa/0921/W0921-A0_placement_precheck.md)） |
| 教學檔 | [GUIDE_placement_chain.md](./GUIDE_placement_chain.md) |
| 你的檔 | `src/editor/toolbar/usePlacementIntent.ts`（新）、`src/editor/layout/LayoutView.vue`、`src/editor/layout/GridCanvas.vue`、`src/editor/toolbar/ToolbarPanel.vue`（**僅 script 區**） |
| 配對窗口 | **有（本週名額給你）**；dernoson 或 aaaaa |
| 產能參考 | 自報 3–5h。上週你一週內走完等閘→開工→收尾，本週範圍相當 |

---

## 0. 白話目標

上週你把畫布掛上主畫面，但它是只讀的：工具列點了沒反應。

**這週把那條線接起來：點工具列的真機器卡片 → 點畫布的某一格 → 那台機器出現在畫面上。**

這就是 9/27 門檻演示的內容。**只有這一句要成立**，其餘都是加分。

---

## 1. 一句話驗收

**`pnpm dev` → 下方選單點一台真機器 → 點畫布空格 → 那台機器以正確佔格畫出來，標籤是中文機器名。**

---

## 2. 為什麼現在才能做

`ToolbarPanel` 的舊五顆按鈕走的是 `armPlacement(equipment: EquipmentType)` ＋ `dataTransfer`，而 `EquipmentType` 是封閉聯集，**真實機器 id 不在裡面**。這就是 9/6 那次只做列表、不接落子的原因（[B1 §11](../../../roadmap/detail/B1_toolbar_real_machines.md)）。

本週的解法**不是**去擴充 `EquipmentType`，也不是改 `editorStore`——那會把新佈局模型綁回舊藍圖世界，而那條邊界還沒裁（待決 B-1）。

**解法：新開一個只管「使用者現在想放哪台」的極小意圖層。** 見 [GUIDE](./GUIDE_placement_chain.md) §1。

---

## 3. 三刀，按這個順序

| # | 刀 | 依賴 | 建議日 |
|---|----|------|--------|
| 1 | `usePlacementIntent.ts`：一個 module-scope 的 `armedMachineId`，附 `arm`／`disarm` | 無 | 9/22–9/23 |
| 2 | `ToolbarPanel.vue` 的 `handleRealMachineClick` 從 `console.info` 改成 `arm(row.id)` | 無 | 9/23 |
| 3 | `LayoutView` 接住畫布點擊 → 預檢 → `layoutStore.addDevice` | A0（9/24） | 9/24–9/27 |

**第 1、2 刀不依賴任何人，先做。** 第 3 刀在 A0 交件前可以先寫「不預檢、直接 addDevice」的版本跑通，A0 一到再把預檢插進去——這兩者差三行。

**第 2 刀直接改 master 上的版本。** #48 已改裁為本週由 goodmorning 收尾（[G1](../../goodmorning/0921/W0921-G1_toolbar_pr48_land.md)），但他與你**同週會改同一個檔**——你負責意圖層（`arm`），他負責視覺＋把 hardcode 換回真實資料。**你的 PR 先合／先推即可**；他 rebase 時不得刪你的 `arm`。衝突找 dernoson，不要自己跟他搶整份檔。

---

## 4. 落子要填什麼（本週定案）

`layoutStore.addDevice` 要一個完整的 `PlacedDevice`。本週由你在落子端直接組，**不要等 `createPlacedDevice` 工廠**（那支的預設值屬呈現決策，排 10 月）。

| 欄位 | 本週填什麼 |
|------|-----------|
| `id` | `crypto.randomUUID()` |
| `machineType` | 工具列傳來的真實機器 id |
| `position` | 點到的格；`z` 填 0 |
| `rotation` | `0`（B3 旋轉本週不開） |
| `label` | **`machine.name`（中文名）** |
| `machineMode` | 省略，讓 store 以 `modes[0]` 解釋 |

`label` 填中文名是本週的定案：`GridCanvas` 現在畫的是 `device.label ?? device.machineType`，不填的話門檻演示上會看到一排英數 id。

---

## 5. 預檢怎麼用

```ts
const result = canPlaceDevice({ machineType, position, rotation: 0 }, {
    devices: layoutStore.devices,
    pipelines: layoutStore.pipelines,
});
if (!result.ok) return;   // 不落子
layoutStore.addDevice({ id: crypto.randomUUID(), ... });
```

**硬約束：不要自己 import `detectOverlaps`／`toDeviceFootprint`／`deviceSizeFromMachine` 重算一次。** 這三支都是 public export，你確實做得到，但那就變成兩套判定——預檢說可以、`addDevice` 卻失敗，而且沒人查得出來。有需要就回報，讓 aaaaa 補簽章。

失敗時 `conflicts` 裡代表「你正要放的這台」的是保留 id `'__draft__'`。

---

## 6. 邊界

| 允許 | 不要 |
|------|------|
| 新建 `usePlacementIntent.ts` | 擴充 `EquipmentType` 聯集 |
| 改 `LayoutView.vue`、`GridCanvas.vue` | 改 `editorStore` 任何簽名 |
| 改 `ToolbarPanel.vue` 的 **script 區** | 改 `ToolbarPanel.vue` 的 template／style（goodmorning 的視覺） |
| 在 `GridCanvas` 加預覽用的 props | 在 `GridCanvas` 裡 import store |
| import `canPlaceDevice` | 自己重算佔格重疊 |
| — | 選取、刪除、旋轉、拖移既有設備（B3／B4／B5，本週全不開） |
| — | 動 `src/app/layouts/MainLayout.vue` 的 StatsPanel 那一行（shirone 本週唯一開放的一行） |
| — | 碰 `src/app/StatsPanel/*`、`src/editor/inspector/*`、`FactoryCanvas` |

---

## 7. 本週不做（寫清楚免得自己補上）

| 項 | 什麼時候 |
|----|----------|
| 拖曳落子（HTML5 DnD） | **點擊落子先過**；拖曳是加分，行有餘力再加 |
| 綠框／紅框即時預覽 | 加分。門檻句不要求，別為了它把點擊落子拖到週末 |
| 旋轉、刪除、選取 | B3／B5／B4，各自另派 |
| 平移縮放接進主畫布 | 未派；`useGridViewport` 在 master 但本週不接 |
| 視角切換器 | 仍未派 |

> 上週你在 PR 裡主動列出兩項過渡限制，主編認定為預期行為。**這週照做**：加分項沒做就在 PR body 寫一行「本週未做 X」，不要默默留著讓人猜。

---

## 8. DoD

- [ ] `usePlacementIntent.ts` 存在，不 import 任何 store
- [ ] 工具列真機器卡片點選後，畫布側讀得到那台機器的 id
- [ ] 點畫布空格會落子；`pnpm dev` 上看得到正確佔格與**中文機器名**
- [ ] 落子前呼叫 `canPlaceDevice`（A0 已合入時）；重疊格點不會落子
- [ ] `GridCanvas.vue` 內 `grep` 不到 `store`、`vue-flow`
- [ ] diff 不含 `editorStore`、`src/app/StatsPanel/*`、`MainLayout.vue`、inspector
- [ ] `ToolbarPanel.vue` 的 diff 只在 `<script>` 區
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 綠
- [ ] PR body 兩行：落子填了哪些欄位；本週未做哪些加分項

---

## 9. 交檔

分支 `dev/toby0921`，標題帶 `W0921-T1`。**推到分支就算交付。**

**門檻週請在 9/26（五）前推第一版**，哪怕只有第 1、2 刀——主編要在 9/27 前有東西可審。

---

## 10. 卡住找誰

| 狀況 | 找誰 |
|------|------|
| `canPlaceDevice` 的簽章、`DRAFT_ID` | aaaaa |
| `ToolbarPanel.vue` 的 script 區改完 template 壞了 | **dernoson，當天講**；template／style 是 goodmorning 的區 |
| 想擴大到拖曳／旋轉／選取 | **先回報**，不要自己開 |

> 超過一天沒進展講一聲。本週只有這一塊。

---

## 11. 未交頂替

9/27 的 B1 硬綁降級：門檻當日記錄「工具列真機器列表已在 master（#43），落子鏈順延 10 月」，並在 [ROADMAP §9](../../../roadmap/ROADMAP_OUTLINE.md) 回寫延因。**不計個人失敗**——本項是全隊唯一一條門檻線，壓力在派工端不在你。週三前回報一句進度即可。
