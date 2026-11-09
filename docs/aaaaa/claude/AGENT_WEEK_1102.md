# Agent 週摘要｜2026-11-02 → 11-08（1102｜V21 試玩分頁已交）

| meta | value |
|------|-------|
| version | **v1.8（2026-11-08；C1 交接已寫；牌 3 未開工）** |
| 用途 | Agent 執行本週 V21 開版時的強制約束 |
| 公開 | [WEEK_20261102](../../work_dispatch/WEEK_20261102.md) v1.2、[W1102-A0](../../work_dispatch/aaaaa/1102/W1102-A0_v21_a1_open.md) |
| 執行計畫 | [todolist_v21](../dev/todolist_v21.md)、[dev_v21/](../dev/dev_v21/) |
| 決策層 | [1102/REVIEW](../collaborator_survey/dispatch_private/1102/REVIEW_20261102.md)、[E3](../collaborator_survey/dispatch_private/1102/E3_risk_backup_staffing.md)、[PENDING](../collaborator_survey/dispatch_private/1102/PENDING_DECISIONS_20261101.md)、[INTRO](../collaborator_survey/dispatch_private/1102/INTRO_A0_v21_a1_open.md) |
| 上週 | [AGENT_WEEK_1026](./AGENT_WEEK_1026.md)（V19＋V20 已由 #82 合入） |
| 撰寫 | aaaaa |
| 最後更新 | 2026-11-08 |

---

## 0. 三十秒結論

**閘門已過。** [#82](https://github.com/dernoson/endfield-playground/pull/82) 於 2026-11-02 合入，V19＋V20 在 `master`。  
**牌 1 已開。牌 2／C1 已交**（負責人 2026-11-08 下令，逾原 ≤2h 只開版）：hub「試玩」分頁，`hitTestPortAt`／`findPortAt` 可調參。  
**牌 3 未開工。** 不做 `canConnect`、swagger、第二 hub。  
分支 **`dev/aaaaa1102`**。不發解鎖句。不改畫布／store 簽名／右側產耗／供水／`DeviceShape`。

---

## 1. 優先序（必須遵守）

| 序 | 內容 | 工單／文件 |
|----|------|------------|
| ~~0~~ | ~~對齊 `origin/master`；開分支~~ | **已完成**；`dev/aaaaa1102` |
| ~~1~~ | ~~核對 #82 含 V19＋V20~~ | **已完成**；MERGED 2026-11-02 |
| ~~2~~ | ~~牌 1／V21-A1 開版文件~~ | **已完成**；[A1](../dev/dev_v21/A1_scope_decision.md) |
| ~~3~~ | ~~牌 2 試玩殼＋P0~~ | **已完成**；[C1](../dev/dev_v21/C1_tryout_shell_p0.md) |
| 4 | 牌 3 `canConnect` | **不做**；[D1](../dev/dev_v21/D1_can_connect_tryout.md) |
| — | **禁止**swagger／codegen／第二 hub | F1 |
| — | **禁止**改 LayoutView／GridCanvas／store／L1 **簽名** | 硬鎖 |
| — | **禁止**右側產耗、供水、`DeviceShape` | WEEK §2.2 |

---

## 2. 禁止表

| 禁止 | 理由 |
|------|------|
| 本步做 `canConnect`／swagger | 牌 3 與 F1；C1 只含 P0 兩支 |
| 碰正式畫布／右側產耗／供水／DeviceShape | 檔案鎖；零交集 |
| 改 store／L1 簽名 | lab 只呼叫 |
| 另開第二 hub／OpenAPI | F1 D-1／D-4 |
| 沿用 `dev/aaaaa1026` | 已合、已消失 |
| 把 `canConnect` 或正式畫布塞進這頁 | 工單原只開版；另令只到 P0 兩題 |

---

## 3. 契約形狀

| 項 | 結論 |
|----|------|
| 本週交付 | 開版文件＋試玩分頁（P0 兩題；教學白話） |
| 全版交付（牌 2–4） | 牌 2 已交；牌 3／全版驗收未做 |
| 頁面 | `/dev/l1-contract-lab` 的「試玩」 |
| 分支 | `dev/aaaaa1102` |
| 解鎖句 | 不發 |
| 時數 | 工單 ≤2h；牌 2 已逾時（另令） |

---

## 4. 本週結束應更新

| # | 動作 | 狀態 |
|---|------|------|
| 1 | todolist 寫明閘門已過、C1 已交、D1 未做 | `[x]` |
| 2 | A0 開頭與 #82 一致 | `[x]` |
| 3 | A1／C1／D1／E1 建檔 | `[x]`（C1 已實作；D1 未做；E1 只到交接） |
| 4 | 決策層 REVIEW／E3／PENDING／INTRO | `[x]` |
| 5 | 會議報告／交接 | `[x]`（`work_dispatch/aaaaa/1102/`） |
| 6 | 文件 PR | `[ ]`（另裁） |
| 7 | 牌 3 `canConnect` | `[ ]` 未做 |

---

## 5. 驗收對照（公開）

以 [WEEK_20261102 §0.2](../../work_dispatch/WEEK_20261102.md) 為準。aaaaa **不在表內**。

| 項 | 對象 | 與本版 |
|----|------|--------|
| V1–V6 | toby／harry／閘門／Device／paper／azure | **零檔案交集** |
| A0 | aaaaa | 原只開版；試玩分頁已交。交不交都不擋別人 |

> 判定實況一律以 `git`／`gh` 為準。

---

## 6. 日誌

### 2026-11-08（v1.8）

- 工單與 WEEK 補進度。會議報告、交接給串接者。E1 不等同全版結案

### 2026-11-08（v1.7）

- 負責人下令 V21-C1；試玩分頁已接真實 `hitTestPortAt`／`findPortAt`

### 2026-11-08（v1.6）

- #82 已合；開 `dev/aaaaa1102`；V21-A1 完成；牌 2 未開工
- 決策層補齊 REVIEW／E3／INTRO（對齊 1026 四件）

### 2026-11-01（v1.5）

- 確認 V21 前提＝V19＋V20 收斂（合 master）；牌 0 改硬閘；當日未收斂

### 2026-11-01（v1.4）

- F1：輕量試玩／非 swagger；V21 A0 牌程 0→4；todolist_v21 草案

### 2026-11-01（v1.3）

- V20-E1：驗收通過；主線結案；PR 另裁

### 2026-11-01（v1.2）

- V20-D1：gap waypoints＋addPipeline／removePipeline；下一＝E1

### 2026-11-01（v1.1）

- V20-C1：findPortAt vs hitTestPortAt、resolveConnections；下一＝D1

### 2026-11-01（v1.0）

- V20-A1 正式開版；下一＝C1
