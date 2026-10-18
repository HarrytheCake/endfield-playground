# W1004-T1 步驟 05：品質門檻與交付證據

狀態：已完成並驗證（2026-10-09）。前置：[步驟 04](./W1004-T1_step_04_visual_verification.md) 必要案例完成。

## 目標與範圍

驗證程式品質與改動邊界，整理實際證據。此步不新增產品功能，不以品質修正為由重構禁止檔案。

## 執行順序

1. 檢查 git diff、git status，分辨本次修改與實作開始前已存在的內容。
2. 若環境提供 validate-changes skill，依 AGENTS 規則使用；未提供時直接執行同等品質指令。格式修正僅針對本次修改檔案，不以全專案自動 fix 擴大 diff。
3. 依序執行以下必要指令並記錄退出碼與結果：

    ```text
    pnpm type-check
    pnpm lint-check
    pnpm format-check
    pnpm test
    ```

4. 測試包含既有 useGridViewport、deviceOccupancy、placementCheck、layoutStore 及新增的相關回歸測試。品質門檻仍要求完整 pnpm test，不能只以 targeted test 宣告交付。
5. Story 有修改時執行 `pnpm build-storybook` 並完成實際 Story 檢查；必要時以 `pnpm build` 補充正式產物驗證，build 不替代互動驗收。
6. 文件不在 package 的 format-check 範圍內，另執行：

    ```text
    pnpm exec prettier --check docs/toby/dev/1009
    git diff --check
    ```

7. 用 rg 搜尋 GridCanvas 的 store／Pinia import，並人工檢查其間接依賴。不可從 canvasStore import 常數後宣稱沒有 useStore 就合規。
8. 檢查 diff 未包含 MainLayout、ToolbarPanel template／style、StatsPanel、選取／旋轉／刪除互動、canPlaceDevice 出界拒絕、addDevice 簽章與 fixture 載入改動。
9. 複核工單 DoD：原 12×8 外可落子、自由畫布無框無 Error、選基地後框外 Error 仍可放置、GridCanvas 無 Pinia。

## 失敗處理

- 本次引入的錯誤在允許範圍內修正，再執行受影響檢查；新變更可能影響其他結果時重新跑完整必要門檻。
- 既有基準問題須記錄檔案、錯誤訊息與可重現證據，不擅自擴大本工單。
- 必須碰禁止檔案才可修正時，停止該修正並列上游阻礙；不得以旁路邏輯隱藏。
- 上游 devicesOutsideBase 未交付時，明列暫時接法與替換位置。區分「目前 T1 行為完成」與「共用函式接線待上游」兩種狀態。

## 最終交付內容

回報修改檔案、平移操作方式、基地切換與出界案例、品質指令結果、手動驗收證據與未解上游問題。更新本目錄分析與索引的實際狀態，不填入推測的測試數字。

文件後續單獨變更只需檢查格式、連結與 diff。未經使用者明確指示，不 commit、push、建立 PR 或合併。

## 執行結果

依 [validate-changes skill](../../../dernoson/claude/skills/validate-changes/SKILL.md) 的 format → lint → type-check → test 順序驗證。為遵守本工單禁止檔案與最小 diff 限制，auto-fix 只作用於本次修改的 Vue／Story／Storybook 設定，再以全專案的純檢查確認品質，不執行會廣泛寫入的 pnpm format／pnpm lint。

| 檢查                                      | 結果                                     |
| ----------------------------------------- | ---------------------------------------- |
| 本次檔案 Prettier／ESLint auto-fix        | 通過                                     |
| pnpm format-check                         | 通過                                     |
| pnpm lint-check                           | 通過                                     |
| pnpm type-check                           | 通過                                     |
| pnpm test                                 | 47 個測試檔、888 項測試全部通過          |
| pnpm build                                | 通過                                     |
| pnpm build-storybook                      | 通過，含 GridCanvas Story 產物           |
| 文件 Prettier、相對連結、git diff --check | 通過                                     |
| GridCanvas 搜尋 store／Pinia              | 無引用，亦未透過幾何工具間接引入狀態管理 |
| 禁止修改檔案與既有落子／fixture 範圍      | 未改動                                   |

初次完整 lint 誤掃專案內生成的 Chrome profile 與臨時驗證腳本，失敗後已清除這些資料並重跑完整四項指令通過，未新增 lint 排除規則。後續 Chrome profile 改用系統暫存資料夾。驗證用瀏覽器與 Storybook 啟動時的檔案權限需求已透過工具核准處理。

建置出現既有元件 Index 名稱衝突、Browserslist 資料過期與大 chunk 警告；未因這些警告擴大工單修改，建置退出碼均為 0。

本工單四項 DoD 皆已驗證。保留後續依賴：A0 devicesOutsideBase 合入後改接單一 computed；人工可及性與獨立取消事件模擬仍列步驟 04 的驗證限制。
