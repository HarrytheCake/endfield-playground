# Agent 週摘要｜2026-10-11 → 10-18（1011｜會議重派）

| meta | value |
|------|-------|
| version | **v1.1（2026-10-12；依 10/11 會議重派）** |
| 用途 | Agent 執行本週派工／改工單時的強制約束 |
| 公開 | [WEEK_1011](../../work_dispatch/WEEK_20261011.md) v1.1、[W1011-A0](../../work_dispatch/aaaaa/1011/W1011-A0_c5_primary_output.md) |
| 決策層 | [1011/REVIEW](../collaborator_survey/dispatch_private/1011/REVIEW_20261011.md)、[1011/E3](../collaborator_survey/dispatch_private/1011/E3_risk_backup_staffing.md) |
| 撰寫 | aaaaa |
| 最後更新 | 2026-10-12 |

---

## 0. 三十秒結論

**aaaaa 本週＝派工①＋C5 `setDevicePrimaryOutput`。**  
toby 本週＝設備拖曳；**C1 會議未派、待裁**——不要自己開 draft／改 GridCanvas。  
引擎讀取切片＝**下週**；本週 PR 只註明接法。

---

## 1. 優先序

| 序 | 內容 |
|----|------|
| 0 | 派工已發（WEEK＋十張） |
| 1 | `setDevicePrimaryOutput`＋測試＋進歷史 |
| — | **禁止**改 GridCanvas／MainLayout／ToolbarPanel |
| — | **禁止**本週做引擎整包改掛／右側產耗表 |

---

## 2. 禁止表

| 禁止 | 理由 |
|------|------|
| 碰 `GridCanvas`／`LayoutView` | toby 拖曳 |
| 碰 `MainLayout` | harry |
| 寫 `editorStore` 的 primaryOutput | 裁決 B＝layoutStore |
| 正式頁源素材表單 UI | 可延；本週只要 action |
| 公開工單寫風險等級／個人檔連結 | 公開／私密分界 |

---

## 3. 契約

```text
setDevicePrimaryOutput(uid, itemId | null, ratePerMin?) 
→ 寫 PlacedDevice.primaryOutput；進歷史
```

---

## 4. 本週結束應更新

| # | 動作 |
|---|------|
| 1 | C5 action 合入；roadmap C5 狀態 |
| 2 | WEEK 驗收勾選（若結算） |
| 3 | 10/18 引擎讀切片開工前確認 PR 註記 |
| 4 | 追 C1 owner 裁示（PENDING A-2 重開）；裁定後回寫 roadmap §9 |
