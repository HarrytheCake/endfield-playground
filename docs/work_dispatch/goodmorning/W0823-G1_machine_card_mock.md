# W0823-G1｜goodmorning｜工具列機器卡片 mock（單檔 L3）

| meta | value |
|------|-------|
| 週次 | 2026-08-23 → 2026-08-30 |
| 對應 roadmap | [R-B1](../../roadmap/detail/B1_toolbar_real_machines.md) 的 L3 卡片切片（提前 mock；B1 正式串資料在 9 月） |
| 等級 | **加分項**（不擋 8/30） |
| 擋 8/30 門檻 | **否**（未交不計失敗；頂替＝Toolbar 維持現有 `UButton` 列表） |
| 性質 | 純畫面 mock（**本週只做這一種**） |
| 預估時數 | 依你的節奏；**硬 deadline：2026-08-28（五）23:59** |
| review_gate | dernoson（路徑／合入；可代搬檔） |
| mentor | 本週 pair 名額已給 toby／avery，你以**書面工單＋週中 Discord**為主 |
| **完整樣板** | [GUIDE_machine_card_template](./GUIDE_machine_card_template.md)（整份 `.vue` 可直接複製貼上） |
| 狀態 | `[ ]` 未開始 |

---

## 0. 一句話

在**指定路徑**做一張「機器卡片」元件：只靠別人傳進來的文字顯示名稱與佔格，點一下對外喊「選了這台」——**不要連資料庫、不要改 store、不要用 GitHub 網頁上傳。**

**Deadline：8/28（五）23:59** 前交到 Discord（檔案或 PR）。逾時本單關閉，不計失敗。

---

## 1. 四欄工單

| 欄 | 內容 |
|----|------|
| **畫面** | 一張卡片上看得见：**名稱**（例如「粉碎機」）＋**佔格文字**（例如「3×2」）；滑鼠點卡片有反應（之後別人會拿去接放置，你這週只要 emit） |
| **交哪個檔** | **只准這一個新檔：** `src/components/MachineCard/Index.vue`（資料夾名、檔名必須一字不差） |
| **不要碰** | `editorStore`／任何 `src/store/**`、`ToolbarPanel.vue`（別人的容器）、`FactoryCanvas.vue`、演算法、detector、InfoPanel 整包、repo **根目錄**亂放 `.vue` |
| **卡住找誰** | dernoson（路徑／怎麼交檔）；卡片長什麼樣可對 [paper 稿](../../paper/)（沒稿就用文字排版）。**週中會有人在 Discord 問你一句進度** |

---

## 2. 為何是你、範圍怎麼切

| 依據 | 結論 |
|------|------|
| 範圍 | 單一新檔、不擋門檻；路徑與 deadline 都寫死，你不必判斷 |
| 交檔方式 | 本單**禁止** GitHub 網頁 Upload，避免檔案落到錯的位置（三種正確方式見 §5.4） |
| 難度 | 刻意壓在「照樣板改幾行」的等級；[完整樣板](./GUIDE_machine_card_template.md)可直接複製 |
| B1 | 9 月工具列需要 L3 卡片；本週先做出殼 |

**本週不做：** 接真機器列表、Tab 分類、icon 正式圖、改 ToolbarPanel。

---

## 3. 專有名詞（請先讀完再動手）

| 詞 | 白話 | 本週規則 |
|----|------|----------|
| **L3** | 「只負責看起來怎樣」的元件 | **不准**自己去拿資料；資料由別人用 props 塞進來 |
| **props** | 別人傳進元件的資料（只讀） | 你要接收：`id`、`name`、`sizeText`（必做）；`tag`、`iconUrl` 可選 |
| **emit** | 元件對外喊一聲「發生了某件事」 | 點卡片時：`emit('pick', id)` |
| **store／Pinia** | 專案裡存放藍圖狀態的地方 | **禁止** `import` 任何 store |
| **mock** | 假資料／假畫面，先看起來對 | 你的卡片用假 props 也能演示；不必接真 JSON |
| **`Index.vue`** | 這個資料夾的「門面檔」 | 路徑必須是 `MachineCard/Index.vue`，不要取名 `MachineCard.vue0811` |

對照範例（只看結構，可打開讀）：`src/components/BaseRegionSelector/Index.vue`——它用 props／emit，不自己改藍圖資料。

---

## 4. 開工前檢查

- [ ] 已會或請人協助：本機有專案、能打開資料夾（**不要求**你搞懂整個架構）
- [ ] 確認要新建的完整路徑：`src/components/MachineCard/Index.vue`
- [ ] 讀本檔 §5「絕對不要做的事」
- [ ] Discord 回一句：「G1 我開始了，deadline 8/28」——方便週中對上進度

---

## 5. 步驟（照做）

### 5.1 建立檔案

1. 在本機建立資料夾 `src/components/MachineCard/`
2. 建立檔案 `Index.vue`（不要放在桌面再 Upload 到 GitHub 網站）

### 5.2 元件最小規格（複製後改字即可）

`<script setup lang="ts">` 內需要：

```ts
const props = defineProps<{
  id: string
  name: string
  sizeText: string
  tag?: string
  iconUrl?: string
}>()

const emit = defineEmits<{
  pick: [machineId: string]
}>()

function onClick() {
  emit('pick', props.id)
}
```

`<template>` 內：顯示 `name`、`sizeText`；整張可點；`@click="onClick"`。  
樣式：用簡單 CSS 或 Tailwind 均可；**不要求**漂亮到上線品質。

### 5.3 怎麼證明做完（30 秒驗收）

任選一種：

| 方式 | 做法 |
|------|------|
| A（推薦） | Discord 交 `Index.vue`＋截圖；截圖上卡片清楚看得到名稱與「3×2」這類文字 |
| B | 開 PR，標題寫 `feat(ui): MachineCard mock`，描述貼路徑 |

若你不會把卡片掛進畫面：把檔案交 dernoson，請他代掛兩個假 props 截圖——**仍算你交付元件**，但檔必須在正確路徑。

### 5.4 交檔方式（三選一，禁止 Upload）

1. **本機 git**：`git checkout -b dev/goodmorning-g1` → add → commit → push → 開 PR  
2. 把正確路徑的檔案內容貼 Discord，請 dernoson **代 commit**（路徑仍必須是上面那個）  
3. ZIP 傳 Discord（內層路徑仍要是 `src/components/MachineCard/Index.vue`）

**禁止：** GitHub 網頁「Add file」／把 `MachineCard.vue` 丟在 repo 根目錄／檔名加日期當版本。

---

## 6. 絕對不要做的事

1. `import` 任何 `@/store/...` 或 `pinia`
2. `import` `@/data/machines`（那是資料層；卡片只吃字串 props）
3. 修改 `ToolbarPanel.vue`（那是 L2，本週不是你的檔）
4. 一次做 InfoPanel／多 Tab／整包 UI
5. 網頁上傳覆蓋別人的檔

---

## 7. DoD

- [ ] 檔案存在於 `src/components/MachineCard/Index.vue`
- [ ] 有 props：`id`、`name`、`sizeText`；點擊 `emit('pick', id)`
- [ ] **沒有** store／machines 的 import
- [ ] 8/28 23:59 前 Discord 或 PR 有交付痕跡
- [ ] 未使用 GitHub Upload；未放在根目錄

---

## 8. 未交頂替

不擋 8/30。未交或逾時 → Toolbar 繼續用現有按鈕；9 月 B1 改派或由 aaaaa 用最簡 `<button>` 頂替（見 B1）。

---

## 9. 回報

| 時機 | 動作 |
|------|------|
| 開工 | Discord「G1 開始了」 |
| 週中（約 8/27） | **會有人問一句**；請當天回「做了／卡住／不做了」之一 |
| 8/28 前 | 交檔或明確說「本週不做」 |

---

## 10. 開發日誌（派工側）

### 2026-08-23

- 依 B1 的 L3 卡片切片提前 mock 正式派工：單檔、硬 DL 8/28、禁 Upload
- 附完整 `.vue` 樣板；路徑與 deadline 寫死
- 不擋 8/30
