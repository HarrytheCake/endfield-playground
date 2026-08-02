# V9-F2 — 分項演示 Preset

**對應工項：** V9-F2  
**狀態：** ✅ 完成  
**依賴：** F1 ✅、B2、D1、E1、C2  
**最後更新：** 2026-08-02

---

## 1. 目標

在 `/dev/flow-engine` 依 F1 結論遷移／新建演示，覆蓋約定 1–8 情境。

盤點結論見 [F1_case_inventory.md](./F1_case_inventory.md)。

---

## 2. 已落地

### 遷移

| ID | 動作 |
|----|------|
| H7 | 雙入 `in-0`／`in-1`；H1-1 方案 B：入邊平分堵塞約 15／15 |
| H10 | 文案→E1 輸入無法匹配；去掉誤導配方標籤 |
| G2 | 文案→base_mode 下無匹配；不再寫死 liquid index |
| G1／L1 | 改合法 pipe／belt handle（不再 loose） |

### 新建 `group: v9`

| ID | 情境 | 需求 # |
|----|------|--------|
| `v9-no-sink` | 源→粉碎、無 Sink | 5a |
| `v9-missing-water` | 精煉僅赤銅礦 | 5b、8 |
| `v9-swap-ore` | 源礦→源石粉末 | 8 |
| `v9-swap-sand` | 砂葉→砂葉粉末 | 8 |
| `v9-xi-rang` | 息壤最短鏈（stable） | 7 |

沿用：H1（#1）、H2（#2）、H3／H11（#3）、H8（#4）、H5（#6）。

### UI

- Preset 列新增 **V9 演示** 分組  
- **D1 最短鏈套用**：產品下拉 →「產生演示圖」（抽象邊，便於跨媒質）

---

## 3. DoD

- [x] F1 migrate／新建清單落地  
- [x] 需求 1–8 皆有可點 preset 或一鍵腳本  
- [x] `pnpm type-check` + `pnpm test`（282）通過  

---

## 4. 開發日誌

### 2026-08-02

- 建立骨架；F1 解鎖後填 ID  
- 完成遷移、v9 preset、最短鏈套用、本檔標完成  
- 驗收：H7／D1 套用問題記入 [H1](./H1_acceptance_followups.md)  
- H1-1：引擎同品多入分攤＋H7 expected（方案 B）
