# R-A2 — 佔格與 port 對資料

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §3 |
| 里程碑 | M1（2026-08-30） |
| 擋門檻 | **是**（8/30 唯一關鍵技術項，無備援 Owner） |
| 建議主責／備援 | aaaaa／無 |
| 性質 | 資料／純函式 |
| 依賴 | — |
| 狀態 | `[ ]` 未開始 |
| 最後更新 | 2026-08-22 |

---

## 1. 背景與動機

主編 10 步的第 2 步「滑鼠拉出設備擺放」現況是**可以放，但形狀不對**：佔格數與 JSON 的 `size` 對不上，port 出現在錯誤的邊。這條錯誤會一路污染後面三個月——9 月的資訊面板會顯示錯佔格、10 月的 port 對 port 連線會連到不存在的埠、11 月的重疊偵測會用錯格子集合判定。

問題可能出在兩個地方，必須先分責再修：

| 錯在哪 | 症狀 | 修的人 |
|--------|------|--------|
| 資料 | JSON `size` 或 `modes[].ports` 本身寫錯 | aaaaa（本項） |
| 渲染 | 資料正確但畫布用了別的尺寸來源或忽略 rotation | L2／L3（本項只負責**記錄**，不改 canvas） |

V9 已完成 modes-only 埠遷移（外層 `input_ports`／`output_ports` 已移除，埠只存在 `modes[].ports`），因此本項的檢查基準是明確的：**畫布與資料必須讀同一份 `getMachine`／`getMachineById`，並經同一套 `getOccupiedCells` 換算。**

## 2. 使用者看得到什麼

中央畫布放下的設備，格子數看起來不是錯尺寸；至少一種常用加工機的佔格與 JSON 完全一致。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 機器資料 | `docs/aaaaa/data/machines.json` → `src/data/machines.ts` | modes-only；43 台 |
| 查詢入口 | `getMachine(name)`／`getMachineById(id)`／`getMachinesByTag(tag)` | 已存在 |
| 佔格換算 | `src/utils/geometryUtils.ts` `getOccupiedCells(device, def)` | 已存在，V5 交付 |
| 埠旋轉 | `src/utils/portUtils.ts` `rotatePortSide`／`rotatePortOffset` | 已存在 |
| 畫布渲染 | `src/editor/canvas/FactoryCanvas.vue`、`FlowNodeOverlay.vue`、`src/components/MachineShape.vue` | 尺寸來源需逐一確認 |
| Dev 驗證頁 | `src/app/dev/DevTopologySvg.vue`（WxH 格點拓樸，V9 交付） | 可當比對基準 |

## 4. 技術決策

### 4.1 錯機清單的欄位（凍結）

清單是本項的主要交付物，後續三個月都會回頭查，欄位固定：

| 欄 | 說明 |
|----|------|
| `machine_id` | snake_case 英文 id（非中文 name） |
| `expected_size` | JSON `size` 的 width×height |
| `observed` | 畫布或 overlay 實際佔的格數 |
| `port_mismatch` | 哪個 mode 的哪個 port 的 side／offset 不符 |
| `fault` | `data` ｜ `render` ｜ `both` |
| `owner` | `data` → aaaaa；`render` → 記錄後轉給 L2／L3 |
| `note` | 例如「僅 rotation=1 時錯」 |

### 4.2 方案比較：怎麼產出清單

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 手動目視 43 台 | 開畫布逐台放 | 不需寫碼 | 慢、無回歸、rotation 組合漏測 | 否 |
| B. 純測試比對 | 對每台機器跑 `getOccupiedCells` 與 `size` 一致性斷言 | 有回歸、CI 可跑 | 只驗資料側，抓不到渲染錯 | 部分 |
| **C. B ＋ dev 頁目視抽查** | 測試涵蓋資料側；`/dev` 拓樸頁目視抽查渲染側 | 分責清楚、符合「錯在資料 vs 錯在渲染」 | 需兩處 | **是** |

採 C：資料側錯誤由測試釘死，渲染側錯誤寫進清單交給 L2／L3，本項**不改** canvas 互動。

### 4.3 判定規則

- 佔格：`getOccupiedCells(node, machine).size === machine.size.width * machine.size.height`，且四個角落落在預期矩形內
- 埠：對每個 `mode` 的每個 port，`offset` 必須落在該 `side` 的合法範圍內（不得超出 width／height）
- 旋轉：`rotation ∈ {0,1,2,3}` 四種都要成立；side 換算走 `rotatePortSide`，不得在呼叫端自己寫 switch

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `docs/roadmap/detail/A2_port_grid_defect_list.md`（或本檔附錄） | 錯機清單，欄位見 §4.1 |
| 新建 | `src/__tests__/data/machineGeometry.test.ts` | 佔格與埠合法性斷言（全機器） |
| 修改 | `docs/aaaaa/data/machines.json` | 僅修「錯在資料」者 |
| 執行 | `pnpm sync:aaaaa-data`、`pnpm generate:src-data` | 同步至 `src/data`（見 [E1](./E1_data_codegen_ops.md)） |
| 唯讀 | `src/utils/geometryUtils.ts`、`src/utils/portUtils.ts` | 不改邏輯；若發現 bug 另開工項 |
| **不碰** | `FactoryCanvas.vue` 事件、任何 Pinia action 簽名、L3 樣式 | 渲染錯誤只記錄 |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 08/23 | 建立測試骨架，跑出第一版失敗清單（不修） |
| 08/30 | **門檻：** 清單完成並分責；修完「錯在資料」者；至少一台常用加工機佔格正確且有測試 |

## 7. 不做

- 不改畫布互動、不改 overlay 的事件處理
- 不重構 `geometryUtils`／`portUtils`
- 不處理管線佔格（`getPipelineOccupiedGrids` 屬 10 月範圍）
- 不做正式機器圖像資源

## 8. 依賴與封鎖

無前置。本項是 [B1](./B1_toolbar_real_machines.md)、[B2](./B2_placement_chain.md)、[B3](./B3_rotation_90.md)、[C1](./C1_port_hit_and_draft.md) 的資料前提；下游消費者須寫進 PR 描述。

## 9. DoD

- [ ] 錯機清單存在，每列具備 §4.1 全部欄位
- [ ] `src/__tests__/data/machineGeometry.test.ts` 涵蓋全部機器 × 四種 rotation 並通過
- [ ] 「錯在資料」項目已修，`pnpm generate:src-data` 後 `src/data/machines.ts` 一致
- [ ] 至少一台常用加工機在畫布或 overlay 上的格子數與 JSON `size` 一致（截圖或錄影）
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過
- [ ] PR 描述寫明下游消費者：下週工具列與 canvas 讀同一份 `getMachine`

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 資料錯誤數量超出一週可修 | 先交清單（清單本身即門檻交付物），修正按常用度排序，剩餘排進 9/6 |
| 渲染錯誤誘使順手改 canvas | 硬規則：本項不動 canvas；發現即記錄轉單 |
| 依賴 L2 合入才能證明 | 交付以清單＋資料修正＋測試為準，不依賴任何人合入 |

**未交頂替：** 無。此項是 8/30 門檻的必要條件且無備援 Owner，若 aaaaa 不可用須立即上報主編改期。

## 11. 開發日誌

### 2026-08-22
- 建檔。基準沿用 V9 modes-only 埠決策；清單欄位見 §4.1，並補上 rotation 維度
