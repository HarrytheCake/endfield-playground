# W1011-D0｜dernoson｜週閘門＋清待審（會議重派＋裁決回寫）

| meta | value |
|------|-------|
| 週次 | 2026-10-11 → 2026-10-18 |
| 等級 | **確定**（決策／合入，不兼功能） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261011](../../WEEK_20261011.md) v1.2 |
| 待審上限 | ≤3 |

---

## 1. 本週你要守的裁決

| # | 裁示 | 閘門含義 |
|---|------|----------|
| 會議優先 | 10/11 會議派工取代 v1.0 | 工單＝T2／H2／G2／S2／P2／M2／Z2／V1 |
| **A／B 組** | **[PR #66](https://github.com/dernoson/endfield-playground/pull/66) 已裁：照暫定** | WEEK §2.3 |
| 設備拖曳 | 已放設備移位＋**拿起＝淺藍**（白紙稿） | 無拿起樣式／拖曳中寫 store 退回 |
| 左側面板 | `ProjectSidebar` **連檔刪**；選中＝local ref | `MachineCard` 內部被改退回；本週不進 store |
| 畫布樣式 | 一律 `shapes/` 子元件 | 作者直接改 `GridCanvas` 退回 |
| W001／A-5 | 未填＝`modes[0]`；無配方不報；E004 同套 | Z2 ③ 可拆下一則 |
| **C1 owner** | **toby**（T2 後、10/18 週） | 見 §4 |
| M3 備案 | C1 趕不上 → 相鄰兩台直線 | B-2 |
| Ctrl+Z | 不算 M3；排 11 月 | B-3 |
| 選取 | 旋轉／Delete **仍退** | 同 W1004 |
| 「已開 PR」 | 以 `gh` 為準 | — |

---

## 2. 合入序

**#64（Z2）→ #62（S2，待 paper approve）→ #48（G2 rebase 後）→ T2 → H2 → A0 → 樣式子元件（G2／S2／V1／M2）。**

| PR／分支 | 看什麼 |
|----------|--------|
| #64 | 導流清單含匯流器／物流橋＋三則測試；無 `editorStore.edges =`；A-5 三點；Context 未動 |
| #62 | paper 已 approve；無第三 StatsPanel 目錄 |
| #48 | `listToolbarMachines`；`arm` 仍在 |
| T2 | 拖曳中只用 local ref；**拿起＝淺藍**；空白仍平移；emit `select-device`；GridCanvas 無 Pinia |
| H2 | 只 MainLayout（＋轉接檔）；`MachineCard` 未改；**`ProjectSidebar` 檔已刪**；選中不進 store |
| A0 | `setDevicePrimaryOutput` 在 layoutStore；有測試 |
| shapes／icon | 根 `<g>`；只吃 props；DeviceShape 拖曳中＝淺藍；有 Storybook；未改 GridCanvas |

---

## 3. 週中主動問

| 人 | 為什麼 | 問什麼 |
|----|--------|--------|
| toby | 拖曳＋C1 已定給他 | 週中拖曳能否演示淺藍拿起；10/18 C1 開工準備 |
| goodmorning | #48 連續滯留 | rebase 有無卡點 |
| paper | #62 等她 approve；拿起樣式稿 | 本週何時審；淺藍稿已交給 T2／G2？ |

azure／avery／shirone（考試／Python 月）**不必空 ping**，週日看交付即可。

---

## 4. 已裁（原 WEEK §2.3）——無需再問

A-1～A-5、B-1～B-3 皆已決。C1＝toby。細節見 [WEEK §2.3](../../WEEK_20261011.md)。

---

## 5. DoD

- [ ] 待審壓回 ≤3（或明寫卡點）
- [x] C1 owner 已裁（toby）
- [ ] 旋轉／Delete 未被放行
- [ ] 未兼寫功能碼（規則 17）
