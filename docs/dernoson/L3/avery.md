# avery — 下方工具列 + Canvas 管線類 + 視角切換 UI + 警示列表

**所屬層次：** L3 UI 元件層
**負責區塊：** 下方設備工具列 + Canvas 管線類子元件 + 視角切換 UI + 警示列表
**背景：** 高中生，技術入門
**文件版本：** v0.2（azure9572 轉任 L1 後接手部分元件）

---

## 1. 角色定位

avery 負責四個區塊的純展示元件。雖然元件數量比較多（13 個），但每一個都不算難 —— 大多是「拿資料、畫出來、點了我 emit 給上層」這種典型 dumb component。

四個區塊：

1. **下方設備工具列**（DeviceToolbar）—— user 拿起設備的地方
2. **Canvas 管線類子元件** —— 畫布上的管線視覺（接口圓點、管線本體、繪製中預覽、autoNode 圖示）
3. **視角切換 UI** —— 左下角三圖示按鈕 + 並列版型容器
4. **警示列表** —— 右側統計面板的警示展示

沒有任何複雜邏輯。慢慢來、一步一步寫，不需要急。

### 目前狀態

- **L1 上游已就緒**：所有 stores 與型別（`Machine` / `Alert` / `Rotation` 等）都完成。
- **L2 容器層尚未開工**：harry / toby 都還沒動工，正式 props / emits 由 L2 開規格時才會凍結。
- 因此你**不會被卡住**：可以先做純靜態元件 + Storybook（用 mock fixture），等 L2 開規格時再對齊。這正是 L3「dumb component」最理想的開發節奏。
- **azure9572 已轉任 L1**：他原本負責的 Canvas 管線類 / 視角切換 UI 已轉給你；MBD 的 AlertList 也移到你這（讓 MBD 專注做 StatsPanel + FlowChart）。

---

## 2. 元件清單

> **元件資料夾命名慣例**：每個元件對應一個 PascalCase 資料夾，主元件用 `Index.vue` 命名，該元件的子元件以 PascalCase 平鋪在同一資料夾下。範例：`src/components/DeviceToolbar/Index.vue`（主）、`src/components/DeviceToolbar/DeviceCard.vue`（子）。

### 2.1 DeviceToolbar（下方設備工具列，CR-01 spec 5.3）

| 元件 | 路徑 | 複雜度 |
|---|---|---|
| `DeviceToolbar`（主） | `src/components/DeviceToolbar/Index.vue` | 簡單（容器） |
| `CategoryTabs` | `src/components/DeviceToolbar/CategoryTabs.vue` | 簡單 |
| `DeviceCard` | `src/components/DeviceToolbar/DeviceCard.vue` | 很簡單 |
| `ToolbarSearch` | `src/components/DeviceToolbar/ToolbarSearch.vue` | 很簡單 |

### 2.2 Canvas 管線類子元件（CR-02 §5.1～5.2、§2.3、§2.5）

主畫布 `Canvas/Index.vue` 由 L2 harry / toby 寫，以下為其子元件，與 goodmorning 的 Canvas 設備類共用同一個資料夾 `src/components/Canvas/`。

| 元件 | 路徑 | 複雜度 |
|---|---|---|
| `PortDot` | `src/components/Canvas/PortDot.vue` | 簡單（一般灰點 / 管線模式高亮 / 吸附綠點 / 已連接） |
| `PipelineEdge` | `src/components/Canvas/PipelineEdge.vue` | 中（橘/藍實線、方向箭頭、Error 紅閃、Warning 黃框、流量 tooltip） |
| `PipelineDraft` | `src/components/Canvas/PipelineDraft.vue` | 中（繪製中預覽路徑、90 度違規線段標紅） |
| `AutoNodeBadge` | `src/components/Canvas/AutoNodeBadge.vue` | 簡單（分流/匯流/物流橋圖示，分流/匯流可切換截斷模式按鈕） |

### 2.3 視角切換 UI（CR-05 §5.1～5.2）

| 元件 | 路徑 | 複雜度 |
|---|---|---|
| `ViewSwitcher`（主） | `src/components/ViewSwitcher/Index.vue` | 簡單 |
| `SplitLayout`（主） | `src/components/SplitLayout/Index.vue` | 中（拖移分隔線） |
| `SplitOrientationToggle`（主） | `src/components/SplitOrientationToggle/Index.vue` | 簡單 |

### 2.4 警示列表（CR-03 §2.4）

| 元件 | 路徑 | 複雜度 |
|---|---|---|
| `AlertList`（主） | `src/components/AlertList/Index.vue` | 簡單 |
| `AlertItem` | `src/components/AlertList/AlertItem.vue` | 很簡單 |

---

## 3. 介面範例

> 以下範例以你最熟悉的 DeviceToolbar 四個子元件為主（詳細）；其他三個區塊（Canvas 管線類、視角切換 UI、AlertList）給出最小簽名與重點規格，等實際開工時再對齊 L2 規格細節。

### 3.1 `DeviceToolbar/DeviceCard.vue`

最簡單的元件，先做這個熟悉節奏。

```vue
<script setup lang="ts">
interface Props {
  deviceId: string
  name: string
  iconUrl: string
  /** 已被搜尋過濾掉時，可以選擇灰階或隱藏；預設由父層決定要不要 render */
  highlighted?: boolean
}

interface Emits {
  (e: 'pick', deviceId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <button
    class="flex flex-col items-center p-2 rounded-md border border-neutral-300 hover:border-primary"
    @click="emit('pick', props.deviceId)"
  >
    <img :src="iconUrl" :alt="name" class="w-10 h-10" />
    <span class="text-xs mt-1">{{ name }}</span>
  </button>
</template>
```

點一下發 `pick` event 出去，L2 收到後會去處理「拿起設備」的邏輯。你不用知道那是什麼。

### 3.2 `DeviceToolbar/CategoryTabs.vue`

```ts
interface Category {
  id: string                         // 'mining' / 'processing' / ...
  label: string                      // '採集' / '加工' / ...
}

interface Props {
  categories: Category[]
  activeId: string
}

interface Emits {
  (e: 'change', categoryId: string): void
}
```

可以直接用 Nuxt UI 的 `<UTabs>` 包，自己畫也可以。建議先用 UTabs 省時間。

### 3.3 `DeviceToolbar/ToolbarSearch.vue`

```ts
interface Props {
  modelValue: string                 // 目前搜尋字串
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', v: string): void
}
```

用 v-model 的標準寫法，父層 `<ToolbarSearch v-model="keyword" />`。

### 3.4 `DeviceToolbar/Index.vue`（把上面三個包起來）

```ts
interface DeviceView {
  id: string
  name: string
  iconUrl: string
  categoryId: string
}

interface Props {
  categories: Category[]
  devices: DeviceView[]
  activeCategoryId: string
  searchKeyword: string
}

interface Emits {
  (e: 'change-category', id: string): void
  (e: 'update-search', v: string): void
  (e: 'pick-device', deviceId: string): void
}
```

把上面三個小元件組起來。要顯示的設備清單，記得在這層做「分類 + 搜尋」過濾：

```ts
const visibleDevices = computed(() => {
  const k = props.searchKeyword.trim().toLowerCase()
  return props.devices.filter(d => {
    const matchCategory = k ? true : d.categoryId === props.activeCategoryId
    const matchKeyword = k ? d.name.toLowerCase().includes(k) : true
    return matchCategory && matchKeyword
  })
})
```

注意：有搜尋字串時要跨分類過濾（spec 5.3 規定）。

### 3.5 Canvas 管線類元件（最小簽名）

```ts
// PortDot — 接口圓點
interface PortDotProps {
  state: 'idle' | 'highlighted' | 'snapping' | 'connected'
  type: 'conveyor' | 'pipe'
}

// PipelineEdge — 管線本體
interface PipelineEdgeProps {
  type: 'conveyor' | 'pipe'
  path: { x: number; y: number }[]   // 含起終點的所有節點
  flow?: number                      // 速率，給 tooltip 用
  alertLevel?: 'error' | 'warning'
}

// PipelineDraft — 繪製中預覽
interface PipelineDraftProps {
  type: 'conveyor' | 'pipe'
  path: { x: number; y: number }[]
  invalidSegmentIndices: number[]    // 違反 90 度的線段索引，標紅
}

// AutoNodeBadge — 分流/匯流/物流橋圖示
interface AutoNodeBadgeProps {
  kind: 'splitter' | 'merger' | 'bridge'
  position: { x: number; y: number }
  mode?: 'auto' | 'cut'              // 物流橋無此欄位
}
interface AutoNodeBadgeEmits {
  (e: 'toggle-mode'): void           // 物流橋不發
}
```

視覺顏色：傳送帶橘色、水管藍色；Error 紅閃、Warning 黃框。

### 3.6 視角切換 UI（最小簽名）

```ts
// ViewSwitcher — 左下角三圖示按鈕
type ViewMode = 'blueprint' | 'flow' | 'split'
interface ViewSwitcherProps { current: ViewMode }
interface ViewSwitcherEmits { (e: 'change', mode: ViewMode): void }

// SplitLayout — 並列容器（兩個 slot：primary / secondary）
interface SplitLayoutProps {
  orientation: 'horizontal' | 'vertical'
  splitRatio: number                 // 0~1，預設 0.5
  minRatio?: number                  // 預設 0.2
  maxRatio?: number                  // 預設 0.8
}
interface SplitLayoutEmits {
  (e: 'update:splitRatio', v: number): void
}

// SplitOrientationToggle — 切換左右/上下並排
interface SplitOrientationToggleProps {
  orientation: 'horizontal' | 'vertical'
}
interface SplitOrientationToggleEmits {
  (e: 'update:orientation', v: 'horizontal' | 'vertical'): void
}
```

`SplitLayout` 拖移分隔線屬於本地互動，用 `pointerdown` / `pointermove` 計算比例後 emit。**這個 ref 留在 L3 沒問題**，因為離開元件就不需要。

### 3.7 AlertList 警示列表（最小簽名）

```ts
interface AlertView {
  uid: string
  level: 'error' | 'warning'
  code: string                       // 'E001' / 'W003'
  message: string
  relatedDeviceUids: string[]
  relatedConnectionUids: string[]
}

interface AlertListProps {
  alerts: AlertView[]
}
interface AlertListEmits {
  (e: 'navigate', alert: AlertView): void   // 點警示後 L2 會 pan + zoom 至對應元素
}
```

依 `level` 分組（Error 在上、Warning 在下），每組標題顯示數量。

---

## 4. 學習路徑（建議照這個順序做）

技術還在入門，建議慢慢拆，每一步都做完再下一步。整體分四個階段：

### 階段 A：DeviceToolbar（先熟悉節奏）

1. **DeviceCard 純靜態** —— 寫好 props，hardcode 三張卡片在 Storybook 顯示
2. **DeviceCard 加 emit** —— 點擊發 `pick` event
3. **CategoryTabs** —— 用 Nuxt UI 的 `<UTabs>` 包，切換 Tab 發 `change`
4. **ToolbarSearch** —— v-model 標準寫法
5. **DeviceToolbar 整合** —— 把上面三個包起來，寫好 `visibleDevices` computed

### 階段 B：AlertList（最簡單的 list 元件）

6. **AlertItem** —— 顯示單筆警示（icon + code + message）
7. **AlertList** —— 依 level 分組顯示 + 點擊發 `navigate` event

### 階段 C：視角切換 UI

8. **ViewSwitcher** —— 三個圖示按鈕橫向排列，當前 mode 高亮
9. **SplitOrientationToggle** —— 切換左右 / 上下並排的按鈕
10. **SplitLayout** —— 比較難的一個，重點是拖移分隔線（`pointerdown` / `pointermove`），用 v-model 把 splitRatio 給上層

### 階段 D：Canvas 管線類（畫布視覺，跟 goodmorning 同資料夾協作）

11. **PortDot** —— 接口圓點，四種狀態
12. **AutoNodeBadge** —— 三種圖示（分流 / 匯流 / 物流橋）
13. **PipelineEdge** —— 管線本體，要畫多段折線 + tooltip
14. **PipelineDraft** —— 繪製中預覽，違規線段標紅（toby 在 L2 算好 `invalidSegmentIndices` 餵進來）

每完成一步就交一個 PR，dernoson 會 review。**不要一次寫完所有元件再交**，這樣回饋會更慢、改起來也更累。

> **預估時程**：階段 A 約 3～4 天，B 約 1 天，C 約 2～3 天，D 約 3～4 天。Phase 1 預計 9～12 個工作天。可以彈性安排，不要逼自己。

---

## 5. 與 L2 的對齊節點

| 節點 | 內容 | 對接對象 |
|---|---|---|
| K1 | 確認 `DeviceView` / `Category` DTO 形狀（由 L2 從 L1 的 `Machine` 攤平） | L2（harry） |
| K2 | 確認搜尋字串放在父層還是 L2 store（L3 不關心，但要確認 v-model 流向） | L2（harry） |
| K3 | Canvas 管線類 props 細節：路徑座標系（pixel 還是 grid？方向箭頭怎麼算？） | L2（toby） |
| K4 | `PipelineDraft.invalidSegmentIndices` 由 L2 算好餵進來（90 度驗證住 L2） | L2（toby） |
| K5 | `SplitLayout.splitRatio` 寫進哪個 store（canvasStore 還是新的 viewStore） | L2（harry） + L1 Architect（dernoson / aaaaa 負責 viewStore） |
| K6 | `AlertList` 的 `navigate` event 對應的導覽（pan + zoom）由 L2 處理 | L2（harry） |
| K7 | Storybook mock data 共用一份 fixture（與 goodmorning / MBD 對齊） | goodmorning / MBD |
| K8 | 基地模式下需要隱藏 `allowInBase: false` 設備——但這個過濾**在 L2 完成**，L3 拿到的 `devices` 已經過濾好了 | L2 |

---

## 6. 提醒

- **絕對不要 `import { useXxxStore }`**。任何時候你覺得「我需要拿資料」，那是 props 沒給夠，回頭問 L2。
- 元件名稱、檔名都用 PascalCase（主元件用 `Index.vue`、子元件如 `DeviceCard.vue`），元件 export default 不要自己加。
- Tailwind class 不確定怎麼寫不要緊，先寫個能跑的版本，dernoson 會在 review 幫你調。
- 不會的可以問 goodmorning（L3 中等難度），或直接在 PR 留 comment 問。
- 不要害怕問問題。問問題比寫錯一週才被發現省時間。
- 不必照階段 A→D 一定要做完才能交付，每個元件交一個 PR，可以依興趣調順序。
