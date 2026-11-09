# V19-C1 — Hub 骨架（目錄＋詞彙＋頁內教學）

**對應工項：** V19-C1
**狀態：** `[x]` 完成（2026-11-01）
**日期：** 2026-11-01
**依賴：** [A1](./A1_scope_decision.md) `[x]`、[B1](./B1_v18_residue_close.md) `[x]`
**正式依據：** [W1026-A0 §1](../../../work_dispatch/aaaaa/1026/W1026-A0_tutorial_lab_api.md)、[USAGE](../USAGE_l1_contract_lab.md)、[LAB](../../../work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md)
**開發分支：** `dev/aaaaa1026`
**產物：** `/dev/l1-contract-lab` 強化（`L1ContractLab.vue`、`contractCatalog.ts`）；USAGE／LAB 互連

---

## 1. 背景與動機

既有 lab 已有 V14–V17 定義表＋部分一鍵案例，但：

- 缺「長期會收哪些 API」的**目錄／inventory**（下游不知還有沒有）
- 詞彙／教學分散在 LAB 長文；**無經驗者**不一定會先開 markdown
- 工單要求 tutorial 對齊現況；本版教學**做在頁內**（A-5）

本項只立骨架，不一次填滿 A-2 全量。

---

## 2. 技術決策

| 決定 | 狀態 | 說明 |
|------|------|------|
| 單一真相 | **已決** | 只強化 `/dev/l1-contract-lab`；不另開 hub 路由 |
| 文案來源 | **延續** | `contractCatalog.ts`：`HUB_GUIDE_STEPS`／`HUB_GLOSSARY`／`CONTRACT_INVENTORY` |
| Inventory | **已做** | layout utils／layoutStore／validation／engine-adapter；listed／todo |
| 詞彙 | **已做** | 頁內精簡表；連 USAGE／LAB |
| 最短路徑 | **已做** | 預設開「入門」分頁；5 步 |

---

## 3. 檔案

| 動作 | 檔案 |
|------|------|
| 改 | `src/app/dev/L1ContractLab.vue`（入門／詞彙／目錄分頁） |
| 改 | `src/app/dev/l1ContractLab/contractCatalog.ts` |
| 改 | `docs/aaaaa/dev/USAGE_l1_contract_lab.md` |
| 改 | `docs/work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md`（互連一句） |
| **未碰** | `LayoutView`／`GridCanvas`／`layoutStore` 簽名 |

---

## 4. 驗證標準（DoD）

- [x] DevLayout 仍找得到「L1 契約實驗室」
- [x] 頁內有最短路徑教學（無經驗者可跟）
- [x] 頁內有詞彙入口（精簡表＋連 LAB）
- [x] 頁內有 inventory：已列／待列分得清；邊界對齊 A-2
    - 待列下一批切片：[F0](./F0_next_catalog_batch.md)
- [x] 未改正式畫布／store／L1 簽名

---

## 5. 開發日誌

### 2026-11-01｜完成

- catalog 加 guide／glossary／inventory；預設分頁＝入門
- hitTestPortAt 定義列補 `prefer` 一句（點測案例仍交 D1）
- USAGE／LAB 互連更新

### 2026-11-01

- 建檔
