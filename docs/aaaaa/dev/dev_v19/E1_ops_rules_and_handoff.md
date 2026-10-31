# V19-E1 — 維運規則、驗收、交接

**對應工項：** V19-E1
**狀態：** `[ ]` 未開始
**日期：** 2026-11-01
**依賴：** [C1](./C1_hub_skeleton.md)、[D1](./D1_clickable_api_samples.md)
**正式依據：** [W1026-A0 §3](../../../work_dispatch/aaaaa/1026/W1026-A0_tutorial_lab_api.md)、[WEEK §0.2 V2](../../../work_dispatch/WEEK_20261026.md)

---

## 1. 後續維運規則（本周必寫；不做自動）

> 目標：之後 L1 新增／更新「也會出現在 lab」——靠**人工約定**，不是 codegen（A-4＝C）。

### 1.1 單一真相

| 層 | 檔 | 職責 |
|----|-----|------|
| 頁面 | `/dev/l1-contract-lab` | 唯一 hub；不另開平行 swagger 頁 |
| 資料 | `src/app/dev/l1ContractLab/contractCatalog.ts` | 定義列／inventory／詞彙摘要 |
| 長文 | [USAGE](../USAGE_l1_contract_lab.md)、[LAB](../../../work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md) | 白話長說明；與 catalog 互連 |

### 1.2 新 L1 PR 應帶什麼（建議寫進 PR 模板／DoD 一句）

1. **inventory**：`status` 從 `todo` → `listed`（或新增列）
2. **定義列**：`symbol`／`module`／`purpose`／`callers`／`dont`（給無經驗者可讀）
3. **可點測（建議）**：至少一則一鍵案例；若不宜寫入 store，標「唯讀／隔離」
4. **USAGE／LAB**：破壞性或易踩雷時補一句；詞彙新詞進 LAB §2
5. **禁止**：只改程式、不改 catalog → 視為 hub 欠帳

### 1.3 後續週（非本版）

- 全量填滿 A-2 邊界（layout utils 全部＋layoutStore 公開 action＋可選驗證／引擎）
- 再評估半自動（掃匯出清單 vs catalog diff）——**另開版本**

---

## 2. 驗收表（對公開 V2）

| # | 步驟 | 預期 | 結果 |
|---|------|------|------|
| 1 | `pnpm dev` → DevLayout → L1 契約實驗室 | 找得到 | 待填 |
| 2 | 頁內最短路徑可跟做 | 新 clone 懂 dev→lab→正式頁 | 待填 |
| 3 | 詞彙／API 白話入口 | 頁內有 | 待填 |
| 4 | inventory 骨架 | 已列／待列清楚 | 待填 |
| 5 | 少數 API 可點測 | ≥2；與 master 一致 | 待填 |
| 6 | 維運規則可讀 | 本檔 §1 或頁內摘要 | 待填 |
| 7 | 未改鎖檔／簽名 | LayoutView／GridCanvas／store／L1 簽名無業務 diff | 待填 |

---

## 3. 交接產物

| 產物 | 對象 | 一句話 |
|------|------|--------|
| `/dev/l1-contract-lab` MVP | 全體（尤其無經驗） | 查 L1＋跟教學＋點測 |
| 維運規則 §1 | 未來 L1 PR author | 改碼必改 catalog |
| inventory `todo` | 後續週 aaaaa | 全量 catalog 待辦清單 |

口頭節奏：[INTRO](../../collaborator_survey/dispatch_private/1026/INTRO_A0_tutorial_lab_api.md)

---

## 4. 合入後回寫

- [ ] todolist_v19 → 結案
- [ ] AGENT_WEEK_1026 §0／§4
- [ ] 決策層 1026 REVIEW／PENDING 日誌一行
- [ ] WEEK V2 勾選（主編／結算時）
- [ ] **本專案收斂後**再開 PR → master（收斂前禁止開 PR）

---

## 5. DoD

- [ ] §1 維運規則落版
- [ ] §2 驗收表通過
- [ ] 未改鎖檔／簽名；不發解鎖句
- [ ] PR 僅在專案收斂後開（開版／進度只 commit）

---

## 6. 開發日誌

### 2026-11-01

- 建檔；維運規則草案寫入 §1
