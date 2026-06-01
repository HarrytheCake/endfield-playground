# V2 — 調度券與倉庫預估

**版本：** V2  
**建立日期：** 2026-05-22  
**狀態：** 規劃中  
**負責人：** aaaaa  
**對應 Todolist：** [todolist_v2.md](./todolist_v2.md)

---

## 1. 背景與動機

Phase 1 完成後，FlowEngine 已能正確計算每個品項的静態產能速率（個/min）。  
Phase 2 目標是將「静態速率」映射為玆以下兩種實用指標：

1. **調度券預估產出**：使用者自訂各品項的兑換率（個/min → 券/hr），計算當前產線每小時可累積多少券。
2. **倉庫填滿預估**：使用者輸入協議核心倉庫容量（格數），面板顯示各淨產出品項的填滿時間。

這兩项功能均為「純 UI 增強」：不修改 FlowEngine 核心演算法，只擴充 `flowStore` 狀態與 `ProductionStats.vue` UI。

---

## 2. 技術決策

### 2.1 使用者設定储存位置

| 方案 | 說明 | 優點 | 缺點 |
|------|------|------|------|
| **A — 放入 `flowStore`** | `ticketRates` / `warehouseCapacity` 與計算結果同在一個 store | 目前最簡單，反應式錐钸營自然購醫 | 囧將使用者偏好與計算結果混居 |
| B — 独立 `settingsStore` | 使用者偏好與流量結果分離 | 清晰責任分組 | 需新建 store，左右跟讀的依賴大幅增加 |
| C — `localStorage` 直接將倉庫 | 持久化但無响應式 | 跨會話保留設定 | 無法自動觸發 computed 更新 |

**✅ 決策：方案 A**

理由：
Phase 2 範圍小，大量新引入 store 不完全必要。方案 A 讓所有品項 computed（`ticketOutput`、`ticketTotal`、`warehouseEstimates`）能直接依賴既有的 `itemSummary`，程式碼最簡洁。
如需持久化，日後再將 `ticketRates` / `warehouseCapacity` 遷移至独立 store 配合 VueUse `useLocalStorage`。

---

### 2.2 Computed 經由 store 或 component 計算

| 方案 | 說明 | 優點 | 缺點 |
|------|------|------|------|
| **A — 在 `flowStore` 內以 `computed` 推導** | `ticketOutput`、`ticketTotal`、`warehouseEstimates` 均為 store-level computed | 可被其他元件共用；對應全域狀態管理原則 | 少量計算也放入 store ，導致 store 小幅膏漲 |
| B — 在 `ProductionStats.vue` 組件內以 local `computed` | 個別元件自行推導 | 封裝性佳 | 將來如需在其他面板顧示需重寫 |

**✅ 決策：方案 A**

理由：調度券概念屬於產線系統先層計算，未來有可能在 overlay、匯出等地方也需要，放入 store 更安全。

---

### 2.3 倉庫容量對比單位

| 展點 | 說明 |
|------|------|
| `warehouseCapacity` 單位 | 格（slot），暦設為 0（未設定） |
| `net` 單位 | 個/min |
| `fillTime` 計算 | `capacity / net` 得**分鐘**，顔示時轉為小時（÷ 60） |
| 特殊情況 | `net <= 0` 的品項不顯示（不適用填滿預估） |
| 未設定容量 | `warehouseCapacity <= 0` 時全區顯示設定提示，不顯示時間 |

---

## 3. 型別設計

### 3.1 `flowStore.ts` 新增 state

```typescript
// ─── 調度券設定（使用者可調） ────────────────────────────────────────
/**
 * 調度券兑換率，itemId → 券/hr per 個/min。
 * 由使用者在統計面板手動設定。
 * 未設定的品項不展示在調度券區塊。
 */
const ticketRates = ref(new Map<string, number>());

// ─── 倉庫設定（使用者可調） ────────────────────────────────────────────
/**
 * 倉庫容量（格數）。0 = 未設定。
 * 由使用者在統計面板手動輸入。
 */
const warehouseCapacity = ref(0);
```

### 3.2 `flowStore.ts` 新增 computed

```typescript
/**
 * 調度券元明細，itemId → 券/hr。
 * 只包含 net > 0 且已設定 ticketRate 的品項。
 */
const ticketOutput = computed(() => {
    const map = new Map<string, number>();
    for (const item of itemSummary.value) {
        const rate = ticketRates.value.get(item.itemId);
        if (rate && rate > 0 && item.net > 0) {
            map.set(item.itemId, item.net * rate);
        }
    }
    return map;
});

/** 調度券總產出（券/hr） */
const ticketTotal = computed(() =>
    [...ticketOutput.value.values()].reduce((sum, v) => sum + v, 0)
);

/**
 * 倉庫填滿預估，itemId → 小時數。
 * 只包含 net > 0 的品項；`warehouseCapacity <= 0` 時回傳空 Map。
 */
const warehouseEstimates = computed(() => {
    const map = new Map<string, number>();
    if (warehouseCapacity.value <= 0) return map;
    for (const item of itemSummary.value) {
        if (item.net > 0.001) {
            // fillTime(分) = capacity / net(個/min) → 轉小時 ÷ 60
            map.set(item.itemId, warehouseCapacity.value / item.net / 60);
        }
    }
    return map;
});
```

### 3.3 新增 Actions

```typescript
/**
 * 設定單一品項的調度券兑換率。
 * rate <= 0 時移除該品項設定（同等於未設定）。
 */
function setTicketRate(itemId: string, rate: number): void {
    if (rate > 0) {
        ticketRates.value.set(itemId, rate);
    } else {
        ticketRates.value.delete(itemId);
    }
}

/**
 * 設定倉庫容量（格數）。
 */
function setWarehouseCapacity(capacity: number): void {
    warehouseCapacity.value = Math.max(0, capacity);
}
```

---

## 4. 檔案修改計畫

| 檔案 | 狀態 | 變更內容 |
|------|------|----------|
| `src/store/flowStore.ts` | **修改** | 新增 `ticketRates`、`warehouseCapacity`、`ticketOutput`、`ticketTotal`、`warehouseEstimates`、`setTicketRate()`、`setWarehouseCapacity()`；`reset()` 不重置使用者設定 |
| `src/editor/stats/ProductionStats.vue` | **修改** | 新增調度券設定區塊、調度券預估展開區塊、倉庫設定區塊、倉庫預估展示區塊 |
| `src/types/flow.ts` | **不動** | 無需新型別（純層計算於 store / computed） |
| `src/composables/useFlowEngine.ts` | **不動** | 種计算完全由 store computed 自動推導 |
| `src/__tests__/flowEngine.test.ts` | **不動** | 新功能為純 UI 增強，不影響 FlowEngine 核心演算 |

---

## 5. 遷移說明

V2 為新增功能，不修改既有資料結構，無遷移需求。

`reset()` 維持現行行為：不重置 `ticketRates` 和 `warehouseCapacity`，
因為這兩項為使用者設定（非計算結果），應在整個會話外對畫布重置時保留。

---

## 6. 開發日誌

### 2026-05-22 — V2 規劃建立

- Phase 2 工項源自 `TODOLIST.md` Phase 2 節 I1–I7
- 拆分為 V2-A（Store 擴充）、V2-B（UI 擴充）、V2-C（品質驗證）三組
- 決定 ticketRates / warehouseCapacity 放入 flowStore，決定以 store-level computed 動態推導
- `reset()` 不重置使用者設定，與 Phase 1 行為一致
