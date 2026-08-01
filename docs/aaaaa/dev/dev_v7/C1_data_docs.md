# V7-C1 — 重建 data/ 與定義說明

**對應工項：** V7-C1  
**狀態：** 完成（2026-08-01）  
**依賴：** V7-B1  
**定案：** 說明檔隨 JSON 複製；README 文首由腳本注入 playground 註記

---

## 1. 作法

| 項目 | 作法 |
|------|------|
| JSON / 各檔 md | `pnpm sync:aaaaa-data` 自 data_1 原樣複製 |
| playground 註記 | 範本 `docs/aaaaa/scripts/playground-data-readme-banner.md`；同步結束後注入 `data/README.md` 文首 |
| 重跑安全 | 標記 `<!-- PLAYGROUND_NOTES -->`；再次同步先複製乾淨 README 再注入，不堆疊 |

---

## 2. 驗證標準

- [x] data/ 可瀏覽；內部 md 連結有效
- [x] README 含腳本重跑指令與氣態／媒質索引
- [x] 再跑一次 sync 後註記仍在、不重複

---

## 3. 開發日誌

### 2026-08-01

- 新增 banner 範本；sync 腳本於複製後呼叫 `applyReadmeBanner()`
- 實跑確認 `docs/aaaaa/data/README.md` 文首註記正確
