# V6-F1 — 品質門檻與 DoD

**對應工項：** V6-F1  
**狀態：** 自動化完成；手動 M1–M7 待驗收（鎖定中）  
**依賴：** V6-B1、V6-C1、V6-D1、V6-D2  
**最後更新：** 2026-08-02

---

## 1. 背景與動機

實作合併前必須通過專案統一驗證，並滿足 todolist 文末 DoD。

---

## 2. 自動化驗證

依 `validate-changes` skill：

```bash
pnpm format && pnpm lint && pnpm type-check && pnpm test
```

針對性：

```bash
pnpm test -- src/__tests__/store/editorStore.test.ts
```

**結果（鎖定時）：** 自動化通過；見 D1 單元測試。

---

## 3. DoD 檢查清單（轉寫自 todolist）

- [x] A2 最終決策表已填
- [~] 單選／多選移動可 undo／redo（`/dev/history-replay` V6 一鍵 M1–M3；主畫布待簽）
- [~] 無雙重位移（預覽腳本已斷言；真拖曳 M7）
- [x] 主動 `moveDevices(delta)` 回歸通過
- [x] L2 無自組移動 Command
- [x] 管線跟隨未做但有文件註記
- [~] D2：預覽 M1–M6 就緒；M7／checklist 簽核待協作者
- [x] `docs/aaaaa/README.md` 已更新 V6 狀態（鎖定）

---

## 4. 回報格式建議

```text
V6 品質結果：
- format / lint / type-check / test: 通過 | 失敗
- editorStore 針對測試: 通過
- 手動 M1–M7: 通過（日期／執行者）
- 殘留風險:（例如管線不跟隨、FlowEngine 拖曳中重算）
```

---

## 5. 開發日誌

### 2026-08-01

- 建立品質門檻文件

### 2026-08-02

- 對齊鎖定狀態：自動化勾選；手動仍開
