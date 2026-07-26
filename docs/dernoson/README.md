# dernoson 工作筆記

## TODO

- [x] ~~**畫布渲染套件 PoC**：Vue Flow vs Konva.js~~  \
  Vue Flow 已選定（`@vue-flow/core` 已 in package.json，editorStore 已用 `FactoryNode` / `FactoryEdge`）。

- [x] ~~**幫 shirone 遷移既有 CR-03 程式碼**~~  \
  已將 `origin/shirone/0522:src/validation_check/overlap.ts` 遷移為  \
  `src/lib/validation/detectors/E001_deviceOverlap.ts`（純結構搬移，邏輯仍由 shirone 補）。  \
  另寫了 `docs/shirone/README.md` 引導後續流程。

## 下一個方向（建議）

- 集中初始化點：找一個地方集中 `validationStore.registerDetector(...)`（例如 `src/composables/useValidation.ts` 或新建 `src/lib/validation/registerDetectors.ts`），等 shirone 第一個 detector 完工再決定
- L2 開工前的最後檢查：請 harry / toby 對 `editorStore` 高階 actions 簽名提任何建議

## 分層職責文件

- `L1/` — 基礎建設層（dernoson, aaaaa, shirone）
- `L2/` — 容器層（harry, toby）
- `L3/` — UI 元件層（goodmorning, avery, azure9572, MBD）

## 使用 `claude/` 底下的 CLAUDE.md / skills / agents

`claude/` 資料夾放的是我（dernoson）在用的 Claude Code 設定（`CLAUDE.md`、`skills/`、`agents/`）。想在自己的 checkout 套用的話，在 repo 根目錄建立 symbolic link 指過來即可：

```powershell
# 根目錄 .claude/ → docs/dernoson/claude（skills、agents 會自動被 Claude Code 偵測到）
New-Item -ItemType SymbolicLink -Path ".claude" -Target "docs\dernoson\claude"
```

若沒有系統管理員權限或懶得開「開發人員模式」，可以改用 junction：

```powershell
cmd /c mklink /J .claude docs\dernoson\claude
```

**注意：`.claude/CLAUDE.md` 不會被 Claude Code 自動讀取**，它只認根目錄的 `CLAUDE.md`。目前根目錄還沒有 `CLAUDE.md`，所以直接對它建 symlink 即可：

```powershell
New-Item -ItemType SymbolicLink -Path "CLAUDE.md" -Target "docs\dernoson\claude\CLAUDE.md"
```

或用 junction 對應的 mklink（檔案用 `/H` 建硬連結，或同樣用符號連結語法）：

```powershell
cmd /c mklink CLAUDE.md docs\dernoson\claude\CLAUDE.md
```
