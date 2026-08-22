# W0823-S1｜shirone｜E001 設備重疊純函式（R-D2 提前打底）

| meta | value |
|------|-------|
| 週次 | 2026-08-23 → 2026-08-30 |
| 對應 roadmap | [R-D2](../../roadmap/detail/D2_e001_overlap_alert.md) §6 切片「08/23」 |
| 等級 | **確定**（加分打底；**不**列 8/30 門檻） |
| 擋 8/30 門檻 | **否**（失敗可延 9 月；11/8 才需接右側 UI） |
| 性質 | 純函式＋測試（**本週只做這一種**） |
| 預估時數 | **本週只給這一塊**，吃完即停（勿順手擴 E002／registry） |
| review_gate | dernoson（**必查**：有無 AI dump、是否 import Vue／Pinia、是否走官方型別） |
| **先讀** | [GUIDE_e001_context_pitfalls](./GUIDE_e001_context_pitfalls.md)（像素／格子座標落差、測試 fixture、PR 步驟） |
| 狀態 | `[ ]` 未開始 |

---

## 0. 一句話

交一份**可 review 的單一 PR**：官方契約下的 `E001_deviceOverlap`（`Detector.run(ctx)`）＋ Vitest；兩台設備佔同一格就產出一條繁中 alert。**不接 UI、不建 registry、不碰平行實驗樹。**

---

## 1. 四欄工單

| 欄 | 內容 |
|----|------|
| **畫面** | （本週無正式 UI）在測試裡：兩台重疊 → 有 `code: 'E001'` 的 alert；分開 → 空陣列。可選：`/dev` Validation 頁手動註冊後看 console／結果（**非必交**） |
| **交哪個檔** | 重建／完成 `src/lib/validation/detectors/E001_deviceOverlap.ts`；`src/__tests__/lib/validation/detectors/E001_deviceOverlap.test.ts`（重疊／不重疊／含 rotation） |
| **不要碰** | Vue／Pinia、`FactoryCanvas`、右側 Tips、`registry.ts`（排 11/1）、E002／E003／azure 的 W001、`src/utils/shirone/**` 與 `overlapDetector.ts`（本週不當正式實作）、任何 `opus.ts`／`sonnet.ts`／AI 草稿檔進正式樹 |
| **卡住找誰** | dernoson（PR／format／合入）；幾何／`getOccupiedCells` 行為問 aaaaa；**不要**為了「註冊」去改 store 架構 |

---

## 2. 為何是你、範圍怎麼切

| 依據 | 結論 |
|------|------|
| 本週可做 | detector 純函式＋Vitest；此域可當 Owner |
| 本週不做 | store action、Vue 事件、L3、Flow 結果顯示 → **全禁** |
| 要避開的失敗模式 | AI 草稿先進樹、平行路徑、commit 訊息空 → 工單硬性禁止（見 §5） |
| 與 azure 的分工 | 同域不同 ID → 本週**只做 E001**；ID 表／registry 不本週裁決 |
| 為何不含「註冊」 | D2 已把 registry 集中排 11/1，本週兩人各自註冊會撞入口。**這是刻意少做一件事**，不是漏派 |
| 想找範例 PR 的話 | 正式樹目前**沒有**符合官方契約的 detector 可抄（只有非官方的 `overlapDetector.ts`）。替代模板＝[GUIDE §3](./GUIDE_e001_context_pitfalls.md) 的實作與測試骨架 |
| git 現況（重要） | 正式樹曾有 `E001_deviceOverlap.ts`，後被移除；現存 `overlapDetector.ts` 用 `shironesMachine` **不是**官方 `Detector`。本週任務＝**回到官方契約重立 E001**，不是繼續擴平行樹 |

**本週不做：** 右側警訊列表、點擊導覽、管線重疊（那是實驗 API 的事）、E002。

---

## 3. 名詞（L2 引導：只講本週會碰到的）

| 詞 | 意思 | 你要做的 |
|----|------|----------|
| **Detector** | 純函式規則物件：`{ code, level, run(ctx) }` | 匯出 `E001_deviceOverlap` 符合 `src/types/validation.ts` |
| **ValidationContext** | 輸入：`devices`、`connections`、`getDef`、`baseRegion` | `run` 只讀這些，不讀 store |
| **Alert** | 輸出一筆警示：`uid`、`level`、`code`、`message`、`relatedDeviceUids`… | `message` 用繁中完整句，含設備名；L3 不拼字串 |
| **純函式** | 同輸入同輸出；不改全域、不碰 DOM | **禁止** `import` 任何 `vue`／`pinia`／`*.vue` |
| **registerDetector** | 把 detector 掛進 `validationStore` | **本週可不做**（D2 排 11/1 集中 registry）；若要自測可在測試或 `/dev` 暫時註冊，勿改正式組裝架構 |
| **平行實驗樹** | `src/utils/shirone/*`、`overlapDetector.ts`、`shironesinterface` | 本週**唯讀參考**；正式實作改走 `geometryUtils.getOccupiedCells` |

---

## 4. 開工前檢查

- [ ] 已讀 [D2](../../roadmap/detail/D2_e001_overlap_alert.md) §4.2–§4.3、§6（08/23 切片）、§7 不做
- [ ] 打開型別：`src/types/validation.ts` 的 `Detector`／`Alert`／`ValidationContext`
- [ ] 打開幾何：`src/utils/geometryUtils.ts` 的 `getOccupiedCells`、`cellsOverlap`（**用這套，不要自寫格子換算**）
- [ ] 確認目前分支上 **沒有** `E001_deviceOverlap.ts`（已被刪）→ 本週是**新建／恢復**，不是小修
- [ ] （可選）`git show <舊 commit>:src/lib/validation/detectors/E001_deviceOverlap.ts` 當草稿參考；以官方 `geometryUtils` 版為準，不要帶回自寫 `GRID_CELL_SIZE` 像素換算（除非 aaaaa 另行確認）

---

## 5. 步驟

### 5.1 實作 `E001_deviceOverlap.ts`

契約（對齊 D2 §4.3）：

```text
對 ctx.devices 兩兩比較：
  defA = ctx.getDef(deviceA.data.machineType)
  defB = ctx.getDef(deviceB.data.machineType)
  若缺定義 → skip
  cellsA = getOccupiedCells(deviceA, defA)
  cellsB = getOccupiedCells(deviceB, defB)
  cellsOverlap(cellsA, cellsB) → 推一筆 Alert
```

Alert 建議欄位：

| 欄 | 值 |
|----|-----|
| `code` | `'E001'` |
| `level` | `'error'` |
| `message` | 例如「設備「粉碎機」與「塑型機」位置重疊」（用 `def.name` 或 label，勿只丟 uid） |
| `relatedDeviceUids` | `[idA, idB]` |
| `relatedConnectionUids` | `[]` |
| `uid` | `crypto.randomUUID()` 或測試可注入的穩定策略 |

同一對設備只報**一條**（避免 A-B 與 B-A 各一條）。

**已知座標落差（照做，不要自己修）：** `useValidation.buildContext()` 傳進來的 `ctx.devices[].position` 是 **Vue Flow 像素座標**（20 的倍數），而 `getOccupiedCells` 假設是格子座標。detector 仍**照官方函式寫、不做換算**（ctx 沒有 `gridSize`，硬取就得 import store）；測試 fixture 用格子座標；PR 描述加一行把落差寫成已知問題，歸屬 aaaaa 的幾何域。

### 5.2 測試 `E001_deviceOverlap.test.ts`

至少覆蓋：

1. 兩台分開 → `run` 回傳 `[]`
2. 兩台重疊 → 恰好一條，`code === 'E001'`，`relatedDeviceUids` 含兩者
3. **rotation** 造成重疊／不重疊各至少一例（依賴 `getOccupiedCells` 已處理 0/1/2/3）
4. 缺 `getDef` → 不炸、該對 skip

測試裡組最小 `ValidationContext`（假 `devices`＋假 `getDef` 即可），**不要**啟動 Vue。

### 5.3 開 PR（沒開過也沒關係，照下面五步）

1. 分支建議：`dev/shirone-e001`（或主編慣例）
2. **一個 detector 一個 PR**；標題示例：`feat(validation): E001 device overlap detector + tests`
3. PR 描述至少三行：做了什麼／怎麼測（`pnpm test` 指令）／**明確寫「未接 UI、未改 registry」**
4. 跑過：`pnpm type-check`／`lint-check`／`format-check`／`test`
5. 請 dernoson review；他可能幫 format——這是預期，不是失敗

### 5.4 硬性禁止（review 一票否決）

- 提交 `opus.ts`／`sonnet.ts`／大型 AI dump
- 在 detector 內 `import` Vue／Pinia
- 把 `overlapDetector`／`shironesMachine` 接進正式 `validationStore` 當 E001
- 本週順便做 E002／右側列表／點擊導覽
- 新增平行目錄代替 `src/lib/validation/detectors/`

若實驗檔仍要保留：留在 `src/utils/shirone/`，**本 PR 不要動它們**（除非刪除誤提交的 AI 檔）。

---

## 6. DoD（本週切片；非整包 D2）

- [ ] `E001_deviceOverlap.ts` 存在且匯出符合 `Detector`
- [ ] `E001_deviceOverlap.test.ts` 通過（含旋轉案例）
- [ ] detector **不** import Vue／Pinia（PR 自檢＋ review）
- [ ] 單一 PR，無 AI dump 檔
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過
- [ ] PR 描述註明：正式 UI／registry 不在本週，並附上像素／格子座標的已知落差  

（完整 D2 門檻「右側出現訊息」屬 11 月，**不是**本週 DoD。）

---

## 7. 未交頂替

不擋 8/30。未交 → 延到 9 月同一塊；必要時由 aaaaa 接手（幾何已是 CR-04 產出，接手成本低，見 D2 §10）。

---

## 8. 回報

| 時機 | 動作 |
|------|------|
| 開工 | Discord 丟一句「開始 E001」即可 |
| PR 開好 | @ dernoson；附測試指令 |
| 卡住超過一天 | 直接問 dernoson／aaaaa，不要再開平行檔「先做著」 |

---

## 9. 開發日誌（派工側）

### 2026-08-23

- 依 D2 §6（08/23）切片正式派工
- 註明現況：E001 已自正式樹移除；`overlapDetector` 為非官方契約 → 本週重立官方 E001
- 不擋 8/30；禁止 AI 大檔與平行樹擴張
