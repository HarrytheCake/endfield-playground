# V21-A0 — 輕量可調參試玩：範圍、牌程、DoD（草案計畫）

**對應：** [todolist_v21](../todolist_v21.md)（草案）
**狀態：** `[x]` 計畫落檔（2026-11-01；**實作未開**；正式開版＝V21-A1）
**決策依據：** [V20-F1](../dev_v20/F1_tryout_not_swagger.md)
**開發分支（建議）：** 待開版裁（**自已含 V19＋V20 的 `origin/master` 新開**）
**開工閘門（硬）：** [V19](../todolist_v19.md)＋[V20](../todolist_v20.md) **收斂完畢**（主線 DoD＋**合入 master**）

---

## 0. 前提（硬閘）

| 條件 | 說明 |
|------|------|
| V19 收斂 | Hub MVP 主線完成 **且** 合入 master |
| V20 收斂 | catalog 第一刀主線完成 **且** 合入 master（可與 V19 同 PR） |
| 判定 | 以 `git`／`gh`（PR MERGED）為準；不以文件宣稱「主線完成」為準 |

**未收斂前：** 可改本計畫／todolist 草案；**禁止** V21-A1 正式開版與 C1／D1 實作。

---

## 1. 產品形狀（要長成什麼）

在既有 lab 加 **「試玩」區**（建議：獨立 hub 分頁，或 V15／V14 區塊內嵌）：

```text
選 API（少數白名單）
  → 填有限參數（數字／select／可選 prefer）
  →［執行］真呼叫
  → 下方 JSON（沿用現有 output 面板）
  → 旁列「情境快捷」（一鍵灌預設參數＝現有一鍵案例的可調版）
```

**不做：** OpenAPI、任意 body、全 inventory 自動表單、第二路由、改 L1 簽名。

---

## 2. 本版建議範圍（第一刀）

| 優先 | API | 可調參數（建議） | 情境快捷（例） |
|------|-----|------------------|----------------|
| P0 | `hitTestPortAt` | `x,y`；`prefer`（無／input／output） | 單機熱區；緊貼 prefer |
| P0 | `findPortAt` | `x,y`；`prefer`；裝置預設 crusher 錨點表唯讀 | 整數錨命中；熱區點→null |
| P1 | `canConnect` | 兩端錨點或簡化 waypoints 三點；`media` | 合法 belt；端點錯位 |

**本刀不做（列再下一刀）：** `addPipeline` 表單化、`resolveConnections` 全管線編輯、gap bounds 完整 UI、其餘 inventory `todo`。

---

## 3. 開發牌程

> 單位＝工作切片（非日曆死線）；**建議順序**如下。公開 WEEK 有檔後只回填週次。

```text
牌 0｜V19＋V20 收斂（硬閘）
  開 PR → 合 master（可同 PR）
  └ 未 MERGED＝不開 V21-A1／實作；文件草案可先備

牌 1｜V21-A1 正式開版
  核對 master 已含 V19＋V20；覆核 F1／本檔；定分支；建 C1／D1／E1
  └ 產出：todolist_v21 升為進行中

牌 2｜V21-C1 試玩殼＋P0 兩 API
  hub「試玩」分頁（或區）；參數表單元件（dev 內）
  hitTestPortAt、findPortAt 可調參＋情境快捷
  └ 估計：中（UI 殼＋兩呼叫）

牌 3｜V21-D1 P1 canConnect
  可調參＋至少 2 情境快捷；失敗走 describeConnectFailure 顯示
  └ 估計：小～中

牌 4｜V21-E1 驗收／交接
  USAGE／LAB／AGENT；品質閘；未做 swagger／codegen 自檢
  └ 估計：小

（平行／之後・不塞進 V21）
牌 B｜inventory F0 §2.3 下一刀（佔格／snapshot…）— 與試玩脫鉤
牌 C｜半自動 catalog diff — 仍另開版本
```

| 牌 | 工項 | 依賴 | 建議產出 |
|----|------|------|----------|
| 0 | V19＋V20 收斂 | 負責人開／合 PR | **master 含 Hub＋V20**（硬） |
| 1 | A1 | **牌 0 完成**＋F1 | 開版定案 |
| 2 | C1 | A1 | 試玩殼＋hitTest／findPortAt |
| 3 | D1 | C1（殼可重用） | canConnect 試玩 |
| 4 | E1 | C1＋D1 | 結案文件 |

---

## 4. 技術約束

| 項 | 規則 |
|----|------|
| 真呼叫 | 執行必須打真實 API |
| UI | 只動 `docs/`、`src/app/dev/*` |
| 裝置 fixture | 試玩用固定機型／座標預設；進階再擴 |
| Pinia | 若日後加寫入類試玩，必須隔離 |
| catalog | 試玩白名單可在 `contractCatalog` 加 `TRYOUT_APIS`（或同等） |

---

## 5. DoD（V21 實作完成時）

- [ ] 試玩入口在單一 hub 找得到
- [ ] P0 兩 API 可調參＋≥2 情境快捷各
- [ ] P1 `canConnect` 可調參＋成功／失敗可讀
- [ ] 無 OpenAPI／第二 hub／簽名變更
- [ ] USAGE／LAB 一句；品質閘綠

---

## 6. 開發日誌

### 2026-11-01｜閘門改硬

- 牌 0＝V19＋V20 收斂完畢（合 master）後才 A1

### 2026-11-01｜計畫落檔

- 承接 V20-F1；牌程 0→4；實作等收斂後 V21-A1
