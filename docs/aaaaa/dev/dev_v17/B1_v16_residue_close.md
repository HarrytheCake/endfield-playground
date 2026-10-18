# V17-B1 — V16 殘項收斂

**對應工項：** V17-B1
**狀態：** `[x]` 完成（2026-10-18）
**日期：** 2026-10-18
**依賴：** 無（開版前置）
**目的：** 確認 V16／#72 已在 master，避免文件仍寫「交審中」
**開發分支：** `dev/aaaaa1018`

---

## 1. 查證清單（2026-10-18 實查）

| # | 查什麼 | 預期 | 實況 | 判定 |
|---|--------|------|------|------|
| 1 | PR #72 狀態 | MERGED | `gh`：MERGED 2026-10-18T06:54:12Z；主編 APPROVED | **成立** |
| 2 | `origin/master` 有 `setDevicePrimaryOutput` | 有 | `layoutStore.ts` 含 action；測試檔在樹 | **成立** |
| 3 | todolist_v16 狀態 | 結案 | 已改 `[x]`；E1 指向 MERGED | **成立** |
| 4 | V17 是否重做 V16 | **否** | 本版不做 primaryOutput action；範圍＝#73＋引擎讀 | **成立** |

### 1.1 一併收斂

| 檔 | 動作 |
|----|------|
| [todolist_v16](../todolist_v16.md) | 狀態總覽／E1／日誌 |
| [V16-E1](../dev_v16/E1_acceptance_and_handoff.md) | `[x]` MERGED |

### 1.2 續掛（不擋 V17；併本版或之後）

| ID | 說明 |
|----|------|
| C5 寫入端 roadmap 勾選 | 可併 V17 PR 回寫 |
| WEEK V8 勾選 | 主編結算 |
| #72 審查備註 | `ratePerMin` 有限正數檢查＝11 月；同值不推歷史＝左面板呼叫端 |

---

## 2. DoD

- [x] §1 以 `git`／`gh` 核過
- [x] todolist_v17 寫明 V16 已合
- [x] 無「重做 setDevicePrimaryOutput」漂移

---

## 3. 開發日誌

### 2026-10-18｜完成

- #72 MERGED 查證；收斂 v16 meta；下一＝C1
