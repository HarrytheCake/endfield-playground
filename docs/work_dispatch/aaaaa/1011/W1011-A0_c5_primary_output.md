# W1011-A0｜aaaaa｜派工已發；C5 `setDevicePrimaryOutput`（寫入端）

| meta | value |
|------|-------|
| 週次 | 2026-10-11 → 2026-10-18 |
| 等級 | **確定・兩件**（流程＋ L1 action） |
| 擋門檻 | 否（但擋 10/18 引擎讀切片） |
| 上游 | [WEEK_20261011](../../WEEK_20261011.md)、[C5 §4.1a](../../../roadmap/detail/C5_source_primary_output.md)（已裁 B） |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 派工在 `docs/work_dispatch/`；action 在 `layoutStore`｜不要改 `GridCanvas`／`MainLayout`／正式頁表單 UI｜toby（C1）、harry（左面板日後接表單）、dernoson（合入） |

---

## 0. 白話目標

主編已裁 C5 寫進 **`layoutStore`／`PlacedDevice.primaryOutput`**。本週你交**寫入端**：高階 action＋測試。引擎怎麼讀到這個欄位，**下週（10/18）再做最小切片**——但 PR 裡要寫明你選定的接法（經 `toTopology` 或直接讀），方便下週開工。

| # | 件 | 為什麼現在做 |
|---|----|--------------|
| ① | 派工已發（`WEEK_20261011` v1.1＋十張 `1011/`） | 會議／週報結算後發工 |
| ② | **`setDevicePrimaryOutput`** | 沒有它，源設備永遠產不出數字；10/18 引擎讀也無欄可讀 |

---

## 0.1 問卷與結算回寫（2026-10-12）

W1004 週報 **10／10**。個人檔 **v3.4**、`gitcommit_analyze` 2026-10-12。  
W1004：換殼／無邊界／出界／埠命中已合；#48／#62／#64 待審。  
**v1.1 依 10/11 會議重派：** toby＝設備拖曳（只呼叫你的 `moveDevice`／`canMoveDevice`）；**C1 owner 轉待裁**。本單內容不變。

---

## 1. ② `setDevicePrimaryOutput`（必做）

```text
setDevicePrimaryOutput(uid, itemId | null, ratePerMin?) → void
// 寫入 PlacedDevice.primaryOutput（與既有型別一致）；進歷史；可 Undo
```

- 掛 **`layoutStore`**（裁決 B）；**不要**寫 `editorStore`
- 純測試覆蓋：設定／清除／未知 uid
- **本週不做：** 正式頁下拉表單、整包右側產耗、引擎改掛（只在 PR 註明下週接法）

---

## 2. 不要做

- 改 `GridCanvas`／`LayoutView`（toby 拖曳）
- 改 `MainLayout`（harry）
- 引擎全面改讀 `layoutStore`（10/18）
- 再寫派工長文當主交付以外的範圍膨脹

---

## 3. DoD

- [x] `WEEK_20261011` 與十張工單在本分支
- [ ] `setDevicePrimaryOutput` 有測試；進歷史
- [ ] PR 註明 10/18 引擎讀取最小接法（一句話即可）
- [ ] 未改 `editorStore` 簽名；未改 C1 檔
