# 0003_20260817_pre-master-branch-consolidation

- **prev:** `./0001_20260810_merge-verification-sweep.md`
- **skill:** plan-history v3
- **status:** in-progress

## 主題簡述

多條協作者 branch 即將進 master。做法是先全部匯入 `dev/dernoson`，在同一棵樹上收斂完
再一次合入 master，而不是讓每條各自對 master 開 PR。本計畫記錄這一輪匯入：哪幾條合、
哪幾條不合、順序如何、合完之後樹還是不是綠的。

這是 0001 的下一輪。0001 驗的是上一次合流（mbd / aaaaa / shirone）的成果，本計畫處理的
是新一批 branch 的匯入本身。

**本計畫的約束**

- **只合進 `dev/dernoson`，不 push、不開 PR、不碰 master**，除非使用者明確指示。
- 合併過程**不順手修別人的程式碼**。合進來的東西有品質問題就寫成觀察交回使用者，由他
  決定要退回作者改、還是另開待辦在本 repo 修。
- 每條 branch 一格，一次合一條，合完立刻確認樹的狀態，不批次亂槍。

## 規劃描述

匯入順序依「衝突風險由低到高」排：純新增檔案的先進，會動到既有共用檔案的後進。

1. 先把 `dev/dernoson` 對齊 `origin/dev/dernoson`（已完成，本地已在 `8838faf`）。
2. `dev/Avery`、`dev/paper` —— 兩條都只新增檔案，不動任何既有檔案，先合（0003#1、0003#2）。
3. 合完跑 `validate-changes` 全套，確認 format / lint / type-check / test 沒被新檔案弄壞
   （0003#3）。
4. 剩下四條（`dev/azure9572`、`dev/toby`、`dev/cake`、`dev/GoodMorning`）逐條與使用者確認
   去留與順序（0003#4）。這四條全都動到既有檔案，且彼此之間有重疊（O4），順序會影響工作量。

merge 一律用 `--no-ff` 保留合併點，讓之後要退某一條時可以整包 revert。

## 觀察與推論

### O1 · 2026-08-17 05:28:10+08:00 — 待評估 branch 共八條，七條以現行 master 為基底

`git fetch --all --prune` 後 `origin` 上除 master 外有八條 branch。對 `origin/master` 取
`rev-list --left-right --count`，其中七條的 behind 數為 0，即都從現行 master
（`65e99b1`）長出來、沒有落後：`dev/Avery`(+9)、`dev/paper`(+6)、`dev/azure9572`(+5)、
`dev/toby`(+4)、`dev/cake`(+4)、`dev/cake_test`(+4)、`dev/GoodMorning`(+8)。唯一例外是
`dev/mbd`，behind 172 / ahead 7，最後一次 commit 在 2026-05-22。

`dev/cake` 與 `dev/cake_test` 共用同樣的三個程式 commit（`dbecb84`、`1817baa`、`6b08e73`），
只有最後一個文件 commit 不同（`Design.md` vs `PR_DESCRIPTION_0811.md`）。兩者不是兩份獨立
工作，是同一份工作的兩個快照。

同一次 fetch 中 `origin/dev/Avery`、`origin/dev/paper` 有新 commit 進來，且遠端刪除了
`dev/Avery0810`、`dev/aaaaa0727`、`dev/shirone`、`dev/shirone0731`、`dev/shirone0806` 五條
已合分支。因此任何以本地舊 ref 做的評估都不可信，必須先 fetch。

### O2 · 2026-08-17 05:30:44+08:00 — 八條對 dev/dernoson 試合都沒有文字衝突

對八條各跑一次 `git merge-tree --write-tree --name-only origin/dev/dernoson origin/<b>`，
八條全部 exit 0，沒有任何 conflict 檔案。

這只說明 git 層面沒有同檔同行的競爭，**不代表語意上安全**（見 O4）。

### O3 · 2026-08-17 05:33:02+08:00 — Avery 與 paper 兩條的實際內容遠小於 commit 數

`dev/Avery` 九個 commit 的淨變更只有兩個新檔：`docs/avery/COMMENT_0726.md`（18 行）與
`src/components/ViewTiggleBtn.vue`（31 行）。該 .vue 有四個問題：檔名 `ViewTiggleBtn` 是
`ViewToggle` 的錯字；放在 `src/components/` 下的單檔而非 `ViewToggleBtn/Index.vue`，違反
CLAUDE.md 第 2 節命名慣例；`<script setup>` 沒有 `lang="ts"`；全檔無 JSDoc，違反第 3 節。
`grep` 顯示 `src/` 內無任何 import，是死碼。它只是把三個字串輪播，沒有接上任何檢視切換。

`dev/paper` 六個 commit 的淨變更是 `docs/paper/README.md`（內容為 `123` / `456` 兩行佔位
字串）與一個 5,238,933 bytes 的 Figma 檔 `docs/paper/禿忘救命啊.fig`。無任何程式碼。

兩條都只新增檔案、不動既有檔案，所以合併風險趨近於零；但兩條帶進來的東西都不是可直接
使用的成品。5MB 二進位檔一旦推上 master 就永久留在 git 物件庫裡。

### O4 · 2026-08-17 05:34:16+08:00 — 剩餘四條彼此與 dernoson 有語意重疊

`dev/azure9572` 在 `src/lib/validation/detectors/` 下新增 E004 / E005 / W001 / W002 / W003
五個 detector 與對應測試（+1183 行），並改 `src/types/validation.ts`。而 `dev/dernoson`
在同一目錄刪掉了 `E001_deviceOverlap.ts`、改成 `overlapDetector.ts`。兩邊沒有動到同一個
檔案所以 git 不衝突，但 detector 的註冊方式與型別介面必須人工對齊 —— 這正是 `0001#8` 第 4
題（detector 註冊點）尚未定案的東西。該分支另外帶了 `src/types/validation_OLD.ts`（+76 行）
與新增的 `pnpm-workspace.yaml`（+3 行）。

`dev/toby` 與 `dev/cake` 都改 `src/editor/canvas/FactoryCanvas.vue`（toby +31/-3、cake
+125）。兩條各自對現在的 `dev/dernoson` 試合都乾淨，但**先合的那條會改變後合那條的基底**，
第二條大概率要人工解。

`dev/GoodMorning` 的淨變更是 `src/editor/navbar/Navbar.vue`（13 行）加一個名為 `1` 的誤上傳
檔案 `src/editor/navbar/1`。而 `dev/toby` 也改 `src/editor/navbar/Navbar.vue`（+15）。

因此四條的合併順序不是可以隨便挑的，且 azure9572 的匯入實質上依賴 `0001#8` 的裁決。

### O5 · 2026-08-17 05:40:59+08:00 — 兩條合併乾淨，但 Avery 的檔案卡住 lint

`git merge --no-ff origin/dev/Avery` 與 `git merge --no-ff origin/dev/paper` 都是 ort
strategy 直接完成，零 conflict，變更檔案數與 O3 記錄的一致。

隨後的驗證四步：

- `pnpm format` —— 通過，但 auto-fix **改寫了 `src/components/ViewTiggleBtn.vue`**（補分號、
  縮排 2 空格改 4 空格）。純格式，無邏輯變更；不套的話 CI 的 `format-check` 會紅。
- `pnpm lint` —— **失敗，exit 1**。唯一一個 error：
  `src/components/ViewTiggleBtn.vue:1:1 The 'lang' attribute of '<script>' is missing
  vue/block-lang`。`--fix` 修不掉，需要人工加 `lang="ts"`。
- `pnpm type-check` —— 通過，無 TS error。
- `pnpm test` —— 通過，28 個測試檔、301 個案例全過。

O3 預測的「lint 可能有意見」成立，且它是唯一的紅燈。這條紅燈完全侷限在 Avery 帶進來的
單一檔案，不影響既有程式碼 —— 但只要它在，`dev/dernoson` 就不是可以進 master 的狀態。

### O6 · 2026-08-17 05:50:09+08:00 — Avery 改以重建歷史移除，未留 revert 疤痕

- **更新:** O5

使用者看過 O5 後裁定不合 `dev/Avery`，改為請作者重做。移除做法**不是 `git revert`**：
被 revert 的 merge 會讓 git 認定那些 commit 已經合過，Avery 之後在同一條 branch 上追加
commit 再合進來時，舊 commit 會被跳過，得靠 `-m` 或重開 branch 才繞得過去。

由於這一輪的三個 commit 都還沒 push（`origin/dev/dernoson` 仍在 `8838faf`），改用
`git reset --hard 41cd01e` 退回計畫檔 commit，再單獨重合 `origin/dev/paper`（`140dfc5`）。
重建前先開 `backup/pre-avery-drop` 指向 `e46a122` 保底。

結果：`dev/dernoson` 上不存在任何與 Avery 相關的物件，`src/components/ViewTiggleBtn.vue`
不在樹上，O5 記錄的 lint 紅燈連同它一起消失。

### O7 · 2026-08-17 05:51:50+08:00 — 移除 Avery 後四步全綠

- **更新:** O5

在只含 `dev/paper` 的樹上重跑：`pnpm format` 通過且**沒有改寫任何檔案**（首跑時被改寫的
`ViewTiggleBtn.vue` 已不在樹上）、`pnpm lint` exit 0 無 error、`pnpm type-check` 無 TS
error、`pnpm test` 28 檔 301 案例全過。`git status` 除計畫檔外乾淨。

O5 的唯一紅燈確實隨 Avery 一起消失，沒有第二個問題被它蓋住。`dev/dernoson` 目前在
`origin/master` 之上多 36 個 commit，全綠。

## 待辦

### 1 合入 dev/Avery

- **state:** 否決
- **basis:** → O5、O6

不合入。`dev/Avery` 帶進來的 `ViewTiggleBtn.vue` 擋住 lint（O5），且問題不只 lint —— 檔名
錯字、違反 CLAUDE.md 第 2 節目錄慣例、缺 JSDoc、無人 import 的死碼（O3）。使用者裁定退回
作者重做，不在本 repo 代改。

作者重做後這條要重開一格承載，不要復用本格。

**沿革**

- H1 · 2026-08-17 決斷 —— 使用者裁定可直接合入（使用者）
- H2 · 2026-08-17 落地 —— `--no-ff` 合入 `4e86d68`，零 conflict → O5
- H3 · 2026-08-17 否決 —— 使用者改為退回 Avery 重做，合併以重建歷史移除 → O6（取代 H1、H2）

### 2 合入 dev/paper

- **state:** 完成
- **basis:** → O2、O6

已合入（`140dfc5`）。無程式碼變更，未影響任何驗證。**推上 master 之前仍要讓使用者確認**
5MB 的 `.fig` 進 git 物件庫是可接受的（O3）—— 那是不可逆的。

**沿革**

- H1 · 2026-08-17 決斷 —— 使用者裁定可直接合入（使用者）
- H2 · 2026-08-17 落地 —— `--no-ff` 合入，零 conflict；因 0003#1 退回而重合一次 → O6

### 3 合併後跑全套驗證

- **state:** 完成
- **needs:** 0003#1、0003#2
- **basis:** → O7

在移除 Avery、只留 `dev/paper` 的樹上重跑完 `validate-changes` 全套，四步全綠（O7）。

**沿革**

- H1 · 2026-08-17 落地 —— 首跑（含 Avery）四步僅 lint 紅 → O5
- H2 · 2026-08-17 落地 —— 移除 Avery 後重跑，四步全綠 → O7

### 4 剩餘四條 branch 的去留與合併順序

- **state:** 待決斷
- **basis:** → O1、O2、O4

`dev/azure9572`、`dev/toby`、`dev/cake`、`dev/GoodMorning` 四條的去留由使用者逐條裁決。
裁決時要一併決定的事，都在 O4：

- `dev/azure9572` 的 detector 註冊方式與 `dev/dernoson` 的 `overlapDetector` 對齊 —— 這與
  `0001#8` 第 4 題是同一件事，可能要先在那邊定案。另需決定 `validation_OLD.ts` 與新增的
  `pnpm-workspace.yaml` 要不要跟著進來。
- `dev/toby` 與 `dev/cake` 都改 `FactoryCanvas.vue`，先合誰會決定後合那條的人工成本。
- `dev/toby` 與 `dev/GoodMorning` 都改 `Navbar.vue`；`dev/GoodMorning` 另帶一個誤上傳的
  `src/editor/navbar/1`。

裁決收斂後每條開一格承載實際合併。

**沿革**

### 5 dev/cake_test 與 dev/mbd 不合入

- **state:** 否決
- **basis:** → O1

`dev/cake_test` 與 `dev/cake` 共用同樣三個程式 commit，只是同一份工作的另一個快照，合它
等於重複計算（O1）；程式碼要不要進來由 0003#4 對 `dev/cake` 的裁決決定。

`dev/mbd` 落後 master 172 個 commit、最後 commit 在 2026-05-22，內容是塞在 `docs/` 下的
獨立 html/js prototype 外加會動到 `src/router/index.ts` 的 `MBDFlow.vue`。

**沿革**

- H1 · 2026-08-17 否決 —— 使用者裁定兩條都不合入（使用者）
