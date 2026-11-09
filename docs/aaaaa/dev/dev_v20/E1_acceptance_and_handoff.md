# V20-E1 — 驗收、USAGE／交接

**對應工項：** V20-E1
**狀態：** `[x]` 完成（2026-11-01；主線驗收通過；**PR 待裁**）
**日期：** 2026-11-01
**依賴：** [C1](./C1_port_resolve_demos.md) `[x]`、[D1](./D1_pipeline_gap_demos.md) `[x]`
**對照：** [F0 §6 DoD](../dev_v19/F0_next_catalog_batch.md)、[V19-E1 維運](../dev_v19/E1_ops_rules_and_handoff.md)
**開發分支：** `dev/aaaaa1026`

---

## 1. 驗收表（本批）

| # | 步驟 | 預期 | 結果 |
|---|------|------|------|
| 1 | lab 可點測 findPortAt 對照熱區 | 文案清楚；真呼叫 | **通過**（V15「findPortAt vs hitTestPortAt」） |
| 2 | lab 可點測 resolveConnections | JSON／結果可讀 | **通過**（V15「resolveConnections（對齊／斷線）」） |
| 3 | lab 可點測 add／removePipeline（隔離 Pinia） | 寫入不污染正式 store | **通過**（V16；`withLabPinia`） |
| 4 | lab 可點測 buildGapConnectionWaypoints | inventory 有列且 listed | **通過**（V15 鈕＋inventory 新列） |
| 5 | 相對簽名／畫布 | 無業務 diff | **通過**（相對 master 僅 `docs/`＋`src/app/dev/*`） |
| 6 | type-check／lint／format | 綠 | **通過**（E1 當日重跑） |

F0 §2.3 全量（佔格／snapshot／detectors…）**未做**（符合範圍）。

---

## 2. 回寫清單

- [x] todolist_v20 主線／日誌
- [x] USAGE／LAB 易踩雷句
- [x] AGENT_WEEK_1102
- [x] 決策層 1102 日誌
- [ ] （若有）公開 WEEK／工單編號回填 A1／todolist meta — **尚無公開檔；待補**

---

## 3. 交接產物

| 產物 | 對象 | 一句話 |
|------|------|--------|
| lab V15／V16 新案例 | L2／無經驗協作者 | 熱區≠錨點；連線解析；gap；管線寫入可自測 |
| inventory 本批 listed | 後續 catalog | F0 四項＋gap 已清；其餘 todo 再下一刀 |
| [F0](../dev_v19/F0_next_catalog_batch.md) §6 | 週結 | 實作 DoD 勾完；E1 驗收表通過 |
| [F1 試玩決策](./F1_tryout_not_swagger.md) | V21 | **輕量可調參**；不做完整 swagger；牌程見 [A0](../dev_v21/A0_tryout_panel_plan.md) |

建議 PR 範圍（與 V19 同線 `dev/aaaaa1026`；**開／拆 PR 另裁**）：

```text
標題建議：L1 Hub：V19 MVP＋V20 catalog 第一刀（findPortAt／resolveConnections／gap／addPipeline）

下游消費者：
- L2／無經驗協作者：lab 可點測熱區 vs 錨點、resolveConnections、gap waypoints、addPipeline
- 後續 catalog：沿同一 /dev/l1-contract-lab；勿另開第二 hub
不發解鎖句；未改 LayoutView／GridCanvas／store／L1 簽名。
```

---

## 4. DoD

- [x] §1 驗收表通過
- [x] F0 §6 本批勾完；未做 §2.3 全量
- [x] 不發解鎖句
- [x] 主線完成；PR 時機另裁

---

## 5. 開發日誌

### 2026-11-01｜F1 下一批決策

- 輕量試玩／非 swagger；牌程交 [todolist_v21](../todolist_v21.md)

### 2026-11-01｜完成

- 驗收表填過；USAGE／LAB／AGENT／todolist 結案回寫
- **開 PR 待負責人裁**（可與 V19 同 PR）

### 2026-11-01

- 開版建檔
