# V7-B1 — 轉換腳本（data_1 → data）

**對應工項：** V7-B1  
**狀態：** 完成（2026-08-01）  
**定案：** [A2_mapping_decision.md](./A2_mapping_decision.md) — 原樣複製；Node @ `docs/aaaaa/scripts/`

---

## 1. 背景與動機

以可重跑腳本自 `data_1` 產生 `docs/aaaaa/data/`，避免手拷漂移。

---

## 2. 凍結規格

```text
docs/aaaaa/data_1/*.json  ──copy──►  docs/aaaaa/data/*.json
docs/aaaaa/data_1/*.md    ──copy──►  docs/aaaaa/data/*.md
docs/aaaaa/data_1/README.md ────────► docs/aaaaa/data/README.md
```

- **不做**語意改寫（不轉 item/liquid、不攤平 modes）
- 若 `data/` 不存在則建立；存在則覆寫清單內檔案
- 複製後對每個 `.json` 做 `JSON.parse`；失敗非 0 結束
- 支援 `--dry-run`：只列印將寫入路徑

### CLI

```bash
node docs/aaaaa/scripts/sync-data-from-v1.mjs
node docs/aaaaa/scripts/sync-data-from-v1.mjs --dry-run
```

可選：`package.json` 加 `"sync:aaaaa-data": "node docs/aaaaa/scripts/sync-data-from-v1.mjs"`

### 檔案清單

`materials`、`machines`、`machine_tags`、`products`、`environments`、`plans`、`layouts`、`blueprints` + 對應 `.md` + `README.md`

---

## 3. 檔案修改計畫

| 檔案 | 動作 |
|------|------|
| `docs/aaaaa/scripts/sync-data-from-v1.mjs` | 新建 |
| `docs/aaaaa/data/**` | 腳本輸出 |
| `package.json` | 可選短指令 |

---

## 4. 驗證標準

- [x] dry-run 列出完整目標路徑
- [x] 實跑後 `data/` 與 `data_1/` 對應檔內容一致（SHA256）
- [x] 全部 JSON 可 parse

---

## 5. 開發日誌

### 2026-08-01

- 新增 `docs/aaaaa/scripts/sync-data-from-v1.mjs`
- `package.json` 新增 `pnpm sync:aaaaa-data`
- 實跑建立 `docs/aaaaa/data/`（17 檔），hash 與 data_1 一致
