# Agent 週摘要｜2026-09-07 → 09-13（0907）

| meta | value |
|------|-------|
| version | **v1.0（2026-09-11；定案：A0 layoutStore 最優＋L2 只讀閘）** |
| 用途 | 供 Agent 執行本週派工／改工單時的**強制約束**；細節以公開 WEEK 與個人工單為準 |
| 公開 | [WEEK_0907](../../work_dispatch/WEEK_20260907.md) v1.1、[W0907-A0](../../work_dispatch/aaaaa/0907/W0907-A0_layout_store_model.md) |
| 執行計畫 | [todolist_v12](../dev/todolist_v12.md)、[dev_v12/](../dev/dev_v12/) |
| 決策層 | [0907/REVIEW](../collaborator_survey/dispatch_private/0907/REVIEW_20260907.md)、[0907/E3](../collaborator_survey/dispatch_private/0907/E3_risk_backup_staffing.md) |
| 操作總則 | [AGENT_ROADMAP](./AGENT_ROADMAP.md) |
| 撰寫 | aaaaa |
| 最後更新 | 2026-09-11 |

---

## 0. 三十秒結論

本週 Agent **必須**把 aaaaa 的 **A0（`layoutStore`）** 當最高優先；**禁止**在本週解鎖或鼓勵 L2 擺放／選取／落子。toby／harry 僅只讀渲染與視窗座標。

---

## 1. 優先序（必須遵守）

| 序 | 內容 | 工單／文件 |
|----|------|------------|
| 0 | V11 文件殘項收斂（前置） | [V12-B1](../dev/dev_v12/B1_v11_residue_close.md) |
| 1 | **layoutStore 契約** | [W0907-A0](../../work_dispatch/aaaaa/0907/W0907-A0_layout_store_model.md)、[V12-C1](../dev/dev_v12/C1_layout_store.md) |
| 2 | `/dev` store 演示（週會必要） | [V12-D1](../dev/dev_v12/D1_dev_store_preview.md) |
| 3 | 驗收＋解鎖句（本週仍只讀） | [V12-E1](../dev/dev_v12/E1_acceptance_and_unlock.md) |
| 4 | 不強綁加分／閘門 | D0／T1／H1／S1／G1／P1／V1 各人 `0907/` |
| — | **禁止**擺放／選取／加深 FactoryCanvas | WEEK §2 |

時數衝突時：**A0（C1）＞ D1 演示**；兩者皆必要，但契約未綠不得假裝解鎖。

---

## 2. 禁止表

| 禁止 | 理由 |
|------|------|
| 改 `editorStore` 簽名／做藍圖遷移 | A0 邊界；D4 本週不做 |
| 改 `GridCanvas.vue`／`useGridViewport`／為接 store 回頭改 toby／harry | 規則 17；9/14 再接 |
| 動 `ToolbarPanel.vue` | 全員硬鎖 |
| 解鎖句寫成「可開擺放／選取」 | 負責人定案：本週仍只讀 |
| 在 store 重寫幾何／連線演算法 | 組用 `utils/layout/*` |
| 主編功能實作／代寫 GridCanvas | 規則 17 |
| 公開工單寫入風險等級／個人檔連結 | 公開／私密分界 |
| 發明 detail／定案沒有的範圍 | AGENT_ROADMAP §6.1 |

---

## 3. 契約形狀（已定案，勿另議）

| 項 | 結論 |
|----|------|
| store | 單一 Pinia |
| 唯讀 | return `readonly()` |
| 放置 | `{ ok: true } \| { ok: false; reason: 'overlap' \| … }`；不 throw |
| `/dev` | 必要（週會） |
| 解鎖 | `layout-store：…`；未到擺放則「本週仍只讀」 |

---

## 4. 本週結束應更新

| # | 動作 | 誰／何處 |
|---|------|----------|
| 1 | A0 是否達 DoD → 解鎖句或「缺什麼」 | aaaaa；PR／Discord |
| 2 | 回寫 todolist_v12 狀態與 evidence | Agent／aaaaa |
| 3 | ROADMAP §8／§9：store 進度；B2 仍封鎖擺放 | 依實際 PR |
| 4 | REVIEW／E3 日誌補一行 | 決策層 `0907/` |

---

## 5. 驗收對照（公開）

以 [WEEK_20260907 §0.1](../../work_dispatch/WEEK_20260907.md) 為準：  
**V1**＝aaaaa A0（本週唯一擋門檻）。個人步驟見 [V12_acceptance_guide](../dev/dev_v12/V12_acceptance_guide.md)。

---

## 6. 日誌

### 2026-09-11

- v1.0：A0 置頂；契約形狀寫死；禁止提前解鎖擺放
- 對齊 WEEK v1.1、todolist_v12、dispatch_private/0907
