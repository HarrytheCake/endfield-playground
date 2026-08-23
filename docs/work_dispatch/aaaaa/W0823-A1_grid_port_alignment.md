# W0823-A1｜aaaaa｜佔格與 port 對資料（R-A2）

| meta | value |
|------|-------|
| 週次 | 2026-08-23 → 2026-08-30 |
| 對應 roadmap | [R-A2](../../roadmap/detail/A2_grid_and_port_alignment.md) |
| 關聯維運 | [R-E1](../../roadmap/detail/E1_data_codegen_ops.md)（修 JSON 時必跑 codegen） |
| 等級 | **確定** |
| 擋 8/30 門檻 | **是**（本週唯一關鍵技術項；無備援 Owner） |
| 性質 | 資料／純函式（**本週只做這一種**） |
| 預估時數 | 11–20h 區間內可吃完；建議週末爆發一次收尾 |
| review_gate | dernoson |
| 狀態 | `[ ]` 未開始 |

---

## 0. 一句話

讓「放下設備時的佔格」與 `docs/aaaaa/data/machines.json` 的 `width`×`height` 一致，並交出**錯機清單**（錯在資料 vs 錯在渲染）＋資料側測試；**不改畫布互動**。

---

## 1. 四欄工單

| 欄 | 內容 |
|----|------|
| **畫面** | 中央畫布放下至少一台常用加工機（建議：粉碎機 `crusher` 或塑型機），格子數看起來不是錯尺寸；錯機清單存在且可給 L2／L3 轉單 |
| **交哪個檔** | 新建 `src/__tests__/data/machineGeometry.test.ts`；新建錯機清單（建議 `docs/roadmap/detail/A2_port_grid_defect_list.md`）；僅修「錯在資料」時改 `docs/aaaaa/data/machines.json` 後跑 codegen |
| **不要碰** | `FactoryCanvas.vue` 事件、任何 Pinia action 簽名、L3 樣式、`geometryUtils`／`portUtils` 邏輯重構（若發現 bug → 另開單，本週只記錄） |
| **卡住找誰** | dernoson（合入／是否算通過門檻）；渲染側症狀記錄後轉 L2（toby／harry 下週工單），**自己不改 canvas** |

---

## 2. 為何是你、範圍怎麼切

| 依據 | 結論 |
|------|------|
| 本週可做 | 純函式＋測試、JSON／資料、中文技術文件 |
| 本週不做 | Vue／Pinia 串接、L3、SVG、UI → **禁止兼做** |
| 時數規劃 | 11–20h、週末爆發；適合一次吃完整個 A2 兩段切片 |
| 要避開的失敗模式 | 上游做完下游未接會停更 → PR **必須寫下游消費者**（見 §6） |
| 門檻 | 無備援；未交須立即上報主編改期（A2 §10） |

**本週不做：** A3／A4 代擬（屬 dernoson 主責）、任何正式 UI、管線佔格。

---

## 3. 開工前檢查

- [ ] 已讀 [A2 細項](../../roadmap/detail/A2_grid_and_port_alignment.md) §4–§9（決策與 DoD 以該檔為準）
- [ ] 確認本機 `pnpm test`／`pnpm type-check` 可跑
- [ ] 分支建議：`dev/aaaaa` 或依主編慣例；PR 對準可合入目標
- [ ] **程式碼現況優先於 A2 文檔欄位名**（見下表）

| A2 文檔用語 | 程式碼現況（以現況為準） |
|-------------|--------------------------|
| JSON `size` | `width`／`height`（頂層欄位） |
| `modes[].ports` | `modes[].input_ports`／`modes[].output_ports` |
| `getOccupiedCells(node, machine)` | `src/utils/geometryUtils.ts`（已吃 `rotation` 0/1/2/3） |
| 埠旋轉 | `rotatePortSide`／`rotatePortOffset`（`src/utils/portUtils.ts`） |
| 查詢 | `getMachine`／`getMachineById`（`src/data/machines.ts`，**codegen 產物勿手改**） |

參考既有測試風格：`src/__tests__/data/machines.test.ts`。

**本週複查發現的既有落差（請在錯機清單多開一列記錄，不必本週修）：** `useValidation.buildContext()` 傳給 detector 的 `FactoryNode.position` 是 Vue Flow **像素**座標（吸附 `gridSize`＝20），但 `geometryUtils.getOccupiedCells()` 註解寫「假設 position 已經是格子座標」。兩者對不上時，畫面上重疊的設備在 E001 眼中不會重疊。shirone 本週的 E001 會照官方函式寫並在 PR 註明此落差；換算歸屬（改 `getOccupiedCells` 簽名、或在 `FactoryNodeData` 增 `gridX`／`gridY`）由你在幾何域裁決，可排 9 月。

---

## 4. 步驟（對齊 A2 §6 週切片）

### 4.1 週前半（→ 約 8/27）：測試骨架＋第一版失敗清單（**先不修資料**）

1. 新建 `src/__tests__/data/machineGeometry.test.ts`
2. 對**全部** `machineList` × `rotation ∈ {0,1,2,3}` 斷言至少：
   - `getOccupiedCells(fakeNode, machine).size ===` 旋轉後寬×高  
     （0/2：`width*height`；1/3：`height*width`）
   - 每個 mode 的每個 `input_ports`／`output_ports`：`offset` 落在該 `side` 的合法範圍（不得超出對應邊長）
3. 跑測試，把失敗案例匯出成錯機清單初稿（欄位見 A2 §4.1；`expected_size` 請寫 `width×height`）
4. 用 `/dev` 拓樸頁（`DevTopologySvg.vue`）或主畫布 **抽查** 1–2 台：若資料斷言過但畫面錯 → `fault=render`，只記錄不改 canvas

### 4.2 週後半（→ 8/30 門檻）：分責＋修資料＋至少一台正確

1. 清單每列填齊：`machine_id`／`expected_size`／`observed`／`port_mismatch`／`fault`／`owner`／`note`
2. 只修 `fault=data`（或 `both` 的資料半邊）：改 `docs/aaaaa/data/machines.json`
3. 執行：`pnpm generate:src-data`（若流程要求先 sync，依 [E1](../../roadmap/detail/E1_data_codegen_ops.md)）
4. 測試全綠；至少一台常用加工機在畫布／overlay 佔格與 JSON 一致（截圖或錄影附 PR）
5. 資料錯誤若超出一週可修量：清單仍交、修正按常用度排序，剩餘排 9/6（A2 §10 允許）——但**清單本身不可缺**

---

## 5. DoD（勾完才算本週完成）

對齊 A2 §9：

- [ ] 錯機清單存在，每列具備 A2 §4.1 全部欄位
- [ ] `machineGeometry.test.ts` 涵蓋全部機器 × 四種 rotation 並通過
- [ ] 「錯在資料」已修；codegen 後 `src/data/machines.ts` 一致
- [ ] 至少一台常用加工機佔格正確（證據附 PR）
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過
- [ ] PR 描述含下游消費者（下節）

---

## 6. PR 必寫：下游消費者

避免「做完沒人接、然後整條線停更」這個老問題。PR 描述請含類似段落：

```text
下游消費者（下週起）：
- B1 工具列佔格文字、B2 擺放預覽 → 必須讀同一份 getMachine／getOccupiedCells
- C1 port hit、D2 E001 重疊 → 依賴本週修正後的 size／port 合法性
渲染側 fault=render 列 → 轉單 L2／L3，不在本 PR 改 canvas
```

**合入後誰在畫布驗收：** 本週是 **toby（W0823-T1）**——他要讓節點外框吃 `width`×`height`，你的 codegen 結果一改，他當天就能在畫布上看出對不對。清單初稿一產出就丟 Discord，讓他先看渲染列。

---

## 7. 未交頂替

**無。** 此項為 8/30 門檻必要條件且無備援 Owner。若無法完成：當日會前上報 dernoson＋改期，不得默默延後。

---

## 8. 回報

| 時機 | 動作 |
|------|------|
| 開工 | 可自行開工；不必每日 ping |
| 清單初稿產出 | Discord 丟連結即可（方便 L2 預覽渲染列） |
| 卡住（codegen／合入／門檻判定） | dernoson |
| 完成 | PR ＋ 回寫 A2 §11 開發日誌；週日會演示「放一台佔格正確」 |

---

## 9. 開發日誌（派工側）

### 2026-08-23

- 依 R-A2 正式派工
- 註明文檔 `size`／`ports` 與程式碼 `width`/`height`／`input_ports`/`output_ports` 對照
- 執行以本檔為準（先前的 TICKETS 草稿不採用）
