# V19-A1 — 範圍與定案

**對應工項：** V19-A1
**狀態：** `[x]` 完成（2026-11-01｜開版定案）
**日期：** 2026-11-01
**開發分支：** `dev/aaaaa1026`
**正式依據：** [W1026-A0](../../../work_dispatch/aaaaa/1026/W1026-A0_tutorial_lab_api.md)、[WEEK_20261026](../../../work_dispatch/WEEK_20261026.md) v1.1、[todolist_v19](../todolist_v19.md)

> **執行計畫：** 本檔所屬之 `todolist_v19`＋`dev_v19/` **即為**本週 aaaaa 執行計畫檔。

---

## 1. 背景

### 1.1 問卷週 1026＝#78 合入收尾＋文件／Lab

全隊優先曾是 toby 收斂 [#78](https://github.com/dernoson/endfield-playground/pull/78)；開版當日（2026-11-01）**#78 已 MERGED**（2026-10-31）。aaaaa 正式工單＝tutorial＋dev Lab／API／詞彙收拾（問卷 ≤2h）。

上週 [#79](https://github.com/dernoson/endfield-playground/pull/79) 已合 L1 contract lab——本週不是重做引擎，是讓**下游查得到、看得懂、串得上**。

### 1.2 為什麼是 V19 不是續掛 V18

V18＝W1018-A0（M3 驗收步驟＋lab 合入），已合 #79。本週是新工單 W1026-A0，性質從「M3 證明／lab 合入」改為「Hub MVP／教學／詞彙／可點測」→ 新版本號。

### 1.3 工單 ≤2h vs 長期 Hub

工單原文偏「收拾互連、不大包重構」。負責人方向＝類 swagger 的 L1 串接＋教學（下游多無開發經驗）。**已決本周＝MVP 骨架**，全量與自動同步後續；並**接受超標**於本周骨架品質。

---

## 2. 最終決策（2026-11-01｜負責人）

| # | 決策 | 落點 |
|---|------|------|
| A-1 | **C＝MVP hub 骨架**（目錄＋詞彙＋可點測少數 API）；全量 catalog 後續週 | [C1](./C1_hub_skeleton.md)、[D1](./D1_clickable_api_samples.md)；後續切片 [F0](./F0_next_catalog_batch.md)／[todolist_v20](../todolist_v20.md) |
| A-2 | 長期邊界＝**layout utils ＋ layoutStore 公開 action ＋（可選）驗證／引擎 adapter** | C1 inventory；全量列後續 |
| A-3 | 頁面＝**延續並強化** `/dev/l1-contract-lab`（單一真相） | C1／D1 |
| A-4 | 自動顯示＝**本周不做**；只寫後續維運規則 | [E1](./E1_ops_rules_and_handoff.md) |
| A-5 | Tutorial＝**教學主要在 lab 頁內**（給無經驗者優先） | C1 |
| A-6 | 分支＝**`dev/aaaaa1026`** | meta |
| A-7 | 時數＝問卷 ≤2h；**接受本周超標** | 本檔／AGENT_WEEK |
| — | **不發**解鎖句 | E1 |
| — | 不碰正式畫布業務；不改 store／L1 簽名 | AGENT_WEEK 禁止表 |
| — | **V19 實作開工條件＝V18 收斂**（B1） | [B1](./B1_v18_residue_close.md) |
| — | **本專案收斂前不開任何 PR** | AGENT_WEEK／todolist |

### 2.1 為什麼選 C（MVP）而不是全量

全量 catalog（A-2 邊界）遠超工單「不大包重構」；先立**單一真相源＋目錄骨架＋詞彙＋少數可點測**，後續週只擴 `contractCatalog`／演示，不另開第二 hub。

### 2.2 為什麼不另開路由

A-3＝單一真相。第二路由會讓 USAGE／LAB／DevLayout 再分叉；MVP 期間強化既有頁即可。

### 2.3 為什麼本周不做自動同步

自動 codegen／掃註解屬基礎設施，易超範圍且需契約先穩。本周只訂「新 L1 怎麼進 hub」人工維運規則（A-4＝C）。

---

## 3. 與既有版本／工單邊界

| 對象 | 關係 |
|------|------|
| V18／#79 | 已合；本版 B1 收斂文件；lab 頁為本版改動基線 |
| #78 | **已合**；本版**不**改 LayoutView／GridCanvas 業務 |
| W1026-A0 | 本版 C1／D1／E1＝其實作 DoD |
| harry H1（C5 表單） | 可非同步問 action；本版零檔案交集（只文件／lab） |
| MBD／paper／toby | DeviceShape／P2／畫布——**零檔案交集** |

---

## 4. 非目標

見 [todolist_v19](../todolist_v19.md)「非目標」。

---

## 5. DoD（本細項）

- [x] §2 決策與 todolist 概述一致（A-1～A-7）
- [x] §3 邊界表含 V18／#78／H1／畫布
- [x] 明文「不發解鎖句」與分支／超標

---

## 6. 開發日誌

### 2026-11-01｜負責人確認

- A-1＝C；A-2＝layout utils＋layoutStore＋可選驗證／引擎；A-3＝強化既有 lab；A-4＝只寫維運；A-5＝頁內教學；A-6＝`dev/aaaaa1026`；A-7＝接受超標

### 2026-11-01

- 開版定案；對齊 WEEK v1.1／W1026-A0
