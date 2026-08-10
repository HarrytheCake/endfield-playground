# 待討論：拖曳移動設備目前沒有進歷史堆疊

**狀態：** ✅ V6 **已完成／已解鎖**（`commitDeviceMove` + Canvas + HistoryReplay M1–M6）  
**V6 追蹤：** [todolist_v6.md](./dev/todolist_v6.md)／[dev_v6/](./dev/dev_v6/)（最後更新 2026-08-02）  
**相關檔案：** `src/editor/canvas/FactoryCanvas.vue`、`src/store/editorStore.ts`、`src/store/historyStore.ts`
**相關規則：** `CLAUDE.md` §5 Store 操作規範（Command Pattern）、`L2.md` §4.7 Command 歸屬規則

> 現行功能開發走 **V9**。M7 主畫布跟手為已知 UX 觀察；管線跟隨仍屬 CR-02。  
> **里程碑結案報告（V6～V9）：** [MILESTONE_0802_V6_V9_REPORT.md](./MILESTONE_0802_V6_V9_REPORT.md)  
> **協作者使用說明：** [CR04_FOR_COLLABORATORS.md](./CR04_FOR_COLLABORATORS.md)

---

## 0. 結案回應（2026-08-02）— 給協作者

本檔原為「待討論」；下列為定案與交付說明，細節仍保留於下文供溯源。

### 討論結論（對照原文 §7）

| 原討論項 | 結論 |
|----------|------|
| 改簽名 vs 新 action | **新增** `commitDeviceMove(uids, before)`；**保留** `moveDevices(uids, delta)` |
| delta | 主動路徑保留；拖曳路徑用起始快照，不重複位移 |
| 管線跟隨 | 預留 L1 入口；**本版不做**（CR-02） |
| 範圍 | **先讓移動可 Undo**；跟隨後做 |

### 開發工項（已完成）

- L1：`commitDeviceMove`、零位移不進歷史、單元測試  
- L2：`FactoryCanvas` drag-start 快照／drag-stop commit  
- Dev：`/dev/history-replay` V6 區（一鍵 M1→M4 等；H1-5 文案強化）  

### 協作者如何驗證

1. 主畫布拖曳後 Ctrl+Z  
2. `/dev/history-replay` →「一鍵 M1→M4（推薦）」  
3. API 契約見 [CR04_FOR_COLLABORATORS.md](./CR04_FOR_COLLABORATORS.md) §A3  

### 仍非本里程碑範圍

- M7 真拖曳跟手 polish  
- CR-02 管線端點跟隨／連線 UI 拒絕  

---

## 1. 問題是什麼

在 `FactoryCanvas.vue` 裡，使用者用滑鼠拖曳畫布上的設備節點時，**這個移動不會被記錄進 `historyStore`**。也就是說：

- 拖完之後按 **Ctrl+Z**，設備不會回到拖曳前的位置（因為 undo stack 裡根本沒有這筆記錄）
- `editorStore.moveDevices(uids, delta)` 這個「高階 action」——依照 L1/L2 的既有設計，理應是移動設備唯一的合法入口——實際上**從來沒有被呼叫過**

這跟先前修過的 `placeDevice()` 是同一類問題（「L1 寫好了 Command 化的 action，但 L2 沒接上，直接繞過去改 state」），但 `placeDevice()` 已經在另一個 PR 修掉了；`moveDevices()` 這個還沒處理，且比 `placeDevice()` 複雜得多，需要先討論介面設計。

---

## 2. 為什麼會發生（根本原因）

`FactoryCanvas.vue` 用的是 Vue Flow 的雙向綁定：

```vue
<VueFlow v-model:nodes="nodes" v-model:edges="edges" ... :nodes-draggable="true" ... />
```

其中 `nodes` 是 `storeToRefs(editorStore).nodes`——**直接綁到 store 的 ref**。

Vue Flow 在使用者拖曳節點時，為了讓畫面「跟手」（每一幀都要看到節點跟著滑鼠移動），會在拖曳過程中**持續直接改寫 `v-model` 綁定陣列裡對應節點的 `position`**。這件事完全發生在 Vue Flow 內部，`editorStore` 跟 `historyStore` 都不知情。

換句話說：**拖曳結束的那一刻，畫面上的位置其實已經是「最終狀態」了**——不像 `placeDevice()` 的情境（原本用 `addNodes()` 一次性新增，改成呼叫 `editorStore.placeDevice()` 就好，沒有「畫面已經先變了」的問題）。

這也是為什麼這個問題沒辦法用跟 `placeDevice()` 一樣的方式簡單修掉：如果在 `@node-drag-stop` 時直接呼叫現有的 `moveDevices(uids, delta)`，位移量會被**套用兩次**（Vue Flow 拖曳時套用一次、`moveDevices()` 內部又再套用一次）。

---

## 3. 跟既有文件/設計預期的落差

`docs/dernoson/L2/toby.md`、`L2.md` 原本的設計預期是：

> L2 只負責：收集 move 的 uids + delta，呼叫一次 `moveDevices(...)`。整個 move（含跟隨與 auto-connect）由 L1 包成單一歷史項目，一次 Ctrl+Z 全還原。

這個預期背後假設的是「L2 自己算好 delta，主動呼叫一次 `moveDevices()`，由這一次呼叫同時完成『套用位移』與『進歷史』」——並沒有考慮到 Vue Flow 的 `v-model` 拖曳機制會自己先把位移套用掉。目前 `FactoryCanvas.vue` 完全沒有實作這段邏輯（沒有任何 `@node-drag-*` handler），這不是「寫錯」，比較像是「這塊互動根本還沒做」。

---

## 4. 影響範圍

- **使用者體感**：拖曳移動設備目前是這個編輯器裡**唯一「看起來正常、但無法復原」的核心操作**（放置、旋轉、刪除都已確認可正確 undo/redo）
- **CR-02 管線跟隨**：`moveDevices()` 目前 Phase 1 版本本身也還沒實作「移動時管線端點跟隨」（見 `harry.md`/`toby.md` 已知落差）。這代表就算現在把 `moveDevices()` 接上，管線跟隨還是要等 L1 補；但**介面設計必須現在就把這個未來需求考慮進去**，不然以後又要再動一次簽名
- **多選拖曳**：目前 `moveDevices()` 設計上支援批次 `uids[]`（一次歷史項目移動多台），拖曳互動如果只處理單一節點會不符合這個既有能力，框選多選後一起拖曳的情境需要一併涵蓋
- **不影響**：`src/app/dev/HistoryReplay.vue` 的「測試：移動所有設備」按鈕是直接呼叫 `editorStore.moveDevices()`（不經過 Vue Flow 拖曳），這條路徑本身沒問題，維持現狀即可

---

## 5. 可能的解法方向（給討論用，未定案）

### 方案 A：`drag-stop` 時建立「已套用」的 Command，繞過 `moveDevices()`

在 `@node-drag-start` 記錄起始位置快照，`@node-drag-stop` 算出最終 delta，直接組一個 `execute` 為 no-op（畫面已經是最終狀態）、`undo` 還原到起始位置的 Command。

- **優點**：改動範圍最小，只動 `FactoryCanvas.vue`
- **缺點**：**直接違反 `CLAUDE.md` §5 與 `L2.md` §4.7 的規則**——L2 不得自己組 Command、不得呼叫 `historyStore.execute()`。且完全繞過 `moveDevices()`，未來 L1 要在 `moveDevices()` 裡補管線跟隨邏輯時，這條路徑永遠吃不到
- **結論**：不建議，僅列出來說明「為什麼不能這樣做」

### 方案 B：`moveDevices()` 改為支援「位置已套用」模式（建議方向）

在 `editorStore` 調整 `moveDevices()` 的介面，讓它能區分兩種呼叫情境：

1. **主動呼叫**（現有行為，例如 dev 測試頁、未來的方向鍵微調）：呼叫端只給 `delta`，內部自己套用位移 + 記錄 Command
2. **被動確認**（拖曳情境）：呼叫端給「起始位置快照」與「目前已經是最終位置」，`moveDevices()` 內部**不再重新套用位移**（因為畫面已經是對的），只需要組出對應的 Command 推進 `historyStore`

具體實作可以是加一個 option 參數，或是拆成 `moveDevices(uids, delta)` 與 `commitDeviceMove(uids, snapshotBefore)` 兩個 action——這兩種切法各有取捨，需要跟 L1（moveDevices 的 owner）一起定案。

- **優點**：呼叫入口仍然是 L1 action，符合 Command 歸屬規則；未來管線跟隨邏輯可以直接補進這個共用入口，不管是「主動呼叫」還是「拖曳確認」都吃得到
- **缺點**：要改 `editorStore.ts` 的既有簽名或新增 action，`src/__tests__/store/editorStore.test.ts` 與 `src/app/dev/HistoryReplay.vue` 的呼叫方式可能要跟著調整；`L2.md` §4.2 的介面文件也要同步更新
- **需要決定**：改簽名（breaking，但介面單一乾淨）還是新增一個平行的 action（不動既有簽名，但多一個入口要維護）

### 方案 C：放棄 `v-model` 雙向綁定，改成單向資料流 + 自行處理拖曳視覺

不用 `v-model:nodes`，改成 `:nodes="nodes"`（單向），自己監聽 Vue Flow 的拖曳事件，在**本地 ref**（不是 store）暫存拖曳中的視覺位置，拖曳結束才寫回 store。

- **優點**：徹底切斷「Vue Flow 自己改 store」這條路，架構上最乾淨
- **缺點**：工作量與風險最大——要重新处理 Vue Flow 拖曳跟手、snap-to-grid、框選拖曳等現有能力如何在單向資料流下維持順暢，等於重寫一部分 CR-01 畫布互動
- **結論**：除非未來有其他理由必須切到單向資料流，否則不建議只為了這個問題做這麼大的重構

**目前傾向方案 B**，但實際簽名怎麼設計、要不要動既有 `moveDevices()` 簽名，需要 harry（L2 owner）與 L1 對齊後才能定案。

---

## 6. 牽涉到的檔案（初步估計，實際範圍依方案 B/C 而定）

| 檔案 | 需要的改動 |
|---|---|
| `src/store/editorStore.ts` | 調整 `moveDevices()` 簽名，或新增一個「確認已套用位移」的 action |
| `src/editor/canvas/FactoryCanvas.vue` | 新增 `@node-drag-start` / `@node-drag-stop` handler，記錄起始位置快照、拖曳結束後呼叫對應 action |
| `src/__tests__/store/editorStore.test.ts` | 補上新行為的單元測試（起始快照 + 不重複套用位移 + 正確進歷史） |
| `src/app/dev/HistoryReplay.vue` | 若 `moveDevices()` 簽名改變，「測試：移動所有設備」按鈕的呼叫方式要同步更新 |
| `docs/dernoson/L2/L2.md` §4.2 | 更新 `editorStore` 高階 actions 介面說明 |
| `docs/dernoson/L2/harry.md`、`toby.md` | 更新其中提到 `moveDevices(uids, delta)` 的介面片段與工作項目 |

多選（框選後一起拖曳）與單選拖曳應該共用同一條路徑（`moveDevices()` 本來就吃 `uids[]`），設計時不需要另外分案。

---

## 7. 建議討論時要決定的事

1. 方案 B 要「改既有 `moveDevices()` 簽名」還是「新增一個平行 action」？
2. 如果改簽名，`delta` 這個參數要保留（給主動呼叫情境用）還是拆成兩個 action 各自最小介面？
3. 未來 CR-02「移動時管線跟隨」要接在這個入口的哪個階段（`execute()` 內部、還是呼叫端組 Macro）？現在設計介面時要不要先預留這個擴充點？
4. 這個修復要不要跟 CR-02 管線跟隨一起做，還是先讓「移動能 undo」單獨上，管線跟隨留到 Phase 2？（傾向先讓 undo 正常運作，管線跟隨照原計畫留在後面）
