# 待實作：管線折線與 90 度彎折渲染（R-C3 幾何部分）

**狀態：** 實作中
**對應：** [C3_pipeline_polyline_render.md](../roadmap/detail/C3_pipeline_polyline_render.md)（`[ ]` 未開始，但純函式部分明確標示可先行開發，不必等 [C1](../roadmap/detail/C1_port_hit_and_draft.md)／[C2](../roadmap/detail/C2_add_connection_contract.md)）
**相關檔案：**

- `src/utils/pipelinePath.ts`（新建，純函式）
- `src/__tests__/utils/pipelinePath.test.ts`（新建）
- `src/editor/canvas/PipelineEdge.vue`（L3，改吃自己既有的 props 算路徑）
- `src/editor/canvas/injectionKeys.ts`（新建，provide/inject key）
- `src/editor/canvas/FactoryCanvas.vue`（追加：`provide` gridSize，見 §5）

---

## 1. 範疇判定

- `pipelinePath.ts` 為純函式（不 import Vue／Pinia），比照 C3 §4.3 決策
- `PipelineEdge.vue` 屬 L3，不 import 任何 store（C3 DoD 明確要求，且是既有事實，本次維持）
- **不改 `FactoryCanvas.vue`**：與 C3 原始檔案計畫的差異——原計畫要 `FactoryCanvas.vue` 算好錨點再傳給邊元件，但 Vue Flow 的 `EdgeProps` 本來就已提供 `sourceX`／`sourceY`／`sourcePosition`／`targetX`／`targetY`／`targetPosition`（`sourcePosition`/`targetPosition` 的字串值恰好與 `PortSide`（'top'|'right'|'bottom'|'left'）一致），`PipelineEdge.vue` 可以完全自己算，不需要 `FactoryCanvas.vue` 介入。這樣也避免了本週對 `FactoryCanvas.vue` 的檔案鎖（toby W0823-T1）再起衝突

## 2. 設計（依 C3 §4.1／§4.2 凍結演算法）

### 2.1 型別

```ts
export interface PipelinePoint {
    x: number;
    y: number;
}

export interface PortAnchor {
    x: number;
    y: number;
    side: PortSide;
}
```

### 2.2 演算法（一般化 C3 §4.2 的三個範例）

C3 §4.2 的表格只列了三個範例組合，本次概化為通用規則，不寫死 16 種 side 排列組合：

1. 依 `side` 判斷該埠的「出發／抵達軸向」：`top`／`bottom` → 垂直軸；`left`／`right` → 水平軸
2. 兩軸向相同（皆水平或皆垂直）：
     - 若在該軸向上已共線（水平時 y 相同；垂直時 x 相同）→ 直線，零轉角
     - 否則 → Z 形，兩個轉角，中繼點取兩端中點（水平出：`midX = (fromX+toX)/2`；垂直出：`midY = (fromY+toY)/2`）
3. 兩軸向不同（一水平一垂直）→ L 形，一個轉角：以「起點沿自己的軸向、終點沿自己的軸向」相交出一個轉角點

不做 side 的合法性檢查（例如 `to.side` 面向與 `from` 相斥的物理不合理組合）——C3 §4.1 已凍結為最簡形態，不處理避讓與方向合理性，本次比照

### 2.3 `PipelineEdge.vue`

```ts
const path = computed(() => {
    const from: PortAnchor = { x: props.sourceX, y: props.sourceY, side: props.sourcePosition as PortSide };
    const to: PortAnchor = { x: props.targetX, y: props.targetY, side: props.targetPosition as PortSide };
    const points = buildPipelinePath(from, to);
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
});
```

移除對 `props.data.bendPoints` 的依賴（該欄位從未被 `addConnection` 填入，本來就是死資料；型別本身不動，避免牽動 `FactoryEdge` 共用型別）。

## 3. 明確排除範圍

- 不做 `invalid`／`congested` 狀態視覺（C3 §4.4，屬 C2／D1 範疇）
- 不做避讓其他設備、不做手動拖曳中段調整（C3 §7 明列不做）
- 不改 `FactoryEdgeData` 型別、不改 `editorStore.ts`

## 5. 追加：中繼點吸附格線（使用者後續要求）

原本 §3 排除「bend 座標吸附到 gridSize 倍數」，因為做這件事需要 `canvasStore.gridSize`，而 `PipelineEdge.vue` 不能 import store。使用者後續要求補上，改用 `provide`／`inject`（而非 `useCanvasStore()`）解法：

- `FactoryCanvas.vue`：`provide(PIPELINE_GRID_SIZE_KEY, gridSize)`（`gridSize` 是既有的 `storeToRefs(canvasStore)` 響應式參照，本來就存在，只加一行 `provide`）
- `PipelineEdge.vue`：`inject(PIPELINE_GRID_SIZE_KEY, ref(20))` 讀取，傳給 `buildPipelinePath(from, to, gridSize.value)` 當第三個選填參數
- `buildPipelinePath` 新增選填的 `gridSize?: number` 參數：只吸附 Z 形的中繼點（本函式自己算出來的座標），**不吸附 L 形的轉角或任何端點**——端點是實際埠座標，吸附會讓線離開埠的瞬間多一段偏移，看起來沒對準埠
- 這技術上仍算「touch FactoryCanvas.vue」，但只加一行 `provide`，不修改既有邏輯、不新增 Pinia action、不違反 L3 不 import store 的規則（inject 不是 import store）

## 4. 驗證方式

- `pnpm type-check` / `lint-check` / `format-check` / `test`
- `pipelinePath.test.ts` 涵蓋：同軸共線（零轉角）、同軸不共線（Z 形兩轉角）、異軸（L 形一轉角），至少各方向各一案例
- `pnpm dev` 手動測試：兩台位置錯開、port 朝向不同邊的設備之間連線，管線應顯示直角折線而非斜線
