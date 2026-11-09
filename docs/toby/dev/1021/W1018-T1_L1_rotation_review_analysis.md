# W1018-T1：旋轉功能 L1 歸屬與 PR 收斂分析

分析日期：2026-10-28。本次僅新增分析文件，不修改程式、不切換分支、不進行 rebase、提交或推送。

## 需求與責任邊界

使用者要求本 PR 不再提供 `src/store/layoutStore.ts` 與 `src/__tests__/store/layoutStore.rotation.test.ts` 的變更。`rotateDevice` 及重疊規則由 aaaaa 在 #79 提供，L2 僅呼叫該高階 action。

依據 [CLAUDE.md §5](../../claude/CLAUDE.md)：

> 如果 L1 沒有對應的 high-level action 可用，**回報給 L1 維護者補上**，不在 L2 自己組 mutation

後續若缺少 action，應先整理呼叫需求、輸入輸出與行為案例，回報 L1 維護者；本 PR 不自行補寫 store action、Command 或其 L1 契約測試。本次未對外聯絡維護者。

## 本機可確認的現況

- 目前檢出 `master`，HEAD 為 `d48ac99`，分析前工作目錄乾淨。
- 本機 `master` 已包含 `5f79562`：合併 #79，來源為 `dev/aaaaa1018`。
- 本機 `dev/toby` 為 `db0c7f8`，已透過 merge 納入 `5f79562`。該合併紀錄明載兩個衝突的 L1 檔案採 master 版本。
- `git diff master dev/toby -- src/store/layoutStore.ts src/__tests__/store/layoutStore.rotation.test.ts` 無輸出：兩個分支目前檔案內容完全相同。
- `git diff master...dev/toby -- src/store/layoutStore.ts src/__tests__/store/layoutStore.rotation.test.ts` 亦無輸出：以本機共同祖先計算的 PR 差異，已不包含這兩個 L1 檔案。
- `dev/toby` 的 `LayoutView.vue` 已呼叫 `layoutStore.rotateDevice(device.id, rotation)`，未直接建立旋轉 Command。

以上來自本機 Git 紀錄；本次未抓取遠端或查詢線上 PR，不能據此斷言線上 PR 的最新狀態。

因此不應刪除這兩個檔案，也不應移除 master 已有的 L1 action。要求「拿掉本 PR 的變更」應以相對目標分支的差異為準，不能還原到 #79 之前。

## #79 的旋轉契約與既有說明落差

| 項目 | #79 的 L1 行為 | 本 PR 的 L2 責任 |
| --- | --- | --- |
| 角度 | 接受 0～3，非法角度或未知／重複 ID 拒絕 | 計算下一個四向角度並呼叫 action |
| 同角度 | 成功但不新增歷史 | 不額外建立歷史 |
| 正常旋轉 | 更新角度，保留原點與管線座標，一筆 MachineRotation 歷史 | 消費更新後的尺寸、埠、連線及斷線警示 |
| 重疊 | 允許寫入；由 layoutIssues／驗證標示 E001 | 不自行攔截，也不宣稱重疊會拒絕旋轉 |
| 復原／重做 | 由 L1 Command 處理 | 沿用既有歷史快捷鍵 |

`LayoutView` 目前仍保留 `result.reason === 'overlap'` 的失敗提示分支。依 #79 目前契約，旋轉重疊會回傳成功，因此該提示不會因旋轉重疊而出現。後續應檢視並移除不適用的旋轉失敗敘述，保留實際 invalid 失敗回饋；不新增 L2 碰撞阻擋來恢復舊行為。

`dev/toby` 的 PR 草稿與驗證文件仍包含「本 PR 新增 rotateDevice／旋轉契約測試」及舊有重疊拒絕的描述。後續應更新交付文案，說明本 PR 僅串接 #79 的 L1 action；舊驗證結果應保留日期與適用版本，不能當作 #79 合入後的驗證證據。是否正式呈現 E001，需另確認既有驗證結果到正式 UI 的資料流，不能僅因 store 有 conflicts 就宣稱畫面已顯示警示。

## 後續執行步驟與逐步驗證

1. 再次確認工作目錄與分支，抓取最新遠端及實際 PR 目標分支。驗證 #79 已在目標分支，確認兩個 L1 檔案沒有 PR 差異。
2. 依使用者要求處理 rebase。目前 `dev/toby` 使用 merge，尚未完成 rebase；執行前應檢視已推送的分支歷史，確保不帶入其他人的提交、不丟失既有 L2／L3 功能。若需改寫遠端歷史，應先完成本機結果與驗證，再說明並取得 force-with-lease 推送授權。
3. 確認 `LayoutView` 僅呼叫 aaaaa 提供的 `rotateDevice`，清理與 L1 契約不符的旋轉提示及說明。不修改 `layoutStore.ts` 或其旋轉測試，不在 L2 自組 mutation／Command。
4. 驗證未選取、文字輸入、拖曳／平移期間、連續按鍵與改鍵；選取後旋轉應同步更新尺寸、埠、連線及斷線驚嘆號。驗證與設備／管線重疊仍旋轉成功、歷史增加一筆，且可由既有衍生結果辨識重疊；Undo／Redo 與管線原位符合 L1 契約。
5. 更新 PR 文案及文字驗證紀錄，將設備旋轉分開說明，明確標記依賴 #79。若後續修改 TS／Vue，依專案規範執行完整品質檢查；不產生測試圖片或 JSON 報告。
6. 最後檢查相對 PR 目標分支的差異：兩個 L1 檔案應為零差異，`GridCanvas.stories.ts` 與 WarningIcon 本體維持不變，無額外 L1 action 或直接 history.execute 呼叫。

## 本次結果

僅新增此分析文件。未修改程式或既有文件，未執行 rebase、提交、推送或測試。純 Markdown 分析不需執行程式品質檢查；本次以 Git 差異及來源閱讀確認現況。
