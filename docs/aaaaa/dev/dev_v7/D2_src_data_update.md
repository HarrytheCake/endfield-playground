# V7-D2 — src/data 執行期資料更新

**對應工項：** V7-D2  
**狀態：** 完成  
**依賴：** V7-D1、V7-C1（以 `docs/aaaaa/data` 為準）  
**定案：** 對齊 v3；codegen；保留 FlowEngine source/sink stub；loss 只存資料

---

## 1. 凍結規格

| 項目 | 做法 |
|------|------|
| 來源 | `docs/aaaaa/data/*.json`（由 data_1 複製而來） |
| machines | 含 `modes`、`media: belt\|pipe`、`loss` 欄位寫入 TS 物件 |
| products | 全量；`name`→`itemId`；寫入 `machineMode`／`environment`／`timeSeconds` |
| environments | 新建 `src/data/environments.ts` |
| plans | 對齊 data（`-1`→`null`） |
| source/sink | 手寫 stub 合併進 machineList；材料加物品輸出口配方 |

### 查詢 API

```typescript
getMachine(name: string): Machine | undefined
getMachineById(id: string): Machine | undefined
getMachineMode(machine: Machine, modeId?: string): MachineMode  // re-export
getRecipesForMachine(machineName: string, modeId?: string): RecipeDef[]
getEnvironment(id: string): Environment | undefined
```

### Codegen

```text
pnpm sync:aaaaa-data      # data_1 → docs/aaaaa/data
pnpm generate:src-data    # docs/aaaaa/data → src/data/*.ts
```

腳本：`docs/aaaaa/scripts/generate-src-data.mjs`（支援 `--dry-run`）

---

## 2. 檔案修改計畫

| 檔案 | 動作 | 結果 |
|------|------|------|
| `src/data/machines.ts` | 重產（43 + source/sink） | 完成 |
| `src/data/products.ts` | 全量 + materials source + 測試 stub | 完成 |
| `src/data/plans.ts` | 對齊 | 完成 |
| `src/data/environments.ts` | 新建 | 完成 |
| `docs/aaaaa/scripts/generate-src-data.mjs` | codegen | 完成 |
| FlowEngine H 測試 | 對齊正式配方 I/O；動態 recipeIndex | 完成 |

---

## 3. 驗證標準

- [x] 機器數 = data 43 + source_source/sink stub
- [x] 氣態 recipe 可查；帶 machineMode
- [x] 資料層測試更新後通過；全測 217 passed

---

## 4. 開發日誌

### 2026-08-01

- 凍結與 A2／D1 一致的 API 與 loss 資料面
- 實作 generate-src-data；重產 machines／products／plans／environments
- FlowEngine 測試改依正式配方（如碳塊→碳粉末×2、藍鐵塊→藍鐵粉末）
