# V21-C1 — 試玩殼＋P0（hitTestPortAt／findPortAt）

**對應工項：** V21-C1
**狀態：** `[x]` 完成（2026-11-08｜負責人下令開工牌 2；P0 兩支可調參）
**日期：** 2026-11-08
**依賴：** [A1](./A1_scope_decision.md) `[x]`
**準則：** [A0 §1／§2／§4](./A0_tryout_panel_plan.md)
**開發分支：** `dev/aaaaa1102`

---

## 1. 目標（牌 2 才做）

在既有 `/dev/l1-contract-lab` 加試玩區。A1 沿 A0：**建議新「試玩」分頁**。開工前若改成區塊內嵌，只改本檔，不重開 A1。

```text
選 API（白名單）
  → 填有限參數
  →［執行］真呼叫
  → JSON（沿用現有 output）
  → 旁列情境快捷
```

| API | 可調參數 | 情境快捷（例） |
|-----|----------|----------------|
| `hitTestPortAt` | `x,y`；`prefer`（無／input／output） | 單機熱區；緊貼 prefer |
| `findPortAt` | `x,y`；`prefer`；裝置預設錨點表唯讀 | 整數錨命中；熱區點→null |

本工項**不含** `canConnect`（見 [D1](./D1_can_connect_tryout.md)）。

---

## 2. 技術約束

| 項 | 規則 |
|----|------|
| 真呼叫 | 執行必須打真實 API |
| UI | 只動 `docs/`、`src/app/dev/*` |
| 簽名／畫布 | 不改 store／utils 簽名；不碰 `LayoutView`／`GridCanvas` |
| catalog | 可在 `contractCatalog` 加 `TRYOUT_APIS`（或同等） |
| 裝置 fixture | 固定機型／座標預設 |

---

## 3. 檔案

| 動作 | 檔案 |
|------|------|
| 改 | `src/app/dev/L1ContractLab.vue`（「試玩」分頁；JSON 仍用原輸出面板） |
| 改 | `src/app/dev/l1ContractLab/contractCatalog.ts`（`TRYOUT_APIS`） |
| 新增 | `TryoutPanel.vue`、`tryoutRun.ts` |
| 測 | `src/__tests__/app/dev/tryoutRun.test.ts` |
| 一句 | `docs/aaaaa/dev/USAGE_l1_contract_lab.md` |

---

## 4. 驗證標準

- [x] 試玩入口在單一 hub 找得到（分頁「試玩」）
- [x] 兩支 P0 API 可調參，各 ≥2 情境快捷
- [x] 無 OpenAPI／第二 hub／簽名變更
- [x] diff 不到 WEEK §2.2 鎖檔

---

## 5. 開發日誌

### 2026-11-08｜教學文案與交接

- 頁面改為先講「滑鼠點到的埠」和「管子接的格子」
- 會議報告與交接：[INTRO](../../../work_dispatch/aaaaa/1102/INTRO_meeting_v21_tryout.md)、[HANDOFF](../../../work_dispatch/aaaaa/1102/HANDOFF_tryout_p0.md)

### 2026-11-08｜實作

- 負責人下令開工牌 2（覆寫 W1102「本週不寫畫面」）
- hub「試玩」分頁：`hitTestPortAt` 三則快捷、`findPortAt` 兩則；執行打真實 API
- 不含 `canConnect`

### 2026-11-08｜建檔

- 牌 1 只建本細項；當時實作未開工
