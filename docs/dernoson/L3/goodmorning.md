# goodmorning — 左側資訊面板

**所屬層次：** L3 UI 元件層
**負責區塊：** 左側資訊面板（CR-01 spec 5.2）
**背景：** 本科大學生，技術中等
**文件版本：** v0.1

---

## 1. 角色定位

左側資訊面板是設備資訊的主要展示區，分三個 Tab：配方表、設備形狀、耗電與資訊。三個 Tab 中以「設備形狀」最有挑戰——需要根據設備的 cell 佔格與接口位置畫出示意圖。其餘兩個 Tab 是資料表呈現。

整個區塊在 L3 視角下是「拿到一個 `device` 資料 + 一些 flag，畫出三個 Tab」。L2（harry 預計負責容器）會把 store 資料攤平餵進來。

### 目前狀態

- **L1 上游已就緒**：editorStore / canvasStore / validationStore 等都已完成，`FactoryNode` / `Machine` / `RecipeDef` 等型別也都存在。
- **L2 容器層尚未開工**：`InfoPanel/Index.vue` 的容器版本、`Canvas/Index.vue` 都還沒寫；正式的 props / emits 由 L2 開規格時才會凍結。
- 在 L2 動工前，這份文件中的介面範例屬於「建議稿」。L3 可以先做純展示 mockup（搭配 Storybook fixture 或 `/dev/components` 預覽頁）來確認設備形狀 SVG 的繪製方式，這些都不會被卡住。

---

## 2. 元件清單

> **元件資料夾命名慣例**：每個元件對應一個 PascalCase 資料夾，主元件用 `Index.vue` 命名，該元件的子元件以 PascalCase 平鋪在同一資料夾下。範例：`src/components/InfoPanel/Index.vue`（主）、`src/components/InfoPanel/RecipeListTab.vue`（子）。

### 2.1 InfoPanel（左側資訊面板）

| 元件 | 路徑 | 複雜度 |
|---|---|---|
| `InfoPanel`（主） | `src/components/InfoPanel/Index.vue` | 中（Tab 容器） |
| `RecipeListTab` | `src/components/InfoPanel/RecipeListTab.vue` | 中 |
| `DeviceShapeTab` | `src/components/InfoPanel/DeviceShapeTab.vue` | 中偏難（SVG 繪製） |
| `PowerInfoTab` | `src/components/InfoPanel/PowerInfoTab.vue` | 簡單 |
| `DeviceShapeDiagram` | `src/components/InfoPanel/DeviceShapeDiagram.vue` | 抽出來的形狀子元件 |

### 2.2 Canvas 設備類子元件（畫布主元件 `Canvas/Index.vue` 由 L2 harry/toby 寫，以下為其子元件）

| 元件 | 路徑 | 複雜度 | 來源 spec |
|---|---|---|---|
| `DevicePreview` | `src/components/Canvas/DevicePreview.vue` | 中（綠/紅半透明預覽、跟隨游標） | CR-01 §2.3 |
| `DirectionPicker` | `src/components/Canvas/DirectionPicker.vue` | 中（菱形方向框、長按拖移視覺） | CR-01 §2.3 |
| `PlacedDeviceSprite` | `src/components/Canvas/PlacedDeviceSprite.vue` | 中偏難（旋轉、效率色、警示邊框、⚠️ 圖示） | CR-01 §2.3, CR-04 §2.4 |
| `GridBackground` | `src/components/Canvas/GridBackground.vue` | 簡單（格線可開關） | CR-01 §2.1 |
| `BaseRegionOverlay` | `src/components/Canvas/BaseRegionOverlay.vue` | 簡單（武陵液體輸入方位標示） | CR-01 §2.1 |

> 這些 Canvas 子元件由 L2 的 `Canvas/Index.vue` 透過 props 傳入資料、收 events。例如 `DevicePreview` 收 `{ device, position, rotation, isValid }` props，發 `confirm-place` event。具體 props/emits 介面由 L2（harry/toby）開規格給你，請等他們的 PR 或主動詢問。

---

## 3. 介面範例

### 3.1 `InfoPanel/Index.vue`（容器）

```ts
interface Props {
  /** 目前選取的設備靜態資料；null = 沒有選取，顯示空狀態 */
  device: DeviceInfo | null
  /** 該設備在畫布上的部署實例（從工具列拿起時為 null） */
  placedInstance: PlacedDeviceInfo | null
  /** 預設 Tab */
  defaultTab?: 'recipe' | 'shape' | 'power'
}

interface Emits {
  (e: 'change-recipe', payload: { placedUid: string; recipeId: string }): void
}
```

`DeviceInfo` / `PlacedDeviceInfo` 是 L2 攤平過的 plain DTO。L1 上游對應的型別是 `Machine`（`src/types/machine`）與 `FactoryNode` / `FactoryNodeData`（Vue Flow 包裝過的型別），L3 **不直接 import** 這些 L1 型別，由 L2 將其攤平成 plain DTO 後以 props 餵進來。型別檔由 L2 維護於 `src/types/ui/info-panel.ts`（具體欄位等 L2 開規格時定稿）。

### 3.2 `InfoPanel/RecipeListTab.vue`

```ts
interface RecipeView {
  id: string
  name: string
  cycleSec: number          // 週期時間（秒）
  inputs: { itemId: string; name: string; iconUrl: string; ratePerMin: number }[]
  outputs: { itemId: string; name: string; iconUrl: string; ratePerMin: number }[]
}

interface Props {
  recipes: RecipeView[]
  activeRecipeId: string | null      // 已部署設備才有值
  canSwitch: boolean                 // = placedInstance != null
}

interface Emits {
  (e: 'select-recipe', recipeId: string): void
}
```

### 3.3 `InfoPanel/DeviceShapeTab.vue` / `InfoPanel/DeviceShapeDiagram.vue`

```ts
interface PortView {
  id: string
  type: 'conveyor' | 'pipe'
  direction: 'input' | 'output'
  // 相對於設備左上角的 cell 座標 + 朝向（0/90/180/270）
  cell: { x: number; y: number }
  facing: 0 | 90 | 180 | 270
}

interface Props {
  /** 設備佔格（例如 2x3） */
  size: { w: number; h: number }
  ports: PortView[]
  /** 顯示比例，預設由元件自己決定 */
  cellPx?: number
}
```

### 3.4 `InfoPanel/PowerInfoTab.vue`

```ts
interface Props {
  powerKw: number              // 耗電量；負值代表供電
  size: { w: number; h: number }
  category: string             // '採集' / '加工' / ...
  description: string | null
}
```

純展示，沒有 emit。

---

## 4. 設備形狀繪製建議

兩個可行方向，建議先用方案 A：

### 方案 A：SVG（推薦）

- 每個 cell 一個 `<rect>`，邊長 = `cellPx`
- 接口用 `<circle>` 或 `<polygon>` 標記在 cell 邊緣
- 不同 port type 用顏色區分：傳送帶（黃）、水管（藍）
- 方向用箭頭標示（`input` 朝內、`output` 朝外）
- 旋轉設備時整個 `<g>` 套 `transform="rotate(...)"`，省事

優點：可縮放、易於 hit-test（之後 Tab 內 hover port 顯示 tooltip 容易做）。

### 方案 B：CSS grid + 絕對定位

- `display: grid; grid-template-columns: repeat(w, cellPx)` 排出格子
- 用 absolute div 放接口
- 適合「不需要太多互動」的情境

如果不確定，**先做方案 A 的最小可運作版本（畫格子 + 標接口位置）**，後續再加細節。

---

## 5. 開發順序建議

1. **PowerInfoTab**（半天）— 最簡單，先熟悉 L3 規範與 Tailwind
2. **RecipeListTab 靜態版**（1 天）— 接 mock data，先不處理切換配方 emit
3. **RecipeListTab 加切換 emit**（半天）— 已部署設備可切換配方
4. **DeviceShapeDiagram**（1～2 天）— SVG 繪製、可獨立 Storybook 驗收
5. **DeviceShapeTab**（半天）— 把 Diagram 包進 Tab、加文字說明
6. **InfoPanel/Index.vue**（半天）— 包成 Tab 容器、處理空狀態

整體預估 4～5 個工作天。

---

## 6. 與 L2 的對齊節點

| 節點 | 內容 | 對接對象 |
|---|---|---|
| K1 | 確認 `DeviceInfo` / `PlacedDeviceInfo` DTO 形狀（由 L2 從 L1 的 `Machine` / `FactoryNode` 攤平） | L2 容器層主責 |
| K2 | 確認配方切換 event 簽名（是否需要 source tab 資訊） | L2 容器層主責 |
| K3 | 確認設備形狀資料來源（L1 的 `Machine.ports` / `Machine.size` 已有定義，需確認 L2 攤平後的欄位命名） | L2 容器層主責 |
| K4 | Storybook mock data 共用一份 fixture（與 avery 對齊） | avery |

---

## 7. 提醒

- 不要在元件內 `import { useDeviceStore }` 之類的東西。如果發現自己很想 import store，那代表 props 介面設計得不夠，先回去找 L2 討論。
- 設備形狀的 cell 座標系與畫布的座標系一致（左上原點、x 向右、y 向下），跟 L1 的型別保持一致即可。
- 配方切換 emit 出去後，L2 會呼叫 L1 的 action 寫進 store，不要在元件內自己存「目前選的配方」（除非是純 hover 預覽狀態）。
