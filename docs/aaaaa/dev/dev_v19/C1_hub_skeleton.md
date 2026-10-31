# V19-C1 — Hub 骨架（目錄＋詞彙＋頁內教學）

**對應工項：** V19-C1
**狀態：** `[ ]` 未開始
**日期：** 2026-11-01
**依賴：** [A1](./A1_scope_decision.md) `[x]`、[B1](./B1_v18_residue_close.md)
**正式依據：** [W1026-A0 §1](../../../work_dispatch/aaaaa/1026/W1026-A0_tutorial_lab_api.md)、[USAGE](../USAGE_l1_contract_lab.md)、[LAB](../../../work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md)
**開發分支：** `dev/aaaaa1026`
**產物：** `/dev/l1-contract-lab` 強化（`L1ContractLab.vue`、`contractCatalog.ts`）；必要時 USAGE／LAB 互連一句

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
| 文案來源 | **延續** | 優先 `contractCatalog.ts`；頁內區塊可讀 catalog 欄位 |
| Inventory | **本周必做** | 列出：已登錄／待登錄（layout utils、layoutStore actions、可選驗證／引擎） |
| 詞彙 | **本周必做** | 頁內精簡詞彙表（可摘 LAB §2）；連到完整 LAB |
| 最短路徑 | **本周必做** | 頁頂或總覽：「pnpm dev → 本頁 → 正式頁能做什麼」3～5 步 |

### 2.1 Inventory 欄位（建議）

```text
area: 'layout-utils' | 'layout-store' | 'validation?' | 'engine-adapter?'
symbol: string
module: string
status: 'listed' | 'todo'   // listed＝已有定義列／演示；todo＝後續週
note?: string               // 一句白話
```

本周不必為每個 `todo` 寫完整 API 列；有名＋路徑＋一句話即可。

### 2.2 頁內教學區（給無經驗者）

至少回答：

1. 這頁是什麼？（不是遊戲正式畫面）
2. 怎麼打開？（`pnpm dev`＋左側導覽／URL）
3. 各分頁點什麼？
4. 正式頁現在能做什麼？（對齊 #78 已合現況：埠連線等——**只描述、不改畫布**）
5. 卡住讀哪？（USAGE／LAB 連結）

---

## 3. 檔案

| 動作 | 檔案 |
|------|------|
| 改 | `src/app/dev/L1ContractLab.vue` |
| 改 | `src/app/dev/l1ContractLab/contractCatalog.ts`（inventory／詞彙資料） |
| 可改 | `docs/aaaaa/dev/USAGE_l1_contract_lab.md`（互連＋現況一句） |
| 可改 | `docs/work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md`（互連；不大改） |
| **不碰** | `LayoutView`／`GridCanvas`／`layoutStore` 簽名 |

---

## 4. 驗證標準（DoD）

- [ ] DevLayout 仍找得到「L1 契約實驗室」
- [ ] 頁內有最短路徑教學（無經驗者可跟）
- [ ] 頁內有詞彙入口（或精簡表＋連 LAB）
- [ ] 頁內有 inventory：已列／待列分得清；邊界對齊 A-2
- [ ] 未改正式畫布／store／L1 簽名

---

## 5. 開發日誌

### 2026-11-01

- 建檔
