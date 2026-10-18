# V17-D1 — 驗證路徑：getDef＋E004／W001 查表對齊

**對應工項：** V17-D1
**狀態：** `[x]` 完成（2026-10-18）
**日期：** 2026-10-18
**依賴：** [C1](./C1_resolve_machine_def.md) `[x]`
**正式依據：** [#73](https://github.com/dernoson/endfield-playground/issues/73) §要做的事-2、驗收-1
**開發分支：** `dev/aaaaa1018`
**產物：** `useValidation.ts`、`E004_missingInput.ts`、`W001_unmatchedMaterial.ts`、對應測試

---

## 1. 背景

`useValidation` 目前：

```ts
getDef: getMachine  // 只認中文名
```

E004／W001 另有 `ctx.getDef(...) ?? getMachine(...)`。  
一旦 devices 的 `data.machineType` 變成英文 id（layoutStore／toTopology），**查無定義 → continue**，正式頁看不到 E004／W001。

---

## 2. 技術決策

| 決定 | 說明 |
|------|------|
| `getDef` | 改為 `resolveMachineDef`（或同等雙查） |
| E004／W001 | **刪除**直接 `import { getMachine }` 後備；一律 `ctx.getDef(machineType)` |
| 配方 | 維持 `getRecipesForMachine(machineDef.name, modeId)` |
| 語意 | **不**重開 A-5、導流清單、W001 Exact Match |

### 2.1 與 azure 邊界——**已決**

偵測器檔屬 azure 主責區（WEEK 鎖表）。本版依 #73：**只改查表、A-5 不動**；開 PR 時知會 azure。不改判定規則與既有測試意圖（可**新增**英文 id 案例）。

---

## 3. 檔案計畫

| 動作 | 檔案 |
|------|------|
| 修改 | `src/composables/useValidation.ts` |
| 修改 | `src/lib/validation/detectors/E004_missingInput.ts` |
| 修改 | `src/lib/validation/detectors/W001_unmatchedMaterial.ts` |
| 修改／擴充 | `src/__tests__/lib/validation/detectors/E004_*.test.ts`、`W001_*.test.ts` |
| 可選 | 其他仍直接 `getMachine(machineType)` 的 detector（E001 等）——若 `getDef` 已雙查且它們走 `ctx.getDef`，可不動 |

---

## 4. 驗證標準（#73 驗收）

| # | 案例 | 預期 |
|---|------|------|
| 1 | 英文 id 加工機、無入邊 | **E004** |
| 2 | 英文 id 加工機、入邊材料不符目前模式配方 | **W001** |
| 3 | 既有中文名案例（dev／舊測） | **仍過**（雙查） |
| 4 | 既有 W001 A-5／導流測 | **回歸綠** |

建測方式建議：構造 `ValidationContext`，`devices[].data.machineType = 'crusher'` 等，`getDef: resolveMachineDef`。

---

## 5. DoD

- [x] `getDef` 走 resolve
- [x] E004／W001 無直接 `getMachine` 查定義
- [x] §4 新測＋回歸綠（E004 T10、W001 T19；既有全過）
- [x] 未改 A-5／導流語意

---

## 6. 開發日誌

### 2026-10-18｜實作完成

- `getDef`→`resolveMachineDef`；E004／W001 只走 `ctx.getDef`
- 測試 createContext 改掛 mock `getMachine` 為 getDef；補英文 id 案例
- **下一刀＝E1（引擎查表）**

### 2026-10-18｜定案

- 只改查表、A-5 不動；開 PR 知會 azure

### 2026-10-18

- 建檔；待 C1
