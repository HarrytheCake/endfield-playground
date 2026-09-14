# V12-D1 — ／dev store 演示（週會必要）

**對應工項：** V12-D1  
**狀態：** `[x]` 完成（2026-09-11；互動強化）  
**日期：** 2026-09-11  
**依賴：** [C1](./C1_layout_store.md)  
**正式依據：** 負責人 2026-09-11 定案「dev 演示頁仍需要，作為週會報告」＋互動強化（真實機器／點格／自動 belt）

---

## 1. 背景

V11 `/dev/layout-l1-preview` 只切 fixture，與初版 V12 頁面同構。  
強化後 V12 **經 layoutStore 讀寫**：真實 toolbar 機器、預設點／點格放置、移動刪除、兩機自動拉 belt。

---

## 2. 技術決策（已落地）

| 項 | 選擇 |
|----|------|
| 入口 | **Vite 獨立 HTML**：`dev/layout-store-preview.html`（見 §2.1） |
| 機器資料 | `toolbarMachines.ts`（**不**改 `ToolbarPanel.vue`） |
| 放置 | 預設游標按鈕＋點空格；`addDevice` → `PlacementResult` |
| 選取／移動／刪除 | 點設備選取；方向鈕 `moveDevice`；刪除 `removeDevice`（回 `PlacementResult`） |
| belt | 三種：點兩機／點兩埠／手動 waypoints → `addPipeline` |
| undo／redo | 讀 `historyStore.canUndo`／`canRedo`；Command 由 store 內部組 |
| 錯誤呈現 | 紅框只落在 `layoutIssues` 指出的 id；頁面自身失敗標 `store=（未呼叫）` |
| fixture | 一鍵載入 connected／broken（備援） |
| 禁止 | 未 import `editorStore`；未改 GridCanvas／ToolbarPanel／`src/router`／`DevLayout.vue` |

### 2.1 為何不掛 `src/router`（主編 2026-09-15 確認保留）

dev 頁是**開發進度存證**：進度推進到 V12 之後只作歷史檢視，  \
不該影響專案主線，也不該被主線牽動。掛進 `src/router`／`DevLayout.vue`  \
會與他人本週的檔（harry [#47](https://github.com/dernoson/endfield-playground/pull/47)）互相衝突，  \
因此改用 Vite dev server 直接提供的獨立 HTML 入口：

```text
pnpm dev → http://localhost:5173/dev/layout-store-preview.html
```

`vite build` 只吃根目錄 `index.html`，故本頁**不進** production bundle  \
（實測 `dist/` 只有 `index.html`，且無 `LayoutStorePreview` chunk）。

另一個理由是共用 state：原本掛在 `/dev` 底下會與主編輯器共用同一個 Pinia，  \
演示頁的操作會寫進佈局 store 並污染 `historyStore`。獨立入口自建 `createApp`＋`createPinia`，  \
演示用的資料與歷史都關在自己的 app 裡。

**決議紀錄：** 第二輪 review 曾要求改回掛 `/dev` 路由（CLAUDE.md §1 規則 2 的 dev 頁慣例）。  \
2026-09-15 說明上述理由後，主編確認「demo 頁面我就不限制那麼多了」，**維持獨立入口**。  \
本頁不在工項交付物內，只為說明串接方法而存在，不是最終頁面。

---

## 3. 檔案計畫（已落地）

| 動作 | 檔案 |
|------|------|
| 新建／強化 | `src/app/dev/LayoutStorePreview.vue` |
| 新建 | `src/app/dev/layoutStorePreviewUtils.ts` |
| 新建 | `src/__tests__/app/layoutStorePreviewUtils.test.ts` |
| 新建 | `dev/layout-store-preview.html`、`src/app/dev/standalone/layoutStorePreviewMain.ts` |
| 不動 | `src/router/index.ts`、`src/app/dev/DevLayout.vue`（他人本週檔） |

---

## 4. 個人驗收（約 1 分鐘）

```text
1. pnpm dev → http://localhost:5173/dev/layout-store-preview.html
2. 選分類＋真實機器 →「放到預設點」→ 格上出現設備；紫條計數增加
3. 點空格再放一台；重疊同格應顯示 store=overlap，紅框只在重疊的兩台
4. 點兩機／點兩埠（綠圓＋橙方）／手動點格 → 綠線；connections 非 null
5. Undo／Redo 可退回；一鍵 fixture「斷線」仍可用；未接 editorStore
```

---

## 5. DoD

- [x] 獨立入口可開；真實機器＋預設／點格放置
- [x] 三種拉線（兩機／兩埠／手動）；PlacementResult 可見
- [x] undo／redo 可用（Command 由 store 組）
- [x] 資料路徑經 layoutStore
- [x] 步驟寫入 [V12_acceptance_guide](./V12_acceptance_guide.md)
- [x] type-check／utils 測綠；`dist/` 不含本頁

---

## 6. 開發日誌

### 2026-09-11

- 初版：fixture 切換經 store（與 V11 視覺同構）
- 強化：toolbarMachines＋預設點／點格／移動刪除／bestBeltAnchors 自動 belt；utils 測 4 綠

### 2026-09-14（PR #45 review 修訂）

- 入口改獨立 HTML；撤回 `src/router`／`DevLayout.vue`（review §5＋「dev 頁不互相牽動」原則）
- 補「點兩埠自動拉」與「手動拉線」（review §7）
- 邏輯修正：埠模式固定輸出→輸入（反向會被 `resolveConnections` 判成已連接）；
  手動斜點自動補轉角（`getPipelineOccupiedCells` 要求逐段軸對齊）；
  undo／刪除後清掉失效選取；頁面自身失敗不再假造 `PlacementResult`
