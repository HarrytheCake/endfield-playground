# R-D4 — 最小藍圖 JSON 匯出／匯入

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §6 |
| 里程碑 | M4（2026-11-29）；首次可演示 11/22 |
| 擋門檻 | **是**（主編步驟 10） |
| 建議主責／備援 | aaaaa／— |
| 性質 | 純函式 ＋ 接線 |
| 依賴 | [B2](./B2_placement_chain.md)、[C1](./C1_port_hit_and_draft.md)、[C5](./C5_source_primary_output.md) |
| 狀態 | `[ ]` 未開始 |
| 最後更新 | 2026-08-22 |

---

## 1. 背景與動機

匯出／匯入是主編 10 步的最後一步，也是唯一一項讓成果「離開瀏覽器」的功能。沒有它，使用者關掉分頁就失去一切，任何超過一次會話的使用都不成立。

CR-06 的完整規格包含 HTML 自包含記錄檔與跨版本遷移，本輪明確**精簡**：只做 `{ version, planId?, nodes, edges }` 的最小 JSON。理由是 HTML 自包含牽涉資源內嵌與版本演進，工作量與 JSON 不在同一個量級，而 11/29 的驗收只需要「存得出、讀得回」。

## 2. 使用者看得到什麼

頂欄有 Save 與 Load 兩顆按鈕。按 Save 下載一個 `.json`；重新整理頁面後按 Load 選那個檔，設備與管線都回來了。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 頂欄 | `src/editor/navbar/Navbar.vue` | 已存在 |
| 節點／邊型別 | `src/types/graph.ts` `FactoryNode`／`FactoryEdge` | 已有 |
| 落子 action | `editorStore.placeDevice`、`addConnection` | 已有 |
| 計畫型別 | `src/types/plan.ts` | 已有（`planId` 來源） |
| Schema 驗證 | — | **不存在**；需引入或手寫 |
| 匯出／匯入 | — | **不存在**，本項全新 |

## 4. 技術決策

### 4.1 Schema（凍結）

```typescript
/** 最小藍圖檔格式 */
interface BlueprintFile {
  /** 格式版本；本輪固定 1 */
  version: 1
  /** 所屬計畫；未指定時省略 */
  planId?: string
  /** 已擺放設備 */
  nodes: FactoryNode[]
  /** 管線連接 */
  edges: FactoryEdge[]
}
```

`nodes` 必須包含 `machineType`、座標、`rotation`、`data.machineMode`、`data.primaryOutput`；`edges` 必須包含兩端 uid 與 **handle**。缺 handle 的邊在匯入時直接拒絕整個檔案，理由見 §4.4。

### 4.2 方案比較：驗證機制

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 不驗證，直接 `JSON.parse` | 最省 | — | 壞檔會讓畫布進入半損毀狀態，比不能載入更糟 | 否 |
| B. 手寫型別守衛 | 逐欄檢查 | 無新依賴 | 冗長；欄位增加時容易漏 | 備選 |
| **C. Zod schema** | 宣告式驗證 | 錯誤訊息可讀；與型別同源 | 新增依賴 | **是（若專案已有或可加）** |

若引入 Zod 需經主編同意（新依賴）。未獲同意則退回 B，但**驗證本身不可省**。

### 4.3 匯入策略：全有或全無

| 方案 | 作法 | 採用 |
|------|------|------|
| A. 逐節點載入，壞的跳過 | 部分成功 | 否——使用者會得到一張缺了幾台機器的產線，且不知道缺了什麼 |
| **B. 驗證通過才整批載入，否則不動現況** | 全有或全無 | **是** |

匯入前先清空畫布，或提示「將取代目前內容」。**不做合併匯入**。

### 4.4 匯入走哪條路

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 逐一呼叫 `placeDevice`／`addConnection` | 沿用既有 action | 不需新 action；一定合法 | 歷史堆疊會塞進 N 筆，Undo 要按 N 次 | 部分 |
| **B. 新增 `loadBlueprint(data)` 專用 action** | 一次寫入，一筆歷史 | Undo 一次還原；語意清楚 | 需 CR-01 同意新增 action | **是** |

採 B。若 CR-01 未及同意，退回 A 並在 11/22 記錄為技術債。這也是 §4.1 要求 edge 必帶 handle 的原因：`loadBlueprint` 繞過了 [C2](./C2_add_connection_contract.md) 的 UI 檢查，必須在 schema 層把關。

### 4.5 版本欄位的用途

`version: 1` 現在沒有任何遷移邏輯，但**必須寫進檔案**。這是留給下一輪的鉤子：未來讀到 `version: 2` 時知道要走不同分支。本輪讀到非 1 的版本直接拒絕並提示。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/types/blueprint.ts` | `BlueprintFile` 型別 |
| 新建 | `src/utils/blueprintIo.ts` | `serializeBlueprint`／`parseBlueprint`（純函式） |
| 新建 | `src/__tests__/utils/blueprintIo.test.ts` | round-trip、壞檔拒絕、缺 handle 拒絕、版本不符拒絕 |
| 修改 | `src/store/editorStore.ts` | 新增 `loadBlueprint`（**aaaaa**；須 CR-01 同意） |
| 修改 | `src/editor/navbar/Navbar.vue` | Save／Load 按鈕與檔案選擇 |
| **不碰** | HTML 自包含匯出、跨版本 migrate、雲端儲存、自動存檔 | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 11/08 | `blueprintIo.ts` ＋ round-trip 測試（純函式先行） |
| 11/15 | `loadBlueprint` action ＋ 測試 |
| 11/22 | **頂欄 Save 下載；Load 還原 nodes／edges** |
| 11/29 | **門檻：** 匯出後重新整理再匯入，設備還在 |

## 7. 不做

- 不做 HTML 自包含記錄檔（明列於不做清單）
- 不做跨版本 migrate
- 不做雲端儲存、自動存檔、localStorage 持久化
- 不做合併匯入
- 不做匯出圖片

## 8. 依賴與封鎖

| 依賴 | 說明 |
|------|------|
| [B2](./B2_placement_chain.md)、[C1](./C1_port_hit_and_draft.md) | 要先有東西可存 |
| [C5](./C5_source_primary_output.md) | `primaryOutput` 必須在 node.data 內才存得到 |
| CR-01 同意 `loadBlueprint` | 最遲 11/8 提出 |
| Zod 依賴（若採用） | 主編同意；否則退回手寫守衛 |

## 9. DoD

- [ ] 頂欄 Save 可下載 `.json`
- [ ] Load 選檔後 nodes／edges 完整還原（含 rotation、machineMode、primaryOutput、handle）
- [ ] 匯出 → 重新整理 → 匯入，畫面與匯出前一致
- [ ] 壞檔（缺欄位／缺 handle／版本不符）被拒絕且畫布維持原狀
- [ ] round-trip 測試通過（序列化再解析得到等價結構）
- [ ] 匯入後 Undo 一次可還原（若採 §4.4 方案 B）
- [ ] 匯入後右側產耗數字正確重算
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 壞檔讓畫布半損毀 | §4.3 全有或全無 |
| 繞過連線規則載入非法邊 | §4.1 schema 要求 handle；`loadBlueprint` 內部沿用 [C2](./C2_add_connection_contract.md) 的 `canConnect` 過濾 |
| 新依賴未獲同意 | 退回手寫型別守衛，驗證不可省 |
| 新 action 未獲同意 | 退回逐一呼叫既有 action，記為技術債 |

**未交頂替：** 無。這是驗收劇本第 7 步。若 11/22 未完成，最低限度提供「匯出」單向功能（讓成果不會遺失），匯入延到下一輪——但這會讓門檻降級，須在 11/22 會上明確記錄。

## 11. 開發日誌

### 2026-08-22
- 建檔。schema 刻意最小化；`version` 欄位無實際邏輯但保留為下一輪遷移鉤子
