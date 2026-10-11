# W1004-Z1｜azure9572｜E004／E005 進 master、W001 修正，接上 dev 驗證頁

| meta | value |
|------|-------|
| 週次 | 2026-10-04 → 2026-10-11 |
| 等級 | **確定（復工首件）** |
| 擋門檻 | 否（但把 R-D3 從 11/15 提前到 10 月） |
| 上游 | 10/04 會議原句、[D3 細項](../../../roadmap/detail/D3_recipe_alerts.md)、上週 [W0921-Z0](../0921/W0921-Z0_pause.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | `/dev/validation-test` 上看得到缺輸入／缺輸出的警示｜`src/lib/validation/detectors/*` ＋對應 `__tests__`，外加 `ValidationTest.vue` 的註冊那幾行｜`types/validation.ts` 欄位、`E001`、正式頁右側、`layoutStore`｜dernoson（PR 流程、ID 表）、aaaaa（型別要加欄位時） |

---

## 0. 會議原句與你自報

**會議：** 「修改 E004／E005／W001 的錯誤，並且使用當前新的模型，接到 dev 畫面中。」  
**你 10/05 週報：** 「目前暫時可以派工（暫時沒比賽了…時間可能不會太多）」＋下週 ≤2h。

所以本週**有工單**（不再是暫停單），但範圍按 ≤2h 切：**純函式＋測試為主交付**，接頁面只有幾行。

---

## 1. 「當前新的模型」指的是哪個

指 **master 現行的 `src/types/validation.ts`**：`Detector`／`ValidationContext`／`Alert`。

你 8 月在 `dev/azure9572` 上自己開了一套 `src/types/validation_OLD.ts`（+76 行）並往 `validation.ts` 加了欄位——**那套不要帶進來**。

| 你要用的 | 怎麼用 |
|----------|--------|
| `ctx.devices` | 已部署設備；`position` **已經是格子座標**，不用再除 gridSize |
| `ctx.connections` | 已部署管線；入邊＝`c.target === device.id`，出邊＝`c.source === device.id` |
| `ctx.getDef(machineType)` | 拿 `Machine` 定義（也可 `getMachine`，與 W001 現行寫法一致） |
| `getMachineMode(def)` | 拿該機目前 mode 的 `input_ports`／`output_ports` |
| `def.is_source` / `def.is_sink` | 源機（不套 E004）／匯出點（不套 E005） |
| `Alert` | 六個欄位都要填：`uid`（`crypto.randomUUID()`）、`code`、`level`、`message`、`relatedDeviceUids`、`relatedConnectionUids` |

**照 master 的 `W001_unmatchedMaterial.ts` 抄結構最省事**——它已經是這個介面的正確範例。

---

## 2. 三支的判定（D3 §4.3，照這個寫，不要自己改語意）

| ID | level | 判定 | 不套用 |
|----|-------|------|--------|
| `E004` | error | 該機目前 mode 存在**需要輸入**的配方，但**沒有任何入邊** | `is_source` 的源機 |
| `E005` | error | 該機**有產出**，但**沒有任何出邊** | `is_sink` 的匯出點 |
| `W001` | warning | **有入邊**，但輸入品項集合**不吻合**任一條配方 | 無入邊時不報（交給 E004） |

**E004 與 W001 是接力關係：** W001 現在在「無入邊」時直接 `continue`，把那條路徑讓給 E004。E004 一直沒進 master，所以**「完全沒接線的機器」目前是零訊息**——這就是會議說的「錯誤」之一。

### 2.1 W001 要修的點

```ts
// src/lib/validation/detectors/W001_unmatchedMaterial.ts 現況
const isMatch = recipe.inputs.every((input) => incomingItemIds.has(input.itemId));
```

- `every` 是**子集**判定：配方要 A，你接了 A＋B，現在算「吻合」。D3 §4.3／V9 的語意是**輸入種類集合完全吻合** → 多餘材料應該要報 W001。這是主要的錯。
- `machineDef.name === '分流器' || '管道分流器'` 用**中文名字串**比對分流器，資料改名就失效；若 `Machine` 上有可用的 tag／旗標請改用，沒有就**在 PR 描述寫一句「暫時沿用名稱比對」**，讓後人看得到。
- `getIncomingItems` 的 `visited` 跨入邊共用：同一上游同時餵兩條入邊時，第二條會被跳過。請確認這是不是你要的行為。

改動請附在測試裡說明（「多餘材料也要報」至少一個 case）。

---

## 3. 交哪些檔

| 動作 | 檔 |
|------|-----|
| 新建 | `src/lib/validation/detectors/E004_missingInput.ts`、`E005_missingOutput.ts` |
| 修改 | `src/lib/validation/detectors/W001_unmatchedMaterial.ts` |
| 新建 | `src/__tests__/lib/validation/detectors/E004_missingInput.test.ts`、`E005_missingOutput.test.ts` |
| 修改 | `src/__tests__/lib/validation/detectors/W001_unmatchedMaterial.test.ts` |
| **只加幾行** | `src/app/dev/ValidationTest.vue`：`registerDetector(E004_…)`／`registerDetector(E005_…)`，外加一顆「新增沒接線的機器」測試鈕 |

`dev/azure9572` 上的 E004／E005 可以當草稿撿，但**要重套 master 現行介面**，不是整支搬過來。

---

## 4. 不要做

- **不要帶 `src/types/validation_OLD.ts`**，也不要改 `ValidationContext` 的欄位。真的缺欄位 → 先問 aaaaa，不要自己加。
- **不要帶 W002／W003**。ID 表只凍結 E004／E005／W001 三支，多的下次再談。
- **不要接 `layoutStore`／`PlacedDevice` 新畫布模型**——驗證改吃佈局模型是**十一月 D1 鏈**，本週碰了會跟 toby／harry 的檔撞。
- 不要接正式頁右側（右側本週是 shirone 的樣式工，警訊上右側排 11/08）。
- 不要碰 `E001_deviceOverlap`。
- 不要 `pnpm-workspace.yaml` 之類的環境檔（你舊分支有一筆）。

---

## 5. 一句話驗收

**`pnpm dev` → `/dev/validation-test`：放一台沒接線的加工機，警示列出現 E004；`pnpm test` 全綠。**

時數不夠時的優先序：**E004 ＞ W001 修正 ＞ E005**。只交 E004 一支＋測試也算完成，**不要三支都半成品**。

---

## 6. 卡住怎麼辦

你問卷自報「先自己撐一陣子再講」，所以**dernoson 週中會主動問一次**，不用等你開口。卡在 PR 流程（branch／push／開 PR）直接說，不要攢到週末。

`dev/azure9572` 已分歧兩個月——**請從最新 master 開新分支**，把要的檔挑過去，不要在舊分支上繼續長。

---

## 7. DoD

- [ ] E004 在 master 現行 `Detector` 介面下可跑，有測試
- [ ] `/dev/validation-test` 能看到 E004（E005 若有交，一併看到）
- [ ] W001 改為「輸入集合完全吻合」語意，測試含「多餘材料要報」
- [ ] 無 `validation_OLD.ts`、無 W002／W003、`ValidationContext` 欄位未動
- [ ] detector 無 import Vue／Pinia
- [ ] `pnpm type-check`／`lint-check`／`test` 通過
