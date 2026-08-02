# V6-F1 — 品質門檻與 DoD

**對應工項：** V6-F1  
**狀態：** 完成（已解鎖）  
**依賴：** V6-B1、V6-C1、V6-D1、V6-D2  
**最後更新：** 2026-08-02

---

## 1. 背景與動機

實作合併前必須通過專案統一驗證，並滿足 todolist 文末 DoD。

---

## 2. 自動化驗證

```bash
pnpm type-check
pnpm test -- src/__tests__/store/editorStore.test.ts
```

**結果（2026-08-02 解鎖時）：** type-check 通過；editorStore **31** tests 通過。

---

## 3. DoD 檢查清單

- [x] A2 最終決策表已填
- [x] 單選／多選移動可 undo／redo（單元＋ HistoryReplay M1–M3）
- [x] 無雙重位移（commit 語意＋預覽腳本）
- [x] 主動 `moveDevices(delta)` 回歸通過
- [x] L2 無自組移動 Command
- [x] 管線跟隨未做但有文件註記
- [x] D2：M1–M6 預覽驗收；M7 為已知觀察
- [x] `docs/aaaaa/README.md` 已更新 V6 完成／解鎖

---

## 4. 回報

```text
V6 品質結果（2026-08-02）：
- type-check / editorStore tests: 通過
- HistoryReplay M1–M6: 通過
- M7: 已知 UX 觀察（不阻擋）
- 狀態: 已解鎖；現行開發 → V9
```

---

## 5. 開發日誌

### 2026-08-01

- 建立品質門檻文件

### 2026-08-02

- 對齊鎖定狀態後，負責人確認驗收並解鎖
