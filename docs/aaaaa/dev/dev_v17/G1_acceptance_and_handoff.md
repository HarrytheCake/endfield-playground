# V17-G1 — 驗收、PR、交接

**對應工項：** V17-G1
**狀態：** `[~]` 品質閘全綠；PR 交審中
**日期：** 2026-10-18
**依賴：** [D1](./D1_validation_id_lookup.md)、[E1](./E1_flow_engine_id_lookup.md)、[F1](./F1_engine_topology_slice.md)
**正式依據：** [#73](https://github.com/dernoson/endfield-playground/issues/73) 驗收

---

## 1. 驗收表（實作後填）

| # | 步驟 | 預期 | 結果 |
|---|------|------|------|
| 1 | `pnpm test` | 綠 | ✅ 53 files／961 tests |
| 2 | `pnpm type-check`／lint／format | 綠 | ✅（format 補修 F1 測試檔後全綠） |
| 3 | E004／W001 英文 id 測 | 有警示 | ✅ T10（E004）／T19（W001） |
| 4 | toTopology→引擎 30/min 測 | 過 | ✅ `flowEngine.topology.layout.test.ts` |
| 5 | 手動／煙測 `/dev/validation-test`、`/dev/flow-engine-test` | 仍可運作 | ⚠️ 未開瀏覽器手動；中文名 fixture 回歸測＋type-check 綠代驗，待 reviewer 實測 |
| 6 | 未改 editorStore 簽名；未重開 W001 A-5 | 成立 | ✅ `editorStore` 零 diff；W001 只改查表 |

---

## 2. PR（預定）

| 項 | 內容 |
|----|------|
| 標題 | `fix(#73)：機型查表英文 id＋toTopology 引擎最小切片（V17）` |
| 分支 | `dev/aaaaa1018` → `master` |
| 關聯 | Closes #73；Refs #72／#57 |
| 解鎖句 | **不發** |

### 2.1 PR body 必含

```text
## Summary
- resolveMachineDef＠machines.ts：byId ?? byName（過渡；註明移除時機）
- 驗證 getDef／E004／W001 查表對齊；配方仍 machineDef.name；A-5 未動
- 引擎查定義改 id；經 toTopology 測試餵入（A 必交）

## 下游
- 正式頁改讀 layoutStore 後，E004／W001／引擎不再「全查無」
- azure：偵測器僅查表路徑變更，A-5 語意未動（請知悉）

不做：右側產耗整包、廢 getMachine、源素材表單 UI。
不發解鎖句。
```

---

## 3. 交接

| 產物 | 對象 |
|------|------|
| `resolveMachineDef` | 全專案查表 |
| 驗證／引擎可吃英文 id | 正式頁遷 layoutStore |
| toTopology 測試產線 | M3 演示前置 |

---

## 4. 合入後回寫

- [ ] todolist_v17 結案
- [ ] AGENT_WEEK_1018
- [ ] 關閉 #73
- [ ] ROADMAP C5／相關句（若適用）

---

## 5. DoD

- [x] §1 通過（#5 待 reviewer 手動）
- [ ] PR 已開
- [ ] #73 驗收項可勾

---

## 6. 開發日誌

### 2026-10-18｜驗收

- 品質閘四項全綠（961 tests）；F1 測試檔 prettier 補修
- `/dev` 頁未手動驗；PR body 請 reviewer 實測
- 本版 F1＝A（測試餵入）；B（`/dev` 掛載）未做

### 2026-10-18

- 建檔
