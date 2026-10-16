# Endfield Playground

## 如何開始開發我們專案

### 1 環境安裝

1. 安裝 git https://git-scm.com/install/
2. 安裝 vscode https://code.visualstudio.com/download?_exp_download=d53503e735
3. 安裝 Node.js (v24) https://nodejs.org/zh-tw/download
4. 安裝 pnpm，於 terminal 輸入
    ```bash
    npx get-pnpm
    ```
5. 下載我們專案，在 terminal 切換到適合的位置，輸入
    ```bash
    git clone https://github.com/dernoson/endfield-playground.git
    cd endfield-playground
    pnpm i
    ```

### 2 執行專案

1. 執行我們專案，在 terminal 輸入 (確認要在 endfield-playground 資料夾中，之後沒特別說就是在這個資料夾下)
    ```bash
    pnpm dev
    ```
2. 等待一段時間，在任意網頁瀏覽器輸入 http://localhost:5173，即可看到我們當前主要畫面
3. 想要進入開發用頁面，在瀏覽器輸入 http://localhost:5173/dev
4. 想單獨看某個 UI 元件的各種狀態，在 terminal 輸入
    ```bash
    pnpm storybook
    ```
    然後在瀏覽器輸入 http://localhost:6006
    - 開發者請看 [tutorial/storybook/developer.md](./tutorial/storybook/developer.md)
    - 設計師請看 [tutorial/storybook/designer.md](./tutorial/storybook/designer.md)

### 3 建議安裝 VS Code Extension

- Git Graph
- Prettier
- Tailwind CSS IntelliSense
- Todo Tree
- Vue (Official)

### 4 確認自己本週工作任務

| 你想知道 | 打開 |
|----------|------|
| **我這週要交什麼** | [docs/work_dispatch/](./docs/work_dispatch/) → 找自己的代號資料夾 |
| 到 11/29 的整體計畫 | [docs/roadmap/ROADMAP_OUTLINE.md](./docs/roadmap/ROADMAP_OUTLINE.md) |
| 其他文件的入口 | [docs/README.md](./docs/README.md) |

### 5 開始開發

1. 開發前先執行 `git pull --prune` 更新現況。
2. 切出新的 branch 給自己開發。
    - 命名範例：`dev/dernoson`（自己的名字）
    - 命名範例：`dev/flow-algorithm`（該次開發目標）
3. 確認功能開發完後，push 前務必在 terminal 使用以下指令，沒有報錯才可以 push：
    ```bash
    # 格式修正
    pnpm format
    
    # Lint 修正
    pnpm lint-check
    
    # 型別檢查
    pnpm type-check

    # 執行單元測試
    pnpm test

    # 或是你覺得跑上面四個太麻煩，你也可以執行這個一次跑完
    pnpm validate-all
    ```
4. 由 admin 確認並合回 `master` branch，並刪除已合併 branch，完成一次開發流程。
5. 當自己的 branch 已合併且遠端已刪除，在 terminal 依序執行：
    ```bash
    # 切回 master branch
    git checkout master

    # 拉取遠端最新狀態，並清掉本地已對應到「遠端已刪除」的分支 (這個是 windows powershell 的指令)
    git pull --prune; git branch -vv | Select-String ': gone\]' | ForEach-Object { git branch -D ($_ -split '\s+')[1] }

    # 從最新的 master branch 開出自己的新 branch 繼續開發
    git checkout -b dev/<name>
    ```

## 團隊分工

### L1 (dernoson / aaaaa)

- 負責策畫與派工
- 設計專案底層邏輯 (例如設備碰撞、管線彎折計算)，不會寫任何正式畫面的 UI
- 我們設計的主要邏輯都會放在 http://localhost:5173/dev 各頁面做 debug 與 demo
- L2 要了解怎麼用我們設計的底層邏輯，都可以直接學 dev 中相應頁面的接法

### L2 (harry / toby)

- 負責將主要畫面的功能接上 L1 的底層邏輯 (例如將 ctrl+c 這個使用者行為實際綁到底層的 "複製" 邏輯)
- 大畫面的 UI 由你們負責 (例如主畫面整個長相的切版)，你們不用自己刻小 UI (例如按鈕、設備長相)
- 你們缺底層邏輯，要跟 L1 討論，而不是自己刻一個
- 你們寫出來的畫面的 vue 通常都會在 `src/app` 中  
    (dernoson: 考量將 `src/editor` 中屬於大畫面設計的都移過去)

### L3 (goodmorning / mbd / avary / shirone)

- 負責跟 UIUX 確認設計稿後，實作所有畫面呈現的 UI 元件
- 禁止直接碰觸 L1 提供的 store 與 function，你們必須開出 props 與 events 讓 L2 幫你們接上
- 你們設計的元件大部分都會在 `src/components` 中

### UIUX (paper)

- 與程式無關，僅設計畫面視覺，以及使用者互動
- RWD 呈現方式也需要設計

## 專案資料夾架構

```text
.
├─ .github/            # CI workflow、CODEOWNERS 與 Discord 通知
├─ .storybook/         # Storybook 設定
├─ dev/                # 不經主程式路由、可直接開啟的獨立 HTML 預覽頁
├─ docs/               # 專案文件（入口見上方第 4 節）
│  ├─ roadmap/         # 到 11/29 的工項、里程碑、驗收標準
│  ├─ work_dispatch/   # 每週派工：每人一份工單
│  └─ <個人代號>/      # 個人筆記、開發紀錄、設計稿
├─ public/             # 原樣對外提供的靜態資源（favicon、icon）
├─ spec/               # 給工作人員看的功能規格（CR-01～CR-11）
├─ src/                # 前端主要程式碼
│  ├─ __tests__/       # Vitest 單元測試，路徑鏡射 src/
│  ├─ app/             # App 殼層：主畫面 layout、右側 StatsPanel、/dev 測試頁
│  ├─ assets/          # 圖片等靜態素材
│  ├─ components/      # L3 可重用展示元件，只靠 props／emits
│  ├─ composables/     # 可重用邏輯：流量引擎、驗證、快捷鍵
│  ├─ data/            # 由 codegen 產生的機器、材料、配方靜態資料
│  ├─ editor/          # L2 編輯器模組：畫布、工具列、Inspector、Navbar 等
│  ├─ lib/             # L1 核心機制：操作歷史（Command）與驗證 detector
│  ├─ router/          # 路由設定
│  ├─ store/           # Pinia 狀態管理
│  ├─ types/           # 跨模組共用型別
│  └─ utils/           # 純函式工具：幾何、埠、佈局與連線規則
├─ tutorial/           # 新手教學（GitHub 操作、Storybook 使用）
└─ README.md
```
