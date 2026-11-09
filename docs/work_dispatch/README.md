# 每週派工（work_dispatch）

| meta | value |
|------|-------|
| version | **v3.21（2026-11-03；Device 分檔）** |
| 本週區間 | **2026-11-02 → 2026-11-08**（[WEEK_20261102](./WEEK_20261102.md) **v1.0**） |
| 上週區間 | 2026-10-26 → 2026-11-01（[WEEK_20261026](./WEEK_20261026.md) **v1.1**；問卷週 **1026**） |
| 上游 | [ROADMAP_OUTLINE](../roadmap/ROADMAP_OUTLINE.md) **v1.25** |

---

## 0. 先看這裡

| 你想知道 | 打開 |
|----------|------|
| **我這週要交什麼** | 下表 **1102** |
| 這週全隊／驗收 | [WEEK_20261102.md](./WEEK_20261102.md) |
| **檔案鎖** | [WEEK_20261102.md](./WEEK_20261102.md) §2.2 |
| L1 API／詞彙 | [`/dev/l1-contract-lab`](../aaaaa/dev/USAGE_l1_contract_lab.md)、[LAB 指南](./aaaaa/1018/LAB_l1_contract_guide.md) |

### 本週（11/02–11/08｜11/01 會議）

| code | 工單 | 一句話 |
|------|------|--------|
| [toby](./toby/1102/) | [T1](./toby/1102/W1102-T1_stats_panel.md) | 右側產線總覽接實際數據 |
| [harry](./harry/1102/) | [H1](./harry/1102/W1102-H1_water_supply.md) | 水源供給：清水走管道 |
| [goodmorning](./goodmorning/1102/) | [G1](./goodmorning/1102/W1102-G1_device_shape.md) | 設備 Storybook，請 paper 審 |
| [paper](./paper/1102/) | [P3](./paper/1102/W1102-P3_source_panel.md) | 材料供應源的左欄稿 |
| [azure9572](./azure9572/1102/) | [Z1](./azure9572/1102/W1102-Z1_e005.md) | 繼續 E005 |
| [casey](./casey/1102/) | [K0](./casey/1102/W1102-K0_design_orientation.md) | 了解設計現況與目標 |
| [MBD](./MBD/1102/) | [M3](./MBD/1102/W1102-M3_device_shape.md) | 繼續 DeviceShape 本體 |
| [aaaaa](./aaaaa/1102/) | [A0](./aaaaa/1102/W1102-A0_v21_a1_open.md) | 原只開版；試玩分頁已交（見工單 §4） |
| [dernoson](./dernoson/1102/) | [D0](./dernoson/1102/W1102-D0_gate.md) | 守閘 |
| [shirone](./shirone/1102/) | [S0](./shirone/1102/W1102-S0_pause.md) | 長假至 11 月中～底 |

---

## 1. 定案摘要（全員）

1. 上週 **#78、#81、#82 已合**；OPEN＝0
2. **toby＝右側產耗**。harry＝清水走 `fluid_pipe`，不改左欄版面
3. Device 分檔：MBD 寫 vue，goodmorning 寫故事並請 paper 審。paper＝材料供應源的左欄稿
4. azure 繼續 E005，不上右側。casey 只弄清設計現況
5. aaaaa：會議未改派，試玩只開版。shirone：長假
6. **avery 退出協作，不再派工**（[avery/README](./avery/README.md)）
7. 旋轉／Delete **仍退**

---

## 2. 目錄

`1102/`＝本週（對齊問卷週次）；`1026/`／`1018/`／`1011/`／…＝封存。

---

## 3. 本週狀態

| 檔 | 狀態 |
|----|------|
| WEEK_20261102 | **v1.0** |
| ROADMAP_OUTLINE | **v1.25** |
