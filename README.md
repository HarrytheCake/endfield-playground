# Endfield Playground

## 如何安裝

### 1) 環境需求

- Node.js `24`（參考 `.nvmrc`）
- pnpm `10+`

### 2) 安裝步驟

```bash
pnpm install
```

## 開發者如何執行

### 1) 建議安裝 VS Code Extension

- Git Graph
- Prettier
- Tailwind CSS IntelliSense
- Todo Tree
- Vue (Official)

### 2) 啟動本地開發

```bash
pnpm dev
```

然後你在瀏覽器中打開 http://localhost:5173 就可以看到開發中的網站。

### 3) 常用指令

```bash
# 型別檢查
pnpm type-check

# Lint 檢查
pnpm lint-check

# 格式檢查
pnpm format-check

# 格式修正
pnpm format

# 建置
pnpm build
```

## 專案資料夾架構

```text
.
├─ .github/            # GitHub 設定與 CI workflow
│  └─ workflows/
├─ docs/               # 專案文件（見下方「文件在哪裡」）
│  ├─ roadmap/         # 到 11/29 的工項、里程碑、驗收標準
│  ├─ work_dispatch/   # 每週派工：每人一份工單
│  └─ <個人代號>/      # 個人筆記、設計稿
├─ spec/               # 規格與設計文件（演算法 / UI 等）
├─ src/                # 前端主要程式碼
│  ├─ app/             # App 殼層與 layout
│  ├─ editor/          # 編輯器相關 UI 模組
│  ├─ router/          # 路由設定
│  ├─ store/           # Pinia 狀態管理
│  ├─ types/           # 型別定義
│  ├─ tutorial/        # 教學文件
|  ├─ components/      # 可重用元件
│  └─ composables/     # 可重用邏輯
└─ README.md
```

## 文件在哪裡

| 你想知道 | 打開 |
|----------|------|
| **我這週要交什麼** | [docs/work_dispatch/](./docs/work_dispatch/) → 找自己的代號資料夾 |
| 到 11/29 的整體計畫 | [docs/roadmap/ROADMAP_OUTLINE.md](./docs/roadmap/ROADMAP_OUTLINE.md) |
| 其他文件的入口 | [docs/README.md](./docs/README.md) |

## 開發者守則

1. 開發前先執行 `git pull --prune` 更新現況。
2. 切出新的 branch 給自己開發。
    - 命名範例：`dev/dernoson`（自己的名字）
    - 命名範例：`dev/flow-algorithm`（該次開發目標）
3. 確認功能開發完後，push 前務必確認執行：
    - `pnpm type-check`
    - `pnpm lint-check`
    - `pnpm format-check`
4. push 後，到 GitHub 建立 Pull Request。
5. 由 admin 確認並合回 `master` branch，並刪除已合併 branch，完成一次開發流程。
6. 當自己的 branch 已合併且遠端已刪除，或發現同仁的 branch 已在 GitHub 上被刪除，依序執行：
    1. 切回 `master`：
        ```bash
        git checkout master
        ```
    2. 拉取遠端最新狀態，並清掉本地已對應到「遠端已刪除」的分支 (windows powershell)：
        ```bash
        git pull --prune; git branch -vv | Select-String ': gone\]' | ForEach-Object { git branch -D ($_ -split '\s+')[1] }
        ```
    3. 從最新的 `master` 開出自己的新 branch 繼續開發：
        ```bash
        git checkout -b dev/<name>
        ```
