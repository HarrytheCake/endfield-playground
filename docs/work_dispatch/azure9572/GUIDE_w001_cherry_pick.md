# 操作指南｜azure9572｜把 W001 從舊分支撿到新 PR（W0823-Z1 專用）

| meta | value |
|------|-------|
| 對應工單 | [W0823-Z1](./W0823-Z1_w001_converge.md) |
| 目標時間 | ≤2h；本週忙就回一句「暫停」結案，草稿留分支給人撿 |
| 已幫你確認的事 | 見 §1，可省掉自己翻分支 |

---

## 1. 你的草稿現況（已代為確認）

| 項 | 結論 |
|----|------|
| 檔案位置 | `origin/dev/azure9572` 上的 `src/lib/validation/detectors/W001_unmatchedMaterial.ts` 與 `src/__tests__/lib/validation/detectors/W001_unmatchedMaterial.test.ts` |
| 契約 | 草稿**已經**用官方 `Detector`／`ValidationContext`／`Alert`（`@/types/validation`），不必重寫 |
| 依賴 | 只 import `@/data/machines`、`@/data/products`、`@/types/machine` → **沒有** Vue／Pinia，符合純函式規則 |
| `validation_OLD.ts` | 只存在於你的分支，**主線沒有** → 撿檔時不要帶過去，工單那條「刪 OLD」在主線是空操作 |
| 配方從哪來 | `getRecipesForMachine(machineType)`（`@/data/products`），**不是**從 `ctx` 拿——`ValidationContext` 只有 `devices`／`connections`／`getDef`／`baseRegion` |

也就是說：本週不是重寫，是**搬家＋補型別＋補測試說明**。

---

## 2. 撿檔（不要 merge 整條分支）

```powershell
git fetch origin
git checkout master
git pull
git checkout -b dev/azure9572-w001

# 只把這兩個檔從舊分支撿過來
git checkout origin/dev/azure9572 -- src/lib/validation/detectors/W001_unmatchedMaterial.ts
git checkout origin/dev/azure9572 -- src/__tests__/lib/validation/detectors/W001_unmatchedMaterial.test.ts
```

用 `git checkout <branch> -- <path>` 而不是 merge，才不會把 E004／E005／W002／W003 與 `validation_OLD.ts` 一起拖進來——那會讓 PR 大到沒人能 review，你若中途退出也不好移交。

---

## 3. 跑檢查、修掉落差

```powershell
pnpm install
pnpm type-check
pnpm test
```

可能會遇到的兩類問題：

| 症狀 | 處理 |
|------|------|
| 型別錯（`FactoryNodeData` 欄位、`Machine.modes` 等主線已改） | 以**主線型別為準**修草稿，不要把舊型別搬回來 |
| 測試紅 | 先確認是「語意本來就這樣」還是「真的錯」；語意問題以你自己寫的 `docs/azure9572/W001_do.md` 為準，並把該定義複製兩行到 PR 描述 |

`getMachineMode(def).input_ports.length === 0` 這類判斷維持原樣即可，主線同樣支援。

---

## 4. 本週只做這些，其他都不要

| 做 | 不做 |
|----|------|
| W001 一個 detector＋它的測試 | E004／E005／W002／W003（留在舊分支） |
| 讓它符合主線型別、檢查腳本全綠 | 註冊進 `validationStore`（registry 排 11/1） |
| PR 描述寫清楚語意與移交狀態 | 碰 shirone 的 E001、Vue、store、CR-05 |

---

## 5. 開 PR

```powershell
pnpm lint-check
pnpm format-check
git add src/lib/validation/detectors/W001_unmatchedMaterial.ts src/__tests__/lib/validation/detectors/W001_unmatchedMaterial.test.ts
git commit -m "feat(validation): converge W001 unmatched material detector"
git push -u origin dev/azure9572-w001
```

PR 描述四行：

1. W001 判定語意（材料組合對不上任何配方）
2. 怎麼測：`pnpm test`
3. **未含其他 detector、未接 UI／registry**
4. 若你可能退出：加一句「本檔可移交 shirone／aaaaa」

開好後 @ dernoson，**不要**自己合 master。

---

## 6. 沒時間就講一句

時間被壓掉、或決定不續留，Discord 回「本週不做／可能退出」即可：

- 本單關閉，**不計失敗、不擋 8/30**
- W001 在規劃上本來就是加分項，草稿留在 `dev/azure9572`，9–11 月由 shirone 或 aaaaa 撿
- 最傷的不是不交，是沒回音讓人一直追（週中會有人 ping 一次）
