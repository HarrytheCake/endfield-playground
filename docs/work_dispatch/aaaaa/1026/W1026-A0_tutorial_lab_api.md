# W1026-A0｜aaaaa｜tutorial＋dev Lab／API／詞彙收拾（≤2h）

| meta | value |
|------|-------|
| 週次 | 2026-10-26 → 2026-11-01 |
| 等級 | **確定**（10/25 會議點名） |
| 擋門檻 | 否 |
| 時數上限 | **≤2h**（問卷） |
| 上游 | [WEEK_20261026](../../WEEK_20261026.md) v1.0 |
| 已合參考 | [#79](https://github.com/dernoson/endfield-playground/pull/79)、[USAGE_l1_contract_lab](../../../aaaaa/dev/USAGE_l1_contract_lab.md)、[LAB_l1_contract_guide](../1018/LAB_l1_contract_guide.md)、[ACCEPTANCE_V2](../1018/ACCEPTANCE_V2_c5_chain.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | tutorial／dev 導覽／詞彙／Lab 說明｜`docs/`、`src/app/dev/*`（整理用）｜`LayoutView`／`GridCanvas`（toby #78）｜dernoson（合入） |

---

## 0. 白話目標

10/25 會議兩件事：

1. **更新 tutorial**（新 clone 跟得上現況）
2. **整理 dev 介面與 Lab、相關 API 收拾**（含專用詞彙白話）

上週 #79 已把 L1 contract lab 合入——本週不是重做引擎，是讓**下游查得到、看得懂、串得上**。

| # | 件 | 為什麼 |
|---|----|--------|
| ① | Tutorial 對齊現況（換殼／拖曳／C5／lab 入口） | 會議 |
| ② | Lab／API／詞彙索引可查（USAGE↔LAB↔DevLayout） | 會議公告＋問卷自報 |

---

## 1. 必做

1. Tutorial：最短路徑寫清「開 dev → lab → 正式頁能做什麼」；過時步驟刪或改。
2. `/dev/l1-contract-lab`：DevLayout 入口、USAGE、LAB 指南互相有連結；拗口詞有高中～大學程度白話（可併進既有指南，不必另開巨檔）。
3. API 展示與 master 契約一致；發現過時註記就改，**不大包重構**。

---

## 2. 不要做

- 改 #78 鎖檔（`LayoutView`／`GridCanvas`）
- 改 `editorStore`／`layoutStore` 簽名（除非修 lab 演示必要的一行，先問 D0）
- 整包右側產耗、正式頁源素材表單
- 再寫長篇派工當第二主交付

---

## 3. DoD

- [x] tutorial 可跟做（[tutorial/l1-contract-lab/usage.md](../../../tutorial/l1-contract-lab/usage.md)；與 lab「入門」／USAGE／LAB 互連）
- [x] `/dev/l1-contract-lab` 從 DevLayout 找得到
- [x] 詞彙／API 說明有白話入口
- [x] 未改 C1 鎖檔
