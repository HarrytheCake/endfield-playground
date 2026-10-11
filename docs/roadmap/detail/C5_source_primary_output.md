# R-C5 — 源節點素材設定

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §5 |
| 里程碑 | M3（2026-10-25） |
| 擋門檻 | **是**（主編步驟 6；且 11 月產耗數字的唯一起點） |
| 建議主責／備援 | aaaaa（L1 action）＋L2（表單接線）／aaaaa 全包 |
| 性質 | 接線 |
| 依賴 | [B4](./B4_selection_inspector.md) |
| 狀態 | `[ ]` **store 歸屬已裁（主編 2026-10-06：採 B）**——寫 `layoutStore`／`PlacedDevice`；引擎讀取端隨 10/18 切片提前一部分 D1 鏈。見 §4.1a |
| 最後更新 | **2026-10-06（PR #59 裁決回寫）** |

---

## 1. 背景與動機

FlowEngine 的正向傳播從源節點開始：`source → primaryOutput × sourceRatePerMin`。引擎這一側早就完成，`/dev/flow-engine` 的 preset 也一直在用它。問題是**主畫布上沒有辦法設定 `primaryOutput`**——使用者放下一個源設備，它不知道要產什麼，於是整條產線的數字都是零。

這是 11 月「右側看到產耗」能不能演示的**前置條件**，而且是唯一一個。沒有源素材，[D1](./D1_stats_item_summary.md) 做得再完美，右側也永遠是空的。因此本項雖然排在 10 月，實際上是串通月的第一塊拼圖。

V9 已新建「基礎材料輸出點」機器，依品項 `form` 選 belt 或 pipe，這正是本項要設定的對象。

## 2. 使用者看得到什麼

點選一台源設備，在資訊面板裡選一種基礎材料（例如某種礦），面板顯示它每分鐘產出多少；右側產耗表隨即出現這個材料的數字。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 佈局欄位 | `PlacedDevice.primaryOutput`／`sourceRatePerMin`，`src/types/layout.ts` | **型別已有**（頂層欄位，非 `data`） |
| 舊模型欄位 | `FactoryNode.data.primaryOutput`，`src/types/graph.ts` | 仍在；引擎現行讀這裡 |
| adapter | `src/utils/layout/toTopology.ts` | 已把 `device.primaryOutput` 映射到拓樸節點 |
| 引擎消費 | `useFlowEngine` 建圖時讀 `primaryOutput` ＋ `sourceRatePerMin` | **仍掛舊 `editorStore`** |
| 源機器 | 「基礎材料輸出點」（V9 新建） | 資料已有 |
| 材料清單 | `getAllMaterials()`、`getMaterialForm`、`getMaterialPortMedia` | 已有 |
| 預設速率 | 30／min（引擎預設） | 已有 |
| **寫入 action** | — | **不存在**，本項要補（掛 `layoutStore`） |
| 設定 UI | — | **不存在**，本項要補（左面板，非舊 Inspector） |

## 4. 技術決策

### 4.1a 寫進哪個 store——**已裁：採 B（主編 2026-10-06，PR #59）**

| 選項 | 結論 |
|------|------|
| A. 寫 `editorStore` | 否 |
| **B. 寫 `layoutStore`** | **是** |
| C. 兩邊都寫 | 否（違反唯一寫入點） |

**寫入端：** `layoutStore` 新增高階 action，寫入 `PlacedDevice.primaryOutput`（與既有型別一致；D4 亦已定 `primaryOutput` 為頂層欄位）。

**引擎讀取端（B 的附帶義務）：** 10/18 切片必須讓引擎（或經 `toTopology`）能讀到正式畫布上的 `primaryOutput`——等於把十一月「引擎接 layoutStore」的 **最小可演示切片提前**。範圍只限源素材這條讀取路徑，**不**一併做右側產耗表接線（仍屬 D1）。具體接法（引擎直接讀 `layoutStore` vs 經 adapter 餵拓樸）由 aaaaa 在 10/11 交 action 時定案並寫進 PR。

大綱 §9 的 R-C5 封鎖列改為已解除。

### 4.1 誰負責寫入（關鍵決策）

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. L2 直接改 `device.primaryOutput` | 容器 mutate | 最快 | 違反「唯一寫入點」；不進歷史；改完引擎可能不重算 | 否 |
| B. 塞進 `addDevice` 的參數 | 放下時就決定 | 一個 action | 放下後改不了；使用者必須先想好 | 否 |
| **C. 新增 L1 高階 action（掛 `layoutStore`）** | 專屬 action，進歷史 | 符合唯一寫入點；可 Undo；正式畫布可設 | 引擎讀取須 10/18 跟版 | **是** |

採 C。這是 ROADMAP §2.1 明列的「L1 只在沒有寫源素材的 action 時補欄位」的具體落實；**掛點由裁決 B 定為 `layoutStore`**。

### 4.2 型別設計

```typescript
/**
 * 設定源設備的主要產出物與速率。
 * 寫入 layoutStore 的 PlacedDevice；進歷史。
 * 引擎須能讀到此欄位後才會出現產耗數字（見 §4.1a）。
 */
function setDevicePrimaryOutput(
  uid: string,
  /** 基礎材料 id；傳 null 表示清除設定 */
  itemId: string | null,
  /** 每分鐘產出；省略時沿用預設 30 */
  ratePerMin?: number,
): void
```

（舊名 `setNodePrimaryOutput` 作廢——避免讓人以為還寫 `FactoryNode`。）
### 4.3 可選材料的範圍

| 規則 | 說明 |
|------|------|
| 只列 `materials.json` 的基礎材料 | V9 已把產品與材料分離；源點不得產出加工品 |
| 依 `form` 過濾 | 該源機器的輸出埠若為 belt，只列 solid 材料；pipe 則列 liquid／gas |
| 只對源類機器開放 | 非源機器的資訊面板不顯示此欄位 |

第二條很重要：讓使用者在 pipe 埠上選固體，會造成引擎側 `isItemFormMediaMismatch` 判定非法，而使用者不會知道為什麼——在下拉選單就過濾掉，比事後報錯友善得多。

### 4.4 速率設定的範圍

10 月**只做材料選擇，速率用預設 30／min**。速率輸入框列為加分項，理由是：速率是數值輸入，牽涉驗證、單位、上下限（belt 30／pipe 60 的上限語意），會把一週的工作量撐成三週。11 月若有餘力再補。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | `src/store/layoutStore.ts`（或同層 layout 寫入入口） | 新增 `setDevicePrimaryOutput`（**aaaaa**） |
| 新建 | 對應 `__tests__` | 設定、清除、進歷史、Undo |
| 修改 | 左設備面板（H1／P1 留下的槽，**不是**舊 `InspectorSidebar`） | L2：源機器時多一個下拉，呼叫 action |
| 修改 | 面板內 L3 下拉元件 | 只吃 `materialOptions` props、只 emit `selectMaterial` |
| **10/18 必做** | 引擎讀取路徑（`useFlowEngine` 與／或 `toTopology` 接線） | 讓正式畫布上設的 `primaryOutput` 進引擎；範圍見 §4.1a |
| 唯讀 | `src/data/materials.ts` | `getAllMaterials`／`getMaterialForm` |
| **不碰** | 速率驗證、整包右側 D1 接線、`editorStore` 簽名 | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 10/11 | aaaaa 交 `setDevicePrimaryOutput` ＋ 測試（L1 先行）；定引擎讀取接法並寫進 PR |
| 10/18 | 左面板材料下拉；引擎能讀到正式畫布的 `primaryOutput`（B 的附帶義務） |
| 10/25 | **門檻：** 源設備能指定產出素材；正式頁或 `/dev` 可看到數字變化 |

## 7. 不做

- 不做速率輸入（用預設 30／min）
- 不做多產出（一個源點只產一種）
- 不做在畫布上直接顯示源點產出圖示
- 不做產品（非基礎材料）作為源產出
- **不**把整條「引擎接 layoutStore」一次做完——只做源素材讀取路徑

## 8. 依賴與封鎖

| 依賴 | 說明 |
|------|------|
| [B4](./B4_selection_inspector.md) | 設定 UI 掛在資訊面板上；本週 H1／P1 已放行管線／設備點選＋左面板 |
| ~~store 歸屬~~ | **已解除（2026-10-06）：採 B** |
| 引擎讀取切片 | 10/18 必做；未交則正式頁設了素材右側仍是零 |

## 9. DoD

- [ ] `setDevicePrimaryOutput` 存在於 `layoutStore` 路徑、進歷史、Undo 可還原
- [ ] 源機器的資訊面板出現材料下拉，非源機器不顯示
- [ ] 下拉選項依輸出埠 media 過濾（belt 只列 solid）
- [ ] 選定後 `PlacedDevice.primaryOutput` 正確寫入
- [ ] 引擎能讀到該欄位並重算（不需手動觸發）——**正式畫布路徑，不是只在 `/dev/flow-engine` preset**
- [ ] L3 面板不 import store 與 `src/data/*`
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| L2 直接 mutate device，繞過歷史與重算 | §4.1 決策；DoD 要求 Undo 可還原 |
| 引擎讀取切片拖過 10/18 | 與 action 同一人（aaaaa）主責；未交則門檻句「源能設素材」在正式頁無數字證據 |
| 材料清單過長難選 | 依 form 過濾已大幅縮減；必要時加搜尋，列加分 |
| 被要求順便做速率輸入 | §4.4 明寫界線 |
| 被要求順便做完整 D1 | §4.1a／§7 明寫只提前源素材讀取 |

**未交頂替：** 無。這是 11 月產耗數字的唯一起點，**不可丟棄**。若 L2 表單未完成，最低限度由 aaaaa 在 `/dev` 頁提供設定入口，讓 [D5](./D5_acceptance_rehearsal.md) 的驗收劇本仍能跑完，但這會讓「不開 `/dev` 也能做」的驗收前提失守，屬嚴重降級。

## 11. 開發日誌

### 2026-10-06
- **主編裁 R-1＝B**（[PR #59](https://github.com/dernoson/endfield-playground/pull/59)）：寫入 `layoutStore`／`PlacedDevice.primaryOutput`；引擎讀取端隨 10/18 提前一部分 D1 鏈
- action 更名為 `setDevicePrimaryOutput`；檔案計畫／DoD／週切片對齊正式畫布＋左面板（不再指向舊 Inspector／`editorStore`）
- 大綱 §9 R-C5 封鎖解除

### 2026-08-22
- 建檔。確認引擎側 `primaryOutput` 消費路徑已完備，缺口只在寫入 action 與 UI；依 form 過濾的決策為避免使用者踩 media mismatch
