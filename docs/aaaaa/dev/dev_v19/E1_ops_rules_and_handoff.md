# V19-E1 — 維運規則、驗收、交接

**對應工項：** V19-E1
**狀態：** `[x]` 完成（2026-11-01；主線驗收通過；**PR 待裁**）
**日期：** 2026-11-01
**依賴：** [C1](./C1_hub_skeleton.md) `[x]`、[D1](./D1_clickable_api_samples.md) `[x]`
**正式依據：** [W1026-A0 §3](../../../work_dispatch/aaaaa/1026/W1026-A0_tutorial_lab_api.md)、[WEEK §0.2 V2](../../../work_dispatch/WEEK_20261026.md)
**開發分支：** `dev/aaaaa1026`

---

## 1. 後續維運規則（本周必寫；不做自動）

> 目標：之後 L1 新增／更新「也會出現在 lab」——靠**人工約定**，不是 codegen（A-4＝C）。  
> 頁內摘要：lab「入門」分頁底部（`HUB_OPS_RULES`）。

### 1.1 單一真相

| 層 | 檔 | 職責 |
|----|-----|------|
| 頁面 | `/dev/l1-contract-lab` | 唯一 hub；不另開平行 swagger 頁 |
| 資料 | `src/app/dev/l1ContractLab/contractCatalog.ts` | 定義列／inventory／詞彙／入門／維運摘要 |
| 長文 | [USAGE](../USAGE_l1_contract_lab.md)、[LAB](../../../work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md) | 白話長說明；與 catalog 互連 |

### 1.2 新 L1 PR 應帶什麼（建議寫進 PR body／DoD 一句）

1. **inventory**：`status` 從 `todo` → `listed`（或新增列）
2. **定義列**：`symbol`／`module`／`purpose`／`callers`／`dont`（給無經驗者可讀）
3. **可點測（建議）**：至少一則一鍵案例；若不宜寫入 store，標「唯讀／隔離 Pinia」
4. **USAGE／LAB**：破壞性或易踩雷時補一句；詞彙新詞進 LAB §2
5. **禁止**：只改程式、不改 catalog → 視為 hub 欠帳

### 1.3 後續週（非本版）

- **下一批（已正式開 V20）：** [F0](./F0_next_catalog_batch.md) → [todolist_v20](../todolist_v20.md)（A1 `[x]`；[AGENT_WEEK_1102](../../claude/AGENT_WEEK_1102.md)）
  - P0：`findPortAt`／`collectPortAnchors`、`resolveConnections`
  - P1：`addPipeline`／`removePipeline`、`buildGapConnectionWaypoints`（inventory 新列）
- 再下一刀才考慮：佔格／重疊／footprint／管線幾何／snapshot／detectors 等（見 F0 §2.3）
- 全量填滿 A-2 邊界、半自動（掃匯出 vs catalog diff）——**另開版本**，勿塞進下一批

---

### 1.4 交接產物補充（F0）

| 產物 | 對象 | 一句話 |
|------|------|--------|
| [F0](./F0_next_catalog_batch.md) | 後續週 aaaaa | 先補哪四項、哪批不做 |
| [todolist_v20](../todolist_v20.md) | 開版用 | **已開版**（A1 `[x]`） |

---

## 2. 驗收表（對公開 V2）

| # | 步驟 | 預期 | 結果 |
|---|------|------|------|
| 1 | `pnpm dev` → DevLayout → L1 契約實驗室 | 找得到 | **通過**（`DevLayout` 已有入口） |
| 2 | 頁內最短路徑可跟做 | 新 clone 懂 dev→lab→正式頁 | **通過**（入門 5 步；預設分頁） |
| 3 | 詞彙／API 白話入口 | 頁內有 | **通過**（詞彙分頁＋USAGE／LAB） |
| 4 | inventory 骨架 | 已列／待列清楚 | **通過**（目錄分頁；A-2 四區） |
| 5 | 少數 API 可點測 | ≥2；與 master 一致 | **通過**（prefer 緊貼＋waypoints；既有 outside／store） |
| 6 | 維運規則可讀 | 本檔 §1 或頁內摘要 | **通過**（本檔＋入門頁 `HUB_OPS_RULES`） |
| 7 | 未改鎖檔／簽名 | LayoutView／GridCanvas／store／L1 簽名無業務 diff | **通過**（相對 master 僅 `docs/`＋`src/app/dev/*`） |

品質閘（分支已跑）：`pnpm type-check`／`lint-check` 綠（C1／D1 實作後）。

---

## 3. 交接產物

| 產物 | 對象 | 一句話 |
|------|------|--------|
| `/dev/l1-contract-lab` MVP | 全體（尤其無經驗） | 查 L1＋跟教學＋點測 |
| 維運規則 §1／頁內摘要 | 未來 L1 PR author | 改碼必改 catalog |
| inventory `todo` | 後續週 aaaaa | 全量待辦；**優先切片＝[F0](./F0_next_catalog_batch.md)** |

口頭節奏：[INTRO](../../collaborator_survey/dispatch_private/1026/INTRO_A0_tutorial_lab_api.md)

建議 PR 標題（收斂後開）：`W1026-A0：L1 Hub MVP（tutorial／詞彙／目錄／可點測）`

建議 PR body 下游句：

```text
下游消費者：
- 無開發經驗協作者：lab「入門／詞彙／目錄」可跟做
- L2／驗證／引擎：以 /dev/l1-contract-lab＋contractCatalog 查 API
- 後續週：inventory todo → listed；勿另開第二 hub
不發解鎖句；未改 LayoutView／GridCanvas／store／L1 簽名。
```

---

## 4. 合入後回寫

- [x] todolist_v19 → 主線結案（本項）
- [x] AGENT_WEEK_1026 §0／§4
- [x] 決策層 1026 REVIEW／PENDING 日誌一行
- [ ] WEEK V2 勾選（主編／結算時）
- [ ] **PR → master**（負責人裁開；本專案主線已收斂，開 PR 另裁）

---

## 5. DoD

- [x] §1 維運規則落版（含頁內摘要）
- [x] §2 驗收表通過
- [x] 未改鎖檔／簽名；不發解鎖句
- [x] 主線完成；PR 時機另裁（不在本項強制 push／開 PR）

---

## 6. 開發日誌

### 2026-11-01｜F0 下一批交接

- §1.3／§1.4 指向 F0＋todolist_v20；實作仍未開

### 2026-11-01｜完成

- 驗收表填過；入門頁掛維運摘要；相對 master 無鎖檔 diff
- 主線收斂；**開 PR 待負責人裁**

### 2026-11-01

- 建檔；維運規則草案寫入 §1
