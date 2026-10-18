# V17-C1 — 共用機型查表入口（`resolveMachineDef`）

**對應工項：** V17-C1
**狀態：** `[x]` 完成（2026-10-18）
**日期：** 2026-10-18
**依賴：** [A1](./A1_scope_decision.md) `[x]`
**正式依據：** [#73](https://github.com/dernoson/endfield-playground/issues/73) §要做的事-1／4
**開發分支：** `dev/aaaaa1018`
**產物：** `src/data/machines.ts`（`resolveMachineDef`）、`src/__tests__/data/machines.test.ts`

---

## 1. 背景

全專案需要「給一個 machineType 字串 → Machine」的單一語意：

- 新模型：字串＝**英文 id** → `getMachineById`
- 舊 editorStore／部分 dev fixture：字串＝**中文名** → `getMachine`

若各呼叫點各自寫 `byId ?? byName`，日後移除過渡時必漏。

---

## 2. 契約

```typescript
/**
 * 解析機器定義（V17／#73）。
 *
 * 新模型權威＝英文 id（getMachineById）。
 * 過渡：查不到再試中文名（getMachine），供 editorStore／舊 dev 頁。
 * 移除時機：正式頁與驗證／引擎不再消費中文 machineType 之後。
 */
function resolveMachineDef(machineType: string): Machine | undefined
```

| 規則 | 說明 |
|------|------|
| 優先 | `getMachineById(machineType)` |
| 退回 | `getMachine(machineType)` |
| 都不中 | `undefined`（呼叫端自行略過／報錯） |
| 不改 | `getMachine`／`getMachineById` 本體語意 |

### 2.1 放置——**已決＝`src/data/machines.ts`**

與 `getMachine`／`getMachineById` 同檔 export；不另開 util。

---

## 3. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | **`src/data/machines.ts`** | 新增 `resolveMachineDef`＋JSDoc 移除時機 |
| 修改 | `src/__tests__/data/machines.test.ts` | id 命中／中文名退回／皆無 |
| **不改** | 配方資料鍵、Machine 型別 | |

---

## 4. 驗證標準

| # | 案例 | 預期 |
|---|------|------|
| 1 | `resolveMachineDef('crusher')` | 粉碎機定義 |
| 2 | `resolveMachineDef('粉碎機')` | 同定義（過渡） |
| 3 | `resolveMachineDef('nope')` | `undefined` |

---

## 5. DoD

- [x] 函式匯出＋JSDoc 含移除時機
- [x] §4 測試綠（3 案）
- [x] 未改 `getMachine`／`getMachineById` 各自語意

---

## 6. 開發日誌

### 2026-10-18｜實作完成

- `resolveMachineDef` 進 `machines.ts`；測試 id／中文名／皆無
- **下一刀＝D1（驗證 getDef＋E004／W001）**

### 2026-10-18｜定案

- 放置＝`machines.ts`（負責人確認）

### 2026-10-18

- 建檔；待實作
