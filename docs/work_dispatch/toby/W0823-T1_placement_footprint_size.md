# W0823-T1｜toby｜擺放預覽／節點佔格吃真實 machine 尺寸（R-B2 提前切片）

| meta | value |
|------|-------|
| 週次 | 2026-08-23 → 2026-08-30 |
| 對應 roadmap | [R-B2](../../roadmap/detail/B2_placement_chain.md)（提前做「預覽佔格讀真實 size」；完整擺放鏈門檻在 9/27） |
| 依賴提醒 | [R-A2](../../roadmap/detail/A2_grid_and_port_alignment.md) 本週由 aaaaa 修資料；你用 `getMachine` 讀到的 `width`/`height` 以 codegen 後為準 |
| 等級 | **確定**（加分項；**不**列 8/30 必要條件） |
| 擋 8/30 門檻 | **否**（未交不擋；頂替＝既有 place 流程） |
| 性質 | 接線／畫布互動（**本週只做這一種**） |
| 預估時數 | **≤2h**（假日為主；一週**只這一塊**） |
| review_gate | dernoson（**必查 AI 直推**；禁 `nodes.push`） |
| mentor | dernoson（Vue／三層）；尺寸資料 aaaaa |
| **先讀** | [GUIDE_node_footprint_notes](./GUIDE_node_footprint_notes.md)（旋轉／`min-w-25`／座標三個坑，5 分鐘） |
| 狀態 | `[ ]` 未開始 |

---

## 0. 一句話

工具列拿起一台機器放到畫布後，畫面上的方塊**佔的格子數**要跟該機資料的 `width`×`height` 一致（可旋轉時寬高對調）——只改指定檔、只呼叫既有 action，**兩小時內能演示完就收工**。

---

## 1. 四欄工單

| 欄 | 內容 |
|----|------|
| **畫面** | 從下方選單拿起一台真機器（或現有可選機）→ 點畫布放下 → 方塊外框大約蓋住 N×M 格（與該機 `width`/`height` 一致）；截圖或 ≤30 秒錄影 |
| **交哪個檔** | **主改一個：** `src/editor/canvas/FlowNodeOverlay.vue`（節點外觀尺寸讀 `getMachine`×`gridSize`）。若必須在放置當下寫入 `style`，可**加改** `FactoryCanvas.vue` 的 `buildFactoryNode`——但**同一週 harry 不得改這兩檔** |
| **不要碰** | `editorStore` 簽名、`nodes.push`、自組 Command、`historyStore.execute`、管線／`addConnection`、Undo 設計、新元件、長文件、與 harry 同週搶改同一檔 |
| **卡住找誰** | Vue／三層：dernoson；`getMachine`／尺寸不對：aaaaa。**卡超過一次就問，不要硬做** |
| **範例 PR** | 你自己 8/12 那次（`BaseRegionSelector/Index.vue` 接進 `Navbar.vue`）就是本週要的形狀：改正式路徑、單一主題、可截圖驗收——照同樣節奏做即可 |

---

## 2. 為何是你、範圍怎麼切

| 依據 | 結論 |
|------|------|
| 本週可做 | 畫布互動小塊；延續你已合入的 snap／旋轉／基地框線 |
| 時數規劃 ≤2h／假日 | **一週一塊**；工項太雜最容易跨週延宕 |
| 本週不做 | Undo 命令、純函式測試、Figma、當 L2 Owner |
| 要避開的失敗模式 | 卡住不主動說 → **週中會有人 ping 你一次**（不是質疑，是流程） |
| 開工前報檔名 | 為避免與他人撞檔，**開工前 Discord 一句：「我要改 FlowNodeOverlay.vue」** |
| 與 harry | 本週你動 canvas／overlay；harry 另派快捷鍵或其他檔（見 WEEK） |
| 主檔為何不是 `FactoryCanvas.vue` | 節點外觀尺寸實際住在 `FlowNodeOverlay.vue`（`getMachine` 已在那裡）。在 canvas 改要繞一圈寫 node style，2 小時內更難收——若你走 overlay 路線卡住，備援才回到 canvas 的 `buildFactoryNode` |

**本週不做：** 完整 B2（真機器選單 B1、連續放置、重疊拒絕、基地外拒絕）、改 store。

---

## 3. 名詞（L2 引導：只講這塊會碰到的）

| 詞 | 白話 | 你要遵守的 |
|----|------|------------|
| **L2（容器）** | 接滑鼠／鍵盤，呼叫 store 的現成函式，把資料攤成畫面 | 可以改 `FactoryCanvas`／overlay；**不要**自己改 `nodes` 陣列 |
| **L1 action** | 例如 `placeDevice`：一呼叫就進歷史，才能 Ctrl+Z | 放置**只能**走 `editorStore.placeDevice(...)` |
| **`getMachine`／`getMachineById`** | 用機型名／id 查機器資料（含 `width`/`height`） | 尺寸從這裡讀，**不要寫死** `3`、`2` |
| **`gridSize`** | 一格多少像素（在 `canvasStore`） | 畫面寬高 ≈ `width * gridSize`（像素） |
| **`getOccupiedCells`** | 算「這台機佔哪些格子」的共用函式 | 進階做法：組暫時 node 呼叫它（B2 建議）；本週若時間不夠，先做到外框像素 = 格數×gridSize 也可驗收 |
| **預覽 local state** | 還沒放下的半透明狀態 | 可以放在 L2 的 `ref`；**放下後的藍圖**必須進 store |

你寫過的踩坑筆記仍有效：`docs/toby/README.md`（旋轉、DnD、白底）。本週不必新寫長文。

---

## 4. 開工前檢查（約 10 分鐘）

- [ ] Discord **先回報**：「W0823-T1 我要改 `FlowNodeOverlay.vue`」（若兼改 canvas 也寫清楚）
- [ ] 本機 `pnpm dev` 能開（你已可跑）
- [ ] 打開並**只讀**：
  - `src/editor/canvas/FlowNodeOverlay.vue`（現況是 `min-w-25` 卡片，**還沒**依 machine 佔格縮放）
  - `src/data/machines.ts` 的 `getMachine`（不要手改這個檔）
  - `src/store/editorStore.ts` 的 `placeDevice`／`armPlacement`（不要改簽名）
- [ ] 確認本週**不要**開第二個功能（例如管線、Undo）

---

## 5. 步驟（目標塞進 ≤2h）

### 5.1 實作（建議路徑）

1. 在 `FlowNodeOverlay.vue`：已有 `machine = getMachine(machineType)`  
2. 注入或讀取 `gridSize`（可從 `canvasStore`；若你不確定是否該在 overlay 讀 store——**問 dernoson 一句**；備援：由 `FactoryCanvas` 把像素寬高寫進 node `style` 再給 overlay 用）  
3. 讓根節點外框尺寸 ＝ `width * gridSize` × `height * gridSize`，**一律用原始寬高**  
   根節點已套 `transform: rotate(rotation × 90deg)`，旋轉的視覺交換由 CSS 完成；style 若再依 rotation 交換一次會**交換兩次**而顯示錯誤（詳見 [GUIDE](./GUIDE_node_footprint_notes.md) §1）。另需拿掉 class 上的 `min-w-25`，否則小機器撐不下去  
4. **不要** `nodes.push`；放置維持現有 `placeDevice` 路徑  
5. 自測：放下「粉碎機」或「塑型機」，數格子是否與資料一致（資料若仍錯，先截圖；aaaaa 的 A2 會修 JSON）

### 5.2 驗收前自查

- [ ] 全檔搜尋：沒有新增 `nodes.push`、沒有 `historyStore.execute`  
- [ ] 只碰約定檔案  
- [ ] 跑得起來；有截圖／短錄影  

### 5.3 交件

1. 開 PR（或依你習慣推 `dev/toby` 請 dernoson 合入）  
2. PR／訊息寫：**改了哪個檔、畫面完成長相一句、怎麼操作再現**  
3. 可在 `docs/toby/README.md` **加 3–5 行**踩坑（可選；你過去這樣做有幫助）

---

## 6. DoD（本週切片，非 9/27 整包 B2）

- [ ] 放下至少一台機器後，節點外框佔格與該機 `width`×`height` 肉眼一致（驗收用方形或未旋轉機器；非方形機旋轉後的位置偏移屬 `transform-origin` 議題，本切片不處理，PR 註明即可）  
- [ ] 放置仍走 `placeDevice`；Undo 仍能還原（抽測一次即可）  
- [ ] 無 `nodes.push`／無自組 Command  
- [ ] 開工前有 Discord 檔名回報  
- [ ] 單一性質、未順便做管線／選單大改  

---

## 7. 未交頂替

不擋 8/30。未交 → 沿用現有放置外觀；B2 正式切片改排 9/6 起。  
**不要**為了趕工一次改很多檔——寧可本週零合併，也不要交無法 review 的大包。

---

## 8. 回報

| 時機 | 動作 |
|------|------|
| 開工前 | Discord 報檔名（必做） |
| 卡住 >1 次嘗試 | 立刻問 dernoson／aaaaa（本週請改成早問，別硬撐） |
| 週中 | 會有人 ping 一次進度（預期內） |
| 完成 | PR ＋截圖 |

---

## 9. 開發日誌（派工側）

### 2026-08-23

- 依 B2 預覽尺寸切片正式派工；時數上限 ≤2h、一週一塊、開工前報檔名
- 本週 toby 獨占 canvas／overlay 尺寸相關改動；harry 另檔
- 不擋 8/30
