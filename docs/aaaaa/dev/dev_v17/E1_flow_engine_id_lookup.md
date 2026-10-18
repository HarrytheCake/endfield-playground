# V17-E1 — 引擎查表對齊（英文 id → 定義；中文名 → 配方）

**對應工項：** V17-E1
**狀態：** `[x]` 完成
**日期：** 2026-10-18
**依賴：** [C1](./C1_resolve_machine_def.md)
**正式依據：** [#73](https://github.com/dernoson/endfield-playground/issues/73) §要做的事-3
**開發分支：** `dev/aaaaa1018`

---

## 1. 背景

`useFlowEngine.ts` 多處 `getMachine(node.machineType)`，並常把 **同一個字串** 傳進 `getRecipesForMachine(machineType, …)`。

| 資料 | 鍵 |
|------|-----|
| `Machine` 表 | id＝英文；name＝中文 |
| `getRecipesForMachine` | **中文名** |
| toTopology 輸出 `data.machineType` | **英文 id** |

因此：查定義必須認 id；查配方必須用 `machineDef.name`（查到定義之後）。

---

## 2. 技術決策

| 決定 | 說明 |
|------|------|
| 查定義 | 一律 `resolveMachineDef(machineType)`（過渡雙查） |
| 查配方 | `getRecipesForMachine(machineDef.name, modeId)`；**禁止**再拿英文 id 當配方鍵 |
| `resolveMachineMode` 等 helper | 同步改；對外簽章字串語意改為「id 或過渡中文名」 |
| `getMachinePortMedia` | 已吃 `GetMachineFn`；呼叫端改傳 resolve 即可 |

### 2.1 不在本細項

正式改 watch `layoutStore`／掛載點 → [F1](./F1_engine_topology_slice.md)。本項只讓「餵進來的節點無論 id／中文名都能算」。

---

## 3. 檔案計畫

| 動作 | 檔案 |
|------|------|
| 修改 | `src/composables/useFlowEngine.ts`（所有 `getMachine(` 查定義點） |
| 回歸 | 既有 `flowEngine*.test.ts`／`useFlowEngine.test.ts`（多為中文名 fixture → 雙查應仍過） |
| 可選 | 抽 1–2 則英文 id fixture 煙測（完整鏈在 F1） |

---

## 4. 驗證標準

| # | 案例 | 預期 | 結果 |
|---|------|------|------|
| 1 | 既有中文名引擎測 | 全綠 | ✅ 64 tests |
| 2 | 節點 `machineType: 'crusher'`＋正確配方名路徑 | 能取到定義與配方（煙測或併 F1） | ✅ 煙測 |
| 3 | grep `getRecipesForMachine(machineType` | 引擎主路徑應改為 name；殘留須註明 | ✅ 僅經 `recipesForMachineType`→`def.name` |

---

## 5. DoD

- [x] 引擎查定義走 resolve
- [x] 配方鍵經 `machineDef.name`
- [x] 既有引擎測綠
- [x] 未改 editorStore 簽名

---

## 6. 開發日誌

### 2026-10-18｜完成

- `useFlowEngine.ts`：`resolveMachineDef` 取代所有查定義 `getMachine`；內部 helper `recipesForMachineType` 經 `def.name` 呼叫 `getRecipesForMachine`
- `getMachinePortMedia(..., resolveMachineDef)`
- 煙測：`useFlowEngine.test.ts`／`matchRecipeByInputs.test.ts`（`crusher` ↔ `粉碎機`）
- 回歸：`useFlowEngine`／`matchRecipeByInputs`／`flowEngine`／`flowEngine.v9.h12` **64 綠**
- **下一刀＝F1**（toTopology 餵入切片）

### 2026-10-18

- 建檔；待 C1
