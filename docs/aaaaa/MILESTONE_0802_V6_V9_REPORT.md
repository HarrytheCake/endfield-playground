# CR-04 Milestone 報告 — V6～V9（2026-08-02）

**負責人：** aaaaa（CR-04）  
**日期：** 2026-08-02  
**範圍：** V6 拖曳進歷史 → V7 資料 v3 → V8 埠／速率／Dev 預覽 → V9 視覺化與輸入匹配  
**對象：** L2／L3 協作者、主編、Agent 維護者  
**狀態：** ✅ 本階段交付完成（含 V9-H1 驗收補強）

---

## 1. 一句話結論

CR-04 已完成：**拖曳可 Undo**、**資料 v3（modes／belt·pipe／form）落地**、**引擎埠／速率／堵塞語意穩定**、以及 **Dev 預覽＋反向最短鏈＋依輸入匹配配方**。協作者應以 `/dev/flow-engine` 與本報告連結的文件為準；`/dev/graph-viz` 已退役。

---

## 2. 對 [MILESTONE_0726.md](./MILESTONE_0726.md) 的回應

原始問題：畫布拖曳移動未進 `historyStore`，Ctrl+Z 無法還原。

### 2.1 討論項定案（對照原稿 §7）

| # | 原問題 | 定案 |
|---|--------|------|
| 1 | 改 `moveDevices` 簽名 vs 新增平行 action | **新增** `commitDeviceMove(uids, before)`；保留 `moveDevices(uids, delta)` |
| 2 | `delta` 是否保留 | **保留**於主動路徑；拖曳路徑用起始快照 `before`，不再套用位移 |
| 3 | CR-02 管線跟隨接點 | 預留共用 L1 入口；**本版不實作**跟隨 |
| 4 | 是否與管線跟隨同做 | **先做移動 Undo**；跟隨留 CR-02 |

### 2.2 工項落地摘要（V6）

| 層 | 內容 |
|----|------|
| L1 | `editorStore.commitDeviceMove`；零位移不進歷史 |
| L2 | `FactoryCanvas`：`@node-drag-start` 快照 → `@node-drag-stop` 呼叫 commit |
| 驗收 | 單元測試；`/dev/history-replay` M1–M6 一鍵腳本；M7 跟手＝已知 UX 觀察 |

詳見：[todolist_v6.md](./dev/todolist_v6.md)｜[dev_v6/](./dev/dev_v6/)｜原稿已標 ✅ 解鎖。

### 2.3 協作者怎麼驗證拖曳 Undo

1. 開主畫布，擺 1～2 台設備，拖曳後 **Ctrl+Z** → 應回到拖曳前座標  
2. 或開 `/dev/history-replay` → **一鍵 M1→M4（推薦）** → 看綠燈與 Undo Stack  
3. 多選拖曳應為**單一**歷史項目（一次 Undo 全還原）

---

## 3. V6～V9 開發彙總

```text
V6 拖曳 Undo ──► V7 資料 v3 ──► V8 埠／速率／預覽 ──► V9 材料源／E1／反向鏈／H1 驗收
```

| 版本 | 主題 | 狀態 | 協作者該記住的一句 |
|------|------|------|-------------------|
| **V6** | 拖曳進歷史 | ✅ | 用 `commitDeviceMove`；勿在 L2 自組 Command |
| **V7** | 資料 v3 遷移 | ✅ | `modes[]`、`machineMode`、belt↔pipe；`pnpm sync`／`generate` |
| **V8** | 埠一對一／速率／H8 | ✅ | 單埠單線；belt 30／pipe 60；堵塞看 H7／H8 |
| **V9** | 預覽＋輸入匹配＋反向鏈 | ✅ | 基礎材料輸出點；E1 完全集合匹配；D1 最短鏈 |

### 3.1 重點工項（跨版本）

| 領域 | 成果 | 主要路徑 |
|------|------|----------|
| 歷史 | 拖曳 Undo／Redo | `editorStore`、`FactoryCanvas`、`HistoryReplay` |
| 資料 | machines／products／materials／plans／environments | `docs/aaaaa/data/` → `pnpm generate:src-data` → `src/data/` |
| 引擎 | mode、媒質、埠基數、form、堵塞分攤、E1 匹配、副產邊候選 | `useFlowEngine.ts` |
| 反向鏈 | 最短配方步數回推至材料 | `src/utils/reverseChain.ts` |
| Dev | FlowEngine 三頁籤；HistoryReplay V6 區；graph-viz 退役 | `/dev/flow-engine`、`/dev/history-replay` |

### 3.2 品質門檻（本階段）

| 檢查 | 結果（2026-08-02） |
|------|-------------------|
| `pnpm type-check` | ✅ |
| `pnpm test` | ✅ ~289 |
| Dev 手測 | H1–H11／V7／V9 preset；D1 赫銅零件；H7／H8 堵塞；HistoryReplay M1–M6 |

### 3.3 已知限制（不阻擋本 milestone）

| 項 | 說明 | 負責方向 |
|----|------|----------|
| M7 跟手 | 主畫布真拖曳跟手為 UX 觀察 | 可後續 polish |
| 管線跟隨 | 移動時邊端點跟隨 | **CR-02** |
| CR-02 UI 拒連 | 錯媒質／單埠雙線 UI 拒絕 | CR-02；引擎側已標非法 |
| loss→summary | 資料有 loss，引擎不算進 summary | 後續 CR-04 可選 |
| 副產未接 Sink | D1 演示不自動為副產建模 | 引擎匹配已不污染；完整物流另開 |

---

## 4. 文件地圖（給協作者）

| 文件 | 用途 |
|------|------|
| **本報告** | V6～V9 總覽與 MILESTONE_0726 結案回應 |
| [DATA_FORMAT_GUIDE.md](./DATA_FORMAT_GUIDE.md) | 產品／材料／機器 JSON 格式與物態 |
| [CR04_FOR_COLLABORATORS.md](./CR04_FOR_COLLABORATORS.md) | 如何使用成果＋下一步建議 |
| [FLOW_ENGINE_GUIDE.md](./FLOW_ENGINE_GUIDE.md) | 引擎行為與 Dev 頁操作 |
| [README.md](./README.md) | CR-04 入口與進度 |
| [MILESTONE_0726.md](./MILESTONE_0726.md) | 拖曳問題原文（已解鎖） |
| [todolist_v9.md](./dev/todolist_v9.md) | 現行細項（含 H1） |

---

## 5. 建議協作者優先閱讀順序

1. [CR04_FOR_COLLABORATORS.md](./CR04_FOR_COLLABORATORS.md)（使用方式＋下一步）  
2. [DATA_FORMAT_GUIDE.md](./DATA_FORMAT_GUIDE.md)（改資料前必讀）  
3. [FLOW_ENGINE_GUIDE.md](./FLOW_ENGINE_GUIDE.md) §Dev 頁面  
4. 本地：`pnpm sync:aaaaa-data && pnpm generate:src-data && pnpm dev` → `/dev/flow-engine`

---

**維護者：** aaaaa  
**問題回報：** 開 issue 或回寫 `docs/aaaaa/dev/todolist_v9.md` 後續區
