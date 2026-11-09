# L1 契約實驗室怎麼用（簡易教學）

開始之前，先確認你已經照 [根目錄 README](../../README.md) 裝好環境，並在專案資料夾跑過 `pnpm i`。

這份教學對應工單 [W1026-A0](../../docs/work_dispatch/aaaaa/1026/W1026-A0_tutorial_lab_api.md) 的「tutorial 可跟做」：走完下面步驟，你就知道怎麼開 lab、各分頁看什麼、卡住讀哪份文件。

更長的串接說明見 [USAGE](../../docs/aaaaa/dev/USAGE_l1_contract_lab.md)；專有名詞與函式細節見 [LAB 指南](../../docs/work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md)。

---

## 1. 怎麼開

1. 在 terminal（專案根目錄）輸入：

    ```bash
    pnpm dev
    ```

2. 瀏覽器開 http://localhost:5173 （或 terminal 印出的位址）
3. 左側 Dev 導覽點 **「L1 契約實驗室」**  
   或直接開：http://localhost:5173/dev/l1-contract-lab
4. 想關掉：terminal 按 `Ctrl + C`

這頁是 **dev 專用 Hub**，不是遊戲正式畫面。正式佈局頁請從主站入口進（導覽／首頁那條正式編輯路徑）。

---

## 2. 各分頁看什麼

頁面上方一排按鈕，建議第一次照這個順序：

| 分頁 | 你會看到 | 什麼時候用 |
|------|----------|------------|
| **入門** | 5 步最短路徑＋維運規則摘要 | **先看這頁**；不懂怎麼開始就停在這 |
| **詞彙** | 專有名詞白話（熱區、錨點、拓樸…） | 文件／按鈕上的詞看不懂 |
| **目錄** | 長期 API 清單：已列／待列 | 想知道「還有哪些 API、有沒有點測」 |
| **總覽** | V14–V17 各一句＋常見誤用 | 快速對照版本主題 |
| **V14～V17** | 定義表（用途／誰呼叫／不要）＋**一鍵案例** | 真的呼叫 API，看下方 JSON |

一鍵案例會打**真實程式**。寫入類（例如 V16 的 store）走**獨立 Pinia**，不會改到你正式頁正在編的佈局。

---

## 3. 建議跟做順序（約 10 分鐘）

1. 開 lab → 預設多半在「入門」→ 把 5 步掃過一遍  
2. 開「詞彙」→ 找「埠熱區」「外側錨點」兩條  
3. 開「目錄」→ 確認 `hitTestPortAt`、`findPortAt` 旁邊是「已列」  
4. 開 **V15** → 依序點：
   - `hitTestPortAt prefer（緊貼）`
   - `findPortAt vs hitTestPortAt`
   - `resolveConnections（對齊／斷線）`
5. 開 **V16** → 點 `addPipeline／removePipeline（獨立 Pinia）`，看 JSON 裡有 `isolation`  
6. 若要對照正式頁能做什麼：依「入門」步驟開正式頁空白畫布即可（不必為了讀 lab 去改程式）

---

## 4. 卡住讀哪裡

| 情況 | 去哪 |
|------|------|
| 只想跟步驟、少讀碼 | 本檔；lab「入門」 |
| 要查「該呼叫誰、不要做什麼」 | [USAGE](../../docs/aaaaa/dev/USAGE_l1_contract_lab.md)、lab 各版定義表 |
| 要白話詞彙＋函式長說明 | [LAB 指南](../../docs/work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md) |
| 想改 lab 文案／目錄列 | `src/app/dev/l1ContractLab/contractCatalog.ts`（改碼請一併改 catalog） |

**互連：** lab 頁文案 ↔ USAGE ↔ LAB ↔ 本 tutorial。三者擇一當入口都可以，另一份當深讀。

---

## 5. 和正式頁的關係（一句）

| | Lab／本 tutorial | 正式頁 |
|--|------------------|--------|
| 用途 | 查契約、自測 API | 真的擺設備、拉管線 |
| 寫入 | 演示用獨立 Pinia | 共用的 layoutStore |
| 鎖檔 | 不碰 `LayoutView`／`GridCanvas` | toby 等正式互動域 |

不要在 lab 裡期待「完整遊戲 UI」；那是正式頁的事。
