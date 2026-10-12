# W1011-D0｜dernoson｜週閘門＋清待審（會議重派版）

| meta | value |
|------|-------|
| 週次 | 2026-10-11 → 2026-10-18 |
| 等級 | **確定**（決策／合入，不兼功能） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261011](../../WEEK_20261011.md) v1.1 |
| 待審上限 | ≤3 |

---

## 1. 本週你要守的裁決

| # | 裁示 | 閘門含義 |
|---|------|----------|
| 會議優先 | 10/11 會議派工取代 v1.0 | 工單已改為 T2／H2／G2／S2／P2／M2／Z2／V1 |
| 設備拖曳 | 走既有 `moveDevice`／`canMoveDevice` | 拖曳中寫 store、改 `layoutStore` 退回 |
| 左側面板 | `ProjectSidebar` 卸載；檔案刪不刪由你審時決定 | `MachineCard` 內部被改退回 |
| 畫布樣式 | 一律 `shapes/` 子元件 | 作者直接改 `GridCanvas` 退回 |
| W001 決議 | 只比對目前模式配方 | Z2 ③ 可拆下一則 |
| **C1 owner** | **待你裁**（建議 toby 10/18 週接） | 見 §4 |
| 選取 | 旋轉／Delete **仍退** | 同 W1004 |
| 「已開 PR」 | 以 `gh` 為準 | — |

---

## 2. 合入序

**#64（Z2）→ #62（S2，待 paper approve）→ #48（G2 rebase 後）→ T2 → H2 → A0 → 樣式子元件（G2／S2／V1／M2）。**

| PR／分支 | 看什麼 |
|----------|--------|
| #64 | 導流清單含匯流器／物流橋＋三則測試；無 `editorStore.edges =`；Context 未動 |
| #62 | paper 已 approve；無第三 StatsPanel 目錄 |
| #48 | `listToolbarMachines`；`arm` 仍在 |
| T2 | 拖曳中只用 local ref；空白仍平移；emit `select-device`；GridCanvas 無 Pinia |
| H2 | 只 MainLayout（＋轉接檔）；`MachineCard` 未改；選中狀態不進 store |
| A0 | `setDevicePrimaryOutput` 在 layoutStore；有測試 |
| shapes／icon | 根 `<g>`；只吃 props；有 Storybook；未改 GridCanvas |

---

## 3. 週中主動問

| 人 | 為什麼 | 問什麼 |
|----|--------|--------|
| toby | 拖曳＋C1 可能順延給他 | 週中拖曳能否演示；10/18 週接 C1 可不可以 |
| goodmorning | #48 連續滯留 | rebase 有無卡點 |
| paper | #62 等她 approve | 本週何時審 |

azure／avery／shirone（考試／Python 月）**不必空 ping**，週日看交付即可。

---

## 4. 待裁（WEEK §2.3）

| 期限 | 項 | 一句話 |
|------|----|--------|
| **10/14** | A-1～A-5 | 拖曳定義、樣式交付形式、選中狀態位置、`ProjectSidebar` 刪檔、W001 模式邊界——工單已照暫定開工，**同意暫定回一句即可** |
| **10/18 會議** | B-1 | C1 owner（建議 toby，T2 合入後） |
| 10/18 會議 | B-2 | C1 趕不上時 M3 降為「相鄰兩台直線」 |
| 10/18 會議 | B-3 | Ctrl+Z 入口是否 M3 必要（建議否） |

會議未派 C1。若 10/18 週才開工，那週要同時吃 C1＋C3 套用＋C5 引擎讀。

---

## 5. DoD

- [ ] 待審壓回 ≤3（或明寫卡點）
- [ ] C1 owner 已裁
- [ ] 旋轉／Delete 未被放行
- [ ] 未兼寫功能碼（規則 17）
