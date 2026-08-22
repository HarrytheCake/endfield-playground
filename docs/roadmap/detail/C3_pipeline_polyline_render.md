# R-C3 — 管線折線與 90 度彎折渲染

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §5 |
| 里程碑 | M3（2026-10-25）；首次可演示 10/11 |
| 擋門檻 | **是** |
| 建議主責／備援 | L3（MBD／goodmorning／avery 之一）＋L2 提供幾何／aaaaa |
| 性質 | 畫面（L3） |
| 依賴 | [C1](./C1_port_hit_and_draft.md)、[C2](./C2_add_connection_contract.md) |
| 狀態 | `[ ]` 未開始 |
| 最後更新 | 2026-08-22 |

---

## 1. 背景與動機

主編步驟 3 的驗收句是「兩 port 之間能拉、**能轉 90 度彎**」。直線連線在 10/4 就能演示，但工廠模擬器的管線幾乎不可能永遠共線——兩台設備錯開一格，直線就會斜著穿過畫布，看起來完全不像工廠。90 度彎折是「這東西像不像產線」的分水嶺。

同時，這是本輪唯一一項**只碰畫面、不碰狀態**的連線月工作：它只吃座標、只吐 SVG path，不碰 store、不碰互動，因此適合當成獨立的加分工單派出去。把它從 [C1](./C1_port_hit_and_draft.md) 拆出來，正是為了讓 L2 人力（本輪最緊的資源）不必兼做視覺。

## 2. 使用者看得到什麼

兩台錯開的設備之間，管線走的是直角轉彎的折線，不是斜線；違規的線段是紅色。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 邊元件 | `src/editor/canvas/PipelineEdge.vue` | 已存在，彎折未穩 |
| Vue Flow | 專案已使用 | 內建 smoothstep／step 邊型可參考 |
| 埠幾何 | `src/app/dev/topologyPortUtils.ts` | V9 已有 WxH 格點埠定位 |
| 佔格 | `src/utils/shirone/getPipelineOccupiedGrids.ts` | 已存在（本項不接，屬未來避讓範圍） |
| 視覺稿 | `docs/paper/` | 管線樣式不擋門檻 |

## 4. 技術決策

### 4.1 折線演算法（凍結為最簡形態）

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 直線 | 兩點連線 | 最省 | 斜線，不像產線 | 否 |
| **B. 單一中段的 L／Z 形** | 依起訖埠的 side 決定先走哪一軸，最多兩個轉角 | 實作單純；90 度彎；一週可交 | 會穿過其他設備 | **是** |
| C. A* 避讓路徑 | 繞開障礙 | 好看 | 屬 CR-07 自動路徑規劃，Phase 3 明列不做 | 否 |

採 B。**允許穿過其他設備**——避讓不在 11/29 範圍，寫進工單避免被當成 bug。

### 4.2 起訖方向規則

轉角數由兩端埠的 `side` 決定，不由座標差決定：

| 起點 side | 終點 side | 形狀 |
|-----------|-----------|------|
| right | left | 水平出 → 垂直 → 水平入（Z 形，兩個轉角） |
| right | top／bottom | 水平出 → 垂直入（L 形，一個轉角） |
| 同軸相對且共線 | — | 直線，零轉角 |

線一律**垂直於埠所在的邊**出發與進入，這是讓管線「看起來接在埠上」的關鍵。

### 4.3 幾何計算放哪裡

純函式，不在元件內：

```text
buildPipelinePath(from: PortAnchor, to: PortAnchor) → Point[]
```

`PipelineEdge.vue` 只吃 `points: Point[]` 與 `state: 'normal' | 'invalid' | 'congested'`，自己把點轉成 SVG path。這讓折線邏輯可被單元測試，也讓 L3 元件維持「只吃 props」。

### 4.4 狀態視覺

| state | 視覺 | 來源 |
|-------|------|------|
| `normal` | 依媒質區分（belt／pipe 用不同顏色或線寬） | 埠 media |
| `invalid` | 紅色 | [C2](./C2_add_connection_contract.md) 或引擎 `invalidChainUids` |
| `congested` | 橘色 | 引擎 `congestedEdges`（V8 H8 已有，11 月接） |

10 月只需 `normal` 與 `invalid`；`congested` 預留 prop，11 月由 [D1](./D1_stats_item_summary.md) 接上。

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `src/utils/pipelinePath.ts` | `buildPipelinePath` 純函式 |
| 新建 | `src/__tests__/utils/pipelinePath.test.ts` | 各 side 組合的轉角數與端點方向斷言 |
| 修改 | `src/editor/canvas/PipelineEdge.vue` | 只吃 `points` ＋ `state`，輸出 SVG path |
| 修改 | `src/editor/canvas/FactoryCanvas.vue` | 把埠錨點與狀態算好傳給邊元件（L2） |
| 唯讀 | `src/app/dev/topologyPortUtils.ts` | 埠錨點算法參考 |
| **不碰** | 避讓、自動路徑、`getPipelineOccupiedGrids` | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 10/04 | 直線可畫（配合 [C1](./C1_port_hit_and_draft.md) 首次連線） |
| 10/11 | 90 度彎折；違規線段紅色 |
| 10/18 | 媒質區分視覺（belt／pipe） |
| 10/25 | **門檻：** 錯開的兩台設備之間是直角折線 |

## 7. 不做

- 不做避開其他設備的路徑規劃
- 不做使用者手動拖曳中段調整路徑
- 不做管線佔格與管線之間的重疊檢查
- 不做流量動畫（跑動的箭頭）

## 8. 依賴與封鎖

依賴 [C1](./C1_port_hit_and_draft.md) 提供埠錨點座標、[C2](./C2_add_connection_contract.md) 提供 invalid 判定。純函式部分可**先行開發**，用假座標測試，不必等 C1。

## 9. DoD

- [ ] 兩台錯開的設備之間顯示直角折線，無斜線段
- [ ] 線從埠所在邊垂直出發與進入
- [ ] 共線時退化為直線，零轉角
- [ ] `invalid` 狀態顯示紅色
- [ ] `PipelineEdge.vue` 不 import 任何 store（code review 確認）
- [ ] `pipelinePath.test.ts` 涵蓋 §4.2 三種 side 組合並通過
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 通過

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 穿過設備被當成 bug 回報 | §4.1 明寫不做避讓；工單「不要碰」欄複述 |
| 折線邏輯寫進元件無法測試 | §4.3 純函式先行 |
| L3 未必有人接 | 純函式（aaaaa 或 shirone 皆可）與元件（L3）拆兩張工單；元件未交時用 Vue Flow 內建 step 邊型頂替 |

**未交頂替：** 可用 Vue Flow 內建的 `step`／`smoothstep` 邊型頂替，門檻仍成立（有 90 度彎），但埠垂直出發的細節會不精確，記為技術債。

## 11. 開發日誌

### 2026-08-22
- 建檔。刻意拆為純函式＋純畫面，讓本項可派給非 L2 人力，緩解連線月的 L2 瓶頸
