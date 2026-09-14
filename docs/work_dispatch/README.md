# 每週派工（work_dispatch）

| meta | value |
|------|-------|
| version | **v3.5（2026-09-15；PR #49 勘誤：S1＝產線總覽、M2 恢復硬綁 B1）** |
| 本週區間 | **2026-09-14 → 2026-09-20**（[WEEK_20260914](./WEEK_20260914.md) **v1.1**） |
| 上週區間 | 2026-09-07 → 2026-09-13（[WEEK_20260907](./WEEK_20260907.md)） |
| 上游 | [ROADMAP_OUTLINE](../roadmap/ROADMAP_OUTLINE.md) **v1.9**、主編 PR #49 review |

---

## 0. 先看這裡

| 你想知道 | 打開 |
|----------|------|
| **我這週要交什麼** | 下表 **0914** |
| 這週全隊／驗收 | [WEEK_20260914.md](./WEEK_20260914.md) |
| 檔案鎖 | [WEEK_20260914.md](./WEEK_20260914.md) §3 |

### 本週（9/14–9/20）

| code | 工單 | 一句話 |
|------|------|--------|
| [aaaaa](./aaaaa/0914/) | [**A0（最優）**](./aaaaa/0914/W0914-A0_layout_store_land.md) | #45 收尾合入（T1 前置） |
| | [A1](./aaaaa/0914/W0914-A1_connection_blueprint_contract.md) | C2／D4 草案（可超前） |
| [dernoson](./dernoson/0914/) | [D0](./dernoson/0914/W0914-D0_gate_and_main_view.md) | 清積壓；守閘 |
| [toby](./toby/0914/) | [**T1**](./toby/0914/W0914-T1_main_view_integration.md) | #45 合入後掛 GridCanvas（只讀） |
| [harry](./harry/0914/) | [H1](./harry/0914/W0914-H1_viewport_into_canvas.md) | #47 收尾＋接面說明 |
| [shirone](./shirone/0914/) | [S1](./shirone/0914/W0914-S1_stats_panel_land.md) | **產線總覽** StatsPanel → `src/app/` |
| [goodmorning](./goodmorning/0914/) | [G1](./goodmorning/0914/W0914-G1_toolbar_land.md) | #48 收尾；ToolbarPanel 限視覺 |
| [paper](./paper/0914/) | [P1](./paper/0914/W0914-P1_review_and_polish.md) | 審 #48／S1；命名已結案 |
| [avery](./avery/0914/) | [V0](./avery/0914/W0914-V0_pause.md) | 暫停（亞運） |
| [azure9572](./azure9572/0914/) | [Z0](./azure9572/0914/W0914-Z0_pause.md) | 暫停 |
| [MBD](./MBD/0914/) | [M0](./MBD/0914/W0914-M0_pause.md) | 暫停；9/21 StatsPanel 文案 |

---

## 1. 定案摘要（全員）

1. 佈局視角改掛 `GridCanvas`；舊殼保留不刪  
2. **只讀**；B2／B4 等底層接完（不硬綁進 9/27）  
3. T1：**#45 合入後開工**  
4. 視角切換器照稿；**下週另派人**（非 Avery）  
5. 右側＝**產線總覽 StatsPanel** → `src/app/StatsPanel/`（不是設備資訊）  
6. `ToolbarPanel` 對 goodmorning 限視覺解鎖  
7. **9/27 硬綁 B1**  
8. 合入序：#45 → #47 → #48 → T1 → S1  

---

## 2. 目錄

`0914/`＝本週；`0907/`＝上週；`0831/`／`0823/`＝封存。

---

## 3. 本週狀態

| 檔 | 狀態 |
|----|------|
| WEEK_20260914 | **v1.1** |
| ROADMAP_OUTLINE | **v1.9** |
