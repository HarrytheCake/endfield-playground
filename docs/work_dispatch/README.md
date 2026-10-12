# 每週派工（work_dispatch）

| meta | value |
|------|-------|
| version | **v3.13（2026-10-12；W1011 依 10/11 會議重派）** |
| 本週區間 | **2026-10-11 → 2026-10-18**（[WEEK_20261011](./WEEK_20261011.md) **v1.1**） |
| 上週區間 | 2026-10-04 → 2026-10-11（[WEEK_20261004](./WEEK_20261004.md) v1.2；**已結算**） |
| 上游 | [ROADMAP_OUTLINE](../roadmap/ROADMAP_OUTLINE.md) **v1.17** |

---

## 0. 先看這裡

| 你想知道 | 打開 |
|----------|------|
| **我這週要交什麼** | 下表 **1011** |
| 這週全隊／驗收 | [WEEK_20261011.md](./WEEK_20261011.md) |
| **檔案鎖（暫停中也適用）** | [WEEK_20261011.md](./WEEK_20261011.md) §2.2 |

### 本週（10/11–10/18）

| code | 工單 | 一句話 |
|------|------|--------|
| [toby](./toby/1011/) | [T2](./toby/1011/W1011-T2_device_drag.md) | 設備拖曳接進正式畫面 |
| [aaaaa](./aaaaa/1011/) | [A0](./aaaaa/1011/W1011-A0_c5_primary_output.md) | 派工已發；C5 `setDevicePrimaryOutput` |
| [harry](./harry/1011/) | [H2](./harry/1011/W1011-H2_left_panel_swap.md) | 刪舊左側面板、接 `MachineCard`；右／下等合入 |
| [dernoson](./dernoson/1011/) | [D0](./dernoson/1011/W1011-D0_gate_c1.md) | 守閘；清 #64／#62／#48；**裁 C1 owner** |
| [goodmorning](./goodmorning/1011/) | [G2](./goodmorning/1011/W1011-G2_pr48_and_device_style.md) | #48 解 conflict 合入＋畫布設備樣式 |
| [shirone](./shirone/1011/) | [S2](./shirone/1011/W1011-S2_pr62_and_pipeline_style.md) | #62 待 approve 合入＋傳送帶／水管樣式 |
| [paper](./paper/1011/) | [P2](./paper/1011/W1011-P2_pipeline_select.md) | 管線點選效果稿；審 #62 |
| [MBD](./MBD/1011/) | [M2](./MBD/1011/W1011-M2_warning_icon.md) | 管線未連通警示 icon |
| [azure9572](./azure9572/1011/) | [Z2](./azure9572/1011/W1011-Z2_pr64_fix.md) | #64 審查修正＋W001 決議 |
| [avery](./avery/1011/) | [V1](./avery/1011/W1011-V1_power_pole_style.md) | 供電樁畫布樣式 |

---

## 1. 定案摘要（全員）

1. W1004 換殼／無邊界／出界／埠命中**已合**；**本週依 10/11 會議重派**：設備拖曳＋左面板換新＋畫布樣式
2. **C1 會議未派 → owner 待裁**（最快 10/18 週）；命中函式已在 master（#65）
3. C5 本週只交 **寫入 action**；引擎讀＝10/18
4. 畫布樣式一律做 `shapes/` 子元件，不改 `GridCanvas`；旋轉／Delete 仍不開
5. azure／avery 考試、**shirone 本月學 Python**：照會議派，但各單有「最小可交」
6. 合入序：#64 → #62 → #48 → T2 → H2 → A0 → 樣式子元件
7. **M3＝10/25 不動**

---

## 2. 目錄

`1011/`＝本週；`1004/`／`0921/`／`0914/`／…＝封存。

---

## 3. 本週狀態

| 檔 | 狀態 |
|----|------|
| WEEK_20261011 | **v1.1** |
| ROADMAP_OUTLINE | **v1.17** |
