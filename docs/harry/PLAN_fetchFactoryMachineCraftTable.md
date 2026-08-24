# PLAN — 抓取最新 TableCfg 資料表的可重用 script

**狀態：** 已完成（含追加的 FactoryBuildingTable.json）
**範疇：** 純 Node.js 腳本 + 產出資料檔，不動 Vue/store/元件，不屬 L1/L2/L3 三層架構

## 1. 目標

寫一支**可重複執行**的 Node script，做三件事：

1. 打 `https://data.akedata.wiki/manifest.json`，取得目前最新版本的 `tableCfgPath`
2. 用該 path 組 URL：`https://data.akedata.wiki/<tableCfgPath>/<TableName>.json`，下載該 JSON
3. 存到 `docs/harry/dev/data/<TableName>.json`（資料夾不存在就建立）

**追加（同一輪內）：** 除了 `FactoryMachineCraftTable.json`，同一支 script 也下載 `FactoryBuildingTable.json`、`I18nTextTable_CN.json`。兩次使用者提的路徑都寫成「`../<TableName>`」（意指 tableCfgPath 的上一層），但實測 `public/<ver>/<hotfix>/<TableName>.json`（不含 `TableCfg`）皆回應 404；實際存在且回應 200 的都是跟 `FactoryMachineCraftTable.json` 同一層的 `public/<ver>/<hotfix>/TableCfg/<TableName>.json`。已按此實測結果實作，並非照字面路徑。

**追加二（同一輪內）：** `I18nTextTable_CN.json` 全表 140,783 筆、11MB，但 `FactoryMachineCraftTable.json`/`FactoryBuildingTable.json` 實際只引用其中約 528 個 id（526 筆有對應翻譯）。改為只落地被引用到的子集，檔案從 ~11MB 降到 ~23KB。

實作重點：
- 引用關係藏在兩表各筆資料裡形如 `"desc": {"id": 1234567890123456789, "text": ""}` 的欄位，`id` 是 int64
- **關鍵坑**：這些 id 超過 `Number.MAX_SAFE_INTEGER`（2^53），若照原本流程先 `JSON.parse` 整份回應再讀欄位，JS number 會直接失真（尾數捨去成 0），之後永遠比對不到 `I18nTextTable_CN.json` 的原始 key（本輪一開始已提交的 `docs/harry/dev/data/*.json` 就是這樣壞掉的，因為 `JSON.stringify(data, null, 2)` 落地時已經回不去了）
- 修法：抽取 id 時改用 `fetch` 回應的**原始未解析文字**跑 regex `"id":\s*(-?\d+)`，維持原始位數字串；`I18nTextTable_CN.json` 的 key 本身是字串（物件 key 不受 JSON number 精度影響），照常 `JSON.parse` 後用字串比對即可
- `SOURCE_TABLE_NAMES`（完整落地）與 `I18N_TABLE_NAME`（篩選後落地）分開處理，篩選邏輯集中在 `main()` 內一段，不額外拆檔案避免過度抽象

## 2. manifest.json 結構確認（已用 curl 實測）

```json
{
  "schemaVersion": 1,
  "latest": "1.4.4@9433094-12",
  "versions": [
    {
      "id": "1.4.4@9433094-12",
      "gameVersion": "1.4.4",
      "hotfixVersion": "9433094-12",
      "tableCfgPath": "public/1.4.4/9433094-12/TableCfg",
      "publishedAt": "2026-08-16T07:04:11.991594+08:00"
    },
    ...
  ]
}
```

**「最新」的定義**：`manifest.latest` 就是最新版本的 `id`（實測目前值 `1.4.4@9433094-12`），在 `versions` 陣列裡找 `id === latest` 的那筆，取其 `tableCfgPath`。不用自己比對 `publishedAt` 排序（陣列本身也不是嚴格按時間排序——`1.3.3@...` 那筆 `publishedAt` 比 `1.4.4@8764515-7` 還晚，是 hotfix 補丁時間，不是版本新舊）。

下載 URL 實測回應 200：
```
https://data.akedata.wiki/public/1.4.4/9433094-12/TableCfg/FactoryMachineCraftTable.json
```

## 3. 既有慣例參考

`docs/aaaaa/scripts/sync-data-from-v1.mjs` 是本 repo 既有的 data sync script 慣例：純 `.mjs`、`node:fs`/`node:path`/`node:url`、中文註解、`--dry-run` flag、印出 `[tag] 訊息` 格式的 log、JSON.parse 驗證下載/複製結果、失敗時 `process.exit(1)`。新腳本沿用這個風格，但用 `fetch`（Node 18+ 內建）取代 `copyFileSync`。

## 4. 檔案規劃

- 新增 `docs/harry/scripts/fetch-factory-machine-craft-table.mjs`
- 新增（執行後自動產生）`docs/harry/dev/data/FactoryMachineCraftTable.json`、`docs/harry/dev/data/FactoryBuildingTable.json`、`docs/harry/dev/data/I18nTextTable_CN.json`
- 下載清單集中在腳本內 `TABLE_NAMES` 常數陣列，之後要再加表只需加一行檔名
- 不改 `package.json`，直接用 `node docs/harry/scripts/fetch-factory-machine-craft-table.mjs` 執行（使用者決定）

## 5. Script 邏輯

```
main()
  1. GET https://data.akedata.wiki/manifest.json → JSON.parse
     失敗（網路錯誤 / 非 200 / JSON.parse 失敗）→ console.error + exit(1)
  2. 用 manifest.latest 在 manifest.versions 找對應項目
     找不到 → console.error + exit(1)
  3. 組 URL：https://data.akedata.wiki/${tableCfgPath}/FactoryMachineCraftTable.json
  4. GET 該 URL → 檢查 status 200 → JSON.parse 驗證格式
     失敗 → console.error + exit(1)
  5. 確保 docs/harry/dev/data/ 存在（mkdirSync recursive）
  6. writeFileSync 寫入 FactoryMachineCraftTable.json（JSON.stringify pretty-print，2 空格縮排，跟原始檔一致或方便 git diff 可讀）
  7. console.log 印出來源版本 id、tableCfgPath、輸出路徑、檔案大小
```

`--dry-run` flag：跑到第 4 步驗證完就印訊息結束，不寫檔（沿用既有慣例）。

## 6. 明確排除範圍

- 不下載 manifest 列出的其他 TableCfg 檔案（只抓 `FactoryMachineCraftTable.json`）
- 不處理歷史版本下載（只抓 `latest`）
- 不做資料語意轉換/型別產生（純原樣落地 JSON，比照 `sync-data-from-v1.mjs` 「不做語意轉換」的原則）
- 不整合進 CI 或 pre-commit，純手動執行的一次性/重跑工具
- 不改動 `docs/harry` 既有其他檔案

## 7. 驗證方式

- 手動執行 `pnpm fetch:harry-craft-table`，確認 console 輸出版本資訊、`docs/harry/dev/data/FactoryMachineCraftTable.json` 產生且可 JSON.parse
- 重跑一次確認 idempotent（覆寫不報錯）
- `pnpm lint-check` / `pnpm format-check`（script 本身若被 eslint/prettier 掃到 `docs/` 目錄的話一併確認；若專案設定只掃 `src/` 則此步驟可能不適用，屆時視 lint 設定範圍而定）

## 8. 使用者已確認決策

1. 輸出格式：`JSON.stringify(data, null, 2)` pretty-print 落地
2. 不加 `package.json` script，直接 `node docs/harry/scripts/fetch-factory-machine-craft-table.mjs` 執行
