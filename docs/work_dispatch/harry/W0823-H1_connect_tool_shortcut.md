# W0823-H1｜harry｜P 鍵／Navbar 切換管線工具（connect）

| meta | value |
|------|-------|
| 週次 | 2026-08-23 → 2026-08-30 |
| 對應 | CR-02「管線模式切換」切片；為 [R-C1](../../roadmap/detail/C1_port_hit_and_draft.md) 預留工具態（本週**只做切換**，不畫管線） |
| 等級 | **確定**（加分項；**不**列門檻必要） |
| 擋 8/30 門檻 | **否** |
| 性質 | 接線／快捷鍵（**本週只做這一種**） |
| 預估時數 | 一次坐下能收尾的**一整塊**（刻意不切碎）；本週沒空檔則可不交 |
| review_gate | dernoson（邏輯必查；禁改 store action） |
| mentor | **非同步優先**（短語音／Discord）；不占本週 pair 名額（toby 已占 1） |
| 檔案鎖 | **禁止**改 `FactoryCanvas.vue`、`FlowNodeOverlay.vue`（toby／W0823-T1） |
| **先讀** | [GUIDE_shortcut_conflicts](./GUIDE_shortcut_conflicts.md)（既有 Space 處理會把 connect 打回 select，需先決定處理方式） |
| 狀態 | `[ ]` 未開始 |

---

## 0. 一句話

按 **P**（或點 Navbar「管線」）把 `activeTool` 切成 `'connect'`；再按一次 P 或點「選取」回到 `'select'`。本週**不**實作拉管線、不改畫布檔。

---

## 1. 四欄工單

| 欄 | 內容 |
|----|------|
| **畫面** | Navbar 多一個「管線」工具鈕（與選取／移動並列）；按 P 後該鈕呈選中態（或 `activeTool === 'connect'` 可在 UI 看出）；再切回選取 |
| **交哪個檔** | `src/composables/useShortcuts.ts`；`src/editor/navbar/Navbar.vue`。可附短 PLAN：`docs/harry/PLAN_connectTool.md`（你習慣先寫 PLAN——保留） |
| **不要碰** | `FactoryCanvas.vue`、`FlowNodeOverlay.vue`、新增／修改任何 Pinia action 簽名、左側 Info 面板映射、純函式測試、自組 Command |
| **卡住找誰** | dernoson（快捷鍵／合入）；工具態與後續連線規格：aaaaa。**你主動說即可，不會另外催你** |

---

## 2. 為何是你、範圍怎麼切

| 依據 | 結論 |
|------|------|
| 本週可做 | 現有頁面接事件／快捷鍵 |
| 既有實績 | 你已做過 `useShortcuts`（Ctrl+R）＋ PLAN，模式熟悉；本單就是同一形狀 |
| 本週不做 | 改 store action、左側面板映射、當 Owner |
| 與 toby | 同週不同檔：你改 shortcuts＋Navbar；他改 overlay／canvas |
| 同步方式 | **不要求**出席週日會；書面工單＋Discord 即可 |
| 一塊做完為止 | 本單刻意給一整塊；若時間還夠，見 §5.4 選做第二塊（仍禁止碰 canvas） |

**本週不做：** port 點擊、draft 彎折、`addConnection` 新邏輯（你已有 MVP 可先不動）、框選、clipboard。

---

## 3. 名詞（L2：本週會碰到的）

| 詞 | 意思 | 你要做的 |
|----|------|----------|
| **`ToolMode`** | 字串聯合型別：`'select' \| 'pan' \| 'connect' \| 'box-select'`（見 `src/types/editor.ts`） | 管線模式用現成的 **`'connect'`**，**不要**自創 `'pipeline'` 字串 |
| **`setActiveTool(tool)`** | editorStore 已有的高階／UI action，切換目前工具 | **只呼叫**，不修改函式本體 |
| **`useShortcuts`** | 全域快捷鍵 composable（L2），在 `App.vue` 已掛上 | 在這裡加 P 鍵，比照 Ctrl+Z／Space 的寫法 |
| **`useMagicKeys`／`useEventListener`** | VueUse：聽鍵盤 | P 用 keydown 即可；注意別跟輸入框搶鍵（可選：若 focus 在 input 則忽略——時間夠再做） |
| **Navbar** | 頂列 L2：已有選取／移動按鈕 | 加一顆「管線」，`id: 'connect'` |

---

## 4. 開工前檢查

- [ ] 讀 `src/types/editor.ts` 確認 `ToolMode` 含 `'connect'`
- [ ] 讀 `useShortcuts.ts`（你寫過的 Ctrl+R 仍在）與 `Navbar.vue` 的 `tools` 陣列
- [ ] **不要**打開去改 `FactoryCanvas.vue`／`FlowNodeOverlay.vue`
- [ ] （建議）先寫 10–20 行 `docs/harry/PLAN_connectTool.md`：要改兩檔、驗收方式、不做清單——然後再動 code
- [ ] 本機 `pnpm dev` 可跑

---

## 5. 步驟

### 5.1 Navbar

在 `tools` 陣列加入例如：`{ id: 'connect', label: '管線' }`（文案可改「連線」；與 roadmap「管線工具」一致即可）。  
點擊仍走既有 `@click="editorStore.setActiveTool(tool.id)"`——**不必新寫 action**。

### 5.2 P 鍵（`useShortcuts.ts`）

建議行為（寫進 PLAN，擇一後實作）：

| 方案 | 行為 | 建議 |
|------|------|------|
| **A. 切換** | P → 若目前不是 connect 則 `setActiveTool('connect')`，否則回 `'select'` | **採用**（一塊內可收尾） |
| B. 只進入 | P 永遠進 connect，回選取只靠 Navbar | 亦可，但較不直覺 |

實作注意：

- 更新檔案頂部 JSDoc 快捷鍵清單，寫上 **P：管線（connect）**
- **不要**修改 `editorStore.ts` 裡任何 function 內容
- **Space 反向衝突**：現有 keyup 一律 `setActiveTool('select')`，會把你切好的 connect 打回選取。擇一：同檔記住前一個工具再還原（建議，約 5 行），或本週不處理但在 PLAN／PR 寫明。做法見 [GUIDE](./GUIDE_shortcut_conflicts.md) §2

### 5.3 驗證

1. `pnpm type-check`／`lint-check`／`format-check`／`test`（你的習慣序）
2. `pnpm dev`：按 P → Navbar「管線」呈選中；再按 P 或點「選取」→ 回來
3. **本週不要求**真的能拉出管線（那是 C1／後續）；只要工具態切對

### 5.4 選做第二塊（僅當第一塊已合入／可演示且動力窗口還在）

| 選做 | 檔 | 說明 |
|------|-----|------|
| H1b | `Navbar.vue` only | 加「重置畫布」按鈕，呼叫既有 `triggerResetCanvas()`（你已 export） |

仍**禁止**改 canvas／overlay／store action。做不完不算失敗。

---

## 6. DoD

- [ ] Navbar 可見「管線／連線」工具，點了 `activeTool === 'connect'`
- [ ] P 鍵可進入（或切換）connect；能回到 select
- [ ] 只改 `useShortcuts.ts`＋`Navbar.vue`（＋可選 PLAN md）
- [ ] **未**改 `FactoryCanvas.vue`／`FlowNodeOverlay.vue`／store action
- [ ] 檢查腳本通過；PR 或 `dev/cake` 說明含操作步驟
- [ ] （若有 PLAN）範圍與「不做拉管線」寫清楚

---

## 7. 未交頂替

不擋 8/30。未交 → 使用者仍可用滑鼠點「選取／移動」；管線工具延後。  
本週沒空也**不必道歉刷存在感**——說一句就好。

---

## 8. 回報

| 時機 | 動作 |
|------|------|
| 開工 | Discord 一句「開始 H1／connect」即可（有寫 PLAN 就不必再另外報檔名） |
| 卡住 | 主動說；可約短語音（非同步也可） |
| 完成 | PR／分支＋兩步操作說明 |
| 週日會 | **可不出席**；不影響本單是否算交付 |

---

## 9. 開發日誌（派工側）

### 2026-08-23

- 依 CR-02 管線模式切換切片正式派工；避開 toby 本週的 canvas 檔案鎖
- 工具態使用既有 `ToolMode='connect'`，不擴型別、不改 L1
- 不擋 8/30；不強制開會
