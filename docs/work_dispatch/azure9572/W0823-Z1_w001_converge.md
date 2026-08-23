# W0823-Z1｜azure9572｜W001 草稿收斂為可 review 單 PR

| meta | value |
|------|-------|
| 週次 | 2026-08-23 → 2026-08-30 |
| 對應 roadmap | [R-D3](../../roadmap/detail/D3_recipe_alerts.md)（W001 加分項；規劃上**可假設你不交付**） |
| 編制 | **不在** roadmap v0.2 九人編制內；本單＝續留草稿收斂，**非**主線 Owner |
| 等級 | **加分項**（不擋 8/30） |
| 擋 8/30 門檻 | **否** |
| 性質 | 純函式／測試收斂（**本週只做這一種**） |
| 預估時數 | **≤2h**；一週一塊 |
| review_gate | dernoson（測例是否真懂、禁 AI 大檔、禁合進平行舊型別） |
| mentor | 型別／測例判讀可問 dernoson 或 aaaaa；**不占**本週 pair 名額 |
| 衝突 | 本週 **shirone 做 E001**——你**只碰 W001**，不要改 E001／不要開新 ID |
| **先讀** | [GUIDE_w001_cherry_pick](./GUIDE_w001_cherry_pick.md)（草稿現況已代查＋撿檔指令） |
| 前提 | 本單**以你確認續留為前提**，是「續留才做」的加分切片；若你已決定不續留，回一句即可，不需要交任何東西 |
| 狀態 | `[ ]` 未開始 |

---

## 0. 一句話

把分支 `dev/azure9572` 上的 **`W001_unmatchedMaterial`** 收成**一份**對得上官方 `Detector` 契約、測例能跑、可以給人 review 的 PR——**不要**順便做 E004／E005／W002／W003，**不要**碰 Vue／store／CR-05。

已代為確認：草稿**已經**用官方 `Detector`／`ValidationContext`，也沒有 Vue／Pinia 依賴，所以這週是**搬家＋補型別**，不是重寫。

若本週完全沒時間：Discord 回「本週不做／可能退出」即可，草稿留在分支給 shirone／aaaaa 撿——**不計失敗、不擋任何門檻**。

---

## 1. 四欄工單

| 欄 | 內容 |
|----|------|
| **畫面** | （本週無 UI）測例：材料組合對不上配方 → 有 `code: 'W001'` 的 alert；對得上 → 空陣列 |
| **交哪個檔** | `src/lib/validation/detectors/W001_unmatchedMaterial.ts`；`src/__tests__/lib/validation/detectors/W001_unmatchedMaterial.test.ts`。可刪或移出正式樹：`src/types/validation_OLD.ts`（勿再被正式碼 import） |
| **不要碰** | E001（shirone）、E004／E005／W002／W003 本週擴寫、`register`／UI、store、Vue、FlowChart／CR-05、自創新 error code |
| **卡住找誰** | dernoson（PR／契約）；配方匹配語意問 aaaaa。**週中會有人問一句進度**（是流程，不是催稿） |

---

## 2. 為何是你、範圍怎麼切

| 依據 | 結論 |
|------|------|
| 不排主線 | 你去留未定，因此本單交付一律當「可撿草稿」處理，不成為任何人的前置 |
| 草稿現況 | W001 全在 `dev/azure9572`，**未合 master** → 本週是搬家，不是重寫 |
| 本週可用時間 ≤2h | 只收斂 **W001 一個** ID |
| 與 shirone 分工 | 同域不同 ID：你本週＝W001；他＝E001 |
| 本週不做 | CR-05、store、Vue、固定時段開會 |
| D3 規劃 | W001 為加分；未交由 shirone／aaaaa 從你的分支挑檔 |

---

## 3. 名詞（對齊官方契約）

| 詞 | 意思 | 你要對齊的 |
|----|------|------------|
| **`Detector`** | `{ code, level, run(ctx) }` | 見 `src/types/validation.ts`（**現行**，不是 `validation_OLD.ts`） |
| **`ValidationContext`** | `devices`／`connections`／`getDef`／`baseRegion` | `run` 只讀這些 |
| **`Alert`** | `uid`／`level`／`code`／`message`／`relatedDeviceUids`… | `code` 必須是 `'W001'` |
| **W001** | 有輸入，但品項集合對不上任何配方 | 語意見 D3；細節可對照你寫的 `docs/azure9572/W001_do.md` |
| **收斂** | 草稿 → 單一 PR、可 merge 的形狀 | 去掉 Unconfirmed 散彈；一個 detector 一個 PR |

---

## 4. 開工前檢查

- [ ] Discord **先報**：「Z1 我要收斂 `W001_unmatchedMaterial.ts`＋其 test」  
- [ ] 確認遠端分支：`origin/dev/azure9572` 上已有 W001 檔  
- [ ] 在**當前主線**對照 `src/types/validation.ts` 的 `Detector`（若你分支上的型別過舊，以主線為準 rebase／cherry-pick）  
- [ ] 本週**不要**打開去改 shirone 的 E001 路徑  
- [ ] 若本週 0 工時：直接回「暫停／退出意向」→ 本單關閉  

---

## 5. 步驟（塞進 ≤2h）

### 5.1 收斂 W001

1. 以主線為底開 PR 分支（例如從最新 master／main 開 `dev/azure9572-w001`），只帶入 W001 兩個檔  
2. 確認匯出物件符合現行 `Detector`：`code: 'W001'`，`run(ctx)` 回 `Alert[]`  
3. **禁止** import Vue／Pinia／`validation_OLD`  
4. 測例至少：對不上 → 有 W001；對得上或無輸入邊 → 行為符合你 `W001_do.md` 的定義（寫進 PR 說明）  
5. 跑：`pnpm type-check`／`lint-check`／`format-check`／`test`  

### 5.2 清理

- `validation_OLD.ts`：**主線目前沒有這個檔**（只在 `dev/azure9572` 上）→ 撿檔時不要帶過來就好，不必另開清理動作
- 配方資料從 `getRecipesForMachine()`（`@/data/products`）取得，**不是**從 `ctx`；你的草稿本來就這樣寫，維持即可  
- **不要**把 E004／E005／W002／W003 塞進同一 PR（review 負擔與退出移交都會爆）  

### 5.3 開 PR

- 標題示例：`feat(validation): converge W001 unmatched material detector`  
- 描述必寫：  
  1. 做了什麼／怎麼測  
  2. **未**含其他 detector  
  3. 若你可能退出：註明「草稿可移交 shirone／aaaaa」  
- 自己**不要**強行 merge master；等 dernoson review  

---

## 6. DoD

- [ ] 開工前已報檔名（或已回暫停）  
- [ ] 單一 PR 只含 W001＋test（不夾帶其他 detector 與 `validation_OLD`）  
- [ ] 符合現行 `Detector`；無 Vue／Pinia／OLD 型別依賴  
- [ ] 檢查腳本通過  
- [ ] PR 可被 dernoson review（即使最後不合入，形狀也要可撿）  

---

## 7. 未交頂替／退出預案

| 情況 | 處理 |
|------|------|
| 本週未交 | **不擋 8/30**；W001 仍為加分；草稿留 `dev/azure9572` |
| 宣布退出或長期無回音 | shirone 或 aaaaa 從分支挑 W001；E004／E005 另排（見 D3） |
| 主編裁示不續留 | 同退出預案；本單不再重開 |

---

## 8. 回報

| 時機 | 動作 |
|------|------|
| 開工前 | 報檔名或「暫停」 |
| 週中 | **會被問一句**；請回「PR 連結／卡住／不做了／可能退出」之一（一句即可） |
| 完成 | PR @ dernoson |

---

## 9. 開發日誌（派工側）

### 2026-08-23

- 依 D3 的 W001 收斂切片正式派工：≤2h、草稿未合主線、以續留為前提
- 與 shirone E001 分 ID；不排主線；不擋門檻
- 退出預案寫死
