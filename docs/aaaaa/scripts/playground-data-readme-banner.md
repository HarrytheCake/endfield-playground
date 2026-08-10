<!-- PLAYGROUND_NOTES -->

> **Endfield Playground 工作副本註記（CR-04 / aaaaa）**
>
> | 項目 | 說明 |
> |------|------|
> | 本目錄角色 | playground 匯入與文件對齊用的 **工作副本**（schema v3） |
> | 上游來源 | [`../data_1/`](../data_1/)（權威匯入包；勿在 `data/` 手改 JSON） |
> | 舊版封存 | [`../data_0/`](../data_0/)（遷移前結構，對齊舊 `src/data`） |
> | 重跑同步 | 倉庫根目錄執行 `pnpm sync:aaaaa-data`（腳本：`../scripts/sync-data-from-v1.mjs`） |
> | 執行期資料 | TypeScript 在 `src/data/`（V7 對齊中）；本目錄 JSON 為產生／對照來源 |
>
> **氣態／媒質索引（v3）**
>
> - 埠 `media`：`belt`（輸送帶／固體）｜`pipe`（管線／液體與氣體）— 見 [machines.md](./machines.md)
> - 機器多型態：`modes[]`；氣體相關如 `gas_mode`、`gas_liquid_mode`
> - 氣態產品／材料：見 [products.json](./products.json)、[materials.json](./materials.json)（如息壤氣、氣態赤銅等）
> - 環境標籤：[environments.json](./environments.json)／[environments.md](./environments.md)
> - 配方綁定：`machine_mode`、`environment` — 見 [products.md](./products.md)
> - 運轉損耗 `loss`：資料已含；playground FlowEngine **暫不計算**（V7 定案）
>
> 以下為上游 ZMD 格式說明原文。

---

