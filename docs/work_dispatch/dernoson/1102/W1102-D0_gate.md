# W1102-D0｜dernoson｜週閘門

| meta | value |
|------|-------|
| 週次 | 2026-11-02 → 2026-11-08 |
| 等級 | **確定**（決策／合入，不兼功能） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261102](../../WEEK_20261102.md) v1.2、[#83](https://github.com/dernoson/endfield-playground/pull/83#issuecomment-6593699951) |
| 待審上限 | ≤3 |
| 時數 | 自報 **≤2h** |

---

## 1. 本週要守的裁決

| # | 裁示 | 閘門含義 |
|---|------|----------|
| 11/01 會議＋後續 | 其餘照 v1.1。Device 改分檔 | vue＝MBD，故事＝goodmorning，只收一張 PR |
| 旋轉／Delete | **仍退** | 側支若夾帶，拆出 |
| Device | 一張 PR，請 paper 看過再合 | 兩張 Device PR 不收。paper 沒留話就先不合 |
| harry | 只合供水邏輯 | 不併 `cake_toolbar`／`cake_machinecard`／`cake_prodstats` |
| azure | E005 不上右側 | 右側是 toby |
| 「已開 PR」 | 以 `gh` 為準 | 分支上有 commit 不算交 |

---

## 2. 合入序

**T1（產耗）→ H1（供水）→ Device 那一張（等 paper 一句）→ Z1／A0。**

| PR | 看什麼 |
|----|--------|
| T1 | 只動產耗三個檔；表格元件無 store；未改畫布 |
| H1 | `setDevicePrimaryOutput` 參數沒變；清水→`fluid_pipe`；未改左欄版面 |
| Device | 只有一張。vue 是 MBD 的，故事是 goodmorning 的；根 `<g>`；未改 `GridCanvas`；PR 上有 paper |
| Z1 | 只有 E005；未改右側、未改簽名 |
| A0 | 只有 `docs/aaaaa/dev`；沒有試玩畫面 |

---

## 3. 週中主動問

| 人 | 為什麼 | 問什麼 |
|----|--------|--------|
| goodmorning／MBD | Device 分檔 | 是不是同一張 PR；paper 看了沒 |
| toby | 本週右側數據 | 產耗 PR 是否只動那三個檔 |

暫停者不空 ping。不寫功能碼。

---

## 4. DoD

- [ ] OPEN ≤3
- [ ] 旋轉／Delete 未被默許放行
- [ ] 未把 v1.0 的舊負責人合進去
- [ ] 未兼寫功能
