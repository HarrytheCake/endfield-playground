# R-C5 — 源節點素材設定

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §5 |
| 里程碑 | M3（2026-10-25） |
| 擋門檻 | **是**（主編步驟 6；且 11 月產耗數字的唯一起點） |
| 建議主責／備援 | aaaaa（L1 action）＋L2（表單接線）／aaaaa 全包 |
| 性質 | 接線 |
| 依賴 | [B4](./B4_selection_inspector.md) |
| 狀態 | `[ ]` 未開始 |
| 最後更新 | 2026-08-22 |

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
| 節點欄位 | `FactoryNode.data.primaryOutput`，`src/types/graph.ts` | 型別已有 |
| 引擎消費 | `useFlowEngine` 建圖時讀 `primaryOutput` ＋ `sourceRatePerMin` | 已有 |
| 源機器 | 「基礎材料輸出點」（V9 新建） | 資料已有 |
| 材料清單 | `getAllMaterials()`、`getMaterialForm`、`getMaterialPortMedia` | 已有 |
| 預設速率 | 30／min（引擎預設） | 已有 |
| **寫入 action** | — | **不存在**，本項要補 |
| 設定 UI | — | **不存在**，本項要補 |

## 4. 技術決策

### 4.1 誰負責寫入（關鍵決策）

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. L2 直接改 `node.data.primaryOutput` | 容器 mutate | 最快 | 違反「唯一寫入點」；不進歷史；改完引擎可能不重算 | 否 |
| B. 塞進 `placeDevice` 的參數 | 放下時就決定 | 一個 action | 放下後改不了；使用者必須先想好 | 否 |
| **C. 新增 L1 高階 action `setNodePrimaryOutput(uid, itemId, ratePerMin?)`** | 專屬 action，進歷史 | 符合唯一寫入點；可 Undo；引擎自動重算 | 需 CR-01 同意新增 action | **是** |

採 C。這是 ROADMAP §2.1 明列的「L1 只在沒有寫源素材的 action 時補欄位」的具體落實。

### 4.2 型別設計

```typescript
/**
 * 設定源節點的主要產出物與速率。
 * 進歷史；引擎在 editorStore 變更後自動重算。
 */
function setNodePrimaryOutput(
  uid: string,
  /** 基礎材料 id；傳 null 表示清除設定 */
  itemId: string | null,
  /** 每分鐘產出；省略時沿用預設 30 */
  ratePerMin?: number,
): void
```

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
| 修改 | `src/store/editorStore.ts` | 新增 `setNodePrimaryOutput`（**aaaaa**；須 CR-01 同意） |
| 新建 | `src/__tests__/store/setNodePrimaryOutput.test.ts` | 設定、清除、進歷史、Undo |
| 修改 | `src/editor/inspector/InspectorSidebar.vue` | L2：源機器時多一個下拉，emit 後呼叫 action |
| 修改 | `src/editor/inspector/InspectorPanel.vue` | L3：只吃 `materialOptions` props、只 emit `selectMaterial` |
| 唯讀 | `src/data/materials.ts` | `getAllMaterials`／`getMaterialForm` |
| **不碰** | `useFlowEngine`、速率驗證、`sourceRatePerMin` 預設值 | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 10/11 | aaaaa 交 `setNodePrimaryOutput` ＋ 測試（L1 先行） |
| 10/18 | 資訊面板出現材料下拉；選了會寫進 node |
| 10/25 | **門檻：** 源設備能指定產出素材；`/dev/flow-engine` 或右側可看到數字變化 |

## 7. 不做

- 不做速率輸入（用預設 30／min）
- 不做多產出（一個源點只產一種）
- 不做在畫布上直接顯示源點產出圖示
- 不做產品（非基礎材料）作為源產出

## 8. 依賴與封鎖

| 依賴 | 說明 |
|------|------|
| [B4](./B4_selection_inspector.md) | 設定 UI 掛在資訊面板上，需先有面板 |
| CR-01 同意新增 action | `editorStore` 屬 CR-01 主責；最遲 10/4 提出 |

## 9. DoD

- [ ] `setNodePrimaryOutput` 存在、進歷史、Undo 可還原
- [ ] 源機器的資訊面板出現材料下拉，非源機器不顯示
- [ ] 下拉選項依輸出埠 media 過濾（belt 只列 solid）
- [ ] 選定後 `FactoryNode.data.primaryOutput` 正確寫入
- [ ] 引擎在設定後自動重算（不需手動觸發）
- [ ] L3 面板不 import store 與 `src/data/*`
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| L2 直接 mutate node，繞過歷史與重算 | §4.1 決策；DoD 要求 Undo 可還原（能還原即證明走了 action） |
| 新增 action 需跨 CR 協商而延誤 | 10/4 前提出；action 簽名簡單，協商成本低 |
| 材料清單過長難選 | 依 form 過濾已大幅縮減；必要時加搜尋，列加分 |
| 被要求順便做速率輸入 | §4.4 明寫界線 |

**未交頂替：** 無。這是 11 月產耗數字的唯一起點，**不可丟棄**。若 L2 表單未完成，最低限度由 aaaaa 在 `/dev` 頁提供設定入口，讓 [D5](./D5_acceptance_rehearsal.md) 的驗收劇本仍能跑完（劇本第 3 步需要設定源素材），但這會讓「不開 `/dev` 也能做」的驗收前提失守，屬嚴重降級。

## 11. 開發日誌

### 2026-08-22
- 建檔。確認引擎側 `primaryOutput` 消費路徑已完備，缺口只在寫入 action 與 UI；依 form 過濾的決策為避免使用者踩 media mismatch
