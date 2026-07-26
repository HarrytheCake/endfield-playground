# 待指派任務：基地選擇 UI（`baseRegion`）設計、實作與對接

**你是 toby，你要負責做內部邏輯對接**

**狀態：** 待指派，尚未動工
**類型：** 新功能（跨 L2 + L3，可能需要兩人協作或一人跨層）
**相關 CR：** CR-01（畫布，spec `01_canvas_and_devices.md` §2.1 / §2.6）；為 CR-03 未來的 E003 detector 鋪路（spec `03_validation.md`）
**相關檔案：** `src/store/canvasStore.ts`（L1，已完成）、`src/utils/geometryUtils.ts`（L1，已完成）、`src/editor/canvas/FactoryCanvas.vue`（L2）、`src/editor/inspector/InspectorPanel.vue`（L2，可能的掛載點之一）

---

## 1. 這個任務要解決什麼

`canvasStore.baseRegion` 目前永遠是 `null`，因為**沒有任何 UI 讓使用者選擇基地**。這個任務要把「選擇基地」這個 spec 已定義的功能，從 L1 已經寫好的 store 狀態，實作成使用者真的能操作的介面。

---

## 2. Spec 依據（已確認的需求）

`spec/01_canvas_and_devices.md` §2.1：

> **基地選擇（optional）：**
> 使用者可選擇當前規劃的基地（武陵 / 四號谷地），選擇後：
>
> - 畫布疊加該基地實際格子尺寸的框線，作為擺放參考
> - 允許在框線外擺放設備；超出框線的設備顯示 Error 警示（見 CR-03），不阻擋擺放
> - 未選擇基地時，畫布無框線標示

`spec/01_canvas_and_devices.md` §7 驗收標準也明列：

| 驗收項目         | 內容                                                    |
| ---------------- | ------------------------------------------------------- |
| 基地選擇顯示框線 | 選擇武陵 / 四號谷地，確認畫布疊加對應格子尺寸的框線     |
| 框線外擺放不阻擋 | 選擇基地後於框線外擺放設備，確認可放置且顯示 Error 警示 |

對應的錯誤代碼是 `spec/03_validation.md` 的 **E003「超出基地框線」**：

> 設備或管線佔用格子超出當前基地可建造框線範圍

---

## 3. L1 已經準備好的東西（可以直接用，不需要重寫）

`canvasStore.ts` 與 `geometryUtils.ts` 已經交付以下內容，這個任務**不需要碰 L1**：

```typescript
// src/store/canvasStore.ts
type BaseRegion = 'wuling' | 'valley4' | null   // null = 自由畫布（無邊界）
const baseRegion: Ref<BaseRegion>
const canvasSize: ComputedRef<{ w: number; h: number } | null>  // 依 baseRegion 算出的格子尺寸
function setBaseRegion(region: BaseRegion): void
// 基地尺寸：wuling 256×256、valley4 192×192，對應 `00_top_spec.md` 第 6 節「待確認事項」列出的
// 協議核心區域格子尺寸，實作先以此數值為準，待完整清點結果出爐後同步調整
```

```typescript
// src/utils/geometryUtils.ts
function isWithinBaseRegion(x: number, y: number, baseRegion: BaseRegion): boolean
function isDeviceWithinBaseRegion(device: FactoryNode, def: Machine, baseRegion: BaseRegion): boolean
```

`isDeviceWithinBaseRegion()` 就是未來 E003 detector 的核心判斷邏輯，已經寫好且待用。

---

## 4. 這個任務的範圍（Scope）

### 4.1 L3：新增基地選擇元件

- 一個選擇器（下拉選單或分段控制皆可，UI 形式由承接者決定），選項為：`自由畫布`（對應 `null`）、`武陵`、`四號谷地`
- Props / emits 設計需遵守 `CLAUDE.md` 三層規則——這個元件**不得 import `useCanvasStore`**，選取結果透過 emit 往上拋

### 4.2 L2：wiring

- 決定這個選擇器要放在哪裡（`InspectorPanel.vue`？`Navbar.vue`？工具列？—— 這是承接者要做的 UI/UX 決策，spec 沒有明講位置）
- 選擇器 emit 事件時呼叫 `canvasStore.setBaseRegion()`
- 依 `canvasStore.canvasSize`（`null` 時代表自由畫布不顯示框線）在畫布上疊加對應格子尺寸的框線視覺
    - Vue Flow 疊加自訂圖層的方式需要調研（例如額外的 `<Background>` 變體、或自訂 SVG overlay 元件、或 `<Panel>`），這部分沒有現成範例可抄，需要花時間評估
- 框線純粹是「擺放參考」，**不阻擋擺放**（放置到框線外要能成功放置，只是之後會顯示 Error，見下方 out of scope）

### 4.3 不在這個任務範圍內（out of scope，避免 scope creep）

- **E003 detector 本身**：也就是「偵測設備超出框線並產生 Error 警示」這件事，屬於 CR-03 驗證系統的工作（跟 `E001_deviceOverlap.ts` 同一類），不是這個任務的範圍。這個任務只需要做到「選了基地、畫布上看得到框線」，讓使用者有參考依據；E003 的偵測邏輯建議另開一個任務（可以參考 `E001_deviceOverlap.ts` 的既有寫法與 `isDeviceWithinBaseRegion()` 直接組裝）
- **CR-11 工具列「基地隱藏中繼器」**：`spec/11_toolbar.md` 提到的中繼器相關邏輯是另一個 CR 的範疇，不在此任務內

---

## 5. 驗收標準（承接者可直接對照）

1. 選擇「武陵」，畫布疊加 256×256 格的框線；選擇「四號谷地」，疊加 192×192 格的框線
2. 選擇「自由畫布」（或初始未選擇），畫布無框線標示
3. 在框線外放置設備，放置動作**成功**（不阻擋）——本任務不需要顯示 Error 警示（那是 E003 detector 的工作），但放置行為本身要正常
4. 切換基地不影響既有設備位置與歷史堆疊（`baseRegion` 不進歷史，是純視圖狀態）

---

## 6. 給指派者的備註

- 這個任務同時需要 L2（wiring、決定 UI 掛載位置）與 L3（新元件設計）能力，適合一人跨層完成，或兩人協作（L3 先定義好元件 props/emits，L2 對齊後各自實作，依 `L2.md` §5 的既有分工流程）
- 「Vue Flow 上要怎麼疊加一個純視覺的框線 overlay」目前沒有前例可循，建議承接者先花點時間研究 Vue Flow 的 `<Panel>` / 自訂 `<Background>` API，或搜尋 Vue Flow 官方 examples 有沒有類似「boundary overlay」的做法，抓一下工作量再排時程
