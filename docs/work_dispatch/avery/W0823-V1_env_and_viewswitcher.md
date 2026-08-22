# W0823-V1｜avery｜環境跑通＋ViewSwitcher 單檔教學

| meta | value |
|------|-------|
| 週次 | 2026-08-23 → 2026-08-30 |
| 對應 | 對齊月「新 clone 能開」（支撐 [R-A3](../../roadmap/detail/A3_onboarding_onepager.md)）；元件為教學切片（非正式 CR-05） |
| 等級 | **加分項**（不擋 8/30） |
| 擋 8/30 門檻 | **否**（環境名單由 dernoson 記錄即可；元件未交不擋） |
| 性質 | 環境＋純展示元件（**同一週只這條學習線**；禁止一次掛多元件） |
| 預估時數 | 3–5h（平日晚上）；建議假日一次做完 |
| review_gate | dernoson（路徑／合入；可代搬檔） |
| mentor | **是**——本週 pair 名額預留你。**dernoson**＝環境／git／PR／合入（主窗口）；**toby** 可當環境同儕（他本機跑得起 dev，且做過 `ViewSwitcher` 上游的 `BaseRegionSelector`）——但他每週只有 2 小時，只問「裝不起來」這類短問題 |
| **逐步教學** | [GUIDE_env_setup_windows](./GUIDE_env_setup_windows.md)（Windows 從零安裝、錯誤對照表、ViewSwitcher 完整樣板） |
| 空窗預告 | **9/14–10/04 已排定不派工**；本週是空窗前最後完整學習週之一 |
| 狀態 | `[ ]` 未開始 |

---

## 0. 一句話

**先**讓電腦跑起專案並截圖證明；**若還有力氣**，只做一個按鈕元件放在指定路徑——不要用 `0811` 這種檔名、不要放在 `docs/avery/`。

本週分兩關：**V1-A 環境（必做）** → **V1-B 單元件（選做，A 過關才做）**。

---

## 1. 四欄工單

| 欄 | 內容 |
|----|------|
| **畫面** | A：瀏覽器打開本機開發頁（有模擬器介面即可）。B（選做）：兩個可點的視角切換鈕（文字即可，例如「工廠／流程」），點了有選中樣式 |
| **交哪個檔** | A：Discord 截圖＋一句「`pnpm dev` 成功」。B：`src/components/ViewSwitcher/Index.vue`（**唯一**元件檔；路徑一字不差） |
| **不要碰** | store／Pinia、畫布、管線、一次做 13 個元件、`docs/avery/` 當正式元件家、檔名加日期（`ViewToggleBtn.vue0811` 禁止）、GitHub 網頁 Upload |
| **卡住找誰** | **dernoson**（環境安裝、git、PR）。卡超過半天就問——這週就是來學流程的 |

---

## 2. 為何這樣切

| 依據 | 結論 |
|------|------|
| 環境先於元件 | 本機還沒跑起 `pnpm dev` → **環境是第一關**，否則後面元件無法自測 |
| 一次只練一件事 | 一顆鈕、一條路徑，寫死；本週不比進度，比「流程走對」 |
| 要避開的失敗模式 | 檔名當版本、放錯資料夾 → 本單明令禁止（見 §6） |
| 帶你的人 | mentor＝dernoson，工單全部改成可勾的 checklist，錯了會直接指出來 |
| 9/14 起空窗 | 本週把「會開專案＋會交一個正確路徑的檔」練完 |

---

## 3. 專有名詞（先讀）

| 詞 | 白話 | 本週怎麼用 |
|----|------|------------|
| **clone** | 把 GitHub 上的專案複製到你電腦 | V1-A 第一步 |
| **`pnpm install`** | 下載專案依賴套件 | 裝完才能跑 |
| **`pnpm dev`** | 啟動本機網站（開發模式） | 終端機會顯示一個 localhost 網址，用瀏覽器打開 |
| **L3** | 只負責「看起來怎樣」的元件 | 不准自己去改藍圖資料（store） |
| **props** | 別人傳進元件的資料 | B 關：例如目前選中哪個視角 |
| **emit** | 元件對外喊「使用者點了什麼」 | B 關：點按鈕就 emit，不要自己改全域狀態 |
| **branch／PR** | 分支＝你的作業草稿；PR＝請人檢查合併 | A 過關後若做 B，用 PR 或請 dernoson 代推 |
| **ViewSwitcher** | 「視角切換」那排按鈕的元件名 | 正式路徑在 `src/components/ViewSwitcher/`，**不是** `docs/avery/` |

---

## 4. V1-A｜環境跑通（必做）

### 4.1 檢查清單（依序勾）

- [ ] 電腦已裝 **Node.js 24**（見 repo 根目錄 `.nvmrc`）與 **pnpm 10+**
- [ ] 用 git clone（或 Cursor／VS Code 內建）取得本專案；**不要**只下載 ZIP 後永遠脫離 git（學流程會斷）
- [ ] 在專案根目錄執行：

```bash
pnpm install
pnpm dev
```

- [ ] 瀏覽器打開終端機顯示的網址（通常是 `http://localhost:5173` 一類）
- [ ] 能看到模擬器相關畫面（不必懂每一塊）
- [ ] Discord 丟：**截圖**＋文字「V1-A 完成」

### 4.2 裝不起來時

1. 把終端機**完整錯誤字**貼給 dernoson（不要只說「壞了」）  
2. 確認你是在**專案根目錄**（有 `package.json` 的那層）執行指令  
3. 不要改 `src/` 來「猜著修環境」

### 4.3 V1-A 的 DoD

- [ ] `pnpm dev` 成功的截圖已在 Discord  
- [ ] dernoson／aaaaa 能把你列入「跑得起 dev」名單（A3 會用到）

**A 沒過關 → 不要開始 B。**

---

## 5. V1-B｜單元件（選做；A 過關後）

目標：做一個**很笨但路徑正確**的切換鈕，練習 props／emit。  
**不是**做完整 CR-05 流程視角（roadmap 11/29 前不做）。

### 5.1 唯一路徑

```text
src/components/ViewSwitcher/Index.vue
```

禁止：

- `ViewToggleBtn.vue0810`、`ViewToggleBtn.vue0811`
- 放在 `docs/avery/`
- 一次交 PipelineEdge、PortDot、AlertList…

### 5.2 最小規格

```ts
const props = defineProps<{
  /** 目前選中的視角 id，例如 'factory' | 'flow' */
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
```

畫面上至少兩個按鈕（文案自訂，例如「工廠」「流程」）。  
樣式：**若 paper 本週交了頂欄 frame，可照著做**；沒有稿就用純文字按鈕，本週不比美觀。  
點按鈕 → `emit('update:modelValue', 'factory')` 或 `'flow'`。  
選中者用不同樣式（顏色／粗體即可）。

**禁止** `import` 任何 `@/store/...`。

範例結構可參考：`src/components/BaseRegionSelector/Index.vue`（也是 props／emit）。

### 5.3 怎麼交

1. 分支名建議：`dev/avery-viewswitcher`（不要在檔名寫日期）  
2. 開 PR，或 Discord 交檔請 dernoson 代放入正確路徑  
3. 若不會掛到畫面上：交元件檔即可；mentor 可代掛驗收

### 5.4 V1-B 的 DoD

- [ ] 檔在 `src/components/ViewSwitcher/Index.vue`
- [ ] 有 `modelValue`＋`update:modelValue`，無 store import  
- [ ] 無日期檔名、無 `docs/avery/` 當正式路徑  

---

## 6. 絕對不要做的事

1. 用新檔名當版本（`xxx0811.vue`）  
2. 元件放 repo 根目錄或 `docs/avery/`  
3. GitHub 網頁「Add file」上傳  
4. 一次做很多元件「覺得都會」  
5. 改 store、畫布、管線邏輯  
6. A 沒過就硬做 B  

---

## 7. 未交頂替

不擋 8/30。  
- A 未交：記在「跑不起 dev」名單，dernoson 下週再幫  
- B 未交：視角切換維持現狀；不影響門檻  

---

## 8. 回報與配對

| 時機 | 動作 |
|------|------|
| 開工 | Discord：「V1 開始裝環境」 |
| 裝到一半卡住 | 把錯誤**整段**貼給 dernoson（回覆可能要一兩天，所以錯誤訊息請當天就貼出來，等待才有意義） |
| A 完成 | 截圖＋「V1-A 完成」 |
| B 完成 | PR 或交檔 |
| 9/14 起 | 空窗期，**不會再派工**；本週盡量把 A 做完 |

---

## 9. 開發日誌（派工側）

### 2026-08-23

- 依「新 clone 能開」對齊目標正式派工：環境優先、單檔元件、禁日期檔名
- 兩關：環境必做 → ViewSwitcher 單檔選做
- 不擋 8/30；pair 名額預留
