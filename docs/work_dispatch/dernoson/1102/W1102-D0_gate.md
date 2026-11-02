# W1102-D0｜dernoson｜週閘門

| meta | value |
|------|-------|
| 週次 | 2026-11-02 → 2026-11-08 |
| 等級 | **確定**（決策／合入，不兼功能） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261102](../../WEEK_20261102.md) |
| 待審上限 | ≤3（現況 OPEN＝0） |
| 時數 | 自報 **≤2h** |

---

## 1. 本週要守的裁決

| # | 裁示 | 閘門含義 |
|---|------|----------|
| 旋轉／Delete | **仍退** | 側支若夾帶，拆出。不默許放行 |
| harry | 只合產耗切片 | `dev/cake_toolbar`、`dev/cake_machinecard` 不併進 H1 |
| aaaaa | 只合開版文件 | 試玩畫面本週不收 |
| toby | 沒有斜線就不必有 PR | 有 PR 時只准折線，不准旋轉／Delete |
| 「已開 PR」 | 以 `gh` 為準 | 分支上有 commit 不算交 |
| avery | **退出協作** | 不再發工 |

---

## 2. 合入序

**M3（DeviceShape，若開出）→ H1（產耗）→ A0（文件）→ 其餘。**

| PR／分支 | 看什麼 |
|----------|--------|
| M3 | `DeviceShape` 根 `<g>`；無 Pinia；未改 `GridCanvas` |
| H1 | 只動產耗三個檔；`ItemSummaryTable` 無 store；未改畫布與 store 簽名 |
| A0 | 只有 `docs/aaaaa/dev`；沒有試玩畫面 |
| T0 | 只有折線。有旋轉或 Delete 就退 |
| Z0 | 有開才看。未改 `ValidationContext` 簽名、未改右側面板 |

---

## 3. 週中主動問

| 人 | 為什麼 | 問什麼 |
|----|--------|--------|
| MBD | 上週有碼未開 PR | 這週能否開出 |
| harry | 本週主切片 | 產耗 PR 是否只用產耗提交 |

暫停者不空 ping。不寫功能碼。

---

## 4. DoD

- [ ] OPEN ≤3
- [ ] 旋轉／Delete 未被默許放行
- [ ] 未合入 toolbar／machinecard 側支
- [ ] 未兼寫功能
