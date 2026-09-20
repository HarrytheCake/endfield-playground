# V12-E1 證據 — 品質閘與解鎖句

**日期：** 2026-09-12  
**分支：** `dev/aaaaa0907`  
**工單：** [W0907-A0](../../../../work_dispatch/aaaaa/0907/W0907-A0_layout_store_model.md)

---

## 1. 解鎖句（正式宣告｜可複製）

```text
layout-store：useLayoutStore 可讀寫 devices／pipelines；connections 為 getter；測試綠；L2 可開（本週仍只讀；擺放／選取等 9/14 整合）
```

> **不是**解鎖擺放／選取／落子。toby T1 本週仍吃 props；B2 仍封鎖。

---

## 2. 品質閘（本工項範圍）

| 閘 | 結果 |
|----|------|
| `pnpm type-check` | 通過 |
| `pnpm test` layoutStore＋editorStore＋previewUtils | **3 files／51 tests** 通過 |
| 硬約束 diff | 未改 `editorStore`／`GridCanvas`／`ToolbarPanel`／`FactoryCanvas` |

---

## 3. `/dev` 驗收步驟（D1）

見 [V12_acceptance_guide §4](../V12_acceptance_guide.md)／[D1](../D1_dev_store_preview.md)：

```text
pnpm dev → http://localhost:5173/dev/layout-store-preview.html
選真實機器 → 放置 → 兩機／兩埠／手動拉 belt → 重疊回傳 overlap（紅框只在重疊者）
```

---

## 4. 讀取面簽章（PR body）

```ts
function useLayoutStore(): {
  readonly devices: Readonly<PlacedDevice[]>;
  readonly pipelines: Readonly<Pipeline[]>;
  readonly connections: Readonly<Connection[]>; // getter → resolveConnections
  readonly layoutIssues: LayoutIssues;          // 全量問題；L2 據此畫紅框
  loadSnapshot(snapshot: LayoutSnapshot): LayoutIssues;
  toSnapshot(): LayoutSnapshot;
  addDevice(device: PlacedDevice): PlacementResult;
  removeDevice(id: string): PlacementResult;
  moveDevice(id: string, position: Position): PlacementResult;
  addPipeline(pipeline: Pipeline): PlacementResult;
  removePipeline(id: string): PlacementResult;
};

/** 單一操作：一次一個 reason */
type PlacementResult =
  | { ok: true }
  | { ok: false; reason: 'overlap'; conflicts: [string, string][] }
  | { ok: false; reason: 'invalid'; invalidIds?: string[] };

/** 聚合面：invalid 與 overlap 可同時回報 */
interface LayoutIssues {
  ok: boolean;
  invalidIds: string[];
  conflicts: [string, string][];
}
```

---

## 5. 下游消費者（PR 用）

```text
下游消費者：
- L2（toby T1）：本週仍吃 props／fixture；9/14 再接 layoutStore
- L2（harry H1）：純座標，與 store 無關
- B2 擺放鏈：等本版 store 契約＋殼可擺放；本週不接落子、不解鎖擺放
- FlowEngine：仍經 toTopology；本版不改引擎
```

---

## 6. PR 狀態

| PR | 狀態 |
|----|------|
| [#45](https://github.com/dernoson/endfield-playground/pull/45) V12／W0907-A0 | **MERGED**（2026-09-14T17:12:28Z；merge commit `f95ed9f`） |

合入後 §4 的讀取面簽章即為 master 現況，[W0914-A0](../../../../work_dispatch/aaaaa/0914/W0914-A0_layout_store_land.md) DoD
「`git cat-file -e origin/master:src/store/layoutStore.ts` 成立」已達成。
