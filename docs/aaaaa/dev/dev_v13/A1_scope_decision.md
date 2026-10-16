# V13-A1 — 範圍與定案

**對應工項：** V13-A1
**狀態：** `[x]` 完成（2026-09-19；V14-B1 於 2026-09-27 收斂 meta）
**日期：** 2026-09-19
**開發分支：** `dev/aaaaa0914`
**正式依據：** [W0914-A1](../../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md)、[WEEK_20260914](../../../work_dispatch/WEEK_20260914.md) v1.1、[todolist_v13](../todolist_v13.md)

> **執行計畫：** 本檔所屬之 `todolist_v13`＋`dev_v13/` **即為** C2／D4 重訂與 0921 落子前置的執行計畫檔。

---

## 1. 背景

### 1.1 本週 aaaaa 的關鍵路徑已經走完

[W0914-A0](../../../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md) 的過關條件是一句話——「master 上有 `useLayoutStore()`，toby 的容器 import 得到」。PR [#45](https://github.com/dernoson/endfield-playground/pull/45) 已於 **2026-09-14T17:12:28Z** 合入（merge commit `f95ed9f`），該條件成立。所以本週剩下的 aaaaa 工項只有 **A1**，且 A1 明列為次優、不擋門檻。

這也代表本週的關鍵路徑已從 aaaaa 轉到 **toby T1（PR #50，9/18 送出）**。V13 的排程因此排在週末兩天，而非吃滿週。

### 1.2 C2／D4 為什麼現在重訂

兩份 detail 從 2026-08-25 的佈局自建裁決起就標 `[!]`，理由相同：**原契約建立在 `FactoryNode`／`FactoryEdge` 上，而新模型是 `PlacedDevice`／`Pipeline`**，且**連接狀態改為衍生值、不儲存**。它們已被順延兩次（9/07 的理由是「同週不改兩層契約」）。

本週是重訂的時機，因為 **#45 剛合入，新模型的最終形狀已經固定在 master 上**——`PlacedDevice`／`Pipeline`／`Connection`／`LayoutSnapshot`／`PlacementResult`／`LayoutIssues` 六個型別都不再是草案。重訂不必再對著一個會變的目標寫。

### 1.3 為什麼追加 0921 落子前置

[W0914-A0 §2](../../../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md) 寫明「B1 的工具列→落子那一刀**改排 9/21**」，[§5](../../../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md) 寫明「容器 owner 是 toby，9/21 才開落子」。9/27 是硬綁 B1 的門檻日，而 B1 依賴 B2、B2 依賴殼——**若 9/21 開刀當天才發現 L1 側缺東西，就只剩一週**。

本項不是工單指定範圍，是負責人 2026-09-19 追加，目的是讓 0921 派工不必現場盤。

---

## 2. 最終決策（負責人 2026-09-19）

| # | 決策 | 落點 |
|---|------|------|
| 1 | V13＝W0914-A1（C2／D4 草案）＋0921 落子前置；**A0 已合入，不另立工項** | 本檔／todolist |
| 2 | C2 回傳形狀＝**discriminated union**，對齊 `PlacementResult`／`LayoutIssues` | [C1](./C1_c2_connect_contract.md) |
| 3 | D4 版本號＝**`version: 2`** | [C2](./C2_d4_blueprint_format.md) |
| 4 | D4 舊檔政策＝**不讀舊檔**，匯入 v1 直接拒絕整檔 | C2 |
| 5 | 0921 前置**只收 `canPlaceDevice` 一項**；純文件，不動 `src/` | [D1](./D1_placement_precheck_gap.md) |
| 6 | `historyStore` 全域堆疊**不進本版**，只在待決追蹤表留列 | todolist 封鎖表 |
| 7 | 分支 `dev/aaaaa0914` | meta |

### 2.1 不用 A1 的型別草案額度

[W0914-A1 §4](../../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md) 允許「在 `src/types/layout.ts` 落型別草案（型別可以，邏輯不行）」。**本版選擇不用這個額度**，理由三條：

| 理由 | 說明 |
|------|------|
| 本週合入帶寬已滿 | #48（9/13 開）、#50（9/18 開）兩支未合；再塞一支動 `src/` 的 PR 會排到第三順位，而本版內容不急 |
| 型別隨實作落更省 review | `ConnectResult` 的分支欄位要不要帶 `PortRef`，實作 `canConnect` 時才會確定。先落一版再改一版，等於審兩次 |
| 純文件 PR 可以不跑品質閘 | 未動 `src/` 就沒有 type-check／test 的必要，週末交付成本最低 |

若負責人改判要落型別，改動範圍是 `src/types/layout.ts` 追加 §C1 §4.3 那段 union，並補跑 `pnpm type-check`。

### 2.2 為什麼 C2 改 discriminated union

原 [C2 §4.3](../../../roadmap/detail/C2_add_connection_contract.md) 的 `ConnectCheckResult` 是 `{ ok: boolean; reason: ... | null; message: string | null }`——三個欄位的合法組合靠註解約定，型別本身擋不住 `{ ok: true, reason: 'media' }`。

V12 在 `PlacementResult` 上已經走了另一條路：`ok` 當 discriminant，失敗分支各自帶**該原因才有意義的**結構化資料（`overlap` 帶 `conflicts`、`invalid` 帶 `invalidIds`）。同一個 store 的兩個檢查函式回傳兩種風格，L2 要寫兩套 narrowing，沒有理由。

**決策：C2 改 union，與 `PlacementResult` 同形。** 細節與 `message` 欄位的去留見 [C1 §4](./C1_c2_connect_contract.md)。

### 2.3 為什麼 D4 選「不讀舊檔」

[W0914-A1 §3](../../../work_dispatch/aaaaa/0914/W0914-A1_connection_blueprint_contract.md) 明示「選前者是允許的，但要寫在文件裡」。選它的理由不是工作量，是**資訊缺口**：

舊格式的 `edges` 用 `sourcePortId`／`targetPortId`（handle）表達連線端點；新模型的 `Pipeline` 用 `waypoints` 表達**實體路徑**，連接則由路徑端點是否落在埠錨點上衍生。**舊檔裡根本沒有路徑資訊。** 要轉換就得替使用者的舊藍圖自動佈線——那是憑空造圖，不是格式轉換。

詳見 [C2 §4.3](./C2_d4_blueprint_format.md)。

### 2.4 為什麼 0921 前置只收一項

盤點時共找到五個 L1 側缺口（落子前預檢、`createPlacedDevice` 工廠、`rotateDevice`、選取面歸屬、belt 佈線純函式升格）。負責人裁示**只收落子前預檢**，其餘只記錄不決策。

理由：其餘四項都需要主編或 0921 派工當下的資訊才能決（選取面歸屬牽涉 `selectionStore` 的 CR-01 邊界、佈線升格牽涉 C3 owner 是誰），現在定案等於[AGENT_ROADMAP §7](../../claude/AGENT_ROADMAP.md) 禁止的「需求不清時擅自定案」。而落子前預檢不同——它**純粹是 L1 內部的缺口**，不牽涉任何跨 CR 協商，可以現在就定。

---

## 3. 與既有版本／工單邊界

| 對象 | 關係 |
|------|------|
| V12 | 已結案（#45 合入）；文件殘項由 [B1](./B1_v12_residue_close.md) 收斂後不再帶入 |
| W0914-A0 | DoD 已達；本版只做收斂回寫，不重開工項 |
| W0914-A1 | 本版 C1＋C2 即其全部 DoD |
| W0914-T1（toby／#50） | **零交集**；本版不動 `src/`。他若用錯讀取面，PR comment 指出即可（A0 §7） |
| W0914-G1（goodmorning／#48） | 零交集；`ToolbarPanel.vue` 本週 owner 是他 |
| W0914-H1（harry／#47） | 已合入；與本版無關 |
| R-C2 | 本版出定義；實作排 10/04 純函式門檻 |
| R-D4 | 本版出定義；實作排 11/08 純函式 |
| R-B2 | 仍 `[!]`；本版只出 [D1](./D1_placement_precheck_gap.md) 的前置盤點，不解鎖 |

---

## 4. 非目標

見 [todolist_v13](../todolist_v13.md)「非目標」。補充兩點：

1. **不重新開啟 V12 已凍結的形狀。** `PlacementResult`／`LayoutIssues` 已經過兩輪 PR review，本版引用它們，不改它們。
2. **不因為「順便」而擴大。** C2 的環路檢查仍明確排除（原 §4.1 已凍結該結論，新模型不改變它）；D4 的 HTML 自包含匯出仍在不做清單。

---

## 5. DoD（本細項）

- [x] 7 項決策表已寫入 todolist 與本檔
- [x] C1／C2／D1 可依本檔開工，無待裁決的契約形狀
- [x] 不動 `src/`、不解鎖擺放已明示
- [x] §2.1 的「不用型別草案額度」已寫明，避免下週有人以為 `src/types/layout.ts` 上有 `ConnectResult`

---

## 6. 開發日誌

### 2026-09-19

- 確認 #45 已合入（`f95ed9f`）→ A0 結案，V13 只走 A1＋0921 前置
- 負責人確認 7 項決策；追加 0921 落子前置為非工單項
- 決定不用 A1 的 `src/types/layout.ts` 草案額度（§2.1），本版維持純文件
