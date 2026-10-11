# R-D3 — 配方類警訊（E004／E005／W001）

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §6 |
| 里程碑 | M4（2026-11-29）；**純函式段提前至 2026-10-04 週**，上右側仍 11/15 |
| 擋門檻 | 否（加分；主編步驟 9 要求「至少兩類」，實務上一類即可過關） |
| 建議主責／備援 | **azure9572**（2026-10-04 會議點名本人收斂）／備援 aaaaa |
| 性質 | 純函式 |
| 依賴 | [D2](./D2_e001_overlap_alert.md)（registry） |
| 狀態 | `[~]` 部分解鎖（W001 已合入 master；E004／E005 派工中＝[W1004-Z1](../../work_dispatch/azure9572/1004/W1004-Z1_recipe_alerts_new_model.md)；右側未接） |
| 最後更新 | **2026-10-06** |

---

## 1. 背景與動機

主編步驟 9 要求「配方／缺輸入輸出 → 右側警訊」，至少涵蓋「缺輸入或輸出」與「材料組合對不上」兩類。這兩類的草稿散在 shirone 與 azure9572 的分支上，ID 分別是 E004／E005（缺 IO）與 W001（材料未匹配）——**同一個領域，兩個人，不同 ID，都未合入 master**。

因此本項的第一件事不是寫程式，是**裁決**：哪些 ID 保留、由誰維護、既有草稿要不要撿。這件事拖越久成本越高，因為兩邊都在各自的分支上長。

azure9572 目前的可投入時間有限、去留未定，因此本項在規劃上**假設他不會交付**，把他分支上的內容視為「可撿的草稿」而非「等待中的交付」。這不是對個人的評價，而是讓 D3 不會因為單一分支而卡住。

## 2. 使用者看得到什麼

拆掉一台加工機必要的輸入管線，右側出現「缺少輸入」之類的訊息；把不對的材料接進去，右側出現「材料組合與配方不符」。

## 3. 現況盤點

| 對象 | 位置 | 現況 |
|------|------|------|
| E004／E005 草稿 | `origin/dev/azure9572`（未刪） | **仍未合入 master**；訊息標 Unconfirmed |
| W001 | `src/lib/validation/detectors/W001_unmatchedMaterial.ts` | **已合入 master**（PR #35，2026-08-30；azure 生涯首筆） |
| shirone detector 實績 | E001 及相關測試 | 已合入；本人要求轉調，後續非本項主責 |
| 引擎側判定 | `matchRecipeByInputs`、`matchRecipeByEdgeCandidates`（`useFlowEngine.ts`） | **已完整**（V9） |
| registry | 使用端顯式註冊（見 [D2](./D2_e001_overlap_alert.md)） | `/dev/validation-test` 已示範；主畫布集中入口待 11/01 |

## 4. 技術決策

### 4.1 ID 裁決表——**已凍結（主編 2026-10-06 同意，PR #59 R-2）**

| 現象 | ID | level | 維護者 |
|------|-----|-------|--------|
| 設備缺少必要輸入連接 | `E004` | error | **azure9572** |
| 設備缺少輸出連接 | `E005` | error | **azure9572** |
| 接進來的材料組合對不上任何配方 | `W001` | warning | **azure9572** |

**同一現象只能有一個 ID。** shirone 已轉調 L3 樣式，不再是本項維護者。

**本輪不收 W002／W003。** `dev/azure9572` 上另有 `W002_insufficientInput`／`W003_outputCongested` 與一份平行型別樹 `validation_OLD.ts`——**都不進樹**，待三支穩定並上右側後再談（凍結理由：同域一次只收斂一組 ID，否則右側會先長出一堆未裁決的訊息）。

### 4.2 方案比較：警訊判定的資料來源

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. detector 自己重算配方匹配 | 在純函式內重跑一次匹配 | 與引擎解耦 | **與 `matchRecipeByInputs` 兩套邏輯，必然分歧** | 否 |
| B. detector 讀 `flowStore` 結果 | 看引擎算出的 efficiency=0 就報錯 | 一套邏輯 | detector 不得 import Pinia；且引擎與驗證的執行順序是「先驗證再引擎」 | 否 |
| **C. 抽共用純函式，兩邊都呼叫** | 把 `matchRecipeByInputs` 的核心抽成不依賴引擎狀態的純函式，detector 與引擎共用 | 一套邏輯；符合 detector 純函式規則 | 需一次小重構 | **是** |

採 C。這是本項唯一的技術風險點：抽函式屬於 `useFlowEngine.ts` 的改動，是 CR-04 主責，由 aaaaa 執行，最遲 11/8 交付，讓 shirone 有一週時間接。

### 4.3 判定細則

| ID | 判定 |
|----|------|
| E004 | 該機的目前 mode 存在需要輸入的配方，但沒有任何輸入邊 |
| E005 | 該機有產出但沒有任何輸出邊 |
| W001 | 有輸入邊，但輸入品項集合不吻合任何一條配方（沿用 V9「輸入種類集合完全吻合」語意） |

源類機器（基礎材料輸出點）不套用 E004；匯出點不套用 E005。

### 4.4 範圍收斂：至少一類

主編要求「至少兩類」，但考量 azure 風險最高、shirone 每週一個 detector 的節奏，規劃上**只把一類列為必須**（建議 E004／E005 這組，因為判定最單純且不需等 §4.2 的抽函式），W001 列為加分。若 11/15 兩類都上，加分；只上一類，門檻仍成立。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/lib/validation/detectors/E004_missingInput.ts`、`E005_missingOutput.ts` | shirone |
| 新建或撿取 | `src/lib/validation/detectors/W001_unmatchedMaterial.ts` | 自 azure 分支收斂，**不開新 ID** |
| 新建 | 對應 `src/__tests__/lib/validation/detectors/*.test.ts` | 一 detector 一測試檔 |
| 修改 | `src/lib/validation/registry.ts` | 註冊新 detector |
| 修改 | `src/composables/useFlowEngine.ts` | **aaaaa**：抽出共用配方匹配純函式（§4.2） |
| **不碰** | `validation_OLD.ts` 之類的舊平行樹；不新增未列入的 detector ID | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| **10/11** | **（提前）** ID 表凍結；azure 交 E004（＋E005、W001 修正）進 master，接 `/dev/validation-test`＝[W1004-Z1](../../work_dispatch/azure9572/1004/W1004-Z1_recipe_alerts_new_model.md) |
| 11/08 | aaaaa 交共用配方匹配純函式（§4.2 方案 C） |
| 11/15 | **缺輸入或輸出至少一類上右側**（純函式已在，本週只剩接右側） |
| 11/22 | W001 上右側（加分） |
| 11/29 | 門檻回顧 |

**為什麼提前：** 9/27 連假整週空白，10 月要維持 M3 日期；本項是**唯一既不擋門檻、又不與換殼／連線鏈共檔**的工項，提前做等於把 11 月的量先搬走。見 [大綱 §8.1](../ROADMAP_OUTLINE.md)。

## 7. 不做

- 不開列表外的新 detector ID
- 不做警訊的自動修正建議
- 不做電力不足警示（主編藍圈，不當門檻）
- 不擴充 `validation_OLD.ts` 或任何平行驗證樹
- detector 不 import Vue／Pinia

## 8. 依賴與封鎖

| 項目 | 狀態 |
|------|------|
| azure 續留裁示 | **仍未裁示**；惟 W001 已不必等裁示即可用 |
| E004／E005 | 仍在舊分支；是否撿檔待 11/1 前決定 |
| registry | 由 [D2](./D2_e001_overlap_alert.md) 建立，11/1 前完成 |
| 共用配方匹配純函式 | aaaaa，11/8 |
| ID 表凍結 | **已做（2026-10-06）**——主編同意 §4.1 三支；W002／W003 不收 |

封鎖解除條件（更新）：~~主編裁示完成 ＋~~ ~~ID 表凍結＋~~ 至少一類上右側。W001 合入使「零草稿可撿」風險下降；ID 表已凍結，剩純函式進 master（Z1）與上右側。

## 9. DoD

- [x] ID 表已凍結，每個現象只有一個 ID —— **2026-10-06 主編同意**
- [ ] 至少一類（建議 E004／E005）在右側顯示可懂訊息 —— **W001 純函式已在**；右側未接
- [ ] 拆掉必要輸入管線後訊息出現，接回後消失
- [ ] 配方匹配邏輯與 `useFlowEngine` 共用同一純函式（code review 確認無複製）
- [x] 每個 detector 有對應測試檔且通過 —— **W001 測試已合入**（+214）；E004／E005 尚無
- [x] detector 不 import Vue／Pinia（W001 已確認）
- [x] 無 AI 生成的暫存大檔進入正式樹（W001 收斂 PR 乾淨）

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| azure 退出，草稿無人收 | **W001 已進 master**；E004／E005 仍可能需 aaaaa 從 `dev/azure9572` 挑檔 |
| 兩套配方匹配邏輯分歧 | §4.2 抽共用純函式；DoD 列入 review |
| shirone 轉調後無人收斂 ID | 改由 aaaaa 維護代碼表；11/15 前至少凍結 W001＋一類缺 IO |
| 舊平行驗證樹復活 | 工單明寫不得擴充 |

**未交頂替：** 11/29 門檻句要求「缺 IO／配方不符在右側有字」。若一類都未完成，[D5](./D5_acceptance_rehearsal.md) 驗收劇本第 6 步失守——這是本項雖列「加分」卻仍需在 11/15 前見到成果的原因。屆時由 aaaaa 以最簡形態（只判「有無輸入邊」）補上。

## 11. 開發日誌

### 2026-08-22
- 建檔。規劃上假設 azure 不交付；共用配方匹配純函式列為 aaaaa 的前置交付，避免 detector 與引擎各寫一套

### 2026-08-30
- W0823-Z1 合入 PR #35：`W001_unmatchedMaterial.ts`＋測試進 master（azure 生涯首次合入）
- **狀態由 `[!]` 改 `[~]`。** 大綱 §9 移除本項全封鎖列
- E004／E005 仍停在 `dev/azure9572`；ID 表與右側列表仍為殘項；接手人預設 aaaaa（shirone 轉調）

### 2026-10-06
- **10/04 會議點名 azure9572 本人收斂三支**，§4.1 維護者由 shirone 改為 azure；W002／W003 明確不收
- **主編同意 R-2（[PR #59](https://github.com/dernoson/endfield-playground/pull/59)）：ID 表凍結為 E004／E005／W001**
- **純函式段由 11 月提前到 10/04 週**（§6 切片表改寫），理由見 §6 末；上右側仍 11/15
- 本期新增一條要修的事實：W001 現行 `recipe.inputs.every(...)` 是**子集**判定，與 §4.3「輸入種類集合完全吻合」不符——多餘材料不會被報出來。另 E004 一直不在 master，導致「完全沒接線的機器」目前零訊息（W001 在無入邊時 `continue` 讓給 E004）
- 工單：[W1004-Z1](../../work_dispatch/azure9572/1004/W1004-Z1_recipe_alerts_new_model.md)。約束：用 master 現行 `Detector`／`ValidationContext`，**不帶 `validation_OLD.ts`、不改 `ValidationContext` 欄位、不接 `layoutStore`**
