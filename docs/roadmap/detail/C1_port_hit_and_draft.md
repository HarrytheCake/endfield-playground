# R-C1 — Port 命中與 draft 連線

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §5 |
| 里程碑 | M3（2026-10-25）；首次可演示 10/4 |
| 擋門檻 | **是**（主編步驟 3 的入口） |
| 建議主責／備援 | L2 主責（harry／toby）／aaaaa 提供命中判定純函式 |
| 性質 | 接線（L2） |
| 依賴 | [A2](./A2_grid_and_port_alignment.md)、[B2](./B2_placement_chain.md)、[B3](./B3_rotation_90.md) |
| 狀態 | `[!]` 封鎖中（依賴 B2 於 9/27 通過） |
| 最後更新 | 2026-08-22 |

---

## 1. 背景與動機

「設備間拉管線」是主編 10 步裡最能讓人相信這是一個工廠模擬器的動作，也是整個 10 月的主軸。git 上已有 harry 的 `addConnection` MVP，但 port 與彎折都未穩——問題不在 `addConnection` 本身，而在**它前面那一段**：使用者怎麼知道哪裡可以連、按下去有沒有命中、拖到一半長什麼樣。

本項只負責這段互動：port 點看得見、按得中、拖得出一條暫時的線、放開時判斷有沒有落在另一個 port 上。**真正建立連線的規則判定在 [C2](./C2_add_connection_contract.md)，線條長相在 [C3](./C3_pipeline_polyline_render.md)。** 三項刻意拆開，因為它們分屬不同性質（互動／純函式／畫面），符合「同一人同一週只做一種性質」。

## 2. 使用者看得到什麼

滑鼠移到設備上，看得到埠的小點；按住一個埠拖出去，有一條跟著滑鼠的暫時線；拖到另一個埠上時該埠會highlight；放開後線留下或消失。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 連線 action | `editorStore.addConnection(edge)` | 已有（`editorStore.ts:574`），MVP 階段 |
| 埠工具 | `src/utils/portUtils.ts` | side／offset 換算已有 |
| 埠渲染 | `src/components/MachineShape.vue` | 已依 mode 畫埠 |
| 管線邊元件 | `src/editor/canvas/PipelineEdge.vue` | 已存在 |
| 埠幾何參考 | `src/app/dev/topologyPortUtils.ts`、`DevTopologySvg.vue` | V9 已做 WxH 格點埠定位，可沿用算法 |
| draft 狀態 | — | **不存在**，本項要補 |

## 4. 技術決策

### 4.1 draft 狀態放哪裡（關鍵決策）

| 方案 | 位置 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 存進 `editorStore` | 與 nodes／edges 同處 | 全域可讀 | draft 不是藍圖狀態，會污染歷史與 FlowEngine 觸發 | 否 |
| B. 存進 `canvasStore` | 已有視圖層 store | 不進歷史 | 仍是全域狀態，L3 可能誤讀 | 備選 |
| **C. L2 容器 local ref** | `FactoryCanvas.vue` 內 | 最單純；生命週期與互動一致；絕不進歷史 | 跨元件共享需 props 傳遞 | **是** |

採 C。draft 是「還沒發生的事」，不該讓 FlowEngine 的 `watch([devices, connections])` 因為它而重算。

### 4.2 命中判定為純函式

命中判定（滑鼠座標是否落在某個埠的熱區內）由 aaaaa 提供純函式，L2 只呼叫：

```text
findPortAt(point, nodes, getMachine) → { nodeUid, portId, side, media } | null
```

理由：這段邏輯需要吃 rotation、mode、格點座標，與 [A2](./A2_grid_and_port_alignment.md)／[B3](./B3_rotation_90.md) 同源。放在容器裡會變成第三套埠位置算法，日後必然與渲染分歧。

### 4.3 熱區大小

埠的視覺點可以小，熱區必須大。凍結為：**熱區半徑 ≥ 半個格子**，且在縮放時維持螢幕像素下限（避免縮小後點不到）。這是可用性問題，不是美觀問題，寫進 DoD。

### 4.4 放開時的三種結果

| 情況 | 行為 |
|------|------|
| 命中合法目標埠 | 呼叫 `addConnection`（規則由 [C2](./C2_add_connection_contract.md) 判定） |
| 命中不合法目標埠 | draft 消失；給即時視覺提示（紅色），**不彈對話框** |
| 未命中任何埠 | draft 消失，無提示 |

不合法的判定與提示文案屬 [C2](./C2_add_connection_contract.md)；本項只負責把結果反映到畫面。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | `src/editor/canvas/FactoryCanvas.vue` | draft local ref、pointer 事件、命中 highlight |
| 修改 | `src/components/MachineShape.vue` | 埠點 hover 樣式（L3，只吃 props） |
| 新建 | `src/utils/portHitTest.ts` | `findPortAt` 純函式（aaaaa） |
| 新建 | `src/__tests__/utils/portHitTest.test.ts` | 含 rotation 與多 mode 案例 |
| 唯讀 | `src/utils/portUtils.ts`、`src/app/dev/topologyPortUtils.ts` | |
| **不碰** | `addConnection` 規則、折線渲染、自動路徑規劃 | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 10/04 | 埠點可見；按下一個埠拖得出跟隨滑鼠的直線；放開命中另一埠時呼叫 `addConnection` |
| 10/11 | 命中 highlight ＋ 不合法紅色提示 |
| 10/18 | 熱區與縮放調校 |
| 10/25 | **門檻：** 兩台設備 port 對 port 穩定連得起來 |

## 7. 不做

- 不做自動吸附到最近的埠（只做命中判定）
- 不做物流橋／分流／匯流自動生成（Phase 2，明列於不做清單）
- 不做自動路徑規劃（CR-07，Phase 3）
- 不做從空白處拉線自動建設備

## 8. 依賴與封鎖

| 依賴 | 說明 |
|------|------|
| [B2](./B2_placement_chain.md) | 要先能穩定放下設備 |
| [B3](./B3_rotation_90.md) | 旋轉後埠位置若錯，命中判定必然錯 |
| [A2](./A2_grid_and_port_alignment.md) | 埠資料本身要正確 |

封鎖解除條件：9/27 門檻通過（B2 打通），且 B3 的埠換算測試綠燈。

## 9. DoD

- [ ] 埠點在設備上可見，hover 有回饋
- [ ] 按住埠可拖出跟隨滑鼠的暫時線
- [ ] 拖到另一埠上該埠有 highlight
- [ ] 放開命中 → 呼叫 `addConnection`；未命中 → draft 消失且不留殘影
- [ ] 全域搜尋確認 draft 狀態未寫入 `editorStore`，未觸發 FlowEngine 重算
- [ ] `portHitTest.test.ts` 涵蓋四種 rotation 並通過
- [ ] 熱區半徑 ≥ 半格，縮放後仍可點中
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| draft 寫進 store 導致引擎狂重算 | §4.1 決策；DoD 列入檢查 |
| 容器內長出第三套埠位置算法 | §4.2 純函式先行，10/4 前由 aaaaa 交付 |
| 埠太小點不到，被誤判為功能沒做 | §4.3 熱區下限寫進 DoD |
| L2 人力不足（同 B2） | 純函式（aaaaa）與互動（L2）拆成兩張工單，純函式先行不受阻塞 |

**未交頂替：** 無。本項是 10/25 門檻的必要條件；若 10/11 仍未動工，須在該日會上把範圍砍到「只支援水平／垂直相鄰兩台的直線連線」，保住門檻的最小形態。

## 11. 開發日誌

### 2026-08-22
- 建檔。draft 存放位置經三方案比較後定為 L2 local，理由是避免污染 FlowEngine 的 watch 觸發
