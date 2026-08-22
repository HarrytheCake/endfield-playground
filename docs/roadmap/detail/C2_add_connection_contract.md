# R-C2 — addConnection 契約與型別檢查

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §5 |
| 里程碑 | M3（2026-10-25）；純函式最遲 10/4 |
| 擋門檻 | **是** |
| 建議主責／備援 | aaaaa（規則純函式）＋L2（呼叫端）／— |
| 性質 | 純函式 ＋ 接線 |
| 依賴 | [A2](./A2_grid_and_port_alignment.md) |
| 狀態 | `[ ]` 未開始 |
| 最後更新 | 2026-08-22 |

---

## 1. 背景與動機

`addConnection` 已存在，但它接受什麼樣的邊、拒絕什麼樣的邊，目前沒有一份可執行的規則。這造成兩個下游問題：

1. **FlowEngine 收到非法邊時只能整條鏈判為 invalid**，使用者看到「沒有數字」卻不知道為什麼
2. **L2 只好自己判斷**，於是型別檢查邏輯散在容器裡，與引擎側的判定（V8 已實作 `isItemFormMediaMismatch`、埠一對一）變成兩套

V8／V9 已經在引擎側把規則想清楚了：belt 對 belt、pipe 對 pipe，`form` 決定媒質（solid→belt，liquid／gas→pipe），單埠單線。本項要做的是**把這些規則抽成連線前就能呼叫的純函式**，讓 L2 在放開滑鼠的當下就知道能不能連，而不是等引擎算完才發現。

## 2. 使用者看得到什麼

把皮帶埠拖到水管埠上，該埠不會亮綠、放開後線不會留下；把已經連過的埠再連一條，同樣被擋。合法的連線放開後就留在畫面上。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 連線 action | `editorStore.addConnection(edge)` | 已有，未帶完整規則檢查 |
| 邊型別 | `src/types/graph.ts` `FactoryEdge` | 已有 |
| 埠媒質 | `PortMedia`（`belt`｜`pipe`），`src/types/machine.ts` | 已有（V7） |
| 物品形態 | `ItemForm`，`getItemForm`／`getItemPortMedia`／`getMaterialPortMedia` | 已有（V8／V9） |
| 引擎側檢查 | `isItemFormMediaMismatch`、埠一對一、`src/__tests__/flowEngine.v8.portCardinality.test.ts` | 已有 |
| 連線前檢查 | — | **不存在**，本項要補 |

## 4. 技術決策

### 4.1 規則清單（凍結）

| # | 規則 | 判定依據 | 違反時 |
|---|------|----------|--------|
| 1 | 必須 output → input | 埠方向 | 拒絕 |
| 2 | 媒質必須相同 | `PortMedia`：belt↔belt、pipe↔pipe | 拒絕 |
| 3 | 單埠單線 | 該埠已有連線則不可再連 | 拒絕 |
| 4 | 不可自連 | `sourceUid === targetUid` | 拒絕 |
| 5 | 不可重複邊 | 同一組 (srcUid, srcPort, tgtUid, tgtPort) 已存在 | 拒絕 |
| 6 | handle 必帶 | edge 必須含 sourcePortId／targetPortId | 拒絕 |

**環路不在此檢查。** FlowEngine 的 `topologicalSort` 已能偵測環路並略過該子圖；在連線當下擋環路會讓合理的回收產線無法搭建，屬過度限制。

### 4.2 方案比較：規則放哪一層

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 寫在 `addConnection` 內部 | action 自己擋 | 唯一入口，一定生效 | L2 拿不到「為什麼不行」，無法在放開前給提示 | 部分 |
| B. 寫在 L2 容器 | 容器判斷後才呼叫 | 可即時提示 | 與引擎側兩套；容器繞過就失效 | 否 |
| **C. 純函式 ＋ action 內部同時使用** | `canConnect(edge, ctx)` 回傳結果與原因；L2 呼叫它做提示，`addConnection` 也呼叫它做最終防線 | 一套邏輯兩處使用；可測試 | 需定義 context | **是** |

### 4.3 型別設計

```typescript
/** 連線可行性判定結果 */
interface ConnectCheckResult {
  /** 是否允許建立此連線 */
  ok: boolean
  /** 違反的規則代碼；ok 為 true 時為 null */
  reason:
    | null
    | 'direction'      // 非 output → input
    | 'media'          // belt / pipe 不符
    | 'port_occupied'  // 單埠單線
    | 'self_loop'      // 自連
    | 'duplicate'      // 重複邊
    | 'missing_handle' // 缺 handle
  /** 給使用者看的短句（繁中，一行） */
  message: string | null
}
```

`message` 在此層產出而非 L3，理由與 [B4](./B4_selection_inspector.md) 的攤平契約一致：L3 不做文案組裝。

### 4.4 與引擎側的關係

本項是**連線前**的守門，引擎側 V8 的檢查是**算流量時**的守門，兩者不互相取代：

- 連線前擋掉的，引擎根本不會看到
- 引擎側的檢查保留，因為 JSON 匯入（[D4](./D4_blueprint_json_io.md)）可能帶進未經 UI 的邊

兩處必須共用同一組媒質判定函式，不得各寫一份。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/utils/connectRules.ts` | `canConnect(edge, ctx)` 純函式 |
| 新建 | `src/__tests__/utils/connectRules.test.ts` | 六條規則各至少一正一反案例 |
| 修改 | `src/store/editorStore.ts` | `addConnection` 內部呼叫 `canConnect` 作最終防線（**僅 aaaaa**，屬 L1 改動須標明） |
| 修改 | `src/editor/canvas/FactoryCanvas.vue` | draft 放開前呼叫 `canConnect` 決定 highlight 顏色（L2） |
| 唯讀 | `src/composables/useFlowEngine.ts` | 確認媒質判定共用，不複製邏輯 |
| **不碰** | 引擎既有檢查邏輯、環路偵測 | |

> `editorStore` 屬 CR-01 主責，`addConnection` 加入檢查屬行為變更，須事前與主編確認並標為 Breaking（見 [E2](./E2_layer_guard_pr_rules.md)）。

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 10/04 | `connectRules.ts` ＋ 測試交付（純函式先行，不依賴 L2） |
| 10/11 | L2 接上：不合法時 highlight 紅色，放開不建立 |
| 10/18 | `addConnection` 內部防線接上並標 Breaking |
| 10/25 | **門檻：** 型別對才允許連線，錯接有即時視覺 |

## 7. 不做

- 不做環路擋阻
- 不做速率上限檢查（belt 30／pipe 60 屬引擎側，不在連線當下擋）
- 不做「這條連線在產線上有沒有意義」的語意檢查（屬 [D3](./D3_recipe_alerts.md) 警訊）
- 不做自動修正建議

## 8. 依賴與封鎖

依賴 [A2](./A2_grid_and_port_alignment.md)（埠資料正確）。`addConnection` 的行為變更需主編點頭，屬跨 CR 協商，最遲 10/11 提出。

## 9. DoD

- [ ] `connectRules.ts` 實作六條規則，`canConnect` 回傳 §4.3 型別
- [ ] 測試涵蓋六條規則各一正一反，全綠
- [ ] belt→pipe 錯接在 UI 上有即時紅色回饋且不建立邊
- [ ] 同一埠連第二條被擋
- [ ] `addConnection` 內部亦擋（繞過 UI 直接呼叫也不會建立非法邊）
- [ ] 媒質判定與 `useFlowEngine` 共用同一函式（code review 確認無複製）
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 改 `addConnection` 破壞既有 L2 MVP | 標 Breaking，先改 L1 再改 L2，同一週不逼 L3 跟版 |
| 規則散成兩套 | §4.2 決策；DoD 列入 code review 檢查 |
| 過度限制導致合理產線連不起來 | 環路明確排除；規則清單凍結，新增規則須另開工項 |

**未交頂替：** 若純函式未完成，10/25 門檻降級為「連得起來但不檢查型別」，並在該日記錄為技術債，11 月由引擎側的既有檢查兜底（使用者會看到鏈路 invalid 而非即時回饋）。

## 11. 開發日誌

### 2026-08-22
- 建檔。規則清單自 V8 引擎側既有檢查（埠一對一、form／media）反向整理為連線前版本；刻意排除環路
