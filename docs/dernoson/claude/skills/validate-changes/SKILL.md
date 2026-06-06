---
name: validate-changes
description: 對剛改完的程式碼跑本專案的完整驗證流程（format → lint → type-check → test）。完成任何寫程式 / 改程式的工作後，在回報「完成」之前必須跑這個 skill。也可由使用者明確觸發：「跑一下驗證」、「驗證」、「跑檢查」、「確認都通過再回報」、「pnpm 跑一下」等。
---

# 驗證變更

對剛改完的程式碼跑完整驗證流程。本 skill **不寫程式、不改程式**，只負責跑指令與回報結果。

## 何時觸發

1. **任何寫程式 / 改程式的工作完成後**，在向使用者回報「完成」之前
2. 使用者明確要求驗證：「跑一下驗證」、「驗證」、「跑檢查」、「確認都通過再回報」、「pnpm 跑一下」
3. 已知特定指令失敗、要再跑一次確認修好

**不要**在純文件編輯（`.md`）後跑 —— 沒有 TS / Vue 變動時跑驗證是浪費時間。

## 執行順序（依序，前面失敗就停）

```bash
pnpm format       # auto-fix 格式
pnpm lint         # auto-fix lint
pnpm type-check   # 必須通過，不會 auto-fix
pnpm test         # 必須通過
```

用 `&&` 串接：

```bash
pnpm format && pnpm lint && pnpm type-check && pnpm test
```

**為什麼這個順序、為什麼不用 `pnpm validate-all`**：

- `format` / `lint` 跑前面：兩者會 auto-fix 並寫入檔案；先讓檔案進入「格式正確」狀態，後面 type-check / test 才不會被「明明邏輯對但格式 / lint 還沒套」誤導
- `type-check` 在 `test` 之前：型別錯時 test 不需要跑（也跑不過編譯）
- 不用 `pnpm validate-all`：那個用 `concurrently` 平行跑，輸出交錯難以辨認哪個指令失敗，且 auto-fix 與檢查同時跑會打架

## 每一步的成功 / 失敗判定

| 指令 | 成功 | 失敗判斷 |
|---|---|---|
| `pnpm format` | 輸出 `(unchanged)` 列表，exit 0 | 罕見；通常只在語法錯導致 prettier 無法 parse |
| `pnpm lint` | 無 ESLint error 訊息，exit 0 | 看到 `error` 行；`--fix` 已自動修了能修的，剩下的需要你看 |
| `pnpm type-check` | 無 `error TS####` 訊息，exit 0 | 看到 `error TS####` 行；vue-tsc 失敗 |
| `pnpm test` | `Tests N passed (N)`，exit 0 | 看到 `Test Files M failed` 或 `Tests M failed` |

## 失敗時的反應

**不要**自己看到失敗就盲改。先**讀懂錯誤訊息**，再判斷：

| 情境 | 反應 |
|---|---|
| Lint 還有錯（`--fix` 修不掉的） | 用 Read + Edit 修對應檔案 |
| Type-check 報錯 | 用 Read + Edit 修型別問題；若疑似 spec 矛盾，停下來問使用者 |
| Test 失敗 | **先判斷是「測試錯了」還是「源碼錯了」**；測試錯就修測試，源碼錯就修源碼。看 expected vs received 訊息 |
| Format 失敗（罕見） | 通常是語法解析錯，去看對應檔案的語法 |

修完後**重跑整套驗證**，不要只跑失敗的那個指令（前面 auto-fix 可能又改了東西）。

## 回報格式

成功時：

```
驗證通過：
- format: ✅ 全部已格式化
- lint:   ✅ 無錯誤
- type-check: ✅
- test:   ✅ NN 個案例通過
```

失敗時（在繼續修之前先回報）：

```
驗證未通過：
- format: ✅
- lint:   ✅
- type-check: ❌ <錯誤摘要 + 檔案行號>
- test:   未執行（前項失敗）
```

## 不該做的事

- **不要用 `pnpm validate-all`**：輸出交錯難解析，且 auto-fix 與檢查同時跑會打架
- **不要用 `pnpm format-check` / `pnpm lint-check`**：那是純檢查不會 auto-fix，agent 沒理由用；那兩個是給 CI 用的
- **不要跳過任何一步**：「我覺得 test 應該不受影響」是常見誤判，跳過後續就翻車
- **不要在純 `.md` / `docs/` 編輯後跑**：浪費時間
- **不要把錯誤訊息隱藏不報**：失敗了就老實告訴使用者；本 skill 不是「裝沒看見」的工具
