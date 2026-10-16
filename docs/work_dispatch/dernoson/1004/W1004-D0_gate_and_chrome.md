# W1004-D0｜dernoson｜連線月第一週：換殼閘門＋清 #48＋兩人復工

| meta | value |
|------|-------|
| 週次 | 2026-10-04 → 2026-10-11 |
| 等級 | **確定**（決策／合入，不兼功能） |
| 擋門檻 | 否 |
| 上游 | [WEEK_20261004](../../WEEK_20261004.md) **v1.2** |
| 待審上限 | ≤3 |

---

## 1. 本週你要守的裁決（會議已口頭給過）

| # | 裁示 | 閘門含義 |
|---|------|----------|
| 連假 | M2 驗收延到 10/04；功能門檻以 #54／#55 算過 | 不要再卡「9/27 沒演示所以 10 月不能派」 |
| 問卷 | 未齊仍派工（現已 9／10） | 不要等表單 |
| 打底 | 自建畫布鏈已在 master | 放行 T1／H1／L3 |
| 選取 | **管線可點、變藍、左面板出現**；旋轉與 Delete **仍退回** | 與 9/23 不同，以本週 WEEK §2 為準 |
| Inspector | **卸掉正式頁掛載**；**不准刪 `.vue` 檔** | H1 只改 `MainLayout` |
| #48 | 必須先合，否則 H1 掛不到新工具列 | CONFLICTING → 退回請 rebase，或約定代修 |
| **azure** | 會議點名復工 → **Z1**（原 Z0 暫停單作廢） | 本月提前開 R-D3；ID 表要你凍結 |
| **MBD** | 會議點名四顆按鈕 → **M1**（原 M0 作廢） | 新目錄、不共檔，所以可以恢復派功能 |
| **avery** | 主編裁再放一週、**不除名** | V0；不算完成率、不催 |

---

## 2. 合入序

**#57 文件 → G1（#48）→ T1 → S1 樣式 → H1 換殼 → 設備樣式。**

Z1（detector）與 M1（Storybook 元件）**不在這條序上**——它們不碰正式頁的檔，哪天送來就哪天審，不必排在 #48 後面。

| PR | 看什麼 |
|----|--------|
| #57 | 只文件／spec；可先合 |
| #48 | 真實機器資料來源；不得刪 `arm`；與 master 無衝突 |
| T1 | `GridCanvas` 無 store；出界不擋 `addDevice` |
| H1 | MainLayout 拿掉底欄舊槽與 `InspectorSidebar`；檔案仍在 |
| G／S 設備樣 | 只動佔格視覺區；不要改 toby 的視窗數學 |
| **Z1** | 用 master 現行 `Detector` 介面；**無 `validation_OLD.ts`**、無 W002／W003、`ValidationContext` 欄位未動；detector 無 Vue／Pinia |
| **M1** | 新目錄 `src/components/TopBarButton/`；**無 store import**；PR 內**不得夾帶** StatsPanel／MainLayout 改動 |

---

## 3. 本週要你裁的兩件——**已裁（2026-10-06｜PR #59）**

| # | 題目 | 裁決 | 回寫 |
|---|------|------|------|
| **R-1 C5 store** | `primaryOutput` 寫進哪個 store | **B**——`layoutStore`／`PlacedDevice`；引擎讀取端隨 10/18 提前一部分 D1 鏈 | [C5 §4.1a](../../../roadmap/detail/C5_source_primary_output.md)、roadmap v1.16 |
| **R-2 D3 ID 表** | E004／E005／W001；W002／W003 不收 | **同意凍結** | [D3 §4.1](../../../roadmap/detail/D3_recipe_alerts.md) |

**仍待週日會定：** C1 的 L2 owner（toby 或 harry）。

---

## 4. 週中要主動問一次的人

| 人 | 為什麼 | 問什麼 |
|----|--------|--------|
| **azure9572** | 問卷自報「先自己撐一陣子再講」＋兩個月沒進 master＋PR 流程生疏 | 分支開了沒、E004 跑得出來嗎 |
| goodmorning | #48 已拖過 9/13，且現為 CONFLICTING | rebase 進度；要不要代修 |

MBD 不用催（有新目錄、自報 3–5h、週報已補）。avery 本週不催。

---

## 5. 鎖表

整段貼 Discord（含暫停者）。見 [WEEK §2.2](../../WEEK_20261004.md)。本週鎖表新增兩列：`src/lib/validation/detectors/*`＝azure、`src/components/TopBarButton/`＝MBD。

---

## 6. DoD

- [ ] #48 合入或明寫卡點／代修
- [ ] 待審 ≤3
- [ ] 旋轉／Delete 接線未放行
- [ ] 管線選取若送審：只視覺＋左面板，可過
- [x] D3 ID 表已凍結並回寫 [D3 細項](../../../roadmap/detail/D3_recipe_alerts.md) §4.1 —— **R-2 同意**
- [x] C5 store 歸屬已裁並回寫 roadmap —— **R-1＝B**
- [ ] azure 週中已問過一次
