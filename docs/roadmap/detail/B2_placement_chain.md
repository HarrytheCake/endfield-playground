# R-B2 — 擺放鏈 L2 串接

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §4 |
| 里程碑 | M2（2026-09-27） |
| 擋門檻 | **是**（主編步驟 2 的核心） |
| 建議主責／備援 | toby（確定，≤2h／假日）／harry（**可派**，中風險，動力驅動）／aaaaa 記錄轉單 |
| 性質 | 接線（L2） |
| 依賴 | [A2](./A2_grid_and_port_alignment.md)、[B1](./B1_toolbar_real_machines.md) |
| 狀態 | `[x]` 點擊落子已合入 master（#54／#55；2026-09-27） |
| 最後更新 | 2026-10-04 |

---

## 1. 背景與動機

L1 從 5–6 月就大量提交，`editorStore` 的八個高階 action 早已可用；但 git 上 L2 直到 8 月中才出現零星 MVP。**主線真正的瓶頸在串接，不在底層。** 擺放鏈是所有後續互動的第一條線：選單挑機器 → 畫布放下去 → 產生一個帶正確 `machineType`、`size`、`rotation` 的 `FactoryNode`。這條線不通，9 月的資訊面板、10 月的連線、11 月的產耗與警訊全部無從演示。

本項的難點不是技術，是**紀律**：必須忍住不在容器裡直接改 `nodes[]`。過去 L2 MVP 的常見寫法是自己 push 節點，短期看得到畫面，但會繞過歷史堆疊，讓 [C4](./C4_move_into_history.md) 的 Undo 永遠對不起來。

## 2. 使用者看得到什麼

從下方選單點或拖一台真機器到畫布上，落點吸附到格子，方塊的格數與該機 JSON 的 `size` 一致。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 備擺放 | `editorStore.armPlacement(equipment)` | 已有（`editorStore.ts:265`） |
| 落子 | `editorStore.placeDevice(node)` | 已有（`editorStore.ts:295`），自動進歷史 |
| 畫布 | `src/editor/canvas/FactoryCanvas.vue` | 可拖／點放，但佔格與 port 不對 |
| Overlay | `src/editor/canvas/FlowNodeOverlay.vue` | 已存在 |
| 佔格換算 | `getOccupiedCells(device, def)` | 已有 |
| toby 既有實績 | snap、旋轉、基地框線 | 證明可改正式路徑並合入 |

## 4. 技術決策

### 4.1 一次只接一條 action

| 週 | 只接這一個 | 明確不做 |
|----|-----------|----------|
| 9/13 | `placeDevice` | 旋轉、連線、多選 |
| 9/20 | 預覽佔格讀真實 size | 落點合法性完整驗證 |

`≤2h／假日` 的工時上限決定了切片必須小到能單獨驗收。工項太雜會被拆成多次而跨週延宕，這是 toby 自述的落後主因。

### 4.2 硬規則（違反即退回）

1. **禁止 `nodes.push`**、禁止直接 mutate `editorStore.nodes`
2. **禁止自組 Command**、禁止在 L2 呼叫 `historyStore.execute()`
3. 預覽狀態（尚未放下的半透明方塊）**可以**留在 L2 local ref，因為它不是藍圖狀態
4. 尺寸一律經 `getMachine`／`getMachineById` 取得，不得在容器內寫死

### 4.3 方案比較：預覽佔格怎麼算

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 容器自己算格子 | 依滑鼠座標 / cellSize 推 | 直觀 | 與 `getOccupiedCells` 兩套邏輯，日後必分歧 | 否 |
| **B. 組出暫時 node 丟給 `getOccupiedCells`** | 用同一個純函式 | 與正式落子一致；[A2](./A2_grid_and_port_alignment.md) 的測試同時保護預覽 | 需組一個暫時物件 | **是** |
| C. 不做預覽 | 直接放下 | 最省 | 使用者放歪只能靠 Undo | 否（列為降級方案） |

### 4.4 落點合法性的範圍界定

本項**只**要求「格子對齊 ＋ 尺寸正確」。以下不在本項：

- 重疊拒絕 → 由 [D2](./D2_e001_overlap_alert.md) 的 E001 以警訊呈現（11 月），本階段允許放上去後才報錯
- 超出基地範圍 → `isDeviceWithinBaseRegion` 已存在，但接入時機排在 10 月後，本項不做

這是刻意的：**先讓東西放得上去，再談放得對不對。**

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | `src/editor/canvas/FactoryCanvas.vue` | drop／click → 組 `FactoryNode` → `placeDevice` |
| 修改 | `src/editor/canvas/FlowNodeOverlay.vue` | 預覽方塊尺寸讀真實 size |
| 唯讀 | `src/store/editorStore.ts` | 只呼叫，不改簽名 |
| 唯讀 | `src/utils/geometryUtils.ts` | 只呼叫 |
| **不碰** | `addConnection`、多選、旋轉完整規格、Undo 命令設計 | 各有專屬工項 |

**同一週不得由兩人同時改 `FactoryCanvas.vue`。** toby 與 harry 的切分見 §8。

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 09/06 | （等 [B1](./B1_toolbar_real_machines.md)）確認 `armPlacement` → canvas 既有路徑能走通，寫 10 行 repro |
| 09/13 | drop／click 只呼叫 `placeDevice`，節點帶正確 `machineType` |
| 09/20 | 預覽佔格走 `getOccupiedCells` |
| 09/27 | **門檻：** 多種真機器可放，佔格與 JSON 一致 |

## 7. 不做

- 不做重疊拒絕、不做超出基地拒絕
- 不做框選多物、不做複製貼上
- 不做自動吸附到既有設備的 port
- 不改 `editorStore` 任何 action 簽名（要改請開 Breaking 工項，見 [E2](./E2_layer_guard_pr_rules.md)）

## 8. 依賴與封鎖

| 項目 | 狀態 |
|------|------|
| 人力 | toby（≤2h／假日）＋harry；同週禁止改同一檔 |
| 配對窗口 | 三層／Vue 問題找 dernoson；尺寸資料找 aaaaa。**卡超過一次就問，不要硬做** |
| 切分原則 | 二選一：toby 改 canvas 互動／harry 寫 repro 與修 place 失敗訊息；或對調。**禁止**兩人各做一半的同一檔 |
| 開工前 | 須先回報一句「我要改的是哪個檔」 |
| 週中 | Discord 問一句進度 |

封鎖解除條件：切分原則二選一已確定。

## 9. DoD

- [ ] 從選單挑一台 → 放到畫布 → 節點出現且 `machineType` 正確
- [ ] 節點佔格數與該機 JSON `size` 一致（錄影或截圖）
- [ ] 全域搜尋確認容器內無 `nodes.push`、無 `historyStore.execute`
- [ ] 放下後按 Undo 能還原（證明走的是高階 action）
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| L2 無高投入人選（專案級風險） | 拆成一週一塊；門檻不綁單一人；aaaaa 可在 L1 側補「缺什麼 action」但不代寫 L2 |
| 與 AI 討論後直接推大 PR | 開工前先報目標檔案；PR 超過單一檔案範圍即退回 |
| 兩人改同一檔衝突 | §8 切分原則；同週只允許一人動 `FactoryCanvas.vue` |
| 忍不住寫 `nodes.push` | DoD 列入全域搜尋檢查，review 硬擋 |

**未交頂替：** 9/27 門檻可用「現有放置流程 ＋ [A2](./A2_grid_and_port_alignment.md) 修正後的資料」演示，佔格正確性由資料側保證，但這只是降級方案，10 月的連線月無法用同樣方式頂替——因此本項**最遲 9/27 必須真正打通**。

## 11. 開發日誌

### 2026-08-22
- 建檔。切分原則沿用 8/23 週的 [W0823-T1](../../work_dispatch/toby/0823/W0823-T1_placement_footprint_size.md)／[W0823-H1](../../work_dispatch/harry/0823/W0823-H1_connect_tool_shortcut.md)；封鎖狀態源於「L2 串接目前沒有高投入人選」這項專案級風險

### 2026-08-25
- 佈局自建裁決：本項退回 `[!]`；六純函式＋`editorStore` 模型改寫為開工前提

### 2026-08-30
- **進度盤點：** `src/utils/layout/` 已有 `deviceOccupancy`／`pipelineGeometry`／`overlapDetection`／`portAnchor`（4／6）。**仍缺** `resolveConnections`、`toTopology`（及 `types/layout`）與 store 模型改寫 → **維持 `[!]`**
- W0823-T1 已改指向 B4，本項本週無直接產出；9/6 起若純函式未補齊，依大綱 §11 不把門檻必要項押在本項

### 2026-09-21（W0914 結算）

**封鎖性質改變：由「等前置」改為「等裁決」。** 本項的技術前提在本週全部到齊：

| 前提 | 狀態 |
|------|------|
| `types/layout`＋`resolveConnections`＋`toTopology` | **已合入** PR #40（9/1） |
| 只讀殼 `GridCanvas` | **已合入** PR #46（9/13） |
| `layoutStore`（含 `placeDevice`／`PlacementResult`） | **已合入** PR #45（09-14T17:12Z） |
| 平移縮放 `useGridViewport` | **已合入** PR #47（09-14T17:34Z） |
| 主畫面接入（`MainLayout` → `LayoutView` → `GridCanvas`，資料來自 store） | **已合入** PR #50（09-20T12:57Z） |

**§8 的封鎖解除條件因此要改寫。** 原條件是「切分原則二選一已確定」與純函式補齊，兩者都已滿足；**現在唯一擋著的是主編對「互動解鎖」的當週裁示**——大綱 §11 已補明「底層就緒不等於自動解鎖」，不得由依賴已清推論而自行開工。

**§5 檔案計畫需在解鎖時一併重訂。** 原計畫寫的是改 `FactoryCanvas.vue`；落子鏈現在應落在 `LayoutView.vue`（容器）與 `layoutStore.placeDevice`，**舊 `FactoryCanvas` 依大綱 §11 只維護不加深**。§10 的「同週只允許一人動 `FactoryCanvas.vue`」對應改為 `LayoutView.vue`，owner 為 toby。

**§10 的未交頂替維持：** 9/27 仍可用現有放置流程＋A2 修正後的資料演示。**但本項未列 M2 硬綁**（9/15 撤回擴大後維持），且本月只剩一週、落子鏈未開工 → **改列 M3 前置**，最遲 10/04 開工，否則 C1 連帶延期。

### 2026-09-23（主編裁決：解鎖，狀態改 `[~]`）

**放行點擊落子；選取／旋轉／刪除不開。** 大綱 §9 的封鎖列已解除。

| 項 | 裁示內容 |
|----|----------|
| 範圍 | **點擊落子**（arm → 點格 → `addDevice`）。拖曳落子與綠框／紅框即時預覽列**加分**，不進 9/27 驗收 |
| L2 owner | **toby**（[W0921-T1](../../work_dispatch/toby/0921/W0921-T1_placement_chain.md)） |
| L1 側前置 | `canPlaceDevice`／`canMoveDevice`（[W0921-A0](../../work_dispatch/aaaaa/0921/W0921-A0_placement_precheck.md)，9/24 交） |
| 仍鎖 | B3 旋轉、B4 選取、B5 刪除——**送審即退回** |

**§5 檔案計畫據此定案（取代原 `FactoryCanvas.vue` 那版）：**

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/editor/toolbar/usePlacementIntent.ts` | 落子意圖，module-scope ref。**不擴充 `EquipmentType`、不進任何 store** |
| 修改 | `src/editor/toolbar/ToolbarPanel.vue` | 僅 `<script>`：`handleRealMachineClick` 改寫入意圖。**直接在 master 版上改**——#48 於同日裁定維持現狀，本項不再等它 |
| 修改 | `src/editor/layout/LayoutView.vue` | 接畫布點擊 → `canPlaceDevice` → `layoutStore.addDevice` |
| 修改 | `src/editor/layout/GridCanvas.vue` | 視需要加預覽用 props；維持零 store import |
| **不碰** | `editorStore` 簽名、`FactoryCanvas.vue`、`InspectorSidebar` | |

**落子欄位定案：** `label` 填 `machine.name`（中文名）——`GridCanvas` 畫的是 `label ?? machineType`，不填則門檻演示顯示英數 id。`createPlacedDevice` 工廠本週不做，由落子端自組（預設值屬呈現決策，排 10 月）。

**硬約束：** L2 不得自行 import `detectOverlaps`／`toDeviceFootprint`／`deviceSizeFromMachine` 重算佔格。三支皆為 public export，做得到但會形成兩套判定——症狀是「預覽說綠的、放下去卻失敗」，與 [C2 §4.4](./C2_add_connection_contract.md) 要避免的同型。
