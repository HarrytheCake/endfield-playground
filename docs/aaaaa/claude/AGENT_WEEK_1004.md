# Agent 週摘要｜2026-10-04 → 10-11（1004｜連線月第一週・L1 前置）

| meta | value |
|------|-------|
| version | **v1.7（2026-10-11；③ 修熱區圓心，後續 PR）** |
| 用途 | 供 Agent 執行本週派工／改工單時的**強制約束**；細節以公開 WEEK 與個人工單為準 |
| 公開 | [WEEK_1004](../../work_dispatch/WEEK_20261004.md) v1.2、[W1004-A0](../../work_dispatch/aaaaa/1004/W1004-A0_dispatch_and_e003.md) |
| 執行計畫 | [todolist_v15](../dev/todolist_v15.md)、[dev_v15/](../dev/dev_v15/) |
| 決策層 | [1004/REVIEW](../collaborator_survey/dispatch_private/1004/REVIEW_20261004.md)、[1004/E3](../collaborator_survey/dispatch_private/1004/E3_risk_backup_staffing.md)、[1004/PENDING](../collaborator_survey/dispatch_private/1004/PENDING_DECISIONS_20261011.md) |
| 操作總則 | [AGENT_ROADMAP](./AGENT_ROADMAP.md)（v1.6；檔案地圖仍指 0907，已知過期） |
| 撰寫 | aaaaa |
| 最後更新 | 2026-10-10 |

---

## 0. 三十秒結論

**V15＝W1004-A0 兩支 L1 純函式。**  
①／B1／② 已完成，② 在 #60 待合。**③ 熱區圓心已改埠視覺邊心**，後續 PR 分支 `dev/aaaaa1004-hitTestPortAt`。  
本週不派 C1 UI、不碰正式頁換殼檔；C5 action 排 10/11–10/18。  
**仍待定：** C1 的 L2 owner（PENDING A-2）。

---

## 1. 優先序（必須遵守）

| 序 | 內容 | 工單／文件 |
|----|------|------------|
| ~~0~~ | ~~派工已發（WEEK＋十張工單）~~ | **已完成**；W1004-A0 ① |
| ~~1~~ | ~~V14 殘項收斂~~ | **已完成**；[V15-B1](../dev/dev_v15/B1_v14_residue_close.md) |
| ~~2~~ | ~~② 出界 id 列表~~ | **已完成**；[V15-C1](../dev/dev_v15/C1_devices_outside_base.md) |
| 3 | ③ `hitTestPortAt` 修座標慣例（後續 PR） | [V15-D1 §8](../dev/dev_v15/D1_port_hit_test.md) |
| 4 | #60 合入＋交接 | [V15-E1](../dev/dev_v15/E1_acceptance_and_handoff.md) |
| — | **禁止**選取設備互動／旋轉／Delete（管線點選是別人的事） | WEEK §2 |
| — | **禁止**改 `GridCanvas`／`MainLayout`／`ToolbarPanel` | 鎖表 §2.2 |
| — | **禁止**本週實作 C5 action／引擎接 layoutStore | 排 10/11–10/18 |

---

## 2. 禁止表

| 禁止 | 理由 |
|------|------|
| 碰 `GridCanvas.vue`／`LayoutView.vue`／`useGridViewport.ts` | toby 本週鎖 |
| 碰 `MainLayout.vue` | harry 本週全檔鎖 |
| 碰 `ToolbarPanel.vue` 意圖層／視覺 | goodmorning；arm 不准刪 |
| 碰 `src/app/StatsPanel/*` | shirone |
| 碰 `src/lib/validation/detectors/*` | azure Z1 |
| 碰 `src/components/TopBarButton/` | MBD |
| 改 `canPlaceDevice` 拒絕條件把出界當擋落子 | 出界＝Error 視覺；**仍放得下**（spec／#57 S2-2） |
| 修 `LayoutView` 自動載入 fixture | S1-2；與 T1 搶行為 |
| 引擎改接 `layoutStore`／整包右側產耗 | 十一月 D1；C5 引擎讀取切片＝10/18 |
| 自己開 C1 互動／draft UI | 10/11 L2 工單 |
| 另寫一套佔格／埠座標算法（不共用既有幾何） | 會變第三套；toby／C1 日後分歧 |
| 公開工單寫入風險等級／個人檔連結 | 公開／私密分界 |
| 發明 detail／定案沒有的範圍 | [AGENT_ROADMAP §6.1](./AGENT_ROADMAP.md) |

---

## 3. 契約形狀（已定／待決分開）

| 項 | 結論 |
|----|------|
| ② 簽章方向 | `devicesOutsideBase(devices, region) → string[]`（出界 `PlacedDevice.id`） |
| ② 行為 | 純函式；**不寫 store**；**不改** `canPlaceDevice` |
| ② 佔格 | 沿用 `getDeviceOccupiedCells`／既有基地範圍判定，不另寫 |
| ③ 函式 | **`hitTestPortAt`**＠`src/utils/layout/portHitTest.ts`；舊 `findPortAt` 不動（A-1＝A） |
| ③ 輸入 | **連續格座標**，原點＝格左上角（像素下限由 L2 換算）；熱區圓心＝埠視覺位置（設備邊上埠邊心），**不是**錨點格索引 |
| ③ 回傳 | **已決**＝`PortRef`＋`side`＋`media` |
| C5 store | **已裁 B**；本週不交 action |
| 解鎖句 | **本版不發** |
| 分支 | `dev/aaaaa1004` |

---

## 4. 本週結束應更新

| # | 動作 | 誰／何處 | 狀態 |
|---|------|----------|------|
| 1 | ②／③ 合入；回寫 ROADMAP C1 前置進度句（若有） | aaaaa | `[ ]` |
| 2 | 回寫 todolist_v15 狀態 | Agent／aaaaa | `[ ]` |
| 3 | REVIEW／E3／PENDING 日誌補一行 | 決策層 `1004/` | `[ ]`（開版已建） |
| 4 | 10/11 驗收結果回寫 WEEK／ROADMAP（V10） | 主編／aaaaa | 結算時 |
| — | **不動** CLAUDE §4.6 索引、AGENT_ROADMAP 版本 | 已知過期，下次一併補 | 維持 |

---

## 5. 驗收對照（公開）

以 [WEEK_20261004 §0.2](../../work_dispatch/WEEK_20261004.md) 為準。aaaaa 對應 **V10**（兩支純函式）。

| 項 | 對象 | 本週目標 |
|----|------|----------|
| **V10** | aaaaa A0 | `devicesOutsideBase`＋埠命中皆有測試；後者不改 store；熱區 ≥ 半格 |
| V1 | toby T1 | 無邊界＋基地框（消費 ②） |
| V2–V9 | 其餘 | 換殼／#48／樣式／設計／閘門／Z1／M1——**零檔案交集** |

> 判定實況一律以 `git`／`gh` 為準，不以文件宣稱為準。

---

## 6. 日誌

### 2026-10-11（v1.7）

- ③ 後續：`portPointOnMachine` 作熱區圓心；四向視覺點測試；分支 `dev/aaaaa1004-hitTestPortAt`

### 2026-10-11（v1.6）

- #60 審查：② 通過先合；③ 熱區圓心落在錨點格左上角，移出另開後續 PR

### 2026-10-10（v1.5）

- V15-D1 完成：`hitTestPortAt`＋測試；下一＝E1

### 2026-10-10（v1.4）

- V15-C1 完成：`devicesOutsideBase`＋測試；下一＝D1 `hitTestPortAt`

### 2026-10-10（v1.3）

- V15-B1 完成：#54／#55 已合查證；todolist_v14 結案；下一＝C1

### 2026-10-10（v1.2）

- B-1＝PortRef＋side＋media；③ 簽章釘死

### 2026-10-10（v1.1）

- 負責人裁：A-1＝`hitTestPortAt`；格點；分支 `dev/aaaaa1004`；V15-A1 照草案
- A-2 查證：T1／H1 未派 C1；WEEK／D0 仍待週日會；建議偏 toby
- B-1 影響表進 PENDING；建議 PortRef 擴充

### 2026-10-10（v1.0）

- 對齊 `origin/master`（含 #54／#55／#56／#57／#59）
- 依 WEEK v1.2／W1004-A0 開 AGENT_WEEK；執行計畫＝todolist_v15＋dev_v15
- 對齊決策層 `dispatch_private/1004/`（REVIEW／E3／INTRO／PENDING）
- 標註埠命中與既有 `findPortAt` 撞名為開工前必決（PENDING A-1）
