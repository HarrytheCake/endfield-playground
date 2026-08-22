# 文件導覽

這裡放**全員共用**的專案文件。三個問題，三個入口：

| 你想知道 | 打開 |
|----------|------|
| **我這週要交什麼** | [work_dispatch/](./work_dispatch/) → 找自己的代號資料夾 |
| 這週全隊在做什麼、什麼是月底門檻 | [work_dispatch/WEEK_20260823.md](./work_dispatch/WEEK_20260823.md) |
| 到 11/29 的整體計畫與各工項驗收標準 | [roadmap/ROADMAP_OUTLINE.md](./roadmap/ROADMAP_OUTLINE.md) |

---

## 1. 本週（2026-08-23 → 08-30）我的工單

| 你是 | 直接點這裡 |
|------|------------|
| aaaaa | [W0823-A1 佔格與 port 對資料](./work_dispatch/aaaaa/W0823-A1_grid_port_alignment.md) |
| dernoson | [W0823-D0 公告基準＋合入守門](./work_dispatch/dernoson/W0823-D0_announce_and_merge_gate.md) |
| shirone | [W0823-S1 E001 設備重疊純函式](./work_dispatch/shirone/W0823-S1_e001_device_overlap.md) |
| paper | [W0823-P1 三塊畫面視覺基準](./work_dispatch/paper/W0823-P1_visual_three_panels.md) |
| toby | [W0823-T1 節點佔格吃真實尺寸](./work_dispatch/toby/W0823-T1_placement_footprint_size.md) |
| harry | [W0823-H1 P 鍵切換管線工具](./work_dispatch/harry/W0823-H1_connect_tool_shortcut.md) |
| goodmorning | [W0823-G1 機器卡片 mock](./work_dispatch/goodmorning/W0823-G1_machine_card_mock.md) |
| avery | [W0823-V1 環境跑通＋ViewSwitcher](./work_dispatch/avery/W0823-V1_env_and_viewswitcher.md) |
| MBD | [W0823-M1 ItemSummaryTable 空狀態](./work_dispatch/MBD/W0823-M1_item_summary_empty_state.md) |
| azure9572 | [W0823-Z1 W001 草稿收斂](./work_dispatch/azure9572/W0823-Z1_w001_converge.md) |

第一次接工單的話，先看 [work_dispatch/README.md §2「工單怎麼讀」](./work_dispatch/README.md)。

---

## 2. 資料夾一覽

| 路徑 | 內容 | 誰在維護 |
|------|------|----------|
| [roadmap/](./roadmap/) | 2026-08-23 → 11-29 的工項總表、里程碑、週曆 | aaaaa（規劃）、dernoson（守門） |
| [roadmap/detail/](./roadmap/detail/) | 每個工項的背景、技術決策、DoD、未交頂替 | 同上 |
| [work_dispatch/](./work_dispatch/) | 每週派工大綱＋每人一份工單與教學檔 | aaaaa |
| `<你的代號>/`（如 [toby/](./toby/)、[paper/](./paper/)） | 個人筆記、設計稿、PLAN；**不是**正式程式碼的家 | 各自 |
| [dernoson/](./dernoson/) | 三層架構（L1／L2／L3）長版說明 | dernoson |
| [aaaaa/](./aaaaa/) | 資料層與流程引擎的技術文件、歷次版本開發紀錄 | aaaaa |

**正式元件一律放 `src/`**，不要放在 `docs/<自己>/`。

---

## 3. 三條硬規則（動手前先確認）

1. **L3 不 import Pinia store。** 只吃 props、只 emit。
2. **L2 只呼叫 L1 高階 action。** 禁止 `nodes.push`、禁止自組 Command、禁止在容器裡算流量。
3. **L1 不寫正式 UI。** debug 頁一律放 `src/app/dev/` 並加 dev-only guard。

細節與由來見 [roadmap/detail/A1](./roadmap/detail/A1_announce_and_baseline.md) §4.1；三層是什麼見 [dernoson/](./dernoson/)。

---

## 4. 交付與驗收

| 規則 | 說明 |
|------|------|
| 30 秒驗收 | 截圖、測試輸出或 repo 連結；「我本機跑起來了」不算證據 |
| 交檔路徑 | 依工單寫死的路徑；**不要**用 GitHub 網頁上傳、不要把日期寫進檔名 |
| PR | 一個主題一個 PR；待審上限 3 件，超過會標「延壓」排下週 |
| 交不出來 | 說一句「本週不做／暫停」就結案，**不計失敗**，也不用道歉 |

完整節奏（週循環、未完成怎麼處理、什麼時候可以改期）見 [roadmap/detail/A4](./roadmap/detail/A4_weekly_cadence_gate.md)。

---

## 5. 卡住找誰

| 問題 | 找 |
|------|-----|
| 環境裝不起來、git／PR 流程 | dernoson |
| 三層架構、Vue 寫法 | dernoson |
| 機器資料、佔格／port、純函式與測試 | aaaaa |
| 工單本身寫錯（路徑不存在、依賴的檔已改名） | aaaaa，或直接開 PR 改 |

貼錯誤訊息時請貼**整段**，不要只說「壞掉了」——這樣才有辦法在一次回覆內解掉。
