# V21 TODOLIST — Lab 輕量可調參試玩（草案）

**版本：** V21
**建立日期：** 2026-11-01
**負責人：** aaaaa
**前置／開工閘門：** **[V19](./todolist_v19.md)＋[V20](./todolist_v20.md) 收斂完畢**（見下「收斂定義」）；決策 [V20-F1](./dev_v20/F1_tryout_not_swagger.md)
**正式依據：** [V20-F1](./dev_v20/F1_tryout_not_swagger.md)、[A0 牌程](./dev_v21/A0_tryout_panel_plan.md)；公開 WEEK／Wxxxx **待補**
**上游：** [todolist_v19](./todolist_v19.md)、[todolist_v20](./todolist_v20.md)、[AGENT_WEEK_1102](../claude/AGENT_WEEK_1102.md)
**週次：** 待定（接 V19／V20 **合入之後**）
**開發分支：** 待開版裁（建議自已含 V19＋V20 的 `origin/master` 新開）
**狀態總覽：** **`[ ]` 草案**（決策＋牌程已備；**閘門未開**；正式開版＝V21-A1）
**待確認問題：** 開版時覆核（分支名、試玩＝獨立分頁或內嵌、是否含 canConnect）

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中
>
> **開工閘門（硬）：** **V21-A1／C1 實作條件＝V19＋V20 收斂完畢。**  
> **收斂定義：**（1）V19／V20 主線 DoD 皆 `[x]`；（2）相關變更已 **合入 `master`**（PR MERGED；以 `git`／`gh` 為準）。僅分支上主線完成、**未合 master ＝未收斂**。  
> 決策／牌程文件可先備；**閘門未開前不開 V21 實作、不開 V21-A1。**
>
> **範圍宣告（草案）：** 在 `/dev/l1-contract-lab` 加**輕量可調參試玩**（白名單 API＋有限欄位＋JSON）。**不做**完整 Swagger／OpenAPI／codegen／第二 hub；**不改**畫布／簽名。
> **執行計畫：** 正式開版後＝本檔＋`dev_v21/`；目前細節見 [A0](./dev_v21/A0_tryout_panel_plan.md)。

---

## 概述

### 目標

1. hub 內可對少數 API **改參數再執行**（真呼叫）
2. 保留情境快捷（對齊現有一鍵案例）
3. response 以 JSON＋少數固定情境為主，非 schema 瀏覽器

### 建議已定方向（開版可覆核）

| # | 項 | 草案結論 |
|---|-----|----------|
| 1 | 產品 | **輕量試玩**；非 swagger（[F1](./dev_v20/F1_tryout_not_swagger.md)） |
| 2 | 第一刀 API | `hitTestPortAt`、`findPortAt`（P0）；`canConnect`（P1） |
| 3 | 頁面 | 同一 lab；建議新「試玩」分頁 |
| 4 | 自動／OpenAPI | **不做** |
| 5 | 解鎖句 | 不發 |

### 非目標

- 完整 Swagger UI／OpenAPI／任意 JSON 請求
- 全 inventory 自動產生表單
- F0 §2.3 全量 catalog（另牌）
- 改 `LayoutView`／`GridCanvas`／store／utils 簽名

### 牌程（摘要）

見 [A0 §3](./dev_v21/A0_tryout_panel_plan.md)：

```text
牌0 V19＋V20 收斂（硬閘）→ 牌1 A1開版 → 牌2 C1試玩殼＋P0
  → 牌3 D1 canConnect → 牌4 E1驗收
```

### 閘門現況（2026-11-01 核）

| 項 | 狀態 |
|----|------|
| V19 主線 DoD | `[x]`（分支） |
| V20 主線 DoD | `[x]`（分支） |
| PR → master／MERGED | **`[ ]` 未開 PR**（`dev/aaaaa1026`；尚有未提交變更） |
| **收斂完畢？** | **否** → **V21 實作／A1 不開** |

---

## V21-A｜開版（待做・閘門後）

- [ ] **V21-A1** 確認 V19＋V20 已合 master；正式開版；覆核 F1／A0；開分支；建 C1／D1／E1
    - **前置：** 收斂定義兩條皆滿足
    - 輸入：[F1](./dev_v20/F1_tryout_not_swagger.md)、[A0](./dev_v21/A0_tryout_panel_plan.md)

---

## V21-C｜試玩殼＋P0

- [ ] **V21-C1** 試玩 UI＋`hitTestPortAt`／`findPortAt` 可調參
    - 準則：A0 §2／§5

---

## V21-D｜P1

- [ ] **V21-D1** `canConnect` 可調參＋成功／失敗情境
    - 準則：A0 §2／§5

---

## V21-E｜驗收

- [ ] **V21-E1** USAGE／LAB／AGENT；品質閘；自檢非 swagger
    - DoD：A0 §5

---

## 封鎖／待決追蹤

| ID | 原因 | 等待 | 擋草案？ | 擋 A1／實作？ |
|----|------|------|----------|----------------|
| **GATE-1920** | V19＋V20 未合 master | 負責人開／合 PR | 否（可讀計畫） | **是（硬）** |
| V21-A1 | 正式開版下令 | 負責人（且 GATE 已過） | — | 是 |
| 公開 WEEK | 編號回填 | 主編 | 否 | 否 |

---

## 完成定義（草案）

- [ ] A0 §5 DoD
- [ ] 未做完整 swagger／OpenAPI／第二 hub
- [ ] 未改鎖檔／簽名

---

## 開發日誌

### 2026-11-01｜閘門確認

- **已確認：** V21 前提＝V19＋V20 **收斂完畢**（合 master）；牌0＝硬閘
- 現況：**未收斂**（無 PR／未 MERGED）→ 不開 A1

### 2026-11-01｜草案＋牌程

- 承接 V20-F1；A0 牌程 0→4 落檔
- 下一＝**先收斂 V19＋V20**，再裁 V21-A1
