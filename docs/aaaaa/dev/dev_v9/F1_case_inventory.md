# V9-F1 — 既有案例盤點

**對應工項：** V9-F1  
**狀態：** ✅ 完成  
**依賴：** A1；B2／E1 已落地（盤點以 2026-08-02 程式現況為準）  
**最後更新：** 2026-08-02

---

## 1. 目標

整理 `/dev/flow-engine` 現有 preset（H1–H11、G1–G3、L1），標註：

- 現況是否符合預期（正確／故意錯誤／過時）  
- V9 下是否因「基礎材料輸出點」「輸入匹配配方」而需改  
- 處置：`retain`（沿用）／`migrate`（改圖、handle、敘述或預期）／`replace`（汰換）／`retire`

**本項不實作新 preset**；完成後解除 F2 封鎖。

來源：[`FlowEngineTest.vue`](../../../../src/app/dev/FlowEngineTest.vue) `presets`／`presetData`。

> **注意：** 單元測試檔 `flowEngine.test.ts` 的 H1–H6 **≠** UI preset 同名（測試為舊編號語意）。下表僅盤點 **Dev UI preset**。

---

## 2. 盤點表（定稿）

圖例：現況意圖＝正確 ✓／故意非法 ✗／刻意略過媒質 ～

| ID | 群組 | 摘要（現況） | 意圖 | V9 現況／風險 | V9 處置 |
|----|------|--------------|------|---------------|---------|
| H1 | basic | 源礦→粉碎→Sink 滿速 | ✓ | 已用基礎材料輸出點；E1 依源礦匹配源石粉末 | **retain**（可改敘述強調「不預選配方」） |
| H2 | basic | 半速源礦→粉碎 | ✓ | 同上；`recipePick:1`→15/min | **retain** |
| H3 | basic | 分流 1→2 | ✓ | 源已遷移；出邊分接 out-0／out-1 | **retain** |
| H4 | basic | 環路 A-B-C-A | ✗ | 環路偵測與配方無關；無 source | **retain** |
| H5 | basic | 懸空無連線 | ✗ | 孤立非法；語意不變 | **retain** |
| H6 | basic | 紫晶礦→精煉→塑型→Sink | ✓ | 源已遷移；E1 匹配紫晶纖維／紫晶質瓶 | **retain**（F2 可另做息壤最短鏈） |
| H7 | advanced | 雙源灌同一粉碎機 | ✓ | H1-1 方案 B：同品多入分攤 → 入邊橘約 15／15；出邊≈30 | **retain** |
| H8 | advanced | 雙鏈→匯流→Sink 堵塞 | ✓ | 源已遷移；分接 merger in-0／in-1；語意正確 | **retain** |
| H9 | advanced | 兩獨立產線 | ✓ | 源已遷移；E1 自動匹配 | **retain** |
| H10 | advanced | 紫晶礦→粉碎機 | ✗ | 無「紫晶礦→粉碎」配方；E1 不匹配→非法（敘述仍寫舊 recipeIndex） | **migrate**：改描述為「輸入種類無法匹配配方」 |
| H11 | advanced | 半速＋分流 | ✓ | 源已遷移；出邊分埠 | **retain** |
| G1 | v7 | 息壤氣→固氣→息壤 | ✓～ | 已用材料源＋`fluid_pipe`；**抽象邊**略過媒質 | **migrate**：可選改為合法 pipe handle；或 retain 並標註「刻意 loose」 |
| G2 | v7 | 精煉爐錯 mode | ✗ | E1：base_mode 下無赤銅塊配方→不匹配（仍非法）；敘述過時 | **migrate**：改描述為「mode 過濾後無匹配配方」 |
| G3 | v7 | belt↔pipe 錯接 | ✗ | 刻意物品輸出口(belt)→提純 pipe；媒質檢查 | **retain** |
| L1 | v7 | loss 不進 summary | ✓～ | 與 G1 同構；驗證 summary 不算 loss | **retain** |

### 處置統計

| 處置 | 數量 | ID |
|------|------|-----|
| retain | 12 | H1–H9、H11、G3、L1（H7 經 H1-1 文案對齊後 retain） |
| migrate | 3 | H10、G1（可選）、G2（F2 時點；其後多已落地） |
| replace | 0 | — |
| retire | 0 | — |

---

## 3. 單元測試對照（非 UI preset；供 F2／回歸）

| 測試群組 | 檔案 | 與 UI 關係 | V9 備註 |
|----------|------|------------|---------|
| H1–H6（舊義） | `flowEngine.test.ts` | 編號不同於 UI | H6 武陵鏈已依 E1 調預期（1+1 配方） |
| G1–G3、L1 | `flowEngine.v7.modeMedia.test.ts` | 對齊 UI 意圖 | retain |
| V8 埠基數／速率／form／H8 | `flowEngine.v8.*.test.ts` | UI H7／H8 相關 | H8 測試 retain；UI H7 需 migrate |
| E1 匹配 | `matchRecipeByInputs.test.ts` | 新 | F2 可抽成 demo preset |

---

## 4. V9 演示需求 ↔ 覆蓋（給 F2）

| # | 需求類別 | 現有覆蓋 | F2 動作 |
|---|----------|----------|---------|
| 1 | 正確＋滿速 | H1 | retain；可加 v9 複本強調 E1 |
| 2 | 正確＋未滿速 | H2 | retain |
| 3 | 分流速率 | H3、H11 | retain |
| 4 | 匯流 15+15／30+30 堵塞 | H8 | retain |
| 5a | 非法：無物品接收口 | **不足** | **新建** `v9-no-sink` |
| 5b | 非法：錯誤／不齊配方 | H10、G2（migrate 敘述） | migrate＋可新建精煉缺清水 |
| 6 | 單獨設備非法 | H5 | retain |
| 7 | 複雜鏈路／最短鏈 | H6 偏短 | **新建** `v9-xi-rang`（D1 息壤短鏈套用） |
| 8 | 輸入驅動換料／缺料 | E1 單測有；UI 無 | **新建** `v9-swap-feed`、`v9-missing-water` |
| — | 雙源同品／匯流堵塞 | **H7**（一般機）＋**H8**（匯流器） | retain |

---

## 5. F2「新建／遷移」清單（解鎖用）

### 遷移（改現有）

1. **H7** — 雙入改 `in-0`／`in-1`（F2）；H1-1 再改 expected＝非堵塞  

2. **H10** — 文案改「輸入無法匹配」；可去掉誤導性 `primaryOutput: 源石粉末` 標籤  
3. **G2** — 文案改 E1／mode 語意  
4. **G1**（可選）— 改合法 pipe 連線，或註明 loose 邊

### 新建（`group: 'v9'` 建議）

| 建議 ID | 情境 |
|---------|------|
| `v9-full` | （可選）H1 複本：滿速＋E1 文案 |
| `v9-half` | （可選）H2 複本 |
| `v9-no-sink` | 有加工無 Sink → 非法 |
| `v9-missing-water` | 精煉爐僅赤銅礦 → 無產出／非法；對照齊全版 |
| `v9-swap-feed` | 同粉碎機：源礦 vs 砂葉（兩 preset 或一切換說明） |
| `v9-xi-rang` | D1 息壤最短鏈：芽針→碳塊；碳塊＋清水→息壤→Sink（environment=stable） |

---

## 6. DoD

- [x] 上表「V9 處置」欄全部填寫  
- [x] 產出給 F2 的「新建／遷移」清單  
- [x] 與 todolist 封鎖列同步解除條件  

---

## 7. 開發日誌

### 2026-08-02

- 建立盤點骨架與初評風險  
- 依 B2／E1 後 `presetData` 實況填處置；解鎖 F2  
- **驗收補記：** H7 遷移後仍可能無堵塞邊 → 追 [H1_acceptance_followups.md](./H1_acceptance_followups.md)  
- **H1-1：** 初版方案 A 後更正為方案 B（引擎同品多入分攤；H7 入邊約 15／15）
