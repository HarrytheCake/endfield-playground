# 每週派工（work_dispatch）

| meta | value |
|------|-------|
| version | **v3.4（2026-09-14；0914 發工：主畫面接入＋M2 必要項擴大）** |
| 本週區間 | **2026-09-14 → 2026-09-20**（[WEEK_20260914](./WEEK_20260914.md)） |
| 上週區間 | 2026-09-07 → 2026-09-13（[WEEK_20260907](./WEEK_20260907.md)；實績見該檔與 roadmap §9.1） |
| 上游 | [ROADMAP_OUTLINE](../roadmap/ROADMAP_OUTLINE.md) **v1.8**、09/13 會議紀錄＋主編 09/14 裁決 |

---

## 0. 先看這裡

| 你想知道 | 打開 |
|----------|------|
| **我這週要交什麼** | 下表 **0914** |
| 這週全隊／驗收 | [WEEK_20260914.md](./WEEK_20260914.md) |
| 檔案鎖（誰能改哪支檔） | [WEEK_20260914.md](./WEEK_20260914.md) §3 |
| 上週實績 | [WEEK_20260907.md](./WEEK_20260907.md)＋[ROADMAP_OUTLINE](../roadmap/ROADMAP_OUTLINE.md) §9.1 |

### 本週（9/14–9/20）

| code | 工單 | 一句話 |
|------|------|--------|
| [aaaaa](./aaaaa/0914/) | [**A0（最優・擋門檻）**](./aaaaa/0914/W0914-A0_layout_store_land.md) | #45 收尾並**合入 master** |
| | [A1（次優・可延）](./aaaaa/0914/W0914-A1_connection_blueprint_contract.md) | C2／D4 重訂草案 |
| [dernoson](./dernoson/0914/) | [D0](./dernoson/0914/W0914-D0_gate_and_main_view.md) | 清積壓；放行主畫面接入 |
| [toby](./toby/0914/) | [**T1（主戲・擋門檻）**](./toby/0914/W0914-T1_main_view_integration.md) | 新畫布接上主畫面（只讀＋切換退路） |
| [harry](./harry/0914/) | [H1](./harry/0914/W0914-H1_viewport_into_canvas.md) | #47 收尾＋交出容器接面 |
| [shirone](./shirone/0914/) | [S1](./shirone/0914/W0914-S1_device_info_panel.md) | 設備資訊面板 L3 元件（不押死線） |
| [goodmorning](./goodmorning/0914/) | [G1](./goodmorning/0914/W0914-G1_toolbar_land.md) | 收尾並合入 #48；`ToolbarPanel` 限視覺解鎖 |
| [paper](./paper/0914/) | [P1](./paper/0914/W0914-P1_review_and_polish.md) | 審 #48／S1；補交命名＋排版概念 |
| [avery](./avery/0914/) | [V0](./avery/0914/W0914-V0_pause.md) | 暫停（亞運）＋續留 |
| [azure9572](./azure9572/0914/) | [Z0](./azure9572/0914/W0914-Z0_pause.md) | 暫停（請假） |
| [MBD](./MBD/0914/) | [M0](./MBD/0914/W0914-M0_pause.md) | 暫停（假第二週）；9/21 起接 B4 空狀態 |

---

## 1. 定案摘要（全員必讀）

1. **佈局視角改掛新 `GridCanvas`**；舊 `FactoryCanvas` 保留不刪、不再是入口，容器留切換開關
2. **本週互動仍只讀**：擺放（B2）／選取（B4）**排 9/21**，搶跑即退回
3. **L2 檔案切分**：toby＝主畫面容器；harry＝viewport。**同檔退回後到者**
4. **`ToolbarPanel.vue` 本週對 goodmorning 限視覺解鎖**，其餘全員不動
5. **L2 不再以 Storybook 當驗收現場**（改主畫面／`/dev` 頁）；**L3 仍保留 story**
6. **9/27 必要項擴大為 B1＋B2＋B4**（主編 9/14 裁）；承擔與頂替見 [WEEK_20260914](./WEEK_20260914.md) §2.1
7. 合入順序：**#45 → #47 → #48 → T1 → S1**；待審 ≤3

---

## 2. 目錄

`0914/`＝本週；`0907/`＝上週；`0831/`／`0823/`＝封存。舊週工單只讀，修訂一律寫進當週日誌，不改寫原條文。

---

## 3. 本週狀態

| 檔 | 狀態 |
|----|------|
| WEEK_20260914 | **v1.0（本週）** |
| WEEK_20260907 | v1.1（已結案） |
| ROADMAP_OUTLINE | **v1.8** |
| personal_profile/README | **v2.9** |
