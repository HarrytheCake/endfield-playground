# V8-E1 — form（物態）型別與資料匯入

**對應工項：** V8-E1  
**狀態：** 完成（資料已入 `docs/aaaaa/data`／`data_1`，並 codegen 至 `src/data`）  
**日期：** 2026-08-01

---

## 1. 欄位定案（與初稿差異）

| 項 | 結論 |
|----|------|
| JSON／TS 欄位名 | **`form`**（非 `matterState`） |
| 值域 | `'solid' \| 'liquid' \| 'gas'` |
| 型別名 | `ItemForm`（`src/types/flow.ts`） |
| 缺省 | 缺欄視為 `solid`（codegen `normalizeForm`） |
| 雙重身分 | 同名同時在 materials／products 時 **form 必須一致**（codegen 會 throw） |

物態 → 媒質：`solid` → `belt`；`liquid`／`gas` → `pipe`（`formToPortMedia`）。

---

## 2. 資料位置

```text
docs/aaaaa/data_1/materials.json  ─┐
docs/aaaaa/data_1/products.json   ─┼─► pnpm sync:aaaaa-data ► docs/aaaaa/data
                                   │
                                   └─► pnpm generate:src-data ► src/data/materials.ts
                                                               src/data/products.ts（含 form）
```

schema 說明：`docs/aaaaa/data/materials.md`、`products.md`。

---

## 3. 執行期 API

| API | 說明 |
|-----|------|
| `getAllMaterials`／`getMaterial` | `src/data/materials.ts` |
| `getProduct`／`getItemForm`／`getItemPortMedia` | `src/data/products.ts` |
| `PIPE_RATE_LIMIT`／`rateLimitForMedia` | `src/types/flow.ts`；FlowEngine 已依邊媒質套用 30／60 |
| form↔媒質檢查 | `useFlowEngine`（handle 齊全時） |

---

## 4. DoD

- [x] `ItemForm` 與 `ProductDef.form`／`MaterialDef.form` 進型別
- [x] codegen 寫入 form；materials.ts 產出
- [x] data_1 已同步 form（避免 sync 覆蓋）
- [x] type-check／相關測試

---

## 5. 開發日誌

### 2026-08-01

- 初稿曾用 `matterState`；實際 JSON 為 `form`，以此為準
- 負責人於 `docs/aaaaa/data` 補齊 form 後匯入並更新引擎速率／物態檢查
