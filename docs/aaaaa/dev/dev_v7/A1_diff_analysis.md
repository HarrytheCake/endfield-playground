# V7-A1 — data_0 / data_1 / src 差異分析

**對應工項：** V7-A1  
**狀態：** 進行中（分析稿）  
**日期：** 2026-08-01

---

## 1. 背景與動機

需把新版物件定義（`data_1`，含氣態與多型態）導入 playground。舊執行鏈為：

```text
docs/aaaaa/data_0/*.json  ≈  現行 src/data/*.ts 的語意來源
```

新來源：

```text
docs/aaaaa/data_1/*.json + *.md（schema v3 說明）
```

目標工作副本（待重建）：

```text
docs/aaaaa/data/   ← 腳本輸出（目前目錄不存在）
src/data/          ← 執行期 TS（第二階段同步）
```

---

## 2. 檔案對照

| 檔案 | data_0 | data_1 | 現行 src/data |
|------|--------|--------|----------------|
| materials.json | 12 | 14（+息壤氣等） | （無獨立 materials.ts；品項散在 products） |
| machines.json | 39 | 43 | machines.ts（含 FlowEngine 專用 source/sink） |
| machine_tags.json | 5 | 5 | 型別 MachineCategory |
| products.json | 90 | 94（含氣態＊） | products.ts（stub／精簡配方集） |
| plans.json | 2 | 2 | plans.ts |
| layouts.json | 2 | 2 | （未完整進 src） |
| blueprints.json | 1 | 1 | （未完整進 src） |
| environments.json | 無 | **有（5）** | **無** |

---

## 3. 結構差異（關鍵）

### 3.1 Machine

| 項目 | data_0 / 現行 TS | data_1 |
|------|------------------|--------|
| 埠 | `side` + `offset`；（TS 另有 `type: item\|liquid`） | `side` + `offset` + **`media: belt\|pipe`** |
| 多型態 | 無 | **`modes[]`**（權威埠／loss） |
| 損耗 | 無 | **`modes[].loss`**（`item` + `rate_per_min` 或 null） |
| 其他 | — | `config_signed_off`；頂層 ports 與 `modes[0]` 同步 |

### 3.2 Product / Recipe

| 項目 | data_0 / 現行 TS | data_1 |
|------|------------------|--------|
| IO 欄位 | JSON：`name`；TS：`itemId` | JSON：`name` |
| 時間 | `time_seconds`；TS：`timeSeconds` | `time_seconds` |
| 機器綁定 | `machine`（名） | `machine` + **`machine_mode`** |
| 環境 | 無 | **`environment`** → environments.id |
| 氣態 | 無／少 | 產品如氣態赤銅／赫銅／灼銅；配方多用 `gas_mode`／`gas_liquid_mode` |

### 3.3 氣態相關（本版重點）

- 材料新增例如「息壤氣」。
- 機器新增／擴充 **氣體模式**（`gas_mode`、`gas_liquid_mode` 等），埠 `media` 區分 belt／pipe。
- 配方透過 `machine_mode` 綁定氣體型態；環境標籤（如息壤環境）在 `environments.json`。
- **配頻／模擬**需能：選對 mode 的埠、拒絕 belt↔pipe 錯接、處理 loss 消耗（若引擎要算損耗）。

### 3.4 Port 語意衝突（必須定案）

| 層 | 媒質欄位 |
|----|----------|
| data_1 | `media`: `belt` \| `pipe` |
| src/types/machine.ts | `type`: `item` \| `liquid` |
| CR-02 文件語意 | 傳送帶（固體）／水管（液體／氣體） |

轉換時需明確：**改 TS 為 belt/pipe**，或 **對映 belt→item、pipe→liquid（氣體走 pipe）**。

---

## 4. 使用 `src/data` 的程式盤點（初步）

| 模組 | 用途 | V7 風險 |
|------|------|---------|
| `src/composables/useFlowEngine.ts` | getMachine、getRecipesForMachine；建圖、反向鏈、傳播、堵塞 | **高**：recipeIndex 不夠表達 machine_mode；媒質未驗證；loss 未算 |
| `src/data/products.ts` | 配方查詢 | **高**：需整批對齊 data_1 |
| `src/data/machines.ts` | 機器定義 | **高**：modes／media／台數增加 |
| `src/data/plans.ts` | 建造計畫 | 中：欄位可能微調 |
| `src/store/editorStore.ts` | import plans | 低～中 |
| `src/composables/useValidation.ts` | getMachine | 中：佔格／埠 |
| `src/__tests__/flowEngine*.ts`、`data/*.test.ts` | 回歸 | **高** |
| `/dev/flow-engine` | 手動 preset | 中：需氣態／mode 情境 |

「反向鏈路」對應引擎內 `validateChains`（自 sink 反向 BFS + 配方匹配）。新資料下配方匹配須考慮 **mode 與輸入品項（含氣態）**。

---

## 5. 建議分期（已定案後）

| 階段 | 內容 | 狀態 |
|------|------|------|
| P0 | 腳本原樣複製 → `docs/aaaaa/data` + 說明 | 待實作 B1/C1 |
| P1 | 型別 belt/pipe + modes + machineMode；src/data | 待實作 D1/D2 |
| P2 | FlowEngine 最小：mode 配方 + 媒質檢查（loss 不算） | 待實作 E1 |
| P3 | 測試與 dev preset | 待實作 F1 |

定案全文：[A2_mapping_decision.md](./A2_mapping_decision.md)

---

## 6. 驗證標準（本文件）

- [x] 三套資料角色與檔案表清楚
- [x] 氣態／modes／media 差異列出
- [x] 消費者初盤完成
- [ ] 對映策略已定案 → 見 [A2_mapping_decision.md](./A2_mapping_decision.md)

---

## 7. 開發日誌

### 2026-08-01

- 確認 `docs/aaaaa/data` 目前不存在，僅有 data_0／data_1
- 盤點 data_1 新增 environments、modes、media、氣態產品
