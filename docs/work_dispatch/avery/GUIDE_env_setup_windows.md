# 教學｜avery｜Windows 從零把專案跑起來（W0823-V1-A 專用）

| meta | value |
|------|-------|
| 對應工單 | [W0823-V1](./W0823-V1_env_and_viewswitcher.md) 的 **V1-A（必做）** |
| 對象 | 沒寫過程式、沒 clone 過 repo 的人（本檔假設你完全沒裝過任何開發工具） |
| 預估 | 順利 40 分鐘；卡住就貼錯誤給 dernoson，**不要自己猜** |
| 原則 | 這一步的目標只有「螢幕上看到模擬器畫面」，**不需要看懂程式** |

> 每做完一節就在 Discord 回一句進度，卡住時我們才知道你卡在第幾節。

---

## 0. 先認識三個視窗

| 東西 | 長什麼樣 | 你會用它做什麼 |
|------|----------|----------------|
| **PowerShell（終端機）** | 黑底或藍底、只能打字的視窗 | 打指令、看錯誤訊息 |
| **瀏覽器** | Chrome／Edge | 打開跑起來的網站 |
| **編輯器**（VS Code 或 Cursor） | 有檔案樹的程式編輯視窗 | 之後 V1-B 改檔用；V1-A 可以先不裝 |

**怎麼打開 PowerShell：** 開始功能表搜尋 `PowerShell` → 點「Windows PowerShell」。  
之後所有 ` ``` ` 框裡的指令，都是打在這個視窗、按 Enter。

---

## 1. 裝 Node.js 24

本專案指定 Node **24**（repo 根目錄 `.nvmrc` 寫的就是 `24`）。

1. 打開 <https://nodejs.org/> → 下載 **Windows Installer (.msi)**，版本號要以 **24.** 開頭  
   （若首頁主打的是別的版本，點「Other Downloads / Previous Releases」找 24.x）
2. 一路 Next 安裝完成
3. **關掉**剛才的 PowerShell，重新開一個（環境變數才會生效）
4. 驗證：

```powershell
node -v
```

看到 `v24.x.x` 就成功。若顯示「無法辨識 node」→ 沒裝好或沒重開視窗。

---

## 2. 開啟 pnpm

專案用 **pnpm**（不是 npm）。Node 24 內建 corepack，直接開啟即可：

```powershell
corepack enable pnpm
pnpm -v
```

看到 `10.x` 之類的版本號就成功（專案鎖 `pnpm@10.7.0`）。

失敗時的備援（兩擇一，貼錯誤問 dernoson 再做）：

```powershell
npm install -g pnpm
```

---

## 3. 裝 Git 並取得專案

1. 下載安裝 Git：<https://git-scm.com/download/win>（一路 Next 即可）
2. 重開 PowerShell，驗證：

```powershell
git --version
```

3. 選一個放專案的資料夾（**路徑不要有中文與空白**），例如：

```powershell
mkdir C:\work
cd C:\work
```

4. 複製專案下來：

```powershell
git clone https://github.com/dernoson/endfield-playground.git
cd endfield-playground
```

> 若要求輸入帳號密碼／出現權限錯誤：把畫面截圖給 dernoson，可能需要先把你加進 repo 權限。

**不要**用「Download ZIP」。ZIP 沒有 git 記錄，之後交檔會很痛苦（工單也明令禁止）。

---

## 4. 安裝套件並啟動

確認你**在專案根目錄**（也就是有 `package.json` 的那一層）：

```powershell
pwd
dir package.json
```

然後：

```powershell
pnpm install
```

第一次會跑一兩分鐘、刷很多行字，正常。跑完再執行：

```powershell
pnpm dev
```

成功長相大致是：

```text
  VITE v7.x.x  ready in 900 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**這個視窗要一直開著**（關掉網站就停）。把 `http://localhost:5173/` 貼到瀏覽器打開，看到模擬器畫面（上面一條工具列、中間格子畫布、右邊統計面板）就完成 V1-A。

---

## 5. 交付 V1-A

Discord 貼：

1. 瀏覽器畫面**截圖**
2. 一句「V1-A 完成」

dernoson／aaaaa 會把你列進「跑得起 dev」名單（A3 上手文件要用）。

---

## 6. 常見錯誤對照表

| 你看到的字 | 意思 | 怎麼辦 |
|------------|------|--------|
| `無法辨識 'node' / 'pnpm' / 'git'` | 沒裝或沒重開視窗 | 重開 PowerShell；還不行就重裝 |
| `ENOENT: no such file or directory ... package.json` | 你不在專案資料夾 | `cd C:\work\endfield-playground` 再試 |
| `Port 5173 is in use` | 之前那個 `pnpm dev` 還開著 | 用它給的新網址，或關掉舊視窗 |
| 一大片紅字 `ERR_PNPM_...` | 安裝失敗 | **整段**複製貼給 dernoson，不要只說「壞了」 |
| 瀏覽器一片空白 | 網址錯或服務已停 | 看終端機還在不在跑；網址以終端機顯示的為準 |

**禁止**為了讓它跑起來去改 `src/` 裡的任何檔案。環境問題不會靠改程式解決。

---

## 7. V1-B 樣板（A 過關後再看）

工單指定的唯一路徑：

```text
src/components/ViewSwitcher/Index.vue
```

在編輯器裡建立 `src/components/ViewSwitcher/` 資料夾與 `Index.vue`，**整份**貼下面內容，文字可自己改：

```vue
<script setup lang="ts">
/**
 * ViewSwitcher/Index.vue
 *
 * 視角切換按鈕（L3 純展示）：只吃 props、只 emit，不碰 store。
 */

defineProps<{
    /** 目前選中的視角 id，'factory' 或 'flow' */
    modelValue: string;
}>();

const emit = defineEmits<{
    /** 使用者點了某個視角，請上層改值 */
    (event: 'update:modelValue', value: string): void;
}>();

/** 可切換的視角清單 */
const options: Array<{ value: string; label: string }> = [
    { value: 'factory', label: '工廠' },
    { value: 'flow', label: '流程' },
];
</script>

<template>
    <div class="view-switcher">
        <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="view-switcher__btn"
            :class="{ 'is-active': option.value === modelValue }"
            @click="emit('update:modelValue', option.value)"
        >
            {{ option.label }}
        </button>
    </div>
</template>

<style scoped>
.view-switcher {
    display: inline-flex;
    gap: 4px;
}

.view-switcher__btn {
    padding: 6px 12px;
    font-size: 13px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    background: #fff;
    color: #111;
    cursor: pointer;
}

.view-switcher__btn.is-active {
    background: #eef2ff;
    font-weight: 600;
}
</style>
```

自我檢查：

- [ ] 檔名是 `Index.vue`（**不是** `ViewSwitcher.vue0811`）
- [ ] 檔案在 `src/components/ViewSwitcher/` 裡
- [ ] 全檔搜尋沒有 `store`、`pinia` 這兩個字
- [ ] 存檔後 `pnpm dev` 那個視窗沒有噴紅字

想確認長相，可請 dernoson 代掛到畫面上截圖；**只交元件檔也算完成**。

交檔（三選一，禁止 GitHub 網頁 Add file）：

```powershell
git checkout -b dev/avery-viewswitcher
git add src/components/ViewSwitcher/Index.vue
git commit -m "feat(ui): ViewSwitcher 視角切換元件"
git push -u origin dev/avery-viewswitcher
```

然後到 GitHub 開 Pull Request；不會的話，把檔案內容貼 Discord 請 dernoson 代推。

---

## 8. 記得

- 9/14–10/04 是你的空窗期，**不會派工**；本週能把 §1–§5 走完就是達標
- 卡超過半天就問，本週 pair 名額（mentor 時間）預留給你
- V1-B 沒做完**不算失敗**
