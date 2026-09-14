# 0017_20260915_discord-workflow-injection

- **prev:** —
- **skill:** plan-history v3
- **status:** done

## 主題簡述

`.github/workflows/discord-notify.yml` 在 `run:` 區塊內直接以 `${{ ... }}` 嵌入事件欄位。GitHub 先做字串替換再交給 bash，PR／issue／discussion 標題、branch／tag 名稱等使用者可控內容因此會被當成 shell 語法解讀：PR #47 的標題含反引號，通知 job 直接失敗；同一條路徑也允許以標題注入任意指令，而該 step 的環境帶有 `DISCORD_WEBHOOK` secret。

目標是讓 `run:` 區塊內不再出現任何 `${{ }}`，所有值一律經 step 的 `env:` 傳入、以帶引號的 shell 變數引用。

**本計畫的約束**

- 不改 Discord embed 的內容、欄位、顏色與標籤判斷邏輯。
- 依使用者指示，修正 push 到 `dev/cake`（PR #47），不另開 PR。

## 規劃描述

1. 逐 job 把 `run:` 內的 `${{ github.* }}` 搬到該 step 的 `env:`，命名沿用檔內既有風格（`PR_BODY_JSON` 之類的全大寫）。為了讓「`run:` 內零 `${{ }}`」可以用 grep 機械驗證，連 GitHub 自產的 enum／數字（`action`、`number`、`repository`）也一併搬，不逐一判斷可控性。
2. `concurrency.group` 的 `${{ }}` 不在 shell 內，不動。
3. 驗證：YAML 可解析；grep 確認 `run:` 內無 `${{`；在本機以惡意標題模擬修正後的 script，確認標題原樣進入 JSON 而不被執行。
4. 在 `dev/cake` 上 commit 並 push。

## 觀察與推論

### O1 · 2026-09-15 01:14:00+08:00 — PR #47 的通知 job 因標題反引號失敗

run `34800289602` 的 `pull_request` job 以 `unexpected EOF while looking for matching` 反引號錯誤結束（exit 2）。對應 `discord-notify.yml:108` 的 `--arg title "... ${{ github.event.pull_request.title }}"`；PR #47 的標題含多組反引號。PR body 走 `env: PR_BODY_JSON: ${{ toJSON(...) }}`，不受影響。

推論：失敗點就是注入點。標題可由開 PR 的人任意設定，寫成反引號包住的指令即會在 runner 上執行。

### O2 · 2026-09-15 01:25:22+08:00 — 全檔 `run:` 內嵌入欄位盤點

`grep -n '\${{' .github/workflows/*.yml` 結果：`static-check.yml` 無；`discord-notify.yml` 除 `:42` 的 `concurrency.group` 與各 `env:` 行外，`run:` 內共有以下使用者可控欄位直接嵌入：

- 標題：`pull_request.title`（`:108`、`:138`、`:160`）、`issue.title`（`:192`、`:216`）、`discussion.title`（`:400`）
- ref 名稱：`event.ref`（`:234`、`:269`）、`workflow_run.head_branch`（`:309`）、`check_run.check_suite.head_branch`（`:343`）、`release.tag_name`（`:290`）
- 其他字串：`workflow_run.name`（`:308`）、`check_run.name`（`:343`）、`forkee.full_name`（`:359`）、`member.login`（`:376`）、`event.compare`（`:68`）、各處 `html_url`、`github.actor`

推論：git ref 名稱允許 `` ` ``、`$`、`(`、`)`，branch／tag 名稱與標題同樣可注入；只修 PR 標題不夠。

### O3 · 2026-09-15 01:29:00+08:00 — 本機模擬：原版可注入、修正版不可

本機無 `jq`，以 node 寫的 `jq`／`curl` shim（只回傳 `--arg` 內容）執行 step script，腳本在 scratchpad。

- 原版（`git show HEAD` 的 `pull_request` step，依 GitHub 做法先做 `${{ }}` 文字替換）：標題 `$(touch …/pwned_ds)` 讓標記檔被建立，產出的 `title` 尾端為空。
- 修正版：以同時含反引號、`$(...)`、`"; …; echo "` 的標題跑 `pull_request`、`pull_request_review`、`issues`、`create`、`delete`、`discussion` 六個 step，六者 `title` 皆逐字包含輸入，三個標記檔皆未建立。
- 以 `yaml@2.8.3` 解析修正後檔案：14 個 job 的 `run:` 內 `${{` 出現 0 次；`on`、`concurrency`、各 job 的 `if`／`runs-on`／step 名稱與原版一致；每個 `env:` 鍵皆被 `run:` 使用。

推論：注入在原版可實際觸發，修正版在所有使用者可控欄位上都不再被 shell 解讀。

### O4 · 2026-09-15 01:31:26+08:00 — push 後 PR #47 通知 job 通過

`c269ab5` push 到 `dev/cake` 後，PR #47 的 run `34875181562`（`pull_request` job）結論 `success`，`static-check` 通過；PR 狀態 `APPROVED`／`CLEAN`。PR #47 標題未變，仍含反引號。

推論：O1 的失敗在實際 CI 上已消失。

## 待辦

### 1 discord-notify.yml 的 run 區塊改為只經 env 取值

- **state:** 完成
- **basis:** → O1、O2、O3

`discord-notify.yml` 每個 job 的 `run:` 區塊內不出現任何 `${{ }}`；原本嵌入的事件欄位全部移到該 step 的 `env:`，以 `"$VAR"` 引用；`github.repository`／`github.actor` 改用 runner 內建的 `GITHUB_REPOSITORY`／`GITHUB_ACTOR`。embed 內容與判斷邏輯不變。

**沿革**

- H1 · 2026-09-15 決斷 —— 全部經 env 傳入，連 GitHub 自產欄位也搬，以便 grep 驗證（使用者指示修正；做法由 agent 提出）
- H2 · 2026-09-15 落地 —— `c269ab5` → O3

### 2 驗證修正後的 workflow

- **state:** 完成
- **needs:** 0017#1
- **basis:** → O3、O4

YAML 可解析；`run:` 區塊內無 `${{`；以含反引號與 `$(...)` 的標題在本機模擬各 step，產出的 JSON `title` 與輸入逐字相同，且模擬指令未被執行；push 後 PR #47 的通知 job 實際通過。

**沿革**

- H1 · 2026-09-15 決斷 —— 本機模擬 script 取代實際觸發 CI（agent）
- H2 · 2026-09-15 落地 —— 六個 step 模擬通過，原版對照可注入 → O3
- H3 · 2026-09-15 落地 —— push 後 CI 通知 job 通過 → O4

### 3 修正 push 到 dev/cake

- **state:** 完成
- **needs:** 0017#2
- **basis:** → O4

在 `dev/cake` 上 commit 並 push，讓 PR #47 的後續事件使用修正後的 workflow。

**沿革**

- H1 · 2026-09-15 決斷 —— push 到 PR #47 的分支，不另開 PR（使用者）
- H2 · 2026-09-15 落地 —— `998f65a..c269ab5` push 至 `origin/dev/cake` → O4
