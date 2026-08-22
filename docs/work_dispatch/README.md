# 每週派工（work_dispatch）

| meta | value |
|------|-------|
| version | v2.0（2026-08-23；公開版） |
| 用途 | 把 roadmap 的週切片，落成**每人一份、可照著做**的工單 |
| 本週區間 | **2026-08-23（日）→ 2026-08-30（日）**（M1 對齊月第一週） |
| 性質 | 工作指派與引導文件；**不是**績效評核 |
| 上游 | [roadmap/ROADMAP_OUTLINE.md](../roadmap/ROADMAP_OUTLINE.md)、[roadmap/detail/](../roadmap/detail/) |

---

## 0. 先看這裡：我要讀哪一份？

| 你想知道 | 打開 |
|----------|------|
| **我這週要交什麼** | 下面表格找自己的代號 |
| 這週全隊在做什麼、什麼是門檻 | [WEEK_20260823.md](./WEEK_20260823.md) |
| 到 11/29 的整體計畫 | [roadmap/ROADMAP_OUTLINE.md](../roadmap/ROADMAP_OUTLINE.md) |
| 某個工項的技術決策與驗收標準 | [roadmap/detail/](../roadmap/detail/) |

### 本週（8/23–8/30）每人的工單

| code | 你的工單 | 一句話 | 附帶教學檔 |
|------|----------|--------|------------|
| [aaaaa](./aaaaa/) | [W0823-A1](./aaaaa/W0823-A1_grid_port_alignment.md) | 佔格與 port 對齊真實資料＋錯機清單 | － |
| [dernoson](./dernoson/) | [W0823-D0](./dernoson/W0823-D0_announce_and_merge_gate.md) | 公告基準、發工單、守合入佇列 | － |
| [shirone](./shirone/) | [W0823-S1](./shirone/W0823-S1_e001_device_overlap.md) | E001 設備重疊純函式＋測試 | [座標陷阱與測試骨架](./shirone/GUIDE_e001_context_pitfalls.md) |
| [paper](./paper/) | [W0823-P1](./paper/W0823-P1_visual_three_panels.md) | 三塊畫面視覺基準＋關鍵 frame | － |
| [toby](./toby/) | [W0823-T1](./toby/W0823-T1_placement_footprint_size.md) | 節點外框吃真實 `width`×`height` | [佔格尺寸三個坑](./toby/GUIDE_node_footprint_notes.md) |
| [harry](./harry/) | [W0823-H1](./harry/W0823-H1_connect_tool_shortcut.md) | P 鍵／Navbar 切換管線工具 | [快捷鍵衝突](./harry/GUIDE_shortcut_conflicts.md) |
| [goodmorning](./goodmorning/) | [W0823-G1](./goodmorning/W0823-G1_machine_card_mock.md) | 機器卡片單檔 mock（DL 8/28） | [完整 .vue 樣板](./goodmorning/GUIDE_machine_card_template.md) |
| [avery](./avery/) | [W0823-V1](./avery/W0823-V1_env_and_viewswitcher.md) | 環境跑通＋ViewSwitcher 單檔 | [Windows 環境逐步](./avery/GUIDE_env_setup_windows.md) |
| [MBD](./MBD/) | [W0823-M1](./MBD/W0823-M1_item_summary_empty_state.md) | ItemSummaryTable 空狀態 | [空狀態片段](./MBD/GUIDE_empty_state_snippet.md) |
| [azure9572](./azure9572/) | [W0823-Z1](./azure9572/W0823-Z1_w001_converge.md) | W001 草稿收斂為單一 PR | [W001 撿檔步驟](./azure9572/GUIDE_w001_cherry_pick.md) |

---

## 1. 目錄結構

```text
docs/
├── roadmap/                  ← 到 11/29 要做什麼、怎麼驗收
└── work_dispatch/
    ├── README.md             ← 本檔（總說明＋本週索引）
    ├── WEEK_20260823.md      ← 本週派工大綱：全員總表、門檻、配對名額
    └── <代號>/
        ├── W0823-*.md        ← 你的工單：要交什麼、怎麼開工、卡住找誰
        └── GUIDE_*.md        ← （視需要）技術註記／逐步教學／可複製樣板
```

| 規則 | 說明 |
|------|------|
| 一人一資料夾 | 資料夾名＝你在 Discord／git 上的代號 |
| 檔名 | `WMMDD-<代號縮寫><序號>_短名.md`，例如 `W0823-T1_placement_footprint_size.md` |
| 空窗／暫停 | 該週若標「暫停」，資料夾保留，放一份短檔說明原因與復工條件 |
| 教學／技術註記 | 同資料夾內另開 `GUIDE_<主題>.md`；工單維持「要交什麼」，GUIDE 放「怎麼做、有什麼坑」 |

---

## 2. 工單怎麼讀

每份工單都是同樣的骨架，其中**四欄是核心**：

| 欄 | 意思 |
|----|------|
| **畫面** | 做完之後，使用者在螢幕上看到什麼（30 秒就能驗收的那種） |
| **交哪個檔** | 精確到路徑的檔案清單；路徑寫死就照著建，不要改名 |
| **不要碰** | 本週明確不屬於你的檔案與範圍（多半是為了避免同週撞檔） |
| **卡住找誰** | 對應的人；卡住直接問，不要自己硬撐一整週 |

其餘固定區塊：meta（週次、對應 roadmap ID、是否擋門檻、預估時數）、開工前檢查、步驟、DoD、未交時怎麼辦、回報方式。

**工單裡的「不要碰」不是不信任你**，而是同一週有多人改前端，先把檔案分開才不會互相覆蓋。

---

## 3. 派工原則（本週適用）

| 原則 | 說明 |
|------|------|
| 一人一週一種性質 | 同一週不會同時派給你「畫布互動」和「純函式測試」 |
| 擋門檻的工項只派給該領域已有交付紀錄的人 | 其餘一律標「加分」，未交不計失敗 |
| 加分項未交不影響任何人 | 每份工單都寫了頂替方案；回一句「本週不做」就結案 |
| 同週不改同一檔 | 例如 toby 動 canvas／overlay 時，harry 就改 shortcuts／Navbar |
| 配對名額每週 ≤ 2 | 需要有人陪著做的名額有限，其餘走非同步（Discord 文字） |
| 待審 PR 建議 ≤ 3 | 超過就標「延壓」排下週，避免合入塞車 |
| 工單不得發明 roadmap 沒有的工作 | 範圍變動要先改 roadmap，再改工單 |

---

## 4. 更新節奏

| 時機 | 動作 |
|------|------|
| 每週日會前 | 產出下一週 `WEEK_YYYYMMDD.md` 與各人細項 |
| 週中（三／四） | Discord 問一句進度；不改已發工單的範圍（除非主編同意） |
| 週日會後 | 回寫完成狀態，並在對應 roadmap detail 的開發日誌補一筆 |

---

## 5. 本週狀態

| 檔 | 狀態 |
|----|------|
| [WEEK_20260823.md](./WEEK_20260823.md) | **v1.3 定稿**（10 人細項齊，已二次複查） |
| 10 份個人工單 | 全部已寫 |
| 附加教學檔 | 7 份（shirone、toby、harry、goodmorning、avery、MBD、azure9572） |

> 本資料夾為公開文件，全員可讀、可在 PR 討論。若你發現自己的工單寫錯了（路徑不存在、依賴的檔案已改名、時間明顯不合理），直接在 Discord 說或開 PR 改——工單寫錯比做錯更早該被抓出來。
